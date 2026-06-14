const fs = require("fs");

const filePath = "./trinserhof-bookings-default-rtdb-export.json";

try {
  // 1. Read and parse the JSON file
  const rawData = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(rawData);

  // 2. Convert the bookings object into an array of entries: [ [key, value], [key, value] ]
  const bookings = Object.entries(data.bookings);

  // 3. Sort the array by checkIn date (Ascending: oldest first, newest last)
  bookings.sort((a, b) => {
    const dateA = new Date(a[1].checkIn);
    const dateB = new Date(b[1].checkIn);
    return dateA - dateB;
  });

  // 4. Reconstruct the object in the sorted order and trim specific fields
  const cleanBookings = {};
  for (const [key, b] of bookings) {
    // Trim specified fields if they exist and are strings
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

    cleanBookings[key] = b;
  }

  // 5. Overwrite the old bookings object with the sorted one
  data.bookings = cleanBookings;

  // 6. Write the sorted data back to the file (with 2 spaces for readable formatting)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");

  console.log("Success: Bookings have been sorted and string fields trimmed!");
} catch (error) {
  console.error("An error occurred while processing the file:", error);
}
