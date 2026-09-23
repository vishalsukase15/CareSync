import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/database.js';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.js';
import { logAudit } from '../services/audit.js';
import { broadcastBedUpdate } from '../sockets/signaling.js';

const router = Router();

function calculateStatus(available: number, total: number): 'Available' | 'Limited' | 'Full' | 'Unknown' {
  if (total <= 0) return 'Unknown';
  const ratio = available / total;
  if (available === 0) return 'Full';
  if (ratio < 0.20 || available <= 2) return 'Limited';
  return 'Available';
}

// Get all hospitals with bed availability
router.get('/', (req, res) => {
  const { city, q } = req.query;
  let hospitals = db.getHospitals();

  if (q) {
    const query = (q as string).toLowerCase().trim();
    hospitals = hospitals.filter(h => 
      h.name.toLowerCase().includes(query) ||
      h.city.toLowerCase().includes(query) ||
      h.address.toLowerCase().includes(query)
    );
  }

  if (city) {
    hospitals = hospitals.filter(h => h.city.toLowerCase() === (city as string).toLowerCase());
  }

  const enriched = hospitals.map(h => {
    const departments = db.schema.hospitalDepartments.filter(d => d.hospitalId === h.id);
    const doctors = db.schema.doctorProfiles.filter(d => d.hospitalId === h.id);

    return {
      ...h,
      icuStatus: calculateStatus(h.availableIcu, h.totalIcu),
      generalStatus: calculateStatus(h.availableBeds, h.totalBeds),
      emergencyStatus: calculateStatus(h.availableEmergency, h.totalEmergency),
      departmentCount: departments.length,
      doctorCount: doctors.length,
      clinicalDisclaimer: 'Availability information may change. Please confirm directly with the hospital before travelling.'
    };
  });

  return res.json({
    hospitals: enriched,
    timestamp: new Date().toISOString()
  });
});

// Get hospital details by ID
router.get('/:id', (req, res) => {
  const hospital = db.getHospitalById(req.params.id);
  if (!hospital) {
    return res.status(404).json({ error: 'Hospital not found.' });
  }

  const departments = db.schema.hospitalDepartments.filter(d => d.hospitalId === hospital.id);
  const doctors = db.schema.doctorProfiles
    .filter(d => d.hospitalId === hospital.id)
    .map(d => {
      const user = db.findUserById(d.userId);
      return {
        ...d,
        user: user ? {
          fullName: user.fullName,
          avatarUrl: user.avatarUrl,
          email: user.email
        } : null
      };
    });

  return res.json({
    ...hospital,
    icuStatus: calculateStatus(hospital.availableIcu, hospital.totalIcu),
    generalStatus: calculateStatus(hospital.availableBeds, hospital.totalBeds),
    emergencyStatus: calculateStatus(hospital.availableEmergency, hospital.totalEmergency),
    departments,
    doctors,
    clinicalDisclaimer: 'Availability information may change. Please confirm directly with the hospital before travelling.'
  });
});

// Update Bed & ICU Availability (Hospital or Admin)
const updateBedsSchema = z.object({
  totalBeds: z.number().min(0),
  availableBeds: z.number().min(0),
  totalIcu: z.number().min(0),
  availableIcu: z.number().min(0),
  totalEmergency: z.number().min(0),
  availableEmergency: z.number().min(0)
});

const handleBedUpdate = (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const hospitalId = req.params.id;
    const hospital = db.getHospitalById(hospitalId);

    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found.' });
    }

    // Role check: Hospital manager can only update their hospital; Admin can update any
    if (user.role === 'HOSPITAL' && hospital.managerUserId && hospital.managerUserId !== user.id) {
      return res.status(403).json({ error: 'Forbidden. You can only manage your assigned hospital facility.' });
    }

    const validated = updateBedsSchema.parse(req.body);

    if (validated.availableBeds > validated.totalBeds) {
      return res.status(400).json({ error: 'Available general beds cannot exceed total beds.' });
    }
    if (validated.availableIcu > validated.totalIcu) {
      return res.status(400).json({ error: 'Available ICU beds cannot exceed total ICU beds.' });
    }
    if (validated.availableEmergency > validated.totalEmergency) {
      return res.status(400).json({ error: 'Available emergency beds cannot exceed total emergency beds.' });
    }

    const updatedHospital = db.updateHospital(hospitalId, {
      ...validated,
      updatedAt: new Date().toISOString()
    });

    logAudit({
      actor: user,
      action: 'BED_AVAILABILITY_UPDATED',
      resourceType: 'Hospital',
      resourceId: hospitalId,
      details: `Updated beds: ICU (${validated.availableIcu}/${validated.totalIcu}), General (${validated.availableBeds}/${validated.totalBeds}), ER (${validated.availableEmergency}/${validated.totalEmergency})`
    });

    // Broadcast live update over WebSocket
    broadcastBedUpdate(hospitalId, {
      ...validated,
      icuStatus: calculateStatus(validated.availableIcu, validated.totalIcu),
      generalStatus: calculateStatus(validated.availableBeds, validated.totalBeds),
      emergencyStatus: calculateStatus(validated.availableEmergency, validated.totalEmergency)
    });

    return res.json({
      message: 'Bed and ICU availability updated successfully.',
      hospital: updatedHospital
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.issues[0]?.message || 'Validation error' });
    }
    return res.status(500).json({ error: err.message || 'Error updating bed availability.' });
  }
};

