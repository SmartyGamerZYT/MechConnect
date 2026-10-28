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
  MessageSquare
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
      <div className="space-y-5">

          {/* Top Banner */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div>
                <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span>{currentUser?.company_name || currentUser?.name}</span>
                    <span className="text-[11px] bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded font-mono font-medium">
                      Verified
                    </span>
                </h1>
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
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer"
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

                                    {/* 12-COLUMN GRID */}
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

                                      {/* 8 COLUMNS: Active Breakdown Jobs & History */}
                                      <div className="lg:col-span-8 space-y-4">
                                            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                                                <h3 className="font-bold text-slate-900 text-sm">Breakdowns & Bids</h3>

                                                  <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200 text-xs">
                                                    {['ALL', 'EMERGENCY', 'SAME_DAY', 'SCHEDULED'].map((u) => (
                                                      <button
                                                        key={u}
                                                        onClick={() => setFilterUrgency(u)}
                                                        className={`px-2.5 py-1 rounded text-xs transition cursor-pointer ${
                                                          filterUrgency === u
                                                            ? 'bg-white text-slate-900 font-semibold shadow-xs'
                                                            : 'text-slate-500 hover:text-slate-900'
                                                        }`}
                                                      >
                                                        {u}
                                                      </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {displayedJobs.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  No breakdown listings found.
                </div>
              ) : (
                displayedJobs.map((job) => {
                  const isEmerg = job.urgency === 'EMERGENCY';
                  const isDirect = job.hiring_mode === 'DIRECT';

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
                        </div>

                        <h4 className="font-semibold text-xs text-slate-900 truncate">{job.title}</h4>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span>{job.machine_category}</span>
                          <span>&bull;</span>
                          <span>Status: <b className="text-slate-800">{job.status}</b></span>
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

                                                            <div className="flex items-center gap-1">
                                                              <button
                                                                onClick={() => onOpenChat(job.id)}
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
                                                            </div>
                                                          </div>

                                                        </div>
                                                        );
                })
              )}
                                                      </div>

                                                    </div>
                                                  </div>

                                                  {/* 4 COLUMNS: Side Direct Hire Specialists */}
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
                                                                Direct Hire Technicians
                                                              </h3>

                                                                <div className="space-y-2">
                                                                  {mechanics.slice(0, 3).map((mech) => (
                                                                    <div
                                                                      key={mech.user_id}
                                                                      className="p-2.5 border border-slate-100 rounded-lg flex items-center justify-between gap-2 hover:border-slate-200"
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
