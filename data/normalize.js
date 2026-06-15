const fs = require("fs");

const fileSource = "./bookings_raw.json";
const fileTarget = "./bookings_clean.json";

function trimStringFields(b) {
  for (const field of ["name", "content", "notes", "message", "email", "id"]) {
    if (typeof b[field] === "string") b[field] = b[field].trim();
  }
}

function addMissingFields(b) {
  for (const field of ["adults", "children", "babies", "pets"]) {
    b[field] = b[field] ?? 0;
  }
  b.price = isNaN(b.price) ? 0 : b.price;
}

function normalizeStatus(b) {
  b.status =
    typeof b.status === "string" ? b.status.toUpperCase() : "NO_STATUS";

  if (b.status === "MAYBE") b.status = "PENDING";
}

function normalizeLegacyDateFields(b) {
  if (typeof b.checkIn === "undefined") {
    if (typeof b.end !== "undefined") {
      b.checkIn = b.start;
      delete b.start;
    }

    if (typeof b.check_in !== "undefined") {
      b.checkOut = b.check_in;
      delete b.check_in;
    }
  }

  if (typeof b.checkOut === "undefined") {
    if (typeof b.end !== "undefined") {
      b.checkOut = b.end;
      delete b.end;
    }

    if (typeof b.check_out !== "undefined") {
      b.checkOut = b.check_out;
      delete b.check_out;
    }
  }
}

function consolidateNotesFromMessage(b) {
  b.notes =
    typeof b.notes === "string" && b.notes !== ""
      ? b.notes
      : typeof b.message === "string"
        ? b.message
        : "";

  if (typeof b.message === "string" && b.message === "") {
    delete b.message;
  }
}

function removeFields(b) {
  delete b.channel;
}

function renameHBookFields(b) {
  if (typeof b.check_in !== "undefined") {
    if (typeof b.checkIn === "undefined") {
      b.checkIn = b.check_in;
    }
    delete b.check_in;
  }

  if (typeof b.check_out !== "undefined") {
    if (typeof b.checkOut === "undefined") {
      b.checkOut = b.check_out;
    }
    delete b.check_out;
  }
}

function sortBookingKeysByName(b) {
  return b; // Do not sort properties yet.
  const sortedKeys = Object.keys(b).sort();
  const sorted = {};
  for (const key of sortedKeys) {
    sorted[key] = b[key];
  }
  return sorted;
}

try {
  const rawData = fs.readFileSync(fileSource, "utf-8");
  const data = JSON.parse(rawData);

  const rawBookings = Object.entries(data.bookings);

  const cleanBookings = {};

  for (const [key, b] of rawBookings) {
    // trimStringFields(b);
    // addMissingFields(b);
    // normalizeStatus(b);
    // normalizeLegacyDateFields(b);
    // consolidateNotesFromMessage(b);
    // removeFields(b);
    renameHBookFields(b);

    cleanBookings[key] = sortBookingKeysByName(b);
  }

  // const sortedByDateEntries = Object.entries(cleanBookings).sort(
  //   ([, a], [, b]) => {
  //     const dateA = new Date(a.checkIn).getTime() || 0;
  //     const dateB = new Date(b.checkIn).getTime() || 0;
  //     return dateA - dateB;
  //   },
  // );

  // const finalSortedBookings = {};
  // for (const [key, value] of sortedByDateEntries) {
  //   finalSortedBookings[key] = value;
  // }

  data.bookings = cleanBookings;

  fs.writeFileSync(fileTarget, JSON.stringify(data, null, 2), "utf-8");

  console.log("Success: bookings are normalized.");
} catch (error) {
  console.error("An error occurred while processing the file:", error);
}
