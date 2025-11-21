const { exec } = require("child_process");
const fs = require("fs");

/**
 * Compress PDF using GhostScript
 * @param {string} input - Input file path
 * @param {string} output - Output file path
 * @param {string} quality - Quality preset (/screen, /ebook, /printer, /prepress)
 * @returns {Promise<string>} - Output file path
 */
function compressPDF(input, output, quality = "/ebook") {
  return new Promise((resolve, reject) => {
    // Check if input file exists
    if (!fs.existsSync(input)) {
      return reject(new Error("Input file not found"));
    }

    const cmd = `gs -sDEVICE=pdfwrite \
      -dCompatibilityLevel=1.4 \
      -dPDFSETTINGS=${quality} \
      -dNOPAUSE -dQUIET -dBATCH \
      -dColorImageResolution=150 \
      -dGrayImageResolution=150 \
      -dMonoImageResolution=150 \
      -sOutputFile="${output}" "${input}"`;

    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error("GhostScript error:", error);
        return reject(error);
      }

      // Check if output file was created
      if (fs.existsSync(output)) {
        resolve(output);
      } else {
        reject(new Error("Compression failed - output file not created"));
      }
    });
  });
}

module.exports = compressPDF;
