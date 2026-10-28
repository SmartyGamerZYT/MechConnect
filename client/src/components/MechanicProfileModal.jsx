import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  Award,
  CheckCircle2,
  Clock,
  MapPin,
  Wrench,
  DollarSign,
  Shield,
  FileCheck,
  Calendar,
  Briefcase,
  Plus
} from 'lucide-react';
import { api } from '../services/api';

export default function MechanicProfileModal({
  mechanicUserId,
  isOpen,
  onClose,
  currentUser,
  onInviteToJob
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditingAvailability, setIsEditingAvailability] = useState(false);
  const [statusVal, setStatusVal] = useState('AVAILABLE_NOW');
  const [statusNote, setStatusNote] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);

  const isMe = currentUser?.id === mechanicUserId;

  const fetchProfile = async () => {
    if (!mechanicUserId) return;
    setLoading(true);
    try {
      const res = await api.getMechanicProfile(mechanicUserId);
      setData(res);
      if (res.mechanic) {
        setStatusVal(res.mechanic.availability_status || 'AVAILABLE_NOW');
        setStatusNote(res.mechanic.availability_note || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && mechanicUserId) {
      fetchProfile();
    }
  }, [isOpen, mechanicUserId]);

  if (!isOpen) return null;

  const mech = data?.mechanic;
  const reviews = data?.reviews || [];

  const handleUpdateAvailability = async () => {
    setSavingStatus(true);
    try {
      await api.updateMechanicProfile(mechanicUserId, {
        availability_status: statusVal,
        availability_note: statusNote
      });
      setIsEditingAvailability(false);
      fetchProfile();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingStatus(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1250] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#1E1E1E] border border-[#2C2C2E] rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl relative my-auto">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#2C2C2E] flex items-center justify-between bg-[#181818] flex-shrink-0">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#00E5FF]" />
            <h3 className="font-bold text-white text-base">Verified Field Technician Profile</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#252525] hover:bg-[#303030] text-[#98989D] hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-[#98989D] font-mono text-xs">
            Loading technician profile and verified repair portfolio...
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            
            {/* Profile Overview */}
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <img
                src={mech?.avatar_url || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150'}
                alt={mech?.full_name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.25)] flex-shrink-0"
              />

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-white">{mech?.full_name}</h2>
                  <span className="text-[10px] bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40 px-2 py-0.5 rounded font-mono font-bold">
                    {mech?.verification_tier || 'TIER_3_CERTIFIED'}
                  </span>
                  {mech?.is_team_lead === 1 && (
                    <span className="text-[10px] bg-purple-500/20 text-purple-400 border border-purple-500/40 px-2 py-0.5 rounded font-mono font-bold">
                      TEAM LEAD ({mech.team_name})
                    </span>
                  )}
                </div>

                <div className="text-xs text-[#00E5FF] font-medium mb-1.5">{mech?.headline}</div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#98989D]">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#00E5FF]" />
                    {mech?.city} ({mech?.service_radius_km} km radius)
                  </span>
                  <span className="flex items-center gap-1 text-yellow-400 font-bold">
                    ⭐ {mech?.rating} ({mech?.reviews_count} reviews)
                  </span>
                  <span className="flex items-center gap-1 text-white">
                    <Briefcase className="w-3.5 h-3.5 text-[#32D74B]" />
                    {mech?.total_jobs_completed} jobs completed
                  </span>
                  <span className="font-mono text-[#00E5FF] font-semibold">
                    ₹{mech?.hourly_rate}/hr bench rate
                  </span>
                </div>
              </div>
            </div>

            {/* Availability Box & Toggle */}
            <div className="bg-[#141414] border border-[#2C2C2E] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    mech?.availability_status === 'AVAILABLE_NOW' ? 'bg-[#32D74B] animate-pulse' : 'bg-[#FF9F0A]'
                  }`}></span>
                  <span className="text-xs font-mono uppercase tracking-wider text-[#98989D]">
                    Dispatch Availability
                  </span>
                </div>
                {isMe && !isEditingAvailability && (
                  <button
                    onClick={() => setIsEditingAvailability(true)}
                    className="text-xs text-[#00E5FF] hover:underline font-mono cursor-pointer"
                  >
                    Change Status &rarr;
                  </button>
                )}
              </div>

              {!isEditingAvailability ? (
                <div>
                  <div className="text-sm font-bold text-white mb-1">
                    {mech?.availability_status === 'AVAILABLE_NOW' ? (
                      <span className="text-[#32D74B]">🟢 Available Now for Emergency Dispatch</span>
                    ) : mech?.availability_status === 'AVAILABLE_SOON' ? (
                      <span className="text-[#FF9F0A]">🟠 Available Later Today</span>
                    ) : (
                      <span className="text-[#98989D]">⚪ Offline / On Active Job</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 italic">
                    "{mech?.availability_note || 'Tool van equipped and ready for immediate deployment.'}"
                  </p>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-3 gap-2">
                    {['AVAILABLE_NOW', 'AVAILABLE_SOON', 'NOT_AVAILABLE'].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setStatusVal(st)}
                        className={`p-2 rounded-lg text-xs font-mono font-bold border cursor-pointer ${
                          statusVal === st
                            ? 'bg-[#00E5FF]/20 border-[#00E5FF] text-[#00E5FF]'
                            : 'bg-[#1E1E1E] border-[#2C2C2E] text-[#98989D]'
                        }`}
                      >
                        {st.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Status note (e.g. Equipped with Haas puller in Bhosari)"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    className="w-full bg-[#1E1E1E] border border-[#2C2C2E] rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIsEditingAvailability(false)}
                      className="px-3 py-1 text-xs text-[#98989D]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateAvailability}
                      disabled={savingStatus}
                      className="bg-[#00E5FF] text-black font-bold text-xs px-3.5 py-1 rounded-lg"
                    >
                      {savingStatus ? 'Saving...' : 'Save Availability'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bio */}
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#98989D] mb-1.5">
                Technical Background & Experience ({mech?.years_experience} Years)
              </div>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed bg-[#141414] p-3.5 rounded-xl border border-[#2C2C2E]">
                {mech?.bio}
              </p>
            </div>

            {/* Skill Tags */}
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#98989D] mb-2">
                Specialized Machine & Control Taxonomy
              </div>
              <div className="flex flex-wrap gap-1.5">
                {mech?.skills?.map((sk, i) => (
                  <span
                    key={i}
                    className="bg-[#141414] border border-[#00E5FF]/30 text-[#00E5FF] text-xs font-medium px-2.5 py-1 rounded-lg"
                  >
                    {sk}
                  </span>
                ))}
              </div>
            </div>

            {/* Verified Certifications */}
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#98989D] mb-2 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-[#32D74B]" />
                Verified Industrial Certifications
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {mech?.certifications?.map((c, i) => (
                  <div key={i} className="bg-[#141414] border border-[#2C2C2E] p-3 rounded-xl flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#32D74B]/10 border border-[#32D74B]/30 flex items-center justify-center text-[#32D74B] flex-shrink-0">
                      ✓
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white leading-tight">{c.title}</div>
                      <div className="text-[11px] text-[#98989D]">{c.issuer} &bull; {c.year}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Past Repair Portfolio with Photos */}
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#98989D] mb-2">
                Past Case Studies & Repaired Machinery
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {mech?.portfolio?.map((item) => (
                  <div key={item.id} className="bg-[#141414] border border-[#2C2C2E] rounded-xl overflow-hidden group">
                    <div className="h-32 w-full overflow-hidden relative">
                      <img src={item.image_url} className="w-full h-full object-cover group-hover:scale-105 transition" />
                      <span className="absolute top-2 left-2 bg-black/80 backdrop-blur-md text-[#00E5FF] text-[9px] font-mono px-2 py-0.5 rounded border border-[#00E5FF]/40">
                        {item.machine_type}
                      </span>
                    </div>
                    <div className="p-3">
                      <h4 className="text-xs font-bold text-white mb-1 leading-snug">{item.title}</h4>
                      <p className="text-[11px] text-[#98989D] line-clamp-2">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Verified Reviews */}
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#98989D] mb-2 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-yellow-400" />
                Verified Plant Manager Reviews ({reviews.length})
              </div>
              <div className="space-y-2.5">
                {reviews.length === 0 ? (
                  <div className="text-xs text-[#98989D] bg-[#141414] p-4 rounded-xl text-center">
                    No public reviews recorded yet.
                  </div>
                ) : (
                  reviews.map((r) => (
                    <div key={r.id} className="bg-[#141414] border border-[#2C2C2E] p-3 rounded-xl">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span>{r.company_name || 'Industrial Facility'}</span>
                          <span className="text-yellow-400 font-mono text-[11px]">★ {r.rating}.0</span>
                        </div>
                        <span className="text-[10px] text-[#98989D] font-mono">{new Date(r.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-gray-300 italic">"{r.review_text}"</p>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

