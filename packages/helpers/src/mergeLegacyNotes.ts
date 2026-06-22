export const mergeLegacyNotes = (booking: { notes?: string; contact?: string; content?: string }): string =>
  [booking.notes, booking.contact, booking.content]
    .filter((s): s is string => typeof s === 'string' && s !== '')
    .join(' ');
