import React, { useState, useEffect } from 'react';
import CompanyDashboardView from './components/CompanyDashboardView';
import TechnicianDashboardView from './components/TechnicianDashboardView';
import AdminDashboardView from './components/AdminDashboardView';
import PostJobModal from './components/PostJobModal';
import JobDetailsModal from './components/JobDetailsModal';
import ChatModal from './components/ChatModal';
import TechnicianProfileEditModal from './components/TechnicianProfileEditModal';
import CompanyProfileModal from './components/CompanyProfileModal';
import AuthModal from './components/AuthModal';
import { api, socket } from './services/api';
import {
  Wrench,
  Building2,
  Shield,
  Activity,
  AlertTriangle,
  PlusCircle,
  ChevronDown,
  UserCheck
} from 'lucide-react';

export default function App() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [mechanics, setMechanics] = useState([]);

  // 3 Distinct Dashboards: 'company' | 'technician' | 'admin'
  const [activeDashboard, setActiveDashboard] = useState('company');

  // Modals
  const [isPostJobOpen, setIsPostJobOpen] = useState(false);
  const [activeJobId, setActiveJobId] = useState(null);
  const [activeChatJobId, setActiveChatJobId] = useState(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [activeCompanyId, setActiveCompanyId] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [toastNotification, setToastNotification] = useState(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Load all initial data from database
  const loadUsersAndData = async () => {
    try {
      const [usersData, jobsData, mechsData] = await Promise.all([
        api.getUsers(),
        api.getJobs(),
        api.getMechanics()
      ]);

      setUsers(usersData);
      setJobs(jobsData);
      setMechanics(mechsData);

      if (!currentUser && usersData.length > 0) {
        // Default to Company user (Apex Heavy Machining)
        const defaultCompany = usersData.find(u => u.role === 'company') || usersData[0];
        setCurrentUser(defaultCompany);
      }
    } catch (err) {
      console.error('Data load error:', err);
    }
  };

  useEffect(() => {
    loadUsersAndData();

    // Global Socket listeners
    const handleNewJob = (data) => {
      setToastNotification(`🚨 New Incident: ${data.title} (${data.urgency}) in ${data.city}`);
      setTimeout(() => setToastNotification(null), 6000);
      api.getJobs().then(setJobs);
    };

    const handleStatusChange = () => {
      api.getJobs().then(setJobs);
    };

    const handleProposalUpdate = () => {
      api.getJobs().then(setJobs);
    };

    socket.on('new_job_posted', handleNewJob);
    socket.on('job_status_change', handleStatusChange);
    socket.on('proposal_update', handleProposalUpdate);

    return () => {
      socket.off('new_job_posted', handleNewJob);
      socket.off('job_status_change', handleStatusChange);
      socket.off('proposal_update', handleProposalUpdate);
    };
  }, []);

  // Switch between the 3 distinct dashboards
  const handleSelectDashboard = (dashboardType) => {
    setActiveDashboard(dashboardType);

    // Auto-align current user persona to the selected dashboard role
    if (dashboardType === 'company') {
      const companyUser = users.find(u => u.role === 'company') || users[0];
      setCurrentUser(companyUser);
    } else if (dashboardType === 'technician') {
      const mechUser = users.find(u => u.role === 'mechanic') || users[2];
      setCurrentUser(mechUser);
    } else if (dashboardType === 'admin') {
      const adminUser = users.find(u => u.role === 'admin') || users[6];
      setCurrentUser(adminUser);
    }
  };

  const handleJobCreated = (jobId) => {
    api.getJobs().then(setJobs);
    setActiveJobId(jobId);
  };

  // Filter available personas for dropdown within active portal
  const relevantUsers = users.filter(u => {
    if (activeDashboard === 'company') return u.role === 'company';
    if (activeDashboard === 'technician') return u.role === 'mechanic';
    return u.role === 'admin';
  });

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col font-sans selection:bg-[#00E5FF] selection:text-black">
      
      {/* Toast Alert Banner */}
      {toastNotification && (
        <div className="bg-[#3A1C1C] border-b-2 border-[#FF453A] text-[#FF453A] font-mono text-xs py-2.5 px-4 text-center flex items-center justify-center gap-2 sticky top-0 z-[2000] shadow-2xl">
          <AlertTriangle className="w-4 h-4 animate-bounce" />
          <span className="font-bold">{toastNotification}</span>
        </div>
      )}

      {/* TOP HEADER & 3 DISTINCT DASHBOARD SELECTOR */}
      <header className="sticky top-0 z-[1000] bg-[#121212]/95 backdrop-blur-md border-b border-[#2C2C2E] px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#1E1E1E] border border-[#00E5FF]/40 flex items-center justify-center text-[#00E5FF] shadow-[0_0_12px_rgba(0,229,255,0.25)]">
                <Wrench className="w-5 h-5 text-[#00E5FF]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xl tracking-tight text-white">MECH<span className="text-[#00E5FF]">CONNECT</span></span>
                  <span className="text-[10px] bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30 px-1.5 py-0.5 rounded font-mono font-bold">
                    v2.0
                  </span>
                </div>
                <div className="text-[10px] text-[#98989D] font-mono">
                  INDUSTRIAL ON-DEMAND REPAIR PLATFORM
                </div>
              </div>
            </div>
          </div>

          {/* 3 DISTINCT DASHBOARD TABS (Company, Technician, Admin) */}
          <nav className="flex items-center bg-[#1E1E1E] p-1.5 rounded-2xl border border-[#2C2C2E] w-full md:w-auto justify-center">
            
            <button
              onClick={() => handleSelectDashboard('company')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                activeDashboard === 'company'
                  ? 'bg-[#00E5FF] text-black shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                  : 'text-[#98989D] hover:text-white hover:bg-[#252525]'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>1. Company Dashboard</span>
            </button>

            <button
              onClick={() => handleSelectDashboard('technician')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                activeDashboard === 'technician'
                  ? 'bg-[#32D74B] text-black shadow-[0_0_15px_rgba(50,215,75,0.3)]'
                  : 'text-[#98989D] hover:text-white hover:bg-[#252525]'
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>2. Technician Dashboard</span>
            </button>

            <button
              onClick={() => handleSelectDashboard('admin')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                activeDashboard === 'admin'
                  ? 'bg-[#FF453A] text-white shadow-[0_0_15px_rgba(255,69,58,0.3)]'
                  : 'text-[#98989D] hover:text-white hover:bg-[#252525]'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>3. Admin / Supervisor</span>
            </button>

          </nav>

          {/* Active Persona Dropdown & Frictionless Auth */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2.5 bg-[#1E1E1E] hover:bg-[#252525] border border-[#2C2C2E] rounded-xl px-3 py-1.5 text-left transition cursor-pointer"
            >
              <img
                src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                alt=""
                className="w-7 h-7 rounded-full object-cover border border-[#00E5FF]/40"
              />
              <div className="hidden sm:block">
                <div className="text-xs font-bold text-white truncate max-w-[130px]">
                  {currentUser?.name?.split('(')[0] || 'User'}
                </div>
                <div className="text-[10px] text-[#00E5FF] font-mono uppercase">
                  {currentUser?.role}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#98989D]" />
            </button>

            {/* Switcher Dropdown */}
            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-[#1E1E1E] border border-[#2C2C2E] rounded-2xl shadow-2xl p-2 z-[1100]">
                <div className="px-3 py-1.5 border-b border-[#2C2C2E] mb-2 flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-[#98989D]">Active Dashboard Profiles</span>
                  <span className="text-[9px] bg-[#00E5FF]/20 text-[#00E5FF] px-1.5 py-0.2 rounded font-mono">No OTP</span>
                </div>

                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {relevantUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        setCurrentUser(u);
                        setUserDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded-xl flex items-center gap-2.5 transition cursor-pointer ${
                        currentUser?.id === u.id ? 'bg-[#00E5FF]/10 border border-[#00E5FF]/40' : 'hover:bg-[#252525]'
                      }`}
                    >
                      <img src={u.avatar_url} className="w-8 h-8 rounded-full object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white truncate">{u.name}</div>
                        <div className="text-[10px] text-[#98989D] truncate">
                          {u.company_name || u.mechanic_headline || u.email}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="pt-2 mt-2 border-t border-[#2C2C2E]">
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      setIsAuthOpen(true);
                    }}
                    className="w-full bg-[#121212] hover:bg-[#252525] text-xs font-bold text-[#00E5FF] border border-[#00E5FF]/30 py-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Register New Account (Direct)
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* DASHBOARD CONTENT SWITCHER (Strictly separates the 3 Dashboards) */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8">
        
        {/* DASHBOARD 1: COMPANY DASHBOARD */}
        {activeDashboard === 'company' && (
          <CompanyDashboardView
            currentUser={currentUser}
            jobs={jobs}
            mechanics={mechanics}
            onOpenPostJob={() => setIsPostJobOpen(true)}
            onSelectJob={(jobId) => setActiveJobId(jobId)}
            onOpenChat={(jobId) => setActiveChatJobId(jobId)}
            onOpenProfile={(companyId) => setActiveCompanyId(companyId)}
          />
        )}

        {/* DASHBOARD 2: TECHNICIAN DASHBOARD */}
        {activeDashboard === 'technician' && (
          <TechnicianDashboardView
            currentUser={currentUser}
            jobs={jobs}
            onSelectJob={(jobId) => setActiveJobId(jobId)}
            onOpenChat={(jobId) => setActiveChatJobId(jobId)}
            onOpenEditProfile={() => setIsEditProfileOpen(true)}
            onRefreshData={loadUsersAndData}
          />
        )}

        {/* DASHBOARD 3: ADMIN / SUPERVISOR DASHBOARD */}
        {activeDashboard === 'admin' && (
          <AdminDashboardView
            onSelectJob={(jobId) => setActiveJobId(jobId)}
            onOpenChat={(jobId) => setActiveChatJobId(jobId)}
          />
        )}

      </main>

      {/* MODALS */}
      <PostJobModal
        isOpen={isPostJobOpen}
        onClose={() => setIsPostJobOpen(false)}
        currentUser={currentUser}
        mechanics={mechanics}
        onJobCreated={handleJobCreated}
      />

      <JobDetailsModal
        jobId={activeJobId}
        isOpen={!!activeJobId}
        onClose={() => setActiveJobId(null)}
        currentUser={currentUser}
        onOpenChat={(jobId) => {
          setActiveJobId(null);
          setActiveChatJobId(jobId);
        }}
        onRefreshData={loadUsersAndData}
      />

      <ChatModal
        jobId={activeChatJobId}
        isOpen={!!activeChatJobId}
        onClose={() => setActiveChatJobId(null)}
        currentUser={currentUser}
      />

      <TechnicianProfileEditModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        currentUser={currentUser}
        onProfileUpdated={loadUsersAndData}
      />

      <CompanyProfileModal
        companyUserId={activeCompanyId}
        isOpen={!!activeCompanyId}
        onClose={() => setActiveCompanyId(null)}
        currentUser={currentUser}
        onSelectMechanic={(mechId) => {
          setActiveCompanyId(null);
          // handled
        }}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(user) => {
          loadUsersAndData();
          setCurrentUser(user);
          if (user.role === 'company') setActiveDashboard('company');
          else if (user.role === 'mechanic') setActiveDashboard('technician');
          else setActiveDashboard('admin');
        }}
      />

    </div>
  );
}
