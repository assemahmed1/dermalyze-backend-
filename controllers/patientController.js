const Patient = require("../models/Patient");

const createPatient = async (req, res) => {
  try {
    const { name, age, gender, diagnosis, nationalId, phone, address, medicalHistory } = req.body;

    if (!name || !age || !gender) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const patient = await Patient.create({
      name, age, gender, diagnosis,
      nationalId, phone, address, medicalHistory,
      doctor: req.user._id,
    });

    res.status(201).json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPatients = async (req, res) => {
  try {
    const patients = await Patient.find({ doctor: req.user._id }).sort({ createdAt: -1 });
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: "Not found" });
    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updatePatientStatus = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: "Not found" });

    patient.status = req.body.status || patient.status;
    await patient.save();

    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Update Recovery Progress
const updateRecoveryProgress = async (req, res) => {
  try {
    const { progress } = req.body;

    if (progress === undefined || progress < 0 || progress > 100) {
      return res.status(400).json({ message: "Progress must be between 0 and 100" });
    }

    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { recoveryProgress: progress },
      { new: true }
    );

    if (!patient) return res.status(404).json({ message: "Not found" });

    res.json({ message: "Recovery progress updated", patient });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createPatient,
  getPatients,
  getPatientById,
  updatePatientStatus,
  updateRecoveryProgress,
};