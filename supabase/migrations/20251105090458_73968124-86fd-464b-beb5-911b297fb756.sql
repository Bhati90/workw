-- Create farmers table
CREATE TABLE public.farmers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create plots table
CREATE TABLE public.plots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id UUID NOT NULL REFERENCES public.farmers(id) ON DELETE CASCADE,
  acres DECIMAL(10, 2) NOT NULL,
  pruning_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create activity types table (predefined labor calendar operations)
CREATE TABLE public.activity_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  days_after_pruning INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default activity types
INSERT INTO public.activity_types (name, days_after_pruning, description) VALUES
  ('Pruning & Pasting', 0, 'Initial pruning and pasting operation'),
  ('Fail Removal', 12, 'Remove failed plants'),
  ('Shoot tying', 24, 'Tie shoots for proper growth'),
  ('Bunch selection- final number +10', 55, 'Select bunches with 10 extra'),
  ('Bunch thinning (60 berries)', 55, 'Thin bunches to 60 berries'),
  ('Bunch trimming', 60, 'Trim bunches'),
  ('Bunch selection- final number', 65, 'Final bunch selection'),
  ('Berry variation', 90, 'Berry variation check'),
  ('Paper wrapping', 105, 'Wrap bunches in paper'),
  ('Harvesting', 140, 'Final harvest');

-- Enable Row Level Security
ALTER TABLE public.farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_types ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is a management dashboard)
CREATE POLICY "Allow all access to farmers" ON public.farmers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to plots" ON public.plots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to activity_types" ON public.activity_types FOR SELECT USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_farmers_updated_at
  BEFORE UPDATE ON public.farmers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_plots_updated_at
  BEFORE UPDATE ON public.plots
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create view for calculated activities
CREATE OR REPLACE VIEW public.scheduled_activities AS
SELECT 
  p.id AS plot_id,
  p.farmer_id,
  f.name AS farmer_name,
  p.acres,
  p.pruning_date,
  at.id AS activity_type_id,
  at.name AS activity_name,
  at.days_after_pruning,
  at.description,
  (p.pruning_date + at.days_after_pruning * INTERVAL '1 day')::date AS scheduled_date
FROM public.plots p
JOIN public.farmers f ON f.id = p.farmer_id
CROSS JOIN public.activity_types at
ORDER BY scheduled_date, farmer_name, activity_name;