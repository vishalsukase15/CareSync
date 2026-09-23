import { Router, Response } from 'express';
import { db } from '../db/database.js';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.js';
import { logAudit } from '../services/audit.js';

const router = Router();

// Platform Overview Statistics
router.get('/stats', requireAuth, requireRole(['ADMIN']), (_req: AuthenticatedRequest, res: Response) => {
  const users = db.schema.users;
  const doctors = db.schema.doctorProfiles;
  const hospitals = db.schema.hospitals;
  const appointments = db.schema.appointments;
  const records = db.schema.medicalRecords;
  const consults = db.schema.videoConsultations;

  const totalPatients = users.filter(u => u.role === 'PATIENT').length;
  const totalDoctors = users.filter(u => u.role === 'DOCTOR').length;
  const verifiedDoctors = doctors.filter(d => d.isVerified).length;
  const pendingDoctors = doctors.filter(d => !d.isVerified).length;

  const totalBeds = hospitals.reduce((sum, h) => sum + h.totalBeds, 0);
  const availableBeds = hospitals.reduce((sum, h) => sum + h.availableBeds, 0);
  const totalIcu = hospitals.reduce((sum, h) => sum + h.totalIcu, 0);
  const availableIcu = hospitals.reduce((sum, h) => sum + h.availableIcu, 0);

  const completedAppointments = appointments.filter(a => a.status === 'COMPLETED').length;
  const activeConsultations = consults.filter(c => c.status === 'IN_PROGRESS').length;

  // Appointment status breakdown
  const statusCounts = {
    CONFIRMED: appointments.filter(a => a.status === 'CONFIRMED').length,
    COMPLETED: completedAppointments,
    CANCELLED: appointments.filter(a => a.status === 'CANCELLED').length,
    PENDING: appointments.filter(a => a.status === 'PENDING').length
  };

  return res.json({
    metrics: {
      totalUsers: users.length,
      totalPatients,
      totalDoctors,
      verifiedDoctors,
      pendingDoctors,
      totalHospitals: hospitals.length,
      totalAppointments: appointments.length,
      completedAppointments,
      totalMedicalRecordsFiled: records.length,
      activeConsultations,
      beds: {
        totalBeds,
        availableBeds,
        occupiedBeds: totalBeds - availableBeds,
        totalIcu,
        availableIcu,
        occupiedIcu: totalIcu - availableIcu
      }
    },
    statusCounts
  });
});

// Doctors list for Admin with verification status
router.get('/doctors', requireAuth, requireRole(['ADMIN']), (_req: AuthenticatedRequest, res: Response) => {
  const doctors = db.schema.doctorProfiles.map(doc => {
    const user = db.findUserById(doc.userId);
    const hospital = doc.hospitalId ? db.getHospitalById(doc.hospitalId) : null;
    return {
      ...doc,
      user: user ? {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        isActive: user.isActive,
        createdAt: user.createdAt
      } : null,
      hospital: hospital ? {
        name: hospital.name,
        city: hospital.city
      } : null
    };
  });

  return res.json({ doctors });
});

// Verify or Reject Doctor
router.post('/doctors/:id/verify', requireAuth, requireRole(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { verify, reason } = req.body;
  const doctor = db.getDoctorProfileById(req.params.id);

  if (!doctor) {
    return res.status(404).json({ error: 'Doctor not found.' });
  }

  const updated = db.upsertDoctorProfile({
    ...doctor,
    isVerified: Boolean(verify)
  });

  const docUser = db.findUserById(doctor.userId);
  if (docUser) {
    db.insertNotification({
      id: 'notif_' + Math.random().toString(36).substring(2, 11),
      userId: docUser.id,
      title: verify ? 'Credentials Verified' : 'Verification Update',
      message: verify 
        ? 'Congratulations! Your medical credentials have been verified by the CareSync administration.'
        : `Your credentials verification status was updated. Note: ${reason || 'Please review your license details.'}`,
      type: 'SYSTEM',
      link: '/doctor/profile',
      isRead: false,
      createdAt: new Date().toISOString()
    });
  }

  logAudit({
    actor: user,
    action: verify ? 'DOCTOR_VERIFIED' : 'DOCTOR_VERIFICATION_REVOKED',
    resourceType: 'DoctorProfile',
    resourceId: doctor.id,
    details: `Doctor verification changed to ${verify}. Reason: ${reason || 'N/A'}`
  });

  return res.json({
    message: `Doctor ${verify ? 'verified' : 'unverified'} successfully.`,
    doctor: updated
  });
});

// Users Management
router.get('/users', requireAuth, requireRole(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { role, q } = req.query;
  let users = db.schema.users.map(u => {
    const { passwordHash: _, ...safeUser } = u;
    return safeUser;
  });

  if (role) {
    users = users.filter(u => u.role === role);
  }

  if (q) {
    const query = (q as string).toLowerCase().trim();
    users = users.filter(u => 
      u.fullName.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query)
    );
  }

  return res.json({ users });
});

// Toggle User Active Status (Deactivate / Reactivate)
router.patch('/users/:id/status', requireAuth, requireRole(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const actor = req.user!;
  const targetUser = db.findUserById(req.params.id);

  if (!targetUser) {
    return res.status(404).json({ error: 'User not found.' });
  }

  if (targetUser.id === actor.id) {
    return res.status(400).json({ error: 'Cannot deactivate your own administrator account.' });
  }

  const { isActive } = req.body;
  const updated = db.updateUser(targetUser.id, { isActive: Boolean(isActive) });

  logAudit({
    actor,
    action: isActive ? 'USER_REACTIVATED' : 'USER_SUSPENDED',
    resourceType: 'User',
    resourceId: targetUser.id,
    details: `User status changed to ${isActive ? 'Active' : 'Suspended'}`
  });

  const { passwordHash: _, ...safe } = updated;
  return res.json({ message: 'User status updated.', user: safe });
});

// Audit Logs Inspection
router.get('/audit-logs', requireAuth, requireRole(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { action, actorRole, limit = '100' } = req.query;
  let logs = db.schema.auditLogs;

  if (action) {
    logs = logs.filter(l => l.action.toLowerCase().includes((action as string).toLowerCase()));
  }

  if (actorRole) {
    logs = logs.filter(l => l.actorRole === actorRole);
  }

  const limitNum = parseInt(limit as string, 10) || 100;
  return res.json({
    logs: logs.slice(0, limitNum),
    total: logs.length
  });
});

export default router;
