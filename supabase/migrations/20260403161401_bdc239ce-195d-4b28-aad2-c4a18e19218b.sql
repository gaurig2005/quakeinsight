
CREATE TABLE public.alert_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT,
  whatsapp_number TEXT,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('email', 'whatsapp', 'both')),
  state TEXT NOT NULL DEFAULT 'All India',
  min_magnitude NUMERIC NOT NULL DEFAULT 4,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.alert_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe to alerts"
ON public.alert_subscriptions
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Subscriptions are publicly readable"
ON public.alert_subscriptions
FOR SELECT
TO public
USING (true);
