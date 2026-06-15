const express = require("express");
const SignRequest = require("../models/SignRequest");
const Document = require("../models/Document");
const authMiddleware = require("../middleware/authMiddleware");
const crypto = require("crypto");

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
    
    const signingToken = crypto.randomBytes(32).toString("hex");

const signingLink = `http://localhost:5173/sign/${signingToken}`;


    const signRequest = await SignRequest.create({
  documentId,
  sender: req.user.id,
  signerEmail,
  signingToken,
  signingLink,
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


// Update signing request status
router.put("/public/:token/status", async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;

    const request = await SignRequest.findOne({
      signingToken: req.params.token,
    });

    if (!request) {
      return res.status(404).json({
        message: "Invalid signing link",
      });
    }

    request.status = status;

    if (status === "Rejected") {
      request.rejectionReason =
        rejectionReason || "";
    }

    await request.save();

    res.status(200).json({
      message: "Signing request updated successfully",
      request,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update signing request",
      error: error.message,
    });
  }
});


// Get all signing requests created by user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const requests = await SignRequest.find({
      sender: req.user.id,
    });

    res.status(200).json({
      message: "Signing requests fetched successfully",
      count: requests.length,
      requests,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch signing requests",
      error: error.message,
    });
  }
});

// Get document through signing token
router.get("/public/:token/document", async (req, res) => {
  try {
    const request = await SignRequest.findOne({
      signingToken: req.params.token,
    });

    if (!request) {
      return res.status(404).json({
        message: "Invalid signing link",
      });
    }

    const document = await Document.findById(
      request.documentId
    );

    res.status(200).json({
      message: "Document fetched successfully",
      document,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch document",
      error: error.message,
    });
  }
});


// Public access by signing token
router.get("/public/:token", async (req, res) => {
  try {
    const request = await SignRequest.findOne({
      signingToken: req.params.token,
    });

    if (!request) {
      return res.status(404).json({
        message: "Invalid signing link",
      });
    }

    res.status(200).json({
      message: "Signing link valid",
      request,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to verify signing link",
      error: error.message,
    });
  }
});

// Get single signing request
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const request = await SignRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        message: "Signing request not found",
      });
    }

    res.status(200).json({
      message: "Signing request fetched successfully",
      request,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch signing request",
      error: error.message,
    });
  }
});


module.exports = router;