import React, { useState, useEffect } from 'react';
import { X, Building2, MapPin, Cpu, Plus, Trash2 } from 'lucide-react';
import { api } from '../services/api';

export default function CompanyProfileModal({
  companyUserId,
  isOpen,
  onClose,
  currentUser
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

  return (
        <div className="fixed inset-0 z-[1250] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl relative my-auto text-slate-900">

            {/* Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                <h3 className="font-bold text-slate-900 text-sm">Company Facility & Equipment</h3>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {loading ? (
                  <div className="p-10 text-center text-slate-400 text-xs">
                    Loading...
                  </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto p-5 space-y-4">

                      {/* Header info */}
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                          <h2 className="text-base font-bold text-slate-900">{comp?.company_name}</h2>
                          <div className="text-xs text-slate-600">{comp?.industry_type}</div>
                          <div className="text-xs text-slate-500">{comp?.address}, {comp?.city}</div>
                        </div>

                            {/* Registered Machinery */}
                            <div className="space-y-2">
                              <div className="text-xs font-semibold text-slate-800">Plant Machinery List</div>
                              <div className="flex flex-wrap gap-1.5">
                                {comp?.machines_operated?.map((m, i) => (
                                  <span
                                    key={i}
                                    className="bg-slate-100 border border-slate-200 text-slate-800 text-xs px-2.5 py-1 rounded"
                                  >
                                    {m}
                                  </span>
                                ))}
                              </div>

                              {isMe && (
                                  <form onSubmit={handleAddMachine} className="flex gap-2 pt-1">
                                    <input
                                      type="text"
                                      placeholder="Add equipment (e.g. 500kVA Diesel Generator)"
                                      value={newMachine}
                                      onChange={(e) => setNewMachine(e.target.value)}
                                      className="flex-1 bg-white border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-900"
                                    />
                                    <button
                                      type="submit"
                                      className="bg-slate-900 text-white font-medium text-xs px-3 py-1.5 rounded"
                                    >
                                      Add
                                    </button>
                                  </form>
              )}
                                </div>

                                  {/* Breakdown History */}
                                  <div className="space-y-2 pt-2 border-t border-slate-100">
                                    <div className="text-xs font-semibold text-slate-800">Breakdown Records ({jobs.length})</div>
                                    <div className="space-y-1.5">
                                      {jobs.map((j) => (
                                          <div key={j.id} className="p-2.5 border border-slate-100 rounded flex items-center justify-between text-xs">
                                            <div>
                                              <div className="font-medium text-slate-900">{j.title}</div>
                                              <div className="text-[11px] text-slate-400 font-mono">{j.id} &bull; {j.urgency}</div>
                                            </div>
                                              <span className="font-mono text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
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
