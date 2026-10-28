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
  Send,
  Lock
} from 'lucide-react';
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
  const [bidError, setBidError] = useState(null);

  const isVerified = currentUser?.mechanic_is_verified === 1;

  // Open jobs available for bidding
  const openBiddingJobs = jobs.filter(j => j.status === 'OPEN' || j.status === 'MATCHED');

  // Jobs assigned to this technician
  const myAssignedJobs = jobs.filter(j => j.assigned_mechanic_user_id === currentUser?.id);
  const myActiveJobs = myAssignedJobs.filter(j => ['ASSIGNED', 'ON_THE_WAY', 'WORKING'].includes(j.status));
  const myCompletedJobs = myAssignedJobs.filter(j => j.status === 'COMPLETED');

  // Total earnings
  const totalEarnings = myCompletedJobs.reduce((acc, j) => acc + (j.agreed_price || 0), 0);

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
        message: bidMessage || 'Diagnostic tooling ready.'
        });
      if(res.error) {
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
                        <span className={`text-[11px] font-mono px-2 py-0.5 rounded font-medium border ${isVerified ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                          {isVerified ? 'Verified Technician' : 'Pending Verification'}
                        </span>
                    </h1>
                  </div>

                  <button
                    onClick={onOpenEditProfile}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Edit Credentials</span>
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
                              Available jobs
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
                                      In progress
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
                                              {myCompletedJobs.length} completed jobs
                                            </div>
                                          </div>

                                        </div>

                                          {/* 12-COLUMN GRID */}
                                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

                                              {/* 8 COLUMNS: Open Bidding Feed & Active Work Orders */}
                                              <div className="lg:col-span-8 space-y-4">

                                                {/* Active Work Orders */}
                                                {myActiveJobs.length > 0 && (
                                                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
                                                      <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
                                                        Active Assignments ({myActiveJobs.length})
                                                      </h3>

                                                      {myActiveJobs.map((j) => (
                                                          <div key={j.id} className="p-3 border border-slate-100 rounded-lg space-y-2">
                                                            <div className="flex items-center justify-between">
                                                              <div>
                                                                <h4 className="font-semibold text-xs text-slate-900">{j.title}</h4>
                                                                <div className="text-[11px] text-slate-500">{j.company_name} &bull; {j.address}</div>
                                                              </div>
                                                                <div className="font-mono font-bold text-slate-900 text-xs">
                                                                  ₹{j.agreed_price?.toLocaleString()}
                                                                </div>
                                                              </div>

                                                                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                                                    <span className="text-[11px] text-slate-500">Status: <b className="text-slate-800 font-mono">{j.status}</b></span>
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
                                                                          className="bg-slate-900 text-white text-xs font-semibold px-3 py-1 rounded-md"
                                                                        >
                                                                          Mark On The Way
                                                                        </button>
                                                                      )}
                                                                      {j.status === 'ON_THE_WAY' && (
                                                                        <button
                                                                          onClick={() => handleAdvanceStatus(j.id, 'WORKING')}
                                                                          className="bg-slate-900 text-white text-xs font-semibold px-3 py-1 rounded-md"
                                                                        >
                                                                          Mark Working
                                                                        </button>
                                                                      )}
                                                                      {j.status === 'WORKING' && (
                                                                        <button
                                                                          onClick={() => onSelectJob(j.id)}
                                                                          className="bg-emerald-600 text-white text-xs font-semibold px-3 py-1 rounded-md"
                                                                        >
                                                                          Complete
                                                                        </button>
                                                                      )}
                                                                    </div>
                                                                  </div>
                                                                </div>
              ))}
                                                              </div>
          )}

                                                                  {/* Open Bidding Feed */}
                                                                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                                                                    <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">
                                                                      Open Breakdown Listings
                                                                    </h3>

                                                                      {bidError && (
                                                                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
                                                                          {bidError}
                                                                        </div>
            )}

                                                                            <div className="space-y-3">
                                                                              {openBiddingJobs.length === 0 ? (
                                                                                <div className="py-10 text-center text-xs text-slate-400">
                                                                                  No breakdown listings currently open for bidding.
                                                                                </div>
                                                                              ) : (
                                                                                openBiddingJobs.map((job) => {
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
                                                                                                  <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${isEmerg ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-slate-100 text-slate-700'
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
                                                                                                        View Details
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
                                                                                                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer ${!isVerified
                                                                                                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                                                                              : isBiddingThis
                                                                                                                ? 'bg-slate-200 text-slate-800'
                                                                                                                : 'bg-slate-900 hover:bg-slate-800 text-white'
                                                                                                            }`}
                                                                                                        >
                                                                                                          {!isVerified ? 'Verification Required' : isBiddingThis ? 'Cancel' : 'Submit Bid'}
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
                                                                                                                  ETA
                                                                                                                </label>
                                                                                                                <select
                                                                                                                  value={bidEta}
                                                                                                                  onChange={(e) => setBidEta(e.target.value)}
                                                                                                                  className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-900"
                                                                                                                >
                                                                                                                <option value="20 mins">Within 20 mins</option>
                                                                                                                <option value="35 mins">Within 35 mins</option>
                                                                                                                <option value="1 hour">Within 1 hour</option>
                                                                                                              </select>
                                                                                                            </div>
                                                                                                          </div>

                                                                                                    <input
                                                                                                      type="text"
                                                                                                      placeholder="Note (optional)"
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
                                                                                          </div>

                                                                                        </div>

                                                                                        {/* 4 COLUMNS: Technician Profile Card */}
                                                                                        <div className="lg:col-span-4 space-y-4">
                                                                                              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
                                                                                                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                                                                                                  <img
                                                                                                    src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100'}
                                                                                                    alt=""
                                                                                                    className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                                                                                                  />
                                                                                                  <div className="min-w-0">
                                                                                                      <div className="font-bold text-xs text-slate-900 truncate">{currentUser?.name}</div>
                                                                                                      <div className="text-[11px] text-slate-500 truncate">{currentUser?.mechanic_headline || 'Technician'}</div>
                                                                                                      <div className="text-[10px] text-slate-600 font-mono mt-0.5">
                                                                                                        Rating {currentUser?.mechanic_rating || 4.9}
                                                                                                      </div>
                                                                                                    </div>
                                                                                                  </div>

                                                                                                  <button
                                                                                                    onClick={onOpenEditProfile}
                                                                                                    className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold py-2 rounded-lg transition cursor-pointer"
                                                                                                  >
                                                                                                    Update Credentials
                                                                                                  </button>

                                                                                                      <div className="space-y-1.5 text-xs pt-1">
                                                                                                        <div className="flex items-center justify-between text-slate-500">
                                                                                                          <span>Verification:</span>
                                                                                                          <span className={`font-semibold ${isVerified ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                                                                            {isVerified ? 'Verified' : 'Pending Admin'}
                                                                                                          </span>
                                                                                                        </div>
                                                                                                          <div className="flex items-center justify-between text-slate-500">
                                                                                                            <span>Bench Rate:</span>
                                                                                                            <span className="text-slate-900 font-mono font-medium">₹750/hr</span>
                                                                                                          </div>
                                                                                                        </div>
                                                                                                      </div>
                                                                                                    </div>

                                                                                                  </div>

                                                                                                </div>
                                                                                                );
}
