import React, { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import { Appointment, MedicalRecord, Prescription } from '../../types/index.js';
import { 
  Calendar, 
  Video, 
  FileText, 
  Pill, 
  Clock, 
  ChevronRight, 
  Activity, 
  AlertCircle,
  Stethoscope,
  Building,
  CheckCircle2
} from 'lucide-react';

interface PatientDashboardProps {
  onNavigate: (tab: string, extra?: any) => void;
  onJoinVideoCall: (appointmentId: string) => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({ onNavigate, onJoinVideoCall }) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [aptsRes, recsRes, rxRes] = await Promise.all([
          api.get<{ appointments: Appointment[] }>('/appointments'),
          api.get<{ records: MedicalRecord[] }>('/medical-records'),
          api.get<{ prescriptions: Prescription[] }>('/prescriptions')
        ]);
        setAppointments(aptsRes.appointments || []);
        setRecords(recsRes.records || []);
        setPrescriptions(rxRes.prescriptions || []);
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const upcomingAppointments = appointments.filter(
    a => a.status === 'CONFIRMED' || a.status === 'PENDING'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-cyan-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="text-cyan-400 text-xs font-semibold uppercase tracking-wider">Patient Health Workspace</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.fullName}
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
            Manage your scheduled physician consultations, view verified EHR health notes, and access digitally signed prescriptions.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => onNavigate('doctors')}
            className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
          >
            <Stethoscope className="w-4 h-4" />
            <span>Book New Appointment</span>
          </button>

          <button
            onClick={() => onNavigate('hospitals')}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl backdrop-blur-md transition-all flex items-center gap-1.5"
          >
            <Building className="w-4 h-4 text-cyan-300" />
            <span>Check ICU Tracker</span>
          </button>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-cyan-50 text-cyan-700 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Upcoming Visits</span>
            <p className="text-2xl font-bold text-slate-900">{upcomingAppointments.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">EHR Medical Records</span>
            <p className="text-2xl font-bold text-slate-900">{records.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Issued Prescriptions</span>
            <p className="text-2xl font-bold text-slate-900">{prescriptions.length}</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Appointments & Records */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Upcoming Consultations */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-600" />
              <span>Upcoming Consultations</span>
            </h3>
            <button
              onClick={() => onNavigate('patient-appointments')}
              className="text-xs text-cyan-600 hover:text-cyan-800 font-semibold flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">Loading consultations...</div>
          ) : upcomingAppointments.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="font-semibold text-slate-800 text-sm">No scheduled consultations</h4>
              <p className="text-xs text-slate-500 mt-1">Book an appointment with our verified specialist network.</p>
              <button
                onClick={() => onNavigate('doctors')}
                className="mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-semibold"
              >
                Find a Specialist
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingAppointments.map(apt => (
                <div
                  key={apt.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-cyan-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        Dr. {apt.doctor?.fullName || 'Physician'}
                      </span>
                      <span className="text-[11px] text-cyan-700 font-medium bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200">
                        {apt.doctor?.specialization}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {apt.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{apt.appointmentDate} at {apt.startTime} - {apt.endTime}</span>
                      <span>•</span>
                      <span>{apt.type === 'ONLINE' ? 'Video Telehealth' : 'In-Clinic Visit'}</span>
                    </p>

                    <p className="text-xs text-slate-600 mt-1 line-clamp-1 italic">
                      "{apt.symptoms}"
                    </p>
                  </div>

                  {/* Call Action */}
                  {apt.type === 'ONLINE' && (
                    <button
                      onClick={() => onJoinVideoCall(apt.id)}
                      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-xl shadow-xs shadow-cyan-600/20 flex items-center gap-1.5 shrink-0"
                    >
                      <Video className="w-4 h-4" />
                      <span>Join Call</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Recent Clinical Records */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              <span>Recent Health Records</span>
            </h3>
            <button
              onClick={() => onNavigate('patient-records')}
              className="text-xs text-cyan-600 hover:text-cyan-800 font-semibold flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {records.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="font-semibold text-slate-800 text-sm">No records filed yet</h4>
              <p className="text-xs text-slate-500 mt-1">Clinical notes filed by your doctors will securely display here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {records.slice(0, 3).map(rec => (
                <div
                  key={rec.id}
                  onClick={() => onNavigate('patient-records')}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 cursor-pointer transition-all text-xs"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono text-[10px] text-slate-400 font-bold">{rec.recordNumber}</span>
                    <span className="text-slate-400">{new Date(rec.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{rec.diagnosis}</h4>
                  <p className="text-slate-500 line-clamp-2 mt-1">{rec.clinicalNotes}</p>
                  <p className="text-[11px] text-cyan-700 font-medium mt-2">Dr. {rec.doctor?.fullName}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
