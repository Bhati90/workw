-- ============================================
-- BOOKING SYSTEM TABLES
-- ============================================

-- 1. Bookings table (main booking flow)
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  call_date TIMESTAMP DEFAULT NOW(),
  call_notes TEXT,
  activity_type_id UUID NOT NULL REFERENCES activity_types(id) ON DELETE RESTRICT,
  requested_date DATE NOT NULL,
  area_acres DECIMAL(10, 2) NOT NULL,
  quoted_price DECIMAL(10, 2),
  advance_amount DECIMAL(10, 2) DEFAULT 0,
  advance_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'allocated', 'in_progress', 'completed', 'invoiced', 'reviewed', 'cancelled')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Job assignments
CREATE TABLE IF NOT EXISTS job_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  coordinator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  labour_team_id UUID REFERENCES labour_teams(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'finding_labor' CHECK (status IN ('finding_labor', 'allocated', 'in_progress', 'completed')),
  estimated_start TIMESTAMP,
  actual_start TIMESTAMP,
  actual_end TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Payment records
CREATE TABLE IF NOT EXISTS payment_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_assignment_id UUID NOT NULL REFERENCES job_assignments(id) ON DELETE CASCADE,
  advance_amount DECIMAL(10, 2) DEFAULT 0,
  advance_date DATE,
  balance_amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('cash', 'upi', 'cheque', 'bank_transfer')),
  payment_date DATE,
  proof_image_url TEXT,
  labor_cost DECIMAL(10, 2),
  transport_cost DECIMAL(10, 2),
  accommodation_cost DECIMAL(10, 2),
  other_cost DECIMAL(10, 2),
  notes TEXT,
  collected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Farmer reviews
CREATE TABLE IF NOT EXISTS farmer_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  job_assignment_id UUID NOT NULL REFERENCES job_assignments(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  review_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. User roles
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('founder', 'operations_head', 'coordinator', 'ground_team', 'accounts')),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- 6. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('booking', 'assignment', 'completion', 'payment', 'review')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_bookings_farmer_id ON bookings(farmer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_requested_date ON bookings(requested_date);
CREATE INDEX IF NOT EXISTS idx_bookings_assigned_to ON bookings(assigned_to);

CREATE INDEX IF NOT EXISTS idx_job_assignments_booking_id ON job_assignments(booking_id);
CREATE INDEX IF NOT EXISTS idx_job_assignments_coordinator_id ON job_assignments(coordinator_id);
CREATE INDEX IF NOT EXISTS idx_job_assignments_labour_team_id ON job_assignments(labour_team_id);
CREATE INDEX IF NOT EXISTS idx_job_assignments_status ON job_assignments(status);

CREATE INDEX IF NOT EXISTS idx_payment_records_job_assignment_id ON payment_records(job_assignment_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_collected_by ON payment_records(collected_by);

CREATE INDEX IF NOT EXISTS idx_farmer_reviews_farmer_id ON farmer_reviews(farmer_id);
CREATE INDEX IF NOT EXISTS idx_farmer_reviews_job_assignment_id ON farmer_reviews(job_assignment_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);

-- ============================================
-- VIEWS FOR EASIER QUERYING
-- ============================================

-- View: Bookings with all related details
CREATE OR REPLACE VIEW bookings_with_details AS
SELECT 
  b.id,
  b.farmer_id,
  b.call_date,
  b.call_notes,
  b.activity_type_id,
  b.requested_date,
  b.area_acres,
  b.quoted_price,
  b.advance_amount,
  b.advance_date,
  b.status,
  b.assigned_to,
  b.created_at,
  b.updated_at,
  -- Farmer details
  f.name as farmer_name,
  f.color as farmer_color,
  f.contact as farmer_contact,
  f.village as farmer_village,
  -- Activity details
  at.name as activity_name,
  at.description as activity_description,
  at.days_after_pruning,
  -- Job assignment details
  ja.id as job_assignment_id,
  ja.coordinator_id,
  ja.labour_team_id,
  ja.status as job_status,
  ja.actual_start,
  ja.actual_end,
  -- Labour team details
  lt.mukkadam_name,
  lt.number_of_labourers,
  lt.contact as mukkadam_contact,
  -- Coordinator details
  u.email as assigned_to_email
FROM bookings b
LEFT JOIN farmers f ON b.farmer_id = f.id
LEFT JOIN activity_types at ON b.activity_type_id = at.id
LEFT JOIN job_assignments ja ON ja.booking_id = b.id
LEFT JOIN labour_teams lt ON ja.labour_team_id = lt.id
LEFT JOIN auth.users u ON b.assigned_to = u.id;

-- View: Job assignments with payment info
CREATE OR REPLACE VIEW jobs_with_payment AS
SELECT 
  ja.*,
  b.farmer_id,
  b.requested_date,
  b.area_acres,
  b.quoted_price,
  f.name as farmer_name,
  at.name as activity_name,
  lt.mukkadam_name,
  pr.balance_amount,
  pr.payment_method,
  pr.payment_date,
  pr.verified_at,
  (pr.labor_cost + COALESCE(pr.transport_cost, 0) + COALESCE(pr.accommodation_cost, 0) + COALESCE(pr.other_cost, 0)) as total_cost
FROM job_assignments ja
LEFT JOIN bookings b ON ja.booking_id = b.id
LEFT JOIN farmers f ON b.farmer_id = f.id
LEFT JOIN activity_types at ON b.activity_type_id = at.id
LEFT JOIN labour_teams lt ON ja.labour_team_id = lt.id
LEFT JOIN payment_records pr ON pr.job_assignment_id = ja.id;

-- View: Farmer history summary
CREATE OR REPLACE VIEW farmer_history AS
SELECT 
  f.id as farmer_id,
  f.name as farmer_name,
  f.village,
  f.contact,
  COUNT(DISTINCT b.id) as total_bookings,
  COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END) as completed_jobs,
  SUM(CASE WHEN b.status = 'completed' THEN b.quoted_price ELSE 0 END) as total_revenue,
  AVG(CASE WHEN fr.rating IS NOT NULL THEN fr.rating END) as average_rating,
  COUNT(DISTINCT fr.id) as total_reviews,
  MAX(b.requested_date) as last_booking_date,
  MIN(b.created_at) as customer_since
FROM farmers f
LEFT JOIN bookings b ON f.id = b.farmer_id
LEFT JOIN job_assignments ja ON ja.booking_id = b.id
LEFT JOIN farmer_reviews fr ON fr.farmer_id = f.id
GROUP BY f.id, f.name, f.village, f.contact;

-- ============================================
-- TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_assignments_updated_at BEFORE UPDATE ON job_assignments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all new tables
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmer_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read all bookings
CREATE POLICY "Allow authenticated users to read bookings" ON bookings
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to insert bookings
CREATE POLICY "Allow authenticated users to insert bookings" ON bookings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to update bookings
CREATE POLICY "Allow authenticated users to update bookings" ON bookings
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Similar policies for other tables
CREATE POLICY "Allow authenticated users to read job_assignments" ON job_assignments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert job_assignments" ON job_assignments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update job_assignments" ON job_assignments
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read payment_records" ON payment_records
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert payment_records" ON payment_records
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read farmer_reviews" ON farmer_reviews
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert farmer_reviews" ON farmer_reviews
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read user_roles" ON user_roles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Notifications: Users can only see their own
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow system to insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;