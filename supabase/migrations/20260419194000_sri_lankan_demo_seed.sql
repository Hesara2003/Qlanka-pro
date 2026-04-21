-- Sri Lankan demo data expansion for fallback operations
-- Idempotent upserts using fixed IDs for repeatable demo environments.

insert into service_centers (
    center_id,
    name,
    address,
    phone,
    email,
    description,
    timezone,
    capacity,
    opening_time,
    closing_time,
    is_active
)
values
    (2, 'Kandy Citizen Service Center', 'No. 45, Dalada Veediya, Kandy', '+94812234567', 'kandy.center@qlanka.lk', 'Central Province public services center', 'Asia/Colombo', 120, '08:00:00', '16:30:00', true),
    (3, 'Galle One Stop Service Center', 'No. 18, Rampart Street, Galle', '+94912223344', 'galle.center@qlanka.lk', 'Southern Province public services center', 'Asia/Colombo', 110, '08:30:00', '16:30:00', true),
    (4, 'Jaffna Public Service Hub', 'No. 09, Hospital Road, Jaffna', '+94212224455', 'jaffna.center@qlanka.lk', 'Northern Province integrated service center', 'Asia/Colombo', 100, '08:00:00', '16:00:00', true),
    (5, 'Kurunegala District Service Center', 'No. 72, Colombo Road, Kurunegala', '+94372221100', 'kurunegala.center@qlanka.lk', 'North Western Province district services', 'Asia/Colombo', 130, '08:00:00', '17:00:00', true),
    (6, 'Batticaloa Citizen Facilitation Center', 'No. 11, Trinco Road, Batticaloa', '+94652223344', 'batticaloa.center@qlanka.lk', 'Eastern Province citizen facilitation', 'Asia/Colombo', 95, '08:30:00', '16:00:00', true),
    (7, 'Anuradhapura E-Services Center', 'No. 56, Maithripala Senanayake Mawatha, Anuradhapura', '+94252224466', 'anuradhapura.center@qlanka.lk', 'North Central Province digital public services', 'Asia/Colombo', 105, '08:00:00', '16:30:00', true),
    (8, 'Matara Divisional Service Center', 'No. 27, Main Street, Matara', '+94412223355', 'matara.center@qlanka.lk', 'Southern coastal district service center', 'Asia/Colombo', 90, '08:30:00', '16:30:00', true)
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

insert into users (
    user_id,
    username,
    email,
    password_hash,
    role,
    center_id,
    is_active
)
values
    (20, 'officer_kandy', 'officer.kandy@qlanka.lk', 'Demo@123', 'officer', 2, true),
    (21, 'officer_galle', 'officer.galle@qlanka.lk', 'Demo@123', 'officer', 3, true),
    (22, 'officer_jaffna', 'officer.jaffna@qlanka.lk', 'Demo@123', 'officer', 4, true),
    (23, 'officer_kurunegala', 'officer.kurunegala@qlanka.lk', 'Demo@123', 'officer', 5, true),
    (24, 'officer_batticaloa', 'officer.batticaloa@qlanka.lk', 'Demo@123', 'officer', 6, true),
    (25, 'officer_anuradhapura', 'officer.anuradhapura@qlanka.lk', 'Demo@123', 'officer', 7, true),
    (26, 'officer_matara', 'officer.matara@qlanka.lk', 'Demo@123', 'officer', 8, true),
    (30, 'citizen_nimal', 'nimal.perera@qlanka.lk', 'Demo@123', 'citizen', 2, true),
    (31, 'citizen_kumari', 'kumari.silva@qlanka.lk', 'Demo@123', 'citizen', 3, true),
    (32, 'citizen_shan', 'shan.tharmalingam@qlanka.lk', 'Demo@123', 'citizen', 4, true),
    (33, 'citizen_amal', 'amal.jayasinghe@qlanka.lk', 'Demo@123', 'citizen', 5, true),
    (34, 'citizen_nadee', 'nadee.fernando@qlanka.lk', 'Demo@123', 'citizen', 6, true),
    (35, 'citizen_chamara', 'chamara.bandara@qlanka.lk', 'Demo@123', 'citizen', 7, true),
    (36, 'citizen_tharushi', 'tharushi.athukorala@qlanka.lk', 'Demo@123', 'citizen', 8, true)
on conflict (user_id) do update
set
    username = excluded.username,
    email = excluded.email,
    password_hash = excluded.password_hash,
    role = excluded.role,
    center_id = excluded.center_id,
    is_active = excluded.is_active;

