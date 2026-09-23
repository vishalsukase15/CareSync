import React, { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import { Hospital } from '../../types/index.js';
import { 
  Building2, 
  BedDouble, 
  Activity, 
  Phone, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Layers, 
  Plus, 
  Loader2,
  Trash2,
  X,
  ShieldCheck
} from 'lucide-react';

export const HospitalDashboard: React.FC = () => {
  const { user } = useAuth();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Editable bed state
  const [availableIcu, setAvailableIcu] = useState(0);
  const [totalIcu, setTotalIcu] = useState(0);
  const [availableBeds, setAvailableBeds] = useState(0);
  const [totalBeds, setTotalBeds] = useState(0);
  const [availableEmergency, setAvailableEmergency] = useState(0);
  const [totalEmergency, setTotalEmergency] = useState(0);

  // Departments
  const [departments, setDepartments] = useState<any[]>([]);
  const [isAddDeptOpen, setIsAddDeptOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptFloor, setNewDeptFloor] = useState('');
  const [newDeptHead, setNewDeptHead] = useState('');

  // Register New Hospital Modal State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [regName, setRegName] = useState('');
  const [regLicense, setRegLicense] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regState, setRegState] = useState('');
  const [regPostal, setRegPostal] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmergencyPhone, setRegEmergencyPhone] = useState('');
  const [regEmail, setRegEmail] = useState(user?.email || '');
  const [regTotalBeds, setRegTotalBeds] = useState(50);
  const [regAvailBeds, setRegAvailBeds] = useState(20);
  const [regTotalIcu, setRegTotalIcu] = useState(10);
  const [regAvailIcu, setRegAvailIcu] = useState(3);
  const [regTotalEmergency, setRegTotalEmergency] = useState(8);
  const [regAvailEmergency, setRegAvailEmergency] = useState(2);
  const [submittingReg, setSubmittingReg] = useState(false);

  const loadHospitals = async () => {
    try {
      const res = await api.get<{ hospitals: Hospital[] }>('/hospitals');
      const allHospitals = res.hospitals || [];
      // Filter to ones managed by this user, or if admin, all
      const userFacilities = user?.role === 'ADMIN' 
        ? allHospitals 
        : allHospitals.filter(h => !h.managerUserId || h.managerUserId === user?.id);

      setHospitals(userFacilities);

      if (userFacilities.length > 0) {
        const active = selectedHospital 
          ? userFacilities.find(h => h.id === selectedHospital.id) || userFacilities[0]
          : userFacilities[0];

        setSelectedHospital(active);
        setAvailableIcu(active.availableIcu);
        setTotalIcu(active.totalIcu);
        setAvailableBeds(active.availableBeds);
        setTotalBeds(active.totalBeds);
        setAvailableEmergency(active.availableEmergency);
        setTotalEmergency(active.totalEmergency);

        try {
          const deptRes = await api.get<{ departments: any[] }>(`/hospitals/${active.id}/departments`);
          setDepartments(deptRes.departments || []);
        } catch (e) {}
      } else {
        setSelectedHospital(null);
        setDepartments([]);
      }
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHospitals();
  }, [user]);

  const handleSelectHospital = async (h: Hospital) => {
    setSelectedHospital(h);
    setAvailableIcu(h.availableIcu);
    setTotalIcu(h.totalIcu);
    setAvailableBeds(h.availableBeds);
    setTotalBeds(h.totalBeds);
    setAvailableEmergency(h.availableEmergency);
    setTotalEmergency(h.totalEmergency);

    try {
      const deptRes = await api.get<{ departments: any[] }>(`/hospitals/${h.id}/departments`);
      setDepartments(deptRes.departments || []);
    } catch (e) {}
  };

  const handleUpdateBeds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHospital) return;

    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await api.patch<{ message: string; hospital: Hospital }>(`/hospitals/${selectedHospital.id}/beds`, {
        availableIcu: Number(availableIcu),
        totalIcu: Number(totalIcu),
        availableBeds: Number(availableBeds),
        totalBeds: Number(totalBeds),
        availableEmergency: Number(availableEmergency),
        totalEmergency: Number(totalEmergency)
      });

      setSelectedHospital(res.hospital);
      setSuccessMsg('Bed availability broadcasted in real time via WebSockets to all connected clients.');
      setTimeout(() => setSuccessMsg(null), 5000);
      loadHospitals();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update bed counters.');
    } finally {
      setSaving(false);
    }
  };

  const handleRegisterHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReg(true);
    setErrorMsg(null);

    try {
      const res = await api.post<{ message: string; hospital: Hospital }>('/hospitals', {
        name: regName.trim(),
        licenseNumber: regLicense.trim(),
        address: regAddress.trim(),
        city: regCity.trim(),
        state: regState.trim(),
        postalCode: regPostal.trim(),
        phone: regPhone.trim(),
        emergencyPhone: regEmergencyPhone.trim(),
        email: regEmail.trim(),
        totalBeds: Number(regTotalBeds),
        availableBeds: Number(regAvailBeds),
        totalIcu: Number(regTotalIcu),
        availableIcu: Number(regAvailIcu),
        totalEmergency: Number(regTotalEmergency),
        availableEmergency: Number(regAvailEmergency)
      });

      setIsRegisterModalOpen(false);
      setSuccessMsg('Facility registered successfully! You can now manage its real-time telemetry.');
      setTimeout(() => setSuccessMsg(null), 5000);
      await loadHospitals();
      setSelectedHospital(res.hospital);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to register facility.');
    } finally {
      setSubmittingReg(false);
    }
  };

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHospital || !newDeptName.trim()) return;

    try {
      await api.post(`/hospitals/${selectedHospital.id}/departments`, {
        name: newDeptName.trim(),
        floor: newDeptFloor.trim() || undefined,
        headDoctorName: newDeptHead.trim() || undefined
      });
      setNewDeptName('');
      setNewDeptFloor('');
      setNewDeptHead('');
      setIsAddDeptOpen(false);
      // Reload departments
      const deptRes = await api.get<{ departments: any[] }>(`/hospitals/${selectedHospital.id}/departments`);
      setDepartments(deptRes.departments || []);
    } catch (err: any) {
      alert(err.message || 'Failed to add department');
    }
  };

  const handleDeleteHospital = async () => {
    if (!selectedHospital) return;
    if (!confirm(`Are you sure you want to remove ${selectedHospital.name}? This will remove its bed telemetry from the network.`)) return;

    try {
      await api.delete(`/hospitals/${selectedHospital.id}`);
      setSelectedHospital(null);
      await loadHospitals();
    } catch (err: any) {
      alert(err.message || 'Failed to delete hospital.');
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-cyan-600 mb-2" />
        <p className="text-sm font-semibold">Loading hospital facility data...</p>
      </div>
    );
  }

  // Clean empty state when no hospital exists yet or is selected
  if (!selectedHospital) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 bg-cyan-50 text-cyan-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm border border-cyan-100">
          <Building2 className="w-8 h-8" />
        </div>
        <div className="space-y-2 max-w-lg mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">No Hospital Facilities Registered Yet</h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Your account is clean and ready. Add your medical center or hospital facility to start broadcasting live ICU, general ward, and trauma bed occupancy.
          </p>
        </div>

        <button
          onClick={() => setIsRegisterModalOpen(true)}
          className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-600/25 inline-flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Hospital Facility</span>
        </button>

        {/* Register Modal */}
        {isRegisterModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-left my-8">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Register Hospital Facility</h3>
                  <p className="text-xs text-slate-500">Add your hospital details and initial bed capacity</p>
                </div>
                <button onClick={() => setIsRegisterModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleRegisterHospital} className="mt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Hospital Name *</label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={e => setRegName(e.target.value)}
                      placeholder="e.g. Metro West General Hospital"
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Clinical License # *</label>
                    <input
                      type="text"
                      required
                      value={regLicense}
                      onChange={e => setRegLicense(e.target.value)}
                      placeholder="HOSP-2026-9081"
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Street Address *</label>
                  <input
                    type="text"
                    required
                    value={regAddress}
                    onChange={e => setRegAddress(e.target.value)}
                    placeholder="100 Healthcare Blvd"
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={regCity}
                      onChange={e => setRegCity(e.target.value)}
                      placeholder="New York"
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">State *</label>
                    <input
                      type="text"
                      required
                      value={regState}
                      onChange={e => setRegState(e.target.value)}
                      placeholder="NY"
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Postal Code *</label>
                    <input
                      type="text"
                      required
                      value={regPostal}
                      onChange={e => setRegPostal(e.target.value)}
                      placeholder="10001"
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">General Inquiries Phone *</label>
                    <input
                      type="tel"
                      required
                      value={regPhone}
                      onChange={e => setRegPhone(e.target.value)}
                      placeholder="+1 (555) 234-5678"
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Emergency Department Hotline *</label>
                    <input
                      type="tel"
                      required
                      value={regEmergencyPhone}
                      onChange={e => setRegEmergencyPhone(e.target.value)}
                      placeholder="+1 (555) 911-0020"
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                </div>

                {/* Initial Bed Capacity */}
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-800 uppercase block mb-3">Initial Bed Capacity Configuration</span>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-cyan-50/70 rounded-xl border border-cyan-200">
                      <span className="font-bold text-cyan-950 block mb-1">ICU Beds</span>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 uppercase">Available / Total</label>
                        <div className="flex gap-1 items-center">
                          <input
                            type="number"
                            min={0}
                            value={regAvailIcu}
                            onChange={e => setRegAvailIcu(Number(e.target.value))}
                            className="w-1/2 p-1.5 border border-cyan-300 rounded-lg bg-white text-center font-bold"
                          />
                          <span className="text-slate-400">/</span>
                          <input
                            type="number"
                            min={1}
                            value={regTotalIcu}
                            onChange={e => setRegTotalIcu(Number(e.target.value))}
                            className="w-1/2 p-1.5 border border-cyan-300 rounded-lg bg-white text-center font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-900 block mb-1">General Beds</span>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 uppercase">Available / Total</label>
                        <div className="flex gap-1 items-center">
                          <input
                            type="number"
                            min={0}
                            value={regAvailBeds}
                            onChange={e => setRegAvailBeds(Number(e.target.value))}
                            className="w-1/2 p-1.5 border border-slate-300 rounded-lg bg-white text-center font-bold"
                          />
                          <span className="text-slate-400">/</span>
                          <input
                            type="number"
                            min={1}
                            value={regTotalBeds}
                            onChange={e => setRegTotalBeds(Number(e.target.value))}
                            className="w-1/2 p-1.5 border border-slate-300 rounded-lg bg-white text-center font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200">
                      <span className="font-bold text-emerald-950 block mb-1">Emergency Trauma</span>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 uppercase">Available / Total</label>
                        <div className="flex gap-1 items-center">
                          <input
                            type="number"
                            min={0}
                            value={regAvailEmergency}
                            onChange={e => setRegAvailEmergency(Number(e.target.value))}
                            className="w-1/2 p-1.5 border border-emerald-300 rounded-lg bg-white text-center font-bold"
                          />
                          <span className="text-slate-400">/</span>
                          <input
                            type="number"
                            min={1}
                            value={regTotalEmergency}
                            onChange={e => setRegTotalEmergency(Number(e.target.value))}
                            className="w-1/2 p-1.5 border border-emerald-300 rounded-lg bg-white text-center font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsRegisterModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReg}
                    className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5"
                  >
                    {submittingReg ? 'Saving...' : 'Register Facility'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-200 mb-2">
            <Building2 className="w-3.5 h-3.5" />
            <span>Hospital Operations & Bed Dispatch</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {selectedHospital.name}
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Facility License: <span className="font-mono font-semibold text-slate-800">{selectedHospital.licenseNumber}</span> • {selectedHospital.city}, {selectedHospital.state}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {hospitals.length > 1 && (
            <select
              value={selectedHospital.id}
              onChange={e => {
                const found = hospitals.find(h => h.id === e.target.value);
                if (found) handleSelectHospital(found);
              }}
              className="p-2 border border-slate-300 rounded-xl text-xs font-semibold bg-white text-slate-800"
            >
              {hospitals.map(h => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          )}

          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Facility</span>
          </button>

          <button
            onClick={handleDeleteHospital}
            className="p-2 text-red-600 hover:bg-red-50 border border-red-200 rounded-xl transition-colors"
            title="Delete Facility"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-300 rounded-2xl flex items-center gap-3 text-red-800 text-sm font-semibold">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Bed Telemetry Control Board */}
      <form onSubmit={handleUpdateBeds} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-8 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-600" />
              <span>Real-Time Bed & ICU Availability Controls</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Updates made here instantly broadcast over WebSockets to public portals and patient apps.
            </p>
          </div>

          <div className="text-right text-xs text-slate-400">
            <span>Last sync: {new Date(selectedHospital.updatedAt).toLocaleTimeString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* ICU Control Card */}
          <div className="p-5 bg-cyan-50/60 rounded-2xl border border-cyan-200 space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm text-cyan-950 uppercase tracking-wider">Intensive Care (ICU)</span>
              <span className="text-[10px] font-bold bg-cyan-200 text-cyan-900 px-2 py-0.5 rounded-full">Critical</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Available ICU</label>
                <input
                  type="number"
                  min={0}
                  max={totalIcu}
                  required
                  value={availableIcu}
                  onChange={e => setAvailableIcu(Number(e.target.value))}
                  className="w-full p-2.5 bg-white border border-cyan-300 rounded-xl text-lg font-extrabold text-cyan-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Total ICU</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={totalIcu}
                  onChange={e => setTotalIcu(Number(e.target.value))}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-lg font-extrabold text-slate-700"
                />
              </div>
            </div>

            <div className="text-xs text-slate-600 pt-1">
              Occupancy: <span className="font-bold text-slate-900">{totalIcu > 0 ? Math.round(((totalIcu - availableIcu) / totalIcu) * 100) : 0}%</span>
            </div>
          </div>

          {/* General Ward Control Card */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm text-slate-900 uppercase tracking-wider">General Inpatient</span>
              <span className="text-[10px] font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full">Wards</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Available Beds</label>
                <input
                  type="number"
                  min={0}
                  max={totalBeds}
                  required
                  value={availableBeds}
                  onChange={e => setAvailableBeds(Number(e.target.value))}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-lg font-extrabold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Total Beds</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={totalBeds}
                  onChange={e => setTotalBeds(Number(e.target.value))}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-lg font-extrabold text-slate-700"
                />
              </div>
            </div>

            <div className="text-xs text-slate-600 pt-1">
              Occupancy: <span className="font-bold text-slate-900">{totalBeds > 0 ? Math.round(((totalBeds - availableBeds) / totalBeds) * 100) : 0}%</span>
            </div>
          </div>

          {/* Emergency / Trauma Control Card */}
          <div className="p-5 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm text-emerald-950 uppercase tracking-wider">Emergency Trauma</span>
              <span className="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">ER Bays</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Available Bays</label>
                <input
                  type="number"
                  min={0}
                  max={totalEmergency}
                  required
                  value={availableEmergency}
                  onChange={e => setAvailableEmergency(Number(e.target.value))}
                  className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl text-lg font-extrabold text-emerald-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Total Bays</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={totalEmergency}
                  onChange={e => setTotalEmergency(Number(e.target.value))}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-lg font-extrabold text-slate-700"
                />
              </div>
            </div>

            <div className="text-xs text-slate-600 pt-1">
              Occupancy: <span className="font-bold text-slate-900">{totalEmergency > 0 ? Math.round(((totalEmergency - availableEmergency) / totalEmergency) * 100) : 0}%</span>
            </div>
          </div>

        </div>

        {/* Save & Broadcast Action */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Emergency department hotline: <span className="font-semibold text-red-600">{selectedHospital.emergencyPhone}</span>
          </p>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-600/25 flex items-center gap-2 transition-all"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Broadcasting Updates...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Broadcast Bed Availability</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Hospital Departments */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4 text-left">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <span>Clinical Departments ({departments.length})</span>
          </h3>

          <button
            onClick={() => setIsAddDeptOpen(true)}
            className="text-xs font-bold text-cyan-600 hover:text-cyan-800 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            <span>Add Department</span>
          </button>
        </div>

        {isAddDeptOpen && (
          <form onSubmit={handleAddDepartment} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-800 uppercase block">Add Clinical Department</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <input
                type="text"
                required
                value={newDeptName}
                onChange={e => setNewDeptName(e.target.value)}
                placeholder="Department Name (e.g. Cardiology)"
                className="p-2 border border-slate-300 rounded-lg bg-white"
              />
              <input
                type="text"
                value={newDeptFloor}
                onChange={e => setNewDeptFloor(e.target.value)}
                placeholder="Floor / Location (e.g. 3rd Floor)"
                className="p-2 border border-slate-300 rounded-lg bg-white"
              />
              <input
                type="text"
                value={newDeptHead}
                onChange={e => setNewDeptHead(e.target.value)}
                placeholder="Head Doctor Name"
                className="p-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddDeptOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-lg"
              >
                Save Department
              </button>
            </div>
          </form>
        )}

        {departments.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No departments listed yet. Add departments like ICU, Emergency, Surgery, or Cardiology.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {departments.map(dept => (
              <div key={dept.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <h4 className="font-bold text-slate-900 text-sm">{dept.name}</h4>
                {dept.floor && <p className="text-slate-500">Floor: {dept.floor}</p>}
                {dept.headDoctorName && <p className="text-[11px] text-cyan-700 font-medium pt-1">Chief: {dept.headDoctorName}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
