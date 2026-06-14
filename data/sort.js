const fs = require('fs');

// Define the path to your JSON file
const filePath = './trinserhof-bookings-default-rtdb-export.json'; // Update this to match your actual filename

try {
  // 1. Read and parse the JSON file
  const rawData = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(rawData);

  // 2. Convert the bookings object into an array of entries: [ [key, value], [key, value] ]
  const bookingsEntries = Object.entries(data.bookings);

  // 3. Sort the array by checkIn date (Ascending: oldest first, newest last)
  bookingsEntries.sort((a, b) => {
    const dateA = new Date(a[1].checkIn);
    const dateB = new Date(b[1].checkIn);
    return dateA - dateB; 
  });

  // 4. Reconstruct the object in the sorted order
  const sortedBookings = {};
  for (const [key, value] of bookingsEntries) {
    sortedBookings[key] = value;
  }

  // 5. Overwrite the old bookings object with the sorted one
  data.bookings = sortedBookings;

  // 6. Write the sorted data back to the file (with 2 spaces for readable formatting)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');

  console.log('Success: Bookings have been sorted by check-in date!');

} catch (error) {
  console.error('An error occurred while processing the file:', error);
}