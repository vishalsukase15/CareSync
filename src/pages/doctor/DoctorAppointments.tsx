import React, { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import { Appointment } from '../../types/index.js';
import { NewPrescriptionModal } from './NewPrescriptionModal.js';
import { 
  Calendar, 
  Video, 
  Clock, 
  Pill, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Check, 
  X,
  Loader2,
  DollarSign
} from 'lucide-react';

interface DoctorAppointmentsProps {
  onJoinVideoCall: (appointmentId: string) => void;
}

export const DoctorAppointments: React.FC<DoctorAppointmentsProps> = ({ onJoinVideoCall }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'CONFIRMED' | 'PENDING' | 'COMPLETED'>('ALL');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Prescription modal
  const [prescriptionTarget, setPrescriptionTarget] = useState<Appointment | null>(null);

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

  const handleUpdateStatus = async (appointmentId: string, status: string) => {
    setActionLoadingId(appointmentId);
    try {
      await api.patch(`/appointments/${appointmentId}/status`, { status });
      fetchAppointments();
    } catch (err: any) {
      alert(err.message || 'Status update failed.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredAppointments = appointments.filter(a => {
    if (filter === 'ALL') return true;
    return a.status === filter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Patient Appointment Roster
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Manage clinical consultation requests, launch telehealth sessions, and issue digital prescriptions.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl max-w-md border border-slate-200">
        {(['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED'] as const).map(tab => (
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
          <p className="text-sm font-semibold">Loading practice schedule...</p>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center max-w-md mx-auto">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No appointments in this view</h3>
          <p className="text-xs text-slate-500 mt-1">Patient bookings will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map(apt => (
            <div
              key={apt.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-left"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    {apt.appointmentNumber}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    {apt.patient?.fullName || 'Patient'}
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    ({apt.patient?.phone || apt.patient?.email})
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

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{apt.appointmentDate} • {apt.startTime} - {apt.endTime}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    {apt.type === 'ONLINE' ? (
                      <span className="text-cyan-700 flex items-center gap-1">
                        <Video className="w-3.5 h-3.5" /> Video Call
                      </span>
                    ) : (
                      <span>In-Person Clinic</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    <span>${apt.consultationFee}.00 USD</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-700">
                  <span className="font-semibold text-slate-500">Chief complaint: </span>
                  <span>{apt.symptoms}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {apt.status === 'PENDING' && (
                  <button
                    disabled={actionLoadingId === apt.id}
                    onClick={() => handleUpdateStatus(apt.id, 'CONFIRMED')}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm</span>
                  </button>
                )}

                {apt.type === 'ONLINE' && (apt.status === 'CONFIRMED' || apt.status === 'PENDING') && (
                  <button
                    onClick={() => onJoinVideoCall(apt.id)}
                    className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-md shadow-cyan-600/20"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Enter Room</span>
                  </button>
                )}

                {apt.status !== 'CANCELLED' && (
                  <button
                    onClick={() => setPrescriptionTarget(apt)}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1"
                  >
                    <Pill className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Write Rx</span>
                  </button>
                )}

                {apt.status === 'CONFIRMED' && (
                  <button
                    disabled={actionLoadingId === apt.id}
                    onClick={() => handleUpdateStatus(apt.id, 'COMPLETED')}
                    className="px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200"
                  >
                    Complete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Prescription Issue Modal */}
      {prescriptionTarget && (
        <NewPrescriptionModal
          patientId={prescriptionTarget.patientId}
          patientName={prescriptionTarget.patient?.fullName || 'Patient'}
          appointmentId={prescriptionTarget.id}
          isOpen={true}
          onClose={() => setPrescriptionTarget(null)}
          onSuccess={() => {
            alert('Prescription issued successfully and archived in patient EHR.');
          }}
        />
      )}

    </div>
  );
};
