import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/database.js';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.js';
import { logAudit } from '../services/audit.js';
import { MedicalRecord, ClinicalVitals } from '../db/types.js';

const router = Router();

const createRecordSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  appointmentId: z.string().optional(),
  diagnosis: z.string().min(2, 'Diagnosis is required'),
  clinicalNotes: z.string().min(5, 'Clinical notes are required'),
  vitals: z.object({
    bloodPressure: z.string().optional(),
    heartRate: z.number().optional(),
    temperature: z.number().optional(),
    oxygenSaturation: z.number().optional(),
    weightKg: z.number().optional()
  }).optional(),
  followUpDate: z.string().optional(),
  isRestricted: z.boolean().default(false)
});

// List medical records with strict role & ownership isolation
router.get('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  let records: MedicalRecord[] = [];

  if (user.role === 'PATIENT') {
    // Patients only see their own unrestricted medical records
    records = db.schema.medicalRecords.filter(r => r.patientId === user.id && !r.isRestricted);
  } else if (user.role === 'DOCTOR') {
    const docProfile = db.getDoctorProfileByUserId(user.id);
    if (docProfile) {
      // Doctor can only see records they created OR for patients with whom they have an appointment
      const docPatientIds = new Set(
        db.schema.appointments
          .filter(a => a.doctorId === docProfile.id)
          .map(a => a.patientId)
      );
      records = db.schema.medicalRecords.filter(r => 
        r.doctorId === docProfile.id || docPatientIds.has(r.patientId)
      );
    }
  } else if (user.role === 'ADMIN') {
    // Admin only sees high level or non-restricted metadata (as per prompt specification: no unrestricted medical snooping)
    records = db.schema.medicalRecords.map(r => ({
      ...r,
      clinicalNotes: '[Clinical notes restricted to attending physician and patient]'
    }));
  }

  // Enrich with doctor and patient metadata
  const enriched = records.map(r => {
    const doctorProfile = db.getDoctorProfileById(r.doctorId);
    const doctorUser = doctorProfile ? db.findUserById(doctorProfile.userId) : null;
    const patientUser = db.findUserById(r.patientId);

    return {
      ...r,
      doctor: doctorProfile && doctorUser ? {
        fullName: doctorUser.fullName,
        specialization: doctorProfile.specialization
      } : null,
      patient: patientUser ? {
        fullName: patientUser.fullName,
        email: patientUser.email
      } : null
    };
  });

  return res.json({ records: enriched });
});

// Get single medical record (Strict ownership validation!)
router.get('/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const record = db.schema.medicalRecords.find(r => r.id === req.params.id);

  if (!record) {
    return res.status(404).json({ error: 'Medical record not found.' });
  }

  const docProfile = db.getDoctorProfileByUserId(user.id);

  // Strict ownership check:
  // Patient must be the owner
  // OR doctor must be author or attending physician
  const isPatientOwner = user.role === 'PATIENT' && record.patientId === user.id;
  const isAuthorDoctor = docProfile && record.doctorId === docProfile.id;
  const isAttendingDoctor = docProfile && db.schema.appointments.some(
    a => a.doctorId === docProfile.id && a.patientId === record.patientId
  );

  if (!isPatientOwner && !isAuthorDoctor && !isAttendingDoctor && user.role !== 'ADMIN') {
    logAudit({
      actor: user,
      action: 'UNAUTHORIZED_RECORD_ACCESS_ATTEMPT',
      resourceType: 'MedicalRecord',
      resourceId: record.id,
      status: 'FAILURE',
      details: `User tried to access medical record of patient ${record.patientId}`
    });
    return res.status(403).json({ error: 'Forbidden. You do not have permission to view this medical record.' });
  }

  const doctorProfile = db.getDoctorProfileById(record.doctorId);
  const doctorUser = doctorProfile ? db.findUserById(doctorProfile.userId) : null;
  const patientUser = db.findUserById(record.patientId);

  logAudit({
    actor: user,
    action: 'MEDICAL_RECORD_VIEWED',
    resourceType: 'MedicalRecord',
    resourceId: record.id,
    details: 'Viewed clinical record'
  });

  return res.json({
    ...record,
    doctor: doctorProfile && doctorUser ? {
      fullName: doctorUser.fullName,
      specialization: doctorProfile.specialization
    } : null,
    patient: patientUser ? {
      fullName: patientUser.fullName,
      email: patientUser.email
    } : null
  });
});

// Create medical record (Doctor only)
router.post('/', requireAuth, requireRole(['DOCTOR']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const docProfile = db.getDoctorProfileByUserId(user.id);
    if (!docProfile) {
      return res.status(403).json({ error: 'Doctor profile must be configured to create medical records.' });
    }

    const validated = createRecordSchema.parse(req.body);

    const newRecord: MedicalRecord = {
      id: 'mr_' + Math.random().toString(36).substring(2, 11),
      recordNumber: 'EHR-' + Math.floor(100000 + Math.random() * 900000),
      patientId: validated.patientId,
      doctorId: docProfile.id,
      appointmentId: validated.appointmentId,
      diagnosis: validated.diagnosis.trim(),
      clinicalNotes: validated.clinicalNotes.trim(),
      vitals: validated.vitals,
      followUpDate: validated.followUpDate,
      isRestricted: validated.isRestricted,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.insertMedicalRecord(newRecord);

    logAudit({
      actor: user,
      action: 'MEDICAL_RECORD_CREATED',
      resourceType: 'MedicalRecord',
      resourceId: newRecord.id,
      details: `Created EHR record #${newRecord.recordNumber} for patient ${validated.patientId}`
    });

    return res.status(201).json({
      message: 'Medical record filed successfully.',
      record: newRecord
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.issues[0]?.message || 'Validation error' });
    }
    return res.status(500).json({ error: err.message || 'Error creating medical record.' });
  }
});

export default router;
