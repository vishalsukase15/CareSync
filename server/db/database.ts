import fs from 'fs';
import path from 'path';
import { 
  DatabaseSchema, 
  User, 
  PatientProfile, 
  DoctorProfile, 
  Hospital, 
  HospitalDepartment, 
  Appointment, 
  MedicalRecord, 
  Prescription, 
  Recommendation, 
  LabReport, 
  BedAvailability, 
  Conversation, 
  Message, 
  VideoConsultation, 
  Notification, 
  AuditLog 
} from './types.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'caresync-db.json');

const INITIAL_SCHEMA: DatabaseSchema = {
  users: [],
  patientProfiles: [],
  doctorProfiles: [],
  hospitals: [],
  hospitalDepartments: [],
  appointments: [],
  medicalRecords: [],
  prescriptions: [],
  recommendations: [],
  labReports: [],
  bedAvailabilities: [],
  conversations: [],
  messages: [],
  videoConsultations: [],
  notifications: [],
  auditLogs: []
};

class DatabaseEngine {
  private data: DatabaseSchema;
  private saveTimer: NodeJS.Timeout | null = null;
  private isSaving = false;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(content);
        return {
          ...INITIAL_SCHEMA,
          ...parsed
        };
      }
    } catch (err) {
      console.error('[DB] Failed to load database, initializing empty:', err);
    }
    return { ...INITIAL_SCHEMA };
  }

  public scheduleSave() {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
    this.saveTimer = setTimeout(() => {
      this.persistToFile();
    }, 150);
  }

  private persistToFile() {
    if (this.isSaving) return;
    this.isSaving = true;

    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('[DB] Error persisting database to disk:', err);
    } finally {
      this.isSaving = false;
    }
  }

  // Schema Accessors
  public get schema(): DatabaseSchema {
    return this.data;
  }

  // Users
  public findUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public insertUser(user: User): User {
    if (this.findUserByEmail(user.email)) {
      throw new Error('A user with this email already exists.');
    }
    this.data.users.push(user);
    this.scheduleSave();
    return user;
  }

  public updateUser(id: string, updates: Partial<User>): User {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('User not found.');
    this.data.users[idx] = { ...this.data.users[idx], ...updates, updatedAt: new Date().toISOString() };
    this.scheduleSave();
    return this.data.users[idx];
  }

  // Profiles
  public getPatientProfile(userId: string): PatientProfile | undefined {
    return this.data.patientProfiles.find(p => p.userId === userId);
  }

  public upsertPatientProfile(profile: PatientProfile): PatientProfile {
    const idx = this.data.patientProfiles.findIndex(p => p.userId === profile.userId);
    if (idx >= 0) {
      this.data.patientProfiles[idx] = { ...this.data.patientProfiles[idx], ...profile, updatedAt: new Date().toISOString() };
    } else {
      this.data.patientProfiles.push(profile);
    }
    this.scheduleSave();
    return profile;
  }

  public getDoctorProfileByUserId(userId: string): DoctorProfile | undefined {
    return this.data.doctorProfiles.find(d => d.userId === userId);
  }

  public getDoctorProfileById(id: string): DoctorProfile | undefined {
    return this.data.doctorProfiles.find(d => d.id === id);
  }

  public upsertDoctorProfile(profile: DoctorProfile): DoctorProfile {
    const idx = this.data.doctorProfiles.findIndex(d => d.userId === profile.userId);
    if (idx >= 0) {
      this.data.doctorProfiles[idx] = { ...this.data.doctorProfiles[idx], ...profile, updatedAt: new Date().toISOString() };
    } else {
      this.data.doctorProfiles.push(profile);
    }
    this.scheduleSave();
    return profile;
  }

  // Hospitals
  public getHospitals(): Hospital[] {
    return this.data.hospitals;
  }

  public getHospitalById(id: string): Hospital | undefined {
    return this.data.hospitals.find(h => h.id === id);
  }

  public insertHospital(hospital: Hospital): Hospital {
    this.data.hospitals.push(hospital);
    this.scheduleSave();
    return hospital;
  }

  public updateHospital(id: string, updates: Partial<Hospital>): Hospital {
    const idx = this.data.hospitals.findIndex(h => h.id === id);
    if (idx === -1) throw new Error('Hospital not found.');
    this.data.hospitals[idx] = { ...this.data.hospitals[idx], ...updates, updatedAt: new Date().toISOString() };
    this.scheduleSave();
    return this.data.hospitals[idx];
  }

  // Appointments with double-booking prevention!
  public checkDoubleBooking(doctorId: string, date: string, startTime: string, excludeAppointmentId?: string): boolean {
    const conflicts = this.data.appointments.filter(a => 
      a.doctorId === doctorId &&
      a.appointmentDate === date &&
      a.startTime === startTime &&
      a.status !== 'CANCELLED' &&
      a.status !== 'NO_SHOW' &&
      (!excludeAppointmentId || a.id !== excludeAppointmentId)
    );
    return conflicts.length > 0;
  }

  public insertAppointment(appointment: Appointment): Appointment {
    // Transactional safeguard against double booking
    if (this.checkDoubleBooking(appointment.doctorId, appointment.appointmentDate, appointment.startTime)) {
      throw new Error('This time slot is already booked for the selected doctor. Please select another slot.');
    }
    this.data.appointments.push(appointment);
    this.scheduleSave();
    return appointment;
  }

  public updateAppointment(id: string, updates: Partial<Appointment>): Appointment {
    const idx = this.data.appointments.findIndex(a => a.id === id);
    if (idx === -1) throw new Error('Appointment not found.');
    
    // If updating date or time, verify no conflicts
    const current = this.data.appointments[idx];
    const targetDoc = updates.doctorId || current.doctorId;
    const targetDate = updates.appointmentDate || current.appointmentDate;
    const targetTime = updates.startTime || current.startTime;
    
    if ((updates.appointmentDate && updates.appointmentDate !== current.appointmentDate) ||
        (updates.startTime && updates.startTime !== current.startTime)) {
      if (this.checkDoubleBooking(targetDoc, targetDate, targetTime, id)) {
        throw new Error('The requested new appointment time slot conflicts with an existing booking.');
      }
    }

    this.data.appointments[idx] = { ...this.data.appointments[idx], ...updates, updatedAt: new Date().toISOString() };
    this.scheduleSave();
    return this.data.appointments[idx];
  }

  // Medical Records
  public insertMedicalRecord(record: MedicalRecord): MedicalRecord {
    this.data.medicalRecords.push(record);
    this.scheduleSave();
    return record;
  }

  // Prescriptions
  public insertPrescription(prescription: Prescription): Prescription {
    this.data.prescriptions.push(prescription);
    this.scheduleSave();
    return prescription;
  }

  // Recommendations
  public insertRecommendation(rec: Recommendation): Recommendation {
    this.data.recommendations.push(rec);
    this.scheduleSave();
    return rec;
  }

  // Lab Reports
  public insertLabReport(report: LabReport): LabReport {
    this.data.labReports.push(report);
    this.scheduleSave();
    return report;
  }

  // Conversations & Messages
  public getOrCreateConversation(participant1Id: string, participant2Id: string): Conversation {
    const found = this.data.conversations.find(c => 
      (c.participant1Id === participant1Id && c.participant2Id === participant2Id) ||
      (c.participant1Id === participant2Id && c.participant2Id === participant1Id)
    );
    if (found) return found;

    const newConv: Conversation = {
      id: 'conv_' + Math.random().toString(36).substring(2, 11),
      participant1Id,
      participant2Id,
      lastMessageAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    this.data.conversations.push(newConv);
    this.scheduleSave();
    return newConv;
  }

  public insertMessage(msg: Message): Message {
    this.data.messages.push(msg);
    const conv = this.data.conversations.find(c => c.id === msg.conversationId);
    if (conv) {
      conv.lastMessageAt = msg.createdAt;
    }
    this.scheduleSave();
    return msg;
  }

  // Video Consultation
  public upsertVideoConsultation(consult: VideoConsultation): VideoConsultation {
    const idx = this.data.videoConsultations.findIndex(v => v.appointmentId === consult.appointmentId);
    if (idx >= 0) {
      this.data.videoConsultations[idx] = { ...this.data.videoConsultations[idx], ...consult };
    } else {
      this.data.videoConsultations.push(consult);
    }
    this.scheduleSave();
    return consult;
  }

  // Notifications
  public insertNotification(notification: Notification): Notification {
    this.data.notifications.unshift(notification);
    this.scheduleSave();
    return notification;
  }

  // Audit Logs
  public insertAuditLog(log: AuditLog): AuditLog {
    this.data.auditLogs.unshift(log);
    // Keep max 1500 logs in memory
    if (this.data.auditLogs.length > 1500) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 1500);
    }
    this.scheduleSave();
    return log;
  }

}

export const db = new DatabaseEngine();

