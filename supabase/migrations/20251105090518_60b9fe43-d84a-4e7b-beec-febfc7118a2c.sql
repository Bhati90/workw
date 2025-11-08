-- Recreate the view without security definer
DROP VIEW IF EXISTS public.scheduled_activities;

CREATE VIEW public.scheduled_activities AS
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