const Medication = require("../models/Medication");
const Patient = require("../models/Patient");

// ✅ Doctor adds medication to patient
exports.addMedication = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { name, dosage, frequency, notes } = req.body;

    const patient = await Patient.findById(patientId);
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
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get patient medications
exports.getPatientMedications = async (req, res) => {
  try {
    const { patientId } = req.params;

    const medications = await Medication.find({ patient: patientId }).sort({ createdAt: -1 });

    res.json(medications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Update medication (activate/deactivate or edit)
exports.updateMedication = async (req, res) => {
  try {
    const { id } = req.params;

    const medication = await Medication.findByIdAndUpdate(id, req.body, { new: true });

    if (!medication) {
      return res.status(404).json({ message: "Medication not found" });
    }

    res.json({ message: "Medication updated", medication });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Delete medication
exports.deleteMedication = async (req, res) => {
  try {
    const { id } = req.params;

    await Medication.findByIdAndDelete(id);

    res.json({ message: "Medication deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
