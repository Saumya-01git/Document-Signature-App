const express = require("express");
const SignRequest = require("../models/SignRequest");
const Document = require("../models/Document");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Create signing request
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { documentId, signerEmail } = req.body;

    if (!documentId || !signerEmail) {
      return res.status(400).json({
        message: "Document ID and signer email are required",
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

    const signRequest = await SignRequest.create({
      documentId,
      sender: req.user.id,
      signerEmail,
    });

    res.status(201).json({
      message: "Signing request created successfully",
      signRequest,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create signing request",
      error: error.message,
    });
  }
});

module.exports = router;