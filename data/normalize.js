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
    typeof b.status === "string" && b.status !== ""
      ? b.status.toUpperCase()
      : "UNKNOWN";

  const statusMap = {
    MAYBE: "PENDING",
    NEW: "CONFIRMED",
    EMPLOYEE: "BLOCKED",
    PAID: "CONFIRMED",
  };

  b.status = statusMap[b.status] ?? b.status;
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
  for (const field of [
    "accom_num",
    "accom_price",
    "additional_info",
    "admin_comment",
    "adults",
    "alphanum_id",
    "amount_to_pay",
    "babies",
    "booking_form_num",
    "channel",
    "children",
    "className",
    "coupon_value",
    "coupon",
    "currency",
    "customer_id",
    "deleted",
    "deposit",
    "discount",
    "fees",
    "id",
    "invoice_counter",
    "lang",
    "nb_emails_sent",
    "options",
    "origin_url",
    "origin",
    "paid",
    "parent_id",
    "payment_delayed",
    "payment_failed",
    "payment_gateway",
    "payment_info",
    "payment_status_reason",
    "payment_status",
    "payment_token",
    "payment_type",
    "payments_logs",
    "pets",
    "previous_price",
    "price",
    "priceFixed",
    "received_on",
    "synchro_id",
    "uid",
    "updated_on",
    "updated",
    "updatedBy",
  ]) {
    delete b[field];
  }
}

const ACCOM_ID_TO_ROOM_ID = {
  31: "101",
  81: "102",
  82: "103",
  83: "104",
  84: "106",
  85: "107",
  86: "108",
  87: "109",
  88: "110",
  89: "111",
  90: "112",
  91: "113",
  93: "114",
  94: "116",
  95: "117",
  96: "118",
  97: "119",
  98: "121",
  99: "124",
};

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

  if (typeof b.start !== "undefined") {
    if (typeof b.checkIn === "undefined") {
      b.checkIn = b.start;
    }
    delete b.start;
  }

  if (typeof b.end !== "undefined") {
    if (typeof b.checkOut === "undefined") {
      b.checkOut = b.end;
    }
    delete b.end;
  }

  if (typeof b.accom_id !== "undefined") {
    if (typeof b.roomId === "undefined") {
      b.roomId = ACCOM_ID_TO_ROOM_ID[b.accom_id] ?? "comment";
    }
    delete b.accom_id;
  }
}

function sortBookingKeysByName(b) {
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
    if (b.deleted === true) continue;

    // trimStringFields(b);
    // addMissingFields(b);
    normalizeStatus(b);
    // consolidateNotesFromMessage(b);
    removeFields(b);
    renameHBookFields(b);

    if (b.status === "CONFIRMED") {
      cleanBookings[key] = sortBookingKeysByName(b);
    }
  }

  const sortedByDateEntries = Object.entries(cleanBookings).sort(
    ([, a], [, b]) => {
      const dateA = new Date(a.checkIn).getTime() || 0;
      const dateB = new Date(b.checkIn).getTime() || 0;
      return dateA - dateB;
    },
  );

  const finalSortedBookings = {};
  for (const [key, value] of sortedByDateEntries) {
    finalSortedBookings[key] = value;
  }

  data.bookings = finalSortedBookings;

  fs.writeFileSync(fileTarget, JSON.stringify(data, null, 2), "utf-8");

  console.log("Success: bookings are normalized.");
} catch (error) {
  console.error("An error occurred while processing the file:", error);
}
