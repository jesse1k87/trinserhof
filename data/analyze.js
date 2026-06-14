const fs = require('fs');
const data = JSON.parse(fs.readFileSync('/home/jesse/repos/trinserhof/data/bookings.json', 'utf8'));
const bookings = Object.values(data.bookings);

const TOTAL_ROOMS = 19;
const ACTIVE = new Set(['CONFIRMED', 'PAID', 'EMPLOYEE']);

// Operational months based on all-time booking data (Apr, May, Nov = closed)
const OPERATIONAL_MONTHS = new Set([0, 1, 2, 5, 6, 7, 8, 11]); // Jan,Feb,Mar,Jun,Jul,Aug,Sep,Dec

function isLeap(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }
function daysInMonth(y, m) { return [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m]; }

function operationalDays(year, upToDate) {
  let days = 0;
  for (let m = 0; m < 12; m++) {
    if (!OPERATIONAL_MONTHS.has(m)) continue;
    const dim = daysInMonth(year, m);
    if (upToDate) {
      const monthStart = new Date(year, m, 1);
      const monthEnd = new Date(year, m, dim);
      const cutoff = new Date(upToDate);
      if (monthStart > cutoff) continue;
      const end = monthEnd < cutoff ? monthEnd : cutoff;
      days += Math.ceil((end - monthStart) / 86400000) + 1;
    } else {
      days += dim;
    }
  }
  return days;
}

function roundNights(checkIn, checkOut) {
  const raw = (new Date(checkOut) - new Date(checkIn)) / 86400000;
  return Math.round(raw);
}

// Group by check-in year
const years = {};
bookings.forEach(b => {
  if (!b.checkIn || !b.checkOut) return;
  const year = new Date(b.checkIn).getFullYear();
  if (!years[year]) years[year] = { active: [], cancelled: 0, pending: 0, blocked: 0 };
  if (ACTIVE.has(b.status)) years[year].active.push(b);
  else if (b.status === 'CANCELLED') years[year].cancelled++;
  else if (b.status === 'PENDING') years[year].pending++;
  else if (b.status === 'BLOCKED') years[year].blocked++;
});

const TODAY = '2026-06-14';
const CURRENT_YEAR = 2026;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

console.log('');
console.log('╔══════════════════════════════════════════════════════════════════════╗');
console.log('║          HOTEL TRINSERHOF — OCCUPANCY ANALYSIS 2017–2026            ║');
console.log('╚══════════════════════════════════════════════════════════════════════╝');
console.log('  19 rooms | Seasons: Winter (Jan–Mar) + Summer (Jun–Sep) + Xmas (Dec)');
console.log('  Occupancy % = room-nights sold ÷ (19 rooms × operational days)');
console.log('  Revenue reliable only from 2024 (priceFixed field populated)');
console.log('');

Object.keys(years).sort().forEach(yr => {
  const year = parseInt(yr);
  const { active, cancelled, pending, blocked } = years[yr];
  const isCurrentYear = year === CURRENT_YEAR;
  const cutoff = isCurrentYear ? TODAY : null;
  const opDays = operationalDays(year, cutoff);
  const availRoomNights = TOTAL_ROOMS * opDays;

  let totalNights = 0, totalRevenue = 0, totalGuests = 0, validCount = 0;
  const byMonth = Array(12).fill(0);

  active.forEach(b => {
    const nights = roundNights(b.checkIn, b.checkOut);
    if (nights <= 0 || nights > 90) return;
    totalNights += nights;
    totalGuests += (b.adults || 0) + (b.children || 0);
    totalRevenue += parseFloat(b.priceFixed) || 0;
    byMonth[new Date(b.checkIn).getMonth()] += nights;
    validCount++;
  });

  const occupancy = availRoomNights ? (totalNights / availRoomNights * 100) : 0;
  const avgLOS = validCount ? (totalNights / validCount) : 0;
  const avgGuests = validCount ? (totalGuests / validCount) : 0;

  const topMonths = byMonth
    .map((n, i) => ({ month: MONTHS[i], nights: n }))
    .filter(x => x.nights > 0)
    .sort((a, b) => b.nights - a.nights)
    .slice(0, 3)
    .map(x => x.month + ' ' + x.nights + 'n')
    .join('  >  ');

  const label = yr + (isCurrentYear ? ' (YTD ' + TODAY + ')' : '');
  const line = '─'.repeat(68 - label.length - 2);
  console.log('┌─ ' + label + ' ' + line);
  console.log('│  Bookings: ' + active.length + ' active  |  ' + cancelled + ' cancelled  |  ' + pending + ' pending  |  ' + blocked + ' blocked');
  console.log('│  Room-nights: ' + totalNights + ' sold  /  ' + availRoomNights + ' available  →  Occupancy: ' + occupancy.toFixed(1) + '%');
  console.log('│  Avg LOS: ' + avgLOS.toFixed(1) + ' nights  |  Avg guests/booking: ' + avgGuests.toFixed(1) + '  |  Total guests: ' + totalGuests);
  if (totalRevenue > 0) {
    const adr = totalNights > 0 ? totalRevenue / totalNights : 0;
    const revpar = availRoomNights > 0 ? totalRevenue / availRoomNights : 0;
    console.log('│  Revenue: €' + totalRevenue.toLocaleString('de-AT') + '  |  ADR: €' + adr.toFixed(0) + '/night  |  RevPAR: €' + revpar.toFixed(2));
  }
  console.log('│  Top months: ' + topMonths);
  console.log('│  By month: ' + byMonth.map((n, i) => MONTHS[i] + ':' + n).join(' | '));
  console.log('└' + '─'.repeat(68));
  console.log('');
});

