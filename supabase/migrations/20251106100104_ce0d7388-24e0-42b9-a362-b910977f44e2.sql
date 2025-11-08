-- Create labour_teams table
CREATE TABLE public.labour_teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  number_of_labourers INTEGER NOT NULL,
  mukkadam_name TEXT NOT NULL,
  contact TEXT,
  location TEXT,
  transport_situation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create team_activity_rates table (stores rate for each activity type per team)
CREATE TABLE public.team_activity_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  labour_team_id UUID REFERENCES public.labour_teams(id) ON DELETE CASCADE NOT NULL,
  activity_type_id UUID REFERENCES public.activity_types(id) ON DELETE CASCADE NOT NULL,
  rate NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(labour_team_id, activity_type_id)
);

-- Create team_availability table (tracks when teams are available)
CREATE TABLE public.team_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  labour_team_id UUID REFERENCES public.labour_teams(id) ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create activity_allocations table (tracks scheduled activities and team assignments)
CREATE TABLE public.activity_allocations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plot_id UUID REFERENCES public.plots(id) ON DELETE CASCADE NOT NULL,
  activity_type_id UUID REFERENCES public.activity_types(id) ON DELETE CASCADE NOT NULL,
  scheduled_date DATE NOT NULL,
  labour_team_id UUID REFERENCES public.labour_teams(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.labour_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_activity_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_allocations ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed)
CREATE POLICY "Allow all access to labour_teams" ON public.labour_teams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to team_activity_rates" ON public.team_activity_rates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to team_availability" ON public.team_availability FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to activity_allocations" ON public.activity_allocations FOR ALL USING (true) WITH CHECK (true);

-- Add triggers for updated_at
CREATE TRIGGER update_labour_teams_updated_at
  BEFORE UPDATE ON public.labour_teams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_activity_allocations_updated_at
  BEFORE UPDATE ON public.activity_allocations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create a view for allocated activities with team info
CREATE OR REPLACE VIEW public.allocated_activities AS
SELECT 
  aa.id,
  aa.plot_id,
  aa.activity_type_id,
  aa.scheduled_date,
  aa.labour_team_id,
  aa.status,
  aa.notes,
  at.name as activity_name,
  at.description,
  f.name as farmer_name,
  f.color as farmer_color,
  p.acres,
  p.variety,
  lt.mukkadam_name,
  lt.number_of_labourers,
  tar.rate
FROM public.activity_allocations aa
JOIN public.activity_types at ON aa.activity_type_id = at.id
JOIN public.plots p ON aa.plot_id = p.id
JOIN public.farmers f ON p.farmer_id = f.id
LEFT JOIN public.labour_teams lt ON aa.labour_team_id = lt.id
LEFT JOIN public.team_activity_rates tar ON tar.labour_team_id = lt.id AND tar.activity_type_id = at.id;