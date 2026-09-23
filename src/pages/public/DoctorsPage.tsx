import React, { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import { DoctorProfile } from '../../types/index.js';
import { BookingModal } from '../../components/appointments/BookingModal.js';
import { 
  Search, 
  Filter, 
  Star, 
  MapPin, 
  Video, 
  Building, 
  DollarSign, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Stethoscope,
  X
} from 'lucide-react';

interface DoctorsPageProps {
  initialSearch?: string;
  initialSpecialty?: string;
  onNavigate: (tab: string, extra?: any) => void;
}

const SPECIALTIES = [
  'All Specialties',
  'Cardiologist',
  'Dermatologist',
  'Neurologist',
  'Pediatrician',
  'Orthopedic',
  'Gynecologist',
  'General Physician',
  'Dentist',
  'Ophthalmologist',
  'Psychiatrist',
  'Pulmonologist'
];

export const DoctorsPage: React.FC<DoctorsPageProps> = ({
  initialSearch = '',
  initialSpecialty = '',
  onNavigate
}) => {
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedSpecialty, setSelectedSpecialty] = useState(initialSpecialty || 'All Specialties');
  const [consultationType, setConsultationType] = useState<string>('ALL');
  const [maxFee, setMaxFee] = useState<number>(300);
  const [minRating, setMinRating] = useState<number>(0);

  // Booking Modal State
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState<DoctorProfile | null>(null);
  const [bookingSuccessAppointment, setBookingSuccessAppointment] = useState<any | null>(null);

  // Fetch doctors with filters & search debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchDoctors();
    }, 250);

    return () => clearTimeout(handler);
  }, [searchQuery, selectedSpecialty, consultationType, maxFee, minRating]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (selectedSpecialty && selectedSpecialty !== 'All Specialties') params.set('specialization', selectedSpecialty);
      if (consultationType !== 'ALL') params.set('consultationType', consultationType);
      if (maxFee) params.set('maxFee', maxFee.toString());
      if (minRating > 0) params.set('minRating', minRating.toString());

      const res = await api.get<{ doctors: DoctorProfile[] }>(`/doctors?${params.toString()}`);
      setDoctors(res.doctors || []);
    } catch (e) {
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Page Header */}
      <div className="text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 text-cyan-700 text-xs font-semibold border border-cyan-200 mb-2">
          <Stethoscope className="w-3.5 h-3.5" />
          <span>Accredited Medical Directory</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Find Doctors & Medical Specialists
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Explore board-certified medical professionals available for in-person consultations or secure online video visits.
        </p>
      </div>

      {/* Booking Confirmation Toast */}
      {bookingSuccessAppointment && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-sm text-emerald-900">
                Appointment Booked: #{bookingSuccessAppointment.appointmentNumber}
              </p>
              <p className="text-xs text-emerald-700">
                Scheduled for {bookingSuccessAppointment.appointmentDate} at {bookingSuccessAppointment.startTime}. View in your Patient Portal.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('patient-appointments')}
              className="px-3.5 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-semibold hover:bg-emerald-800 transition-colors"
            >
              Go to Appointments
            </button>
            <button
              onClick={() => setBookingSuccessAppointment(null)}
              className="p-1 text-emerald-700 hover:text-emerald-900"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          
          {/* Text Search */}
          <div className="md:col-span-4 relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by doctor name or keyword..."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-cyan-600 focus:outline-hidden"
            />
          </div>

          {/* Specialty Dropdown */}
          <div className="md:col-span-3">
            <select
              value={selectedSpecialty}
              onChange={e => setSelectedSpecialty(e.target.value)}
              className="w-full py-2 px-3 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:ring-2 focus:ring-cyan-600 focus:outline-hidden"
            >
              {SPECIALTIES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Modality Filter */}
          <div className="md:col-span-3">
            <select
              value={consultationType}
              onChange={e => setConsultationType(e.target.value)}
              className="w-full py-2 px-3 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:ring-2 focus:ring-cyan-600 focus:outline-hidden"
            >
              <option value="ALL">All Consultation Modes</option>
              <option value="ONLINE">Video Telehealth Only</option>
              <option value="IN_PERSON">In-Person Clinic Only</option>
            </select>
          </div>

          {/* Max Fee Slider */}
          <div className="md:col-span-2 flex flex-col justify-center px-1">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Max Fee</span>
              <span className="font-bold text-slate-800">${maxFee}</span>
            </div>
            <input
              type="range"
              min={20}
              max={350}
              step={10}
              value={maxFee}
              onChange={e => setMaxFee(Number(e.target.value))}
              className="w-full accent-cyan-600"
            />
          </div>

        </div>
      </div>

      {/* Doctor Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-cyan-600 mb-3" />
          <p className="text-sm font-semibold">Querying verified clinical practitioners...</p>
        </div>
      ) : doctors.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center max-w-lg mx-auto space-y-4">
          <AlertCircle className="w-12 h-12 text-cyan-600/50 mx-auto" />
          <div>
            <h3 className="text-lg font-bold text-slate-900">No Doctors Registered Yet</h3>
            <p className="text-xs text-slate-500 mt-1">
              CareSync is freshly launched. Licensed physicians and medical specialists can register their practice to begin receiving consultation bookings.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('auth', { mode: 'register' })}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              Register as Doctor
            </button>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSpecialty('All Specialties');
                setConsultationType('ALL');
                setMaxFee(300);
              }}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map(doctor => (
            <div
              key={doctor.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden group"
            >
              <div className="p-6 space-y-4">
                
                {/* Header Profile */}
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-600 text-white flex items-center justify-center font-bold text-xl shrink-0 shadow-md">
                    {doctor.user?.avatarUrl ? (
                      <img src={doctor.user.avatarUrl} alt={doctor.user.fullName} className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      doctor.user?.fullName?.charAt(0) || 'D'
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-base font-bold text-slate-900 truncate">
                        Dr. {doctor.user?.fullName}
                      </h3>
                      {doctor.isVerified && (
                        <span title="Verified Medical License">
                          <ShieldCheck className="w-4 h-4 text-cyan-600 shrink-0" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-cyan-700">{doctor.specialization}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{doctor.qualifications.join(', ')} • {doctor.experienceYears}+ yrs exp</p>
                  </div>
                </div>

                {/* Hospital Affiliation */}
                <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <Building className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{doctor.hospital?.name || 'Metropolitan Healthcare Center'}</span>
                </div>

                {/* Bio */}
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {doctor.bio || 'Experienced clinical specialist dedicated to patient outcomes and ongoing treatment.'}
                </p>

                {/* Availability & Modality Chips */}
                <div className="space-y-2 pt-1">
                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    {doctor.onlineConsultation && (
                      <span className="bg-cyan-50 text-cyan-800 border border-cyan-200 px-2 py-0.5 rounded-md flex items-center gap-1 font-medium">
                        <Video className="w-3 h-3 text-cyan-600" /> Video Call
                      </span>
                    )}
                    {doctor.inPersonConsultation && (
                      <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md flex items-center gap-1 font-medium">
                        <Building className="w-3 h-3 text-slate-600" /> In-Clinic
                      </span>
                    )}
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1 font-medium">
                      <Star className="w-3 h-3 fill-emerald-600 text-emerald-600" /> {doctor.rating} ({doctor.reviewCount})
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Days: {doctor.availableDays.slice(0, 3).join(', ')}{doctor.availableDays.length > 3 ? '...' : ''}</span>
                  </div>
                </div>

              </div>

              {/* Action Footer */}
              <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Fee</span>
                  <span className="text-sm font-bold text-slate-900">${doctor.consultationFee} USD</span>
                </div>

                <button
                  onClick={() => setSelectedDoctorForBooking(doctor)}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-xl shadow-xs shadow-cyan-600/20 transition-all flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Book Consult</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Interactive Booking Modal */}
      {selectedDoctorForBooking && (
        <BookingModal
          doctor={selectedDoctorForBooking}
          isOpen={true}
          onClose={() => setSelectedDoctorForBooking(null)}
          onSuccess={(apt) => {
            setSelectedDoctorForBooking(null);
            setBookingSuccessAppointment(apt);
          }}
          onRequireAuth={() => {
            setSelectedDoctorForBooking(null);
            onNavigate('auth');
          }}
        />
      )}

    </div>
  );
};
