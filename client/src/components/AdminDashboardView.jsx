import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Users,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
  Search,
  Eye,
  RefreshCw
} from 'lucide-react';
import AnalyticsGraphs from './AnalyticsGraphs';
import AdminDeepInspectModal from './AdminDeepInspectModal';
import { api } from '../services/api';

export default function AdminDashboardView({ onSelectJob, onOpenChat }) {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [analyticsData, setAnalyticsData] = useState(null);

  // Deep inspect modal state
  const [inspectModal, setInspectModal] = useState({ isOpen: false, type: 'job', id: null });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [adminData, analytics] = await Promise.all([
        api.getAdminOverview(),
        api.getAnalytics('admin', 'admin')
      ]);
      setOverview(adminData);
      setAnalyticsData(analytics);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  // Filter jobs by search
  const filteredJobs = recentJobs.filter((j) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      j.id?.toLowerCase().includes(q) ||
      j.title?.toLowerCase().includes(q) ||
      j.company_name?.toLowerCase().includes(q) ||
      j.machine_category?.toLowerCase().includes(q) ||
      j.status?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>Operations & Plant Administration</span>
            <span className="text-[11px] bg-slate-900 text-white px-2 py-0.5 rounded font-mono font-medium">
              Supervisor Mode
            </span>
          </h1>
          <div className="text-xs text-slate-500 mt-0.5">
            Universal audit controls, technician verification, and transaction oversight
          </div>
        </div>

        <button
          onClick={fetchData}
          className="bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 px-3.5 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>Refresh Audit Logs</span>
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
            {m?.totalEmergency || 2} active emergency tickets
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
            {m?.completedJobs || 1} completed repair orders
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium uppercase tracking-wider">Platform Commission (5-10%)</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
            ₹{(m?.platformCommission || 48500).toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            Net escrow revenue
          </div>
        </div>
      </div>

      {/* Real-time Platform Analytics */}
      {analyticsData && (
        <AnalyticsGraphs role="admin" data={analyticsData} />
      )}

      {/* 12-COLUMN MAIN AUDIT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* 8 COLUMNS: Universal Breakdown & Bid Audit Stream */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Industrial Breakdown & Bid Audit Stream</h3>
                <div className="text-[11px] text-slate-500">Universal search across facilities, work orders, and quotes</div>
              </div>

              {/* Universal Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search work order, ID, plant..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>
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
                    <th className="py-2.5 px-4 text-right font-semibold">Price</th>
                    <th className="py-2.5 px-4 text-right font-semibold">Deep Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredJobs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                        No work orders match the search query.
                      </td>
                    </tr>
                  ) : (
                    filteredJobs.map((j) => (
                      <tr key={j.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-2.5 px-4 font-mono font-medium text-slate-900">{j.id}</td>
                        <td className="py-2.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                            j.urgency === 'EMERGENCY'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {j.urgency}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-medium text-slate-900 max-w-[180px] truncate">
                          {j.title}
                        </td>
                        <td className="py-2.5 px-4 text-slate-500">{j.company_name}</td>
                        <td className="py-2.5 px-4 font-mono text-[11px] text-slate-700">{j.status}</td>
                        <td className="py-2.5 px-4 font-mono font-semibold text-right text-slate-900">
                          {j.agreed_price ? `₹${j.agreed_price.toLocaleString()}` : '—'}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <button
                            onClick={() => setInspectModal({ isOpen: true, type: 'job', id: j.id })}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-2.5 py-1 rounded text-xs transition cursor-pointer flex items-center gap-1 ml-auto"
                          >
                            <Eye className="w-3 h-3 text-slate-600" />
                            <span>Audit Bids</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
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
                Verification Queue
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-semibold">
                {pendingTechnicians.length} Pending
              </span>
            </div>

            <div className="space-y-2.5">
              {pendingTechnicians.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  All technician accounts verified.
                </div>
              ) : (
                pendingTechnicians.map((t) => (
                  <div key={t.user_id} className="p-3 border border-slate-200 rounded-lg space-y-2 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-xs text-slate-900">{t.full_name}</div>
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-mono font-medium">
                        Pending
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500">
                      {t.city} &bull; {t.years_experience} Yrs Exp &bull; {t.certifications?.length || 0} Certifications
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1.5 border-t border-slate-200/60">
                      <button
                        onClick={() => setInspectModal({ isOpen: true, type: 'technician', id: t.user_id })}
                        className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium text-xs px-2.5 py-1 rounded-md transition cursor-pointer"
                      >
                        Inspect Profile
                      </button>
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

      {/* Admin Deep Inspection Modal */}
      <AdminDeepInspectModal
        type={inspectModal.type}
        id={inspectModal.id}
        isOpen={inspectModal.isOpen}
        onClose={() => setInspectModal({ isOpen: false, type: 'job', id: null })}
      />

    </div>
  );
}
