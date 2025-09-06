-- Supabase schema: users, settings, plans, usage

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password text not null,
  first_name text,
  plan text default 'Free',
  is_active boolean default true,
  is_admin boolean default false,
  created_at timestamptz default now(),
  stripe_customer_id text,
  subscription_id text,
  subscription_status text
);

create index if not exists users_email_idx on users(email);

create table if not exists settings (
  id int primary key default 1,
  site_name text default 'Health Consultant AI',
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
  is_popular boolean default false,
  interactions_limit integer,
  stripe_product_id text,
  stripe_price_ids jsonb, -- { monthly, yearly }
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists plans_active_idx on plans(is_active);
create index if not exists plans_popular_idx on plans(is_popular);
create index if not exists plans_interactions_limit_idx on plans(interactions_limit);

create table if not exists usage_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  user_email text not null,
  date date not null,
  interactions int not null default 0,
  prompts int not null default 0
);

create index if not exists usage_user_date_idx on usage_records(user_email, date);

-- User interactions table for tracking plan limits
create table if not exists user_interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  plan_id uuid not null references plans(id) on delete cascade,
  interaction_type text not null,
  month text not null, -- YYYY-MM format for easy querying
  created_at timestamptz default now()
);

create index if not exists idx_user_interactions_user_id on user_interactions(user_id);
create index if not exists idx_user_interactions_plan_id on user_interactions(plan_id);
create index if not exists idx_user_interactions_month on user_interactions(month);
create index if not exists idx_user_interactions_user_plan_month on user_interactions(user_id, plan_id, month);


-- FAQs table for landing page Frequently Asked Questions
create table if not exists faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  order_index integer not null default 0,
  is_active boolean not null default true,
  updated_at timestamptz
);

create index if not exists idx_faqs_order on faqs(order_index);
create index if not exists idx_faqs_active on faqs(is_active);

-- Landing page: hero section content
create table if not exists landing_hero (
  id int primary key default 1,
  title text not null,
  subtitle text,
  images text[] not null,
  updated_at timestamptz
);

insert into landing_hero (id, title, subtitle, images)
values (
  1,
  'Your Personal AI Health Assistant',
  'Get instant, reliable answers to your medical questions. Health Consultant AI understands both text and images to provide you with the best possible assistance.',
  array['/images/aidoc1.png','/images/aidoc2.png','/images/aidoc3.png','/images/aidoc4.png']
)
on conflict (id) do nothing;

-- Landing page: chatbot (demo) section content
create table if not exists landing_chatbot (
  id int primary key default 1,
  title text not null,
  subtitle text,
  updated_at timestamptz
);

insert into landing_chatbot (id, title, subtitle)
values (
  1,
  'Try Health Consultant AI Now',
  'Ask a question below to test the chatbot''s capabilities. No registration required.'
)
on conflict (id) do nothing;

-- Landing page: key features section
create table if not exists landing_features_section (
  id int primary key default 1,
  title text not null,
  subtitle text,
  updated_at timestamptz
);

insert into landing_features_section (id, title, subtitle)
values (
  1,
  'Your Personal Health Companion',
  'Providing intelligent, secure, and accessible health information right at your fingertips.'
)
on conflict (id) do nothing;

create table if not exists landing_features_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  icon text, -- e.g., 'message' | 'image' | 'shield'
  order_index int not null default 0,
  is_active boolean not null default true,
  updated_at timestamptz
);

create index if not exists idx_features_items_order on landing_features_items(order_index);
create index if not exists idx_features_items_active on landing_features_items(is_active);

-- Seed default 3 items if table empty
insert into landing_features_items (title, description, icon, order_index, is_active)
select * from (
  values
    ('Natural Language Understanding', 'Ask questions in plain English and get easy-to-understand answers from our advanced AI.', 'message', 1, true),
    ('Image Analysis', 'Upload images of symptoms, and our AI will provide relevant, helpful information.', 'image', 2, true),
    ('Secure & Anonymous', 'Your conversations are private. We are HIPAA-compliant and never store personal health information.', 'shield', 3, true)
) as v(title, description, icon, order_index, is_active)
where not exists (select 1 from landing_features_items);

-- Landing page: showcase images section
create table if not exists landing_showcase (
  id uuid primary key default gen_random_uuid(),
  image1 text,
  image2 text,
  image3 text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_landing_showcase_id on landing_showcase(id);

-- Create trigger to update updated_at timestamp
create or replace function update_landing_showcase_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_landing_showcase_updated_at
  before update on landing_showcase
  for each row
  execute function update_landing_showcase_updated_at();

-- Insert default record if table is empty
insert into landing_showcase (image1, image2, image3)
select '', '', ''
where not exists (select 1 from landing_showcase limit 1);

