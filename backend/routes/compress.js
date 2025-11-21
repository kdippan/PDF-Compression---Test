const express = require("express");
const path = require("path");
const fs = require("fs");
const compressPDF = require("../utils/gsCompress");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { fileId, quality } = req.body;

    if (!fileId) {
      return res.status(400).json({ 
        error: "File ID is required",
        success: false 
      });
    }

    const input = path.join("temp", fileId);
    
    if (!fs.existsSync(input)) {
      return res.status(404).json({ 
        error: "File not found",
        success: false 
      });
    }

    const output = path.join("temp", `compressed-${fileId}`);
    const qualityLevel = quality || "/ebook";

    // Get original file size
    const originalSize = fs.statSync(input).size;
    const originalSizeKB = Math.round(originalSize / 1024);

    await compressPDF(input, output, qualityLevel);

    // Get compressed file size
    const compressedSize = fs.statSync(output).size;
    const compressedSizeKB = Math.round(compressedSize / 1024);
    const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(1);

    res.json({
      success: true,
      status: "compressed",
      fileId: `compressed-${fileId}`,
      downloadUrl: `/api/download/compressed-${fileId}`,
      originalSizeKB: originalSizeKB,
      compressedSizeKB: compressedSizeKB,
      compressionRatio: `${compressionRatio}%`,
      quality: qualityLevel
    });
  } catch (err) {
    console.error("Compression error:", err);
    res.status(500).json({ 
      error: "Compression failed",
      message: err.message,
      success: false 
    });
  }
});

module.exports = router;
