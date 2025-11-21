const express = require("express");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

const router = express.Router();

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "temp/");
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}${ext}`);
  }
});

// File filter - only PDFs
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"), false);
  }
};

// Multer config
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024 // 100MB default
  }
}).array("files", parseInt(process.env.MAX_FILES) || 3);

router.post("/", (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ 
        error: err.message || "Upload failed",
        success: false 
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        error: "No files uploaded",
        success: false 
      });
    }

    const files = req.files.map(f => ({
      id: f.filename,
      originalName: f.originalname,
      size: f.size,
      sizeKB: Math.round(f.size / 1024),
      sizeMB: (f.size / (1024 * 1024)).toFixed(2),
      path: f.path
    }));

    res.json({ 
      success: true,
      status: "uploaded", 
      files: files,
      count: files.length
    });
  });
});

module.exports = router;
