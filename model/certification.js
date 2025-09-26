const mongoose = require("mongoose");

const certificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    organization: { type: String, required: true },
    issueDate: { type: Date, required: true },
    expirationDate: { type: Date, default: null },
    priority: { type: Number, default: 3 },
    credentialID: { type: String, default: "" },
    credentialURL: { type: String, default: "" },
    category: { type: String, default: "general" },
    description: { type: String, default: "" },
    fileURL: { type: String, default: "" },
  },
  { timestamps: true }
);

const Certification = mongoose.model("Certification", certificationSchema);
module.exports = Certification;