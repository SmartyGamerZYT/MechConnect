import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  Clock,
  MapPin,
  DollarSign,
  User,
  Wrench,
  CheckCircle2,
  Send,
  MessageSquare,
  Shield,
  FileText,
  Star,
  ChevronRight,
  TrendingUp,
  Image as ImageIcon
} from 'lucide-react';
import { api } from '../services/api';

export default function JobDetailsModal({
  jobId,
  isOpen,
  onClose,
  currentUser,
  onOpenChat,
  onRefreshData
}) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(null);

  // Proposal form state
  const [proposedPrice, setProposedPrice] = useState('');
  const [arrivalEta, setArrivalEta] = useState('30 mins');
  const [proposalMsg, setProposalMsg] = useState('');
  const [submittingProposal, setSubmittingProposal] = useState(false);

  // Counter offer state
  const [counterPrice, setCounterPrice] = useState('');
  const [counterTargetProposalId, setCounterTargetProposalId] = useState(null);

  // Status update state
  const [workSummary, setWorkSummary] = useState('');
  const [partsUsed, setPartsUsed] = useState('');
  const [timeTakenHours, setTimeTakenHours] = useState('2.5');

  // Review state
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const isCompany = currentUser?.role === 'company';
  const isMechanic = currentUser?.role === 'mechanic';
  const isAdmin = currentUser?.role === 'admin';

  const fetchDetails = async () => {
    if (!jobId) return;
    setLoading(true);
    try {
      const data = await api.getJobDetails(jobId);
      setDetails(data);
      if (data.job?.images?.length) {
        setActivePhoto(data.job.images[0]);
      }
    } catch (err) {
      console.error('Error fetching job details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && jobId) {
      fetchDetails();
    }
  }, [isOpen, jobId]);

  if (!isOpen) return null;

  const job = details?.job;
  const proposals = details?.proposals || [];
  const history = details?.history || [];
  const quoteCard = details?.quoteCard;
  const review = details?.review;

  const isUrgent = job?.urgency === 'EMERGENCY';
  const isAssigned = ['ASSIGNED', 'ON_THE_WAY', 'WORKING', 'COMPLETED'].includes(job?.status);
  const isCompleted = job?.status === 'COMPLETED';

  // Apply to Job
  const handleApply = async (e) => {
    e.preventDefault();
    if (!proposedPrice) return;
    setSubmittingProposal(true);
    try {
      await api.applyToJob(job.id, {
        mechanic_user_id: currentUser.id,
        proposed_price: parseFloat(proposedPrice),
        estimated_arrival: arrivalEta,
        message: proposalMsg
      });
      fetchDetails();
      if (onRefreshData) onRefreshData();
      setProposedPrice('');
      setProposalMsg('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingProposal(false);
    }
  };

  // Accept Proposal
  const handleAcceptProposal = async (proposalId) => {
    try {
      await api.acceptProposal(job.id, proposalId, currentUser.id);
      fetchDetails();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Counter Offer
  const handleSendCounter = async (proposalId) => {
    if (!counterPrice) return;
    try {
      await api.counterProposal(job.id, proposalId, {
        counter_price: parseFloat(counterPrice),
        counter_by: currentUser.role,
        user_id: currentUser.id,
        note: `Proposed ₹${counterPrice} counter-offer.`
      });
      setCounterTargetProposalId(null);
      setCounterPrice('');
      fetchDetails();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  // Progress Job Status
  const handleStatusChange = async (nextStatus) => {
    try {
      await api.updateJobStatus(job.id, {
        status: nextStatus,
        user_id: currentUser.id,
        parts_used: partsUsed,
        work_summary: workSummary,
        time_taken_hours: timeTakenHours,
        note: `Job status transitioned to ${nextStatus}`
      });
      fetchDetails();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      await api.submitReview({
        job_id: job.id,
        company_user_id: currentUser.id,
        mechanic_user_id: job.assigned_mechanic_user_id,
        rating,
        punctuality_rating: rating,
        quality_rating: rating,
        communication_rating: rating,
        review_text: reviewText
      });
      fetchDetails();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#1E1E1E] border border-[#2C2C2E] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl relative my-auto">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#2C2C2E] flex items-center justify-between bg-[#181818] flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md ${
              isUrgent
                ? 'bg-[#FF453A]/20 text-[#FF453A] border border-[#FF453A]/40'
                : job?.urgency === 'SAME_DAY'
                ? 'bg-[#FF9F0A]/20 text-[#FF9F0A] border border-[#FF9F0A]/40'
                : 'bg-[#32D74B]/20 text-[#32D74B] border border-[#32D74B]/40'
            }`}>
              {job?.urgency} PROTOCOL
            </span>
            <span className="text-xs font-mono text-[#98989D]">{job?.id}</span>
            <span className="text-xs text-[#00E5FF] bg-[#00E5FF]/10 px-2 py-0.5 rounded border border-[#00E5FF]/30 font-mono">
              Status: {job?.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenChat(job.id)}
              className="bg-[#00E5FF] hover:bg-[#00c5dc] text-black font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow transition cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Live Job Chat</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-[#252525] hover:bg-[#303030] text-[#98989D] hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {loading ? (
          <div className="p-12 text-center text-[#98989D] font-mono text-sm">
            Loading breakdown telemetry and proposals...
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            
            {/* Title & Core Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white mb-1.5">{job?.title}</h2>
                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-[#98989D]">
                    <span className="text-[#00E5FF] font-semibold">{job?.machine_category}</span>
                    <span>Brand: <b className="text-white">{job?.machine_brand || 'Industrial Spec'}</b></span>
                    <span>Model: <b className="text-white">{job?.machine_model || 'Standard'}</b></span>
                  </div>
                </div>

                {/* Fault Description Box */}
                <div className="bg-[#141414] border border-[#2C2C2E] rounded-xl p-4">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#98989D] mb-1.5 flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3 text-[#FF453A]" />
                    Fault Telemetry & Failure Mode
                  </div>
                  <p className="text-xs sm:text-sm text-gray-200 leading-relaxed">
                    {job?.fault_description}
                  </p>
                </div>

                {/* Attached Breakdown Photos */}
                {job?.images?.length > 0 && (
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-[#98989D] mb-2 flex items-center gap-1.5">
                      <ImageIcon className="w-3 h-3 text-[#00E5FF]" />
                      Verified Incident Photos ({job.images.length})
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {job.images.map((imgUrl, i) => (
                        <div
                          key={i}
                          onClick={() => setActivePhoto(imgUrl)}
                          className={`relative h-24 rounded-lg overflow-hidden border cursor-pointer group ${
                            activePhoto === imgUrl ? 'border-[#00E5FF] ring-2 ring-[#00E5FF]/40' : 'border-[#2C2C2E]'
                          }`}
                        >
                          <img src={imgUrl} className="w-full h-full object-cover group-hover:scale-105 transition" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar Info Card */}
              <div className="space-y-4">
                <div className="bg-[#141414] border border-[#2C2C2E] rounded-xl p-4 space-y-3">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#98989D] border-b border-[#2C2C2E] pb-2">
                    Plant & Incident Coordinates
                  </div>

                  <div className="flex items-start gap-2 text-xs">
                    <MapPin className="w-4 h-4 text-[#00E5FF] flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-white font-medium">{job?.address}</div>
                      <div className="text-[#98989D] text-[11px]">{job?.city}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-xs">
                    <User className="w-4 h-4 text-[#32D74B] flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-white font-medium">{job?.company_name}</div>
                      <div className="text-[#98989D] text-[11px]">POC: {job?.contact_person} ({job?.contact_phone})</div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#2C2C2E]">
                    <div className="text-[10px] text-[#98989D] font-mono mb-0.5">Budget Allocation</div>
                    <div className="text-base font-mono font-bold text-[#00E5FF]">
                      {job?.agreed_price ? (
                        <span>Agreed: ₹{job.agreed_price.toLocaleString()}</span>
                      ) : job?.budget_min ? (
                        <span>₹{job.budget_min.toLocaleString()} - ₹{job.budget_max?.toLocaleString()}</span>
                      ) : (
                        <span>Open for Proposals</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Assigned Mechanic Mini-Card */}
                {job?.assigned_mechanic_name && (
                  <div className="bg-[#141414] border border-[#00E5FF]/40 rounded-xl p-4 shadow-[0_0_15px_rgba(0,229,255,0.1)]">
                    <div className="text-[10px] font-mono uppercase text-[#00E5FF] font-bold mb-2 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" />
                      Assigned Field Engineer
                    </div>
                    <div className="flex items-center gap-2.5">
                      <img src={job.assigned_mechanic_avatar || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100'} className="w-10 h-10 rounded-full object-cover border border-[#00E5FF]" />
                      <div>
                        <div className="font-bold text-xs text-white">{job.assigned_mechanic_name}</div>
                        <div className="text-[10px] text-[#98989D]">{job.assigned_mechanic_headline || 'Certified Specialist'}</div>
                        <div className="text-[10px] text-[#00E5FF] font-mono mt-0.5">{job.assigned_mechanic_phone}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Status Milestone Tracker */}
            <div className="bg-[#141414] border border-[#2C2C2E] rounded-xl p-4">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#98989D] mb-3 flex items-center justify-between">
                <span>Real-Time Job Workflow Pipeline</span>
                <span className="text-[#00E5FF]">Haversine SLA Tracked</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                {[
                  { key: 'OPEN', label: '1. Incident Open' },
                  { key: 'ASSIGNED', label: '2. Assigned' },
                  { key: 'ON_THE_WAY', label: '3. En Route' },
                  { key: 'WORKING', label: '4. Diagnostics' },
                  { key: 'COMPLETED', label: '5. Restored' }
                ].map((step, idx) => {
                  const statuses = ['OPEN', 'ASSIGNED', 'ON_THE_WAY', 'WORKING', 'COMPLETED'];
                  const currentIndex = statuses.indexOf(job?.status || 'OPEN');
                  const stepIndex = statuses.indexOf(step.key);
                  const isDone = stepIndex <= currentIndex;
                  const isCurrent = step.key === job?.status;

                  return (
                    <div
                      key={step.key}
                      className={`p-2.5 rounded-lg border font-mono transition ${
                        isCurrent
                          ? 'bg-[#00E5FF]/15 border-[#00E5FF] text-[#00E5FF] font-bold shadow-[0_0_10px_rgba(0,229,255,0.2)]'
                          : isDone
                          ? 'bg-[#1E1E1E] border-[#32D74B]/40 text-[#32D74B]'
                          : 'bg-[#181818] border-[#2C2C2E] text-[#606060]'
                      }`}
                    >
                      <div className="text-[11px] mb-0.5">{step.label}</div>
                      <div className="text-[9px] uppercase font-bold">
                        {isCurrent ? '● ACTIVE' : isDone ? '✓ DONE' : 'WAITING'}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Status Update Controls */}
              {isAssigned && !isCompleted && (
                <div className="mt-4 pt-4 border-t border-[#2C2C2E] flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-[#98989D]">Advance Service Milestone:</span>
                  <div className="flex items-center gap-2">
                    {job.status === 'ASSIGNED' && (
                      <button
                        onClick={() => handleStatusChange('ON_THE_WAY')}
                        className="bg-[#00E5FF] hover:bg-[#00c5dc] text-black font-bold text-xs px-3.5 py-1.5 rounded-lg transition"
                      >
                        Mark as "On The Way" &rarr;
                      </button>
                    )}
                    {job.status === 'ON_THE_WAY' && (
                      <button
                        onClick={() => handleStatusChange('WORKING')}
                        className="bg-[#FF9F0A] hover:bg-[#e08906] text-black font-bold text-xs px-3.5 py-1.5 rounded-lg transition"
                      >
                        Mark as "Arrived & Working" &rarr;
                      </button>
                    )}
                    {job.status === 'WORKING' && (
                      <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                        <input
                          type="text"
                          placeholder="Parts replaced (e.g. 2x FAG bearings)"
                          value={partsUsed}
                          onChange={(e) => setPartsUsed(e.target.value)}
                          className="bg-[#1E1E1E] border border-[#2C2C2E] rounded-lg px-2.5 py-1 text-xs text-white"
                        />
                        <button
                          onClick={() => handleStatusChange('COMPLETED')}
                          className="bg-[#32D74B] hover:bg-[#28b23c] text-black font-bold text-xs px-3.5 py-1.5 rounded-lg transition"
                        >
                          Mark Job Successfully Completed &rarr;
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Locked Quote Card Display */}
            {quoteCard && (
              <div className="bg-[#121212] border-2 border-[#00E5FF] rounded-xl p-4 shadow-[0_0_20px_rgba(0,229,255,0.15)] relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00E5FF] animate-pulse"></span>
                    <span className="font-mono text-xs font-bold text-[#00E5FF] uppercase tracking-wider">
                      Agreed & Locked Quote Card
                    </span>
                  </div>
                  <span className="text-[10px] bg-[#32D74B]/20 text-[#32D74B] border border-[#32D74B]/40 px-2 py-0.5 rounded font-mono font-bold">
                    PRE-AUTHORIZED PAYMENT
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border-y border-[#2C2C2E] py-2.5 my-2">
                  <div>
                    <span className="text-[#98989D] text-[10px] block">Agreed Price</span>
                    <span className="font-mono font-bold text-white text-base text-[#00E5FF]">₹{quoteCard.agreed_price?.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[#98989D] text-[10px] block">Lock Timestamp</span>
                    <span className="text-white text-xs">{new Date(quoteCard.created_at).toLocaleTimeString()}</span>
                  </div>
                  <div>
                    <span className="text-[#98989D] text-[10px] block">Company Confirmed</span>
                    <span className="text-[#32D74B] text-xs font-mono">✓ Confirmed</span>
                  </div>
                  <div>
                    <span className="text-[#98989D] text-[10px] block">Technician Confirmed</span>
                    <span className="text-[#32D74B] text-xs font-mono">✓ Confirmed</span>
                  </div>
                </div>

                <p className="text-[11px] text-[#98989D]">
                  Scope Summary: {quoteCard.scope_summary || 'Standard diagnostic and repair agreement.'}
                </p>
              </div>
            )}

            {/* Digital Job Card (Completed details) */}
            {isCompleted && (
              <div className="bg-[#121212] border border-[#32D74B]/50 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#32D74B] font-bold text-xs uppercase font-mono">
                    <FileText className="w-4 h-4" />
                    Digital Job Completion Card & Certification
                  </div>
                  <span className="text-xs text-[#98989D]">Repaired in {job.time_taken_hours || 2.5} hrs</span>
                </div>
                <div className="text-xs text-gray-300">
                  <b>Work Executed:</b> {job.work_summary || 'Spindle alignment and bearing cartridge reset.'}
                </div>
                <div className="text-xs text-gray-300">
                  <b>Parts / Consumables Used:</b> {job.parts_used || 'Standard OEM replacement seals & lubricants.'}
                </div>
              </div>
            )}

            {/* Review Section */}
            {isCompleted && !review && isCompany && (
              <form onSubmit={handleSubmitReview} className="bg-[#141414] border border-[#2C2C2E] rounded-xl p-4 space-y-3">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  Rate Mechanic Performance & Close Ticket
                </div>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className={`text-xl cursor-pointer ${s <= rating ? 'text-yellow-400' : 'text-[#404040]'}`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="text-xs font-mono text-[#00E5FF] ml-2">{rating}.0 / 5.0</span>
                </div>
                <textarea
                  rows={2}
                  placeholder="Share details on punctuality, expertise, and diagnostic quality..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  required
                  className="w-full bg-[#1E1E1E] border border-[#2C2C2E] rounded-lg p-2.5 text-xs text-white"
                />
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="bg-[#00E5FF] hover:bg-[#00c5dc] text-black font-bold text-xs px-4 py-2 rounded-lg transition"
                >
                  {submittingReview ? 'Submitting...' : 'Post Public Review to Mechanic Profile'}
                </button>
              </form>
            )}

            {/* Public Review Display if already reviewed */}
            {review && (
              <div className="bg-[#141414] border border-[#2C2C2E] rounded-xl p-4">
                <div className="text-[10px] font-mono uppercase text-yellow-400 font-bold mb-1 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-yellow-400" />
                  Verified Company Review ({review.rating}.0 / 5.0)
                </div>
                <p className="text-xs text-gray-300 italic">"{review.review_text}"</p>
              </div>
            )}

            {/* Mechanic Proposals & Counter-Offer Negotiation Section */}
            {!isAssigned && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#2C2C2E] pb-2">
                  <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#00E5FF]" />
                    Technician Proposals & Counter-Offers ({proposals.length})
                  </h3>
                  <span className="text-[11px] text-[#98989D]">Max 3 Negotiation Rounds</span>
                </div>

                {/* Mechanic Proposal Submission Form */}
                {isMechanic && !proposals.some(p => p.mechanic_user_id === currentUser.id) && (
                  <form onSubmit={handleApply} className="bg-[#141414] border border-[#00E5FF]/40 rounded-xl p-4 space-y-3">
                    <div className="text-xs font-bold text-[#00E5FF] flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5" />
                      Submit On-Site Repair Proposal
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-mono text-[#98989D] block mb-1">Your Proposed Price (₹)</label>
                        <input
                          type="number"
                          placeholder="e.g. 8500"
                          value={proposedPrice}
                          onChange={(e) => setProposedPrice(e.target.value)}
                          required
                          className="w-full bg-[#1E1E1E] border border-[#2C2C2E] rounded-lg px-3 py-1.5 text-xs text-white focus:border-[#00E5FF]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-[#98989D] block mb-1">Estimated Arrival ETA</label>
                        <select
                          value={arrivalEta}
                          onChange={(e) => setArrivalEta(e.target.value)}
                          className="w-full bg-[#1E1E1E] border border-[#2C2C2E] rounded-lg px-3 py-1.5 text-xs text-white"
                        >
                          <option value="20 mins">Within 20 mins (Ready in van)</option>
                          <option value="35 mins">Within 35 mins</option>
                          <option value="1 hour">Within 1 hour</option>
                          <option value="Same Day (Afternoon)">Same Day (Afternoon shift)</option>
                        </select>
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder="Intro note (e.g. Equipped with Haas puller & dial indicator)"
                      value={proposalMsg}
                      onChange={(e) => setProposalMsg(e.target.value)}
                      className="w-full bg-[#1E1E1E] border border-[#2C2C2E] rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                    <button
                      type="submit"
                      disabled={submittingProposal}
                      className="bg-[#00E5FF] hover:bg-[#00c5dc] text-black font-extrabold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                    >
                      {submittingProposal ? 'Broadcasting Proposal...' : 'SUBMIT REPAIR PROPOSAL'}
                    </button>
                  </form>
                )}

                {/* List of Proposals */}
                <div className="space-y-3">
                  {proposals.length === 0 ? (
                    <div className="text-center py-6 text-xs text-[#98989D] bg-[#141414] rounded-xl border border-[#2C2C2E]">
                      No mechanics have applied yet. Broadcast active across radar corridor.
                    </div>
                  ) : (
                    proposals.map((prop) => {
                      const isOwner = currentUser?.id === prop.mechanic_user_id;
                      const isCounteringThis = counterTargetProposalId === prop.id;

                      return (
                        <div
                          key={prop.id}
                          className="bg-[#141414] border border-[#2C2C2E] rounded-xl p-4 space-y-3"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <img src={prop.mechanic_avatar || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100'} className="w-10 h-10 rounded-full object-cover border border-[#00E5FF]/40" />
                              <div>
                                <div className="text-xs font-bold text-white flex items-center gap-2">
                                  <span>{prop.mechanic_name}</span>
                                  <span className="text-[10px] text-yellow-400 font-mono">⭐ {prop.rating}</span>
                                  <span className="text-[9px] bg-[#00E5FF]/10 text-[#00E5FF] px-1 rounded font-mono">
                                    {prop.verification_tier || 'CERTIFIED'}
                                  </span>
                                </div>
                                <div className="text-[11px] text-[#98989D]">{prop.headline}</div>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-base font-mono font-bold text-[#00E5FF]">
                                ₹{prop.counter_price ? prop.counter_price.toLocaleString() : prop.proposed_price.toLocaleString()}
                              </div>
                              <div className="text-[10px] text-[#98989D] font-mono">
                                ETA: {prop.estimated_arrival}
                              </div>
                            </div>
                          </div>

                          <p className="text-xs text-gray-300 bg-[#1E1E1E] p-2.5 rounded-lg border border-[#2C2C2E]">
                            "{prop.message}"
                          </p>

                          {/* Counter Status */}
                          {prop.counter_price && (
                            <div className="flex items-center justify-between text-xs bg-yellow-500/10 border border-yellow-500/30 px-3 py-1.5 rounded-lg text-yellow-300">
                              <span>Round {prop.counter_round}/3 Counter: ₹{prop.counter_price} (by {prop.counter_by})</span>
                              <span className="text-[10px] font-mono uppercase">{prop.status}</span>
                            </div>
                          )}

                          {/* Negotiation Actions for Company or Mechanic */}
                          <div className="flex items-center justify-end gap-2 pt-1">
                            {isCompany && (
                              <>
                                <button
                                  onClick={() => handleAcceptProposal(prop.id)}
                                  className="bg-[#32D74B] hover:bg-[#28b23c] text-black font-bold text-xs px-3.5 py-1.5 rounded-lg transition cursor-pointer"
                                >
                                  Accept & Lock Quote Card (₹{prop.counter_price || prop.proposed_price})
                                </button>

                                <button
                                  onClick={() => setCounterTargetProposalId(isCounteringThis ? null : prop.id)}
                                  className="bg-[#1E1E1E] hover:bg-[#252525] border border-[#00E5FF] text-[#00E5FF] font-semibold text-xs px-3 py-1.5 rounded-lg transition cursor-pointer"
                                >
                                  {isCounteringThis ? 'Cancel Counter' : 'Counter-Offer'}
                                </button>
                              </>
                            )}

                            {isOwner && prop.counter_by === 'company' && prop.status === 'COUNTERED' && (
                              <button
                                onClick={() => handleAcceptProposal(prop.id)}
                                className="bg-[#32D74B] hover:bg-[#28b23c] text-black font-bold text-xs px-3.5 py-1.5 rounded-lg transition cursor-pointer"
                              >
                                Accept Counter ₹{prop.counter_price}
                              </button>
                            )}
                          </div>

                          {/* Counter-offer inline input */}
                          {isCounteringThis && (
                            <div className="flex items-center gap-2 pt-2 border-t border-[#2C2C2E]">
                              <input
                                type="number"
                                placeholder="Your counter price (₹)"
                                value={counterPrice}
                                onChange={(e) => setCounterPrice(e.target.value)}
                                className="bg-[#1E1E1E] border border-[#2C2C2E] rounded-lg px-3 py-1.5 text-xs text-white focus:border-[#00E5FF]"
                              />
                              <button
                                onClick={() => handleSendCounter(prop.id)}
                                className="bg-[#00E5FF] hover:bg-[#00c5dc] text-black font-bold text-xs px-3.5 py-1.5 rounded-lg transition cursor-pointer"
                              >
                                Send Counter
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}

