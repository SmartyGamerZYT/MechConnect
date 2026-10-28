import React, { useState } from 'react';
import {
  X,
  Upload,
  AlertTriangle,
  Clock,
  Calendar,
  CheckCircle2,
  DollarSign,
  MapPin,
  Cpu,
  Zap,
  Image as ImageIcon,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { api } from '../services/api';

const MACHINE_CATEGORIES = [
  'CNC Machines (Lathe, Milling, Turning, 5-Axis)',
  'Hydraulic Systems (Press, Cylinder, Pump, Valves)',
  'Compressors & Pneumatics (Screw, Piston, Centrifugal)',
  'Electrical Panels & PLCs (Siemens, Fanuc, Allen-Bradley)',
  'Conveyor & Material Handling Systems',
  'Industrial Generators & Power Backup',
  'Boilers & Heat Exchangers',
  'Robotic Cells & Automation',
  'HVAC & Industrial Chillers',
  'Packaging & Bottling Machinery'
];

const PRESET_ZONES = [
  { name: 'Plot 42, Bhosari MIDC, Pune', lat: 18.6276, lng: 73.8447, city: 'Pune' },
  { name: 'Phase II, Chakan Industrial Hub, Pune', lat: 18.7597, lng: 73.8183, city: 'Pune' },
  { name: 'Unit 4, Bhiwandi Logistics Park, Mumbai', lat: 19.2967, lng: 73.0631, city: 'Mumbai' },
  { name: 'Plot 18, Ambattur Industrial Estate, Chennai', lat: 13.0882, lng: 80.1609, city: 'Chennai' },
  { name: 'Peenya Industrial Area, Bangalore', lat: 13.0285, lng: 77.5195, city: 'Bangalore' }
];

export default function PostJobModal({ isOpen, onClose, currentUser, mechanics = [], onJobCreated }) {
  const [formData, setFormData] = useState({
    title: '',
    machine_category: MACHINE_CATEGORIES[0],
    machine_brand: '',
    machine_model: '',
    serial_number: '',
    asset_tag: '',
    year_of_manufacture: '2021',
    operating_hours: '14,200 hrs',
    production_impact: 'TOTAL_STOPPAGE',
    error_code: '',
    hiring_mode: 'BIDDING', // 'BIDDING' or 'DIRECT'
    direct_assigned_mechanic_id: mechanics[0]?.user_id || '',
    fault_description: '',
    urgency: 'EMERGENCY',
    address: PRESET_ZONES[0].name,
    city: PRESET_ZONES[0].city,
    lat: PRESET_ZONES[0].lat,
    lng: PRESET_ZONES[0].lng,
    budget_min: '6000',
    budget_max: '12000',
    is_budget_open: false,
    images: []
  });

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleZoneSelect = (e) => {
    const selected = PRESET_ZONES.find(z => z.name === e.target.value);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        address: selected.name,
        city: selected.city,
        lat: selected.lat,
        lng: selected.lng
      }));
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploading(true);
    setError(null);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const res = await api.uploadFile(file, currentUser.id, 'job');
        if (res.url) {
          uploadedUrls.push(res.url);
        }
      }
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }));
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.fault_description) {
      setError('Please fill in machine breakdown title and fault description.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        company_user_id: currentUser.id,
        budget_min: formData.is_budget_open ? null : parseFloat(formData.budget_min) || null,
        budget_max: formData.is_budget_open ? null : parseFloat(formData.budget_max) || null
      };

      const res = await api.createJob(payload);
      if (res.jobId) {
        onJobCreated(res.jobId);
        onClose();
      } else {
        setError(res.error || 'Failed to submit breakdown.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while submitting breakdown.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#1E1E1E] border border-[#2C2C2E] rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl relative my-auto max-h-[94vh] flex flex-col">
        
        {/* Header - WattVision Style */}
        <div className="p-4 sm:p-5 border-b border-[#2C2C2E] flex items-center justify-between bg-[#181818] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/40 flex items-center justify-center text-[#00E5FF]">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base leading-tight">List Machine Breakdown & Dispatch Protocol</h3>
              <p className="text-xs text-[#98989D]">Complete machinery specification, diagnostic data, and hiring mode</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#252525] hover:bg-[#303030] text-[#98989D] hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-[#3A1C1C] border-l-4 border-[#FF453A] text-[#FF453A] text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          
          {/* HIRING MODE SELECTION (Open Bidding vs. Urban Company Direct Hire) */}
          <div className="bg-[#141414] border border-[#2C2C2E] rounded-xl p-4">
            <label className="block text-xs font-mono uppercase tracking-wider text-[#00E5FF] font-bold mb-2">
              Step 1: Choose Hiring System
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              <button
                type="button"
                onClick={() => setFormData({ ...formData, hiring_mode: 'BIDDING' })}
                className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                  formData.hiring_mode === 'BIDDING'
                    ? 'bg-[#00E5FF]/15 border-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.25)]'
                    : 'bg-[#1E1E1E] border-[#2C2C2E] hover:border-[#404040]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00E5FF]"></span>
                    OPEN BIDDING PROTOCOL
                  </span>
                  <span className="text-[10px] bg-[#00E5FF]/20 text-[#00E5FF] px-1.5 py-0.2 rounded font-mono font-bold">
                    COMPETITIVE
                  </span>
                </div>
                <p className="text-[11px] text-[#98989D] leading-relaxed">
                  Broadcasts fault to certified mechanics nearby. Multiple technicians submit quotes & ETAs. You review and accept the best bid.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, hiring_mode: 'DIRECT' })}
                className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                  formData.hiring_mode === 'DIRECT'
                    ? 'bg-[#32D74B]/15 border-[#32D74B] shadow-[0_0_15px_rgba(50,215,75,0.25)]'
                    : 'bg-[#1E1E1E] border-[#2C2C2E] hover:border-[#404040]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#32D74B] animate-pulse"></span>
                    DIRECT HIRE (Urban Company Style)
                  </span>
                  <span className="text-[10px] bg-[#32D74B]/20 text-[#32D74B] px-1.5 py-0.2 rounded font-mono font-bold">
                    INSTANT LOCK
                  </span>
                </div>
                <p className="text-[11px] text-[#98989D] leading-relaxed">
                  1-Click direct booking of a top-rated certified technician. Pre-authorizes diagnostic fee and immediately dispatches technician.
                </p>
              </button>

            </div>

            {/* Direct Technician Picker if DIRECT mode chosen */}
            {formData.hiring_mode === 'DIRECT' && (
              <div className="mt-3 pt-3 border-t border-[#2C2C2E]">
                <label className="block text-[11px] font-mono text-[#32D74B] font-bold mb-1.5">
                  Select Certified Technician for Direct Dispatch:
                </label>
                <select
                  value={formData.direct_assigned_mechanic_id}
                  onChange={(e) => setFormData({ ...formData, direct_assigned_mechanic_id: e.target.value })}
                  className="w-full bg-[#1E1E1E] border border-[#32D74B]/50 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  {mechanics.map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.full_name} ({m.city}) &bull; ⭐ {m.rating} ({m.total_jobs_completed} jobs) &bull; ₹{m.hourly_rate}/hr bench
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* RESPONSE PROTOCOL SLA (WattVision alert styling) */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#98989D] mb-2">
              Response Protocol SLA <span className="text-[#FF453A]">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, urgency: 'EMERGENCY' })}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  formData.urgency === 'EMERGENCY'
                    ? 'bg-[#3A1C1C] border-[#FF453A] border-l-4 shadow-[0_0_12px_rgba(255,69,58,0.3)]'
                    : 'bg-[#121212] border-[#2C2C2E]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#FF453A]">🔴 EMERGENCY</span>
                  <span className="text-[10px] bg-[#FF453A]/20 text-[#FF453A] px-1 py-0.2 rounded font-mono font-bold">&lt; 1 HR</span>
                </div>
                <p className="text-[11px] text-[#98989D]">Immediate dispatch for halted production line.</p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, urgency: 'SAME_DAY' })}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  formData.urgency === 'SAME_DAY'
                    ? 'bg-[#FF9F0A]/15 border-[#FF9F0A] border-l-4 shadow-[0_0_12px_rgba(255,159,10,0.3)]'
                    : 'bg-[#121212] border-[#2C2C2E]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#FF9F0A]">🟠 SAME DAY</span>
                  <span className="text-[10px] bg-[#FF9F0A]/20 text-[#FF9F0A] px-1 py-0.2 rounded font-mono font-bold">&lt; 6-8 HRS</span>
                </div>
                <p className="text-[11px] text-[#98989D]">Technician arrival before shift end.</p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, urgency: 'SCHEDULED' })}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  formData.urgency === 'SCHEDULED'
                    ? 'bg-[#32D74B]/15 border-[#32D74B] border-l-4 shadow-[0_0_12px_rgba(50,215,75,0.3)]'
                    : 'bg-[#121212] border-[#2C2C2E]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#32D74B]">🟢 SCHEDULED</span>
                  <span className="text-[10px] bg-[#32D74B]/20 text-[#32D74B] px-1 py-0.2 rounded font-mono font-bold">PLANNED</span>
                </div>
                <p className="text-[11px] text-[#98989D]">Preventative overhaul & routine servicing.</p>
              </button>
            </div>
          </div>

          {/* Machine Category & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#98989D] mb-1.5">
                Machine Category Taxonomy <span className="text-[#FF453A]">*</span>
              </label>
              <select
                value={formData.machine_category}
                onChange={(e) => setFormData({ ...formData, machine_category: e.target.value })}
                className="w-full bg-[#121212] border border-[#2C2C2E] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00E5FF]"
              >
                {MACHINE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#98989D] mb-1.5">
                Incident Headline / Title <span className="text-[#FF453A]">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 5-Axis CNC Spindle Seizure & Error E-402"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full bg-[#121212] border border-[#2C2C2E] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00E5FF]"
              />
            </div>
          </div>

          {/* Machine Details Grid (Every Detail) */}
          <div className="bg-[#141414] border border-[#2C2C2E] rounded-xl p-4 space-y-3">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#00E5FF] font-bold">
              Step 2: Machinery Technical Telemetry & Identifiers
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-mono text-[#98989D] mb-1">Brand / OEM</label>
                <input
                  type="text"
                  placeholder="e.g. Haas, DMG Mori"
                  value={formData.machine_brand}
                  onChange={(e) => setFormData({ ...formData, machine_brand: e.target.value })}
                  className="w-full bg-[#1E1E1E] border border-[#2C2C2E] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00E5FF]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-[#98989D] mb-1">Model / Controller</label>
                <input
                  type="text"
                  placeholder="e.g. VF-4SS / 840D"
                  value={formData.machine_model}
                  onChange={(e) => setFormData({ ...formData, machine_model: e.target.value })}
                  className="w-full bg-[#1E1E1E] border border-[#2C2C2E] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00E5FF]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-[#98989D] mb-1">Serial Number</label>
                <input
                  type="text"
                  placeholder="e.g. SN-98442-B"
                  value={formData.serial_number}
                  onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                  className="w-full bg-[#1E1E1E] border border-[#2C2C2E] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00E5FF]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-[#98989D] mb-1">Asset Tag</label>
                <input
                  type="text"
                  placeholder="e.g. PLANT-CNC-04"
                  value={formData.asset_tag}
                  onChange={(e) => setFormData({ ...formData, asset_tag: e.target.value })}
                  className="w-full bg-[#1E1E1E] border border-[#2C2C2E] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00E5FF]"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-mono text-[#98989D] mb-1">Manufacture Year</label>
                <input
                  type="text"
                  placeholder="e.g. 2021"
                  value={formData.year_of_manufacture}
                  onChange={(e) => setFormData({ ...formData, year_of_manufacture: e.target.value })}
                  className="w-full bg-[#1E1E1E] border border-[#2C2C2E] rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-[#98989D] mb-1">Operating Hours</label>
                <input
                  type="text"
                  placeholder="e.g. 14,200 hrs"
                  value={formData.operating_hours}
                  onChange={(e) => setFormData({ ...formData, operating_hours: e.target.value })}
                  className="w-full bg-[#1E1E1E] border border-[#2C2C2E] rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-[#98989D] mb-1">Production Impact</label>
                <select
                  value={formData.production_impact}
                  onChange={(e) => setFormData({ ...formData, production_impact: e.target.value })}
                  className="w-full bg-[#1E1E1E] border border-[#2C2C2E] rounded-lg px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="TOTAL_STOPPAGE">🔴 Line Stoppage (100% Down)</option>
                  <option value="PARTIAL_HALT">🟠 Partial Halt (Reduced Speed)</option>
                  <option value="QUALITY_DEFECT">🟡 Quality / Tolerance Defect</option>
                </select>
              </div>
            </div>
          </div>

          {/* Fault Description & Error Code */}
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#98989D] mb-1">
                  Alarm / Error Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. E-402 / 201 Alarm"
                  value={formData.error_code}
                  onChange={(e) => setFormData({ ...formData, error_code: e.target.value })}
                  className="w-full bg-[#121212] border border-[#2C2C2E] rounded-xl px-3 py-2 text-xs text-[#00E5FF] font-mono focus:border-[#00E5FF]"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#98989D] mb-1">
                  Plant / Floor Address
                </label>
                <select
                  onChange={handleZoneSelect}
                  className="w-full bg-[#121212] border border-[#2C2C2E] rounded-xl px-3 py-2 text-xs text-white"
                >
                  {PRESET_ZONES.map((zone) => (
                    <option key={zone.name} value={zone.name}>{zone.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#98989D] mb-1.5">
                Detailed Failure Mode & Symptoms <span className="text-[#FF453A]">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Describe exact sounds, vibration, hydraulic pressure drops, or electrical sparks..."
                value={formData.fault_description}
                onChange={(e) => setFormData({ ...formData, fault_description: e.target.value })}
                required
                className="w-full bg-[#121212] border border-[#2C2C2E] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#00E5FF]"
              />
            </div>
          </div>

          {/* Photos Upload (Saved in Database + Disk) */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#98989D] mb-1.5 flex items-center justify-between">
              <span>Attach Incident Photos, Control Panel & Nameplate</span>
              <span className="text-[10px] text-[#00E5FF] font-mono">Saved in DB & Served Statically</span>
            </label>
            <div className="flex flex-wrap items-center gap-3">
              {formData.images.map((imgUrl, i) => (
                <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#00E5FF]/40 group">
                  <img src={imgUrl} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute inset-0 bg-red-950/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <label className="w-16 h-16 rounded-xl border border-dashed border-[#2C2C2E] hover:border-[#00E5FF] flex flex-col items-center justify-center text-[#98989D] hover:text-[#00E5FF] cursor-pointer transition bg-[#121212]">
                <Upload className="w-5 h-5 mb-0.5" />
                <span className="text-[9px] font-mono">{uploading ? '...' : '+ Upload'}</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Budget Range */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-[#98989D]">
                {formData.hiring_mode === 'DIRECT' ? 'Fixed Direct Hire Diagnostic / Repair Fee (₹)' : 'Estimated Budget Range (₹)'}
              </label>
              {formData.hiring_mode === 'BIDDING' && (
                <label className="flex items-center gap-1.5 text-xs text-[#00E5FF] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_budget_open}
                    onChange={(e) => setFormData({ ...formData, is_budget_open: e.target.checked })}
                    className="accent-[#00E5FF]"
                  />
                  Leave open for mechanic bids
                </label>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                placeholder="Min Budget (₹) e.g. 6000"
                value={formData.budget_min}
                onChange={(e) => setFormData({ ...formData, budget_min: e.target.value })}
                className="w-full bg-[#121212] border border-[#2C2C2E] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00E5FF]"
              />
              {formData.hiring_mode === 'BIDDING' && !formData.is_budget_open && (
                <input
                  type="number"
                  placeholder="Max Budget (₹) e.g. 15000"
                  value={formData.budget_max}
                  onChange={(e) => setFormData({ ...formData, budget_max: e.target.value })}
                  className="w-full bg-[#121212] border border-[#2C2C2E] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00E5FF]"
                />
              )}
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-[#2C2C2E] flex items-center justify-between flex-shrink-0">
            <span className="text-[11px] text-[#98989D]">
              {formData.hiring_mode === 'DIRECT' ? '⚡ Direct booking with instant locked quote card' : '⚡ Dispatches to nearby certified technicians to submit bids'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#98989D] hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || uploading}
                className={`font-extrabold text-xs px-6 py-2.5 rounded-xl transition cursor-pointer shadow-lg disabled:opacity-50 ${
                  formData.hiring_mode === 'DIRECT'
                    ? 'bg-[#32D74B] hover:bg-[#2cb242] text-black shadow-[0_0_15px_rgba(50,215,75,0.3)]'
                    : 'bg-[#00E5FF] hover:bg-[#00c5dc] text-black shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                }`}
              >
                {submitting
                  ? 'DISPATCHING...'
                  : formData.hiring_mode === 'DIRECT'
                  ? 'CONFIRM DIRECT HIRE & DISPATCH'
                  : 'BROADCAST BREAKDOWN FOR BIDS'}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
