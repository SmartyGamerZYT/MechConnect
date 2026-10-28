import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import MapView from './components/MapView';
import PostJobModal from './components/PostJobModal';
import JobDetailsModal from './components/JobDetailsModal';
import ChatModal from './components/ChatModal';
import MechanicProfileModal from './components/MechanicProfileModal';
import CompanyProfileModal from './components/CompanyProfileModal';
import MechanicDirectoryView from './components/MechanicDirectoryView';
import AdminDashboardView from './components/AdminDashboardView';
import AuthModal from './components/AuthModal';
import { api, socket } from './services/api';
import {
  MapPin,
  ListFilter,
  AlertTriangle,
  Clock,
  Layers,
  Search,
  Filter,
  CheckCircle,
  Wrench,
  ArrowRight,
  TrendingUp,
  Image as ImageIcon
} from 'lucide-react';

export default function App() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'directory' | 'myjobs' | 'chat' | 'admin'
  const [feedDisplayMode, setFeedDisplayMode] = useState('split'); // 'split' | 'map' | 'list'
  
  // Filters
  const [urgencyFilter, setUrgencyFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isPostJobOpen, setIsPostJobOpen] = useState(false);
  const [activeJobId, setActiveJobId] = useState(null);
  const [activeChatJobId, setActiveChatJobId] = useState(null);
  const [activeMechanicId, setActiveMechanicId] = useState(null);
  const [activeCompanyId, setActiveCompanyId] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [toastNotification, setToastNotification] = useState(null);

  // Load initial data
  const loadUsersAndData = async () => {
    try {
      const [usersData, jobsData, mechsData] = await Promise.all([
        api.getUsers(),
        api.getJobs(),
        api.getMechanics()
      ]);

      setUsers(usersData);
      if (!currentUser && usersData.length > 0) {
        // Default to Company user (Jayant Patel @ Apex Heavy Machining)
        setCurrentUser(usersData[0]);
      }
      setJobs(jobsData);
      setMechanics(mechsData);
    } catch (err) {
      console.error('Initialization error:', err);
    }
  };

  useEffect(() => {
    loadUsersAndData();

    // Socket listeners
    socket.on('new_job_posted', (data) => {
      setToastNotification(`🚨 New Breakdown Dispatched: ${data.title} (${data.urgency}) in ${data.city}`);
      setTimeout(() => setToastNotification(null), 7000);
      api.getJobs().then(setJobs);
    });

    socket.on('job_status_change', (data) => {
      api.getJobs().then(setJobs);
    });

    return () => {
      socket.off('new_job_posted');
      socket.off('job_status_change');
    };
  }, []);

  const handleJobCreated = (jobId) => {
    api.getJobs().then(setJobs);
    setActiveJobId(jobId);
  };

  const handleSwitchUser = (user) => {
    setCurrentUser(user);
  };

  // Filter jobs
  const filteredJobs = jobs.filter((j) => {
    if (urgencyFilter !== 'ALL' && j.urgency !== urgencyFilter) return false;
    if (categoryFilter !== 'ALL' && !j.machine_category.includes(categoryFilter)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = j.title?.toLowerCase().includes(q) ||
        j.fault_description?.toLowerCase().includes(q) ||
        j.machine_brand?.toLowerCase().includes(q) ||
        j.city?.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // User's specific jobs for 'myjobs' tab
  const myJobs = jobs.filter((j) => {
    if (currentUser?.role === 'company') {
      return j.company_user_id === currentUser.id;
    } else if (currentUser?.role === 'mechanic') {
      return j.assigned_mechanic_user_id === currentUser.id || j.status === 'OPEN';
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col font-sans selection:bg-[#00E5FF] selection:text-black">
      
      {/* Toast Alert Banner */}
      {toastNotification && (
        <div className="bg-[#FF453A] text-white font-mono text-xs py-2 px-4 text-center flex items-center justify-center gap-2 shadow-lg animate-bounce sticky top-0 z-[2000]">
          <AlertTriangle className="w-4 h-4" />
          <span>{toastNotification}</span>
        </div>
      )}

      {/* Navigation */}
      <Navbar
        currentUser={currentUser}
        users={users}
        onSwitchUser={handleSwitchUser}
        onOpenPostJob={() => setIsPostJobOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuthModal={() => setIsAuthOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">
        
        {/* =========================================
            TAB 1: FEED & SPATIAL RADAR MAP
           ========================================= */}
        {activeTab === 'feed' && (
          <div className="space-y-5">
            
            {/* Filter and View Controls Bar */}
            <div className="bg-[#1E1E1E] border border-[#2C2C2E] rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
              
              {/* Urgency Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
                <span className="text-[10px] font-mono text-[#98989D] uppercase tracking-wider mr-1">
                  SLA:
                </span>
                <button
                  onClick={() => setUrgencyFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    urgencyFilter === 'ALL'
                      ? 'bg-[#00E5FF] text-black font-bold'
                      : 'bg-[#141414] text-[#98989D] border border-[#2C2C2E]'
                  }`}
                >
                  All ({jobs.length})
                </button>
                <button
                  onClick={() => setUrgencyFilter('EMERGENCY')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                    urgencyFilter === 'EMERGENCY'
                      ? 'bg-[#FF453A] text-white font-bold shadow-[0_0_12px_rgba(255,69,58,0.4)]'
                      : 'bg-[#141414] text-[#FF453A] border border-[#FF453A]/30'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#FF453A] animate-ping"></span>
                  🔴 Emergency (&lt;1h)
                </button>
                <button
                  onClick={() => setUrgencyFilter('SAME_DAY')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    urgencyFilter === 'SAME_DAY'
                      ? 'bg-[#FF9F0A] text-black font-bold'
                      : 'bg-[#141414] text-[#FF9F0A] border border-[#FF9F0A]/30'
                  }`}
                >
                  🟠 Same Day
                </button>
                <button
                  onClick={() => setUrgencyFilter('SCHEDULED')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    urgencyFilter === 'SCHEDULED'
                      ? 'bg-[#32D74B] text-black font-bold'
                      : 'bg-[#141414] text-[#32D74B] border border-[#32D74B]/30'
                  }`}
                >
                  🟢 Scheduled
                </button>
              </div>

              {/* Search & Mode Toggles */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-60">
                  <Search className="w-3.5 h-3.5 text-[#98989D] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search CNC, press, pump, city..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#121212] border border-[#2C2C2E] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#505050] focus:border-[#00E5FF]"
                  />
                </div>

                <div className="flex items-center bg-[#141414] border border-[#2C2C2E] p-1 rounded-xl">
                  <button
                    onClick={() => setFeedDisplayMode('split')}
                    className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition ${
                      feedDisplayMode === 'split' ? 'bg-[#00E5FF] text-black font-bold' : 'text-[#98989D]'
                    }`}
                  >
                    Split
                  </button>
                  <button
                    onClick={() => setFeedDisplayMode('map')}
                    className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition ${
                      feedDisplayMode === 'map' ? 'bg-[#00E5FF] text-black font-bold' : 'text-[#98989D]'
                    }`}
                  >
                    Map
                  </button>
                  <button
                    onClick={() => setFeedDisplayMode('list')}
                    className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition ${
                      feedDisplayMode === 'list' ? 'bg-[#00E5FF] text-black font-bold' : 'text-[#98989D]'
                    }`}
                  >
                    List
                  </button>
                </div>
              </div>

            </div>

            {/* Split / Map / List Grid */}
            <div className={`grid gap-6 ${feedDisplayMode === 'split' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'}`}>
              
              {/* Map Column */}
              {(feedDisplayMode === 'split' || feedDisplayMode === 'map') && (
                <div className={feedDisplayMode === 'split' ? 'lg:col-span-7' : 'w-full'}>
                  <MapView
                    jobs={filteredJobs}
                    mechanics={mechanics}
                    onSelectJob={(job) => setActiveJobId(job.id)}
                    onSelectMechanic={(mechId) => setActiveMechanicId(mechId)}
                  />
                </div>
              )}

              {/* List Column */}
              {(feedDisplayMode === 'split' || feedDisplayMode === 'list') && (
                <div className={`space-y-3.5 ${feedDisplayMode === 'split' ? 'lg:col-span-5 max-h-[620px] overflow-y-auto pr-1' : 'w-full'}`}>
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-mono uppercase tracking-wider text-[#98989D]">
                      Live Breakdown Pipeline ({filteredJobs.length})
                    </span>
                    <span className="text-[10px] text-[#00E5FF] font-mono">
                      Real-time DB Sync
                    </span>
                  </div>

                  {filteredJobs.length === 0 ? (
                    <div className="bg-[#1E1E1E] border border-[#2C2C2E] rounded-2xl p-8 text-center text-xs text-[#98989D]">
                      No breakdowns matching your active filter.
                    </div>
                  ) : (
                    filteredJobs.map((job) => {
                      const isEmerg = job.urgency === 'EMERGENCY';
                      const isSameDay = job.urgency === 'SAME_DAY';

                      return (
                        <div
                          key={job.id}
                          onClick={() => setActiveJobId(job.id)}
                          className={`bg-[#1E1E1E] border rounded-2xl p-4.5 hover:border-[#00E5FF] transition cursor-pointer group shadow-lg ${
                            isEmerg ? 'border-[#FF453A]/40' : 'border-[#2C2C2E]'
                          }`}
                        >
                          {/* Card Top */}
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                              isEmerg
                                ? 'bg-[#FF453A]/20 text-[#FF453A] border border-[#FF453A]/40'
                                : isSameDay
                                ? 'bg-[#FF9F0A]/20 text-[#FF9F0A] border border-[#FF9F0A]/40'
                                : 'bg-[#32D74B]/20 text-[#32D74B] border border-[#32D74B]/40'
                            }`}>
                              {job.urgency}
                            </span>
                            <span className="text-[10px] font-mono text-[#98989D]">
                              {job.id}
                            </span>
                          </div>

                          <h3 className="font-bold text-sm text-white group-hover:text-[#00E5FF] transition mb-1 leading-snug">
                            {job.title}
                          </h3>

                          <p className="text-xs text-[#98989D] line-clamp-2 mb-3">
                            {job.fault_description}
                          </p>

                          {/* Machine & Location Bar */}
                          <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-[11px] text-[#98989D] mb-3 border-y border-[#2C2C2E] py-2">
                            <span className="text-[#00E5FF] font-medium">{job.machine_category}</span>
                            <span>&bull;</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#00E5FF]" />
                              {job.city}
                            </span>
                            <span>&bull;</span>
                            <span className="text-white font-mono font-bold">
                              {job.budget_min ? `₹${job.budget_min.toLocaleString()} - ₹${job.budget_max?.toLocaleString()}` : 'Budget Open'}
                            </span>
                          </div>

                          {/* Card Bottom */}
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 text-[11px] text-[#98989D]">
                              <span>🏢 {job.company_name || 'Plant'}</span>
                              {job.proposals_count > 0 && (
                                <span className="text-[10px] bg-[#00E5FF]/10 text-[#00E5FF] px-1.5 py-0.2 rounded font-mono">
                                  {job.proposals_count} bids
                                </span>
                              )}
                            </div>

                            <span className="text-[#00E5FF] group-hover:translate-x-1 transition text-xs font-semibold flex items-center gap-1">
                              Review &rarr;
                            </span>
                          </div>

                        </div>
                      );
                    })
                  )}
                </div>
              )}

            </div>
          </div>
        )}

        {/* =========================================
            TAB 2: TECHNICIANS DIRECTORY
           ========================================= */}
        {activeTab === 'directory' && (
          <MechanicDirectoryView
            currentUser={currentUser}
            onSelectMechanic={(mechId) => setActiveMechanicId(mechId)}
          />
        )}

        {/* =========================================
            TAB 3: MY JOBS & HISTORY
           ========================================= */}
        {activeTab === 'myjobs' && (
          <div className="space-y-5">
            <div className="bg-[#1E1E1E] border border-[#2C2C2E] rounded-2xl p-5 sm:p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">
                  {currentUser?.role === 'company' ? 'Facility Repair Tickets & History' : 'My Active Dispatch Tasks'}
                </h2>
                <p className="text-xs text-[#98989D]">
                  Complete chronological ledger of break-fix tasks, quotes, and completion certificates.
                </p>
              </div>

              {currentUser?.role === 'company' && (
                <button
                  onClick={() => setIsPostJobOpen(true)}
                  className="bg-[#00E5FF] hover:bg-[#00c5dc] text-black font-extrabold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
                >
                  + Post New Breakdown
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myJobs.map((j) => (
                <div
                  key={j.id}
                  onClick={() => setActiveJobId(j.id)}
                  className="bg-[#1E1E1E] border border-[#2C2C2E] hover:border-[#00E5FF] rounded-2xl p-5 flex flex-col justify-between transition cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        j.urgency === 'EMERGENCY' ? 'bg-[#FF453A]/20 text-[#FF453A]' : 'bg-[#32D74B]/20 text-[#32D74B]'
                      }`}>
                        {j.urgency}
                      </span>
                      <span className="text-[10px] font-mono text-[#00E5FF] bg-[#141414] px-2 py-0.5 rounded border border-[#2C2C2E]">
                        {j.status}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-white mb-1 leading-snug">{j.title}</h3>
                    <p className="text-xs text-[#98989D] line-clamp-2 mb-3">{j.fault_description}</p>
                  </div>

                  <div className="border-t border-[#2C2C2E] pt-3 flex items-center justify-between text-xs">
                    <span className="font-mono text-white font-bold">
                      {j.agreed_price ? `Agreed: ₹${j.agreed_price.toLocaleString()}` : 'Bidding Open'}
                    </span>
                    <span className="text-[#00E5FF] text-xs font-semibold">
                      Open Ticket &rarr;
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================
            TAB 4: DIRECT CHAT / NEGOTIATION
           ========================================= */}
        {activeTab === 'chat' && (
          <div className="bg-[#1E1E1E] border border-[#2C2C2E] rounded-2xl p-6 text-center space-y-4">
            <h2 className="text-xl font-bold text-white">Live Negotiated Job Channels</h2>
            <p className="text-xs text-[#98989D] max-w-md mx-auto">
              Select an active breakdown job below to open its dedicated negotiation room, view counter-offers, and exchange machine schematics.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-w-3xl mx-auto pt-2">
              {jobs.map((job) => (
                <button
                  key={job.id}
                  onClick={() => setActiveChatJobId(job.id)}
                  className="bg-[#141414] hover:bg-[#252525] border border-[#2C2C2E] hover:border-[#00E5FF] p-4 rounded-xl text-left transition cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-[#00E5FF]">{job.id}</span>
                    <span className="text-[9px] font-mono bg-[#1E1E1E] px-1.5 py-0.2 rounded text-[#98989D]">{job.urgency}</span>
                  </div>
                  <div className="text-xs font-bold text-white truncate mb-1">{job.title}</div>
                  <div className="text-[11px] text-[#98989D]">Status: {job.status}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* =========================================
            TAB 5: ADMIN / OPERATIONS
           ========================================= */}
        {activeTab === 'admin' && (
          <AdminDashboardView
            onSelectJob={(jobId) => setActiveJobId(jobId)}
          />
        )}

      </main>

      {/* Modals */}
      <PostJobModal
        isOpen={isPostJobOpen}
        onClose={() => setIsPostJobOpen(false)}
        currentUser={currentUser}
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

      <MechanicProfileModal
        mechanicUserId={activeMechanicId}
        isOpen={!!activeMechanicId}
        onClose={() => setActiveMechanicId(null)}
        currentUser={currentUser}
      />

      <CompanyProfileModal
        companyUserId={activeCompanyId}
        isOpen={!!activeCompanyId}
        onClose={() => setActiveCompanyId(null)}
        currentUser={currentUser}
        onSelectMechanic={(mechId) => {
          setActiveCompanyId(null);
          setActiveMechanicId(mechId);
        }}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(user) => {
          loadUsersAndData();
          setCurrentUser(user);
        }}
      />

    </div>
  );
}
