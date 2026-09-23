import React from 'react';
import { HeartPulse, ShieldCheck, AlertTriangle, Building2, Lock, ExternalLink } from 'lucide-react';

export const Footer: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  return (
    <footer className="bg-slate-950 text-slate-400 text-sm border-t border-slate-800">
      
      {/* Prominent Clinical Disclaimer Banner */}
      <div className="bg-amber-950/40 border-b border-amber-900/50 py-3.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-start sm:items-center gap-3 text-amber-200/90 text-xs">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
          <p className="leading-relaxed">
            <span className="font-semibold text-amber-300">CLINICAL NOTICE & EMERGENCY DISCLAIMER:</span> CareSync is a demonstrative digital health management platform. Do not use CareSync for urgent or life-threatening emergencies. If you require immediate emergency care, please dial <strong>911</strong> (or your local emergency hotline) or visit your nearest hospital emergency ward immediately. Hospital bed availability values are updated by participating facilities and should be re-verified by phone prior to transit.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5 text-white">
              <div className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center text-white">
                <HeartPulse className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight">
                Care<span className="text-cyan-400">Sync</span>
              </span>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-sm">
              Connecting patients, doctors, and hospitals on a unified, role-based telehealth infrastructure. Providing real-time ICU/bed visibility, verified specialist appointments, and access-controlled health records.
            </p>
            <div className="flex items-center gap-4 pt-2 text-xs text-slate-300">
              <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-md border border-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>RBAC Protected</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-md border border-slate-800">
                <Lock className="w-4 h-4 text-cyan-400" />
                <span>TLS Transport Encryption</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Patient Services</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button onClick={() => onNavigate('doctors')} className="hover:text-cyan-400 transition-colors">
                  Find Verified Doctors
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('hospitals')} className="hover:text-cyan-400 transition-colors">
                  Live ICU & Bed Tracker
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('auth')} className="hover:text-cyan-400 transition-colors">
                  Patient Health Portal
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-cyan-400 transition-colors">
                  Telehealth Consultation Guide
                </button>
              </li>
            </ul>
          </div>

          {/* Professional Roster */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Specialties</h4>
            <ul className="space-y-2.5 text-xs">
              <li><span className="hover:text-cyan-400 cursor-pointer" onClick={() => onNavigate('doctors')}>Cardiology & Vascular</span></li>
              <li><span className="hover:text-cyan-400 cursor-pointer" onClick={() => onNavigate('doctors')}>Neurology & Brain Health</span></li>
              <li><span className="hover:text-cyan-400 cursor-pointer" onClick={() => onNavigate('doctors')}>Pediatric & Family Care</span></li>
              <li><span className="hover:text-cyan-400 cursor-pointer" onClick={() => onNavigate('doctors')}>Critical & Intensive Care (ICU)</span></li>
              <li><span className="hover:text-cyan-400 cursor-pointer" onClick={() => onNavigate('doctors')}>Orthopedics & Sports Medicine</span></li>
            </ul>
          </div>

          {/* Governance & Compliance */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Governance & Trust</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button onClick={() => onNavigate('terms')} className="hover:text-cyan-400 transition-colors">
                  Terms of Clinical Use
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('privacy')} className="hover:text-cyan-400 transition-colors">
                  Health Data Privacy Notice
                </button>
              </li>
              <li>
                <span className="text-slate-400">Doctor Verification Policy</span>
              </li>
              <li>
                <span className="text-slate-400">Zero AI-Generated Rx Rule</span>
              </li>
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-cyan-400 transition-colors">
                  Security & Audit Architecture
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} CareSync Healthcare Management Platform. Built for verified clinical interoperability.</p>
          <div className="flex items-center gap-6">
            <span>Server Time: {new Date().toISOString().split('T')[0]}</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              API Gateway Healthy
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
};
