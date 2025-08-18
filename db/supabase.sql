-- Supabase schema: users, settings, plans, usage

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password text not null,
  first_name text,
  plan text default 'Free',
  is_active boolean default true,
  created_at timestamptz default now(),
  stripe_customer_id text,
  subscription_id text,
  subscription_status text
);

create index if not exists users_email_idx on users(email);

create table if not exists settings (
  id int primary key default 1,
  site_name text default 'AI Doctor',
  site_description text default 'Your Personal AI Health Assistant',
  contact_email text,
  support_email text,
  logo_url text,
  stripe_secret_key text,
  stripe_publishable_key text,
  stripe_webhook_secret text,
  stripe_price_ids jsonb -- { basic: { monthly, yearly }, premium: { monthly, yearly } }
);

insert into settings (id)
  values (1)
  on conflict (id) do nothing;

create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  features text[],
  monthly_price numeric not null default 0,
  yearly_price numeric not null default 0,
  is_active boolean default true,
  stripe_product_id text,
  stripe_price_ids jsonb -- { monthly, yearly }
);

create index if not exists plans_active_idx on plans(is_active);

create table if not exists usage_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  user_email text not null,
  date date not null,
  interactions int not null default 0,
  prompts int not null default 0
);

create index if not exists usage_user_date_idx on usage_records(user_email, date);


