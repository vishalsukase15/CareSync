import React, { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import { AuditLog } from '../../types/index.js';
import { 
  ShieldCheck, 
  Users, 
  Stethoscope, 
  Building2, 
  Calendar, 
  FileText, 
  Activity, 
  Check, 
  X, 
  AlertTriangle, 
  Search, 
  Lock, 
  Loader2,
  Clock
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'METRICS' | 'DOCTORS' | 'USERS' | 'AUDIT'>('METRICS');

  const [stats, setStats] = useState<any>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [statsRes, docsRes, usersRes, auditRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/doctors'),
        api.get('/admin/users'),
        api.get('/admin/audit-logs?limit=50')
      ]);
      setStats(statsRes);
      setDoctors(docsRes.doctors || []);
      setUsers(usersRes.users || []);
      setAuditLogs(auditRes.logs || []);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVerifyDoctor = async (doctorId: string, verify: boolean) => {
    setActionLoadingId(doctorId);
    try {
      await api.post(`/admin/doctors/${doctorId}/verify`, { verify });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Verification update failed.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    setActionLoadingId(userId);
    try {
      await api.patch(`/admin/users/${userId}/status`, { isActive });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Status update failed.');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600 mb-2" />
        <p className="text-sm font-semibold">Loading Admin Security Suite...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-800 text-xs font-semibold border border-purple-200 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Platform Governance & Audit</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Administrator Console
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Clinical license verification, multi-role account access control, and immutable HIPAA-aligned audit log monitoring.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs font-semibold">
          <Lock className="w-3.5 h-3.5 text-cyan-400" />
          <span>Admin ID: {user?.id.substring(0, 8)}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl max-w-xl border border-slate-200">
        {(['METRICS', 'DOCTORS', 'USERS', 'AUDIT'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === tab ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab === 'METRICS' && 'Overview'}
            {tab === 'DOCTORS' && `Doctor Verification (${stats?.metrics?.pendingDoctors || 0} pending)`}
            {tab === 'USERS' && 'Users'}
            {tab === 'AUDIT' && 'Audit Logs'}
          </button>
        ))}
      </div>

      {/* Tab 1: System Overview Metrics */}
      {activeTab === 'METRICS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Registered Patients</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stats?.metrics?.totalPatients || 0}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Verified Doctors</span>
              <p className="text-2xl font-bold text-cyan-700 mt-1">{stats?.metrics?.verifiedDoctors || 0} / {stats?.metrics?.totalDoctors || 0}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Hospitals & Centers</span>
              <p className="text-2xl font-bold text-indigo-700 mt-1">{stats?.metrics?.totalHospitals || 0}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Total Appointments</span>
              <p className="text-2xl font-bold text-emerald-700 mt-1">{stats?.metrics?.totalAppointments || 0}</p>
            </div>
          </div>

          {/* Bed stats summary */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-600" />
              <span>Network Bed & ICU Aggregates</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="font-semibold text-slate-500 uppercase block mb-1">Total ICU Beds</span>
                <span className="text-xl font-bold text-slate-900">{stats?.metrics?.beds?.availableIcu} Available / {stats?.metrics?.beds?.totalIcu} Total</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="font-semibold text-slate-500 uppercase block mb-1">General Ward Beds</span>
                <span className="text-xl font-bold text-slate-900">{stats?.metrics?.beds?.availableBeds} Available / {stats?.metrics?.beds?.totalBeds} Total</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="font-semibold text-slate-500 uppercase block mb-1">Electronic Health Records</span>
                <span className="text-xl font-bold text-slate-900">{stats?.metrics?.totalMedicalRecordsFiled} Filed</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Doctor Verification Desk */}
      {activeTab === 'DOCTORS' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-base text-slate-900">Medical Practitioner Verification</h3>
              <p className="text-xs text-slate-500">Review clinical licenses before granting verified search badge</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {doctors.map(doc => (
              <div key={doc.id} className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-900">Dr. {doc.user?.fullName}</h4>
                    <span className="text-xs font-semibold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full">
                      {doc.specialization}
                    </span>
                    {doc.isVerified ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Verified
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        Pending Review
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    License: <span className="font-mono font-bold text-slate-700">{doc.licenseNumber}</span> • Qualifications: {doc.qualifications.join(', ')} • Hospital: {doc.hospital?.name || 'CareSync Network'}
                  </p>
                  <p className="text-xs text-slate-400">Email: {doc.user?.email} • Experience: {doc.experienceYears} years</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!doc.isVerified ? (
                    <button
                      disabled={actionLoadingId === doc.id}
                      onClick={() => handleVerifyDoctor(doc.id, true)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve & Verify</span>
                    </button>
                  ) : (
                    <button
                      disabled={actionLoadingId === doc.id}
                      onClick={() => handleVerifyDoctor(doc.id, false)}
                      className="px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 rounded-xl transition-colors"
                    >
                      Revoke Verification
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Users Directory */}
      {activeTab === 'USERS' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-base text-slate-900">User Account Controls</h3>
              <p className="text-xs text-slate-500">Enable or suspend account access</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {users.map(u => (
              <div key={u.id} className="p-4 sm:p-6 flex items-center justify-between gap-4 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{u.fullName}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {u.role}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {u.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </div>
                  <p className="text-slate-500 mt-0.5">{u.email} • Joined: {new Date(u.createdAt).toLocaleDateString()}</p>
                </div>

                {u.id !== user?.id && (
                  <button
                    disabled={actionLoadingId === u.id}
                    onClick={() => handleToggleUserStatus(u.id, !u.isActive)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      u.isActive 
                        ? 'border-red-200 text-red-600 hover:bg-red-50' 
                        : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    {u.isActive ? 'Suspend' : 'Reactivate'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Audit Logs */}
      {activeTab === 'AUDIT' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-base text-slate-900">Centralized Audit Log Stream</h3>
              <p className="text-xs text-slate-500">Every privileged clinical, booking, and administrative action is logged</p>
            </div>
            <span className="font-mono text-xs text-slate-400 font-bold">{auditLogs.length} Events</span>
          </div>

          <div className="divide-y divide-slate-100 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Actor</th>
                  <th className="p-3.5">Action</th>
                  <th className="p-3.5">Resource</th>
                  <th className="p-3.5">Details</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-slate-900">{log.actorEmail || 'System'}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">({log.actorRole})</span>
                    </td>
                    <td className="p-3.5 font-bold text-cyan-900 whitespace-nowrap">{log.action}</td>
                    <td className="p-3.5 text-slate-600 whitespace-nowrap">{log.resourceType}</td>
                    <td className="p-3.5 text-slate-600 max-w-xs truncate">{log.details}</td>
                    <td className="p-3.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        log.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
