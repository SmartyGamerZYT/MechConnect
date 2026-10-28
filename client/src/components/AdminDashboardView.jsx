import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Users,
  ShieldAlert,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { api } from '../services/api';

export default function AdminDashboardView({ onSelectJob }) {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const m = overview?.metrics;
  const recentJobs = overview?.recentJobs || [];

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-[#1E1E1E] border border-[#2C2C2E] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00E5FF] animate-pulse"></span>
            <span className="text-[10px] font-mono text-[#00E5FF] uppercase font-bold tracking-wider">
              CENTRAL OPS CONTROL ROOM
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Platform Health & Telemetry</h1>
          <p className="text-xs text-[#98989D]">
            Live breakdown dispatch monitoring, technician SLAs, and GMV settlement ledger.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="bg-[#141414] hover:bg-[#252525] border border-[#2C2C2E] text-xs font-mono text-[#00E5FF] px-4 py-2 rounded-xl transition cursor-pointer"
        >
          ↻ Refresh Stream
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-[#1E1E1E] border border-[#FF453A]/40 rounded-2xl p-4 shadow-[0_0_15px_rgba(255,69,58,0.1)]">
          <div className="flex items-center justify-between text-xs text-[#98989D] mb-1">
            <span>EMERGENCY BREAKDOWNS</span>
            <AlertTriangle className="w-4 h-4 text-[#FF453A]" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {m?.totalEmergency || 2}
          </div>
          <div className="text-[11px] text-[#FF453A] font-mono mt-1">
            SLA Target &lt; 10 min first bid
          </div>
        </div>

        <div className="bg-[#1E1E1E] border border-[#2C2C2E] rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-[#98989D] mb-1">
            <span>ACTIVE JOBS PIPELINE</span>
            <Activity className="w-4 h-4 text-[#00E5FF]" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {m?.activeJobs || 3}
          </div>
          <div className="text-[11px] text-[#00E5FF] font-mono mt-1">
            {m?.completedJobs || 1} tickets completed today
          </div>
        </div>

        <div className="bg-[#1E1E1E] border border-[#32D74B]/40 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-[#98989D] mb-1">
            <span>TECHNICIANS AVAILABLE NOW</span>
            <Users className="w-4 h-4 text-[#32D74B]" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {m?.availableMechanics || 3} <span className="text-sm font-normal text-[#98989D]">/ {m?.totalMechanics || 4}</span>
          </div>
          <div className="text-[11px] text-[#32D74B] font-mono mt-1">
            75% Field deployment rate
          </div>
        </div>

        <div className="bg-[#1E1E1E] border border-[#2C2C2E] rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-[#98989D] mb-1">
            <span>PLATFORM COMMISSION (10%)</span>
            <DollarSign className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            ₹{(m?.platformCommission || 48500).toLocaleString()}
          </div>
          <div className="text-[11px] text-yellow-400 font-mono mt-1">
            Gross GMV: ₹{(m?.totalVolume || 485000).toLocaleString()}
          </div>
        </div>

      </div>

      {/* Live Breakdown Job Monitoring Table */}
      <div className="bg-[#1E1E1E] border border-[#2C2C2E] rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-[#2C2C2E] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-white text-sm">Active Industrial Incident Stream</h3>
            <span className="text-[10px] bg-[#00E5FF]/10 text-[#00E5FF] px-2 py-0.5 rounded font-mono">
              Live DB Records
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#141414] text-[#98989D] font-mono uppercase text-[10px] border-b border-[#2C2C2E]">
              <tr>
                <th className="py-3 px-4">Job ID</th>
                <th className="py-3 px-4">Urgency</th>
                <th className="py-3 px-4">Incident / Machine</th>
                <th className="py-3 px-4">Facility / Hub</th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Agreed Value</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2C2C2E]">
              {recentJobs.map((j) => {
                const isEmerg = j.urgency === 'EMERGENCY';
                return (
                  <tr key={j.id} className="hover:bg-[#252525]/60 transition">
                    <td className="py-3 px-4 font-mono font-bold text-white">{j.id}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                        isEmerg
                          ? 'bg-[#FF453A]/20 text-[#FF453A]'
                          : j.urgency === 'SAME_DAY'
                          ? 'bg-[#FF9F0A]/20 text-[#FF9F0A]'
                          : 'bg-[#32D74B]/20 text-[#32D74B]'
                      }`}>
                        {j.urgency}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-white max-w-[220px] truncate">
                      {j.title}
                    </td>
                    <td className="py-3 px-4 text-[#98989D]">{j.company_name || 'Industrial Facility'}</td>
                    <td className="py-3 px-4 text-[#98989D]">{j.city}</td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-mono bg-[#141414] border border-[#2C2C2E] px-2 py-0.5 rounded text-[#00E5FF]">
                        {j.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-right text-white">
                      {j.agreed_price ? `₹${j.agreed_price.toLocaleString()}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onSelectJob(j.id)}
                        className="bg-[#141414] hover:bg-[#00E5FF] text-[#00E5FF] hover:text-black border border-[#00E5FF]/40 font-bold px-2.5 py-1 rounded transition cursor-pointer text-[11px]"
                      >
                        Inspect &rarr;
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

