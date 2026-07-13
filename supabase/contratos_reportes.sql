-- CONTRATOS
create table contratos (
  id uuid default gen_random_uuid() primary key,
  cliente_id uuid references clientes(id) on delete cascade not null,
  titulo text not null,
  descripcion text,
  estado text default 'borrador' check (estado in ('borrador', 'enviado', 'firmado', 'vencido', 'cancelado')),
  fecha_inicio date,
  fecha_fin date,
  monto_total numeric,
  moneda text default 'USD',
  notas text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table contratos enable row level security;
create policy "CM ve sus contratos" on contratos
  for all using (
    exists (select 1 from clientes where clientes.id = contratos.cliente_id and clientes.user_id = auth.uid())
  );

-- REPORTES DE METRICAS
create table reportes (
  id uuid default gen_random_uuid() primary key,
  cliente_id uuid references clientes(id) on delete cascade not null,
  titulo text not null,
  plataforma text not null,
  periodo text not null,
  datos_json jsonb,
  reporte_texto text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table reportes enable row level security;
create policy "CM gestiona reportes" on reportes
  for all using (
    exists (select 1 from clientes where clientes.id = reportes.cliente_id and clientes.user_id = auth.uid())
  );
create policy "Cliente ve sus reportes publicamente" on reportes
  for select using (true);
