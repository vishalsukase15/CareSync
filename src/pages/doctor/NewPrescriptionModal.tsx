import React, { useState } from 'react';
import { api } from '../../api/client.js';
import { X, Plus, Trash2, Pill, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { PrescriptionItem } from '../../types/index.js';

interface NewPrescriptionModalProps {
  patientId: string;
  patientName: string;
  appointmentId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (prescription: any) => void;
}

export const NewPrescriptionModal: React.FC<NewPrescriptionModalProps> = ({
  patientId,
  patientName,
  appointmentId,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [diagnosis, setDiagnosis] = useState('');
  const [instructions, setInstructions] = useState('');
  const [medications, setMedications] = useState<PrescriptionItem[]>([
    { name: '', dosage: '', frequency: 'Twice daily', duration: '5 days', instructions: 'Take after meals' }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddMedication = () => {
    setMedications(prev => [
      ...prev,
      { name: '', dosage: '', frequency: 'Twice daily', duration: '5 days', instructions: 'Take after meals' }
    ]);
  };

  const handleRemoveMedication = (index: number) => {
    if (medications.length === 1) return;
    setMedications(prev => prev.filter((_, i) => i !== index));
  };

  const handleMedChange = (index: number, field: keyof PrescriptionItem, val: string) => {
    setMedications(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosis.trim()) {
      setErrorMsg('Diagnosis is required.');
      return;
    }

    const invalid = medications.some(m => !m.name.trim() || !m.dosage.trim());
    if (invalid) {
      setErrorMsg('Please ensure all medication names and dosages are specified.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await api.post('/prescriptions', {
        patientId,
        appointmentId,
        diagnosis: diagnosis.trim(),
        medications,
        instructions: instructions.trim() || undefined
      });

      onSuccess(res.prescription);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to issue prescription.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div>
            <span className="text-cyan-400 text-xs font-semibold uppercase">Official Clinical Issuance</span>
            <h3 className="text-lg font-bold">Issue Digital Prescription</h3>
            <p className="text-xs text-slate-400 mt-0.5">Patient: {patientName}</p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border-b border-red-200 p-3 flex items-center gap-2 text-red-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-left">
          {/* Diagnosis */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Primary Diagnosis *
            </label>
            <input
              type="text"
              required
              value={diagnosis}
              onChange={e => setDiagnosis(e.target.value)}
              placeholder="e.g. Acute Bronchitis, Essential Hypertension"
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-cyan-600 focus:outline-hidden"
            />
          </div>

          {/* Medications Form */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Pill className="w-3.5 h-3.5 text-cyan-600" />
                <span>Medications & Regimen (Rx) *</span>
              </label>
              <button
                type="button"
                onClick={handleAddMedication}
                className="text-xs text-cyan-600 hover:text-cyan-800 font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Drug</span>
              </button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {medications.map((med, idx) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-slate-500">Medication #{idx + 1}</span>
                    {medications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMedication(idx)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase block mb-0.5">Drug Name</label>
                      <input
                        type="text"
                        required
                        value={med.name}
                        onChange={e => handleMedChange(idx, 'name', e.target.value)}
                        placeholder="e.g. Amoxicillin"
                        className="w-full p-2 border border-slate-300 rounded-md bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase block mb-0.5">Dosage / Strength</label>
                      <input
                        type="text"
                        required
                        value={med.dosage}
                        onChange={e => handleMedChange(idx, 'dosage', e.target.value)}
                        placeholder="e.g. 500 mg"
                        className="w-full p-2 border border-slate-300 rounded-md bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase block mb-0.5">Frequency</label>
                      <input
                        type="text"
                        value={med.frequency}
                        onChange={e => handleMedChange(idx, 'frequency', e.target.value)}
                        placeholder="Twice daily"
                        className="w-full p-1.5 border border-slate-300 rounded-md bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase block mb-0.5">Duration</label>
                      <input
                        type="text"
                        value={med.duration}
                        onChange={e => handleMedChange(idx, 'duration', e.target.value)}
                        placeholder="7 days"
                        className="w-full p-1.5 border border-slate-300 rounded-md bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase block mb-0.5">Instructions</label>
                      <input
                        type="text"
                        value={med.instructions}
                        onChange={e => handleMedChange(idx, 'instructions', e.target.value)}
                        placeholder="After meal"
                        className="w-full p-1.5 border border-slate-300 rounded-md bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Clinical Instructions */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              General Patient Advice & Instructions
            </label>
            <textarea
              rows={2}
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="Drink plenty of fluids, avoid driving if drowsy, follow up in 7 days..."
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs text-slate-800"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-lg shadow-md shadow-cyan-600/20 flex items-center gap-1.5 transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Signing & Issuing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Issue & Sign Prescription</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
