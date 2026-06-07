const express = require("express");
const Document = require("../models/Document");
const upload = require("../middleware/uploadMiddleware");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Upload PDF document
router.post("/upload", authMiddleware, upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Please upload a PDF file",
      });
    }

    const document = await Document.create({
      title: req.body.title || req.file.originalname,
      fileName: req.file.filename,
      filePath: req.file.path,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      owner: req.user.id,
    });

    res.status(201).json({
      message: "PDF uploaded successfully",
      document,
    });
  } catch (error) {
    res.status(500).json({
      message: "Document upload failed",
      error: error.message,
    });
  }
});

module.exports = router;