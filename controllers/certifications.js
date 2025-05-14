import { Certification } from "../model/certification.js";

// ✅ Upload a new certification
export const uploadCert = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const cert = new Certification({
      title: req.body.title,
      organization: req.body.organization,
      issueDate: req.body.issueDate,
      credentialID: req.body.credentialID || "",
      credentialURL: req.body.credentialURL || "",
      description: req.body.description || "",
      fileURL: req.file.path, // Cloudinary URL
    });

    await cert.save();
    res.status(201).json(cert);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get all certifications (sorted)
export const getCerts = async (req, res) => {
  try {
    const certs = await Certification.find().sort({ issueDate: -1 }); // Newest first
    res.json(certs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get a single certification by ID
export const getCertById = async (req, res) => {
  try {
    const cert = await Certification.findById(req.params.id);
    if (!cert) {
      return res.status(404).json({ error: "Certification not found" });
    }
    res.json(cert);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Update certification (including file replacement)
export const updateCert = async (req, res) => {
  try {
    const cert = await Certification.findById(req.params.id);
    if (!cert) {
      return res.status(404).json({ error: "Certification not found" });
    }

    // Update fields
    cert.title = req.body.title || cert.title;
    cert.organization = req.body.organization || cert.organization;
    cert.issueDate = req.body.issueDate || cert.issueDate;
    cert.credentialID = req.body.credentialID || cert.credentialID;
    cert.credentialURL = req.body.credentialURL || cert.credentialURL;
    cert.description = req.body.description || cert.description;

    // Update file URL if a new file is uploaded
    if (req.file) {
      cert.fileURL = req.file.path;
    }

    await cert.save();
    res.json(cert);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Delete a certification
export const deleteCert = async (req, res) => {
  try {
    const cert = await Certification.findById(req.params.id);
    if (!cert) {
      return res.status(404).json({ error: "Certification not found" });
    }

    await cert.deleteOne();
    res.json({ message: "Certification deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get summary of certifications
export const getCertSummary = async (req, res) => {
  try {
    const totalCerts = await Certification.countDocuments();
    const latestCert = await Certification.findOne().sort({ issueDate: -1 });
    const organizations = await Certification.aggregate([
      { $group: { _id: "$organization", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      totalCertifications: totalCerts,
      latestCertification: latestCert
        ? {
            title: latestCert.title,
            organization: latestCert.organization,
            issueDate: latestCert.issueDate,
          }
        : null,
      organizations,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
