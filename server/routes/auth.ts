import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/database.js';
import { 
  hashPassword, 
  comparePassword, 
  generateToken, 
  requireAuth, 
  AuthenticatedRequest 
} from '../middleware/auth.js';
import { logAudit } from '../services/audit.js';
import { User, UserRole } from '../db/types.js';

const router = Router();

// Zod schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().optional(),
  role: z.enum(['PATIENT', 'DOCTOR', 'HOSPITAL', 'ADMIN']).default('PATIENT'),
  // Optional doctor initial fields
  specialization: z.string().optional(),
  licenseNumber: z.string().optional(),
  // Optional hospital fields
  hospitalName: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

// Register
router.post('/register', async (req, res) => {
  try {
    const validated = registerSchema.parse(req.body);

    const existing = db.findUserByEmail(validated.email);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    const passwordHash = await hashPassword(validated.password);
    const userId = 'usr_' + Math.random().toString(36).substring(2, 11);

    const newUser: User = {
      id: userId,
      email: validated.email.toLowerCase().trim(),
      passwordHash,
      role: validated.role as UserRole,
      fullName: validated.fullName.trim(),
      phone: validated.phone?.trim(),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.insertUser(newUser);

    // Initialize corresponding role profile
    if (validated.role === 'PATIENT') {
      db.upsertPatientProfile({
        id: 'pat_' + Math.random().toString(36).substring(2, 11),
        userId: newUser.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } else if (validated.role === 'DOCTOR') {
      db.upsertDoctorProfile({
        id: 'doc_' + Math.random().toString(36).substring(2, 11),
        userId: newUser.id,
        specialization: validated.specialization || 'General Physician',
        qualifications: ['MBBS'],
        experienceYears: 1,
        licenseNumber: validated.licenseNumber || 'LIC-PENDING-' + Math.floor(1000 + Math.random() * 9000),
        consultationFee: 50,
        languages: ['English'],
        bio: 'Licensed healthcare professional dedicated to patient care and clinical excellence.',
        isVerified: false, // Requires admin verification
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        availableStartTime: '09:00',
        availableEndTime: '17:00',
        slotDurationMinutes: 30,
        onlineConsultation: true,
        inPersonConsultation: true,
        rating: 5.0,
        reviewCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } else if (validated.role === 'HOSPITAL' && validated.hospitalName) {
      const hospId = 'hosp_' + Math.random().toString(36).substring(2, 11);
      db.insertHospital({
        id: hospId,
        name: validated.hospitalName,
        licenseNumber: 'HOSP-' + Math.floor(10000 + Math.random() * 90000),
        address: 'Main Facility Way',
        city: 'Healthcare City',
        state: 'NY',
        postalCode: '10001',
        phone: validated.phone || '+1 (555) 000-0000',
        emergencyPhone: '+1 (555) 911-0000',
        email: validated.email,
        totalBeds: 100,
        availableBeds: 25,
        totalIcu: 15,
        availableIcu: 4,
        totalEmergency: 10,
        availableEmergency: 2,
        isVerified: false,
        managerUserId: newUser.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    logAudit({
      actor: newUser,
      action: 'USER_REGISTERED',
      resourceType: 'User',
      resourceId: newUser.id,
      details: `User registered with role ${newUser.role}`
    });

    const token = generateToken(newUser);

    // Set HTTP-Only cookie
    res.cookie('caresync_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    const { passwordHash: _, ...safeUser } = newUser;
    return res.status(201).json({
      message: 'Account created successfully.',
      user: safeUser,
      token
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.issues[0]?.message || 'Validation error' });
    }
    return res.status(500).json({ error: err.message || 'Server error during registration.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = db.findUserByEmail(email);

    if (!user) {
      logAudit({
        action: 'LOGIN_FAILED',
        resourceType: 'User',
        details: `Failed login attempt for email: ${email}`,
        status: 'FAILURE'
      });
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'This account has been deactivated. Please contact support.' });
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      logAudit({
        actor: user,
        action: 'LOGIN_FAILED',
        resourceType: 'User',
        resourceId: user.id,
        details: 'Incorrect password',
        status: 'FAILURE'
      });
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    logAudit({
      actor: user,
      action: 'LOGIN_SUCCESS',
      resourceType: 'User',
      resourceId: user.id,
      details: `User logged in with role ${user.role}`
    });

    const token = generateToken(user);

    res.cookie('caresync_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    const { passwordHash: _, ...safeUser } = user;
    return res.json({
      message: 'Welcome back!',
      user: safeUser,
      token
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.issues[0]?.message || 'Validation error' });
    }
    return res.status(500).json({ error: err.message || 'Server error during login.' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('caresync_token');
  return res.json({ message: 'Logged out successfully.' });
});

// Current User (/me)
router.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { passwordHash: _, ...safeUser } = user;

  let profileData: any = null;
  if (user.role === 'PATIENT') {
    profileData = db.getPatientProfile(user.id);
  } else if (user.role === 'DOCTOR') {
    profileData = db.getDoctorProfileByUserId(user.id);
  } else if (user.role === 'HOSPITAL') {
    profileData = db.getHospitals().find(h => h.managerUserId === user.id);
  }

  return res.json({
    user: safeUser,
    profile: profileData
  });
});

// Update Profile
router.put('/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { fullName, phone, avatarUrl, patientProfile } = req.body;

    const updatedUser = db.updateUser(user.id, {
      ...(fullName ? { fullName: fullName.trim() } : {}),
      ...(phone ? { phone: phone.trim() } : {}),
      ...(avatarUrl ? { avatarUrl } : {})
    });

    if (user.role === 'PATIENT' && patientProfile) {
      const existing = db.getPatientProfile(user.id);
      db.upsertPatientProfile({
        id: existing?.id || 'pat_' + Math.random().toString(36).substring(2, 11),
        userId: user.id,
        dateOfBirth: patientProfile.dateOfBirth,
        gender: patientProfile.gender,
        bloodGroup: patientProfile.bloodGroup,
        allergies: patientProfile.allergies,
        emergencyContactName: patientProfile.emergencyContactName,
        emergencyContactPhone: patientProfile.emergencyContactPhone,
        address: patientProfile.address,
        medicalNotes: patientProfile.medicalNotes,
        createdAt: existing?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    const { passwordHash: _, ...safeUser } = updatedUser;
    return res.json({
      message: 'Profile updated successfully.',
      user: safeUser,
      profile: user.role === 'PATIENT' ? db.getPatientProfile(user.id) : null
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error updating profile.' });
  }
});

export default router;
