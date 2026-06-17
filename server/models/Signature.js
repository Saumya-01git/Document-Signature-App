const mongoose = require("mongoose");

const signatureSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
    },

    signer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    x: {
      type: Number,
      required: true,
    },

    y: {
      type: Number,
      required: true,
    },

    page: {
      type: Number,
      default: 1,
    },

    status: {
      type: String,
      enum: ["Pending", "Signed", "Rejected"],
      default: "Pending",
    },
    signatureText: {
  type: String,
  default: "",
},

fontStyle: {
  type: String,
  default: "Arial",
},

rotation: {
  type: Number,
  default: 0,
},
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Signature", signatureSchema);