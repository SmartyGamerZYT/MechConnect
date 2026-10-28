import React, { useState } from 'react';
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
  Wrench,
  DollarSign,
  ChevronRight,
  Filter,
  Users
} from 'lucide-react';

export default function CompanyDashboardView({
  currentUser,
  jobs = [],
  mechanics = [],
  onOpenPostJob,
  onSelectJob,
  onOpenChat,
  onOpenProfile
}) {
  const [filterUrgency, setFilterUrgency] = useState('ALL');

  // Filter jobs for this company
  const companyJobs = jobs.filter(j => j.company_user_id === currentUser?.id);
  const activeJobs = companyJobs.filter(j => ['OPEN', 'MATCHED', 'ASSIGNED', 'ON_THE_WAY', 'WORKING'].includes(j.status));
  const completedJobs = companyJobs.filter(j => j.status === 'COMPLETED');
  const emergencyJobs = companyJobs.filter(j => j.urgency === 'EMERGENCY' && j.status !== 'COMPLETED');

  // Count total proposals received across company jobs
  const totalBidsReceived = companyJobs.reduce((acc, j) => acc + (j.proposals_count || 0), 0);

  const displayedJobs = companyJobs.filter(j => {
    if (filterUrgency === 'ALL') return true;
    return j.urgency === filterUrgency;
  });

  return (
    <div className="space-y-6">
      
      {/* Portal Header */}
      <div className="bg-[#1E1E1E] border border-[#2C2C2E] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00E5FF] animate-pulse"></span>
            <span className="text-[10px] font-mono text-[#00E5FF] uppercase font-bold tracking-wider">
              INDUSTRIAL PLANT OPERATIONS PORTAL
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <span>{currentUser?.company_name || currentUser?.name}</span>
            <span className="text-xs bg-[#32D74B]/20 text-[#32D74B] border border-[#32D74B]/40 px-2 py-0.5 rounded font-mono font-bold">
              VERIFIED FACILITY
            </span>
          </h1>
          <p className="text-xs text-[#98989D]">
            Machine breakdown dispatching, competitive bidding management, and Urban-Company style direct hiring.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => onOpenProfile(currentUser.id)}
            className="bg-[#141414] hover:bg-[#252525] border border-[#2C2C2E] text-xs font-semibold text-white px-3.5 py-2.5 rounded-xl transition cursor-pointer"
          >
            Facility Equipment & Profile
          </button>
          <button
            onClick={onOpenPostJob}
            className="bg-[#00E5FF] hover:bg-[#00c5dc] text-black font-extrabold text-xs px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,229,255,0.3)] transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ LIST MACHINE BREAKDOWN</span>
          </button>
        </div>
      </div>

      {/* TOP 3 KPIS (WattVision 3-Column Layout: KPI, KPI, KPI) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* KPI 1: Active Breakdowns (WattVision Alert style if > 0) */}
        <div className="bg-[#1E1E1E] border border-[#FF453A]/40 rounded-2xl p-5 shadow-[0_0_15px_rgba(255,69,58,0.1)]">
          <div className="flex items-center justify-between text-xs text-[#98989D] mb-1">
            <span className="font-mono uppercase tracking-wider">Active Plant Breakdowns</span>
            <AlertTriangle className="w-4 h-4 text-[#FF453A]" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono tracking-tight">
            {activeJobs.length} <span className="text-xs text-[#98989D] font-normal">INCIDENTS</span>
          </div>
          <div className="text-[11px] text-[#FF453A] font-mono mt-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#FF453A] animate-ping"></span>
            {emergencyJobs.length} Emergency (&lt;1h SLA) tickets
          </div>
        </div>

        {/* KPI 2: Bids Received for Review */}
        <div className="bg-[#1E1E1E] border border-[#2C2C2E] rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-[#98989D] mb-1">
            <span className="font-mono uppercase tracking-wider">Technician Bids Submitted</span>
            <TrendingUp className="w-4 h-4 text-[#00E5FF]" />
          </div>
          <div className="text-3xl font-extrabold text-[#00E5FF] font-mono tracking-tight">
            {totalBidsReceived} <span className="text-xs text-[#98989D] font-normal">QUOTES</span>
          </div>
          <div className="text-[11px] text-[#98989D] font-mono mt-1">
            Across {companyJobs.filter(j => j.hiring_mode !== 'DIRECT').length} open bidding listings
          </div>
        </div>

        {/* KPI 3: Restored Machinery */}
        <div className="bg-[#1E1E1E] border border-[#2C2C2E] rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-[#98989D] mb-1">
            <span className="font-mono uppercase tracking-wider">Restored Equipment Fleet</span>
            <CheckCircle2 className="w-4 h-4 text-[#32D74B]" />
          </div>
          <div className="text-3xl font-extrabold text-[#32D74B] font-mono tracking-tight">
            {completedJobs.length} <span className="text-xs text-[#98989D] font-normal">MACHINES</span>
          </div>
          <div className="text-[11px] text-[#32D74B] font-mono mt-1">
            100% digital completion certification
          </div>
        </div>

      </div>

      {/* 12-COLUMN INDUSTRIAL GRID (8 Columns Main Table, 4 Columns Side Alerts & Direct Hire) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 8 COLUMNS: Active Breakdown Jobs & History */}
        <div className="lg:col-span-8 space-y-4">
          
          <div className="bg-[#1E1E1E] border border-[#2C2C2E] rounded-2xl p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#2C2C2E]">
              <div>
                <h3 className="font-bold text-white text-base">Facility Breakdown Tickets & Bids</h3>
                <p className="text-xs text-[#98989D]">Review technician bids, track en-route specialists, or lock deals</p>
              </div>

              {/* Urgency Filter */}
              <div className="flex items-center gap-1.5 bg-[#141414] p-1 rounded-xl border border-[#2C2C2E] text-xs">
                {['ALL', 'EMERGENCY', 'SAME_DAY', 'SCHEDULED'].map((u) => (
                  <button
                    key={u}
                    onClick={() => setFilterUrgency(u)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition cursor-pointer ${
                      filterUrgency === u
                        ? 'bg-[#00E5FF] text-black font-bold'
                        : 'text-[#98989D] hover:text-white'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            {/* Jobs List */}
            <div className="divide-y divide-[#2C2C2E] mt-2">
              {displayedJobs.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#98989D]">
                  No breakdown jobs found under this filter. Click "+ List Machine Breakdown" to post one.
                </div>
              ) : (
                displayedJobs.map((job) => {
                  const isEmerg = job.urgency === 'EMERGENCY';
                  const isDirect = job.hiring_mode === 'DIRECT';

                  return (
                    <div
                      key={job.id}
                      className="py-4 hover:bg-[#252525]/40 transition rounded-xl px-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            isEmerg
                              ? 'bg-[#FF453A]/20 text-[#FF453A] border border-[#FF453A]/40'
                              : 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40'
                          }`}>
                            {job.urgency}
                          </span>
                          <span className="text-[10px] font-mono text-[#98989D]">{job.id}</span>
                          <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase ${
                            isDirect ? 'bg-[#32D74B]/15 text-[#32D74B]' : 'bg-[#00E5FF]/15 text-[#00E5FF]'
                          }`}>
                            {isDirect ? '⚡ DIRECT HIRE' : '🤝 BIDDING'}
                          </span>
                        </div>

                        <h4 className="font-bold text-sm text-white truncate">{job.title}</h4>
                        <div className="text-xs text-[#98989D] flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="text-[#00E5FF]">{job.machine_category}</span>
                          {job.serial_number && <span>SN: {job.serial_number}</span>}
                          <span>Status: <b className="text-white font-mono">{job.status}</b></span>
                        </div>
                      </div>

                      {/* Right side stats & actions */}
                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <div className="text-right">
                          <div className="font-mono font-bold text-white text-sm">
                            {job.agreed_price ? `₹${job.agreed_price.toLocaleString()}` : job.budget_min ? `₹${job.budget_min.toLocaleString()} - ₹${job.budget_max?.toLocaleString()}` : 'Open'}
                          </div>
                          <div className="text-[10px] text-[#00E5FF] font-mono">
                            {job.proposals_count ? `${job.proposals_count} bids placed` : 'Awaiting bids'}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onOpenChat(job.id)}
                            className="w-8 h-8 rounded-lg bg-[#141414] hover:bg-[#252525] border border-[#2C2C2E] flex items-center justify-center text-[#00E5FF] transition cursor-pointer"
                            title="Open Chat & Negotiation"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onSelectJob(job.id)}
                            className="bg-[#00E5FF] hover:bg-[#00c5dc] text-black font-extrabold text-xs px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1"
                          >
                            Manage &rarr;
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>

        </div>

        {/* 4 COLUMNS: WattVision Alert Panel & Direct Urban-Company Hire */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* WattVision Alert Box Style */}
          {emergencyJobs.length > 0 && (
            <div className="bg-[#3A1C1C] border-l-4 border-[#FF453A] p-4 rounded-xl shadow-lg space-y-1.5">
              <div className="flex items-center gap-2 text-[#FF453A] font-bold text-xs font-mono uppercase">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>Production Line Breakdown Alert</span>
              </div>
              <p className="text-xs text-gray-200">
                You have {emergencyJobs.length} active emergency ticket(s) with &lt; 1 hr SLA broadcasted to verified technicians.
              </p>
            </div>
          )}

          {/* Urban Company Style Direct Hire Panel */}
          <div className="bg-[#1E1E1E] border border-[#2C2C2E] rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2C2C2E]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#32D74B] animate-pulse"></span>
                <h3 className="font-bold text-white text-sm">Direct Hire Specialists</h3>
              </div>
              <span className="text-[10px] bg-[#32D74B]/20 text-[#32D74B] px-1.5 py-0.2 rounded font-mono font-bold">
                1-CLICK
              </span>
            </div>

            <p className="text-xs text-[#98989D] leading-relaxed">
              Skip open bidding. Book a vetted, top-rated technician immediately with fixed pre-authorized diagnostic pricing.
            </p>

            <div className="space-y-2.5">
              {mechanics.slice(0, 3).map((mech) => (
                <div
                  key={mech.user_id}
                  className="bg-[#141414] border border-[#2C2C2E] p-3 rounded-xl flex items-center justify-between gap-2.5 hover:border-[#32D74B]/50 transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={mech.avatar_url || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100'}
                      alt=""
                      className="w-9 h-9 rounded-full object-cover border border-[#00E5FF]/40 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-white truncate">{mech.full_name}</div>
                      <div className="text-[10px] text-yellow-400 font-mono">
                        ⭐ {mech.rating} &bull; ₹{mech.hourly_rate}/hr
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={onOpenPostJob}
                    className="bg-[#32D74B] hover:bg-[#2cb242] text-black font-extrabold text-[11px] px-2.5 py-1 rounded-lg transition cursor-pointer flex-shrink-0"
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

