import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/database.js';
import { requireAuth, requireRole, AuthenticatedRequest, optionalAuth } from '../middleware/auth.js';
import { logAudit } from '../services/audit.js';

const router = Router();

// Standard specializations catalog
const SPECIALIZATIONS = [
  'Cardiologist',
  'Dermatologist',
  'Neurologist',
  'Pediatrician',
  'Orthopedic',
  'Gynecologist',
  'General Physician',
  'Dentist',
  'Ophthalmologist',
  'Psychiatrist',
  'Pulmonologist',
  'Endocrinologist',
  'Urologist',
  'Oncologist'
];

router.get('/specializations', (_req, res) => {
  return res.json({ specializations: SPECIALIZATIONS });
});

// Search & List Doctors
router.get('/', optionalAuth, (req, res) => {
  const { 
    q, 
    specialization, 
    hospitalId, 
    consultationType, 
    minRating, 
    maxFee, 
    page = '1', 
    limit = '12' 
  } = req.query;

  const pageNum = parseInt(page as string, 10) || 1;
  const limitNum = parseInt(limit as string, 10) || 12;

  let doctors = db.schema.doctorProfiles.map(doc => {
    const user = db.findUserById(doc.userId);
    const hospital = doc.hospitalId ? db.getHospitalById(doc.hospitalId) : undefined;
    return {
      ...doc,
      user: user ? {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl
      } : null,
      hospital: hospital ? {
        id: hospital.id,
        name: hospital.name,
        city: hospital.city,
        address: hospital.address
      } : null
    };
  }).filter(d => d.user !== null);

  // Filters
  if (q) {
    const query = (q as string).toLowerCase().trim();
    doctors = doctors.filter(d => 
      d.user?.fullName.toLowerCase().includes(query) ||
      d.specialization.toLowerCase().includes(query) ||
      d.hospital?.name.toLowerCase().includes(query) ||
      d.bio?.toLowerCase().includes(query)
    );
  }

  if (specialization) {
    const spec = (specialization as string).toLowerCase();
    doctors = doctors.filter(d => d.specialization.toLowerCase() === spec);
  }

  if (hospitalId) {
    doctors = doctors.filter(d => d.hospitalId === hospitalId);
  }

  if (consultationType === 'ONLINE') {
    doctors = doctors.filter(d => d.onlineConsultation);
  } else if (consultationType === 'IN_PERSON') {
    doctors = doctors.filter(d => d.inPersonConsultation);
  }

  if (minRating) {
    const r = parseFloat(minRating as string);
    doctors = doctors.filter(d => d.rating >= r);
  }

  if (maxFee) {
    const fee = parseFloat(maxFee as string);
    doctors = doctors.filter(d => d.consultationFee <= fee);
  }

  const total = doctors.length;
  const startIdx = (pageNum - 1) * limitNum;
  const paginated = doctors.slice(startIdx, startIdx + limitNum);

  return res.json({
    doctors: paginated,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    }
  });
});

// Doctor Profile by ID
router.get('/:id', (req, res) => {
  const doc = db.getDoctorProfileById(req.params.id) || 
              db.getDoctorProfileByUserId(req.params.id);

  if (!doc) {
    return res.status(404).json({ error: 'Doctor not found.' });
  }

  const user = db.findUserById(doc.userId);
  const hospital = doc.hospitalId ? db.getHospitalById(doc.hospitalId) : undefined;

  return res.json({
    ...doc,
    user: user ? {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl
    } : null,
    hospital
  });
});

// Doctor Available Slots for a given date
router.get('/:id/slots', (req, res) => {
  const { date } = req.query;
  if (!date || typeof date !== 'string') {
    return res.status(400).json({ error: 'Date query parameter (YYYY-MM-DD) is required.' });
  }

  const doc = db.getDoctorProfileById(req.params.id) || 
              db.getDoctorProfileByUserId(req.params.id);

  if (!doc) {
    return res.status(404).json({ error: 'Doctor not found.' });
  }

  // Parse day of week for requested date
  const selectedDate = new Date(date + 'T00:00:00');
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = dayNames[selectedDate.getDay()];

  // Check if doctor works on this day
  const isAvailableDay = doc.availableDays.some(d => d.toLowerCase() === dayName.toLowerCase());
  if (!isAvailableDay) {
    return res.json({
      date,
      dayName,
      available: false,
      reason: `Doctor is not scheduled for practice on ${dayName}s.`,
      slots: []
    });
  }

  // Generate slots from availableStartTime to availableEndTime (e.g. 09:00 to 17:00)
  const slotMinutes = doc.slotDurationMinutes || 30;
  const [startHour, startMin] = doc.availableStartTime.split(':').map(Number);
  const [endHour, endMin] = doc.availableEndTime.split(':').map(Number);

  const startTotalMinutes = startHour * 60 + startMin;
  const endTotalMinutes = endHour * 60 + endMin;

  const generatedSlots: Array<{ startTime: string; endTime: string; isBooked: boolean }> = [];

  for (let m = startTotalMinutes; m + slotMinutes <= endTotalMinutes; m += slotMinutes) {
    const sH = String(Math.floor(m / 60)).padStart(2, '0');
    const sM = String(m % 60).padStart(2, '0');
    const eH = String(Math.floor((m + slotMinutes) / 60)).padStart(2, '0');
    const eM = String((m + slotMinutes) % 60).padStart(2, '0');

    const slotStart = `${sH}:${sM}`;
    const slotEnd = `${eH}:${eM}`;

    // Safeguard check against double booking
    const isBooked = db.checkDoubleBooking(doc.id, date, slotStart);

    generatedSlots.push({
      startTime: slotStart,
      endTime: slotEnd,
      isBooked
    });
  }

  return res.json({
    date,
    dayName,
    available: true,
    slots: generatedSlots
  });
});

// Update Doctor Profile (Doctor only)
const updateProfileSchema = z.object({
  specialization: z.string().min(2),
  hospitalId: z.string().optional(),
  qualifications: z.array(z.string()).default(['MBBS']),
  experienceYears: z.number().min(0),
  licenseNumber: z.string().min(3),
  consultationFee: z.number().min(0),
  languages: z.array(z.string()).default(['English']),
  bio: z.string().optional(),
  availableDays: z.array(z.string()),
  availableStartTime: z.string(),
  availableEndTime: z.string(),
  slotDurationMinutes: z.number().default(30),
  onlineConsultation: z.boolean().default(true),
  inPersonConsultation: z.boolean().default(true)
});

router.post('/profile', requireAuth, requireRole(['DOCTOR']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const validated = updateProfileSchema.parse(req.body);

    const existing = db.getDoctorProfileByUserId(user.id);
    const updated = db.upsertDoctorProfile({
      id: existing?.id || 'doc_' + Math.random().toString(36).substring(2, 11),
      userId: user.id,
      ...validated,
      isVerified: existing?.isVerified || false,
      rating: existing?.rating || 5.0,
      reviewCount: existing?.reviewCount || 0,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    logAudit({
      actor: user,
      action: 'DOCTOR_PROFILE_UPDATED',
      resourceType: 'DoctorProfile',
      resourceId: updated.id,
      details: `Doctor updated practice information and availability`
    });

    return res.json({
      message: 'Doctor profile updated successfully.',
      profile: updated
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.issues[0]?.message || 'Validation error' });
    }
    return res.status(500).json({ error: err.message || 'Error updating doctor profile.' });
  }
});

export default router;
