import React from 'react';
import { TrendingUp, BarChart3, Clock, DollarSign, CheckCircle2, ShieldCheck, Activity } from 'lucide-react';

export default function AnalyticsGraphs({ role, data }) {
  if (!data) return null;

  if (role === 'company') {
    const monthlySpend = data.monthlySpend || [];
    const maxSpend = Math.max(...monthlySpend.map(m => m.cost), 35000);
    const categoryDistribution = data.categoryDistribution || [];
    const maxCatCount = Math.max(...categoryDistribution.map(c => c.count), 5);

    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Industrial Maintenance Analytics</h3>
            <div className="text-[11px] text-slate-500">Real-time breakdown trends and expenditure monitoring</div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="font-medium text-slate-600">MTTR: <b className="text-slate-900 font-mono">2.8 hrs</b></span>
            <span className="font-medium text-slate-600">Uptime: <b className="text-emerald-600 font-mono">99.4%</b></span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Spend Chart */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-slate-900" />
                Monthly Repair Expense (₹)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Last 6 Months</span>
            </div>

            <div className="h-40 flex items-end gap-3 pt-6 border-b border-slate-200">
              {monthlySpend.map((item, idx) => {
                const heightPct = Math.round((item.cost / maxSpend) * 100);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                    <div className="text-[9px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition">
                      ₹{Math.round(item.cost / 1000)}k
                    </div>
                    <div
                      style={{ height: `${Math.max(12, heightPct)}%` }}
                      className="w-full bg-slate-900 hover:bg-slate-700 rounded-t transition-all cursor-pointer relative"
                      title={`${item.month}: ₹${item.cost.toLocaleString()} (${item.hoursDown} hrs downtime)`}
                    />
                    <div className="text-[10px] text-slate-600 font-medium">{item.month}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category Distribution */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
              <span className="flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-slate-900" />
                Incidents by Machine Category
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Total Recorded</span>
            </div>

            <div className="space-y-2.5 pt-1">
              {categoryDistribution.map((cat, idx) => {
                const widthPct = Math.round((cat.count / maxCatCount) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-700">
                      <span className="font-medium">{cat.category}</span>
                      <span className="font-mono text-slate-500 text-[11px]">{cat.count} breakdowns</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.max(10, widthPct)}%` }}
                        className="h-full bg-slate-800 rounded-full transition-all"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (role === 'mechanic') {
    const monthlyEarnings = data.monthlyEarnings || [];
    const maxEarnings = Math.max(...monthlyEarnings.map(m => m.earnings), 55000);
    const specialtyDistribution = data.specialtyDistribution || [];

    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Performance & Earnings Analytics</h3>
            <div className="text-[11px] text-slate-500">Field response metrics and verified payout tracking</div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="font-medium text-slate-600">Win Rate: <b className="text-emerald-600 font-mono">{data.winRate}%</b></span>
            <span className="font-medium text-slate-600">First-Time Fix: <b className="text-sky-600 font-mono">{data.firstTimeFixRate}%</b></span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Earnings Chart */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
              <span className="flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-slate-900" />
                Monthly Earnings (₹)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Last 6 Months</span>
            </div>

            <div className="h-40 flex items-end gap-3 pt-6 border-b border-slate-200">
              {monthlyEarnings.map((item, idx) => {
                const heightPct = Math.round((item.earnings / maxEarnings) * 100);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                    <div className="text-[9px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition">
                      ₹{Math.round(item.earnings / 1000)}k
                    </div>
                    <div
                      style={{ height: `${Math.max(12, heightPct)}%` }}
                      className="w-full bg-slate-900 hover:bg-slate-700 rounded-t transition-all cursor-pointer relative"
                      title={`${item.month}: ₹${item.earnings.toLocaleString()} (${item.jobs} jobs)`}
                    />
                    <div className="text-[10px] text-slate-600 font-medium">{item.month}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Specialty Share */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-slate-900" />
                Specialty Breakdown Share
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Work Completed</span>
            </div>

            <div className="space-y-2.5 pt-1">
              {specialtyDistribution.map((spec, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-700">
                    <span className="font-medium">{spec.category}</span>
                    <span className="font-mono text-slate-500 text-[11px]">{spec.share}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${spec.share}%` }}
                      className="h-full bg-slate-800 rounded-full transition-all"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Admin Role Analytics
  const platformTrends = data.platformTrends || [];
  const maxVolume = Math.max(...platformTrends.map(p => p.volume), 400000);
  const categoryDistribution = data.categoryDistribution || [];
  const maxCatCount = Math.max(...categoryDistribution.map(c => c.count), 50);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">Platform Volume & Operational Analytics</h3>
          <div className="text-[11px] text-slate-500">Cross-plant transaction volume and dispatch performance</div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="font-medium text-slate-600">Resolution Rate: <b className="text-emerald-600 font-mono">98.2%</b></span>
          <span className="font-medium text-slate-600">Active Facilities: <b className="text-slate-900 font-mono">{data.activePlants || 12}</b></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GMV Volume Chart */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-slate-900" />
              Platform Gross Volume (₹)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Monthly Trajectory</span>
          </div>

          <div className="h-40 flex items-end gap-3 pt-6 border-b border-slate-200">
            {platformTrends.map((item, idx) => {
              const heightPct = Math.round((item.volume / maxVolume) * 100);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                  <div className="text-[9px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition">
                    ₹{Math.round(item.volume / 1000)}k
                  </div>
                  <div
                    style={{ height: `${Math.max(12, heightPct)}%` }}
                    className="w-full bg-slate-900 hover:bg-slate-700 rounded-t transition-all cursor-pointer relative"
                    title={`${item.month}: ₹${item.volume.toLocaleString()} (${item.jobs} work orders)`}
                  />
                  <div className="text-[10px] text-slate-600 font-medium">{item.month}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Breakdown */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
            <span className="flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-slate-900" />
              Breakdowns by Machinery Taxonomy
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Platform-wide</span>
          </div>

          <div className="space-y-2.5 pt-1">
            {categoryDistribution.map((cat, idx) => {
              const widthPct = Math.round((cat.count / maxCatCount) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-700">
                    <span className="font-medium">{cat.category}</span>
                    <span className="font-mono text-slate-500 text-[11px]">{cat.count} listings</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.max(10, widthPct)}%` }}
                      className="h-full bg-slate-800 rounded-full transition-all"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

