const mysql = require('mysql2/promise');
const cfg = { host: 'centerbeam.proxy.rlwy.net', port: 50181, user: 'root', password: 'BXjBSvtvdnZRQpiGQQWBVuJLqMVroQgB', database: 'railway' };

(async () => {
  const c = await mysql.createConnection(cfg);

  const [users]   = await c.query('SELECT user_id, username, role FROM users');
  const [centers] = await c.query('SELECT center_id, name, is_active FROM centers');
  const [locs]    = await c.query('SELECT cl.center_id, cl.city, cl.district, cl.latitude FROM center_locations cl');
  const [opd]     = await c.query(
    `SELECT day_of_week, is_open FROM center_operating_days WHERE center_id = 1
     ORDER BY FIELD(day_of_week,'sunday','monday','tuesday','wednesday','thursday','friday','saturday')`
  );

  console.log('Users:');
  users.forEach(r => console.log(' ', JSON.stringify(r)));

  console.log('\nCenters:');
  centers.forEach(r => console.log(' ', JSON.stringify(r)));

  console.log('\nLocations:');
  locs.forEach(r => console.log(' ', JSON.stringify(r)));

  console.log('\nOperating days (center 1 — CMC):');
  opd.forEach(r => console.log(' ', JSON.stringify(r)));

  await c.end();
})().catch(e => { console.error(e.message); process.exit(1); });
