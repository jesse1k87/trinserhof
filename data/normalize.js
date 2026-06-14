const fs = require("fs");

const filePath = "./bookings.json";

try {
  const rawData = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(rawData);

  const bookings = Object.entries(data.bookings);

  const cleanBookings = {};
  for (const [key, b] of bookings) {
    if (typeof b.name === "string") b.name = b.name.trim();
    if (typeof b.content === "string") b.content = b.content.trim();
    if (typeof b.notes === "string") b.notes = b.notes.trim();
    if (typeof b.message === "string") b.message = b.message.trim();
    if (typeof b.email === "string") b.email = b.email.trim();

    b.adults = b.adults ?? 0;
    b.children = b.children ?? 0;
    b.babies = b.babies ?? 0;
    b.pets = b.pets ?? 0;
    b.price = isNaN(b.price) ? 0 : b.price;

    b.status =
      typeof b.status === "string" ? b.status.toUpperCase() : "NO_STATUS";
    if (b.status === "MAYBE") b.status = "PENDING";

    if (typeof b.checkIn === "undefined" && typeof b.start !== "undefined") {
      b.checkIn = b.start;
      delete b.start;
    }

    if (typeof b.checkOut === "undefined" && typeof b.end !== "undefined") {
      b.checkOut = b.end;
      delete b.end;
    }

    b.notes =
      typeof b.notes === "string" && b.notes !== ""
        ? b.notes
        : typeof b.message === "string"
          ? b.message
          : "";

    if (typeof b.message === "string" && b.message === "") {
      delete b.message;
    }

    delete b.channel;

    const sortedBookingKeys = Object.keys(b).sort();
    const sortedBooking = {};
    for (const prop of sortedBookingKeys) {
      sortedBooking[prop] = b[prop];
    }

    cleanBookings[key] = sortedBooking;
  }

  data.bookings = cleanBookings;

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");

  console.log("Success: Bookings have been sorted and string fields trimmed!");
} catch (error) {
  console.error("An error occurred while processing the file:", error);
}
