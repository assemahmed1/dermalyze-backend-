const Patient = require("../models/Patient");

// ================= CREATE PATIENT =================
const createPatient = async (req, res, next) => {
  try {
    const { name, age, gender, diagnosis, nationalId, phone, address, medicalHistory } = req.body;

    const patient = await Patient.create({
      name,
      age,
      gender,
      diagnosis,
      nationalId,
      phone,
      address,
      medicalHistory,
      doctor: req.user.id,
    });

    res.status(201).json(patient);
  } catch (error) {
    next(error);
  }
};

// ================= GET ALL PATIENTS (doctor-scoped) =================
const getPatients = async (req, res, next) => {
  try {
    const patients = await Patient.find({ doctor: req.user.id })
      .sort({ createdAt: -1 })
      .maxTimeMS(5000);
    res.json(patients);
  } catch (error) {
    next(error);
  }
};

// ================= GET PATIENT BY ID (ownership check) =================
const getPatientById = async (req, res, next) => {
  try {
    // IDOR Fix: scope lookup to both ID and doctor
    const patient = await Patient.findOne({
      _id: req.params.id,
      doctor: req.user.id,
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.json(patient);
  } catch (error) {
    next(error);
  }
};

// ================= UPDATE PATIENT STATUS (ownership check) =================
const updatePatientStatus = async (req, res, next) => {
  try {
    const allowedStatuses = ["Improving", "Stable", "Critical"];
    const { status } = req.body;

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: `Status must be one of: ${allowedStatuses.join(", ")}`,
      });
    }

    // IDOR Fix: ensure patient belongs to this doctor
    const patient = await Patient.findOne({
      _id: req.params.id,
      doctor: req.user.id,
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    patient.status = status;
    await patient.save();

    res.json(patient);
  } catch (error) {
    next(error);
  }
};

// ================= UPDATE RECOVERY PROGRESS (ownership check) =================
const updateRecoveryProgress = async (req, res, next) => {
  try {
    const { progress } = req.body;

    if (progress === undefined || progress < 0 || progress > 100) {
      return res.status(400).json({ message: "Progress must be between 0 and 100" });
    }

    // IDOR Fix: ensure patient belongs to this doctor
    const patient = await Patient.findOneAndUpdate(
      { _id: req.params.id, doctor: req.user.id },
      { recoveryProgress: progress },
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.json({ message: "Recovery progress updated", patient });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPatient,
  getPatients,
  getPatientById,
  updatePatientStatus,
  updateRecoveryProgress,
};