const express = require("express");
const path = require("path");
const fs = require("fs");

const router = express.Router();

router.get("/:id", (req, res) => {
  try {
    const fileId = req.params.id;
    const filePath = path.join(__dirname, "..", "temp", fileId);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        error: "File not found",
        success: false 
      });
    }

    // Set download headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="compressed-${fileId}"`);
    
    res.download(filePath, `compressed-${fileId}`, (err) => {
      if (err) {
        console.error("Download error:", err);
        if (!res.headersSent) {
          res.status(500).json({ 
            error: "Download failed",
            success: false 
          });
        }
      }
    });
  } catch (err) {
    console.error("Download error:", err);
    res.status(500).json({ 
      error: "Download failed",
      message: err.message,
      success: false 
    });
  }
});

module.exports = router;
