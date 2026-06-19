const express = require("express");
const SignRequest = require("../models/SignRequest");
const Document = require("../models/Document");
const authMiddleware = require("../middleware/authMiddleware");
const crypto = require("crypto");
const AuditLog = require("../models/AuditLog");
const Signature = require("../models/Signature");

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
    const {
  status,
  rejectionReason,
  signatureText,
  fontStyle,
  rotation,
  x,
  y,
  page,
} = req.body;

    const request = await SignRequest.findOne({
      signingToken: req.params.token,
    });

    if (!request) {
      return res.status(404).json({
        message: "Invalid signing link",
      });
    }

    if (!["Pending", "Signed", "Rejected"].includes(status)) {
  return res.status(400).json({
    message: "Invalid status value",
  });
}

request.status = status;

if (status === "Signed") {
  if (!signatureText || x === undefined || y === undefined) {
    return res.status(400).json({
      message: "Signature text and position are required before signing",
    });
  }

  await Signature.create({
    documentId: request.documentId,
    signer: request.sender,
    x,
    y,
    page: page || 1,
    signatureText,
    fontStyle: fontStyle || "Arial",
    rotation: rotation || 0,
    status: "Signed",
  });
}

if (status === "Rejected") {
  request.rejectionReason = rejectionReason || "";
} else {
  request.rejectionReason = "";
}

await request.save();


const allRequests = await SignRequest.find({
  documentId: request.documentId,
});

let documentStatus = "Pending";

const hasRejected = allRequests.some(
  (req) => req.status === "Rejected"
);

const allSigned = allRequests.every(
  (req) => req.status === "Signed"
);

const someSigned = allRequests.some(
  (req) => req.status === "Signed"
);

if (hasRejected) {
  documentStatus = "Rejected";
} else if (allSigned) {
  documentStatus = "Signed";
} else if (someSigned) {
  documentStatus = "Partially Signed";
}

await Document.findByIdAndUpdate(request.documentId, {
  status: documentStatus,
});

    await AuditLog.create({
  documentId: request.documentId,
  action: `Signing request ${status}`,
  userEmail: request.signerEmail,
  ipAddress: req.ip,
});

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

// Get existing signatures through signing token
router.get("/public/:token/signatures", async (req, res) => {
  try {
    const request = await SignRequest.findOne({
      signingToken: req.params.token,
    });

    if (!request) {
      return res.status(404).json({
        message: "Invalid signing link",
      });
    }

    const signatures = await Signature.find({
      documentId: request.documentId,
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