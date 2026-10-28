import React, { useState, useEffect } from 'react';
import {
  Building2,
  PlusCircle,
  AlertTriangle,
  Clock,
  CheckCircle2,
  MapPin,
  TrendingUp,
  Cpu,
  ShieldCheck,
  MessageSquare,
  Search,
  Filter,
  ArrowUpDown,
  Trash2,
  Map as MapIcon,
  List,
  FileText
} from 'lucide-react';
import OpenStreetMapView from './OpenStreetMapView';
import AnalyticsGraphs from './AnalyticsGraphs';
import { api } from '../services/api';

export default function CompanyDashboardView({
  currentUser,
  jobs = [],
  mechanics = [],
  onOpenPostJob,
  onSelectJob,
  onOpenChat,
  onOpenProfile,
  onOpenReceipt,
  onRefreshData
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUrgency, setFilterUrgency] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'budget_high', 'budget_low', 'most_bids'
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [analyticsData, setAnalyticsData] = useState(null);
  const [deletingJobId, setDeletingJobId] = useState(null);

  // Fetch company analytics
  useEffect(() => {
    if (currentUser?.id) {
      api.getAnalytics('company', currentUser.id)
        .then(setAnalyticsData)
        .catch(console.error);
    }
  }, [currentUser]);

  // Filter jobs for this company
  const companyJobs = jobs.filter(j => j.company_user_id === currentUser?.id);
  const activeJobs = companyJobs.filter(j => ['OPEN', 'MATCHED', 'ASSIGNED', 'ON_THE_WAY', 'WORKING'].includes(j.status));
  const completedJobs = companyJobs.filter(j => j.status === 'COMPLETED');
  const emergencyJobs = companyJobs.filter(j => j.urgency === 'EMERGENCY' && j.status !== 'COMPLETED');
  const totalBidsReceived = companyJobs.reduce((acc, j) => acc + (j.proposals_count || 0), 0);

  // Search & Filter & Sort
  const processedJobs = companyJobs
    .filter((job) => {
      // Urgency filter
      if (filterUrgency !== 'ALL' && job.urgency !== filterUrgency) return false;
      // Category filter
      if (filterCategory !== 'ALL' && !job.machine_category.toLowerCase().includes(filterCategory.toLowerCase())) return false;
      // Search query (title, brand, model, serial_number, error_code, city)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = job.title?.toLowerCase().includes(q);
        const matchesBrand = job.machine_brand?.toLowerCase().includes(q);
        const matchesModel = job.machine_model?.toLowerCase().includes(q);
        const matchesSerial = job.serial_number?.toLowerCase().includes(q);
        const matchesError = job.error_code?.toLowerCase().includes(q);
        const matchesCity = job.city?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesBrand && !matchesModel && !matchesSerial && !matchesError && !matchesCity) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      if (sortBy === 'budget_high') return (b.budget_max || b.budget_min || 0) - (a.budget_max || a.budget_min || 0);
      if (sortBy === 'budget_low') return (a.budget_min || 0) - (b.budget_min || 0);
      if (sortBy === 'most_bids') return (b.proposals_count || 0) - (a.proposals_count || 0);
      return 0;
    });

  // Handle Delete Work
  const handleDeleteJob = async (jobId) => {
    if (!window.confirm(`Are you sure you want to cancel and delete breakdown listing ${jobId}?`)) {
      return;
    }
    setDeletingJobId(jobId);
    try {
      const res = await api.deleteJob(jobId, currentUser.id);
      if (res.success && onRefreshData) {
        onRefreshData();
      }
    } catch (err) {
      console.error('Delete job error:', err);
    } finally {
      setDeletingJobId(null);
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>{currentUser?.company_name || currentUser?.name}</span>
            <span className="text-[11px] bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded font-mono font-medium">
              Verified Plant
            </span>
          </h1>
          <div className="text-xs text-slate-500 mt-0.5">Facility Maintenance Portal</div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => onOpenProfile(currentUser.id)}
            className="bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 px-3.5 py-2 rounded-lg transition cursor-pointer"
          >
            Machinery
          </button>
          <button
            onClick={onOpenPostJob}
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>List Machine Breakdown</span>
          </button>
        </div>
      </div>

      {/* TOP 3 KPIS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium uppercase tracking-wider">Active Breakdowns</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
            {activeJobs.length}
          </div>
          <div className="text-[11px] text-red-600 font-medium mt-1">
            {emergencyJobs.length} Emergency Priority
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium uppercase tracking-wider">Bids Received</span>
            <TrendingUp className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
            {totalBidsReceived}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            Active technician quotes
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium uppercase tracking-wider">Restored Equipment</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
            {completedJobs.length}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            Completed repairs
          </div>
        </div>
      </div>

      {/* Real-time Analytics Graphs */}
      {analyticsData && (
        <AnalyticsGraphs role="company" data={analyticsData} />
      )}

      {/* 12-COLUMN MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* 8 COLUMNS: Breakdowns Feed & Controls */}
        <div className="lg:col-span-8 space-y-4">
          
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            
            {/* Control Bar: Title & View Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                Breakdowns & Active Listings ({processedJobs.length})
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
              
              {/* Search */}
              <div className="sm:col-span-5 relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search machine, model, serial, error..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>

              {/* Urgency Filter */}
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

              {/* Sort By */}
              <div className="sm:col-span-4">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                >
                  <option value="newest">Sort: Newest First</option>
                  <option value="budget_high">Sort: Budget (High to Low)</option>
                  <option value="budget_low">Sort: Budget (Low to High)</option>
                  <option value="most_bids">Sort: Most Bids Received</option>
                </select>
              </div>

            </div>

            {/* View Mode: Map View vs List View */}
            {viewMode === 'map' ? (
              <div className="space-y-2 pt-2">
                <div className="text-xs text-slate-500 flex items-center justify-between">
                  <span>Interactive OpenStreetMap showing certified field technicians nearby</span>
                  <span className="font-mono text-[10px]">{mechanics.length} specialists in area</span>
                </div>
                <OpenStreetMapView
                  mode="mechanics"
                  mechanics={mechanics}
                  onSelectMechanic={(mechId) => onOpenPostJob()}
                  height="450px"
                />
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {processedJobs.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400">
                    No breakdown listings match the current search and filter criteria.
                  </div>
                ) : (
                  processedJobs.map((job) => {
                    const isEmerg = job.urgency === 'EMERGENCY';
                    const isDirect = job.hiring_mode === 'DIRECT';
                    const isCompleted = job.status === 'COMPLETED';

                    return (
                      <div
                        key={job.id}
                        className="py-3.5 hover:bg-slate-50/70 transition rounded-lg px-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                              isEmerg
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              {job.urgency}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">{job.id}</span>
                            <span className="text-[10px] font-mono text-slate-500">
                              {isDirect ? 'Direct Hire' : 'Bidding'}
                            </span>
                            {job.serial_number && (
                              <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                                S/N: {job.serial_number}
                              </span>
                            )}
                          </div>

                          <h4 className="font-semibold text-xs text-slate-900 truncate">{job.title}</h4>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2">
                            <span>{job.machine_category}</span>
                            <span>&bull;</span>
                            <span>Status: <b className="text-slate-800 font-mono">{job.status}</b></span>
                            {job.assigned_mechanic_name && (
                              <>
                                <span>&bull;</span>
                                <span className="text-slate-700">Assigned: {job.assigned_mechanic_name}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          <div className="text-right">
                            <div className="font-mono font-bold text-slate-900 text-xs">
                              {job.agreed_price ? `₹${job.agreed_price.toLocaleString()}` : job.budget_min ? `₹${job.budget_min.toLocaleString()} - ₹${job.budget_max?.toLocaleString()}` : 'Open'}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {job.proposals_count || 0} bids
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Receipt Button if completed */}
                            {isCompleted && onOpenReceipt && (
                              <button
                                onClick={() => onOpenReceipt(job.id)}
                                title="View Completion Receipt / Invoice"
                                className="px-2 py-1 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                              >
                                <FileText className="w-3 h-3 text-emerald-700" />
                                <span>Receipt</span>
                              </button>
                            )}

                            <button
                              onClick={() => onOpenChat(job.id)}
                              title="Chat"
                              className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => onSelectJob(job.id)}
                              className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                            >
                              Details
                            </button>

                            {/* Delete Work Button (if not completed) */}
                            {!isCompleted && (
                              <button
                                onClick={() => handleDeleteJob(job.id)}
                                disabled={deletingJobId === job.id}
                                title="Delete / Cancel Listing"
                                className="w-7 h-7 rounded-lg border border-slate-200 hover:border-red-300 hover:bg-red-50 text-slate-400 hover:text-red-600 flex items-center justify-center transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>
            )}

          </div>
        </div>

        {/* 4 COLUMNS: Side Direct Hire Specialists Panel */}
        <div className="lg:col-span-4 space-y-4">
          
          {emergencyJobs.length > 0 && (
            <div className="bg-red-50 border-l-4 border-red-600 p-3.5 rounded-lg text-xs space-y-1">
              <div className="font-semibold text-red-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Emergency Ticket Active
              </div>
              <div className="text-red-700">
                {emergencyJobs.length} breakdown under emergency response protocol.
              </div>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-100 pb-2">
              Direct Hire Available Specialists
            </h3>

            <div className="space-y-2">
              {mechanics.slice(0, 4).map((mech) => (
                <div
                  key={mech.user_id}
                  className="p-2.5 border border-slate-100 rounded-lg flex items-center justify-between gap-2 hover:border-slate-200 transition"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-xs text-slate-900 truncate">{mech.full_name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Rating {mech.rating} &bull; ₹{mech.hourly_rate}/hr
                    </div>
                  </div>

                  <button
                    onClick={onOpenPostJob}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-[11px] px-2.5 py-1 rounded-md transition cursor-pointer"
                  >
                    Direct Hire
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
