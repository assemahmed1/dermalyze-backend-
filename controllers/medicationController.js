const Medication = require("../models/Medication");
const Patient = require("../models/Patient");

// ================= ADD MEDICATION =================
exports.addMedication = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const { name, dosage, frequency, notes } = req.body;

    // IDOR Fix: ensure patient belongs to this doctor
    const patient = await Patient.findOne({
      _id: patientId,
      doctor: req.user.id,
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const medication = await Medication.create({
      patient: patientId,
      doctor: req.user.id,
      name,
      dosage,
      frequency,
      notes,
    });

    res.status(201).json({ message: "Medication added", medication });
  } catch (error) {
    next(error);
  }
};

// ================= GET PATIENT MEDICATIONS =================
exports.getPatientMedications = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    // IDOR Fix: verify patient belongs to this doctor before returning medications
    const patient = await Patient.findOne({
      _id: patientId,
      doctor: req.user.id,
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const medications = await Medication.find({ patient: patientId })
      .sort({ createdAt: -1 })
      .maxTimeMS(5000);

    res.json(medications);
  } catch (error) {
    next(error);
  }
};

// ================= UPDATE MEDICATION (whitelist + ownership check) =================
exports.updateMedication = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Mass Assignment Fix: only allow specific fields to be updated
    const { name, dosage, frequency, notes, isActive } = req.body;

    const allowedUpdate = {};
    if (name !== undefined) allowedUpdate.name = name;
    if (dosage !== undefined) allowedUpdate.dosage = dosage;
    if (frequency !== undefined) allowedUpdate.frequency = frequency;
    if (notes !== undefined) allowedUpdate.notes = notes;
    if (isActive !== undefined) allowedUpdate.isActive = isActive;

    // IDOR Fix: ensure medication was created by this doctor
    const medication = await Medication.findOneAndUpdate(
      { _id: id, doctor: req.user.id },
      allowedUpdate,
      { new: true, runValidators: true }
    );

    if (!medication) {
      return res.status(404).json({ message: "Medication not found" });
    }

    res.json({ message: "Medication updated", medication });
  } catch (error) {
    next(error);
  }
};

// ================= DELETE MEDICATION (ownership check) =================
exports.deleteMedication = async (req, res, next) => {
  try {
    const { id } = req.params;

    // IDOR Fix: ensure medication was created by this doctor
    const medication = await Medication.findOneAndDelete({
      _id: id,
      doctor: req.user.id,
    });

    if (!medication) {
      return res.status(404).json({ message: "Medication not found" });
    }

    res.json({ message: "Medication deleted" });
  } catch (error) {
    next(error);
  }
};
