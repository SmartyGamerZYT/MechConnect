import React, { useState } from 'react';
import {
  Wrench,
  AlertTriangle,
  Clock,
  CheckCircle2,
  MapPin,
  TrendingUp,
  DollarSign,
  Shield,
  MessageSquare,
  Award,
  Briefcase,
  Send,
  Upload,
  User
} from 'lucide-react';
import MapView from './MapView';
import { api } from '../services/api';

export default function TechnicianDashboardView({
  currentUser,
  jobs = [],
  onSelectJob,
  onOpenChat,
  onOpenEditProfile,
  onRefreshData
}) {
  const [biddingJobId, setBiddingJobId] = useState(null);
  const [bidPrice, setBidPrice] = useState('');
  const [bidEta, setBidEta] = useState('25 mins');
  const [bidMessage, setBidMessage] = useState('');
  const [submittingBid, setSubmittingBid] = useState(false);
  const [viewMode, setViewMode] = useState('feed'); // 'feed' or 'map'

  // Open jobs available for bidding
  const openBiddingJobs = jobs.filter(j => j.status === 'OPEN' || j.status === 'MATCHED');

  // Jobs assigned to this technician
  const myAssignedJobs = jobs.filter(j => j.assigned_mechanic_user_id === currentUser?.id);
  const myActiveJobs = myAssignedJobs.filter(j => ['ASSIGNED', 'ON_THE_WAY', 'WORKING'].includes(j.status));
  const myCompletedJobs = myAssignedJobs.filter(j => j.status === 'COMPLETED');

  // Total earnings
  const totalEarnings = myCompletedJobs.reduce((acc, j) => acc + (j.agreed_price || 0), 0) + (currentUser?.mechanic_earnings || 0);

  // Submit quick bid
  const handleQuickBid = async (jobId) => {
    if (!bidPrice) return;
    setSubmittingBid(true);
    try {
      await api.applyToJob(jobId, {
        mechanic_user_id: currentUser.id,
        proposed_price: parseFloat(bidPrice),
        estimated_arrival: bidEta,
        message: bidMessage || 'Equipped with diagnostic equipment and ready for dispatch.'
      });
      setBiddingJobId(null);
      setBidPrice('');
      setBidMessage('');
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error('Bid failed:', err);
    } finally {
      setSubmittingBid(false);
    }
  };

  // Status progression
  const handleAdvanceStatus = async (jobId, nextStatus) => {
    try {
      await api.updateJobStatus(jobId, {
        status: nextStatus,
        user_id: currentUser.id,
        note: `Technician transitioned status to ${nextStatus}`
      });
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Portal Header */}
      <div className="bg-[#1E1E1E] border border-[#2C2C2E] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#32D74B] animate-pulse"></span>
            <span className="text-[10px] font-mono text-[#32D74B] uppercase font-bold tracking-wider">
              FIELD TECHNICIAN WORKBENCH & DISPATCH
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <span>{currentUser?.name}</span>
            <span className="text-xs bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40 px-2 py-0.5 rounded font-mono font-bold">
              {currentUser?.mechanic_headline || 'Master Specialist'}
            </span>
          </h1>
          <p className="text-xs text-[#98989D]">
            Review nearby breakdown broadcasts, submit competitive quotes, and manage on-site diagnostic tickets.
          </p>
        </div>

        <button
          onClick={onOpenEditProfile}
          className="bg-[#00E5FF] hover:bg-[#00c5dc] text-black font-extrabold text-xs px-4 py-2.5 rounded-xl transition shadow-[0_0_15px_rgba(0,229,255,0.3)] cursor-pointer flex items-center gap-1.5"
        >
          <Award className="w-4 h-4" />
          <span>Edit Credentials (PFP, Certs, Works)</span>
        </button>
      </div>

      {/* TOP 3 KPIS (WattVision 3-Column Layout: KPI, KPI, KPI) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* KPI 1: Open Breakdowns to Bid On */}
        <div className="bg-[#1E1E1E] border border-[#00E5FF]/40 rounded-2xl p-5 shadow-[0_0_15px_rgba(0,229,255,0.1)]">
          <div className="flex items-center justify-between text-xs text-[#98989D] mb-1">
            <span className="font-mono uppercase tracking-wider">Breakdowns Open For Bidding</span>
            <TrendingUp className="w-4 h-4 text-[#00E5FF]" />
          </div>
          <div className="text-3xl font-extrabold text-[#00E5FF] font-mono tracking-tight">
            {openBiddingJobs.length} <span className="text-xs text-[#98989D] font-normal">LEADS</span>
          </div>
          <div className="text-[11px] text-[#00E5FF] font-mono mt-1">
            Nearby industrial corridors (MIDC)
          </div>
        </div>

        {/* KPI 2: Active Assigned Repairs */}
        <div className="bg-[#1E1E1E] border border-[#FF9F0A]/40 rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-[#98989D] mb-1">
            <span className="font-mono uppercase tracking-wider">My Active Work Orders</span>
            <Wrench className="w-4 h-4 text-[#FF9F0A]" />
          </div>
          <div className="text-3xl font-extrabold text-[#FF9F0A] font-mono tracking-tight">
            {myActiveJobs.length} <span className="text-xs text-[#98989D] font-normal">ASSIGNED</span>
          </div>
          <div className="text-[11px] text-[#98989D] font-mono mt-1">
            En route & on factory shop floor
          </div>
        </div>

        {/* KPI 3: Total Earnings / Completed */}
        <div className="bg-[#1E1E1E] border border-[#32D74B]/40 rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-[#98989D] mb-1">
            <span className="font-mono uppercase tracking-wider">Total Payouts Settled</span>
            <DollarSign className="w-4 h-4 text-[#32D74B]" />
          </div>
          <div className="text-3xl font-extrabold text-[#32D74B] font-mono tracking-tight">
            ₹{totalEarnings.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#32D74B] font-mono mt-1">
            {myCompletedJobs.length} completed restoration jobs
          </div>
        </div>

      </div>

      {/* 12-COLUMN INDUSTRIAL GRID (8 Columns Feed & Bidding, 4 Columns Profile & Credentials) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 8 COLUMNS: Breakdowns to Bid On & Active Work Orders */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* Active Work Orders Section if any */}
          {myActiveJobs.length > 0 && (
            <div className="bg-[#1E1E1E] border-2 border-[#FF9F0A]/50 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-[#2C2C2E] pb-2">
                <span className="text-xs font-mono uppercase font-bold text-[#FF9F0A] flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF9F0A] animate-ping"></span>
                  Active Assigned Dispatches ({myActiveJobs.length})
                </span>
                <span className="text-[10px] text-[#98989D] font-mono">Real-time GPS Tracking</span>
              </div>

              {myActiveJobs.map((j) => (
                <div key={j.id} className="bg-[#141414] border border-[#2C2C2E] p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-white">{j.title}</h4>
                      <div className="text-xs text-[#98989D]">{j.company_name} &bull; {j.address}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono font-bold text-[#00E5FF]">₹{j.agreed_price?.toLocaleString()}</div>
                      <div className="text-[10px] font-mono text-[#32D74B]">Locked Quote</div>
                    </div>
                  </div>

                  {/* Advance milestone */}
                  <div className="pt-2 border-t border-[#2C2C2E] flex items-center justify-between">
                    <span className="text-xs text-[#98989D]">Current: <b className="text-white font-mono">{j.status}</b></span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenChat(j.id)}
                        className="bg-[#1E1E1E] hover:bg-[#252525] border border-[#00E5FF]/40 text-[#00E5FF] text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Chat
                      </button>
                      {j.status === 'ASSIGNED' && (
                        <button
                          onClick={() => handleAdvanceStatus(j.id, 'ON_THE_WAY')}
                          className="bg-[#00E5FF] text-black font-extrabold text-xs px-3.5 py-1.5 rounded-lg"
                        >
                          Mark "On The Way" &rarr;
                        </button>
                      )}
                      {j.status === 'ON_THE_WAY' && (
                        <button
                          onClick={() => handleAdvanceStatus(j.id, 'WORKING')}
                          className="bg-[#FF9F0A] text-black font-extrabold text-xs px-3.5 py-1.5 rounded-lg"
                        >
                          Mark "Arrived & Diagnosing" &rarr;
                        </button>
                      )}
                      {j.status === 'WORKING' && (
                        <button
                          onClick={() => onSelectJob(j.id)}
                          className="bg-[#32D74B] text-black font-extrabold text-xs px-3.5 py-1.5 rounded-lg"
                        >
                          Complete Job Card &rarr;
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Open Bidding Feed / Map */}
          <div className="bg-[#1E1E1E] border border-[#2C2C2E] rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2C2C2E]">
              <div>
                <h3 className="font-bold text-white text-base">Breakdowns Open For Bidding</h3>
                <p className="text-xs text-[#98989D]">Place your proposed price and estimated arrival time</p>
              </div>

              <div className="flex items-center bg-[#141414] border border-[#2C2C2E] p-1 rounded-xl text-xs">
                <button
                  onClick={() => setViewMode('feed')}
                  className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                    viewMode === 'feed' ? 'bg-[#00E5FF] text-black' : 'text-[#98989D]'
                  }`}
                >
                  List Feed
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                    viewMode === 'map' ? 'bg-[#00E5FF] text-black' : 'text-[#98989D]'
                  }`}
                >
                  Radar Map
                </button>
              </div>
            </div>

            {viewMode === 'map' ? (
              <MapView
                jobs={openBiddingJobs}
                mechanics={[]}
                onSelectJob={(job) => onSelectJob(job.id)}
              />
            ) : (
              <div className="space-y-4">
                {openBiddingJobs.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[#98989D]">
                    No open breakdowns currently awaiting bids.
                  </div>
                ) : (
                  openBiddingJobs.map((job) => {
                    const isEmerg = job.urgency === 'EMERGENCY';
                    const isBiddingThis = biddingJobId === job.id;

                    return (
                      <div
                        key={job.id}
                        className={`bg-[#141414] border rounded-2xl p-4.5 space-y-3 transition ${
                          isEmerg ? 'border-[#FF453A]/40' : 'border-[#2C2C2E]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                                isEmerg
                                  ? 'bg-[#FF453A]/20 text-[#FF453A] border border-[#FF453A]/40'
                                  : 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40'
                              }`}>
                                {job.urgency}
                              </span>
                              <span className="text-[10px] font-mono text-[#98989D]">{job.id}</span>
                              <span className="text-xs text-[#00E5FF] font-semibold">{job.machine_category}</span>
                            </div>

                            <h4 className="font-bold text-sm text-white">{job.title}</h4>
                            <div className="text-xs text-[#98989D] flex items-center gap-2 mt-0.5">
                              <MapPin className="w-3 h-3 text-[#00E5FF]" />
                              <span>{job.address}, {job.city}</span>
                              {job.error_code && <span className="text-[#FF453A] font-mono">[{job.error_code}]</span>}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-base font-mono font-bold text-[#00E5FF]">
                              {job.budget_min ? `₹${job.budget_min.toLocaleString()} - ₹${job.budget_max?.toLocaleString()}` : 'Budget Open'}
                            </div>
                            <div className="text-[10px] text-[#98989D] font-mono">
                              {job.proposals_count || 0} bids placed
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-gray-300 leading-relaxed bg-[#1E1E1E] p-3 rounded-xl border border-[#2C2C2E]">
                          {job.fault_description}
                        </p>

                        {/* Bid Action Bar */}
                        <div className="flex items-center justify-between pt-1">
                          <button
                            onClick={() => onSelectJob(job.id)}
                            className="text-xs text-[#98989D] hover:text-white underline cursor-pointer"
                          >
                            View Full Diagnostic Telemetry &rarr;
                          </button>

                          <button
                            onClick={() => setBiddingJobId(isBiddingThis ? null : job.id)}
                            className="bg-[#00E5FF] hover:bg-[#00c5dc] text-black font-extrabold text-xs px-4 py-2 rounded-xl transition shadow-[0_0_12px_rgba(0,229,255,0.25)] cursor-pointer"
                          >
                            {isBiddingThis ? 'Cancel Bid' : '⚡ PLACE YOUR BID NOW'}
                          </button>
                        </div>

                        {/* Quick Bidding Inline Form */}
                        {isBiddingThis && (
                          <div className="bg-[#1E1E1E] border border-[#00E5FF]/40 rounded-xl p-4 mt-3 space-y-3 shadow-lg">
                            <div className="text-xs font-bold text-[#00E5FF] flex items-center gap-1.5 font-mono uppercase">
                              <Send className="w-3.5 h-3.5" />
                              Submit Proposal for {job.id}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-mono text-[#98989D] mb-1">
                                  Your Proposed Price (₹) *
                                </label>
                                <input
                                  type="number"
                                  placeholder="e.g. 8500"
                                  value={bidPrice}
                                  onChange={(e) => setBidPrice(e.target.value)}
                                  className="w-full bg-[#141414] border border-[#2C2C2E] rounded-lg px-3 py-1.5 text-xs text-white focus:border-[#00E5FF]"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-mono text-[#98989D] mb-1">
                                  Arrival ETA *
                                </label>
                                <select
                                  value={bidEta}
                                  onChange={(e) => setBidEta(e.target.value)}
                                  className="w-full bg-[#141414] border border-[#2C2C2E] rounded-lg px-3 py-1.5 text-xs text-white"
                                >
                                  <option value="20 mins">Within 20 mins (Ready in mobile van)</option>
                                  <option value="35 mins">Within 35 mins</option>
                                  <option value="1 hour">Within 1 hour</option>
                                  <option value="Same Day (Afternoon)">Same Day (Afternoon shift)</option>
                                </select>
                              </div>
                            </div>

                            <input
                              type="text"
                              placeholder="Technician Diagnostic Note (e.g. Equipped with Haas puller & dial indicator)"
                              value={bidMessage}
                              onChange={(e) => setBidMessage(e.target.value)}
                              className="w-full bg-[#141414] border border-[#2C2C2E] rounded-lg px-3 py-1.5 text-xs text-white focus:border-[#00E5FF]"
                            />

                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setBiddingJobId(null)}
                                className="px-3 py-1.5 text-xs text-[#98989D]"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleQuickBid(job.id)}
                                disabled={submittingBid || !bidPrice}
                                className="bg-[#00E5FF] text-black font-extrabold text-xs px-5 py-2 rounded-lg cursor-pointer disabled:opacity-50"
                              >
                                {submittingBid ? 'Submitting Bid...' : 'CONFIRM & SUBMIT BID'}
                              </button>
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  })
                )}
              </div>
            )}

          </div>

        </div>

        {/* 4 COLUMNS: My Profile, PFP, Certifications & Past Works */}
        <div className="lg:col-span-4 space-y-4">
          
          <div className="bg-[#1E1E1E] border border-[#2C2C2E] rounded-2xl p-5 shadow-xl space-y-4">
            
            {/* PFP & Verification Header */}
            <div className="flex items-center gap-3.5 pb-4 border-b border-[#2C2C2E]">
              <img
                src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150'}
                alt=""
                className="w-14 h-14 rounded-2xl object-cover border-2 border-[#00E5FF] shadow-[0_0_12px_rgba(0,229,255,0.2)]"
              />
              <div className="min-w-0">
                <div className="font-bold text-sm text-white truncate">{currentUser?.name}</div>
                <div className="text-[11px] text-[#00E5FF] truncate">{currentUser?.mechanic_headline || 'Certified Technician'}</div>
                <div className="text-[10px] text-yellow-400 font-mono mt-0.5">
                  ⭐ {currentUser?.mechanic_rating || 4.9} &bull; Verified Tier 3
                </div>
              </div>
            </div>

            {/* Quick Edit Credentials Button */}
            <button
              onClick={onOpenEditProfile}
              className="w-full bg-[#141414] hover:bg-[#252525] border border-[#00E5FF]/40 text-[#00E5FF] text-xs font-bold py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Update PFP, Certs & Past Works</span>
            </button>

            {/* Summary details */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-[#98989D]">
                <span>Dispatch Status:</span>
                <span className="text-[#32D74B] font-bold">🟢 Available Now</span>
              </div>
              <div className="flex items-center justify-between text-[#98989D]">
                <span>Bench Hourly Rate:</span>
                <span className="text-white font-mono font-bold">₹750/hr</span>
              </div>
              <div className="flex items-center justify-between text-[#98989D]">
                <span>Service Radius:</span>
                <span className="text-white font-mono">35 km</span>
              </div>
            </div>

            {/* Past Works & Certs overview */}
            <div className="pt-3 border-t border-[#2C2C2E] space-y-2">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#98989D]">
                Verified Portfolio In Database
              </div>
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="bg-[#141414] border border-[#2C2C2E] p-2 rounded-xl">
                  <div className="text-lg font-mono font-bold text-[#00E5FF]">2</div>
                  <div className="text-[10px] text-[#98989D]">Certificates</div>
                </div>
                <div className="bg-[#141414] border border-[#2C2C2E] p-2 rounded-xl">
                  <div className="text-lg font-mono font-bold text-[#32D74B]">2</div>
                  <div className="text-[10px] text-[#98989D]">Case Studies</div>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

