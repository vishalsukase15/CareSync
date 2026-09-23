import React, { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import { DoctorProfile } from '../../types/index.js';
import { 
  Clock, 
  Calendar, 
  Video, 
  Building, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  ShieldCheck
} from 'lucide-react';

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

export const DoctorAvailability: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [slotDuration, setSlotDuration] = useState(30);
  const [onlineConsultation, setOnlineConsultation] = useState(true);
  const [inPersonConsultation, setInPersonConsultation] = useState(true);
  const [consultationFee, setConsultationFee] = useState(75);
  const [bio, setBio] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await api.get<{ user: any; profile: DoctorProfile }>('/auth/me');
        if (res.profile) {
          setProfile(res.profile);
          setAvailableDays(res.profile.availableDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
          setStartTime(res.profile.availableStartTime || '09:00');
          setEndTime(res.profile.availableEndTime || '17:00');
          setSlotDuration(res.profile.slotDurationMinutes || 30);
          setOnlineConsultation(res.profile.onlineConsultation ?? true);
          setInPersonConsultation(res.profile.inPersonConsultation ?? true);
          setConsultationFee(res.profile.consultationFee || 75);
          setBio(res.profile.bio || '');
        }
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const toggleDay = (day: string) => {
    if (availableDays.includes(day)) {
      if (availableDays.length === 1) return; // at least 1 day
      setAvailableDays(availableDays.filter(d => d !== day));
    } else {
      setAvailableDays([...availableDays, day]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      await api.put(`/doctors/${profile.id}/availability`, {
        availableDays,
        availableStartTime: startTime,
        availableEndTime: endTime,
        slotDurationMinutes: Number(slotDuration),
        onlineConsultation,
        inPersonConsultation,
        consultationFee: Number(consultationFee),
        bio
      });

      setSuccessMsg('Clinical practice availability saved successfully.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save practice settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-cyan-600 mb-2" />
        <p className="text-sm">Loading availability configuration...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 text-cyan-700 text-xs font-semibold border border-cyan-200 mb-2">
          <Clock className="w-3.5 h-3.5" />
          <span>Consultation Scheduling Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Doctor Availability & Practice Settings
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Configure your active practice days, appointment slot duration, and consultation modalities. Time slots will be computed dynamically with double-booking prevention.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-300 rounded-2xl flex items-center gap-3 text-red-800 text-sm font-semibold">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-8 text-left">
        
        {/* Section 1: Working Days */}
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
            1. Active Clinic & Practice Days
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {DAYS_OF_WEEK.map(day => {
              const active = availableDays.includes(day);
              return (
                <button
                  type="button"
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`py-3 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                    active
                      ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Shift Hours and Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Start Time
            </label>
            <input
              type="time"
              required
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl text-sm text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              End Time
            </label>
            <input
              type="time"
              required
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl text-sm text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Slot Duration
            </label>
            <select
              value={slotDuration}
              onChange={e => setSlotDuration(Number(e.target.value))}
              className="w-full p-2.5 border border-slate-300 rounded-xl text-sm text-slate-800 bg-white"
            >
              <option value={15}>15 Minutes (Brief)</option>
              <option value={30}>30 Minutes (Standard)</option>
              <option value={45}>45 Minutes (Extended)</option>
              <option value={60}>60 Minutes (Comprehensive)</option>
            </select>
          </div>
        </div>

        {/* Section 3: Modalities and Fees */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              Supported Consultation Modes
            </label>
            <div className="space-y-3 text-xs">
              <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={onlineConsultation}
                  onChange={e => setOnlineConsultation(e.target.checked)}
                  className="w-4 h-4 text-cyan-600 rounded-sm"
                />
                <div className="flex items-center gap-2 font-semibold text-slate-900">
                  <Video className="w-4 h-4 text-cyan-600" />
                  <span>Online Video Telehealth</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={inPersonConsultation}
                  onChange={e => setInPersonConsultation(e.target.checked)}
                  className="w-4 h-4 text-slate-800 rounded-sm"
                />
                <div className="flex items-center gap-2 font-semibold text-slate-900">
                  <Building className="w-4 h-4 text-slate-700" />
                  <span>Hospital Outpatient (In-Person)</span>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Standard Consultation Fee (USD)
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="number"
                min={10}
                max={1000}
                required
                value={consultationFee}
                onChange={e => setConsultationFee(Number(e.target.value))}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-800 font-bold"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Standard rate displayed to prospective patients.</p>

            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                Doctor Professional Bio
              </label>
              <textarea
                rows={2}
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Clinical background, sub-specialty interests, hospital honors..."
                className="w-full p-2 border border-slate-300 rounded-xl text-xs"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-600/20 flex items-center gap-2 transition-all"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Schedule...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Availability</span>
              </>
            )}
          </button>
        </div>

      </form>

    </div>
  );
};
