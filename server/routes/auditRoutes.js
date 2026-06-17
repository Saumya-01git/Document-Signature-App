const express = require("express");
const AuditLog = require("../models/AuditLog");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Get audit logs for a document
router.get("/:docId", authMiddleware, async (req, res) => {
  try {
    const logs = await AuditLog.find({
      documentId: req.params.docId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      message: "Audit logs fetched successfully",
      count: logs.length,
      logs,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch audit logs",
      error: error.message,
    });
  }
});

module.exports = router;