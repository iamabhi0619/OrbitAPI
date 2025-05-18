import { Certification } from "../../model/certification.js";
import moment from "moment";
import ApiError from "../../utils/ApiError.js";
import logger from "../../config/logger.js";

// 🧠 Helper: Get certification by ID
const findCert = async (id, next) => {
    const cert = await Certification.findById(id);
    if (!cert) {
        return next(new ApiError(404, "Certification not found", "CERT_NOT_FOUND", "The requested certification does not exist."));
    }
    return cert;
};

// ✅ Upload a certification
export const uploadCert = async (req, res, next) => {
    try {
        const { title, organization, issueDate, credentialID, credentialURL, description, category } = req.body;

        if (!title || !organization || !issueDate) {
            return next(new ApiError(400, "Missing required fields", "MISSING_FIELDS", "Title, organization, and issue date are required."));
        }

        if (!req.file) {
            return next(new ApiError(400, "No file uploaded", "NO_FILE", "Please upload a certification file."));
        }
        const cert = new Certification({
            title,
            organization,
            issueDate,
            credentialID: credentialID || "",
            credentialURL: credentialURL || "",
            description: description || "",
            fileURL: req.file.path,
            fileType: req.file.mimetype || "unknown",
            fileSize: req.file.size,
            category: category || "general",
            uploadedBy: req.user?.id || "system",
        });

        await cert.save();
        res.status(201).json({
            success: true,
            message: "Certification uploaded successfully",
            data: cert,
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            return next(new ApiError(400, "Invalid data", "INVALID_DATA", error.message));
        }
        logger.error("Failed to upload certification: " + error);
        next(new ApiError(500, "Upload failed", "UPLOAD_FAILED", "An unexpected error occurred."));
    }
};

// ✅ Get all certifications
export const getCerts = async (req, res, next) => {
    try {
        const certs = await Certification.find().sort({ issueDate: -1, createdAt: -1 });

        const enriched = certs.map((cert) => ({
            ...cert._doc,
            issuedAgo: moment(cert.issueDate).fromNow(),
            formattedDate: moment(cert.issueDate).format("MMMM YYYY"),
        }));

        res.status(200).json({ success: true, total: certs.length, data: enriched });
    } catch (error) {
        logger.error("Failed to fetch certifications: " + error);
        next(new ApiError(500, "Failed to fetch certifications", "FETCH_FAILED", "An unexpected error occurred."));
    }
};

// ✅ Get a certification by ID
export const getCertById = async (req, res, next) => {
    try {
        const cert = await findCert(req.params.id, next);
        if (!cert) return;

        res.status(200).json({ success: true, data: cert });
    } catch (error) {
        logger.error("Failed to fetch certification: " + error);
        next(new ApiError(500, "Fetch failed", "FETCH_FAILED", "An unexpected error occurred."));
    }
};

// ✅ Update a certification
export const updateCert = async (req, res, next) => {
    try {
        const cert = await findCert(req.params.id, next);
        if (!cert) return;

        const { title, organization, issueDate, credentialID, credentialURL, description, category } = req.body;

        cert.title = title || cert.title;
        cert.organization = organization || cert.organization;
        cert.issueDate = issueDate || cert.issueDate;
        cert.credentialID = credentialID || cert.credentialID;
        cert.credentialURL = credentialURL || cert.credentialURL;
        cert.description = description || cert.description;
        cert.category = category || cert.category;

        if (req.file) {
            cert.fileURL = req.file.path;
            cert.fileType = req.file.mimetype || "unknown";
            cert.fileSize = req.file.size;
        }

        await cert.save();
        res.status(200).json({ success: true, message: "Certification updated", data: cert });
    } catch (error) {
        if (error.name === "ValidationError") {
            return next(new ApiError(400, "Invalid data", "INVALID_DATA", error.message));
        }
        logger.error("Failed to update certification: " + error);
        next(new ApiError(500, "Update failed", "UPDATE_FAILED", "An unexpected error occurred."));
    }
};

// ✅ Delete a certification
export const deleteCert = async (req, res, next) => {
    try {
        const cert = await findCert(req.params.id, next);
        if (!cert) {
            return next(new ApiError(404, "Certification not found", "CERT_NOT_FOUND", "The requested certification does not exist."));
        };

        await cert.deleteOne();
        res.status(200).json({ success: true, message: "Certification deleted successfully", data: cert });
    } catch (error) {
        if (error.name === "ValidationError") {
            return next(new ApiError(400, "Invalid data", "INVALID_DATA", error.message));
        }
        logger.error("Failed to delete certification: " + error);
        next(new ApiError(500, "Deletion failed", "DELETE_FAILED", error.message));
    }
};

// ✅ Get summary of certifications
export const getCertSummary = async (req, res, next) => {
    try {
        const totalCerts = await Certification.countDocuments();
        const latest = await Certification.findOne().sort({ issueDate: -1 });

        const orgStats = await Certification.aggregate([
            { $group: { _id: "$organization", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);

        const categoryStats = await Certification.aggregate([
            { $group: { _id: "$category", count: { $sum: 1 } } },
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalCertifications: totalCerts,
                latestCertification: latest
                    ? {
                        title: latest.title,
                        organization: latest.organization,
                        issueDate: latest.issueDate,
                        issuedAgo: moment(latest.issueDate).fromNow(),
                    }
                    : null,
                organizations: orgStats,
                categories: categoryStats,
            },
        });
    } catch (error) {
        logger.error("Failed to fetch certification summary: " + error);
        next(new ApiError(500, "Summary fetch failed", "SUMMARY_FAILED", "An unexpected error occurred."));
    }
};
