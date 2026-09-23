import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useWebSocket } from '../../context/WebSocketContext.js';
import { 
  HeartPulse, 
  Search, 
  BedDouble, 
  Bell, 
  User, 
  LogOut, 
  Calendar, 
  FileText, 
  Shield, 
  Building2, 
  Stethoscope, 
  Menu, 
  X,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string, extra?: any) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onNavigate }) => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useWebSocket();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getDashboardRoute = () => {
    if (!user) return 'auth';
    switch (user.role) {
      case 'PATIENT': return 'patient-dashboard';
      case 'DOCTOR': return 'doctor-dashboard';
      case 'HOSPITAL': return 'hospital-dashboard';
      case 'ADMIN': return 'admin-dashboard';
      default: return 'home';
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'PATIENT':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2 py-0.5 rounded-full font-medium">Patient</span>;
      case 'DOCTOR':
        return <span className="bg-sky-50 text-sky-700 border border-sky-200 text-xs px-2 py-0.5 rounded-full font-medium">Doctor / MD</span>;
      case 'HOSPITAL':
        return <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs px-2 py-0.5 rounded-full font-medium">Hospital Staff</span>;
      case 'ADMIN':
        return <span className="bg-purple-50 text-purple-700 border border-purple-200 text-xs px-2 py-0.5 rounded-full font-medium">System Admin</span>;
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div 
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <HeartPulse className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-1">
                Care<span className="text-cyan-600">Sync</span>
              </span>
              <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">Connected Healthcare</p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => onNavigate('home')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'home' 
                  ? 'bg-cyan-50 text-cyan-700 font-semibold' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Overview
            </button>

            <button
              onClick={() => onNavigate('doctors')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                currentTab === 'doctors' 
                  ? 'bg-cyan-50 text-cyan-700 font-semibold' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Search className="w-4 h-4" />
              Find Doctors
            </button>

            <button
              onClick={() => onNavigate('hospitals')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 relative ${
                currentTab === 'hospitals' 
                  ? 'bg-cyan-50 text-cyan-700 font-semibold' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BedDouble className="w-4 h-4 text-emerald-600" />
              Hospitals & ICU
              <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                Live
              </span>
            </button>

            <button
              onClick={() => onNavigate('about')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'about' 
                  ? 'bg-cyan-50 text-cyan-700 font-semibold' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              About & Network
            </button>
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            
            {/* Logged-in controls */}
            {user ? (
              <>
                {/* Notification Bell */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg relative transition-colors"
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                        <span className="font-semibold text-sm text-slate-800 flex items-center gap-2">
                          <Bell className="w-4 h-4 text-cyan-600" /> Notifications
                          {unreadCount > 0 && (
                            <span className="bg-cyan-100 text-cyan-800 text-xs px-2 py-0.5 rounded-full font-medium">
                              {unreadCount} new
                            </span>
                          )}
                        </span>
                        {unreadCount > 0 && (
                          <button
                            onClick={() => markAllAsRead()}
                            className="text-xs text-cyan-600 hover:text-cyan-800 font-medium"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-sm text-slate-400">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.slice(0, 10).map(n => (
                            <div
                              key={n.id}
                              onClick={() => {
                                markAsRead(n.id);
                                if (n.link) onNavigate(n.link.replace('/', ''));
                                setShowNotifications(false);
                              }}
                              className={`p-3 text-left hover:bg-slate-50 cursor-pointer transition-colors ${
                                !n.isRead ? 'bg-cyan-50/40 font-medium' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                                {!n.isRead && (
                                  <span className="w-2 h-2 rounded-full bg-cyan-600 shrink-0 mt-1" />
                                )}
                              </div>
                              <p className="text-xs text-slate-600 mt-1 line-clamp-2">{n.message}</p>
                              <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Dashboard Quick Switcher */}
                <button
                  onClick={() => onNavigate(getDashboardRoute())}
                  className="hidden sm:flex items-center gap-2 bg-slate-900 text-white hover:bg-slate-800 px-3.5 py-2 rounded-lg text-sm font-medium transition-all shadow-xs"
                >
                  {user.role === 'PATIENT' && <Calendar className="w-4 h-4 text-cyan-400" />}
                  {user.role === 'DOCTOR' && <Stethoscope className="w-4 h-4 text-cyan-400" />}
                  {user.role === 'HOSPITAL' && <Building2 className="w-4 h-4 text-cyan-400" />}
                  {user.role === 'ADMIN' && <Shield className="w-4 h-4 text-cyan-400" />}
                  <span>
                    {user.role === 'PATIENT' && 'My Portal'}
                    {user.role === 'DOCTOR' && 'Doctor Suite'}
                    {user.role === 'HOSPITAL' && 'Hospital Ops'}
                    {user.role === 'ADMIN' && 'Admin Desk'}
                  </span>
                </button>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-600 to-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      {user.fullName.charAt(0).toUpperCase()}
                    </div>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="text-sm font-semibold text-slate-900 truncate">{user.fullName}</p>
                        <p className="text-xs text-slate-500 truncate mb-1.5">{user.email}</p>
                        {getRoleBadge(user.role)}
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => {
                            onNavigate(getDashboardRoute());
                            setShowUserMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <User className="w-4 h-4 text-slate-500" />
                          Dashboard & Profile
                        </button>

                        {user.role === 'PATIENT' && (
                          <>
                            <button
                              onClick={() => {
                                onNavigate('patient-appointments');
                                setShowUserMenu(false);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Calendar className="w-4 h-4 text-slate-500" />
                              My Appointments
                            </button>
                            <button
                              onClick={() => {
                                onNavigate('patient-records');
                                setShowUserMenu(false);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <FileText className="w-4 h-4 text-slate-500" />
                              Health Records & Rx
                            </button>
                          </>
                        )}

                        {user.role === 'DOCTOR' && (
                          <>
                            <button
                              onClick={() => {
                                onNavigate('doctor-appointments');
                                setShowUserMenu(false);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Calendar className="w-4 h-4 text-slate-500" />
                              Patient Schedule
                            </button>
                            <button
                              onClick={() => {
                                onNavigate('doctor-availability');
                                setShowUserMenu(false);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Clock className="w-4 h-4 text-slate-500" />
                              Configure Availability
                            </button>
                          </>
                        )}
                      </div>

                      <div className="border-t border-slate-100 pt-1">
                        <button
                          onClick={async () => {
                            await logout();
                            setShowUserMenu(false);
                            onNavigate('home');
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              // Logged out CTA
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('auth')}
                  className="px-3.5 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onNavigate('auth', { mode: 'register' })}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-xs transition-all shadow-cyan-600/20"
                >
                  Get Started
                </button>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200 flex flex-col gap-2">
            <button
              onClick={() => { onNavigate('home'); setMobileMenuOpen(false); }}
              className="text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Home Overview
            </button>
            <button
              onClick={() => { onNavigate('doctors'); setMobileMenuOpen(false); }}
              className="text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Find Doctors & Specialists
            </button>
            <button
              onClick={() => { onNavigate('hospitals'); setMobileMenuOpen(false); }}
              className="text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg flex items-center justify-between"
            >
              <span>Hospitals & ICU Beds</span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Live Tracker</span>
            </button>
            <button
              onClick={() => { onNavigate('about'); setMobileMenuOpen(false); }}
              className="text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              About & Network
            </button>
            {user && (
              <button
                onClick={() => { onNavigate(getDashboardRoute()); setMobileMenuOpen(false); }}
                className="text-left px-3 py-2 text-sm font-bold text-cyan-700 bg-cyan-50 rounded-lg"
              >
                Go to {user.role} Dashboard
              </button>
            )}
          </div>
        )}

      </div>
    </header>
  );
};
