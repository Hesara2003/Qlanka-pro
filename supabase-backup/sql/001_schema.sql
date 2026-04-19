create extension if not exists pgcrypto;

create table if not exists users (
    user_id bigserial primary key,
    username text not null unique,
    email text not null unique,
    password_hash text not null,
    role text not null check (role in ('citizen', 'officer', 'admin')),
    center_id bigint null,
    is_active boolean not null default true,
    created_at timestamptz not null default now()
);

create table if not exists service_centers (
    center_id bigserial primary key,
    name text not null,
    address text not null,
    phone text null,
    email text null,
    description text null,
    timezone text not null default 'Asia/Colombo',
    capacity int not null default 100,
    opening_time time not null default '08:00:00',
    closing_time time not null default '17:00:00',
    is_active boolean not null default true,
    created_at timestamptz not null default now()
);

create table if not exists counters (
    counter_id bigserial primary key,
    center_id bigint not null references service_centers(center_id) on delete cascade,
    name text not null,
    status text not null default 'Open' check (status in ('Open', 'Closed')),
    officer_user_id bigint null references users(user_id) on delete set null,
    current_token_id bigint null,
    updated_at timestamptz not null default now()
);

create table if not exists appointments (
    appointment_id bigserial primary key,
    center_id bigint not null references service_centers(center_id) on delete cascade,
    user_id bigint not null references users(user_id) on delete cascade,
    token_id bigint null,
    token_number text not null,
    appointment_date date not null,
    appointment_time time not null,
    status text not null default 'Booked',
    created_at timestamptz not null default now()
);

create table if not exists tokens (
    token_id bigserial primary key,
    center_id bigint not null references service_centers(center_id) on delete cascade,
    counter_id bigint null references counters(counter_id) on delete set null,
    user_id bigint not null references users(user_id) on delete cascade,
    appointment_id bigint null references appointments(appointment_id) on delete set null,
    token_number text not null,
    issued_date date not null,
    issued_time timestamptz not null default now(),
    status text not null default 'Waiting' check (status in ('Waiting', 'Called', 'Completed', 'Skipped', 'Cancelled')),
    queue_position int null,
    called_at timestamptz null,
    served_time timestamptz null,
    completed_time timestamptz null,
    cancelled_at timestamptz null,
    updated_at timestamptz not null default now(),
    created_at timestamptz not null default now()
);

create index if not exists idx_tokens_center_date_status on tokens(center_id, issued_date, status);
create index if not exists idx_tokens_user_id on tokens(user_id);
create index if not exists idx_appointments_user_id on appointments(user_id);
