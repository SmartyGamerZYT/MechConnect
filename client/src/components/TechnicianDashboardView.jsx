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
  XCircle,
  FileText
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
  const [biddingJobId, setBiddingJobId] = useState(null);
  const [bidPrice, setBidPrice] = useState('');
  const [bidEta, setBidEta] = useState('25 mins');
  const [bidMessage, setBidMessage] = useState('');
  const [submittingBid, setSubmittingBid] = useState(false);
  const [bidError, setBidError] = useState(null);

  // Search & Filter & Sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUrgency, setFilterUrgency] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'budget_high', 'urgency'
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [analyticsData, setAnalyticsData] = useState(null);

  // Work completion modal state
  const [completingJobId, setCompletingJobId] = useState(null);
  const [completionParts, setCompletionParts] = useState('OEM Spindle Seals & High-Speed Synthetic Grease');
  const [completionSummary, setCompletionSummary] = useState('Replaced damaged seals, re-aligned spindle bearings, ran 8000 RPM vibration cycle within tolerance.');
  const [completionTime, setCompletionTime] = useState('2.5');
  const [completionPartsCost, setCompletionPartsCost] = useState('1800');
  const [submittingCompletion, setSubmittingCompletion] = useState(false);

  const isVerified = currentUser?.mechanic_is_verified === 1;

  // Fetch technician analytics
  useEffect(() => {
    if (currentUser?.id) {
      api.getAnalytics('mechanic', currentUser.id)
        .then(setAnalyticsData)
        .catch(console.error);
    }
  }, [currentUser]);

  // Open jobs available for bidding
  const openBiddingJobs = jobs.filter(j => j.status === 'OPEN' || j.status === 'MATCHED');

  // Jobs assigned to this technician
  const myAssignedJobs = jobs.filter(j => j.assigned_mechanic_user_id === currentUser?.id);
  const myActiveJobs = myAssignedJobs.filter(j => ['ASSIGNED', 'ON_THE_WAY', 'WORKING'].includes(j.status));
  const myCompletedJobs = myAssignedJobs.filter(j => j.status === 'COMPLETED');
  const totalEarnings = myCompletedJobs.reduce((acc, j) => acc + (j.agreed_price || 0), 0);

  // Filter & Sort open jobs
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
        const matchesCategory = job.machine_category?.toLowerCase().includes(q);
        const matchesCity = job.city?.toLowerCase().includes(q);
        const matchesAddress = job.address?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesBrand && !matchesModel && !matchesSerial && !matchesCategory && !matchesCity && !matchesAddress) {
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

  // Submit quick bid
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
        message: bidMessage || 'Diagnostic tooling and spare kits ready.'
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

  // Cancel bid
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

  // Status updates
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

  // Complete work order with receipt generation & auto profile update
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

      {/* Real-time Analytics Graphs */}
      {analyticsData && (
        <AnalyticsGraphs role="mechanic" data={analyticsData} />
      )}

      {/* 12-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* 8 COLUMNS: Active Work Orders & Bidding Feed */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Active Work Orders */}
          {myActiveJobs.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
                Active Assignments ({myActiveJobs.length})
              </h3>

              {myActiveJobs.map((j) => (
                <div key={j.id} className="p-3.5 border border-slate-100 rounded-lg space-y-2.5 bg-slate-50/50">
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
                        className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-md transition"
                      >
                        Chat
                      </button>
                      {j.status === 'ASSIGNED' && (
                        <button
                          onClick={() => handleAdvanceStatus(j.id, 'ON_THE_WAY')}
                          className="bg-slate-900 text-white text-xs font-semibold px-3 py-1 rounded-md transition"
                        >
                          Mark On The Way
                        </button>
                      )}
                      {j.status === 'ON_THE_WAY' && (
                        <button
                          onClick={() => handleAdvanceStatus(j.id, 'WORKING')}
                          className="bg-slate-900 text-white text-xs font-semibold px-3 py-1 rounded-md transition"
                        >
                          Mark Working
                        </button>
                      )}
                      {j.status === 'WORKING' && (
                        <button
                          onClick={() => setCompletingJobId(j.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1 rounded-md transition cursor-pointer"
                        >
                          Complete Work & Generate Receipt
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Work Completion Dialog */}
          {completingJobId && (
            <form onSubmit={handleCompleteWork} className="bg-white border-2 border-emerald-500 rounded-xl p-5 shadow-md space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Complete Work Order & Release Escrow</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setCompletingJobId(null)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[10px] font-medium text-slate-600 mb-1">Time Taken (Hours)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={completionTime}
                    onChange={(e) => setCompletionTime(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-slate-600 mb-1">Parts Cost (₹)</label>
                  <input
                    type="number"
                    value={completionPartsCost}
                    onChange={(e) => setCompletionPartsCost(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-medium text-slate-600 mb-1">Consumables & Parts Replaced</label>
                <input
                  type="text"
                  value={completionParts}
                  onChange={(e) => setCompletionParts(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-slate-600 mb-1">Diagnostic & Resolution Summary</label>
                <textarea
                  rows={2}
                  value={completionSummary}
                  onChange={(e) => setCompletionSummary(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded p-2 text-xs text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setCompletingJobId(null)}
                  className="px-3 py-1.5 text-xs text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCompletion}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-1.5 rounded-lg transition"
                >
                  {submittingCompletion ? 'Finalizing...' : 'Authorize Completion & Generate Receipt'}
                </button>
              </div>
            </form>
          )}

          {/* Open Bidding Feed */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            
            {/* Header & Map Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                Open Breakdown Listings ({processedOpenJobs.length})
              </h3>

              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                    viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>List</span>
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                    viewMode === 'map' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  <span>Map</span>
                </button>
              </div>
            </div>

            {/* Search & Filter & Sort Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
              <div className="sm:col-span-5 relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search machine, brand, model, city..."
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
                  <option value="budget_high">Sort: Highest Budget</option>
                  <option value="urgency">Sort: Emergency Priority</option>
                </select>
              </div>
            </div>

            {bidError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
                {bidError}
              </div>
            )}

            {/* View Mode: Map View vs List View */}
            {viewMode === 'map' ? (
              <div className="space-y-2 pt-2">
                <div className="text-xs text-slate-500 flex items-center justify-between">
                  <span>OpenStreetMap showing breakdown job locations open for bidding</span>
                  <span className="font-mono text-[10px]">{processedOpenJobs.length} works mapped</span>
                </div>
                <OpenStreetMapView
                  mode="jobs"
                  jobs={processedOpenJobs}
                  onSelectJob={onSelectJob}
                  height="450px"
                />
              </div>
            ) : (
              <div className="space-y-3">
                {processedOpenJobs.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400">
                    No breakdown listings match the current filters.
                  </div>
                ) : (
                  processedOpenJobs.map((job) => {
                    const isEmerg = job.urgency === 'EMERGENCY';
                    const isBiddingThis = biddingJobId === job.id;

                    return (
                      <div
                        key={job.id}
                        className="p-4 border border-slate-200 rounded-xl space-y-2.5 hover:border-slate-300 transition"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                                isEmerg ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {job.urgency}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">{job.id}</span>
                              <span className="text-xs font-semibold text-slate-800">{job.machine_category}</span>
                            </div>

                            <h4 className="font-semibold text-xs text-slate-900">{job.title}</h4>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span>{job.address}, {job.city}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-sm font-mono font-bold text-slate-900">
                              {job.budget_min ? `₹${job.budget_min.toLocaleString()} - ₹${job.budget_max?.toLocaleString()}` : 'Open'}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {job.proposals_count || 0} bids
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <button
                            onClick={() => onSelectJob(job.id)}
                            className="text-xs text-slate-600 hover:text-slate-900 underline cursor-pointer"
                          >
                            View Breakdown Details
                          </button>

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
                        </div>

                        {/* Inline Bid Form */}
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
                                  className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-900"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-medium text-slate-600 mb-1">
                                  ETA Arrival
                                </label>
                                <select
                                  value={bidEta}
                                  onChange={(e) => setBidEta(e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-900"
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
                              placeholder="Tooling or parts preparedness note (optional)"
                              value={bidMessage}
                              onChange={(e) => setBidMessage(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-900"
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
                                className="bg-slate-900 text-white text-xs font-semibold px-3.5 py-1 rounded-md disabled:opacity-50"
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
            )}

          </div>

        </div>

        {/* 4 COLUMNS: Technician Profile Card & Completed Orders */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <img
                src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100'}
                className="w-12 h-12 rounded-lg object-cover border border-slate-200"
              />
              <div className="min-w-0">
                <div className="font-bold text-xs text-slate-900 truncate">{currentUser?.name}</div>
                <div className="text-[11px] text-slate-500 font-mono">
                  Rating: 4.9 &bull; Verified Specialist
                </div>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Account Status:</span>
                <span className={`font-semibold ${isVerified ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {isVerified ? 'Active & Verified' : 'Awaiting Approval'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Completed Orders:</span>
                <span className="font-mono font-bold text-slate-900">{myCompletedJobs.length}</span>
              </div>
            </div>

            <button
              onClick={onOpenEditProfile}
              className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs py-2 rounded-lg transition cursor-pointer"
            >
              Update Certificates & Portfolio
            </button>
          </div>

          {/* Completed Orders with Receipt Action */}
          {myCompletedJobs.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2.5">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2">
                Completed Repairs ({myCompletedJobs.length})
              </h4>
              <div className="space-y-2">
                {myCompletedJobs.slice(0, 5).map((cj) => (
                  <div key={cj.id} className="p-2 border border-slate-100 rounded-lg flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-900 truncate max-w-[170px]">{cj.title}</div>
                      <div className="text-[10px] text-slate-500 font-mono">₹{cj.agreed_price?.toLocaleString()}</div>
                    </div>
                    {onOpenReceipt && (
                      <button
                        onClick={() => onOpenReceipt(cj.id)}
                        className="px-2 py-1 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3 h-3 text-slate-600" />
                        <span>Receipt</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
