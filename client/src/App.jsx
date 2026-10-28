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
  LogOut,
  User,
  AlertTriangle
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isPostJobOpen, setIsPostJobOpen] = useState(false);
  const [activeJobId, setActiveJobId] = useState(null);
  const [activeChatJobId, setActiveChatJobId] = useState(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [activeCompanyId, setActiveCompanyId] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

    // Initialize from localStorage or fallback
    const initApp = async () => {
      setLoading(true);
      try {
        const [usersData, jobsData, mechsData] = await Promise.all([
          api.getUsers(),
          api.getJobs(),
          api.getMechanics()
        ]);

        setJobs(jobsData);
        setMechanics(mechsData);

          // Check saved user in localStorage
          const savedUserStr = localStorage.getItem('mechconnect_user');
          if (savedUserStr) {
            try {
              const parsed = JSON.parse(savedUserStr);
              // Find fresh data for this user
              const freshUser = usersData.find(u => u.id === parsed.id) || parsed;
              setCurrentUser(freshUser);
            } catch (e) {
              setCurrentUser(usersData[0] || null);
            }
          } else if (usersData.length > 0) {
            // Default to company user
            const defaultUser = usersData.find(u => u.role === 'company') || usersData[0];
            setCurrentUser(defaultUser);
            localStorage.setItem('mechconnect_user', JSON.stringify(defaultUser));
          }
        } catch (err) {
          console.error('Init error:', err);
        } finally {
          setLoading(false);
        }
      };

      useEffect(() => {
        initApp();

          const handleNewJob = () => {
            api.getJobs().then(setJobs);
          };
          const handleStatusChange = () => {
            api.getJobs().then(setJobs);
          };
          const handleProposalUpdate = () => {
            api.getJobs().then(setJobs);
          };
          const handleTechnicianVerified = ({ user_id, is_verified }) => {
            // If current user was verified, update state
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
          socket.on('proposal_update', handleProposalUpdate);
          socket.on('technician_verified', handleTechnicianVerified);

          return () => {
            socket.off('new_job_posted', handleNewJob);
            socket.off('job_status_change', handleStatusChange);
            socket.off('proposal_update', handleProposalUpdate);
            socket.off('technician_verified', handleTechnicianVerified);
          };
        }, []);

        const handleLoginSuccess = (user) => {
          setCurrentUser(user);
          localStorage.setItem('mechconnect_user', JSON.stringify(user));
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

        if (loading) {
          return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 text-xs">
              Loading...
            </div>
          );
        }

        // Determine which dashboard to display based strictly on login credentials
        const userRole = currentUser?.role || 'company';

        return (
            <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">

                  {/* Top Navbar */}
                  <header className="sticky top-0 z-[1000] bg-white border-b border-slate-200 px-4 lg:px-8 py-3">
                    <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">

                          {/* Brand */}
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-sm">
                              M
                            </div>
                            <div>
                              <span className="font-extrabold text-base tracking-tight text-slate-900">MechConnect</span>
                              <span className="text-[10px] text-slate-400 font-mono ml-2">Industrial</span>
                            </div>
                          </div>

                                  {/* User Account & Actions */}
                                  <div className="flex items-center gap-2">
                                    {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs font-semibold text-slate-900">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase font-mono">
                    {userRole === 'company' ? 'Company Account' : userRole === 'mechanic' ? 'Technician Account' : 'Admin'}
                  </div>
                </div>

                                      <button
                                        onClick={handleSignOut}
                                        title="Switch / Sign Out"
                                        className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer flex items-center gap-1.5 text-xs"
                                      >
                                        <LogOut className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">Sign Out</span>
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

                            {/* DASHBOARD RENDERED STRICTLY BASED ON CREDENTIALS */}
                            <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8">

                              {!currentUser ? (
                                <div className="flex flex-col items-center justify-center p-12 text-center min-h-[50vh] bg-white rounded-xl border border-slate-200">
                                  <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-base mb-3">
                                    M
                                  </div>
                                  <h2 className="text-base font-bold text-slate-900 mb-1">MechConnect Sign In</h2>
                                  <div className="text-xs text-slate-500 mb-5">Please sign in to access your account dashboard</div>
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

                            <AuthModal
                              isOpen={isAuthOpen}
                              onClose={() => setIsAuthOpen(false)}
                              onAuthSuccess={handleLoginSuccess}
                            />

                          </div>
                          );
}
