const User = require("../models/User");
const Patient = require("../models/Patient");
const Analysis = require("../models/Analysis");

// Link patient to doctor
exports.linkDoctor = async (req, res) => {
  try {
    const { doctorCode } = req.body;

    const doctor = await User.findOne({ doctorCode, role: "doctor" });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    await User.findByIdAndUpdate(req.user.id, { doctor: doctor._id }, { new: true });

    res.json({ message: "Doctor linked successfully", doctor: doctor.name });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get doctor's patients
exports.getPatients = async (req, res) => {
  try {
    const patients = await Patient.find({ doctor: req.user.id }).sort({ createdAt: -1 });
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get patient analyses
exports.getPatientAnalyses = async (req, res) => {
  try {
    const { id } = req.params;
    const analyses = await Analysis.find({ patient: id }).sort({ createdAt: -1 });
    res.json(analyses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Doctor Stats — Total / Critical / Active
exports.getDoctorStats = async (req, res) => {
  try {
    const doctorId = req.user.id;

    const [total, critical, improving] = await Promise.all([
      Patient.countDocuments({ doctor: doctorId }),
      Patient.countDocuments({ doctor: doctorId, status: "Critical" }),
      Patient.countDocuments({ doctor: doctorId, status: "Improving" }),
    ]);

    res.json({
      totalPatients: total,
      criticalCases: critical,
      activeToday: improving,
      infectedPeople: total, // All patients have a skin condition
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};