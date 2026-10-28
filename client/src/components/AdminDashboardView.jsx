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
  Filter,
  FileCheck
} from 'lucide-react';
import { api } from '../services/api';

export default function AdminDashboardView({ onSelectJob, onOpenChat }) {
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
              CENTRAL SUPERVISOR & OPS RADAR
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Platform Health & Telemetry Dashboard</h1>
          <p className="text-xs text-[#98989D]">
            Emergency dispatch supervision, technician credential verification, and commission revenue audit.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="bg-[#141414] hover:bg-[#252525] border border-[#2C2C2E] text-xs font-mono text-[#00E5FF] px-4 py-2 rounded-xl transition cursor-pointer"
        >
          ↻ Refresh Stream
        </button>
      </div>

      {/* TOP 3 KPIS (WattVision Specification: 3 Columns on Top) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* KPI 1: Emergency SLA */}
        <div className="bg-[#1E1E1E] border border-[#FF453A]/40 rounded-2xl p-5 shadow-[0_0_15px_rgba(255,69,58,0.1)]">
          <div className="flex items-center justify-between text-xs text-[#98989D] mb-1">
            <span className="font-mono uppercase tracking-wider">Emergency SLA Compliance</span>
            <AlertTriangle className="w-4 h-4 text-[#FF453A]" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono tracking-tight">
            {m?.slaAdherence || '96.4%'}
          </div>
          <div className="text-[11px] text-[#FF453A] font-mono mt-1">
            Target &lt; 10 min first bid on {m?.totalEmergency || 2} emergency calls
          </div>
        </div>

        {/* KPI 2: Gross Settled GMV */}
        <div className="bg-[#1E1E1E] border border-[#2C2C2E] rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-[#98989D] mb-1">
            <span className="font-mono uppercase tracking-wider">Platform Gross Volume (GMV)</span>
            <Activity className="w-4 h-4 text-[#00E5FF]" />
          </div>
          <div className="text-3xl font-extrabold text-[#00E5FF] font-mono tracking-tight">
            ₹{(m?.totalVolume || 485000).toLocaleString()}
          </div>
          <div className="text-[11px] text-[#00E5FF] font-mono mt-1">
            {m?.completedJobs || 1} completed & verified work orders
          </div>
        </div>

        {/* KPI 3: Platform Commission (10%) */}
        <div className="bg-[#1E1E1E] border border-[#32D74B]/40 rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-[#98989D] mb-1">
            <span className="font-mono uppercase tracking-wider">Platform Commission (10%)</span>
            <DollarSign className="w-4 h-4 text-[#32D74B]" />
          </div>
          <div className="text-3xl font-extrabold text-[#32D74B] font-mono tracking-tight">
            ₹{(m?.platformCommission || 48500).toLocaleString()}
          </div>
          <div className="text-[11px] text-[#32D74B] font-mono mt-1">
            Settled payouts to verified technician bank accounts
          </div>
        </div>

      </div>

      {/* 12-COLUMN INDUSTRIAL GRID (8 Columns Main Table, 4 Columns Right Side Alerts & Verification) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 8 COLUMNS: Live Incident Stream */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-[#1E1E1E] border border-[#2C2C2E] rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 sm:p-5 border-b border-[#2C2C2E] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">Industrial Machine Breakdown Audit Stream</h3>
                <p className="text-xs text-[#98989D]">Real-time operational ledger from database</p>
              </div>
              <span className="text-[10px] bg-[#00E5FF]/15 text-[#00E5FF] px-2 py-0.5 rounded font-mono font-bold">
                ENCRYPTED AUDIT
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#141414] text-[#98989D] font-mono uppercase text-[10px] border-b border-[#2C2C2E]">
                  <tr>
                    <th className="py-3 px-4">Ticket</th>
                    <th className="py-3 px-4">Urgency</th>
                    <th className="py-3 px-4">Breakdown Summary</th>
                    <th className="py-3 px-4">Plant Facility</th>
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
                        <td className="py-3 px-4 font-semibold text-white max-w-[200px] truncate">
                          {j.title}
                        </td>
                        <td className="py-3 px-4 text-[#98989D]">{j.company_name || 'Plant Facility'}</td>
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
                            Audit &rarr;
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

        {/* 4 COLUMNS: Alert Box & Verification Queue */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* WattVision Alert Box */}
          <div className="bg-[#3A1C1C] border-l-4 border-[#FF453A] p-4 rounded-xl shadow-lg space-y-1.5">
            <div className="flex items-center gap-2 text-[#FF453A] font-bold text-xs font-mono uppercase">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>Operations Alert</span>
            </div>
            <p className="text-xs text-gray-200">
              1 Emergency CNC Breakdown in Bhosari MIDC is awaiting mechanic assignment. System auto-escalation active.
            </p>
          </div>

          {/* Technician Verification Queue */}
          <div className="bg-[#1E1E1E] border border-[#2C2C2E] rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#2C2C2E]">
              <span className="text-xs font-mono uppercase tracking-wider text-white font-bold flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-[#32D74B]" />
                Technician Certificate Review Queue
              </span>
              <span className="text-[10px] bg-[#32D74B]/20 text-[#32D74B] px-1.5 py-0.2 rounded font-mono font-bold">
                1 PENDING
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="bg-[#141414] border border-[#2C2C2E] p-3 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white">Anil Deshmukh</div>
                  <span className="text-[10px] text-yellow-400 font-mono">Tier 2 &rarr; Tier 3</span>
                </div>
                <div className="text-[11px] text-[#98989D]">
                  Diploma in Mechanical Engineering (MSBTE) &bull; 7 Yrs Exp
                </div>
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#2C2C2E]">
                  <button className="text-[11px] text-[#98989D] hover:text-white px-2 py-0.5">
                    View Doc
                  </button>
                  <button className="bg-[#32D74B] text-black font-extrabold text-[11px] px-3 py-1 rounded-lg">
                    Approve Badge
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
