// server.js

const http = require("http"); // to create the server
const https = require("https"); // to fetch data from the given API

// This will be our memory storage for the photos
let photosData = [];

// Function to fetch data from the API and store it in memory
function fetchPhotos() {
  https.get("https://jsonplaceholder.typicode.com/photos", (res) => {
    let data = "";

    // Read the data chunks
    res.on("data", (chunk) => {
      data += chunk;
    });

    // When all data is received
    res.on("end", () => {
      try {
        const photos = JSON.parse(data);

        // Add photos without duplicates
        photos.forEach((photo) => {
          // Check if photo already exists
          if (!photosData.find((p) => p.id === photo.id)) {
            photosData.push(photo);
          }
        });

        console.log("✅ Data fetched. Total photos stored:", photosData.length);
      } catch (err) {
        console.log("❌ Error parsing data:", err.message);
      }
    });
  }).on("error", (err) => {
    console.log("❌ Error fetching data:", err.message);
  });
}

// Call fetchPhotos immediately on startup
fetchPhotos();

// Then call it every 1 minute (60,000 ms)
setInterval(fetchPhotos, 60 * 1000);

// Create a simple HTTP server
const server = http.createServer((req, res) => {
  // Our endpoint will be /photos
  if (req.url.startsWith("/photos")) {
    // Parse query parameters manually
    const url = new URL(req.url, `http://${req.headers.host}`);
    const limit = parseInt(url.searchParams.get("limit")) || 10;
    const page = parseInt(url.searchParams.get("page")) || 1;
    const orderBy = url.searchParams.get("orderBy") || "id";

    // Sort the data based on orderBy
    let sortedPhotos = [...photosData].sort((a, b) => {
      if (a[orderBy] < b[orderBy]) return -1;
      if (a[orderBy] > b[orderBy]) return 1;
      return 0;
    });

    // Paginate the data
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPhotos = sortedPhotos.slice(startIndex, endIndex);

    // Return JSON response
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        total: photosData.length,
        page,
        limit,
        orderBy,
        data: paginatedPhotos,
      })
    );
  } else {
    // If endpoint not found
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Not Found" }));
  }
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
