const express = require("express");
const fs = require("fs");
const path = require("path");
const compressPDF = require("../utils/gsCompress");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { fileId, targetKB } = req.body;

    if (!fileId || !targetKB) {
      return res.status(400).json({ 
        error: "File ID and target size are required",
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

    const output = path.join("temp", `target-${fileId}`);
    
    // Quality levels from highest compression to lowest
    const qualityLevels = ["/screen", "/ebook", "/printer"];
    
    let bestOutput = null;
    let bestSizeKB = Infinity;

    for (const quality of qualityLevels) {
      const tempOutput = path.join("temp", `tmp-${quality.replace("/", "")}-${fileId}`);
      
      try {
        await compressPDF(input, tempOutput, quality);
        const sizeKB = Math.round(fs.statSync(tempOutput).size / 1024);

        if (sizeKB <= targetKB) {
          // Rename to final output
          fs.renameSync(tempOutput, output);
          bestOutput = output;
          bestSizeKB = sizeKB;
          
          // Delete other temp files
          qualityLevels.forEach(q => {
            const tmpFile = path.join("temp", `tmp-${q.replace("/", "")}-${fileId}`);
            if (fs.existsSync(tmpFile) && tmpFile !== tempOutput) {
              fs.unlinkSync(tmpFile);
            }
          });
          
          break;
        }

        // Keep track of smallest file
        if (sizeKB < bestSizeKB) {
          if (bestOutput && fs.existsSync(bestOutput)) {
            fs.unlinkSync(bestOutput);
          }
          bestOutput = tempOutput;
          bestSizeKB = sizeKB;
        } else {
          fs.unlinkSync(tempOutput);
        }
      } catch (err) {
        console.error(`Failed with quality ${quality}:`, err);
        if (fs.existsSync(tempOutput)) {
          fs.unlinkSync(tempOutput);
        }
      }
    }

    if (bestOutput) {
      if (bestOutput !== output) {
        fs.renameSync(bestOutput, output);
      }

      const originalSizeKB = Math.round(fs.statSync(input).size / 1024);
      const achieved = bestSizeKB <= targetKB;

      return res.json({
        success: true,
        status: achieved ? "target_achieved" : "closest_possible",
        fileId: `target-${fileId}`,
        downloadUrl: `/api/download/target-${fileId}`,
        targetKB: targetKB,
        achievedKB: bestSizeKB,
        originalSizeKB: originalSizeKB,
        message: achieved 
          ? `Successfully compressed to ${bestSizeKB} KB (target: ${targetKB} KB)`
          : `Closest achievable size is ${bestSizeKB} KB (target: ${targetKB} KB)`
      });
    }

    res.status(500).json({
      error: "Could not compress file to target size",
      success: false
    });

  } catch (err) {
    console.error("Target size compression error:", err);
    res.status(500).json({ 
      error: "Target size compression failed",
      message: err.message,
      success: false 
    });
  }
});

module.exports = router;
