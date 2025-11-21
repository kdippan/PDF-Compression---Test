const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

router.get("/", (req, res) => {
  try {
    const dir = "temp/";
    const now = Date.now();
    const deleteAfter = parseInt(process.env.DELETE_AFTER_MINUTES || 30) * 60 * 1000;

    let deletedCount = 0;
    let errorCount = 0;

    fs.readdir(dir, (err, files) => {
      if (err) {
        return res.status(500).json({ 
          error: "Cleanup failed",
          message: err.message,
          success: false 
        });
      }

      if (files.length === 0) {
        return res.json({ 
          status: "cleanup complete",
          deletedFiles: 0,
          message: "No files to delete",
          success: true 
        });
      }

      let processed = 0;

      files.forEach(file => {
        const filePath = path.join(dir, file);
        
        fs.stat(filePath, (err, stats) => {
          if (err) {
            errorCount++;
            processed++;
            if (processed === files.length) {
              sendResponse();
            }
            return;
          }

          if (now - stats.mtimeMs > deleteAfter) {
            fs.unlink(filePath, (err) => {
              if (err) {
                errorCount++;
              } else {
                deletedCount++;
                console.log(`Deleted: ${file}`);
              }
              processed++;
              if (processed === files.length) {
                sendResponse();
              }
            });
          } else {
            processed++;
            if (processed === files.length) {
              sendResponse();
            }
          }
        });
      });

      function sendResponse() {
        res.json({ 
          status: "cleanup complete",
          deletedFiles: deletedCount,
          errors: errorCount,
          totalFiles: files.length,
          success: true 
        });
      }
    });
  } catch (err) {
    console.error("Cleanup error:", err);
    res.status(500).json({ 
      error: "Cleanup failed",
      message: err.message,
      success: false 
    });
  }
});

module.exports = router;
