-- ONBOARDING
create table onboarding (
  id uuid default gen_random_uuid() primary key,
  cliente_id uuid references clientes(id) on delete cascade not null,
  -- Brief
  descripcion text,
  publico_objetivo text,
  tono_voz text,
  colores text,
  competidores text,
  objetivos text,
  que_no_hacer text,
  -- Redes
  redes text[],
  -- Credenciales (encriptadas en el cliente)
  credenciales jsonb,
  -- Assets
  logo_url text,
  drive_url text,
  -- Contrato
  plan_elegido text,
  monto_plan numeric,
  contrato_firmado boolean default false,
  fecha_firma timestamp with time zone,
  nombre_firma text,
  -- Estado
  completado boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table onboarding enable row level security;
create policy "CM ve su onboarding" on onboarding
  for all using (
    exists (select 1 from clientes where clientes.id = onboarding.cliente_id and clientes.user_id = auth.uid())
  );

-- CONTENIDO (Estudio)
create table contenido (
  id uuid default gen_random_uuid() primary key,
  cliente_id uuid references clientes(id) on delete cascade not null,
  titulo text not null,
  descripcion text,
  tipo text default 'post',
  fecha_programada date,
  estado text default 'borrador' check (estado in ('borrador', 'aprobado', 'publicado', 'rechazado')),
  comentario_cliente text,
  imagen_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table contenido enable row level security;
create policy "CM ve su contenido" on contenido
  for all using (
    exists (select 1 from clientes where clientes.id = contenido.cliente_id and clientes.user_id = auth.uid())
  );
create policy "Cliente ve su contenido por token" on contenido
  for select using (true);

-- COBROS
create table cobros (
  id uuid default gen_random_uuid() primary key,
  cliente_id uuid references clientes(id) on delete cascade not null,
  concepto text not null,
  monto numeric not null,
  moneda text default 'USD',
  estado text default 'pendiente' check (estado in ('enviada', 'pagado', 'vencido')),
  fecha_emision date default current_date,
  fecha_vencimiento date,
  comprobante_url text,
  notas text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table cobros enable row level security;
create policy "CM ve sus cobros" on cobros
  for all using (
    exists (select 1 from clientes where clientes.id = cobros.cliente_id and clientes.user_id = auth.uid())
  );

-- GASTOS (Finanzas del CM)
create table gastos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  concepto text not null,
  categoria text not null,
  monto numeric not null,
  moneda text default 'USD',
  recurrente boolean default false,
  fecha date default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table gastos enable row level security;
create policy "CM ve sus gastos" on gastos
  for all using (auth.uid() = user_id);
