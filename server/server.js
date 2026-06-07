const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const authRoutes = require("./routes/authRoutes");
const connectDB = require("./config/db");
const authMiddleware = require("./middleware/authMiddleware");
const documentRoutes = require("./routes/documentRoutes");

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/docs", documentRoutes);

app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({
    message: "Protected route accessed successfully",
    user: req.user,
  });
});

app.get("/", (req, res) => {
  res.send("Document Signature App Backend Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});