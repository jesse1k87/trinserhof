const fs = require('fs');
const crypto = require('crypto');

const bookings = require('./hbook_bookings.json').data;
const customers = require('./hbook_customers.json').data;

// accom_id (WordPress post ID) → roomId (hotel room number string)
const ACCOM_TO_ROOM = {
  '31': '101',
  '81': '102',
  '82': '103',
  '83': '104',   // "104/105" suite
  '84': '106',
  '85': '107',
  '86': '108',
  '87': '109',
  '88': '110',
  '89': '111',
  '90': '112',
  '91': '113',
  '93': '114',   // "114/115" suite
  '94': '116',
  '95': '117',
  '96': '118',
  '97': '119',   // "119/120" suite
  '98': '121',
  '99': '124',
  '108': '0',    // "? Anmerkungen" misc
  '116': '0',    // Tisch
  '118': '0',
  '120': '0',
  '122': '0',
  '124': '0',
};

const STATUS_MAP = {
  confirmed: 'CONFIRMED',
  cancelled: 'CANCELLED',
  new: 'PENDING',
};

const customerMap = {};
customers.forEach((c) => {
  let info = {};
  try { info = JSON.parse(c.info); } catch (_) {}
  customerMap[c.id] = {
    email: info.email || c.email || '',
    name: [info.first_name, info.last_name].filter(Boolean).join(' '),
  };
});

// Deterministic UUID v4 from a seed string so re-running produces the same IDs
function deterministicUuid(seed) {
  const hash = crypto.createHash('sha256').update(seed).digest('hex');
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    '4' + hash.slice(13, 16),
    (((parseInt(hash[16], 16) & 0x3) | 0x8)).toString(16) + hash.slice(17, 20),
    hash.slice(20, 32),
  ].join('-');
}

const result = {};

bookings.forEach((r) => {
  const customer = customerMap[r.customer_id] || { email: '', name: '' };
  const roomId = ACCOM_TO_ROOM[r.accom_id] || '0';
  const status = STATUS_MAP[r.status] || 'NO_STATUS';
  const channel = r.origin === 'Airbnb' ? 'AIRBNB' : 'UNKNOWN';
  const price = parseFloat(r.price) || 0;
  const id = deterministicUuid(`hbook-${r.id}`);

  result[id] = {
    adults: parseInt(r.adults, 10) || 0,
    babies: 0,
    channel,
    checkIn: r.check_in,
    checkOut: r.check_out,
    children: parseInt(r.children, 10) || 0,
    email: customer.email,
    id,
    name: customer.name,
    notes: r.admin_comment || '',
    pets: 0,
    price,
    priceFixed: '',
    roomId,
    status,
  };
});

fs.writeFileSync(
  './hbook_bookings_normalized.json',
  JSON.stringify({ bookings: result }, null, 2),
);

console.log(`Converted ${Object.keys(result).length} bookings.`);
