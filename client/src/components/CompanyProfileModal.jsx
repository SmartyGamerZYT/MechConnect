import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  ShieldCheck,
  MapPin,
  Cpu,
  User,
  Star,
  Trash2,
  Plus
} from 'lucide-react';
import { api } from '../services/api';

export default function CompanyProfileModal({
  companyUserId,
  isOpen,
  onClose,
  currentUser,
  onSelectMechanic
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newMachine, setNewMachine] = useState('');

  const isMe = currentUser?.id === companyUserId;

  const fetchProfile = async () => {
    if (!companyUserId) return;
    setLoading(true);
    try {
      const res = await api.getCompanyProfile(companyUserId);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && companyUserId) {
      fetchProfile();
    }
  }, [isOpen, companyUserId]);

  if (!isOpen) return null;

  const comp = data?.company;
  const trusted = data?.trusted || [];
  const jobs = data?.jobs || [];

  const handleAddMachine = async (e) => {
    e.preventDefault();
    if (!newMachine.trim()) return;

    const updatedMachines = [...(comp.machines_operated || []), newMachine.trim()];
    try {
      await api.updateCompanyProfile(companyUserId, {
        machines_operated: updatedMachines
      });
      setNewMachine('');
      fetchProfile();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveTrusted = async (mechUserId) => {
    try {
      await api.toggleTrustedMechanic(companyUserId, mechUserId);
      fetchProfile();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-[1250] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#1E1E1E] border border-[#2C2C2E] rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl relative my-auto">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#2C2C2E] flex items-center justify-between bg-[#181818] flex-shrink-0">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#00E5FF]" />
            <h3 className="font-bold text-white text-base">Industrial Company Profile</h3>
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
            Loading facility data and equipment taxonomy...
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            
            {/* Header info */}
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#141414] border border-[#00E5FF]/40 flex items-center justify-center text-2xl flex-shrink-0">
                🏭
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-white">{comp?.company_name}</h2>
                  {comp?.verified === 1 && (
                    <span className="text-[10px] bg-[#32D74B]/20 text-[#32D74B] border border-[#32D74B]/40 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> VERIFIED GST
                    </span>
                  )}
                </div>
                <div className="text-xs text-[#00E5FF] font-medium">{comp?.industry_type}</div>
                <div className="text-xs text-[#98989D] flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-[#00E5FF]" />
                  {comp?.address}, {comp?.city}
                </div>
              </div>
            </div>

            {/* Facility Machines Operated */}
            <div className="bg-[#141414] border border-[#2C2C2E] rounded-xl p-4">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#98989D] mb-2 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#00E5FF]" />
                Registered Facility Machinery & Plant Equipment
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {comp?.machines_operated?.map((m, i) => (
                  <span
                    key={i}
                    className="bg-[#1E1E1E] border border-[#2C2C2E] text-white text-xs px-2.5 py-1 rounded-lg"
                  >
                    ⚙️ {m}
                  </span>
                ))}
              </div>

              {isMe && (
                <form onSubmit={handleAddMachine} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add machine (e.g. 500kVA Cummins Genset)"
                    value={newMachine}
                    onChange={(e) => setNewMachine(e.target.value)}
                    className="flex-1 bg-[#1E1E1E] border border-[#2C2C2E] rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                  <button
                    type="submit"
                    className="bg-[#00E5FF] text-black font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </form>
              )}
            </div>

            {/* Trusted Mechanics List */}
            <div className="space-y-3">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#98989D] flex items-center justify-between">
                <span>Trusted Technician Network (Repeat Rapid Hire)</span>
                <span className="text-[#00E5FF] font-bold">{trusted.length} Mechanics Saved</span>
              </div>

              {trusted.length === 0 ? (
                <div className="text-xs text-[#98989D] bg-[#141414] p-4 rounded-xl text-center">
                  No trusted technicians saved yet. Add mechanics from the directory for 1-click repeat hires.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {trusted.map((tm) => (
                    <div key={tm.link_id} className="bg-[#141414] border border-[#2C2C2E] p-3 rounded-xl flex items-center justify-between">
                      <div
                        onClick={() => onSelectMechanic(tm.user_id)}
                        className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
                      >
                        <img src={tm.avatar_url || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100'} className="w-9 h-9 rounded-full object-cover border border-[#00E5FF]" />
                        <div className="truncate">
                          <div className="text-xs font-bold text-white truncate">{tm.full_name}</div>
                          <div className="text-[10px] text-yellow-400 font-mono">⭐ {tm.rating} &bull; {tm.city}</div>
                        </div>
                      </div>
                      {isMe && (
                        <button
                          onClick={() => handleRemoveTrusted(tm.user_id)}
                          className="text-[#98989D] hover:text-[#FF453A] p-1.5 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Facility Incident History */}
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#98989D] mb-2">
                Facility Breakdown History ({jobs.length})
              </div>
              <div className="space-y-2">
                {jobs.map((j) => (
                  <div key={j.id} className="bg-[#141414] border border-[#2C2C2E] p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">{j.title}</div>
                      <div className="text-[10px] text-[#98989D] font-mono">{j.id} &bull; {j.urgency}</div>
                    </div>
                    <span className="text-[10px] font-mono text-[#00E5FF] bg-[#1E1E1E] px-2 py-0.5 rounded border border-[#2C2C2E]">
                      {j.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

