import React, { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import { DoctorProfile, ConsultationType } from '../../types/index.js';
import { 
  X, 
  Calendar, 
  Clock, 
  Video, 
  Building, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  DollarSign
} from 'lucide-react';

interface BookingModalProps {
  doctor: DoctorProfile;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (appointment: any) => void;
  onRequireAuth: () => void;
}

interface Slot {
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  doctor,
  isOpen,
  onClose,
  onSuccess,
  onRequireAuth
}) => {
  const { user } = useAuth();

  // Next 7 days default
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [consultationType, setConsultationType] = useState<ConsultationType>(
    doctor.onlineConsultation ? 'ONLINE' : 'IN_PERSON'
  );
  const [symptoms, setSymptoms] = useState('');
  const [notes, setNotes] = useState('');

  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsData, setSlotsData] = useState<{ available: boolean; reason?: string; slots: Slot[] }>({
    available: true,
    slots: []
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch slots whenever selectedDate or doctor changes
  useEffect(() => {
    if (!isOpen || !selectedDate) return;

    let isMounted = true;
    setLoadingSlots(true);
    setErrorMsg(null);
    setSelectedSlot(null);

    api.get(`/doctors/${doctor.id}/slots?date=${selectedDate}`)
      .then((res: any) => {
        if (isMounted) {
          setSlotsData(res);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setErrorMsg(err.message || 'Failed to load doctor schedule for this date.');
        }
      })
      .finally(() => {
        if (isMounted) setLoadingSlots(false);
      });

    return () => { isMounted = false; };
  }, [doctor.id, selectedDate, isOpen]);

  if (!isOpen) return null;

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onRequireAuth();
      return;
    }

    if (!selectedSlot) {
      setErrorMsg('Please select an available appointment time slot.');
      return;
    }

    if (!symptoms.trim()) {
      setErrorMsg('Please describe your symptoms or reason for visit.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await api.post('/appointments', {
        doctorId: doctor.id,
        hospitalId: doctor.hospitalId,
        appointmentDate: selectedDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        type: consultationType,
        symptoms: symptoms.trim(),
        notes: notes.trim() || undefined
      });

      onSuccess(res.appointment);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to schedule appointment. Time slot may have just been booked.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-cyan-950 text-white p-6 flex items-start justify-between">
          <div>
            <span className="text-cyan-400 text-xs font-semibold uppercase tracking-wider">Book Consultation</span>
            <h3 className="text-xl font-bold mt-1">Dr. {doctor.user?.fullName}</h3>
            <p className="text-slate-300 text-sm">{doctor.specialization} • {doctor.hospital?.name || 'CareSync Partner Facility'}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="bg-red-50 border-b border-red-200 p-4 flex items-center gap-3 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleBookingSubmit} className="p-6 space-y-6">
          
          {/* Step 1: Consultation Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              1. Consultation Modality
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={!doctor.onlineConsultation}
                onClick={() => setConsultationType('ONLINE')}
                className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                  consultationType === 'ONLINE'
                    ? 'border-cyan-600 bg-cyan-50/70 text-cyan-950 ring-1 ring-cyan-600'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                } ${!doctor.onlineConsultation ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="p-2 rounded-lg bg-cyan-600 text-white shrink-0">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Video Consultation</p>
                  <p className="text-xs text-slate-500 mt-0.5">Secure WebRTC Telehealth Call</p>
                </div>
              </button>

              <button
                type="button"
                disabled={!doctor.inPersonConsultation}
                onClick={() => setConsultationType('IN_PERSON')}
                className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                  consultationType === 'IN_PERSON'
                    ? 'border-cyan-600 bg-cyan-50/70 text-cyan-950 ring-1 ring-cyan-600'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                } ${!doctor.inPersonConsultation ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="p-2 rounded-lg bg-slate-800 text-white shrink-0">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Hospital Clinic Visit</p>
                  <p className="text-xs text-slate-500 mt-0.5">In-person outpatient department</p>
                </div>
              </button>
            </div>
          </div>

          {/* Step 2: Date & Available Time Slots */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                2. Select Date & Slot
              </label>
              <span className="text-xs text-slate-500">
                Working days: {doctor.availableDays.join(', ')}
              </span>
            </div>

            <div className="flex gap-4 items-center mb-4">
              <div className="relative flex-1">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="date"
                  min={todayStr}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-cyan-600 focus:outline-hidden"
                  required
                />
              </div>
            </div>

            {/* Time Slot Picker */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              {loadingSlots ? (
                <div className="flex items-center justify-center py-6 text-slate-500 text-sm gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-600" />
                  <span>Loading real-time doctor availability...</span>
                </div>
              ) : !slotsData.available ? (
                <div className="py-6 text-center text-sm text-slate-600">
                  <AlertCircle className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                  <p className="font-medium">{slotsData.reason || 'Doctor is not available on this date.'}</p>
                  <p className="text-xs text-slate-400 mt-1">Please select another date matching doctor practice days.</p>
                </div>
              ) : slotsData.slots.length === 0 ? (
                <div className="py-6 text-center text-sm text-slate-500">
                  No slots scheduled for this day.
                </div>
              ) : (
                <div>
                  <p className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Available slots ({doctor.slotDurationMinutes || 30} mins per session):
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                    {slotsData.slots.map((slot, idx) => (
                      <button
                        key={idx}
                        type="button"
                        disabled={slot.isBooked}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-center ${
                          slot.isBooked
                            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed line-through'
                            : selectedSlot?.startTime === slot.startTime
                            ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-cyan-400 text-slate-800'
                        }`}
                      >
                        {slot.startTime} - {slot.endTime}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Symptoms & Reason for Visit */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              3. Chief Medical Complaint / Reason
            </label>
            <textarea
              rows={3}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="E.g. Recurrent migraines for 3 days, mild fever, chest tightness..."
              className="w-full p-3 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-cyan-600 focus:outline-hidden"
              required
            />
          </div>

          {/* Price and Confirmation Footer */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Consultation Fee</p>
                <p className="text-base font-bold text-slate-900">${doctor.consultationFee}.00 USD</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting || !selectedSlot}
                className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-md shadow-cyan-600/20 flex items-center gap-2 transition-all"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Booking...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Booking</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
