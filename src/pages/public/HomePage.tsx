import React, { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import { 
  Search, 
  BedDouble, 
  Calendar, 
  ShieldCheck, 
  Video, 
  HeartPulse, 
  Building2, 
  Clock, 
  UserCheck, 
  FileText, 
  ChevronRight, 
  AlertCircle,
  Activity,
  Award
} from 'lucide-react';
import { Hospital } from '../../types/index.js';

interface HomePageProps {
  onNavigate: (tab: string, extra?: any) => void;
}

const POPULAR_SPECIALTIES = [
  { name: 'General Physician', count: 'Family Care', icon: '🩺' },
  { name: 'Cardiologist', count: 'Heart & Vascular', icon: '❤️' },
  { name: 'Neurologist', count: 'Brain & Spine', icon: '🧠' },
  { name: 'Pediatrician', count: 'Child Healthcare', icon: '👶' },
  { name: 'Orthopedic', count: 'Bones & Joints', icon: '🦴' },
  { name: 'Dermatologist', count: 'Skin & Allergy', icon: '✨' },
  { name: 'Gynecologist', count: 'Women\'s Health', icon: '🌸' },
  { name: 'Psychiatrist', count: 'Mental Wellness', icon: '🌿' }
];

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');

  useEffect(() => {
    api.get<{ hospitals: Hospital[] }>('/hospitals')
      .then(res => setHospitals(res.hospitals.slice(0, 4)))
      .catch(() => {});
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate('doctors', { q: searchQuery, specialty: selectedSpecialty });
  };

  return (
    <div className="space-y-16 lg:space-y-24 pb-20">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-cyan-50/70 via-white to-white pt-12 lg:pt-20 pb-16 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-100/70 text-cyan-800 text-xs font-semibold border border-cyan-200">
                <ShieldCheck className="w-4 h-4 text-cyan-700" />
                <span>Verified Clinical Healthcare Network</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                Healthcare that <br />
                <span className="bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
                  stays connected.
                </span>
              </h1>

              <p className="text-lg text-slate-600 max-w-xl leading-relaxed">
                Find doctors, book appointments, consult online, and securely manage your health records with CareSync.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => onNavigate('doctors')}
                  className="px-6 py-3.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl shadow-lg shadow-cyan-600/25 transition-all text-sm flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  Find a Doctor
                </button>

                <button
                  onClick={() => onNavigate('doctors')}
                  className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all text-sm flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  Book Appointment
                </button>

                <button
                  onClick={() => onNavigate('hospitals')}
                  className="px-5 py-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold rounded-xl transition-all text-sm flex items-center gap-2"
                >
                  <BedDouble className="w-4 h-4 text-emerald-600" />
                  Check ICU Availability
                </button>
              </div>

              {/* Search Bar Widget */}
              <form onSubmit={handleSearchSubmit} className="mt-8 p-2.5 bg-white rounded-2xl shadow-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-6 relative flex items-center">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search doctor, condition, hospital..."
                    className="w-full pl-9 pr-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-4 border-t sm:border-t-0 sm:border-l border-slate-200 sm:pl-2 flex items-center">
                  <select
                    value={selectedSpecialty}
                    onChange={e => setSelectedSpecialty(e.target.value)}
                    className="w-full py-2 text-sm text-slate-700 bg-transparent focus:outline-hidden"
                  >
                    <option value="">All Specialties</option>
                    {POPULAR_SPECIALTIES.map(s => (
                      <option key={s.name} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    Search
                  </button>
                </div>
              </form>

              {/* Trust Indicators */}
              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>Licensed Medical Doctors</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-cyan-600" />
                  <span>Encrypted Video Consult</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>Real-time Bed Occupancy</span>
                </div>
              </div>
            </div>

            {/* Hero Visual Card: Live ICU & Telehealth Showcase */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200/80 relative">
                
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Live Hospital Status</span>
                  </div>
                  <button 
                    onClick={() => onNavigate('hospitals')}
                    className="text-xs text-cyan-600 hover:text-cyan-800 font-semibold flex items-center gap-0.5"
                  >
                    All Facilities <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-4 mt-4">
                  {hospitals.length === 0 ? (
                    <div className="py-8 text-center space-y-2">
                      <Building2 className="w-10 h-10 text-cyan-600/40 mx-auto" />
                      <h4 className="text-sm font-bold text-slate-800">Live ICU & Bed Telemetry</h4>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto">
                        Hospital administrators can register their facility to broadcast real-time ICU and emergency ward availability.
                      </p>
                      <button
                        type="button"
                        onClick={() => onNavigate('auth', { mode: 'register' })}
                        className="inline-block mt-2 text-xs font-bold text-cyan-600 hover:text-cyan-800"
                      >
                        Register Healthcare Facility →
                      </button>
                    </div>
                  ) : (
                    hospitals.map(h => (
                      <div key={h.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 hover:border-cyan-200 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{h.name}</h4>
                            <p className="text-xs text-slate-500">{h.city} • Emergency: {h.emergencyPhone}</p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            h.icuStatus === 'Available' ? 'bg-emerald-100 text-emerald-800' :
                            h.icuStatus === 'Limited' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                          }`}>
                            ICU: {h.availableIcu} / {h.totalIcu}
                          </span>
                        </div>

                        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="bg-white p-2 rounded-lg border border-slate-200/70">
                            <span className="text-[10px] text-slate-400 block font-semibold">General</span>
                            <span className="font-bold text-slate-800">{h.availableBeds} / {h.totalBeds}</span>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-slate-200/70">
                            <span className="text-[10px] text-slate-400 block font-semibold">ICU Beds</span>
                            <span className="font-bold text-cyan-700">{h.availableIcu} / {h.totalIcu}</span>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-slate-200/70">
                            <span className="text-[10px] text-slate-400 block font-semibold">Emergency</span>
                            <span className="font-bold text-emerald-700">{h.availableEmergency} / {h.totalEmergency}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Last sync: Just now</span>
                  <span className="text-amber-600 font-medium">Verify before transit</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Popular Medical Specialties */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 bg-cyan-50 px-3 py-1 rounded-full border border-cyan-200">
            Comprehensive Clinical Care
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            Browse by Medical Specialty
          </h2>
          <p className="text-slate-600 text-sm mt-1">
            Connect with board-certified physicians across primary care and clinical subspecialties.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {POPULAR_SPECIALTIES.map((spec, i) => (
            <div
              key={i}
              onClick={() => onNavigate('doctors', { specialty: spec.name })}
              className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-cyan-500 cursor-pointer transition-all group text-left"
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{spec.icon}</div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-cyan-600 transition-colors">{spec.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{spec.count}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How CareSync Works */}
      <section className="bg-slate-900 text-white py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-800">
              Workflow & Security
            </span>
            <h2 className="text-3xl font-bold mt-3">How CareSync Works</h2>
            <p className="text-slate-400 text-sm mt-2">
              A seamless, synchronized healthcare journey from symptom onset to clinical follow-up.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 relative">
              <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white font-bold flex items-center justify-center mb-4 text-base">
                1
              </div>
              <h3 className="text-lg font-bold mb-2">Find & Book Instantly</h3>
              <p className="text-slate-300 text-xs leading-relaxed">
                Filter verified medical practitioners by specialty, hospital affiliation, and consultation fees. Select your preferred date and slot with real-time double-booking prevention.
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 relative">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white font-bold flex items-center justify-center mb-4 text-base">
                2
              </div>
              <h3 className="text-lg font-bold mb-2">Attend Video Telehealth</h3>
              <p className="text-slate-300 text-xs leading-relaxed">
                Join a browser-native WebRTC video consultation without external downloads. Doctors review your history and record in-session clinical notes and diagnosis securely.
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center mb-4 text-base">
                3
              </div>
              <h3 className="text-lg font-bold mb-2">Access EHR & Prescriptions</h3>
              <p className="text-slate-300 text-xs leading-relaxed">
                View doctor-issued digital prescriptions, recommendations, and lab tests. All clinical data is governed by strict Role-Based Access Control (RBAC) and immutable audit logging.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-600 text-sm mt-1">
            Common inquiries regarding clinical consultations, ICU data, and patient confidentiality.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-900 text-sm">How is ICU and hospital bed availability updated?</h4>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Participating hospitals manage bed counters directly through their hospital operations portal. Any changes to ICU, General, or Emergency beds immediately broadcast to connected clients via WebSockets. However, patients are instructed to contact the facility directly to reserve emergency beds.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-900 text-sm">Can doctors access my medical records without an appointment?</h4>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              No. In strict accordance with our clinical authorization model, doctors may only access records for patients who have an active or previous consultation booking with them. Arbitrary browsing of patient health records is blocked and audited.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-900 text-sm">Are prescriptions generated by Artificial Intelligence?</h4>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Strictly no. CareSync enforces a zero-AI medical prescription policy. Every prescription and dosage regimen is entered directly by a licensed medical practitioner and digitally signed with their license number.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-900 text-sm">Are video consultations recorded?</h4>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              CareSync does not record or store peer-to-peer WebRTC video or audio streams by default, ensuring confidential and private discussions between doctor and patient.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};
