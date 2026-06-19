const mongoose = require("mongoose");

const signRequestSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    signerEmail: {
      type: String,
      required: true,
    },

    signingToken: {
  type: String,
  required: true,
},

signingLink: {
  type: String,
},

   status: {
  type: String,
  enum: ["Pending", "Signed", "Rejected"],
  default: "Pending",
},

rejectionReason: {
  type: String,
  default: "",
},
expiresAt: {
  type: Date,
},
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("SignRequest", signRequestSchema);