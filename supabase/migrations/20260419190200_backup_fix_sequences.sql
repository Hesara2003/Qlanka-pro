select setval(pg_get_serial_sequence('service_centers', 'center_id'), coalesce((select max(center_id) from service_centers), 1), true);
select setval(pg_get_serial_sequence('users', 'user_id'), coalesce((select max(user_id) from users), 1), true);
select setval(pg_get_serial_sequence('counters', 'counter_id'), coalesce((select max(counter_id) from counters), 1), true);
select setval(pg_get_serial_sequence('appointments', 'appointment_id'), coalesce((select max(appointment_id) from appointments), 1), true);
select setval(pg_get_serial_sequence('tokens', 'token_id'), coalesce((select max(token_id) from tokens), 1), true);
