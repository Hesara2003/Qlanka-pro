// QueueLanka Pro — Database Seed Script
// Populates realistic Sri Lankan service center data for development/testing.

const mysql = require('mysql2/promise');

const config = {
  host: 'centerbeam.proxy.rlwy.net',
  port: 50181,
  user: 'root',
  password: 'BXjBSvtvdnZRQpiGQQWBVuJLqMVroQgB',
  database: 'railway',
  multipleStatements: false,
};

// ── Centers ─────────────────────────────────────────────────────────────────
const CENTERS = [
  {
    name: 'Colombo Municipal Council',
    address: 'No. 1, Town Hall Place, Colombo 07',
    phone: '+94 11 269 4111',
    email: 'info@colombo.mc.gov.lk',
    description: 'Main civic administration office for Colombo. Handles utility bills, permits, and municipal services.',
    timezone: 'Asia/Colombo',
    capacity: 120,
    avg_service_time: 12,
    opening: '08:30:00',
    closing: '16:30:00',
    is_active: true,
    location: {
      street_address: 'No. 1, Town Hall Place',
      city: 'Colombo',
      district: 'Colombo',
      province: 'Western',
      postal_code: '00700',
      country: 'Sri Lanka',
      latitude: 6.9236,
      longitude: 79.8722,
      google_maps_url: 'https://maps.google.com/?q=Colombo+Municipal+Council',
      landmark: 'Opposite Viharamahadevi Park',
    },
  },
  {
    name: 'Department of Motor Traffic — Colombo',
    address: 'No. 341, Elvitigala Mawatha, Colombo 05',
    phone: '+94 11 268 9111',
    email: 'dmt@motortraffic.gov.lk',
    description: 'Vehicle registration, driving licence applications, and revenue licence renewal for the Western Province.',
    timezone: 'Asia/Colombo',
    capacity: 200,
    avg_service_time: 20,
    opening: '08:30:00',
    closing: '16:00:00',
    is_active: true,
    location: {
      street_address: 'No. 341, Elvitigala Mawatha',
      city: 'Colombo',
      district: 'Colombo',
      province: 'Western',
      postal_code: '00500',
      country: 'Sri Lanka',
      latitude: 6.8944,
      longitude: 79.8665,
      google_maps_url: 'https://maps.google.com/?q=Department+of+Motor+Traffic+Colombo',
      landmark: 'Near Narahenpita junction',
    },
  },
  {
    name: 'Inland Revenue Department — Head Office',
    address: 'Chittampalam A. Gardiner Mawatha, Colombo 02',
    phone: '+94 11 213 5411',
    email: 'contact@ird.gov.lk',
    description: 'Tax assessment, registration, and compliance services for individuals and businesses.',
    timezone: 'Asia/Colombo',
    capacity: 150,
    avg_service_time: 15,
    opening: '08:30:00',
    closing: '16:30:00',
    is_active: true,
    location: {
      street_address: 'Chittampalam A. Gardiner Mawatha',
      city: 'Colombo',
      district: 'Colombo',
      province: 'Western',
      postal_code: '00200',
      country: 'Sri Lanka',
      latitude: 6.9233,
      longitude: 79.8499,
      google_maps_url: 'https://maps.google.com/?q=Inland+Revenue+Department+Colombo',
      landmark: 'Fort railway station area',
    },
  },
  {
    name: 'National Water Supply & Drainage Board — Kandy',
    address: 'No. 96, Kotugodella Veediya, Kandy',
    phone: '+94 81 222 2201',
    email: 'kandy@waterboard.lk',
    description: 'Water connection applications, bill payments, and meter services for the Kandy district.',
    timezone: 'Asia/Colombo',
    capacity: 80,
    avg_service_time: 10,
    opening: '09:00:00',
    closing: '16:00:00',
    is_active: true,
    location: {
      street_address: 'No. 96, Kotugodella Veediya',
      city: 'Kandy',
      district: 'Kandy',
      province: 'Central',
      postal_code: '20000',
      country: 'Sri Lanka',
      latitude: 7.2906,
      longitude: 80.6337,
      google_maps_url: 'https://maps.google.com/?q=National+Water+Supply+Kandy',
      landmark: 'Near Kandy city center',
    },
  },
  {
    name: 'Galle District Secretariat',
    address: 'District Secretariat, Galle 80000',
    phone: '+94 91 223 4001',
    email: 'ds.galle@ds.gov.lk',
    description: 'National identity card services, Samurdhi, land registration, and district administration.',
    timezone: 'Asia/Colombo',
    capacity: 100,
    avg_service_time: 18,
    opening: '08:30:00',
    closing: '16:30:00',
    is_active: true,
    location: {
      street_address: 'District Secretariat Building',
      city: 'Galle',
      district: 'Galle',
      province: 'Southern',
      postal_code: '80000',
      country: 'Sri Lanka',
      latitude: 6.0535,
      longitude: 80.2210,
      google_maps_url: 'https://maps.google.com/?q=Galle+District+Secretariat',
      landmark: 'Near Galle Fort',
    },
  },
  {
    name: 'Sri Lanka Post — Head Office',
    address: 'Janadhipathi Mawatha, Colombo 01',
    phone: '+94 11 232 6680',
    email: 'postmaster@slpost.lk',
    description: 'Postal services, passport applications, money orders, and registered mail.',
    timezone: 'Asia/Colombo',
    capacity: 60,
    avg_service_time: 8,
    opening: '09:00:00',
    closing: '17:00:00',
    is_active: false, // seeded as inactive — useful for testing inactive filter
    location: {
      street_address: 'Janadhipathi Mawatha',
      city: 'Colombo',
      district: 'Colombo',
      province: 'Western',
      postal_code: '00100',
      country: 'Sri Lanka',
      latitude: 6.9334,
      longitude: 79.8428,
      google_maps_url: 'https://maps.google.com/?q=Sri+Lanka+Post+Head+Office',
      landmark: 'Near President\'s House, Colombo Fort',
    },
  },
];