insert into counters (
    counter_id,
    center_id,
    name,
    status,
    officer_user_id
)
values
    (201, 2, 'Kandy Counter 1', 'Open', 20),
    (202, 2, 'Kandy Counter 2', 'Open', null),
    (203, 3, 'Galle Counter 1', 'Open', 21),
    (204, 3, 'Galle Counter 2', 'Closed', null),
    (205, 4, 'Jaffna Counter 1', 'Open', 22),
    (206, 4, 'Jaffna Counter 2', 'Open', null),
    (207, 5, 'Kurunegala Counter 1', 'Open', 23),
    (208, 5, 'Kurunegala Counter 2', 'Open', null),
    (209, 6, 'Batticaloa Counter 1', 'Open', 24),
    (210, 6, 'Batticaloa Counter 2', 'Closed', null),
    (211, 7, 'Anuradhapura Counter 1', 'Open', 25),
    (212, 7, 'Anuradhapura Counter 2', 'Open', null),
    (213, 8, 'Matara Counter 1', 'Open', 26),
    (214, 8, 'Matara Counter 2', 'Open', null)
on conflict (counter_id) do update
set
    center_id = excluded.center_id,
    name = excluded.name,
    status = excluded.status,
    officer_user_id = excluded.officer_user_id,
    updated_at = now();

insert into appointments (
    appointment_id,
    center_id,
    user_id,
    token_number,
    appointment_date,
    appointment_time,
    status
)
values
    (301, 2, 30, 'KD01', current_date, '09:00:00', 'Booked'),
    (302, 3, 31, 'GL01', current_date, '09:15:00', 'Booked'),
    (303, 4, 32, 'JF01', current_date, '09:30:00', 'Booked'),
    (304, 5, 33, 'KR01', current_date, '10:00:00', 'Booked'),
    (305, 6, 34, 'BT01', current_date, '10:15:00', 'Booked'),
    (306, 8, 36, 'MT01', current_date, '10:30:00', 'Booked')
on conflict (appointment_id) do update
set
    center_id = excluded.center_id,
    user_id = excluded.user_id,
    token_number = excluded.token_number,
    appointment_date = excluded.appointment_date,
    appointment_time = excluded.appointment_time,
    status = excluded.status;

insert into tokens (
    token_id,
    center_id,
    counter_id,
    user_id,
    appointment_id,
    token_number,
    issued_date,
    issued_time,
    status,
    queue_position,
    called_at,
    served_time,
    updated_at
)
values
    (401, 2, 201, 30, 301, 'KD01', current_date, now(), 'Waiting', 1, null, null, now()),
    (402, 3, 203, 31, 302, 'GL01', current_date, now(), 'Called', 1, now() - interval '4 minutes', null, now()),
    (403, 4, 205, 32, 303, 'JF01', current_date, now(), 'Waiting', 2, null, null, now()),
    (404, 5, 207, 33, 304, 'KR01', current_date, now(), 'Completed', 1, now() - interval '12 minutes', now() - interval '6 minutes', now()),
    (405, 6, 209, 34, 305, 'BT01', current_date, now(), 'Skipped', 2, now() - interval '10 minutes', null, now()),
    (406, 8, 213, 36, 306, 'MT01', current_date, now(), 'Waiting', 3, null, null, now())
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
    called_at = excluded.called_at,
    served_time = excluded.served_time,
    updated_at = now();

update appointments set token_id = 401 where appointment_id = 301;
update appointments set token_id = 402 where appointment_id = 302;
update appointments set token_id = 403 where appointment_id = 303;
update appointments set token_id = 404 where appointment_id = 304;
update appointments set token_id = 405 where appointment_id = 305;
update appointments set token_id = 406 where appointment_id = 306;

select setval(pg_get_serial_sequence('service_centers', 'center_id'), coalesce((select max(center_id) from service_centers), 1), true);
select setval(pg_get_serial_sequence('users', 'user_id'), coalesce((select max(user_id) from users), 1), true);
select setval(pg_get_serial_sequence('counters', 'counter_id'), coalesce((select max(counter_id) from counters), 1), true);
select setval(pg_get_serial_sequence('appointments', 'appointment_id'), coalesce((select max(appointment_id) from appointments), 1), true);
select setval(pg_get_serial_sequence('tokens', 'token_id'), coalesce((select max(token_id) from tokens), 1), true);
