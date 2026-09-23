import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/database.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { logAudit } from '../services/audit.js';
import { sendNotificationToUser } from '../sockets/signaling.js';
import { Appointment, AppointmentStatus } from '../db/types.js';

const router = Router();

const bookAppointmentSchema = z.object({
  doctorId: z.string().min(1, 'Doctor ID is required'),
  hospitalId: z.string().optional(),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format must be YYYY-MM-DD'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Start time must be HH:mm'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'End time must be HH:mm'),
  type: z.enum(['ONLINE', 'IN_PERSON']),
  symptoms: z.string().min(3, 'Please describe symptoms or reason for visit'),
  notes: z.string().optional()
});

// List appointments for authenticated user
router.get('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  let appointments: Appointment[] = [];

  if (user.role === 'PATIENT') {
    appointments = db.schema.appointments.filter(a => a.patientId === user.id);
  } else if (user.role === 'DOCTOR') {
    const docProfile = db.getDoctorProfileByUserId(user.id);
    if (docProfile) {
      appointments = db.schema.appointments.filter(a => a.doctorId === docProfile.id);
    }
  } else if (user.role === 'HOSPITAL') {
    const hospital = db.getHospitals().find(h => h.managerUserId === user.id);
    if (hospital) {
      appointments = db.schema.appointments.filter(a => a.hospitalId === hospital.id);
    }
  } else if (user.role === 'ADMIN') {
    appointments = db.schema.appointments;
  }

  // Enrich with doctor and patient details
  const enriched = appointments.map(apt => {
    const patientUser = db.findUserById(apt.patientId);
    const doctorProfile = db.getDoctorProfileById(apt.doctorId);
    const doctorUser = doctorProfile ? db.findUserById(doctorProfile.userId) : null;
    const hospital = apt.hospitalId ? db.getHospitalById(apt.hospitalId) : undefined;
    const videoRoom = db.schema.videoConsultations.find(v => v.appointmentId === apt.id);

    return {
      ...apt,
      patient: patientUser ? {
        id: patientUser.id,
        fullName: patientUser.fullName,
        email: patientUser.email,
        phone: patientUser.phone
      } : null,
      doctor: doctorProfile && doctorUser ? {
        id: doctorProfile.id,
        userId: doctorUser.id,
        fullName: doctorUser.fullName,
        specialization: doctorProfile.specialization,
        consultationFee: doctorProfile.consultationFee,
        avatarUrl: doctorUser.avatarUrl
      } : null,
      hospital: hospital ? {
        id: hospital.id,
        name: hospital.name,
        address: hospital.address,
        city: hospital.city
      } : null,
      videoRoomId: videoRoom?.roomId || (apt.type === 'ONLINE' ? `room_${apt.id}` : undefined)
    };
  });

  // Sort by date and time descending
  enriched.sort((a, b) => {
    const dtA = new Date(`${a.appointmentDate}T${a.startTime}:00`).getTime();
    const dtB = new Date(`${b.appointmentDate}T${b.startTime}:00`).getTime();
    return dtB - dtA;
  });

  return res.json({ appointments: enriched });
});

