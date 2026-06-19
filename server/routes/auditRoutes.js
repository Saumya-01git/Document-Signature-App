const express = require("express");
const AuditLog = require("../models/AuditLog");
const authMiddleware = require("../middleware/authMiddleware");
const { PDFDocument, rgb } = require("pdf-lib");

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

// Download audit report PDF
router.get("/:docId/report", authMiddleware, async (req, res) => {
  try {
    const logs = await AuditLog.find({
      documentId: req.params.docId,
    }).sort({ createdAt: 1 });

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);

    let y = 750;

    page.drawText("SignFlow Audit Report", {
      x: 50,
      y,
      size: 20,
      color: rgb(0, 0, 0),
    });

    y -= 40;

    page.drawText(`Document ID: ${req.params.docId}`, {
      x: 50,
      y,
      size: 12,
    });

    y -= 30;

    logs.forEach((log, index) => {
      if (y < 80) return;

      page.drawText(`${index + 1}. ${log.action}`, {
        x: 50,
        y,
        size: 12,
      });

      y -= 18;

      page.drawText(`User: ${log.userEmail || "N/A"}`, {
        x: 70,
        y,
        size: 10,
      });

      y -= 15;

      page.drawText(`IP: ${log.ipAddress || "N/A"}`, {
        x: 70,
        y,
        size: 10,
      });

      y -= 15;

      page.drawText(
        `Time: ${new Date(log.createdAt).toLocaleString()}`,
        {
          x: 70,
          y,
          size: 10,
        }
      );

      y -= 30;
    });

    const pdfBytes = await pdfDoc.save();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=audit-report.pdf"
    );

    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    res.status(500).json({
      message: "Failed to generate audit report",
      error: error.message,
    });
  }
});

module.exports = router;