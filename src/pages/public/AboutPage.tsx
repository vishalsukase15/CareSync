import React from 'react';
import { 
  HeartPulse, 
  ShieldCheck, 
  Server, 
  Lock, 
  FileCheck, 
  Users, 
  Activity, 
  Stethoscope, 
  AlertTriangle 
} from 'lucide-react';

export const AboutPage: React.FC<{ onNavigate: (tab: string, extra?: any) => void }> = ({ onNavigate }) => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 text-left">
      
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 text-cyan-800 text-xs font-semibold border border-cyan-200">
          <HeartPulse className="w-4 h-4 text-cyan-600" />
          <span>CareSync Architecture & Clinical Integrity</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          About the CareSync Network
        </h1>
        <p className="text-slate-600 text-sm leading-relaxed">
          CareSync is an interconnected digital health platform designed to eliminate silos between outpatient discovery, emergency hospital bed visibility, and access-controlled electronic records.
        </p>
      </div>

      {/* Mandatory Clinical Boundary Notice */}
      <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-6 flex items-start gap-4 text-amber-950 text-xs sm:text-sm">
        <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="font-bold text-amber-900">Demonstration Scope & Emergency Policy</h3>
          <p className="leading-relaxed">
            CareSync provides real-time data synchronization between healthcare participants. However, this platform is not a substitute for direct triage in severe or life-threatening crises. If you experience chest pain, severe shortness of breath, sudden numbness, or heavy blood loss, call 911 or head to an emergency trauma facility immediately.
          </p>
        </div>
      </div>

      {/* 4 Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Role-Based Access Control (RBAC)</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Strict isolation between Patient, Doctor, Hospital, and Admin personas. Patients can only query their own EHR data; doctors may only read charts for patients with confirmed bookings.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <Activity className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Live ICU & Bed Telemetry</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Hospital operators broadcast bed counts directly via authenticated WebSocket feeds, providing visibility into ICU and general ward capacities across cities.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
            <FileCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Human Physician Prescriptions Only</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            We enforce a strict zero-AI prescription generation protocol. Every prescription, dosage regimen, and clinical recommendation is manually created and digitally authenticated by licensed doctors.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
            <Server className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Immutable Audit Logging</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Every clinical chart access, appointment transition, status change, and doctor verification event is committed to a structured security audit trail.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="p-8 bg-slate-900 rounded-3xl text-white text-center space-y-4">
        <h3 className="text-xl font-bold">Join the CareSync Network</h3>
        <p className="text-xs text-slate-300 max-w-md mx-auto">
          Experience seamless healthcare scheduling, direct peer-to-peer telehealth sessions, and accessible medical records.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={() => onNavigate('doctors')}
            className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Find a Doctor
          </button>
          <button
            onClick={() => onNavigate('auth', { mode: 'register' })}
            className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Register Account
          </button>
        </div>
      </div>

    </div>
  );
};
