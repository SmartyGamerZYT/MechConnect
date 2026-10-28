import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Users,
  CheckCircle2,
  FileCheck,
  Shield
} from 'lucide-react';
import { api } from '../services/api';

export default function AdminDashboardView({ onSelectJob, onOpenChat }) {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminOverview();
      setOverview(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (userId) => {
    setVerifyingId(userId);
    try {
      await api.verifyTechnician(userId, 'approve');
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setVerifyingId(null);
    }
  };

  const m = overview?.metrics;
  const recentJobs = overview?.recentJobs || [];
  const pendingTechnicians = overview?.pendingTechnicians || [];

  return (
      <div className="space-y-5">

          {/* Top Banner */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Operations & Administration</h1>
            </div>

            <button
              onClick={fetchData}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 px-3.5 py-2 rounded-lg transition cursor-pointer"
            >
              Refresh Data
            </button>
          </div>

          {/* TOP 3 KPIS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-medium uppercase tracking-wider">Emergency SLA Compliance</span>
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  </div>
                    <div className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                      {m?.slaAdherence || '96.4%'}
                    </div>
                      <div className="text-[11px] text-red-600 font-medium mt-1">
                        {m?.totalEmergency || 2} emergency tickets
                      </div>
                    </div>

                        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                            <span className="font-medium uppercase tracking-wider">Gross Volume (GMV)</span>
                            <Activity className="w-4 h-4 text-sky-600" />
                          </div>
                            <div className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                              ₹{(m?.totalVolume || 485000).toLocaleString()}
                            </div>
                              <div className="text-[11px] text-slate-500 font-medium mt-1">
                                {m?.completedJobs || 1} completed work orders
                              </div>
                            </div>

                                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                                    <span className="font-medium uppercase tracking-wider">Commission (10%)</span>
                                    <DollarSign className="w-4 h-4 text-emerald-600" />
                                  </div>
                                    <div className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                                      ₹{(m?.platformCommission || 48500).toLocaleString()}
                                    </div>
                                      <div className="text-[11px] text-emerald-600 font-medium mt-1">
                                        Net platform revenue
                                      </div>
                                    </div>

                                  </div>

                                    {/* 12-COLUMN GRID */}
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

                                      {/* 8 COLUMNS: Incident Audit Stream */}
                                      <div className="lg:col-span-8 space-y-4">
                                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                                              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                                <h3 className="font-bold text-slate-900 text-sm">Breakdown Audit Stream</h3>
                                              </div>

                                              <div className="overflow-x-auto">
                                                <table className="w-full text-left text-xs">
                                                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-200">
                                                      <tr>
                                                        <th className="py-2.5 px-4 font-semibold">ID</th>
                                                        <th className="py-2.5 px-4 font-semibold">Urgency</th>
                                                        <th className="py-2.5 px-4 font-semibold">Title</th>
                                                        <th className="py-2.5 px-4 font-semibold">Company</th>
                                                        <th className="py-2.5 px-4 font-semibold">Status</th>
                                                        <th className="py-2.5 px-4 text-right font-semibold">Agreed Price</th>
                                                        <th className="py-2.5 px-4 text-right font-semibold">Action</th>
                                                      </tr>
                                                    </thead>
                                                      <tbody className="divide-y divide-slate-100">
                                                        {recentJobs.map((j) => (
                                                          <tr key={j.id} className="hover:bg-slate-50/70 transition">
                                                            <td className="py-2.5 px-4 font-mono font-medium text-slate-900">{j.id}</td>
                                                            <td className="py-2.5 px-4">
                                                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${j.urgency === 'EMERGENCY'
                                                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                                                  : 'bg-slate-100 text-slate-700'
                                                                }`}>
                                                                {j.urgency}
                                                              </span>
                                                            </td>
                                                            <td className="py-2.5 px-4 font-medium text-slate-900 max-w-[200px] truncate">
                                                              {j.title}
                                                            </td>
                                                            <td className="py-2.5 px-4 text-slate-500">{j.company_name}</td>
                                                            <td className="py-2.5 px-4 font-mono text-[11px] text-slate-700">{j.status}</td>
                                                            <td className="py-2.5 px-4 font-mono font-semibold text-right text-slate-900">
                                                              {j.agreed_price ? `₹${j.agreed_price.toLocaleString()}` : '—'}
                                                            </td>
                                                            <td className="py-2.5 px-4 text-right">
                                                              <button
                                                                onClick={() => onSelectJob(j.id)}
                                                                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium px-2 py-1 rounded text-xs transition cursor-pointer"
                                                              >
                                                                Audit
                                                              </button>
                                                            </td>
                                                          </tr>
                                                        ))}
                                                      </tbody>
                                                    </table>
                                                  </div>
                                              </div>
                                            </div>

                                            {/* 4 COLUMNS: Technician Verification Queue */}
                                            <div className="lg:col-span-4 space-y-4">
                                                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
                                                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                                                          <FileCheck className="w-4 h-4 text-slate-600" />
                                                          Technician Verification Queue
                                                        </span>
                                                          <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-semibold">
                                                            {pendingTechnicians.length} Pending
                                                          </span>
                                                      </div>

                                                      <div className="space-y-2.5">
                                                            {pendingTechnicians.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  All technicians verified.
                </div>
                                                          ) : (
                pendingTechnicians.map((t) => (
                                                          <div key={t.user_id} className="p-3 border border-slate-200 rounded-lg space-y-2">
                                                            <div className="flex items-center justify-between">
                                                              <div className="font-semibold text-xs text-slate-900">{t.full_name}</div>
                                                              <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                                                                Pending
                                                              </span>
                                                            </div>

                                                            <div className="text-[11px] text-slate-500">
                                                              {t.city} &bull; {t.years_experience} Yrs Exp &bull; {t.certifications?.length || 0} Certs
                                                            </div>

                                                            <div className="flex justify-end pt-1 border-t border-slate-100">
                                                              <button
                                                                onClick={() => handleVerify(t.user_id)}
                                                                disabled={verifyingId === t.user_id}
                                                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3 py-1 rounded-md transition cursor-pointer disabled:opacity-50"
                                                              >
                                                                {verifyingId === t.user_id ? 'Verifying...' : 'Approve & Verify'}
                                                              </button>
                                                            </div>
                                                          </div>
                                                          ))
              )}
                                                        </div>
                                                      </div>
                                                    </div>

                                                </div>

                                              </div>
                                              );
}
