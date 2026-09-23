import React, { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import { MedicalRecord, Prescription } from '../../types/index.js';
import { PrescriptionModal } from '../../components/records/PrescriptionModal.js';
import { 
  FileText, 
  Pill, 
  Printer, 
  Calendar, 
  Stethoscope, 
  Activity, 
  ShieldCheck, 
  Clock, 
  Search,
  Loader2,
  ChevronRight
} from 'lucide-react';

export const PatientRecords: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'RECORDS' | 'PRESCRIPTIONS'>('RECORDS');
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [recsRes, rxRes] = await Promise.all([
          api.get<{ records: MedicalRecord[] }>('/medical-records'),
          api.get<{ prescriptions: Prescription[] }>('/prescriptions')
        ]);
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 text-cyan-700 text-xs font-semibold border border-cyan-200 mb-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Encrypted Electronic Health Records (EHR)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Health Records & Prescriptions
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Access your clinical summaries, vital measurements, diagnoses, and validated medical prescriptions.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl max-w-sm border border-slate-200">
        <button
          onClick={() => setActiveTab('RECORDS')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'RECORDS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-cyan-600" />
          <span>Clinical Records ({records.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('PRESCRIPTIONS')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'PRESCRIPTIONS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Pill className="w-3.5 h-3.5 text-emerald-600" />
          <span>Prescriptions ({prescriptions.length})</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-cyan-600 mb-2" />
          <p className="text-sm font-semibold">Decentralizing authenticated health records...</p>
        </div>
      ) : activeTab === 'RECORDS' ? (
        // Medical Records Tab
        records.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center max-w-md mx-auto">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 text-base">No clinical records found</h3>
            <p className="text-xs text-slate-500 mt-1">Records filed following doctor consultations will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map(rec => (
              <div
                key={rec.id}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-slate-300 transition-all space-y-4 text-left"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200">
                      {rec.recordNumber}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(rec.createdAt).toLocaleDateString()} at {new Date(rec.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <span className="text-xs font-semibold text-slate-700">
                    Attending: Dr. {rec.doctor?.fullName} ({rec.doctor?.specialization})
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Primary Diagnosis
                  </span>
                  <p className="text-base font-bold text-slate-900">{rec.diagnosis}</p>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Physician Clinical Notes
                  </span>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
                    {rec.clinicalNotes}
                  </div>
                </div>

                {rec.vitals && (
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Recorded Clinical Vitals
                    </span>
                    <div className="flex flex-wrap gap-3 text-xs">
                      {rec.vitals.bloodPressure && (
                        <div className="bg-slate-100 px-3 py-1.5 rounded-lg">
                          <span className="text-slate-500">BP: </span>
                          <span className="font-bold text-slate-800">{rec.vitals.bloodPressure} mmHg</span>
                        </div>
                      )}
                      {rec.vitals.heartRate && (
                        <div className="bg-slate-100 px-3 py-1.5 rounded-lg">
                          <span className="text-slate-500">Pulse: </span>
                          <span className="font-bold text-slate-800">{rec.vitals.heartRate} bpm</span>
                        </div>
                      )}
                      {rec.vitals.temperature && (
                        <div className="bg-slate-100 px-3 py-1.5 rounded-lg">
                          <span className="text-slate-500">Temp: </span>
                          <span className="font-bold text-slate-800">{rec.vitals.temperature} °F</span>
                        </div>
                      )}
                      {rec.vitals.oxygenSaturation && (
                        <div className="bg-slate-100 px-3 py-1.5 rounded-lg">
                          <span className="text-slate-500">SpO2: </span>
                          <span className="font-bold text-slate-800">{rec.vitals.oxygenSaturation}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        // Prescriptions Tab
        prescriptions.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center max-w-md mx-auto">
            <Pill className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 text-base">No active prescriptions</h3>
            <p className="text-xs text-slate-500 mt-1">Prescriptions issued by attending physicians will be archived here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {prescriptions.map(rx => (
              <div
                key={rx.id}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-slate-300 transition-all space-y-4 text-left"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {rx.rxNumber}
                    </span>
                    <span className="text-xs text-slate-500">
                      Issued: {new Date(rx.issuedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedRx(rx)}
                    className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>View & Print Official Rx</span>
                  </button>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-900">Diagnosis: {rx.diagnosis}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Doctor: Dr. {rx.doctor?.fullName} • License: {rx.doctor?.licenseNumber}</p>
                </div>

                {/* Medications preview list */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Prescribed Regimen ({rx.medications.length} items)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {rx.medications.map((m, i) => (
                      <div key={i} className="bg-white p-3 rounded-lg border border-slate-200 text-xs">
                        <div className="flex justify-between font-bold text-slate-900">
                          <span>{m.name}</span>
                          <span className="text-cyan-700">{m.dosage}</span>
                        </div>
                        <p className="text-slate-500 mt-0.5">{m.frequency} for {m.duration}</p>
                        <p className="text-slate-400 italic text-[11px] mt-1">{m.instructions}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {rx.instructions && (
                  <p className="text-xs text-slate-600 italic">
                    Physician Instructions: {rx.instructions}
                  </p>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {/* Prescription Print Modal */}
      {selectedRx && (
        <PrescriptionModal
          prescription={selectedRx}
          isOpen={true}
          onClose={() => setSelectedRx(null)}
        />
      )}

    </div>
  );
};
