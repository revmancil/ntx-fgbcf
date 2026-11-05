-- One-time seed: mark the 3 churches the old static home page hardcoded
-- as featured, now that churches.featured exists. Matches by name rather
-- than id/UUID since that's simpler to eyeball and verify in the SQL
-- editor. Safe to run more than once.
update public.churches set featured = true
where name in ('Jubilee Community Church', 'Higher Mark FGBC', 'Greater Mt. Tabor Christian Center');
