// server.js

const http = require("http"); // For creating the server
const https = require("https"); // For fetching data from the API

// ✅ Always use process.env.PORT for Railway or fallback to 3000 locally
const PORT = process.env.PORT || 3000;

// This will be our in-memory storage for the photos
let photosData = [];

// ✅ Function to fetch data and store it without duplicates
function fetchPhotos() {
  https.get("https://jsonplaceholder.typicode.com/photos", (res) => {
    let data = "";

    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      try {
        const photos = JSON.parse(data);

        photos.forEach((photo) => {
          // Only push if not already stored
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

// ✅ Fetch once at startup
fetchPhotos();

// ✅ Then every 1 minute
setInterval(fetchPhotos, 60 * 1000);

// ✅ Create the server (only one)
const server = http.createServer((req, res) => {
  if (req.url === "/") {
    // Basic home route
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Server is live 🚀");
  } 
  else if (req.url.startsWith("/photos")) {
    // Handle query parameters manually
    const url = new URL(req.url, `http://${req.headers.host}`);
    const limit = parseInt(url.searchParams.get("limit")) || 10;
    const page = parseInt(url.searchParams.get("page")) || 1;
    const orderBy = url.searchParams.get("orderBy") || "id";

    // ✅ Sort
    let sortedPhotos = [...photosData].sort((a, b) => {
      if (a[orderBy] < b[orderBy]) return -1;
      if (a[orderBy] > b[orderBy]) return 1;
      return 0;
    });

    // ✅ Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPhotos = sortedPhotos.slice(startIndex, endIndex);

    // ✅ Respond with JSON
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
  } 
  else {
    // 404 route
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Not Found" }));
  }
});

// ✅ Start the server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
