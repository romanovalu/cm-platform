-- Tabla de clientes
create table clientes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  nombre text not null,
  empresa text,
  email text,
  telefono text,
  industria text,
  estado text default 'activo' check (estado in ('activo', 'pausado', 'revisar')),
  retainer numeric default 0,
  moneda text default 'USD',
  pago text default 'pendiente' check (pago in ('pagado', 'pendiente', 'vencido')),
  proximo text,
  notas text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Seguridad: cada CM solo ve sus propios clientes
alter table clientes enable row level security;

create policy "CM ve sus clientes" on clientes
  for all using (auth.uid() = user_id);
