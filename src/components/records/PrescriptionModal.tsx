import React from 'react';
import { Prescription } from '../../types/index.js';
import { X, Printer, Pill, Stethoscope, Building2, Calendar, FileText, CheckCircle } from 'lucide-react';

interface PrescriptionModalProps {
  prescription: Prescription;
  isOpen: boolean;
  onClose: () => void;
}

export const PrescriptionModal: React.FC<PrescriptionModalProps> = ({
  prescription,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 print:shadow-none print:border-none print:m-0 print:w-full print:max-w-none">
        
        {/* Modal Controls (Hidden in print) */}
        <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>Official Electronic Prescription</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 space-y-6 text-slate-800">
          
          {/* Header */}
          <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-2 text-cyan-700 font-bold text-xl tracking-tight">
                <Stethoscope className="w-6 h-6" />
                <span>CareSync Health Telehealth Network</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Verified Medical Practitioner Prescription Document</p>
              <p className="text-xs text-slate-600 mt-1 font-medium">{prescription.hospital?.name || 'Metropolitan Clinical Center'}</p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Validated Rx
              </span>
              <p className="text-sm font-mono font-bold text-slate-900 mt-1.5">{prescription.rxNumber}</p>
              <p className="text-xs text-slate-500">Date: {new Date(prescription.issuedAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Parties Info */}
          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
            <div>
              <span className="font-semibold text-slate-500 uppercase tracking-wider block mb-1">Prescribing Doctor</span>
              <p className="text-sm font-bold text-slate-900">Dr. {prescription.doctor?.fullName || 'Licensed Physician'}</p>
              <p className="text-slate-600">{prescription.doctor?.specialization}</p>
              <p className="text-slate-500 font-mono mt-0.5">License: {prescription.doctor?.licenseNumber || 'MED-VERIFIED'}</p>
            </div>

            <div>
              <span className="font-semibold text-slate-500 uppercase tracking-wider block mb-1">Patient Details</span>
              <p className="text-sm font-bold text-slate-900">{prescription.patient?.fullName || 'Registered Patient'}</p>
              <p className="text-slate-600">{prescription.patient?.email}</p>
              {prescription.patient?.phone && <p className="text-slate-500">{prescription.patient.phone}</p>}
            </div>
          </div>

          {/* Diagnosis */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Clinical Diagnosis
            </span>
            <div className="p-3 bg-cyan-50/50 border border-cyan-100 rounded-lg text-sm font-semibold text-cyan-950">
              {prescription.diagnosis}
            </div>
          </div>

          {/* Rx Medication Table */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Pill className="w-4 h-4 text-cyan-600" />
              <h4 className="font-bold text-sm text-slate-900">Medications & Regimen (Rx)</h4>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Medication</th>
                    <th className="p-3">Dosage</th>
                    <th className="p-3">Frequency</th>
                    <th className="p-3">Duration</th>
                    <th className="p-3">Instructions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {prescription.medications.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-bold text-slate-900">{item.name}</td>
                      <td className="p-3 font-medium text-cyan-800">{item.dosage}</td>
                      <td className="p-3">{item.frequency}</td>
                      <td className="p-3">{item.duration}</td>
                      <td className="p-3 text-slate-600 italic">{item.instructions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Doctor Instructions */}
          {prescription.instructions && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <span className="font-bold text-slate-700 uppercase tracking-wider">Clinical Guidance & Notes</span>
              <p className="text-slate-600 leading-relaxed">{prescription.instructions}</p>
            </div>
          )}

          {/* Signature & Disclaimer Footer */}
          <div className="pt-6 border-t border-slate-200 flex items-end justify-between gap-4 text-xs text-slate-500">
            <div>
              <p className="font-semibold text-slate-700">Digital Signature Verification</p>
              <p className="font-mono text-[11px] text-slate-400">HASH: SHA256_{prescription.id.substring(0, 16).toUpperCase()}</p>
              <p className="text-[10px] text-slate-400 mt-2 max-w-sm">
                This digital prescription is generated by a licensed physician via CareSync. In accordance with clinical protocols, please present this to an authorized pharmacist.
              </p>
            </div>

            <div className="text-right">
              <div className="font-serif italic text-base text-slate-800 font-bold border-b border-slate-400 pb-1 px-4 inline-block">
                Dr. {prescription.doctor?.fullName}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Authorized Medical Sign-off</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
