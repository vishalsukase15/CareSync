import React from 'react';
import { Shield, AlertTriangle } from 'lucide-react';

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 text-left text-slate-800">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Terms of Clinical Service</h1>
        <p className="text-xs text-slate-500 mt-1">Last Updated: September 2026</p>
      </div>

      <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-xs text-amber-900 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <p>
          CareSync is an academic and clinical technology demonstration platform. It does not replace 911 emergency hotlines or acute trauma centers. If you are facing life-threatening medical symptoms, seek immediate emergency help.
        </p>
      </div>

      <div className="space-y-6 text-xs text-slate-600 leading-relaxed">
        <section className="space-y-2">
          <h3 className="font-bold text-slate-900 text-sm">1. Doctor-Patient Relationship</h3>
          <p>
            An appointment booking made via CareSync establishes a scheduled consultation window between the patient and the licensed medical practitioner. CareSync acts as the communications and scheduling intermediary and does not directly practice medicine.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-slate-900 text-sm">2. Prescription Authenticity</h3>
          <p>
            Prescriptions issued through this platform are written exclusively by authenticated medical practitioners with verified medical licenses. CareSync strictly forbids any algorithmic or AI-automated prescription issuance.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-slate-900 text-sm">3. Hospital Bed Availability Disclaimer</h3>
          <p>
            Bed and ICU availability counters are broadcast in good faith by participating hospital administrators. Due to fluid emergency admissions, patients must verify availability by phone before travelling to a facility.
          </p>
        </section>
      </div>
    </div>
  );
};
