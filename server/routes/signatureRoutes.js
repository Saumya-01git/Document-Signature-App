const express = require("express");
const Signature = require("../models/Signature");
const Document = require("../models/Document");
const authMiddleware = require("../middleware/authMiddleware");
const fs = require("fs");
const path = require("path");
const { PDFDocument, rgb, degrees } = require("pdf-lib");
const router = express.Router();

// Save signature position
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
  documentId,
  x,
  y,
  page,
  signatureText,
  fontStyle,
  rotation,
} = req.body;

    if (!documentId || x === undefined || y === undefined) {
      return res.status(400).json({
        message: "Document ID, x and y coordinates are required",
      });
    }

    const document = await Document.findOne({
      _id: documentId,
      owner: req.user.id,
    });

    if (!document) {
      return res.status(404).json({
        message: "Document not found or unauthorized",
      });
    }

    const signature = await Signature.create({
      documentId,
      signer: req.user.id,
      x,
      y,
      page: page || 1,
      signatureText: signatureText || "Signed by SignFlow",
      fontStyle: fontStyle || "Arial",
      rotation: rotation || 0,
    });

    res.status(201).json({
      message: "Signature position saved successfully",
      signature,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to save signature position",
      error: error.message,
    });
  }
});

// Get signatures for a document
router.get("/:documentId", authMiddleware, async (req, res) => {
  try {
    const signatures = await Signature.find({
      documentId: req.params.documentId,
    });

    res.status(200).json({
      message: "Signatures fetched successfully",
      count: signatures.length,
      signatures,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch signatures",
      error: error.message,
    });
  }
});

// Update signature coordinates after drag
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { x, y, page, signatureText, fontStyle, rotation } = req.body;

    const signature = await Signature.findOne({
      _id: req.params.id,
      signer: req.user.id,
    });

    if (!signature) {
      return res.status(404).json({
        message: "Signature not found or unauthorized",
      });
    }

    signature.x = x;
    signature.y = y;
    if (page) signature.page = page;
    if (signatureText !== undefined) signature.signatureText = signatureText;
    if (fontStyle !== undefined) signature.fontStyle = fontStyle;
    if (rotation !== undefined) signature.rotation = rotation;

    await signature.save();

    res.status(200).json({
      message: "Signature coordinates updated successfully",
      signature,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update signature coordinates",
      error: error.message,
    });
  }
});

// Generate final signed PDF
router.post("/finalize", authMiddleware, async (req, res) => {
  try {
    const { documentId } = req.body;

    const document = await Document.findOne({
      _id: documentId,
      owner: req.user.id,
    });

    if (!document) {
      return res.status(404).json({
        message: "Document not found or unauthorized",
      });
    }

    const signatures = await Signature.find({ documentId });

    if (signatures.length === 0) {
      return res.status(400).json({
        message: "No signatures found for this document",
      });
    }

    const pdfPath = path.join(__dirname, "..", document.filePath);
    const pdfBytes = fs.readFileSync(pdfPath);

    const pdfDoc = await PDFDocument.load(pdfBytes);

    signatures.forEach((sig) => {
      const page = pdfDoc.getPages()[sig.page - 1];

      if (page) {
        const pageHeight = page.getHeight();

        page.drawText(sig.signatureText || "Signed by SignFlow", {
          x: sig.x,
          y: pageHeight - sig.y - 20,
          size: 18,
          rotate: degrees(sig.rotation || 0),
          color: rgb(1, 0, 0),
        });
      }
    });

    const signedPdfBytes = await pdfDoc.save();

    const signedDir = path.join(__dirname, "..", "uploads", "signed");

    if (!fs.existsSync(signedDir)) {
      fs.mkdirSync(signedDir);
    }

    const signedFileName = `signed-${Date.now()}-${document.fileName}`;
    const signedFilePath = path.join(signedDir, signedFileName);

    fs.writeFileSync(signedFilePath, signedPdfBytes);

    document.status = "Signed";
    await document.save();

    await Signature.updateMany(
      { documentId },
      { status: "Signed" }
    );

    res.status(200).json({
      message: "Final signed PDF generated successfully",
      signedPdf: `uploads/signed/${signedFileName}`,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to generate signed PDF",
      error: error.message,
    });
  }
});


module.exports = router;