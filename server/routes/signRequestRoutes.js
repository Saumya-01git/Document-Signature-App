const express = require("express");
const SignRequest = require("../models/SignRequest");
const Document = require("../models/Document");
const authMiddleware = require("../middleware/authMiddleware");
const crypto = require("crypto");
const AuditLog = require("../models/AuditLog");
const Signature = require("../models/Signature");
const sendSigningEmail = require("../utils/sendEmail");

const router = express.Router();

// Create sequential signing workflow
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      documentId,
      signerEmail,
      witnessEmail,
      approverEmail,
    } = req.body;

    const signerEmails = signerEmail
  .split(",")
  .map((email) => email.trim())
  .filter((email) => email !== "");

    if (!documentId || signerEmails.length === 0) {
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

    const workflowRecipients = signerEmails.map((email) => ({
  email,
  role: "Signer",
  roleOrder: 1,
  emailSent: true,
}));

    if (witnessEmail) {
      workflowRecipients.push({
        email: witnessEmail,
        role: "Witness",
        roleOrder: 2,
        emailSent: false,
      });
    }

    if (approverEmail) {
      workflowRecipients.push({
        email: approverEmail,
        role: "Approver",
        roleOrder: witnessEmail ? 3 : 2,
        emailSent: false,
      });
    }

    const createdRequests = [];

    for (const recipient of workflowRecipients) {
      const signingToken = crypto.randomBytes(32).toString("hex");
      const signingLink = `http://localhost:5173/sign/${signingToken}`;

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const signRequest = await SignRequest.create({
        documentId,
        sender: req.user.id,
        signerEmail: recipient.email,
        role: recipient.role,
        roleOrder: recipient.roleOrder,
        emailSent: recipient.emailSent,
        signingToken,
        signingLink,
        expiresAt,
      });

      createdRequests.push(signRequest);

      if (recipient.emailSent) {
        await sendSigningEmail(
  recipient.email,
  signingLink,
  recipient.role
);
      }
    }

    res.status(201).json({
      message:
        "Workflow created successfully. Email sent to signer first.",
      count: createdRequests.length,
      signRequests: createdRequests,
      signRequest: createdRequests[0],
    });
  } catch (error) {
    console.log("CREATE WORKFLOW ERROR:", error);

    res.status(500).json({
      message: "Failed to create workflow",
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
    if (request.expiresAt && new Date() > request.expiresAt) {
  return res.status(400).json({
    message: "Signing link has expired",
  });
}

    if (!["Pending", "Signed", "Rejected"].includes(status)) {
  return res.status(400).json({
    message: "Invalid status value",
  });
}

const allRequestsForDocument = await SignRequest.find({
  documentId: request.documentId,
});

const hasRejected = allRequestsForDocument.some(
  (req) => req.status === "Rejected"
);

if (hasRejected) {
  return res.status(400).json({
    message: "This document has already been rejected. No further action is allowed.",
  });
}

const previousRequests = allRequestsForDocument.filter(
  (req) => req.roleOrder < request.roleOrder
);

const pendingPrevious = previousRequests.find(
  (req) => req.status !== "Signed"
);

if (pendingPrevious) {
  return res.status(403).json({
    message: `Waiting for ${pendingPrevious.role} to complete first.`,
  });
}


request.status = status;

if (status === "Signed" && request.role === "Signer") {
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

if (status === "Signed") {
  const nextRequest = await SignRequest.findOne({
    documentId: request.documentId,
    status: "Pending",
    roleOrder: { $gt: request.roleOrder },
    emailSent: false,
  }).sort({ roleOrder: 1 });

  if (nextRequest) {
    await sendSigningEmail(
  nextRequest.signerEmail,
  nextRequest.signingLink,
  nextRequest.role
);

    nextRequest.emailSent = true;
    await nextRequest.save();
  }
}


const allRequests = await SignRequest.find({
  documentId: request.documentId,
});

let documentStatus = "Pending";

const documentHasRejected = allRequests.some(
  (req) => req.status === "Rejected"
);

const allSigned = allRequests.every(
  (req) => req.status === "Signed"
);

const someSigned = allRequests.some(
  (req) => req.status === "Signed"
);

if (documentHasRejected) {
  documentStatus = "Rejected";
}else if (allSigned) {
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
    if (request.expiresAt && new Date() > request.expiresAt) {
  return res.status(400).json({
    message: "Signing link has expired",
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
    if (request.expiresAt && new Date() > request.expiresAt) {
  return res.status(400).json({
    message: "Signing link has expired",
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
    if (request.expiresAt && new Date() > request.expiresAt) {
  return res.status(400).json({
    message: "Signing link has expired",
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


// Delete signing request
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const request = await SignRequest.findOne({
      _id: req.params.id,
      sender: req.user.id,
    });

    if (!request) {
      return res.status(404).json({
        message: "Signing request not found or unauthorized",
      });
    }

    await SignRequest.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Signing request deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete signing request",
      error: error.message,
    });
  }
});


// Get signing progress for a document
router.get("/progress/:documentId", authMiddleware, async (req, res) => {
  try {
    const requests = await SignRequest.find({
      documentId: req.params.documentId,
    });

    const total = requests.length;

    const signed = requests.filter(
      (r) => r.status === "Signed"
    ).length;

    const pending = requests.filter(
      (r) => r.status === "Pending"
    ).length;

    const rejected = requests.filter(
      (r) => r.status === "Rejected"
    ).length;

    const percentage =
      total === 0
        ? 0
        : Math.round((signed / total) * 100);

    res.status(200).json({
      total,
      signed,
      pending,
      rejected,
      percentage,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch progress",
      error: error.message,
    });
  }
});

// Resend signing request email
router.post("/:id/resend", authMiddleware, async (req, res) => {
  try {
    const request = await SignRequest.findOne({
      _id: req.params.id,
      sender: req.user.id,
    });

    if (!request) {
      return res.status(404).json({
        message: "Signing request not found or unauthorized",
      });
    }

    if (request.status !== "Pending") {
      return res.status(400).json({
        message: "Only pending signing requests can be resent",
      });
    }

    await sendSigningEmail(
      request.signerEmail,
      request.signingLink
    );

    res.status(200).json({
      message: "Signing request email resent successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to resend signing request",
      error: error.message,
    });
  }
});

// Get signing requests for a specific document
router.get(
  "/document/:documentId",
  authMiddleware,
  async (req, res) => {
    try {
      const requests = await SignRequest.find({
        documentId: req.params.documentId,
        sender: req.user.id,
      });

      res.status(200).json({
        message:
          "Document signing requests fetched successfully",
        count: requests.length,
        requests,
      });
    } catch (error) {
      res.status(500).json({
        message:
          "Failed to fetch document signing requests",
        error: error.message,
      });
    }
  }
);

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

// Cleanup orphan signing requests
router.delete("/cleanup/orphans", authMiddleware, async (req, res) => {
  try {
    const requests = await SignRequest.find({
      sender: req.user.id,
    });

    let deletedCount = 0;

    for (const request of requests) {
      const document = await Document.findById(request.documentId);

      if (!document) {
        await SignRequest.findByIdAndDelete(request._id);
        deletedCount++;
      }
    }

    res.status(200).json({
      message: "Orphan signing requests cleaned",
      deletedCount,
    });
  } catch (error) {
    res.status(500).json({
      message: "Cleanup failed",
      error: error.message,
    });
  }
});

module.exports = router;