const BwipJs = require("bwip-js");

const getBarcode = async (req, res, next) => {
    try {
        const { text = "1234567890", format = "code128" } = req.query;

        // Generate barcode as PNG
        const png = await BwipJs.toBuffer({
            bcid: format,          // Barcode type (code128, ean13, qrcode, etc.)
            text: text,            // Data to encode
            scale: 3,              // 3x scaling factor
            height: 10,            // Bar height, in millimeters
            includetext: true,     // Show human-readable text
            textxalign: "center",  // Centered text
        });

        // Set response headers
        res.set("Content-Type", "image/png");
        res.send(png);
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getBarcode
};