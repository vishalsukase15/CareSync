import React, { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import { useWebSocket } from '../../context/WebSocketContext.js';
import { Hospital } from '../../types/index.js';
import { 
  Building2, 
  BedDouble, 
  Phone, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  Search, 
  Activity, 
  ShieldCheck, 
  ChevronRight,
  RefreshCw
} from 'lucide-react';

export const HospitalsPage: React.FC<{ onNavigate: (tab: string, extra?: any) => void }> = ({ onNavigate }) => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toLocaleTimeString());

  const { latestBedUpdate } = useWebSocket();

  const fetchHospitals = async () => {
    try {
      const res = await api.get<{ hospitals: Hospital[] }>('/hospitals');
      setHospitals(res.hospitals || []);
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  // When live bed update received via WebSocket, update hospital state dynamically!
  useEffect(() => {
    if (latestBedUpdate && latestBedUpdate.hospitalId) {
      setHospitals(prev => prev.map(h => {
        if (h.id === latestBedUpdate.hospitalId) {
          return {
            ...h,
            totalBeds: latestBedUpdate.totalBeds ?? h.totalBeds,
            availableBeds: latestBedUpdate.availableBeds ?? h.availableBeds,
            totalIcu: latestBedUpdate.totalIcu ?? h.totalIcu,
            availableIcu: latestBedUpdate.availableIcu ?? h.availableIcu,
            totalEmergency: latestBedUpdate.totalEmergency ?? h.totalEmergency,
            availableEmergency: latestBedUpdate.availableEmergency ?? h.availableEmergency,
            icuStatus: latestBedUpdate.icuStatus ?? h.icuStatus,
            generalStatus: latestBedUpdate.generalStatus ?? h.generalStatus,
            emergencyStatus: latestBedUpdate.emergencyStatus ?? h.emergencyStatus,
            updatedAt: latestBedUpdate.updatedAt || new Date().toISOString()
          };
        }
        return h;
      }));
      setLastSyncTime(new Date().toLocaleTimeString());
    }
  }, [latestBedUpdate]);

  const filteredHospitals = hospitals.filter(h => {
    const matchesQuery = 
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.address.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === 'ALL') return matchesQuery;
    return matchesQuery && h.icuStatus === statusFilter;
  });

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'Available':
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full">Available</span>;
      case 'Limited':
        return <span className="bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full">Limited Capacity</span>;
      case 'Full':
        return <span className="bg-red-100 text-red-800 border border-red-300 text-xs font-bold px-2.5 py-0.5 rounded-full">Full Occupancy</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-0.5 rounded-full">Unknown</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Real-Time Bed Occupancy Broadcast</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Hospital Directory & ICU Bed Availability
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Live telemetry of Intensive Care Units (ICU), emergency trauma bays, and general inpatient wards across network hospitals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-xs text-slate-500">
            <p className="font-semibold text-slate-700 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Synced at {lastSyncTime}
            </p>
            <p className="text-[11px] text-emerald-600 font-medium">Socket.IO Stream Active</p>
          </div>
          <button
            onClick={fetchHospitals}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
            title="Refresh availability counters"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mandatory Emergency Disclaimer Notice */}
      <div className="bg-amber-50 border-2 border-amber-300/80 rounded-2xl p-4 flex items-start gap-3.5 text-amber-900 text-xs sm:text-sm">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-amber-950">CRITICAL PATIENT NOTICE:</p>
          <p className="mt-0.5 leading-relaxed">
            Availability information may change rapidly based on active emergency admissions. <strong>Please confirm directly with the hospital emergency department before travelling.</strong> In acute medical emergencies, immediately contact emergency services (911).
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-8 relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by hospital name, city, or address..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-cyan-600 focus:outline-hidden"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full py-2 px-3 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:ring-2 focus:ring-cyan-600 focus:outline-hidden"
          >
            <option value="ALL">All ICU Availability Statuses</option>
            <option value="Available">Available Beds Only</option>
            <option value="Limited">Limited Capacity Only</option>
            <option value="Full">Full Capacity</option>
          </select>
        </div>
      </div>

      {/* Hospitals Grid */}
      {filteredHospitals.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center max-w-lg mx-auto space-y-4">
          <Building2 className="w-12 h-12 text-cyan-600/50 mx-auto" />
          <div>
            <h3 className="text-lg font-bold text-slate-900">No Hospitals Listed Yet</h3>
            <p className="text-xs text-slate-500 mt-1">
              CareSync has launched with a clean directory. Hospital operators can register their facility to broadcast live bed and ICU availability.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('auth', { mode: 'register' })}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              Register Hospital Facility
            </button>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
              }}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredHospitals.map(hospital => (
          <div
            key={hospital.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
          >
            <div className="p-6 space-y-6">
              
              {/* Header Title & Status */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-cyan-600" />
                    <h3 className="text-lg font-bold text-slate-900">{hospital.name}</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{hospital.address}, {hospital.city}, {hospital.state} {hospital.postalCode}</span>
                  </p>
                </div>
                {getStatusBadge(hospital.icuStatus)}
              </div>

              {/* Emergency Contacts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>Main: {hospital.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-red-700 font-semibold">
                  <Activity className="w-4 h-4 text-red-500" />
                  <span>Emergency Hotline: {hospital.emergencyPhone}</span>
                </div>
              </div>

              {/* Bed Metrics Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  <span>Current Ward Capacities</span>
                  <span className="text-slate-400 font-normal">Last verified: {new Date(hospital.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                {/* 3 Metric Cards */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  
                  {/* ICU Beds */}
                  <div className="p-3 bg-cyan-50/70 border border-cyan-200/80 rounded-xl">
                    <span className="text-[11px] font-bold text-cyan-900 uppercase block">ICU Beds</span>
                    <div className="text-xl font-extrabold text-cyan-800 mt-1">
                      {hospital.availableIcu}
                      <span className="text-xs font-semibold text-slate-500"> / {hospital.totalIcu}</span>
                    </div>
                    <span className="text-[10px] text-cyan-700 font-medium">Available Now</span>
                  </div>

                  {/* General Inpatient */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[11px] font-bold text-slate-700 uppercase block">General Ward</span>
                    <div className="text-xl font-extrabold text-slate-900 mt-1">
                      {hospital.availableBeds}
                      <span className="text-xs font-semibold text-slate-500"> / {hospital.totalBeds}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">Available Now</span>
                  </div>

                  {/* Emergency / Trauma */}
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl">
                    <span className="text-[11px] font-bold text-emerald-900 uppercase block">Emergency</span>
                    <div className="text-xl font-extrabold text-emerald-800 mt-1">
                      {hospital.availableEmergency}
                      <span className="text-xs font-semibold text-slate-500"> / {hospital.totalEmergency}</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-medium">Trauma Bays</span>
                  </div>

                </div>
              </div>

            </div>

            {/* Hospital Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                <span>License: </span>
                <span className="font-mono font-semibold text-slate-700">{hospital.licenseNumber}</span>
              </div>

              <button
                onClick={() => onNavigate('doctors', { hospitalId: hospital.id })}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <span>View Hospital Doctors</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        ))}
      </div>
      )}

    </div>
  );
};
