import React, { useState, useEffect } from 'react';
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
  Send,
  Lock,
  Search,
  Filter,
  ArrowUpDown,
  Map as MapIcon,
  List,
  FileText,
  LineChart,
  Layers
} from 'lucide-react';
import OpenStreetMapView from './OpenStreetMapView';
import AnalyticsGraphs from './AnalyticsGraphs';
import { api } from '../services/api';

export default function TechnicianDashboardView({
  currentUser,
  jobs = [],
  onSelectJob,
  onOpenChat,
  onOpenEditProfile,
  onOpenReceipt,
  onRefreshData
}) {
  const [activeTab, setActiveTab] = useState('work'); // 'work' or 'analysis'
  const [biddingJobId, setBiddingJobId] = useState(null);
  const [bidPrice, setBidPrice] = useState('');
  const [bidEta, setBidEta] = useState('25 mins');
  const [bidMessage, setBidMessage] = useState('');
  const [submittingBid, setSubmittingBid] = useState(false);
  const [bidError, setBidError] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUrgency, setFilterUrgency] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [analyticsData, setAnalyticsData] = useState(null);

  // Claim Direct Hire Job
  const handleClaimDirectJob = async (job) => {
    if (!isVerified) {
      setBidError('Your account is awaiting admin verification. You cannot claim jobs until approved.');
      return;
    }
    const fixedRate = job.budget_min || job.budget_max || 5000;
    if (!window.confirm(`Claim Direct Hire work order for "${job.title}" at fixed rate ₹${fixedRate.toLocaleString()}? You will be assigned immediately.`)) {
      return;
    }

    setSubmittingBid(true);
    setBidError(null);
    try {
      const res = await api.applyToJob(job.id, {
        mechanic_user_id: currentUser.id,
        proposed_price: fixedRate,
        estimated_arrival: '25 mins',
        message: 'Direct hire accepted. Rapid dispatch initialized.'
      });
      if (res.error) {
        setBidError(res.error);
      } else {
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      setBidError('Failed to claim direct hire job: ' + err.message);
    } finally {
      setSubmittingBid(false);
    }
  };

  // Completion modal state
  const [completingJobId, setCompletingJobId] = useState(null);
  const [completionParts, setCompletionParts] = useState('OEM Spindle Seals & High-Speed Synthetic Grease');
  const [completionSummary, setCompletionSummary] = useState('Replaced damaged seals, re-aligned spindle bearings, tested vibration.');
  const [completionTime, setCompletionTime] = useState('2.5');
  const [completionPartsCost, setCompletionPartsCost] = useState('1800');
  const [submittingCompletion, setSubmittingCompletion] = useState(false);

  const isVerified = currentUser?.mechanic_is_verified === 1;

  useEffect(() => {
    if (currentUser?.id) {
      api.getAnalytics('mechanic', currentUser.id)
        .then(setAnalyticsData)
        .catch(console.error);
    }
  }, [currentUser]);

  // Open jobs available for bidding
  const openBiddingJobs = jobs.filter(j => j.status === 'OPEN' || j.status === 'MATCHED');
  const myAssignedJobs = jobs.filter(j => j.assigned_mechanic_user_id === currentUser?.id);
  const myActiveJobs = myAssignedJobs.filter(j => ['ASSIGNED', 'ON_THE_WAY', 'WORKING'].includes(j.status));
  const myCompletedJobs = myAssignedJobs.filter(j => j.status === 'COMPLETED');
  const totalEarnings = myCompletedJobs.reduce((acc, j) => acc + (j.agreed_price || 0), 0);

  // Filter & Sort
  const processedOpenJobs = openBiddingJobs
    .filter((job) => {
      if (filterUrgency !== 'ALL' && job.urgency !== filterUrgency) return false;
      if (filterCategory !== 'ALL' && !job.machine_category.toLowerCase().includes(filterCategory.toLowerCase())) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = job.title?.toLowerCase().includes(q);
        const matchesBrand = job.machine_brand?.toLowerCase().includes(q);
        const matchesModel = job.machine_model?.toLowerCase().includes(q);
        const matchesSerial = job.serial_number?.toLowerCase().includes(q);
        const matchesCity = job.city?.toLowerCase().includes(q);
        const matchesAddress = job.address?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesBrand && !matchesModel && !matchesSerial && !matchesCity && !matchesAddress) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'budget_high') return (b.budget_max || b.budget_min || 0) - (a.budget_max || a.budget_min || 0);
      if (sortBy === 'urgency') {
        const rank = { EMERGENCY: 3, SAME_DAY: 2, SCHEDULED: 1 };
        return (rank[b.urgency] || 0) - (rank[a.urgency] || 0);
      }
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

  const handleQuickBid = async (jobId) => {
    if (!bidPrice) return;
    if (!isVerified) {
      setBidError('Your account is awaiting admin verification. You cannot submit bids until approved.');
      return;
    }

    setSubmittingBid(true);
    setBidError(null);
    try {
      const res = await api.applyToJob(jobId, {
        mechanic_user_id: currentUser.id,
        proposed_price: parseFloat(bidPrice),
        estimated_arrival: bidEta,
        message: bidMessage || 'Diagnostic tooling ready.'
      });
      if (res.error) {
        setBidError(res.error);
      } else {
        setBiddingJobId(null);
        setBidPrice('');
        setBidMessage('');
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      setBidError('Bid submission failed');
    } finally {
      setSubmittingBid(false);
    }
  };

  const handleCancelBid = async (jobId, proposalId) => {
    if (!window.confirm('Are you sure you want to withdraw your bid on this work order?')) {
      return;
    }
    try {
      const res = await api.cancelBid(jobId, proposalId, currentUser.id);
      if (res.success && onRefreshData) {
        onRefreshData();
      }
    } catch (err) {
      console.error('Cancel bid error:', err);
    }
  };

  const handleAdvanceStatus = async (jobId, nextStatus) => {
    try {
      await api.updateJobStatus(jobId, {
        status: nextStatus,
        user_id: currentUser.id,
        note: `Status updated to ${nextStatus}`
      });
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteWork = async (e) => {
    e.preventDefault();
    if (!completingJobId) return;
    setSubmittingCompletion(true);
    try {
      const res = await api.completeJob(completingJobId, {
        user_id: currentUser.id,
        parts_used: completionParts,
        work_summary: completionSummary,
        time_taken_hours: parseFloat(completionTime) || 2.5,
        parts_cost: parseFloat(completionPartsCost) || 0
      });

      if (res.success) {
        setCompletingJobId(null);
        if (onRefreshData) onRefreshData();
        if (res.receipt && onOpenReceipt) {
          onOpenReceipt(completingJobId);
        }
      }
    } catch (err) {
      console.error('Completion error:', err);
    } finally {
      setSubmittingCompletion(false);
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Verification Pending Banner */}
      {!isVerified && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center justify-between text-xs text-amber-800">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span className="font-semibold">
              Account Verification Pending: Admin must verify your credentials before you can bid or apply for jobs.
            </span>
          </div>
          <button
            onClick={onOpenEditProfile}
            className="bg-amber-600 hover:bg-amber-700 text-white font-medium px-3 py-1.5 rounded-lg transition cursor-pointer"
          >
            Upload Certificates
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>{currentUser?.name}</span>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded font-medium border ${
              isVerified ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {isVerified ? 'Verified Specialist' : 'Pending Verification'}
            </span>
          </h1>
          <div className="text-xs text-slate-500 mt-0.5">Field Dispatch Dashboard</div>
        </div>

        <button
          onClick={onOpenEditProfile}
          className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5"
        >
          <Award className="w-3.5 h-3.5" />
          <span>Edit Credentials & Certificates</span>
        </button>
      </div>

      {/* Navigation Sub-Menu: Work Orders vs Analysis */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('work')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeTab === 'work'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Available Work & Map</span>
        </button>

        <button
          onClick={() => setActiveTab('analysis')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeTab === 'analysis'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <LineChart className="w-3.5 h-3.5" />
          <span>Analysis</span>
        </button>
      </div>

      {/* TOP 3 KPIS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium uppercase tracking-wider">Open for Bidding</span>
            <TrendingUp className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
            {openBiddingJobs.length}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            Available jobs nearby
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium uppercase tracking-wider">Active Work Orders</span>
            <Wrench className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
            {myActiveJobs.length}
          </div>
          <div className="text-[11px] text-amber-600 font-medium mt-1">
            In progress / Assigned
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium uppercase tracking-wider">Total Payouts</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
            ₹{totalEarnings.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            {myCompletedJobs.length} completed work orders
          </div>
        </div>
      </div>

      {/* TAB 1: WORK - SIDE BY SIDE LAYOUT (MAP ON LEFT, LIST ON RIGHT) */}
      {activeTab === 'work' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* LEFT SIDE: MAP SHOWING AVAILABLE BREAKDOWN WORKS */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3 sticky top-20">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-700" />
                Work Locations Map
              </span>
              <span className="text-[10px] font-mono text-slate-500">{processedOpenJobs.length} jobs pinned</span>
            </div>

            <OpenStreetMapView
              mode="jobs"
              jobs={processedOpenJobs}
              onSelectJob={onSelectJob}
              height="530px"
              showLocateMe={true}
            />
          </div>

          {/* RIGHT SIDE: ACTIVE ASSIGNMENTS & OPEN BREAKDOWN LISTINGS */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Active Assignments */}
            {myActiveJobs.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
                  Active Assignments ({myActiveJobs.length})
                </h3>

                {myActiveJobs.map((j) => (
                  <div key={j.id} className="p-3 border border-slate-100 rounded-lg space-y-2 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-xs text-slate-900">{j.title}</h4>
                        <div className="text-[11px] text-slate-500">{j.company_name} &bull; {j.address}</div>
                      </div>
                      <div className="font-mono font-bold text-slate-900 text-xs">
                        ₹{j.agreed_price?.toLocaleString()}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">
                        Status: <b className="text-slate-900 font-mono">{j.status}</b>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onOpenChat(j.id)}
                          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium px-2.5 py-1 rounded transition"
                        >
                          Chat
                        </button>
                        {j.status === 'ASSIGNED' && (
                          <button
                            onClick={() => handleAdvanceStatus(j.id, 'ON_THE_WAY')}
                            className="bg-slate-900 text-white text-xs font-semibold px-2.5 py-1 rounded"
                          >
                            Mark On The Way
                          </button>
                        )}
                        {j.status === 'ON_THE_WAY' && (
                          <button
                            onClick={() => handleAdvanceStatus(j.id, 'WORKING')}
                            className="bg-slate-900 text-white text-xs font-semibold px-2.5 py-1 rounded"
                          >
                            Mark Working
                          </button>
                        )}
                        {j.status === 'WORKING' && (
                          <button
                            onClick={() => setCompletingJobId(j.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1 rounded cursor-pointer"
                          >
                            Complete Work & Invoice
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Completion Dialog */}
            {completingJobId && (
              <form onSubmit={handleCompleteWork} className="bg-white border-2 border-emerald-500 rounded-xl p-4 shadow-md space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Complete Work Order & Release Escrow</span>
                  </h4>
                  <button type="button" onClick={() => setCompletingJobId(null)} className="text-slate-400">Cancel</button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 mb-1">Time (Hours)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={completionTime}
                      onChange={(e) => setCompletionTime(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 mb-1">Parts Cost (₹)</label>
                    <input
                      type="number"
                      value={completionPartsCost}
                      onChange={(e) => setCompletionPartsCost(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-slate-600 mb-1">Parts Used</label>
                  <input
                    type="text"
                    value={completionParts}
                    onChange={(e) => setCompletionParts(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-slate-600 mb-1">Work Summary</label>
                  <textarea
                    rows={2}
                    value={completionSummary}
                    onChange={(e) => setCompletionSummary(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded p-2 text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" onClick={() => setCompletingJobId(null)} className="px-2.5 py-1 text-xs text-slate-600">Cancel</button>
                  <button type="submit" disabled={submittingCompletion} className="bg-emerald-600 text-white font-semibold text-xs px-3.5 py-1 rounded">
                    {submittingCompletion ? 'Finalizing...' : 'Authorize Completion'}
                  </button>
                </div>
              </form>
            )}

            {/* Open Breakdown Listings */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">
                  Open Breakdown Listings ({processedOpenJobs.length})
                </h3>
              </div>

              {/* Search, Filter & Sort */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                <div className="sm:col-span-5 relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search brand, model, city..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div className="sm:col-span-3">
                  <select
                    value={filterUrgency}
                    onChange={(e) => setFilterUrgency(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                  >
                    <option value="ALL">All Urgency</option>
                    <option value="EMERGENCY">Emergency</option>
                    <option value="SAME_DAY">Same Day</option>
                    <option value="SCHEDULED">Scheduled</option>
                  </select>
                </div>

                <div className="sm:col-span-4">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                  >
                    <option value="newest">Sort: Newest First</option>
                    <option value="budget_high">Highest Budget</option>
                    <option value="urgency">Emergency Priority</option>
                  </select>
                </div>
              </div>

              {bidError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
                  {bidError}
                </div>
              )}

              {/* Listings */}
              <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                {processedOpenJobs.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No breakdown listings match current filters.
                  </div>
                ) : (
                  processedOpenJobs.map((job) => {
                    const isEmerg = job.urgency === 'EMERGENCY';
                    const isBiddingThis = biddingJobId === job.id;

                    return (
                      <div
                        key={job.id}
                        className="p-3.5 border border-slate-200 rounded-xl space-y-2 hover:border-slate-300 transition"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded ${
                                isEmerg ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {job.urgency}
                              </span>
                              {job.hiring_mode === 'DIRECT' && (
                                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  DIRECT HIRE
                                </span>
                              )}
                              <span className="text-[10px] font-mono text-slate-400">{job.id}</span>
                              <span className="text-xs font-semibold text-slate-800">{job.machine_category}</span>
                            </div>

                            <h4 className="font-semibold text-xs text-slate-900">{job.title}</h4>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span>{job.address}, {job.city}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-xs font-mono font-bold text-slate-900">
                              {job.budget_min ? `₹${job.budget_min.toLocaleString()} - ₹${job.budget_max?.toLocaleString()}` : 'Open'}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {job.hiring_mode === 'DIRECT' ? 'Instant Grab' : `${job.proposals_count || 0} bids`}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <button
                            onClick={() => onSelectJob(job.id)}
                            className="text-xs text-slate-600 hover:text-slate-900 underline cursor-pointer"
                          >
                            View Details
                          </button>

                          {job.hiring_mode === 'DIRECT' ? (
                            <button
                              onClick={() => handleClaimDirectJob(job)}
                              disabled={!isVerified || submittingBid}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Claim Direct Work (₹{job.budget_min ? job.budget_min.toLocaleString() : 'Fixed'})</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                if (!isVerified) {
                                  setBidError('Your account is awaiting admin verification. You cannot submit bids until approved.');
                                  return;
                                }
                                setBiddingJobId(isBiddingThis ? null : job.id);
                              }}
                              disabled={!isVerified}
                              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer ${
                                !isVerified
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                  : isBiddingThis
                                  ? 'bg-slate-200 text-slate-800'
                                  : 'bg-slate-900 hover:bg-slate-800 text-white'
                              }`}
                            >
                              {!isVerified ? 'Verification Required' : isBiddingThis ? 'Close Bid' : 'Submit Bid'}
                            </button>
                          )}
                        </div>

                        {/* Inline Quick Bid Form */}
                        {isBiddingThis && isVerified && (
                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2 mt-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-medium text-slate-600 mb-1">
                                  Proposed Price (₹)
                                </label>
                                <input
                                  type="number"
                                  placeholder="e.g. 7500"
                                  value={bidPrice}
                                  onChange={(e) => setBidPrice(e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-900"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-medium text-slate-600 mb-1">
                                  ETA Arrival
                                </label>
                                <select
                                  value={bidEta}
                                  onChange={(e) => setBidEta(e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-900"
                                >
                                  <option value="20 mins">Within 20 mins</option>
                                  <option value="35 mins">Within 35 mins</option>
                                  <option value="1 hour">Within 1 hour</option>
                                  <option value="2 hours">Within 2 hours</option>
                                </select>
                              </div>
                            </div>

                            <input
                              type="text"
                              placeholder="Tooling or preparedness note (optional)"
                              value={bidMessage}
                              onChange={(e) => setBidMessage(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-900"
                            />

                            <div className="flex justify-end gap-1.5 pt-1">
                              <button
                                onClick={() => setBiddingJobId(null)}
                                className="px-2.5 py-1 text-xs text-slate-600"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleQuickBid(job.id)}
                                disabled={submittingBid || !bidPrice}
                                className="bg-slate-900 text-white text-xs font-semibold px-3 py-1 rounded disabled:opacity-50"
                              >
                                {submittingBid ? 'Submitting...' : 'Confirm Bid'}
                              </button>
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

        </div>
      ) : (
        /* TAB 2: ANALYSIS MENU - DEDICATED GRAPHS VIEW WITH LINE CHARTS */
        <div className="space-y-4">
          <AnalyticsGraphs role="mechanic" data={analyticsData} />
        </div>
      )}

    </div>
  );
}
