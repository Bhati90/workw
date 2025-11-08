-- Add village field to farmers table
ALTER TABLE public.farmers ADD COLUMN village text;

-- Add variety field to plots table
ALTER TABLE public.plots ADD COLUMN variety text;

-- Add color field to farmers table for calendar color coding
ALTER TABLE public.farmers ADD COLUMN color text DEFAULT '#10b981';

-- Create plot_activities table to track which activities are enabled for each plot
CREATE TABLE public.plot_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plot_id uuid NOT NULL REFERENCES public.plots(id) ON DELETE CASCADE,
  activity_type_id uuid NOT NULL REFERENCES public.activity_types(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(plot_id, activity_type_id)
);

-- Enable RLS on plot_activities
ALTER TABLE public.plot_activities ENABLE ROW LEVEL SECURITY;

-- Create policy for plot_activities
CREATE POLICY "Allow all access to plot_activities" 
ON public.plot_activities 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Update the scheduled_activities view to only show activities that are enabled for each plot
DROP VIEW IF EXISTS public.scheduled_activities;

CREATE VIEW public.scheduled_activities AS
SELECT 
  p.id as plot_id,
  f.id as farmer_id,
  f.name as farmer_name,
  f.color as farmer_color,
  p.acres,
  p.variety,
  p.pruning_date,
  at.id as activity_type_id,
  at.name as activity_name,
  at.description,
  at.days_after_pruning,
  (p.pruning_date + (at.days_after_pruning || ' days')::interval)::date as scheduled_date
FROM 
  public.plots p
  JOIN public.farmers f ON p.farmer_id = f.id
  JOIN public.plot_activities pa ON pa.plot_id = p.id
  JOIN public.activity_types at ON pa.activity_type_id = at.id
ORDER BY 
  scheduled_date, farmer_name;