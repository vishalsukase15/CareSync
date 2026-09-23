import React from 'react';
import { Lock, ShieldCheck } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 text-left text-slate-800">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Health Data Privacy & Security Notice</h1>
        <p className="text-xs text-slate-500 mt-1">Compliant with HIPAA-aligned role-based access control guidelines</p>
      </div>

      <div className="bg-cyan-50 p-4 rounded-xl border border-cyan-200 text-xs text-cyan-950 flex items-start gap-3">
        <Lock className="w-5 h-5 text-cyan-700 shrink-0 mt-0.5" />
        <p>
          We take patient health confidentiality seriously. All transport communication uses TLS/HTTPS, and credentials are protected with salted bcrypt hashing. Medical records are restricted solely to the patient and their attending licensed physician.
        </p>
      </div>

      <div className="space-y-6 text-xs text-slate-600 leading-relaxed">
        <section className="space-y-2">
          <h3 className="font-bold text-slate-900 text-sm">1. Protected Health Information (PHI)</h3>
          <p>
            Your diagnoses, clinical notes, and medication regimens are confidential. Only you and the healthcare professionals you book appointments with have clearance to view your charts.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-slate-900 text-sm">2. Video Consultations & Recording Policy</h3>
          <p>
            Telehealth calls are mediated via browser-native WebRTC peer-to-peer data transport. CareSync does not record or retain audio or video recordings by default, ensuring intimate and confidential consultations.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-slate-900 text-sm">3. Security Audit Logging</h3>
          <p>
            To deter unauthorized access attempts, our centralized audit logging service logs all chart requests and status changes, recording actor ID, timestamp, and accessed resource ID.
          </p>
        </section>
      </div>
    </div>
  );
};
