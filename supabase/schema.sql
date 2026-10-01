-- =====================================================
-- Voltex Store — Supabase schema (run in SQL Editor)
-- =====================================================

-- ---------- Admins ----------
create table admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz default now()
);

create or replace function is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

-- ---------- Settings (key/value, editable from dashboard) ----------
create table settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

-- ---------- Categories ----------
create table categories (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text,
  slug text unique not null,
  image_url text,
  sort_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ---------- Products ----------
create table products (
  id uuid primary key default gen_random_uuid(),
  sku text unique not null,
  name_ar text not null,
  name_en text,
  description_ar text,
  description_en text,
  category_id uuid references categories(id) on delete set null,
  price numeric(10,2) not null check (price >= 0),
  old_price numeric(10,2),            -- السعر القديم
  sale_price numeric(10,2),           -- سعر التخفيض (إن وجد يُستخدم بدل price)
  stock int,                          -- null = بدون تتبع مخزون
  is_active boolean default true,     -- إخفاء/إظهار
  is_new boolean default false,
  is_bestseller boolean default false,
  is_offer boolean default false,
  is_featured boolean default false,
  is_out_of_stock boolean default false,
  main_image_url text,
  light_type text,                    -- نوع الإضاءة
  light_color text,                   -- لون الإضاءة
  material text,                      -- الخامة
  bulb_count int,
  bulb_base text,                     -- نوع القاعدة
  dimensions text,
  specs jsonb default '{}'::jsonb,    -- مواصفات قابلة للتوسع (فلاتر مستقبلية)
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index on products (category_id);
create index on products (is_active);
create index on products using gin (to_tsvector('simple', coalesce(name_ar,'')||' '||coalesce(name_en,'')||' '||sku));

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url text not null,
  sort_order int default 0
);

-- ---------- Cities / delivery ----------
create table cities (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null unique,
  name_en text,
  delivery_price numeric(10,2) not null default 0,
  is_active boolean default true,
  sort_order int default 0
);

-- ---------- Customers / Orders ----------
create table customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text unique not null,
  created_at timestamptz default now()
);

create sequence order_seq start 1001;

create type order_status as enum
  ('new','contacted','confirmed','preparing','out_for_delivery','delivered','cancelled');

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  customer_id uuid references customers(id),
  customer_name text not null,
  phone text not null,
  city_id uuid references cities(id),
  city_name text not null,
  address text not null,
  subtotal numeric(10,2) not null,
  delivery_fee numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  status order_status not null default 'new',
  payment_method text default 'cod',
  notes text,
  created_at timestamptz default now()
);
create index on orders (created_at desc);
create index on orders (status);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,   -- snapshot
  sku text not null,            -- snapshot
  quantity int not null check (quantity > 0),
  unit_price numeric(10,2) not null,
  subtotal numeric(10,2) not null
);

