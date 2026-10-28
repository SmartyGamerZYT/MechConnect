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
  Image as ImageIcon
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

export default function PostJobModal({ isOpen, onClose, currentUser, onJobCreated }) {
  const [formData, setFormData] = useState({
    title: '',
    machine_category: MACHINE_CATEGORIES[0],
    machine_brand: '',
    machine_model: '',
    fault_description: '',
    urgency: 'EMERGENCY',
    address: PRESET_ZONES[0].name,
    city: PRESET_ZONES[0].city,
    lat: PRESET_ZONES[0].lat,
    lng: PRESET_ZONES[0].lng,
    budget_min: '',
    budget_max: '',
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
      setError('Please fill in breakdown title and description.');
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
    <div className="fixed inset-0 z-[1200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#1E1E1E] border border-[#2C2C2E] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative my-8">
        
        {/* Header */}
        <div className="p-5 border-b border-[#2C2C2E] flex items-center justify-between bg-[#181818]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FF453A]/20 border border-[#FF453A]/40 flex items-center justify-center text-[#FF453A]">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base leading-tight">Post Breakdown Job (&lt; 2 Minutes)</h3>
              <p className="text-xs text-[#98989D]">Instantly alert certified nearby technicians and mechanics</p>
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
          <div className="mx-6 mt-4 p-3 rounded-lg bg-[#FF453A]/15 border border-[#FF453A]/40 text-[#FF453A] text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Urgency Selector */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#98989D] mb-2">
              Select Response Protocol SLA <span className="text-[#FF453A]">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, urgency: 'EMERGENCY' })}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  formData.urgency === 'EMERGENCY'
                    ? 'bg-[#FF453A]/15 border-[#FF453A] shadow-[0_0_12px_rgba(255,69,58,0.3)]'
                    : 'bg-[#121212] border-[#2C2C2E] hover:border-[#404040]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#FF453A] flex items-center gap-1">
                    🔴 EMERGENCY
                  </span>
                  <span className="text-[10px] bg-[#FF453A]/20 text-[#FF453A] px-1.5 py-0.2 rounded font-mono font-bold">&lt; 1 HR</span>
                </div>
                <p className="text-[11px] text-[#98989D] leading-tight">Instant push to top-tier verified mechanics within 20km.</p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, urgency: 'SAME_DAY' })}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  formData.urgency === 'SAME_DAY'
                    ? 'bg-[#FF9F0A]/15 border-[#FF9F0A] shadow-[0_0_12px_rgba(255,159,10,0.3)]'
                    : 'bg-[#121212] border-[#2C2C2E] hover:border-[#404040]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#FF9F0A]">🟠 SAME DAY</span>
                  <span className="text-[10px] bg-[#FF9F0A]/20 text-[#FF9F0A] px-1.5 py-0.2 rounded font-mono font-bold">&lt; 6-8 HRS</span>
                </div>
                <p className="text-[11px] text-[#98989D] leading-tight">Same-day technician arrival before current shift end.</p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, urgency: 'SCHEDULED' })}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  formData.urgency === 'SCHEDULED'
                    ? 'bg-[#32D74B]/15 border-[#32D74B] shadow-[0_0_12px_rgba(50,215,75,0.3)]'
                    : 'bg-[#121212] border-[#2C2C2E] hover:border-[#404040]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#32D74B]">🟢 SCHEDULED</span>
                  <span className="text-[10px] bg-[#32D74B]/20 text-[#32D74B] px-1.5 py-0.2 rounded font-mono font-bold">PLANNED</span>
                </div>
                <p className="text-[11px] text-[#98989D] leading-tight">Preventative maintenance, routine overhaul or upgrade.</p>
              </button>
            </div>
          </div>

          {/* Machine Category & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#98989D] mb-1.5">
                Machine Taxonomy Category <span className="text-[#FF453A]">*</span>
              </label>
              <select
                value={formData.machine_category}
                onChange={(e) => setFormData({ ...formData, machine_category: e.target.value })}
                className="w-full bg-[#121212] border border-[#2C2C2E] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00E5FF] transition"
              >
                {MACHINE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#98989D] mb-1.5">
                Breakdown Headline / Title <span className="text-[#FF453A]">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 5-Axis Spindle Jam & Error Code E-402"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full bg-[#121212] border border-[#2C2C2E] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00E5FF] transition placeholder-[#505050]"
              />
            </div>
          </div>

          {/* Brand, Model */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#98989D] mb-1.5">
                Machine Brand / OEM
              </label>
              <input
                type="text"
                placeholder="e.g. Haas, DMG Mori, Siemens, Atlas Copco"
                value={formData.machine_brand}
                onChange={(e) => setFormData({ ...formData, machine_brand: e.target.value })}
                className="w-full bg-[#121212] border border-[#2C2C2E] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00E5FF] transition placeholder-[#505050]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#98989D] mb-1.5">
                Model Number / Controller
              </label>
              <input
                type="text"
                placeholder="e.g. VF-4SS / Sinumerik 840D"
                value={formData.machine_model}
                onChange={(e) => setFormData({ ...formData, machine_model: e.target.value })}
                className="w-full bg-[#121212] border border-[#2C2C2E] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00E5FF] transition placeholder-[#505050]"
              />
            </div>
          </div>

          {/* Fault Description */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#98989D] mb-1.5">
              Fault Description & Symptoms <span className="text-[#FF453A]">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Describe exact error code, unusual sounds, fluid leakage, or mechanical lockup..."
              value={formData.fault_description}
              onChange={(e) => setFormData({ ...formData, fault_description: e.target.value })}
              required
              className="w-full bg-[#121212] border border-[#2C2C2E] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#00E5FF] transition placeholder-[#505050]"
            />
          </div>

          {/* Location / Industrial Zone */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#98989D] mb-1.5">
              Plant / Facility Location Pin
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                onChange={handleZoneSelect}
                className="w-full bg-[#121212] border border-[#2C2C2E] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00E5FF]"
              >
                {PRESET_ZONES.map((zone) => (
                  <option key={zone.name} value={zone.name}>{zone.name}</option>
                ))}
              </select>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Bay / Shop Floor Details"
                className="w-full bg-[#121212] border border-[#2C2C2E] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00E5FF]"
              />
            </div>
          </div>

          {/* Photos Upload & Gallery */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#98989D] mb-1.5">
              Attach Breakdown Photos / Nameplate / Error Codes (Saved to Database)
            </label>
            <div className="flex flex-wrap items-center gap-3">
              {formData.images.map((imgUrl, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-[#00E5FF]/40 group">
                  <img src={imgUrl} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute inset-0 bg-red-900/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <label className="w-16 h-16 rounded-lg border border-dashed border-[#2C2C2E] hover:border-[#00E5FF] flex flex-col items-center justify-center text-[#98989D] hover:text-[#00E5FF] cursor-pointer transition bg-[#121212]">
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
                Estimated Budget Range (₹)
              </label>
              <label className="flex items-center gap-1.5 text-xs text-[#00E5FF] cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_budget_open}
                  onChange={(e) => setFormData({ ...formData, is_budget_open: e.target.checked })}
                  className="accent-[#00E5FF]"
                />
                Leave open for mechanic bids
              </label>
            </div>

            {!formData.is_budget_open && (
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Min Budget (₹) e.g. 5000"
                  value={formData.budget_min}
                  onChange={(e) => setFormData({ ...formData, budget_min: e.target.value })}
                  className="w-full bg-[#121212] border border-[#2C2C2E] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00E5FF]"
                />
                <input
                  type="number"
                  placeholder="Max Budget (₹) e.g. 12000"
                  value={formData.budget_max}
                  onChange={(e) => setFormData({ ...formData, budget_max: e.target.value })}
                  className="w-full bg-[#121212] border border-[#2C2C2E] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00E5FF]"
                />
              </div>
            )}
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-[#2C2C2E] flex items-center justify-between">
            <span className="text-[11px] text-[#98989D]">
              ⚡ Auto-matches up to 5 certified technicians in real time
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
                className="bg-[#00E5FF] hover:bg-[#00c5dc] text-black font-extrabold text-xs px-6 py-2.5 rounded-xl transition shadow-[0_0_15px_rgba(0,229,255,0.4)] cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'DISPATCHING BREAKDOWN...' : 'CONFIRM & BROADCAST JOB'}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}

