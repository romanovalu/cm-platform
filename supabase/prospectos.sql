-- PROSPECTOS
create table prospectos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  nombre text not null,
  empresa text,
  email text,
  telefono text,
  industria text,
  estado text default 'nuevo' check (estado in ('nuevo', 'contactado', 'propuesta_enviada', 'negociacion', 'ganado', 'perdido')),
  origen text,
  notas text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table prospectos enable row level security;
create policy "CM ve sus prospectos" on prospectos
  for all using (auth.uid() = user_id);

-- PRESUPUESTOS
create table presupuestos (
  id uuid default gen_random_uuid() primary key,
  prospecto_id uuid references prospectos(id) on delete cascade not null,
  titulo text not null,
  items jsonb not null default '[]',
  subtotal numeric default 0,
  descuento numeric default 0,
  total numeric default 0,
  moneda text default 'USD',
  validez date,
  notas text,
  estado text default 'borrador' check (estado in ('borrador', 'enviado', 'aceptado', 'rechazado')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table presupuestos enable row level security;
create policy "CM gestiona presupuestos" on presupuestos
  for all using (
    exists (select 1 from prospectos where prospectos.id = presupuestos.prospecto_id and prospectos.user_id = auth.uid())
  );
create policy "Prospecto ve su presupuesto publicamente" on presupuestos
  for select using (true);
create policy "Prospecto puede actualizar estado" on presupuestos
  for update using (true) with check (true);