router.put('/:id/availability', requireAuth, requireRole(['HOSPITAL', 'ADMIN']), handleBedUpdate);
router.patch('/:id/beds', requireAuth, requireRole(['HOSPITAL', 'ADMIN']), handleBedUpdate);


// Create New Hospital Facility (Hospital staff or Admin)
const createHospitalSchema = z.object({
  name: z.string().min(2, 'Hospital name is required'),
  licenseNumber: z.string().min(3, 'License number is required'),
  address: z.string().min(3, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  postalCode: z.string().min(2, 'Postal code is required'),
  phone: z.string().min(5, 'Phone number is required'),
  emergencyPhone: z.string().min(5, 'Emergency contact phone is required'),
  email: z.string().email('Valid hospital email is required'),
  website: z.string().optional(),
  totalBeds: z.number().min(1, 'Total beds must be at least 1'),
  availableBeds: z.number().min(0),
  totalIcu: z.number().min(0),
  availableIcu: z.number().min(0),
  totalEmergency: z.number().min(0),
  availableEmergency: z.number().min(0),
  imageUrl: z.string().optional()
});

router.post('/', requireAuth, requireRole(['HOSPITAL', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const validated = createHospitalSchema.parse(req.body);

    if (validated.availableBeds > validated.totalBeds) {
      return res.status(400).json({ error: 'Available beds cannot exceed total beds.' });
    }
    if (validated.availableIcu > validated.totalIcu) {
      return res.status(400).json({ error: 'Available ICU beds cannot exceed total ICU beds.' });
    }
    if (validated.availableEmergency > validated.totalEmergency) {
      return res.status(400).json({ error: 'Available emergency beds cannot exceed total emergency beds.' });
    }

    const newHospital = {
      id: 'hosp_' + Math.random().toString(36).substring(2, 11),
      ...validated,
      isVerified: user.role === 'ADMIN', // Admin-created is auto-verified, hospital user created can be verified by admin
      managerUserId: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.insertHospital(newHospital);

    logAudit({
      actor: user,
      action: 'HOSPITAL_CREATED',
      resourceType: 'Hospital',
      resourceId: newHospital.id,
      details: `Created new hospital facility: ${newHospital.name}`
    });

    return res.status(201).json({
      message: 'Hospital facility created successfully.',
      hospital: newHospital
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.issues[0]?.message || 'Validation error' });
    }
    return res.status(500).json({ error: err.message || 'Error creating hospital facility.' });
  }
});

// Delete Hospital Facility (Hospital Manager or Admin)
router.delete('/:id', requireAuth, requireRole(['HOSPITAL', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const hospital = db.getHospitalById(req.params.id);
    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found.' });
    }

    if (user.role === 'HOSPITAL' && hospital.managerUserId !== user.id) {
      return res.status(403).json({ error: 'Forbidden. You can only delete your own facility.' });
    }

    const idx = db.schema.hospitals.findIndex(h => h.id === req.params.id);
    if (idx !== -1) {
      db.schema.hospitals.splice(idx, 1);
      // Remove its departments
      db.schema.hospitalDepartments = db.schema.hospitalDepartments.filter(d => d.hospitalId !== req.params.id);
      db.scheduleSave();
    }

    logAudit({
      actor: user,
      action: 'HOSPITAL_DELETED',
      resourceType: 'Hospital',
      resourceId: req.params.id,
      details: `Deleted hospital: ${hospital.name}`
    });

    return res.json({ message: 'Hospital facility removed successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error deleting hospital.' });
  }
});

// Add Department (Hospital or Admin)
router.post('/:id/departments', requireAuth, requireRole(['HOSPITAL', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, headDoctorName, phone, floor, description } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Department name is required.' });
    }

    const newDept = {
      id: 'dept_' + Math.random().toString(36).substring(2, 11),
      hospitalId: req.params.id,
      name: name.trim(),
      headDoctorName: headDoctorName?.trim(),
      phone: phone?.trim(),
      floor: floor?.trim(),
      description: description?.trim()
    };

    db.schema.hospitalDepartments.push(newDept);
    db.scheduleSave();

    return res.status(201).json({
      message: 'Department added successfully.',
      department: newDept
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to add department.' });
  }
});

export default router;