-- ---------- In-dashboard notifications ----------
create table notifications (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  title text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- =====================================================
-- Create order: prices/SKU/delivery computed on the SERVER.
-- The client only sends product_id + quantity.
-- =====================================================
create or replace function create_order(
  p_name text, p_phone text, p_city_id uuid, p_address text, p_items jsonb
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_city cities%rowtype;
  v_cust uuid;
  v_order uuid;
  v_num text;
  v_sub numeric := 0;
  v_item jsonb;
  v_p products%rowtype;
  v_price numeric;
  v_qty int;
begin
  if coalesce(trim(p_name),'') = '' or coalesce(trim(p_phone),'') = ''
     or coalesce(trim(p_address),'') = '' then
    raise exception 'بيانات ناقصة';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'السلة فارغة';
  end if;

  select * into v_city from cities where id = p_city_id and is_active;
  if not found then raise exception 'مدينة غير صالحة'; end if;

  insert into customers(full_name, phone) values (trim(p_name), trim(p_phone))
  on conflict (phone) do update set full_name = excluded.full_name
  returning id into v_cust;

  v_num := 'ORD-' || nextval('order_seq');
  insert into orders(order_number, customer_id, customer_name, phone, city_id,
                     city_name, address, subtotal, delivery_fee, total)
  values (v_num, v_cust, trim(p_name), trim(p_phone), v_city.id,
          v_city.name_ar, trim(p_address), 0, v_city.delivery_price, 0)
  returning id into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := greatest((v_item->>'quantity')::int, 1);
    select * into v_p from products
      where id = (v_item->>'product_id')::uuid and is_active and not is_out_of_stock;
    if not found then raise exception 'منتج غير متوفر'; end if;
    if v_p.stock is not null and v_p.stock < v_qty then
      raise exception 'الكمية غير متوفرة: %', v_p.name_ar;
    end if;
    v_price := coalesce(v_p.sale_price, v_p.price);
    insert into order_items(order_id, product_id, product_name, sku, quantity, unit_price, subtotal)
    values (v_order, v_p.id, v_p.name_ar, v_p.sku, v_qty, v_price, v_price * v_qty);
    v_sub := v_sub + v_price * v_qty;
    if v_p.stock is not null then
      update products set stock = stock - v_qty where id = v_p.id;
    end if;
  end loop;

  update orders set subtotal = v_sub, total = v_sub + v_city.delivery_price where id = v_order;
  insert into notifications(order_id, title) values (v_order, 'طلب جديد ' || v_num);

  return jsonb_build_object('order_number', v_num, 'total', v_sub + v_city.delivery_price);
end $$;

grant execute on function create_order(text,text,uuid,text,jsonb) to anon, authenticated;

-- =====================================================
-- Row Level Security
-- =====================================================
alter table admins enable row level security;
alter table settings enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table cities enable row level security;
alter table customers enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table notifications enable row level security;

-- Public read (active only)
create policy "public read settings" on settings for select using (true);
create policy "public read categories" on categories for select using (is_active or is_admin());
create policy "public read products" on products for select using (is_active or is_admin());
create policy "public read images" on product_images for select using (true);
create policy "public read cities" on cities for select using (is_active or is_admin());

-- Admin full access
create policy "admin all settings" on settings for all using (is_admin()) with check (is_admin());
create policy "admin all categories" on categories for all using (is_admin()) with check (is_admin());
create policy "admin all products" on products for all using (is_admin()) with check (is_admin());
create policy "admin all images" on product_images for all using (is_admin()) with check (is_admin());
create policy "admin all cities" on cities for all using (is_admin()) with check (is_admin());
create policy "admin all customers" on customers for all using (is_admin()) with check (is_admin());
create policy "admin all orders" on orders for all using (is_admin()) with check (is_admin());
create policy "admin all order_items" on order_items for all using (is_admin()) with check (is_admin());
create policy "admin all notifications" on notifications for all using (is_admin()) with check (is_admin());
create policy "admin read admins" on admins for select using (is_admin());
-- No public policies on customers/orders/order_items: customers can only
-- create orders through create_order().

-- Realtime for instant admin notifications
alter publication supabase_realtime add table orders, notifications;

-- =====================================================
-- Storage (public bucket for images, admin-only writes)
-- =====================================================
insert into storage.buckets (id, name, public) values ('store-images','store-images', true)
on conflict do nothing;
create policy "public read store images" on storage.objects for select
  using (bucket_id = 'store-images');
create policy "admin write store images" on storage.objects for all
  using (bucket_id = 'store-images' and is_admin())
  with check (bucket_id = 'store-images' and is_admin());

-- =====================================================
-- Seed data (all editable/deletable from the dashboard)
-- =====================================================
insert into settings(key, value) values
 ('store_name', '"فولتكس"'),
 ('store_tagline', '"للإضاءة الحديثة"'),
 ('logo_url', 'null'),
 ('whatsapp_number', '"218900000000"'),
 ('contact_phone', '""'),
 ('contact_address', '""'),
 ('currency', '"د.ل"'),
 ('hero', '{"title":"أضئ مساحتك بلمسة فخمة","subtitle":"ثريات وإنارة عصرية وكلاسيكية","image_url":null}'),
 ('whatsapp_api', '{"enabled":false,"provider":null}');

insert into categories(name_ar, slug, sort_order) values
 ('الثريات','chandeliers',1), ('النجف','najaf',2), ('إضاءة السقف','ceiling',3),
 ('إضاءة معلقة','pendant',4), ('إضاءة جدارية','wall',5), ('أباجورات','lamps',6),
 ('LED','led',7), ('سبوت لايت','spot',8), ('إضاءة خارجية','outdoor',9),
 ('أطقم الإنارة','sets',10);

insert into cities(name_ar, delivery_price, sort_order) values
 ('بنغازي',10,1), ('طرابلس',25,2), ('المرج',10,3), ('البيضاء',15,4), ('درنة',20,5);

insert into products(sku, name_ar, description_ar, category_id, price, is_new, is_featured)
select v.sku, v.n, v.d, c.id, v.p, v.nw, v.f from (values
 ('CH-001','ثريا مودرن ذهبية','ثريا عصرية بتشطيب ذهبي.','chandeliers',450,true,true),
 ('CH-002','ثريا كريستال','ثريا كريستال فاخرة.','chandeliers',900,false,true),
 ('CH-003','ثريا دائرية','ثريا دائرية بتصميم ناعم.','chandeliers',520,true,false),
 ('WALL-001','مصباح جداري','إضاءة جدارية أنيقة.','wall',140,false,false),
 ('LAMP-001','أباجورة مودرن','أباجورة جانبية عصرية.','lamps',180,false,false),
 ('LED-001','LED Pendant','إضاءة LED معلقة.','pendant',260,true,false),
 ('SPOT-001','Spot Light','سبوت لايت للسقف.','spot',45,false,false)
) as v(sku,n,d,slug,p,nw,f) join categories c on c.slug = v.slug;
