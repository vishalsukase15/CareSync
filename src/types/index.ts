export type UserRole = 'PATIENT' | 'DOCTOR' | 'HOSPITAL' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface PatientProfile {
  id: string;
  userId: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  bloodGroup?: string;
  allergies?: string[];
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  address?: string;
  medicalNotes?: string;
}

export interface Hospital {
  id: string;
  name: string;
  licenseNumber: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  emergencyPhone: string;
  email: string;
  website?: string;
  totalBeds: number;
  availableBeds: number;
  totalIcu: number;
  availableIcu: number;
  totalEmergency: number;
  availableEmergency: number;
  isVerified: boolean;
  imageUrl?: string;
  managerUserId?: string;
  icuStatus?: 'Available' | 'Limited' | 'Full' | 'Unknown';
  generalStatus?: 'Available' | 'Limited' | 'Full' | 'Unknown';
  emergencyStatus?: 'Available' | 'Limited' | 'Full' | 'Unknown';
  departmentCount?: number;
  doctorCount?: number;
  clinicalDisclaimer?: string;
  updatedAt: string;
}

export interface DoctorProfile {
  id: string;
  userId: string;
  hospitalId?: string;
  specialization: string;
  qualifications: string[];
  experienceYears: number;
  licenseNumber: string;
  consultationFee: number;
  languages: string[];
  bio?: string;
  isVerified: boolean;
  availableDays: string[];
  availableStartTime: string;
  availableEndTime: string;
  slotDurationMinutes: number;
  onlineConsultation: boolean;
  inPersonConsultation: boolean;
  rating: number;
  reviewCount: number;
  user?: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
  };
  hospital?: {
    id: string;
    name: string;
    city: string;
    address: string;
  };
}

export type AppointmentStatus = 
  | 'PENDING' 
  | 'CONFIRMED' 
  | 'CANCELLED' 
  | 'COMPLETED' 
  | 'RESCHEDULED' 
  | 'NO_SHOW';

export type ConsultationType = 'ONLINE' | 'IN_PERSON';

export interface Appointment {
  id: string;
  appointmentNumber: string;
  patientId: string;
  doctorId: string;
  hospitalId?: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  type: ConsultationType;
  status: AppointmentStatus;
  symptoms: string;
  notes?: string;
  consultationFee: number;
  paymentStatus: 'PENDING' | 'PAID' | 'WAIVED';
  cancellationReason?: string;
  videoRoomId?: string;
  createdAt: string;
  patient?: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
  };
  doctor?: {
    id: string;
    userId: string;
    fullName: string;
    specialization: string;
    consultationFee: number;
    avatarUrl?: string;
  };
  hospital?: {
    id: string;
    name: string;
    address: string;
    city: string;
  };
}

export interface ClinicalVitals {
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  oxygenSaturation?: number;
  weightKg?: number;
}

export interface MedicalRecord {
  id: string;
  recordNumber: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  diagnosis: string;
  clinicalNotes: string;
  vitals?: ClinicalVitals;
  followUpDate?: string;
  isRestricted: boolean;
  createdAt: string;
  doctor?: {
    fullName: string;
    specialization: string;
  };
  patient?: {
    fullName: string;
    email: string;
  };
}

export interface PrescriptionItem {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface Prescription {
  id: string;
  rxNumber: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  diagnosis: string;
  medications: PrescriptionItem[];
  instructions?: string;
  issuedAt: string;
  doctor?: {
    fullName: string;
    specialization: string;
    licenseNumber: string;
    phone?: string;
  };
  patient?: {
    fullName: string;
    email: string;
    phone?: string;
  };
  hospital?: {
    name: string;
    address: string;
    phone: string;
  };
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'APPOINTMENT' | 'CONSULTATION' | 'PRESCRIPTION' | 'ICU' | 'SYSTEM';
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participant1Id: string;
  participant2Id: string;
  lastMessageAt: string;
  createdAt: string;
  otherParticipant?: {
    id: string;
    fullName: string;
    role: UserRole;
    avatarUrl?: string;
    doctorInfo?: { specialization: string };
  };
  lastMessage?: {
    content: string;
    createdAt: string;
    senderId: string;
  };
  unreadCount?: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
  status: 'SUCCESS' | 'FAILURE';
  timestamp: string;
}
