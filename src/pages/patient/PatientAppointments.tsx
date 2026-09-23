import React, { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import { Appointment } from '../../types/index.js';
import { 
  Calendar, 
  Video, 
  Clock, 
  AlertCircle, 
  X, 
  CheckCircle2, 
  Building, 
  DollarSign, 
  Loader2,
  FileText
} from 'lucide-react';

interface PatientAppointmentsProps {
  onNavigate: (tab: string, extra?: any) => void;
  onJoinVideoCall: (appointmentId: string) => void;
}

export const PatientAppointments: React.FC<PatientAppointmentsProps> = ({ onNavigate, onJoinVideoCall }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED'>('UPCOMING');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAppointments = async () => {
    try {
      const res = await api.get<{ appointments: Appointment[] }>('/appointments');
      setAppointments(res.appointments || []);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancelAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingId) return;

    setActionLoading(true);
    try {
      await api.patch(`/appointments/${cancellingId}/cancel`, {
        reason: cancellationReason.trim() || 'Patient requested cancellation'
      });
      setCancellingId(null);
      setCancellationReason('');
      fetchAppointments();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel appointment.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredAppointments = appointments.filter(a => {
    if (filter === 'ALL') return true;
    if (filter === 'UPCOMING') return a.status === 'CONFIRMED' || a.status === 'PENDING';
    if (filter === 'COMPLETED') return a.status === 'COMPLETED';
    if (filter === 'CANCELLED') return a.status === 'CANCELLED';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Appointments
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Review your upcoming consultations, launch telehealth sessions, and manage bookings.
          </p>
        </div>

        <button
          onClick={() => onNavigate('doctors')}
          className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Calendar className="w-4 h-4" />
          <span>Book Specialist</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl max-w-md border border-slate-200">
        {(['UPCOMING', 'COMPLETED', 'CANCELLED', 'ALL'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              filter === tab ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-cyan-600 mb-2" />
          <p className="text-sm font-semibold">Loading your medical appointments...</p>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center max-w-md mx-auto">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No appointments in this view</h3>
          <p className="text-xs text-slate-500 mt-1">Scheduled medical consultations will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map(apt => (
            <div
              key={apt.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                    {apt.appointmentNumber}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Dr. {apt.doctor?.fullName || 'Physician'}
                  </h3>
                  <span className="text-xs font-semibold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200">
                    {apt.doctor?.specialization}
                  </span>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    apt.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                    apt.status === 'COMPLETED' ? 'bg-slate-100 text-slate-700 border border-slate-300' :
                    apt.status === 'CANCELLED' ? 'bg-red-100 text-red-800 border border-red-300' :
                    'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {apt.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{apt.appointmentDate} • {apt.startTime} - {apt.endTime}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {apt.type === 'ONLINE' ? (
                      <span className="text-cyan-700 font-semibold flex items-center gap-1">
                        <Video className="w-3.5 h-3.5" /> Video Telehealth Session
                      </span>
                    ) : (
                      <span className="text-slate-700 font-medium flex items-center gap-1">
                        <Building className="w-3.5 h-3.5" /> In-Clinic: {apt.hospital?.name || 'Metropolitan Center'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    <span>${apt.consultationFee}.00 USD ({apt.paymentStatus})</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-700">
                  <span className="font-semibold text-slate-500">Chief Complaint: </span>
                  <span>{apt.symptoms}</span>
                </div>

                {apt.cancellationReason && (
                  <p className="text-xs text-red-600 italic">
                    Cancellation note: {apt.cancellationReason}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                {apt.type === 'ONLINE' && (apt.status === 'CONFIRMED' || apt.status === 'PENDING') && (
                  <button
                    onClick={() => onJoinVideoCall(apt.id)}
                    className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-xl shadow-md shadow-cyan-600/25 flex items-center gap-1.5 transition-all"
                  >
                    <Video className="w-4 h-4" />
                    <span>Enter Video Room</span>
                  </button>
                )}

                {(apt.status === 'CONFIRMED' || apt.status === 'PENDING') && (
                  <button
                    onClick={() => setCancellingId(apt.id)}
                    className="px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancellation Modal */}
      {cancellingId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl">
            <h3 className="font-bold text-slate-900 text-base">Confirm Appointment Cancellation</h3>
            <p className="text-xs text-slate-500 mt-1">
              Please provide a brief reason for cancelling your appointment. The doctor will be notified.
            </p>
            <form onSubmit={handleCancelAppointment} className="mt-4 space-y-4">
              <textarea
                rows={3}
                required
                value={cancellationReason}
                onChange={e => setCancellationReason(e.target.value)}
                placeholder="Reason for cancellation (e.g. reschedule needed, symptoms resolved)..."
                className="w-full p-3 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-red-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCancellingId(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Keep Appointment
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  {actionLoading ? 'Processing...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
