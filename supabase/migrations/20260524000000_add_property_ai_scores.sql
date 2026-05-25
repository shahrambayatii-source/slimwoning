alter table properties
  add column if not exists data_quality_score numeric,
  add column if not exists location_score numeric,
  add column if not exists energy_score numeric,
  add column if not exists comfort_score numeric,
  add column if not exists market_score numeric,
  add column if not exists ai_rank_score numeric,
  add column if not exists ai_score_updated_at timestamptz;
