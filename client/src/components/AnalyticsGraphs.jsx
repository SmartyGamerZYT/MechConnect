import React from 'react';
import { TrendingUp, Activity, Clock, DollarSign, CheckCircle2, ShieldCheck, LineChart } from 'lucide-react';

// Reusable SVG Line Graph Component
function SvgLineGraph({ data = [], valueKey = 'value', labelKey = 'label', strokeColor = '#0F172A', fillColor = 'rgba(15, 23, 42, 0.08)', formatValue = (v) => v, height = 180 }) {
  if (!data.length) return null;

  const width = 500;
  const paddingX = 40;
  const paddingY = 25;
  const graphWidth = width - paddingX * 2;
  const graphHeight = height - paddingY * 2;

  const values = data.map(d => Number(d[valueKey]) || 0);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values, 10);
  const range = maxVal - minVal || 1;

  // Calculate points
  const points = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1 || 1)) * graphWidth;
    const y = height - paddingY - ((Number(d[valueKey]) - minVal) / range) * graphHeight;
    return { x, y, value: d[valueKey], label: d[labelKey] };
  });

  // Construct SVG Path
  const pathD = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  // Construct Area Fill Path
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        {/* Horizontal Grid lines */}
        {[0, 0.33, 0.66, 1].map((pct, idx) => {
          const y = paddingY + pct * graphHeight;
          return (
            <line
              key={idx}
              x1={paddingX}
              y1={y}
              x2={width - paddingX}
              y2={y}
              stroke="#E2E8F0"
              strokeDasharray="4 4"
              strokeWidth="1"
            />
          );
        })}

        {/* Gradient Area */}
        <path d={areaD} fill={fillColor} />

        {/* Line Stroke */}
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data Points & Labels */}
        {points.map((pt, idx) => (
          <g key={idx} className="group cursor-pointer">
            <circle
              cx={pt.x}
              cy={pt.y}
              r="4.5"
              fill={strokeColor}
              stroke="#FFFFFF"
              strokeWidth="2"
              className="transition-transform group-hover:scale-150"
            />
            {/* Value Tooltip Label */}
            <text
              x={pt.x}
              y={pt.y - 10}
              textAnchor="middle"
              className="text-[9px] font-mono fill-slate-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {formatValue(pt.value)}
            </text>
            {/* Bottom X-axis Label */}
            <text
              x={pt.x}
              y={height - 8}
              textAnchor="middle"
              className="text-[10px] font-medium fill-slate-500"
            >
              {pt.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function AnalyticsGraphs({ role, data }) {
  if (!data) return null;

  if (role === 'company') {
    const monthlySpend = (data.monthlySpend || []).map(m => ({
      label: m.month,
      value: m.cost
    }));

    const categoryDistribution = (data.categoryDistribution || []).map(c => ({
      label: c.category.split(' ')[0],
      value: c.count
    }));

    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <LineChart className="w-4 h-4 text-slate-800" />
              <span>Plant Reliability & Maintenance Analysis</span>
            </h3>
            <div className="text-[11px] text-slate-500">Real-time expenditure trends and category failure curves</div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="font-medium text-slate-600">Mean Time to Repair: <b className="text-slate-900 font-mono">2.8 hrs</b></span>
            <span className="font-medium text-slate-600">Equipment Uptime: <b className="text-emerald-600 font-mono">99.4%</b></span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Spend Line Graph */}
          <div className="p-4 bg-slate-50/60 border border-slate-200/80 rounded-xl space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-slate-900" />
                Monthly Repair Expenditure (₹ Line Graph)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Trailing 6 Months</span>
            </div>

            <SvgLineGraph
              data={monthlySpend}
              valueKey="value"
              labelKey="label"
              strokeColor="#0F172A"
              fillColor="rgba(15, 23, 42, 0.08)"
              formatValue={(v) => `₹${Math.round(v/1000)}k`}
              height={180}
            />
          </div>

          {/* Category Incidents Line Graph */}
          <div className="p-4 bg-slate-50/60 border border-slate-200/80 rounded-xl space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-slate-900" />
                Failures by Machinery Taxonomy (Line Graph)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Incidents Count</span>
            </div>

            <SvgLineGraph
              data={categoryDistribution}
              valueKey="value"
              labelKey="label"
              strokeColor="#2563EB"
              fillColor="rgba(37, 99, 235, 0.08)"
              formatValue={(v) => `${v} failures`}
              height={180}
            />
          </div>
        </div>
      </div>
    );
  }

  if (role === 'mechanic') {
    const monthlyEarnings = (data.monthlyEarnings || []).map(m => ({
      label: m.month,
      value: m.earnings
    }));

    const specialtyDistribution = (data.specialtyDistribution || []).map(s => ({
      label: s.category.split(' ')[0],
      value: s.share
    }));

    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <LineChart className="w-4 h-4 text-slate-800" />
              <span>Technician Performance & Revenue Analysis</span>
            </h3>
            <div className="text-[11px] text-slate-500">Historical payout growth curves and job category distribution</div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="font-medium text-slate-600">Quote Win Rate: <b className="text-emerald-600 font-mono">{data.winRate}%</b></span>
            <span className="font-medium text-slate-600">First-Time Fix Rate: <b className="text-sky-600 font-mono">{data.firstTimeFixRate}%</b></span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Earnings Line Graph */}
          <div className="p-4 bg-slate-50/60 border border-slate-200/80 rounded-xl space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-slate-900" />
                Monthly Field Earnings (₹ Line Graph)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">6 Month Curve</span>
            </div>

            <SvgLineGraph
              data={monthlyEarnings}
              valueKey="value"
              labelKey="label"
              strokeColor="#0F172A"
              fillColor="rgba(15, 23, 42, 0.08)"
              formatValue={(v) => `₹${Math.round(v/1000)}k`}
              height={180}
            />
          </div>

          {/* Specialty Share Line Graph */}
          <div className="p-4 bg-slate-50/60 border border-slate-200/80 rounded-xl space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-600" />
                Specialty Work Share (% Line Graph)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Completed Repairs</span>
            </div>

            <SvgLineGraph
              data={specialtyDistribution}
              valueKey="value"
              labelKey="label"
              strokeColor="#059669"
              fillColor="rgba(5, 150, 105, 0.08)"
              formatValue={(v) => `${v}%`}
              height={180}
            />
          </div>
        </div>
      </div>
    );
  }

  // Admin Role Line Graphs
  const platformTrends = (data.platformTrends || []).map(p => ({
    label: p.month,
    value: p.volume
  }));

  const categoryDistribution = (data.categoryDistribution || []).map(c => ({
    label: c.category.split(' ')[0],
    value: c.count
  }));

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <LineChart className="w-4 h-4 text-slate-800" />
            <span>Platform-Wide Operations & Financial Analysis</span>
          </h3>
          <div className="text-[11px] text-slate-500">Cross-plant transaction trajectory and incident load curves</div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="font-medium text-slate-600">Platform Resolution: <b className="text-emerald-600 font-mono">98.2%</b></span>
          <span className="font-medium text-slate-600">Active Facilities: <b className="text-slate-900 font-mono">{data.activePlants || 12}</b></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GMV Volume Line Graph */}
        <div className="p-4 bg-slate-50/60 border border-slate-200/80 rounded-xl space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-slate-900" />
              Platform Gross Volume (₹ Line Graph)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Monthly Trajectory</span>
          </div>

          <SvgLineGraph
            data={platformTrends}
            valueKey="value"
            labelKey="label"
            strokeColor="#0F172A"
            fillColor="rgba(15, 23, 42, 0.08)"
            formatValue={(v) => `₹${Math.round(v/1000)}k`}
            height={180}
          />
        </div>

        {/* Category Breakdown Line Graph */}
        <div className="p-4 bg-slate-50/60 border border-slate-200/80 rounded-xl space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-sky-600" />
              Breakdowns by Machinery Taxonomy (Line Graph)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Work Order Volume</span>
          </div>

          <SvgLineGraph
            data={categoryDistribution}
            valueKey="value"
            labelKey="label"
            strokeColor="#0284C7"
            fillColor="rgba(2, 132, 199, 0.08)"
            formatValue={(v) => `${v} jobs`}
            height={180}
          />
        </div>
      </div>
    </div>
  );
}