// Operating days: Mon–Fri open, Sat–Sun closed (day_of_week: 0=Sun ... 6=Sat)
const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function buildOperatingDays(centerId, opening, closing) {
  const rows = [];
  for (let dow = 0; dow <= 6; dow++) {
    const dayName = DAY_NAMES[dow];          // 0=sunday, 1=monday … 6=saturday
    const isOpen  = dow >= 1 && dow <= 5;    // Mon=1 … Fri=5
    rows.push({
      center_id:    centerId,
      day_of_week:  dayName,
      is_open:      isOpen,
      opening_time: isOpen ? opening : null,
      closing_time: isOpen ? closing : null,
    });
  }
  return rows;
}

async function run() {
  const conn = await mysql.createConnection(config);
  console.log('Connected to Railway MySQL ✓\n');

  // ── 1. Promote user 1 to admin ─────────────────────────────────────────────
  await conn.execute(
    `UPDATE users SET role = 'admin' WHERE user_id = 1 AND role = 'citizen'`
  );
  console.log('✓ User 1 (Hesara) promoted to admin\n');

  // ── 2. Insert centers + locations + operating days ─────────────────────────
  for (const center of CENTERS) {
    // Insert center
    const [cResult] = await conn.execute(
      `INSERT INTO centers
         (name, address, phone, email, description, timezone, capacity,
          average_service_time_minutes, opening_time, closing_time, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP())`,
      [
        center.name, center.address, center.phone, center.email,
        center.description, center.timezone, center.capacity,
        center.avg_service_time, center.opening, center.closing, center.is_active,
      ]
    );
    const centerId = cResult.insertId;

    // Insert location
    const loc = center.location;
    await conn.execute(
      `INSERT INTO center_locations
         (center_id, street_address, city, district, province, postal_code,
          country, latitude, longitude, google_maps_url, landmark)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        centerId, loc.street_address, loc.city, loc.district, loc.province,
        loc.postal_code, loc.country, loc.latitude, loc.longitude,
        loc.google_maps_url, loc.landmark,
      ]
    );

    // Insert 7 operating day rows
    const days = buildOperatingDays(centerId, center.opening, center.closing);
    for (const d of days) {
      await conn.execute(
        `INSERT INTO center_operating_days (center_id, day_of_week, is_open, opening_time, closing_time)
         VALUES (?, ?, ?, ?, ?)`,
        [d.center_id, d.day_of_week, d.is_open, d.opening_time, d.closing_time]
      );
    }

    const status = center.is_active ? 'active' : 'inactive';
    console.log(`✓ ${center.name} (id=${centerId}, ${status})`);
  }

  // ── 3. Verify ──────────────────────────────────────────────────────────────
  const [[{ centers }]] = await conn.query('SELECT COUNT(*) centers FROM centers');
  const [[{ locations }]] = await conn.query('SELECT COUNT(*) locations FROM center_locations');
  const [[{ opdays }]] = await conn.query('SELECT COUNT(*) opdays FROM center_operating_days');
  const [[{ users }]] = await conn.query('SELECT COUNT(*) users FROM users');

  console.log(`\n── Summary ──────────────────────────────`);
  console.log(`  Users            : ${users}`);
  console.log(`  Centers          : ${centers}`);
  console.log(`  Locations        : ${locations}`);
  console.log(`  Operating days   : ${opdays}`);

  await conn.end();
  console.log('\nDone ✓');
}

run().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
