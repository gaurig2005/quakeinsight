
-- Create earthquakes table for India-only data (last 50 years)
CREATE TABLE public.earthquakes (
  id TEXT PRIMARY KEY,
  magnitude NUMERIC(3,1) NOT NULL,
  location TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  depth NUMERIC(6,1) NOT NULL DEFAULT 0,
  latitude NUMERIC(8,4) NOT NULL,
  longitude NUMERIC(8,4) NOT NULL,
  state TEXT NOT NULL DEFAULT 'India',
  region TEXT NOT NULL DEFAULT 'India',
  is_historical BOOLEAN NOT NULL DEFAULT false,
  source TEXT NOT NULL DEFAULT 'USGS',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for common queries
CREATE INDEX idx_earthquakes_occurred_at ON public.earthquakes (occurred_at DESC);
CREATE INDEX idx_earthquakes_magnitude ON public.earthquakes (magnitude DESC);
CREATE INDEX idx_earthquakes_state ON public.earthquakes (state);
CREATE INDEX idx_earthquakes_region ON public.earthquakes (region);

-- Enable RLS but allow public read access (earthquake data is public)
ALTER TABLE public.earthquakes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Earthquake data is publicly readable"
  ON public.earthquakes FOR SELECT
  USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.earthquakes;
