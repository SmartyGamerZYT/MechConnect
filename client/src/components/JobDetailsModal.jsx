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
  const [bidError, setBidError] = useState(null);

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
  const isVerified = currentUser?.mechanic_is_verified === 1;

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
    if (!isVerified) {
      setBidError('Your account is awaiting admin verification. You cannot submit bids until approved.');
      return;
    }

    setSubmittingProposal(true);
    setBidError(null);
    try {
        const res = await api.applyToJob(job.id, {
          mechanic_user_id: currentUser.id,
          proposed_price: parseFloat(proposedPrice),
          estimated_arrival: arrivalEta,
          message: proposalMsg
        });
      if(res.error) {
        setBidError(res.error);
      } else {
        fetchDetails();
        if (onRefreshData) onRefreshData();
        setProposedPrice('');
        setProposalMsg('');
      }
    } catch (err) {
      setBidError('Bid submission failed');
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
        note: `Status updated to ${nextStatus}`
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
        <div className="fixed inset-0 z-[1200] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl relative my-auto text-slate-900">

            {/* Header */}
                      < div className="p-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${isUrgent ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-slate-100 text-slate-700'
                      }`}>
                      {job?.urgency}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{job?.id}</span>
                    <span className="text-xs font-medium text-slate-700">Status: {job?.status}</span>
                  </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onOpenChat(job.id)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat</span>
                      </button>
                      <button
                        onClick={onClose}
                        className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Modal Body */}
                  {loading ? (
                      <div className="p-10 text-center text-slate-400 text-xs">
                        Loading breakdown data...
                      </div>
                      ) : (
                        <div className="flex-1 overflow-y-auto p-5 space-y-5">

                            {/* Title & Info */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                                <div className="lg:col-span-2 space-y-3">
                                  <div>
                                      <h2 className="text-base font-bold text-slate-900 mb-1">{job?.title}</h2>
                                      <div className="flex flex-wrap items-center gap-x-3 text-xs text-slate-500">
                                        <span className="font-semibold text-slate-800">{job?.machine_category}</span>
                                        <span>Brand: {job?.machine_brand || 'Standard'}</span>
                                        <span>Model: {job?.machine_model || 'Standard'}</span>
                                      </div>
                                    </div>

                                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-800 leading-relaxed">
                                        <div className="font-semibold text-slate-900 mb-1">Fault Description</div>
                                        {job?.fault_description}
                                      </div>

                                      {/* Photos */}
                                      {job?.images?.length > 0 && (
                                        <div>
                                            <div className="text-xs font-semibold text-slate-700 mb-1.5">Attached Photos</div>
                                            <div className="flex gap-2">
                                              {job.images.map((imgUrl, i) => (
                                                <div
                                                  key={i}
                                                  onClick={() => setActivePhoto(imgUrl)}
                                                  className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 cursor-pointer"
                                                >
                                                  <img src={imgUrl} className="w-full h-full object-cover" />
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                )}
                                        </div>

                                            {/* Sidebar */}
                                            <div className="space-y-3">
                                              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2 text-xs">
                                                <div className="font-semibold text-slate-900 border-b border-slate-200 pb-1">Location & Budget</div>
                                                <div className="text-slate-600">{job?.address}, {job?.city}</div>
                                                <div className="text-slate-600">{job?.company_name}</div>
                                                <div className="pt-1 border-t border-slate-200 font-mono font-bold text-slate-900 text-sm">
                                                  {job?.agreed_price ? `Agreed: ₹${job.agreed_price.toLocaleString()}` : job?.budget_min ? `₹${job.budget_min.toLocaleString()} - ₹${job.budget_max?.toLocaleString()}` : 'Budget Open'}
                                                </div>
                                              </div>

                                              {job?.assigned_mechanic_name && (
                                                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1">
                                                    <div className="font-semibold text-slate-900">Assigned Technician</div>
                                                    <div className="text-slate-800 font-medium">{job.assigned_mechanic_name}</div>
                                                    <div className="text-slate-500 font-mono">{job.assigned_mechanic_phone}</div>
                                                  </div>
                )}
                                                </div>

            </div>

                                            {/* Locked Quote Card Display */}
                                            {quoteCard && (
                                                  <div className="bg-slate-50 border border-slate-300 rounded-lg p-3.5 space-y-2 text-xs">
                                                    <div className="flex items-center justify-between font-semibold">
                                                      <span>Locked Quote Card</span>
                                                      <span className="text-emerald-700 font-mono">Pre-Authorized</span>
                                                    </div>
                                                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border-y border-slate-200 py-2">
                                                        <div>
                                                          <span className="text-slate-500 block text-[10px]">Agreed Price</span>
                                                          <span className="font-mono font-bold text-slate-900">₹{quoteCard.agreed_price?.toLocaleString()}</span>
                                                        </div>
                                                        <div>
                                                          <span className="text-slate-500 block text-[10px]">Date</span>
                                                          <span className="text-slate-700">{new Date(quoteCard.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                        <div>
                                                          <span className="text-slate-500 block text-[10px]">Confirmation</span>
                                                          <span className="text-emerald-700 font-medium">Both Confirmed</span>
                                                        </div>
                                                      </div>
                                                    </div>
            )}

                                                            {/* Milestone Actions */ }
            { isAssigned && !isCompleted && isMechanic && (
                                                              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                                                                <span className="text-slate-600">Advance Job:</span>
                                                                <div className="flex gap-2">
                                                                  {job.status === 'ASSIGNED' && (
                                                                    <button
                                                                      onClick={() => handleStatusChange('ON_THE_WAY')}
                                                                      className="bg-slate-900 text-white px-3 py-1.5 rounded-md font-medium"
                                                                    >
                                                                      Mark On The Way
                                                                    </button>
                  )}
                                                                  {job.status === 'ON_THE_WAY' && (
                                                                    <button
                                                                      onClick={() => handleStatusChange('WORKING')}
                                                                      className="bg-slate-900 text-white px-3 py-1.5 rounded-md font-medium"
                                                                    >
                                                                      Mark Working
                                                                    </button>
                                                                  )}
                                                                  {job.status === 'WORKING' && (
                                                                    <button
                                                                      onClick={() => handleStatusChange('COMPLETED')}
                                                                      className="bg-emerald-600 text-white px-3 py-1.5 rounded-md font-medium"
                                                                    >
                                                                      Mark Completed
                                                                    </button>
                                                                  )}
                                                                </div>
                                                            </div>
                                                          )}

                                                          {/* Bids Section */}
                                                          {!isAssigned && (
                                                                  <div className="space-y-3 pt-2 border-t border-slate-100">
                                                                    <div className="flex items-center justify-between">
                                                                      <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                                                                        Proposals & Bids ({proposals.length})
                                                                      </h3>
                                                                    </div>

                                                                    {bidError && (
                                                                      <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-md text-xs">
                                                                        {bidError}
                                                                      </div>
                                                                    )}

                                                                    {/* Technician Bid Form */}
                                                                    {isMechanic && !proposals.some(p => p.mechanic_user_id === currentUser.id) && (
                                                                            <form onSubmit={handleApply} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
                                                                              <div className="text-xs font-semibold text-slate-900">Submit Bid</div>

                                                                              {!isVerified ? (
                                                                                <div className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded border border-amber-200">
                                                                                  Account verification pending. Admin must verify your credentials before you can submit bids.
                                                                                </div>
                                                                              ) : (
                                                                                <>
                                                                                  <div className="grid grid-cols-2 gap-2">
                                                                                    <div>
                                                                                      <label className="block text-[10px] font-medium text-slate-600 mb-1">Proposed Price (₹)</label>
                                                                                      <input
                                                                                        type="number"
                                                                                        placeholder="e.g. 7500"
                                                                                        value={proposedPrice}
                                                                                        onChange={(e) => setProposedPrice(e.target.value)}
                                                                                        required
                                                                                        className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-900"
                                                                                      />
                                                                                    </div>
                                                                                    <div>
                                                                                      <label className="block text-[10px] font-medium text-slate-600 mb-1">ETA</label>
                                                                                      <select
                                                                                        value={arrivalEta}
                                                                                        onChange={(e) => setArrivalEta(e.target.value)}
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
                                                                                    value={proposalMsg}
                                                                                    onChange={(e) => setProposalMsg(e.target.value)}
                                                                                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-900"
                                                                                  />

                        <button
                                                                                  type="submit"
                                                                                  disabled={submittingProposal}
                                                                                  className="bg-slate-900 text-white font-semibold text-xs px-4 py-1.5 rounded-md"
                                                                                >
                                                                          {submittingProposal ? 'Submitting...' : 'Submit Bid'}
                                                                        </button>
                                                                      </>
                                                                    )}
                                                                  </form>
                )}

                                                                    {/* Proposals list */}
                                                                    <div className="space-y-2">
                                                                      {proposals.length === 0 ? (
                                                                          <div className="text-center py-6 text-xs text-slate-400">
                                                                            No proposals submitted yet.
                                                                          </div>
                                                                          ) : (
                    proposals.map((prop) => (
                                                                          <div key={prop.id} className="p-3 border border-slate-200 rounded-lg space-y-2 text-xs">
                                                                            <div className="flex items-start justify-between">
                                                                              <div>
                                                                                <div className="font-semibold text-slate-900">{prop.mechanic_name}</div>
                                                                                <div className="text-[11px] text-slate-500">ETA: {prop.estimated_arrival}</div>
                                                                              </div>
                                                                              <div className="font-mono font-bold text-slate-900">
                                                                                ₹{prop.counter_price || prop.proposed_price}
                                                                              </div>
                                                                            </div>

                                                                                {prop.message && (
                                                                                  <div className="text-slate-600 bg-slate-50 p-2 rounded text-[11px]">
                                                                                    {prop.message}
                                                                                  </div>
                                                                                )}

                                                                                  {isCompany && (
                                                                                    <div className="flex justify-end gap-1.5 pt-1">
                                                                                      <button
                                                                                        onClick={() => handleAcceptProposal(prop.id)}
                                                                                        className="bg-emerald-600 text-white font-semibold px-3 py-1 rounded text-xs"
                                                                                      >
                                                                                        Accept Bid
                                                                                      </button>
                                                                                    </div>
                        )}
                                                                              </div>
                                                                              ))
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
