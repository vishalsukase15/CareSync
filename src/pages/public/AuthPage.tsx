import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { 
  HeartPulse, 
  Lock, 
  Mail, 
  User, 
  Phone, 
  Shield, 
  Stethoscope, 
  Building2, 
  CheckCircle2, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { UserRole } from '../../types/index.js';

interface AuthPageProps {
  initialMode?: 'login' | 'register';
  onNavigate: (tab: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'login', onNavigate }) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  
  // Common fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('PATIENT');

  // Doctor-specific fields
  const [specialization, setSpecialization] = useState('General Physician');
  const [licenseNumber, setLicenseNumber] = useState('');

  // Hospital-specific fields
  const [hospitalName, setHospitalName] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const loggedInUser = await login({ email, password });
        // Route to corresponding dashboard
        switch (loggedInUser.role) {
          case 'PATIENT': onNavigate('patient-dashboard'); break;
          case 'DOCTOR': onNavigate('doctor-dashboard'); break;
          case 'HOSPITAL': onNavigate('hospital-dashboard'); break;
          case 'ADMIN': onNavigate('admin-dashboard'); break;
          default: onNavigate('home'); break;
        }
      } else {
        const registeredUser = await register({
          email,
          password,
          fullName,
          phone: phone || undefined,
          role,
          specialization: role === 'DOCTOR' ? specialization : undefined,
          licenseNumber: role === 'DOCTOR' ? licenseNumber : undefined,
          hospitalName: role === 'HOSPITAL' ? hospitalName : undefined
        });

        switch (registeredUser.role) {
          case 'PATIENT': onNavigate('patient-dashboard'); break;
          case 'DOCTOR': onNavigate('doctor-dashboard'); break;
          case 'HOSPITAL': onNavigate('hospital-dashboard'); break;
          case 'ADMIN': onNavigate('admin-dashboard'); break;
          default: onNavigate('home'); break;
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-slate-900 to-cyan-950 p-8 text-white text-center">
          <div className="w-12 h-12 rounded-2xl bg-cyan-600 flex items-center justify-center mx-auto mb-3 text-white shadow-md">
            <HeartPulse className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">CareSync Access Portal</h2>
          <p className="text-slate-300 text-xs mt-1">
            {mode === 'login' ? 'Sign in to your clinical or patient workspace' : 'Register a new verified healthcare account'}
          </p>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-800/80 p-1 rounded-xl mt-6 border border-slate-700/60 max-w-xs mx-auto">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(null); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                mode === 'login' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setErrorMsg(null); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                mode === 'register' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-red-50 border-b border-red-200 p-4 flex items-center gap-3 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-8 space-y-5 text-left">
          
          {/* Registration Role Picker */}
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Select Account Role
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setRole('PATIENT')}
                  className={`p-3 rounded-xl border font-semibold flex items-center gap-2 transition-all ${
                    role === 'PATIENT' 
                      ? 'border-cyan-600 bg-cyan-50 text-cyan-900 ring-1 ring-cyan-600' 
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>Patient</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('DOCTOR')}
                  className={`p-3 rounded-xl border font-semibold flex items-center gap-2 transition-all ${
                    role === 'DOCTOR' 
                      ? 'border-cyan-600 bg-cyan-50 text-cyan-900 ring-1 ring-cyan-600' 
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Stethoscope className="w-4 h-4 text-cyan-600" />
                  <span>Doctor / MD</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('HOSPITAL')}
                  className={`p-3 rounded-xl border font-semibold flex items-center gap-2 transition-all ${
                    role === 'HOSPITAL' 
                      ? 'border-cyan-600 bg-cyan-50 text-cyan-900 ring-1 ring-cyan-600' 
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span>Hospital Staff</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('ADMIN')}
                  className={`p-3 rounded-xl border font-semibold flex items-center gap-2 transition-all ${
                    role === 'ADMIN' 
                      ? 'border-cyan-600 bg-cyan-50 text-cyan-900 ring-1 ring-cyan-600' 
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Shield className="w-4 h-4 text-purple-600" />
                  <span>Administrator</span>
                </button>
              </div>
            </div>
          )}

          {/* Full Name & Phone (Register only) */}
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full Legal Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-cyan-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-cyan-600 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Doctor Specific Info */}
              {role === 'DOCTOR' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-cyan-50/50 rounded-xl border border-cyan-200">
                  <div>
                    <label className="block text-[11px] font-bold text-cyan-950 uppercase mb-1">Specialization</label>
                    <input
                      type="text"
                      required
                      value={specialization}
                      onChange={e => setSpecialization(e.target.value)}
                      placeholder="e.g. Cardiologist"
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-cyan-950 uppercase mb-1">License #</label>
                    <input
                      type="text"
                      required
                      value={licenseNumber}
                      onChange={e => setLicenseNumber(e.target.value)}
                      placeholder="MED-789012"
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Hospital Specific Info */}
              {role === 'HOSPITAL' && (
                <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-200">
                  <label className="block text-[11px] font-bold text-indigo-950 uppercase mb-1">Hospital Facility Name</label>
                  <input
                    type="text"
                    required
                    value={hospitalName}
                    onChange={e => setHospitalName(e.target.value)}
                    placeholder="e.g. Metro West General Hospital"
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white"
                  />
                </div>
              )}
            </>
          )}

          {/* Email Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-cyan-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-cyan-600 focus:outline-hidden"
              />
            </div>
            {mode === 'register' && (
              <p className="text-[11px] text-slate-400 mt-1">Must be at least 8 characters with bcrypt salt hashing</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-cyan-600/25 transition-all text-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : mode === 'login' ? (
              <span>Sign In to CareSync</span>
            ) : (
              <span>Create {role} Account</span>
            )}
          </button>

          <div className="text-center text-xs text-slate-500 pt-2">
            {mode === 'login' ? (
              <p>
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('register'); setErrorMsg(null); }}
                  className="font-bold text-cyan-600 hover:text-cyan-800"
                >
                  Register here
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setErrorMsg(null); }}
                  className="font-bold text-cyan-600 hover:text-cyan-800"
                >
                  Sign in here
                </button>
              </p>
            )}
          </div>

        </form>

      </div>
    </div>
  );
};
