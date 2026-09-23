import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { WebSocketProvider } from './context/WebSocketContext.js';
import { Navbar } from './components/layout/Navbar.js';
import { Footer } from './components/layout/Footer.js';
import { HomePage } from './pages/public/HomePage.js';
import { DoctorsPage } from './pages/public/DoctorsPage.js';
import { HospitalsPage } from './pages/public/HospitalsPage.js';
import { AuthPage } from './pages/public/AuthPage.js';
import { AboutPage } from './pages/public/AboutPage.js';
import { TermsPage } from './pages/public/TermsPage.js';
import { PrivacyPage } from './pages/public/PrivacyPage.js';

// Patient Pages
import { PatientDashboard } from './pages/patient/PatientDashboard.js';
import { PatientAppointments } from './pages/patient/PatientAppointments.js';
import { PatientRecords } from './pages/patient/PatientRecords.js';

// Doctor Pages
import { DoctorDashboard } from './pages/doctor/DoctorDashboard.js';
import { DoctorAppointments } from './pages/doctor/DoctorAppointments.js';
import { DoctorAvailability } from './pages/doctor/DoctorAvailability.js';

// Hospital & Admin Pages
import { HospitalDashboard } from './pages/hospital/HospitalDashboard.js';
import { AdminDashboard } from './pages/admin/AdminDashboard.js';

// Telehealth Video Call
import { WebRtcVideoCall } from './components/telehealth/WebRtcVideoCall.js';

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [tabExtra, setTabExtra] = useState<any>(null);

  // Active Video Call Session
  const [activeVideoAppointmentId, setActiveVideoAppointmentId] = useState<string | null>(null);

  const handleNavigate = (tab: string, extra?: any) => {
    setCurrentTab(tab);
    setTabExtra(extra || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartVideoCall = (appointmentId: string) => {
    setActiveVideoAppointmentId(appointmentId);
  };

  const handleEndVideoCall = () => {
    setActiveVideoAppointmentId(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-cyan-500 selection:text-white">
      {/* Navigation Header */}
      <Navbar currentTab={currentTab} onNavigate={handleNavigate} />

      {/* Main Content Area */}
      <main className="flex-1">
        
        {/* Fullscreen Video Telehealth Room Overlay */}
        {activeVideoAppointmentId && (
          <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col p-4 sm:p-6">
            <div className="max-w-6xl w-full mx-auto flex-1 flex flex-col justify-center">
              <WebRtcVideoCall
                appointmentId={activeVideoAppointmentId}
                onEndCall={handleEndVideoCall}
              />
            </div>
          </div>
        )}

        {/* Public Views */}
        {currentTab === 'home' && (
          <HomePage onNavigate={handleNavigate} />
        )}

        {currentTab === 'doctors' && (
          <DoctorsPage
            initialSearch={tabExtra?.q || ''}
            initialSpecialty={tabExtra?.specialty || ''}
            onNavigate={handleNavigate}
          />
        )}

        {currentTab === 'hospitals' && (
          <HospitalsPage onNavigate={handleNavigate} />
        )}

        {currentTab === 'about' && (
          <AboutPage onNavigate={handleNavigate} />
        )}

        {currentTab === 'terms' && (
          <TermsPage />
        )}

        {currentTab === 'privacy' && (
          <PrivacyPage />
        )}

        {currentTab === 'auth' && (
          <AuthPage
            initialMode={tabExtra?.mode || 'login'}
            onNavigate={handleNavigate}
          />
        )}

        {/* Patient Portal Views */}
        {currentTab === 'patient-dashboard' && (
          <PatientDashboard
            onNavigate={handleNavigate}
            onJoinVideoCall={handleStartVideoCall}
          />
        )}

        {currentTab === 'patient-appointments' && (
          <PatientAppointments
            onNavigate={handleNavigate}
            onJoinVideoCall={handleStartVideoCall}
          />
        )}

        {currentTab === 'patient-records' && (
          <PatientRecords />
        )}

        {/* Doctor Portal Views */}
        {currentTab === 'doctor-dashboard' && (
          <DoctorDashboard
            onNavigate={handleNavigate}
            onJoinVideoCall={handleStartVideoCall}
          />
        )}

        {currentTab === 'doctor-appointments' && (
          <DoctorAppointments
            onJoinVideoCall={handleStartVideoCall}
          />
        )}

        {currentTab === 'doctor-availability' && (
          <DoctorAvailability />
        )}

        {/* Hospital Facility Views */}
        {currentTab === 'hospital-dashboard' && (
          <HospitalDashboard />
        )}

        {/* Platform Admin Views */}
        {currentTab === 'admin-dashboard' && (
          <AdminDashboard />
        )}

      </main>

      {/* Global Clinical Trust Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <AppContent />
      </WebSocketProvider>
    </AuthProvider>
  );
}

export default App;
