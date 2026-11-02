CREATE TABLE public.user_access (
  user_id uuid PRIMARY KEY,
  free_videos_used integer NOT NULL DEFAULT 0,
  plan text,
  subscription_status text,
  stripe_customer_id text,
  stripe_subscription_id text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_access TO authenticated;
GRANT ALL ON public.user_access TO service_role;
ALTER TABLE public.user_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own access" ON public.user_access FOR SELECT TO authenticated USING (auth.uid() = user_id);