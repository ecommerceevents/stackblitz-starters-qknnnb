-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Vendors table
create table vendors (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  url text not null unique,
  last_scraped timestamp with time zone default now(),
  product_count integer default 0,
  active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Products table
create table products (
  id uuid primary key default uuid_generate_v4(),
  vendor_id uuid references vendors(id) on delete cascade,
  title text not null,
  price text not null,
  description text,
  image text,
  url text not null unique,
  sku text not null,
  in_stock boolean default true,
  last_checked timestamp with time zone default now(),
  hash text not null,
  shopify_id text,
  shopify_synced boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Product changes table
create table product_changes (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete cascade,
  field text not null,
  old_value text,
  new_value text,
  detected_at timestamp with time zone default now(),
  job_id uuid,
  synced_to_shopify boolean default false,
  created_at timestamp with time zone default now()
);

-- Scraping jobs table
create table scraping_jobs (
  id uuid primary key default uuid_generate_v4(),
  vendor_id uuid references vendors(id) on delete cascade,
  status text not null check (status in ('pending', 'processing', 'completed', 'failed')),
  started_at timestamp with time zone default now(),
  completed_at timestamp with time zone,
  total_products integer default 0,
  processed_products integer default 0,
  changes integer default 0,
  error text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Shopify settings table
create table shopify_settings (
  id uuid primary key default uuid_generate_v4(),
  shop_name text not null unique,
  access_token text not null,
  api_version text not null default '2023-07',
  webhook_secret text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create updated_at triggers
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger vendors_updated_at
  before update on vendors
  for each row
  execute function update_updated_at();

create trigger products_updated_at
  before update on products
  for each row
  execute function update_updated_at();

create trigger scraping_jobs_updated_at
  before update on scraping_jobs
  for each row
  execute function update_updated_at();

create trigger shopify_settings_updated_at
  before update on shopify_settings
  for each row
  execute function update_updated_at();