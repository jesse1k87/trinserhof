#!/usr/bin/env node
// Finds bookings with identical room + checkIn date + checkOut date and marks
// the lower-quality duplicate(s) as deleted:true. Only touches exact matches —
// overlapping-but-different-date bookings are left alone.

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'bookings.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

function roundDate(d) { return new Date(d).toISOString().slice(0, 10); }

// Higher score = more complete / more likely the canonical record
function score(b) {
  let s = 0;
  if (b.name && b.name !== 'undefined' && b.name.trim()) s += 10;
  if (b.email) s += 3;
  if (b.adults > 0) s += 2;
  if (b.priceFixed && parseFloat(b.priceFixed) > 0) s += 5;
  if (b.price > 0) s += 2;
  if (b.status === 'CONFIRMED') s += 1;
  if (b.className) s += 4;           // HBook legacy — richer source data
  if (b.group !== undefined) s += 4; // HBook legacy
  if (b.created) s += 1;
  return s;
}

// Group active (non-deleted, non-cancelled) bookings by room + checkIn + checkOut
const groups = {};
Object.values(data.bookings).forEach(b => {
  if (b.deleted || b.status === 'CANCELLED' || !b.checkIn || !b.checkOut) return;
  const room = b.roomId || (b.group !== undefined ? String(b.group) : null);
  if (!room) return;
  const key = room + '|' + roundDate(b.checkIn) + '|' + roundDate(b.checkOut);
  if (!groups[key]) groups[key] = [];
  groups[key].push(b);
});

const dupGroups = Object.entries(groups).filter(([, bks]) => bks.length > 1);

let markedCount = 0;
const log = [];

dupGroups.forEach(([key, bks]) => {
  const sorted = bks.slice().sort((a, b) => score(b) - score(a));
  const [room, ci, co] = key.split('|');
  // Keep highest score; mark the rest deleted
  sorted.slice(1).forEach(dup => {
    data.bookings[dup.id].deleted = true;
    markedCount++;
    log.push({ room, checkIn: ci, checkOut: co, kept: sorted[0].id, dropped: dup.id, keptName: sorted[0].name, droppedName: dup.name });
  });
});

fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

console.log('Duplicate groups found:', dupGroups.length);
console.log('Bookings marked deleted:', markedCount);
console.log('');
console.log('By year:');
const byYear = {};
log.forEach(l => {
  const y = l.checkIn.slice(0, 4);
  byYear[y] = (byYear[y] || 0) + 1;
});
Object.keys(byYear).sort().forEach(y => console.log('  ' + y + ': ' + byYear[y] + ' removed'));
console.log('');
console.log('Sample removals:');
log.slice(0, 8).forEach(l => {
  console.log('  Room ' + l.room + '  ' + l.checkIn + ' -> ' + l.checkOut);
  console.log('    KEPT  : ' + l.keptName + '  (' + l.kept + ')');
  console.log('    DROPPED: ' + l.droppedName + '  (' + l.dropped + ')');
});
