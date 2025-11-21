const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const uploadRoute = require("./routes/upload");
const compressRoute = require("./routes/compress");
const targetSizeRoute = require("./routes/targetSize");
const downloadRoute = require("./routes/download");
const cleanupRoute = require("./routes/cleanup");

const app = express();

// Create temp folder if not exists
if (!fs.existsSync("temp")) {
  fs.mkdirSync("temp");
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for download
app.use("/temp", express.static("temp"));

// Routes
app.use("/api/upload", uploadRoute);
app.use("/api/compress", compressRoute);
app.use("/api/compress/target-size", targetSizeRoute);
app.use("/api/download", downloadRoute);
app.use("/api/cleanup", cleanupRoute);

// Health check
app.get("/", (req, res) => {
  res.json({ 
    status: "running", 
    service: "PDF Compressor API",
    version: "1.0.0"
  });
});

// Auto cleanup every 10 minutes
setInterval(() => {
  const dir = "temp/";
  const now = Date.now();
  const deleteAfter = parseInt(process.env.DELETE_AFTER_MINUTES) * 60 * 1000;

  fs.readdir(dir, (err, files) => {
    if (err) return;
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      fs.stat(filePath, (err, stats) => {
        if (err) return;
        if (now - stats.mtimeMs > deleteAfter) {
          fs.unlink(filePath, (err) => {
            if (!err) console.log(`Auto-deleted: ${file}`);
          });
        }
      });
    });
  });
}, 10 * 60 * 1000); // Run every 10 minutes

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ PDF Compressor API running on port ${PORT}`);
  console.log(`🌐 http://localhost:${PORT}`);
});
