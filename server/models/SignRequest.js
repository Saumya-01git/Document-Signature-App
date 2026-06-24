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

    role: {
  type: String,
  enum: ["Signer", "Witness", "Approver"],
  default: "Signer",
},

roleOrder: {
  type: Number,
  default: 1,
},

emailSent: {
  type: Boolean,
  default: false,
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