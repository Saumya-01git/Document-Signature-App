const express = require("express");
const Signature = require("../models/Signature");
const Document = require("../models/Document");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Save signature position
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { documentId, x, y, page } = req.body;

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
    const { x, y, page } = req.body;

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


module.exports = router;