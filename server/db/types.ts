export type UserRole = 'PATIENT' | 'DOCTOR' | 'HOSPITAL' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  updatedAt: string;
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
  managerUserId?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HospitalDepartment {
  id: string;
  hospitalId: string;
  name: string;
  description?: string;
  headDoctorName?: string;
  phone?: string;
  floor?: string;
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
  availableStartTime: string; // e.g. "09:00"
  availableEndTime: string;   // e.g. "17:00"
  slotDurationMinutes: number;
  onlineConsultation: boolean;
  inPersonConsultation: boolean;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
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
  appointmentDate: string; // YYYY-MM-DD
  startTime: string;       // HH:mm
  endTime: string;         // HH:mm
  type: ConsultationType;
  status: AppointmentStatus;
  symptoms: string;
  notes?: string;
  consultationFee: number;
  paymentStatus: 'PENDING' | 'PAID' | 'WAIVED';
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
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
  updatedAt: string;
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
}

export interface Recommendation {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  category: 'DIET' | 'EXERCISE' | 'LIFESTYLE' | 'SPECIALIST_REFERRAL' | 'GENERAL';
  title: string;
  details: string;
  createdAt: string;
}

export interface LabReport {
  id: string;
  patientId: string;
  doctorId?: string;
  testName: string;
  testCategory: string;
  summary: string;
  resultsSummary: string;
  status: 'NORMAL' | 'ATTENTION_REQUIRED' | 'CRITICAL';
  testDate: string;
  createdAt: string;
}

export interface BedAvailability {
  id: string;
  hospitalId: string;
  wardType: 'ICU' | 'GENERAL' | 'EMERGENCY' | 'PEDIATRIC' | 'SURGICAL';
  totalBeds: number;
  availableBeds: number;
  occupiedBeds: number;
  lastUpdated: string;
  updatedBy: string;
}

export interface Conversation {
  id: string;
  participant1Id: string;
  participant2Id: string;
  lastMessageAt: string;
  createdAt: string;
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

export interface VideoConsultation {
  id: string;
  appointmentId: string;
  roomId: string;
  doctorId: string;
  patientId: string;
  status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  startedAt?: string;
  endedAt?: string;
  durationSeconds?: number;
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

export interface DatabaseSchema {
  users: User[];
  patientProfiles: PatientProfile[];
  doctorProfiles: DoctorProfile[];
  hospitals: Hospital[];
  hospitalDepartments: HospitalDepartment[];
  appointments: Appointment[];
  medicalRecords: MedicalRecord[];
  prescriptions: Prescription[];
  recommendations: Recommendation[];
  labReports: LabReport[];
  bedAvailabilities: BedAvailability[];
  conversations: Conversation[];
  messages: Message[];
  videoConsultations: VideoConsultation[];
  notifications: Notification[];
  auditLogs: AuditLog[];
}
