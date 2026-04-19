insert into service_centers (center_id, name, address, phone, email, description, timezone, capacity, opening_time, closing_time, is_active)
values
    (1, 'Colombo One Stop Center', 'No. 12, Main Street, Colombo 01', '+94112223344', 'colombo.center@demo.local', 'Primary demo center', 'Asia/Colombo', 150, '08:00:00', '17:00:00', true)
on conflict (center_id) do update
set
    name = excluded.name,
    address = excluded.address,
    phone = excluded.phone,
    email = excluded.email,
    description = excluded.description,
    timezone = excluded.timezone,
    capacity = excluded.capacity,
    opening_time = excluded.opening_time,
    closing_time = excluded.closing_time,
    is_active = excluded.is_active;

insert into users (user_id, username, email, password_hash, role, center_id, is_active)
values
    (1, 'admin', 'admin@demo.local', 'Demo@123', 'admin', null, true),
    (2, 'officer1', 'officer1@demo.local', 'Demo@123', 'officer', 1, true),
    (3, 'citizen1', 'citizen1@demo.local', 'Demo@123', 'citizen', 1, true)
on conflict (user_id) do update
set
    username = excluded.username,
    email = excluded.email,
    password_hash = excluded.password_hash,
    role = excluded.role,
    center_id = excluded.center_id,
    is_active = excluded.is_active;

insert into counters (counter_id, center_id, name, status, officer_user_id)
values
    (1, 1, 'Counter 1', 'Open', 2),
    (2, 1, 'Counter 2', 'Open', null)
on conflict (counter_id) do update
set
    center_id = excluded.center_id,
    name = excluded.name,
    status = excluded.status,
    officer_user_id = excluded.officer_user_id,
    updated_at = now();

insert into appointments (appointment_id, center_id, user_id, token_number, appointment_date, appointment_time, status)
values
    (1, 1, 3, 'T01', current_date, '09:00:00', 'Booked'),
    (2, 1, 3, 'T02', current_date, '09:15:00', 'Booked')
on conflict (appointment_id) do update
set
    center_id = excluded.center_id,
    user_id = excluded.user_id,
    token_number = excluded.token_number,
    appointment_date = excluded.appointment_date,
    appointment_time = excluded.appointment_time,
    status = excluded.status;

insert into tokens (token_id, center_id, counter_id, user_id, appointment_id, token_number, issued_date, issued_time, status, queue_position)
values
    (1, 1, 1, 3, 1, 'T01', current_date, now(), 'Waiting', 1),
    (2, 1, 1, 3, 2, 'T02', current_date, now(), 'Waiting', 2)
on conflict (token_id) do update
set
    center_id = excluded.center_id,
    counter_id = excluded.counter_id,
    user_id = excluded.user_id,
    appointment_id = excluded.appointment_id,
    token_number = excluded.token_number,
    issued_date = excluded.issued_date,
    issued_time = excluded.issued_time,
    status = excluded.status,
    queue_position = excluded.queue_position,
    updated_at = now();

update appointments set token_id = 1 where appointment_id = 1;
update appointments set token_id = 2 where appointment_id = 2;

select setval(pg_get_serial_sequence('service_centers', 'center_id'), coalesce((select max(center_id) from service_centers), 1), true);
select setval(pg_get_serial_sequence('users', 'user_id'), coalesce((select max(user_id) from users), 1), true);
select setval(pg_get_serial_sequence('counters', 'counter_id'), coalesce((select max(counter_id) from counters), 1), true);
select setval(pg_get_serial_sequence('appointments', 'appointment_id'), coalesce((select max(appointment_id) from appointments), 1), true);
select setval(pg_get_serial_sequence('tokens', 'token_id'), coalesce((select max(token_id) from tokens), 1), true);
