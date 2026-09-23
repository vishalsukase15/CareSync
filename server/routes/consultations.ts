import { Router, Response } from 'express';
import { db } from '../db/database.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { logAudit } from '../services/audit.js';

const router = Router();

// Get or initialize video consultation room for an appointment
router.get('/room/:appointmentId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const apt = db.schema.appointments.find(a => a.id === req.params.appointmentId);

  if (!apt) {
    return res.status(404).json({ error: 'Appointment not found.' });
  }

  const docProfile = db.getDoctorProfileById(apt.doctorId);
  const isPatient = apt.patientId === user.id;
  const isDoctor = docProfile && docProfile.userId === user.id;
  const isAdmin = user.role === 'ADMIN';

  if (!isPatient && !isDoctor && !isAdmin) {
    return res.status(403).json({ error: 'Forbidden. You are not a participant in this consultation session.' });
  }

  let videoSession = db.schema.videoConsultations.find(v => v.appointmentId === apt.id);
  if (!videoSession) {
    videoSession = db.upsertVideoConsultation({
      id: 'vid_' + Math.random().toString(36).substring(2, 11),
      appointmentId: apt.id,
      roomId: `room_${apt.id}`,
      doctorId: apt.doctorId,
      patientId: apt.patientId,
      status: 'WAITING'
    });
  }

  const patientUser = db.findUserById(apt.patientId);
  const doctorUser = docProfile ? db.findUserById(docProfile.userId) : null;

  return res.json({
    session: videoSession,
    appointment: apt,
    peer: isDoctor ? {
      id: patientUser?.id,
      fullName: patientUser?.fullName,
      role: 'PATIENT'
    } : {
      id: doctorUser?.id,
      fullName: doctorUser?.fullName,
      specialization: docProfile?.specialization,
      role: 'DOCTOR'
    },
    userRole: isDoctor ? 'DOCTOR' : 'PATIENT'
  });
});

// Update consultation status (End consultation, record duration)
router.post('/end', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { appointmentId, durationSeconds } = req.body;
  if (!appointmentId) {
    return res.status(400).json({ error: 'Appointment ID is required.' });
  }

  const session = db.schema.videoConsultations.find(v => v.appointmentId === appointmentId);
  if (session) {
    db.upsertVideoConsultation({
      ...session,
      status: 'COMPLETED',
      endedAt: new Date().toISOString(),
      durationSeconds: durationSeconds || 0
    });
  }

  // Update appointment status to COMPLETED if doctor
  const apt = db.schema.appointments.find(a => a.id === appointmentId);
  if (apt) {
    db.updateAppointment(apt.id, { status: 'COMPLETED' });
  }

  logAudit({
    actor: req.user,
    action: 'VIDEO_CONSULTATION_CONCLUDED',
    resourceType: 'VideoConsultation',
    resourceId: session?.id || appointmentId,
    details: `Call concluded with duration: ${durationSeconds || 0} seconds`
  });

  return res.json({ message: 'Consultation recorded and concluded.' });
});

export default router;
