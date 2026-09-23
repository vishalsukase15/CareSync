import React, { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import { Appointment, DoctorProfile } from '../../types/index.js';
import { 
  Users, 
  Calendar, 
  Video, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  FileText, 
  Settings, 
  DollarSign,
  ChevronRight
} from 'lucide-react';

interface DoctorDashboardProps {
  onNavigate: (tab: string, extra?: any) => void;
  onJoinVideoCall: (appointmentId: string) => void;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ onNavigate, onJoinVideoCall }) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDoctorData() {
      try {
        const [aptsRes, meRes] = await Promise.all([
          api.get<{ appointments: Appointment[] }>('/appointments'),
          api.get<{ user: any; profile: DoctorProfile }>('/auth/me')
        ]);
        setAppointments(aptsRes.appointments || []);
        setProfile(meRes.profile || null);
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadDoctorData();
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(a => a.appointmentDate === todayStr);
  const pendingAppointments = appointments.filter(a => a.status === 'PENDING');
  const completedAppointments = appointments.filter(a => a.status === 'COMPLETED');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 text-xs font-semibold uppercase tracking-wider">Clinical Practice Desk</span>
            {profile?.isVerified ? (
              <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> License Verified
              </span>
            ) : (
              <span className="bg-amber-950/80 text-amber-400 border border-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Pending Verification
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Dr. {user?.fullName}
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm">
            {profile?.specialization || 'Medical Specialist'} • Fee: ${profile?.consultationFee || 75}.00 USD • {profile?.hospital?.name || 'Metropolitan Center'}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => onNavigate('doctor-availability')}
            className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
          >
            <Clock className="w-4 h-4" />
            <span>Manage Shift & Availability</span>
          </button>
          <button
            onClick={() => onNavigate('doctor-appointments')}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl backdrop-blur-md transition-all flex items-center gap-1.5"
          >
            <Calendar className="w-4 h-4 text-cyan-300" />
            <span>Full Schedule</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-cyan-50 text-cyan-700 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Today's Visits</span>
            <p className="text-2xl font-bold text-slate-900">{todayAppointments.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Pending Requests</span>
            <p className="text-2xl font-bold text-slate-900">{pendingAppointments.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Completed</span>
            <p className="text-2xl font-bold text-slate-900">{completedAppointments.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-700 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Total Consults</span>
            <p className="text-2xl font-bold text-slate-900">{appointments.length}</p>
          </div>
        </div>
      </div>

      {/* Today's Queue & Action Center */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-600" />
              <span>Today's Consultation Schedule</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Date: {todayStr}</p>
          </div>

          <button
            onClick={() => onNavigate('doctor-appointments')}
            className="text-xs text-cyan-600 hover:text-cyan-800 font-bold flex items-center gap-1"
          >
            <span>All Scheduled Visits</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {todayAppointments.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Calendar className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <h4 className="font-semibold text-slate-700 text-sm">No appointments scheduled for today</h4>
            <p className="text-xs text-slate-400 mt-1">New patient bookings matching your practice hours will be displayed here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayAppointments.map(apt => (
              <div
                key={apt.id}
                className="p-4 rounded-2xl border border-slate-200 hover:border-cyan-400 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{apt.patient?.fullName}</span>
                    <span className="text-xs text-slate-500 font-mono">({apt.patient?.phone || apt.patient?.email})</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      apt.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {apt.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Slot: {apt.startTime} - {apt.endTime}</span>
                    <span>•</span>
                    <span>Modality: {apt.type === 'ONLINE' ? 'Video Telehealth' : 'In-Clinic'}</span>
                  </p>

                  <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1">
                    <span className="font-semibold text-slate-500">Chief complaint: </span>
                    {apt.symptoms}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {apt.type === 'ONLINE' && (
                    <button
                      onClick={() => onJoinVideoCall(apt.id)}
                      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-xl shadow-xs shadow-cyan-600/25 flex items-center gap-1.5 transition-all"
                    >
                      <Video className="w-4 h-4" />
                      <span>Start Video Consult</span>
                    </button>
                  )}
                  <button
                    onClick={() => onNavigate('doctor-appointments')}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200"
                  >
                    Clinical File
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