// Summary table
console.log('╔══════════════════════════════════════════════════════════════════════╗');
console.log('║                     YEAR-OVER-YEAR SUMMARY TABLE                    ║');
console.log('╚══════════════════════════════════════════════════════════════════════╝');
console.log('Year    | Bkgs | Rm-nights | Occ%(seasonal) | AvgLOS | Guests | Revenue');
console.log('--------|------|-----------|----------------|--------|--------|--------');

Object.keys(years).sort().forEach(yr => {
  const year = parseInt(yr);
  const { active } = years[yr];
  const isCurrentYear = year === CURRENT_YEAR;
  const opDays = operationalDays(year, isCurrentYear ? TODAY : null);
  const availRoomNights = TOTAL_ROOMS * opDays;

  let totalNights = 0, totalRevenue = 0, totalGuests = 0, validCount = 0;
  active.forEach(b => {
    const nights = roundNights(b.checkIn, b.checkOut);
    if (nights <= 0 || nights > 90) return;
    totalNights += nights;
    totalGuests += (b.adults || 0) + (b.children || 0);
    totalRevenue += parseFloat(b.priceFixed) || 0;
    validCount++;
  });

  const occ = availRoomNights ? (totalNights / availRoomNights * 100).toFixed(1) + '%' : '-';
  const avgLOS = validCount ? (totalNights / validCount).toFixed(1) : '-';
  const rev = totalRevenue > 0 ? '€' + Math.round(totalRevenue / 1000) + 'k' : 'n/a';
  const tag = isCurrentYear ? '*' : ' ';

  console.log(
    (yr + tag).padEnd(8) + '| ' +
    (active.length + '').padEnd(5) + '| ' +
    (totalNights + '').padEnd(10) + '| ' +
    occ.padEnd(16) + '| ' +
    avgLOS.padEnd(7) + '| ' +
    (totalGuests + '').padEnd(7) + '| ' +
    rev
  );
});
console.log('* = partial year (YTD through 2026-06-14)');
console.log('');

// Seasonal breakdown across all years (excluding 2017 partial + 2026 partial)
console.log('╔══════════════════════════════════════════════════════════════════════╗');
console.log('║              ALL-TIME SEASONAL PATTERN (full years 2018–2025)        ║');
console.log('╚══════════════════════════════════════════════════════════════════════╝');
const byMonth = Array(12).fill(0);
const byMonthBkgs = Array(12).fill(0);
Object.keys(years).filter(y => y >= '2018' && y <= '2025').forEach(yr => {
  years[yr].active.forEach(b => {
    const nights = roundNights(b.checkIn, b.checkOut);
    if (nights <= 0 || nights > 90) return;
    const m = new Date(b.checkIn).getMonth();
    byMonth[m] += nights;
    byMonthBkgs[m]++;
  });
});
const maxN = Math.max(...byMonth);
MONTHS.forEach((name, i) => {
  const bar = '█'.repeat(Math.round(byMonth[i] / maxN * 30));
  console.log('  ' + name + ' | ' + bar.padEnd(30) + ' ' + byMonth[i] + ' nights (' + byMonthBkgs[i] + ' bkgs)');
});
