const Analysis = require("../models/Analysis");
const Patient = require("../models/Patient");
const cloudinary = require("../config/cloudinary");

// Upload image to Cloudinary from buffer
function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "dermalyze/analyses",
        transformation: [{ width: 1024, height: 1024, crop: "limit" }],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
}

// Analyze image using Hugging Face AI
async function analyzeSkin(imageBuffer) {
  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/Anwarkh1/Skin_Disease_Classification",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_TOKEN}`,
          "Content-Type": "application/octet-stream",
        },
        body: imageBuffer,
      }
    );

    const data = await response.json();

    if (data.error) {
      return `Analysis pending: ${data.error}`;
    }

    if (Array.isArray(data) && data.length > 0) {
      const top = data[0];
      const confidence = (top.score * 100).toFixed(1);
      return `${top.label} (${confidence}% confidence)`;
    }

    return "Unable to analyze image";
  } catch (error) {
    console.error("Hugging Face API error:", error.message);
    return "Analysis service unavailable";
  }
}

// ================= CREATE ANALYSIS =================
exports.createAnalysis = async (req, res, next) => {
  try {
    const patientId = req.params.patientId;

    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    // IDOR Fix: verify patient belongs to this doctor
    const patient = await Patient.findOne({
      _id: patientId,
      doctor: req.user.id,
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Upload to Cloudinary and run AI analysis simultaneously
    const [uploadResult, aiResult] = await Promise.all([
      uploadToCloudinary(req.file.buffer),
      analyzeSkin(req.file.buffer),
    ]);

    const analysis = await Analysis.create({
      doctor: req.user.id,
      patient: patientId,
      imageUrl: uploadResult.secure_url,
      result: aiResult,
    });

    res.status(201).json({
      message: "Analysis added to patient file",
      analysis,
    });
  } catch (error) {
    next(error);
  }
};

// ================= GET PATIENT ANALYSES =================
exports.getPatientAnalyses = async (req, res, next) => {
  try {
    // IDOR Fix: ensure patient data is accessible to the requesting user
    const patient = await Patient.findOne({
      _id: req.params.patientId,
      doctor: req.user.id,
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const analyses = await Analysis.find({ patient: req.params.patientId })
      .sort({ createdAt: -1 })
      .maxTimeMS(5000);

    res.json(analyses);
  } catch (error) {
    next(error);
  }
};