// Book an appointment (Patient)
router.post('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const validated = bookAppointmentSchema.parse(req.body);

    const doctor = db.getDoctorProfileById(validated.doctorId);
    if (!doctor) {
      return res.status(404).json({ error: 'Selected doctor not found.' });
    }

    const doctorUser = db.findUserById(doctor.userId);

    // Safeguard: Check double booking
    const isDoubleBooked = db.checkDoubleBooking(
      validated.doctorId,
      validated.appointmentDate,
      validated.startTime
    );

    if (isDoubleBooked) {
      return res.status(409).json({ 
        error: 'The chosen appointment time slot was just booked by another patient. Please select another slot.' 
      });
    }

    const aptId = 'apt_' + Math.random().toString(36).substring(2, 11);
    const aptNumber = 'CS-' + Math.floor(100000 + Math.random() * 900000);

    const newAppointment: Appointment = {
      id: aptId,
      appointmentNumber: aptNumber,
      patientId: user.id,
      doctorId: validated.doctorId,
      hospitalId: validated.hospitalId || doctor.hospitalId,
      appointmentDate: validated.appointmentDate,
      startTime: validated.startTime,
      endTime: validated.endTime,
      type: validated.type,
      status: 'CONFIRMED', // Instant confirmation for demo/practice
      symptoms: validated.symptoms.trim(),
      notes: validated.notes?.trim(),
      consultationFee: doctor.consultationFee,
      paymentStatus: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.insertAppointment(newAppointment);

    // If online consultation, initialize video consultation session
    if (validated.type === 'ONLINE') {
      db.upsertVideoConsultation({
        id: 'vid_' + Math.random().toString(36).substring(2, 11),
        appointmentId: aptId,
        roomId: `room_${aptId}`,
        doctorId: doctor.id,
        patientId: user.id,
        status: 'WAITING'
      });
    }

    // In-app notifications
    const patientNotif = db.insertNotification({
      id: 'notif_' + Math.random().toString(36).substring(2, 11),
      userId: user.id,
      title: 'Appointment Confirmed',
      message: `Your appointment with Dr. ${doctorUser?.fullName || 'Specialist'} is confirmed for ${validated.appointmentDate} at ${validated.startTime}.`,
      type: 'APPOINTMENT',
      link: '/patient/appointments',
      isRead: false,
      createdAt: new Date().toISOString()
    });
    sendNotificationToUser(user.id, patientNotif);

    if (doctorUser) {
      const docNotif = db.insertNotification({
        id: 'notif_' + Math.random().toString(36).substring(2, 11),
        userId: doctorUser.id,
        title: 'New Patient Booking',
        message: `${user.fullName} booked a ${validated.type.toLowerCase()} consultation for ${validated.appointmentDate} at ${validated.startTime}.`,
        type: 'APPOINTMENT',
        link: '/doctor/appointments',
        isRead: false,
        createdAt: new Date().toISOString()
      });
      sendNotificationToUser(doctorUser.id, docNotif);
    }

    logAudit({
      actor: user,
      action: 'APPOINTMENT_BOOKED',
      resourceType: 'Appointment',
      resourceId: aptId,
      details: `Booked appointment #${aptNumber} with Doctor ID ${doctor.id} on ${validated.appointmentDate} ${validated.startTime}`
    });

    return res.status(201).json({
      message: 'Appointment booked and confirmed successfully.',
      appointment: newAppointment
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.issues[0]?.message || 'Validation error' });
    }
    return res.status(500).json({ error: err.message || 'Error booking appointment.' });
  }
});

// Update appointment status (Cancel, Complete, Reschedule)
router.patch('/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const apt = db.schema.appointments.find(a => a.id === req.params.id);

    if (!apt) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    const docProfile = db.getDoctorProfileById(apt.doctorId);
    const isPatient = apt.patientId === user.id;
    const isDoctor = docProfile && docProfile.userId === user.id;
    const isAdmin = user.role === 'ADMIN';

    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden. You cannot modify this appointment.' });
    }

    const { status, cancellationReason, appointmentDate, startTime, endTime } = req.body;

    const updates: Partial<Appointment> = {};

    if (status) {
      updates.status = status as AppointmentStatus;
    }
    if (cancellationReason) {
      updates.cancellationReason = cancellationReason;
    }
    if (appointmentDate) {
      updates.appointmentDate = appointmentDate;
    }
    if (startTime) {
      updates.startTime = startTime;
    }
    if (endTime) {
      updates.endTime = endTime;
    }

    const updated = db.updateAppointment(apt.id, updates);

    // Notify other party
    const targetUserId = isPatient ? docProfile?.userId : apt.patientId;
    if (targetUserId) {
      const notif = db.insertNotification({
        id: 'notif_' + Math.random().toString(36).substring(2, 11),
        userId: targetUserId,
        title: `Appointment ${status ? status.toUpperCase() : 'Updated'}`,
        message: `Appointment #${apt.appointmentNumber} has been updated to ${status || 'new schedule'}.`,
        type: 'APPOINTMENT',
        link: isPatient ? '/doctor/appointments' : '/patient/appointments',
        isRead: false,
        createdAt: new Date().toISOString()
      });
      sendNotificationToUser(targetUserId, notif);
    }

    logAudit({
      actor: user,
      action: `APPOINTMENT_${status || 'UPDATED'}`,
      resourceType: 'Appointment',
      resourceId: apt.id,
      details: `Status updated to ${status || 'SCHEDULE_CHANGE'}`
    });

    return res.json({
      message: 'Appointment updated successfully.',
      appointment: updated
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error updating appointment.' });
  }
});

export default router;
