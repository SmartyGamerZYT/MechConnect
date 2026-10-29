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
import WalletModal from './components/WalletModal';
import ReceiptModal from './components/ReceiptModal';
import { api, socket } from './services/api';
import {
  Wrench,
  Building2,
  Shield,
  LogOut,
  User,
  AlertTriangle,
  Wallet,
  RefreshCw
} from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('MechConnect UI Error Boundary caught an exception:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-lg mx-auto my-12 bg-white border border-red-200 rounded-xl shadow-xs text-center space-y-4">
          <div className="w-12 h-12 mx-auto bg-red-50 text-red-600 rounded-full flex items-center justify-center font-bold text-xl">
            !
          </div>
          <h2 className="text-base font-bold text-slate-900">Dashboard Encountered an Issue</h2>
          <p className="text-xs text-slate-600">
            {this.state.error?.message || 'An unexpected rendering error occurred. Please reload to restore session.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition cursor-pointer inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload View</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);

  // Modals
  const [isPostJobOpen, setIsPostJobOpen] = useState(false);
  const [activeJobId, setActiveJobId] = useState(null);
  const [activeChatJobId, setActiveChatJobId] = useState(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [activeCompanyId, setActiveCompanyId] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [activeReceiptJobId, setActiveReceiptJobId] = useState(null);

  // Initialize from localStorage or fallback
  const initApp = async () => {
    try {
      const [usersData, jobsData, mechsData] = await Promise.all([
        api.getUsers(),
        api.getJobs(),
        api.getMechanics()
      ]);

      setJobs(jobsData);
      setMechanics(mechsData);

      const savedUserStr = localStorage.getItem('mechconnect_user');
      let activeU = null;
      if (savedUserStr) {
        try {
          const parsed = JSON.parse(savedUserStr);
          activeU = usersData.find(u => u.id === parsed.id) || parsed;
        } catch (e) {
          activeU = null;
        }
      } else if (usersData.length > 0) {
        activeU = usersData.find(u => u.role === 'company') || usersData[0];
        localStorage.setItem('mechconnect_user', JSON.stringify(activeU));
      }

      setCurrentUser(activeU);

      if (activeU?.id) {
        api.getWallet(activeU.id).then(res => {
          if (res?.wallet) setWalletBalance(res.wallet.balance || 0);
        }).catch(() => {});
      }
    } catch (err) {
      console.error('Init error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initApp();

    const handleNewJob = () => api.getJobs().then(setJobs);
    const handleStatusChange = () => {
      api.getJobs().then(setJobs);
      if (currentUser?.id) {
        api.getWallet(currentUser.id).then(res => {
          if (res?.wallet) setWalletBalance(res.wallet.balance || 0);
        }).catch(() => {});
      }
    };
    const handleProposalUpdate = () => api.getJobs().then(setJobs);
    const handleTechnicianVerified = ({ user_id, is_verified }) => {
      setCurrentUser(prev => {
        if (prev && prev.id === user_id) {
          const updated = { ...prev, mechanic_is_verified: is_verified };
          localStorage.setItem('mechconnect_user', JSON.stringify(updated));
          return updated;
        }
        return prev;
      });
      api.getMechanics().then(setMechanics);
    };

    socket.on('new_job_posted', handleNewJob);
    socket.on('job_status_change', handleStatusChange);
    socket.on('job_deleted', handleStatusChange);
    socket.on('proposal_update', handleProposalUpdate);
    socket.on('technician_verified', handleTechnicianVerified);

    return () => {
      socket.off('new_job_posted', handleNewJob);
      socket.off('job_status_change', handleStatusChange);
      socket.off('job_deleted', handleStatusChange);
      socket.off('proposal_update', handleProposalUpdate);
      socket.off('technician_verified', handleTechnicianVerified);
    };
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem('mechconnect_user', JSON.stringify(user));
    if (user?.id) {
      api.getWallet(user.id).then(res => {
        if (res?.wallet) setWalletBalance(res.wallet.balance || 0);
      }).catch(() => {});
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('mechconnect_user');
    setCurrentUser(null);
    setIsAuthOpen(true);
  };

  const handleJobCreated = (jobId) => {
    api.getJobs().then(setJobs);
    setActiveJobId(jobId);
  };

  const refreshWalletBalance = () => {
    if (currentUser?.id) {
      api.getWallet(currentUser.id).then(res => {
        if (res?.wallet) setWalletBalance(res.wallet.balance || 0);
      }).catch(() => {});
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 text-xs">
        Loading MechConnect industrial marketplace...
      </div>
    );
  }

  const userRole = currentUser?.role || 'company';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-[1000] bg-white border-b border-slate-200 px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo with Wrench icon as before */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
              <Wrench className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-slate-900">MechConnect</span>
              <span className="text-[10px] text-slate-400 font-mono ml-2">Industrial</span>
            </div>
          </div>

          {/* User Account & Actions */}
          <div className="flex items-center gap-2.5">
            {currentUser ? (
              <div className="flex items-center gap-3">
                
                {/* Wallet Pill */}
                <button
                  onClick={() => setIsWalletOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold transition cursor-pointer shadow-2xs"
                >
                  <Wallet className="w-3.5 h-3.5 text-slate-700" />
                  <span>Wallet: <b className="font-mono text-slate-900">₹{walletBalance.toLocaleString()}</b></span>
                </button>

                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-slate-900">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase font-mono">
                    {userRole === 'company' ? 'Company' : userRole === 'mechanic' ? 'Technician' : 'Admin'}
                  </div>
                </div>

                <button
                  onClick={handleSignOut}
                  title="Sign Out / Switch"
                  className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer flex items-center gap-1.5 text-xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8">
        <ErrorBoundary>
          {!currentUser ? (
            <div className="flex flex-col items-center justify-center p-12 text-center min-h-[50vh] bg-white rounded-xl border border-slate-200">
              <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white mb-3">
                <Wrench className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-base font-bold text-slate-900 mb-1">MechConnect Sign In</h2>
              <div className="text-xs text-slate-500 mb-5">Please sign in to access your role-based dashboard</div>
              <button
                onClick={() => setIsAuthOpen(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-5 py-2 rounded-lg transition cursor-pointer"
              >
                Sign In / Register
              </button>
            </div>
          ) : (
            <>
              {/* If logged in as Company */}
              {userRole === 'company' && (
                <CompanyDashboardView
                  currentUser={currentUser}
                  jobs={jobs}
                  mechanics={mechanics}
                  onOpenPostJob={() => setIsPostJobOpen(true)}
                  onSelectJob={(jobId) => setActiveJobId(jobId)}
                  onOpenChat={(jobId) => setActiveChatJobId(jobId)}
                  onOpenProfile={(companyId) => setActiveCompanyId(companyId)}
                  onOpenReceipt={(jobId) => setActiveReceiptJobId(jobId)}
                  onRefreshData={initApp}
                />
              )}

              {/* If logged in as Technician */}
              {userRole === 'mechanic' && (
                <TechnicianDashboardView
                  currentUser={currentUser}
                  jobs={jobs}
                  onSelectJob={(jobId) => setActiveJobId(jobId)}
                  onOpenChat={(jobId) => setActiveChatJobId(jobId)}
                  onOpenEditProfile={() => setIsEditProfileOpen(true)}
                  onOpenReceipt={(jobId) => setActiveReceiptJobId(jobId)}
                  onRefreshData={initApp}
                />
              )}

              {/* If logged in as Admin */}
              {userRole === 'admin' && (
                <AdminDashboardView
                  onSelectJob={(jobId) => setActiveJobId(jobId)}
                  onOpenChat={(jobId) => setActiveChatJobId(jobId)}
                />
              )}
            </>
          )}
        </ErrorBoundary>
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
        onRefreshData={initApp}
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
        onProfileUpdated={initApp}
      />

      <CompanyProfileModal
        companyUserId={activeCompanyId}
        isOpen={!!activeCompanyId}
        onClose={() => setActiveCompanyId(null)}
        currentUser={currentUser}
      />

      <WalletModal
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        currentUser={currentUser}
        onBalanceUpdated={refreshWalletBalance}
      />

      <ReceiptModal
        jobId={activeReceiptJobId}
        isOpen={!!activeReceiptJobId}
        onClose={() => setActiveReceiptJobId(null)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleLoginSuccess}
      />

    </div>
  );
}
