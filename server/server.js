const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const authRoutes = require("./routes/authRoutes");
const connectDB = require("./config/db");
const authMiddleware = require("./middleware/authMiddleware");
const documentRoutes = require("./routes/documentRoutes");
const path = require("path");
const signatureRoutes = require("./routes/signatureRoutes");
const signRequestRoutes = require("./routes/signRequestRoutes");
const auditRoutes = require("./routes/auditRoutes");

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/docs", documentRoutes);
app.use("/api/signatures", signatureRoutes);
app.use("/api/sign-requests", signRequestRoutes);
app.use("/api/audit", auditRoutes);

app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({
    message: "Protected route accessed successfully",
    user: req.user,
  });
});

app.get("/", (req, res) => {
  res.send("Document Signature App Backend Running");
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "SignFlow API is running",
    timestamp: new Date(),
  });
});

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});