import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/database.js';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.js';
import { logAudit } from '../services/audit.js';
import { sendNotificationToUser } from '../sockets/signaling.js';
import { Prescription } from '../db/types.js';

const router = Router();

const medicationItemSchema = z.object({
  name: z.string().min(1, 'Medication name is required'),
  dosage: z.string().min(1, 'Dosage is required (e.g. 500mg)'),
  frequency: z.string().min(1, 'Frequency is required (e.g. Twice daily)'),
  duration: z.string().min(1, 'Duration is required (e.g. 7 days)'),
  instructions: z.string().default('Take after meals with water')
});

const createPrescriptionSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  appointmentId: z.string().optional(),
  diagnosis: z.string().min(2, 'Diagnosis is required'),
  medications: z.array(medicationItemSchema).min(1, 'At least one medication is required'),
  instructions: z.string().optional()
});

// List prescriptions
router.get('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  let prescriptions: Prescription[] = [];

  if (user.role === 'PATIENT') {
    prescriptions = db.schema.prescriptions.filter(p => p.patientId === user.id);
  } else if (user.role === 'DOCTOR') {
    const docProfile = db.getDoctorProfileByUserId(user.id);
    if (docProfile) {
      prescriptions = db.schema.prescriptions.filter(p => p.doctorId === docProfile.id);
    }
  } else if (user.role === 'ADMIN') {
    prescriptions = db.schema.prescriptions;
  }

  // Enrich with doctor and patient info
  const enriched = prescriptions.map(p => {
    const docProfile = db.getDoctorProfileById(p.doctorId);
    const docUser = docProfile ? db.findUserById(docProfile.userId) : null;
    const patientUser = db.findUserById(p.patientId);

    return {
      ...p,
      doctor: docProfile && docUser ? {
        fullName: docUser.fullName,
        specialization: docProfile.specialization,
        licenseNumber: docProfile.licenseNumber
      } : null,
      patient: patientUser ? {
        fullName: patientUser.fullName,
        email: patientUser.email,
        phone: patientUser.phone
      } : null
    };
  });

  return res.json({ prescriptions: enriched });
});

// Single prescription
router.get('/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const rx = db.schema.prescriptions.find(p => p.id === req.params.id);

  if (!rx) {
    return res.status(404).json({ error: 'Prescription not found.' });
  }

  const docProfile = db.getDoctorProfileByUserId(user.id);
  const isPatientOwner = user.role === 'PATIENT' && rx.patientId === user.id;
  const isAuthorDoctor = docProfile && rx.doctorId === docProfile.id;

  if (!isPatientOwner && !isAuthorDoctor && user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden. You do not have permission to view this prescription.' });
  }

  const doctorProfile = db.getDoctorProfileById(rx.doctorId);
  const docUser = doctorProfile ? db.findUserById(doctorProfile.userId) : null;
  const patientUser = db.findUserById(rx.patientId);
  const hospital = doctorProfile?.hospitalId ? db.getHospitalById(doctorProfile.hospitalId) : undefined;

  return res.json({
    ...rx,
    doctor: doctorProfile && docUser ? {
      fullName: docUser.fullName,
      specialization: doctorProfile.specialization,
      licenseNumber: doctorProfile.licenseNumber,
      phone: docUser.phone
    } : null,
    patient: patientUser ? {
      fullName: patientUser.fullName,
      email: patientUser.email,
      phone: patientUser.phone
    } : null,
    hospital: hospital ? {
      name: hospital.name,
      address: hospital.address,
      phone: hospital.phone
    } : null
  });
});

// Issue Prescription (Doctor only)
router.post('/', requireAuth, requireRole(['DOCTOR']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const docProfile = db.getDoctorProfileByUserId(user.id);
    if (!docProfile) {
      return res.status(403).json({ error: 'Doctor profile must be configured to issue prescriptions.' });
    }

    const validated = createPrescriptionSchema.parse(req.body);

    const rxId = 'rx_' + Math.random().toString(36).substring(2, 11);
    const rxNumber = 'RX-' + Math.floor(100000 + Math.random() * 900000);

    const newPrescription: Prescription = {
      id: rxId,
      rxNumber,
      patientId: validated.patientId,
      doctorId: docProfile.id,
      appointmentId: validated.appointmentId,
      diagnosis: validated.diagnosis.trim(),
      medications: validated.medications,
      instructions: validated.instructions?.trim(),
      issuedAt: new Date().toISOString()
    };

    db.insertPrescription(newPrescription);

    // Notify Patient
    const notif = db.insertNotification({
      id: 'notif_' + Math.random().toString(36).substring(2, 11),
      userId: validated.patientId,
      title: 'New Prescription Issued',
      message: `Dr. ${user.fullName} has issued a digital prescription #${rxNumber} for your consultation.`,
      type: 'PRESCRIPTION',
      link: '/patient/prescriptions',
      isRead: false,
      createdAt: new Date().toISOString()
    });
    sendNotificationToUser(validated.patientId, notif);

    logAudit({
      actor: user,
      action: 'PRESCRIPTION_ISSUED',
      resourceType: 'Prescription',
      resourceId: rxId,
      details: `Issued Rx #${rxNumber} with ${validated.medications.length} items for patient ${validated.patientId}`
    });

    return res.status(201).json({
      message: 'Prescription issued successfully.',
      prescription: newPrescription
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.issues[0]?.message || 'Validation error' });
    }
    return res.status(500).json({ error: err.message || 'Error issuing prescription.' });
  }
});

export default router;
