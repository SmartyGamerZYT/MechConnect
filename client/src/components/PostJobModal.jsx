import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, AlertTriangle, MapPin, Navigation, CheckCircle2 } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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

// Small Interactive Map Component for picking machine location
function SmallMapLocationPicker({ lat, lng, onLocationChange }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerInstance = useRef(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstance.current) {
      if (mapRef.current._leaflet_id) {
        delete mapRef.current._leaflet_id;
      }

      const map = L.map(mapRef.current, {
        center: [lat || 18.6276, lng || 73.8447],
        zoom: 13,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      const pinIcon = L.divIcon({
        className: 'custom-picker-marker',
        html: `
          <div style="background-color: #0F172A; width: 30px; height: 30px; border-radius: 50%; border: 3px solid #22C55E; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.35); color: white; font-weight: 700; font-size: 10px;">
            PIN
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      const marker = L.marker([lat || 18.6276, lng || 73.8447], {
        draggable: true,
        icon: pinIcon
      }).addTo(map);

      marker.on('dragend', (e) => {
        const { lat: newLat, lng: newLng } = e.target.getLatLng();
        onLocationChange(parseFloat(newLat.toFixed(5)), parseFloat(newLng.toFixed(5)));
      });

      map.on('click', (e) => {
        const { lat: newLat, lng: newLng } = e.latlng;
        marker.setLatLng([newLat, newLng]);
        onLocationChange(parseFloat(newLat.toFixed(5)), parseFloat(newLng.toFixed(5)));
      });

      mapInstance.current = map;
      markerInstance.current = marker;

      // Invalidate size after modal renders to ensure full tiles render
      setTimeout(() => {
        try { map.invalidateSize(); } catch (err) {}
      }, 250);
    } else {
      if (markerInstance.current) {
        markerInstance.current.setLatLng([lat, lng]);
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      if (mapInstance.current) {
        try { mapInstance.current.remove(); } catch (e) {}
        mapInstance.current = null;
      }
    };
  }, []);

  const handleLocateMe = (e) => {
    e.preventDefault();
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const newLat = parseFloat(pos.coords.latitude.toFixed(5));
        const newLng = parseFloat(pos.coords.longitude.toFixed(5));
        if (mapInstance.current && markerInstance.current) {
          mapInstance.current.flyTo([newLat, newLng], 14, { duration: 1 });
          markerInstance.current.setLatLng([newLat, newLng]);
        }
        onLocationChange(newLat, newLng);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <label className="font-semibold text-slate-800 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-slate-700" />
          <span>Machine Plant Location (Pin on Map)</span>
        </label>
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={locating}
          className="text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2.5 py-1 rounded-md flex items-center gap-1 cursor-pointer transition"
        >
          <Navigation className={`w-3 h-3 ${locating ? 'animate-spin text-sky-600' : 'text-slate-600'}`} />
          <span>{locating ? 'Locating...' : 'Locate Me'}</span>
        </button>
      </div>

      <div className="relative w-full h-44 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shadow-inner">
        <div ref={mapRef} className="w-full h-full z-0" />
        <div className="absolute bottom-2 left-2 z-[400] bg-white/95 backdrop-blur-xs text-[10px] font-mono text-slate-800 px-2.5 py-1 rounded shadow-xs border border-slate-200">
          Lat: {lat}, Lng: {lng} &bull; Click or drag pin to position
        </div>
      </div>
    </div>
  );
}

export default function PostJobModal({ isOpen, onClose, currentUser, mechanics = [], onJobCreated }) {
  const [formData, setFormData] = useState({
    title: '',
    machine_category: MACHINE_CATEGORIES[0],
    machine_brand: '',
    machine_model: '',
    serial_number: '',
    asset_tag: '',
    year_of_manufacture: '2021',
    operating_hours: '14200 hrs',
    production_impact: 'TOTAL_STOPPAGE',
    error_code: '',
    hiring_mode: 'BIDDING', // 'BIDDING' or 'DIRECT'
    fault_description: '',
    urgency: 'EMERGENCY',
    address: 'Plot 42, Bhosari MIDC, Pune',
    city: 'Pune',
    lat: 18.6276,
    lng: 73.8447,
    budget_min: '6000',
    budget_max: '12000',
    images: []
  });

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleLocationChange = (newLat, newLng) => {
    setFormData(prev => ({
      ...prev,
      lat: newLat,
      lng: newLng,
      address: `Industrial Sector (${newLat.toFixed(4)}, ${newLng.toFixed(4)})`
    }));
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploading(true);
    setError(null);
    try {
      const uploadedUrls = [];
      const uid = currentUser?.id || 'usr_company_1';
      for (const file of files) {
        const res = await api.uploadFile(file, uid, 'job');
        if (res.url) {
          uploadedUrls.push(res.url);
        }
      }
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }));
    } catch (err) {
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
    setError(null);
    setSubmitting(true);

    try {
      const payload = {
        company_user_id: currentUser?.id || 'usr_company_1',
        title: formData.title.trim() || `${formData.machine_brand || ''} ${formData.machine_model || formData.machine_category} Repair`.trim(),
        machine_category: formData.machine_category,
        machine_brand: formData.machine_brand,
        machine_model: formData.machine_model,
        serial_number: formData.serial_number,
        asset_tag: formData.asset_tag,
        year_of_manufacture: formData.year_of_manufacture,
        operating_hours: formData.operating_hours,
        production_impact: formData.production_impact,
        error_code: formData.error_code,
        hiring_mode: formData.hiring_mode,
        direct_assigned_mechanic_id: null, // First technician to claim will receive direct work
        fault_description: formData.fault_description.trim() || 'Machinery inspection, diagnostics and breakdown repair required.',
        urgency: formData.urgency,
        address: formData.address || `Industrial Plant (${formData.lat}, ${formData.lng})`,
        city: formData.city || 'Pune',
        lat: formData.lat,
        lng: formData.lng,
        budget_min: parseFloat(formData.budget_min) || 5000,
        budget_max: formData.hiring_mode === 'DIRECT' ? (parseFloat(formData.budget_min) || 5000) : (parseFloat(formData.budget_max) || 12000),
        images: formData.images
      };

      const res = await api.createJob(payload);
      if (res && res.error) {
        setError(res.error);
      } else if (res && res.jobId) {
        onJobCreated(res.jobId);
        onClose();
      } else {
        setError('Server returned an unexpected response. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to list machine breakdown: ' + (err.message || 'Check server connection.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1250] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl relative my-auto max-h-[94vh] flex flex-col text-slate-900">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 flex-shrink-0">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">List Machine Breakdown</h3>
            <div className="text-[11px] text-slate-500">Provide machine specs, hiring preference, and pin location</div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* Hiring System Choice */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Hiring System</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, hiring_mode: 'BIDDING' })}
                className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                  formData.hiring_mode === 'BIDDING'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="font-semibold text-xs mb-0.5">Open Bidding</div>
                <div className={`text-[11px] ${formData.hiring_mode === 'BIDDING' ? 'text-slate-300' : 'text-slate-500'}`}>
                  Multiple technicians submit competitive quotes. You review and select.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, hiring_mode: 'DIRECT' })}
                className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                  formData.hiring_mode === 'DIRECT'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="font-semibold text-xs mb-0.5">Direct Hire</div>
                <div className={`text-[11px] ${formData.hiring_mode === 'DIRECT' ? 'text-slate-300' : 'text-slate-500'}`}>
                  Instant assignment: First certified technician to apply is automatically given the job.
                </div>
              </button>
            </div>

            {formData.hiring_mode === 'DIRECT' && (
              <div className="mt-2.5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Urban Company Style Instant Booking</span>
                </div>
                <div className="text-[11px] text-emerald-700">
                  You specify the fixed payout below. The first verified technician who claims this work order will be instantly assigned and dispatched without bidding delays.
                </div>
              </div>
            )}
          </div>

          {/* Breakdown Title & Urgency */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Breakdown Title</label>
              <input
                type="text"
                placeholder="e.g. Haas VF-4 Spindle Bearing Vibration Failure"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Urgency</label>
              <select
                value={formData.urgency}
                onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
              >
                <option value="EMERGENCY">Emergency (&lt;1 hr)</option>
                <option value="SAME_DAY">Same Day Service</option>
                <option value="SCHEDULED">Scheduled Maintenance</option>
              </select>
            </div>
          </div>

          {/* Machine Category */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Machine Category</label>
            <select
              value={formData.machine_category}
              onChange={(e) => setFormData({ ...formData, machine_category: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
            >
              {MACHINE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Technical Specifications Container */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
              Machine Identification & Operating Status
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="block text-[10px] font-medium text-slate-600 mb-1">Brand</label>
                <input
                  type="text"
                  placeholder="e.g. Haas"
                  value={formData.machine_brand}
                  onChange={(e) => setFormData({ ...formData, machine_brand: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-slate-600 mb-1">Model</label>
                <input
                  type="text"
                  placeholder="e.g. VF-4SS"
                  value={formData.machine_model}
                  onChange={(e) => setFormData({ ...formData, machine_model: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-slate-600 mb-1">Serial Number</label>
                <input
                  type="text"
                  placeholder="e.g. HAAS-84912"
                  value={formData.serial_number}
                  onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-slate-600 mb-1">Asset Tag</label>
                <input
                  type="text"
                  placeholder="e.g. AST-042"
                  value={formData.asset_tag}
                  onChange={(e) => setFormData({ ...formData, asset_tag: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-medium text-slate-600 mb-1">Year</label>
                <input
                  type="text"
                  value={formData.year_of_manufacture}
                  onChange={(e) => setFormData({ ...formData, year_of_manufacture: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-slate-600 mb-1">Operating Hours</label>
                <input
                  type="text"
                  value={formData.operating_hours}
                  onChange={(e) => setFormData({ ...formData, operating_hours: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-slate-600 mb-1">Production Impact</label>
                <select
                  value={formData.production_impact}
                  onChange={(e) => setFormData({ ...formData, production_impact: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900"
                >
                  <option value="TOTAL_STOPPAGE">Line Stoppage</option>
                  <option value="PARTIAL_HALT">Partial Halt</option>
                  <option value="QUALITY_DEFECT">Quality Defect</option>
                </select>
              </div>
            </div>
          </div>

          {/* Fault Description & Error Code */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Alarm / Error Code</label>
              <input
                type="text"
                placeholder="e.g. E-402 Spindle Inverter Fault"
                value={formData.error_code}
                onChange={(e) => setFormData({ ...formData, error_code: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Fault Description</label>
              <textarea
                rows={3}
                placeholder="Describe failure symptoms, vibration, noise, or error indicators..."
                value={formData.fault_description}
                onChange={(e) => setFormData({ ...formData, fault_description: e.target.value })}
                required
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>

          {/* Machine Location Map Picker (Replaced dropdown) */}
          <SmallMapLocationPicker
            lat={formData.lat}
            lng={formData.lng}
            onLocationChange={handleLocationChange}
          />

          {/* Photo Upload */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Attach Machinery Photos / Error Logs</label>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-slate-400 transition bg-slate-50/50">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                id="modal-job-photo-upload"
                className="hidden"
                disabled={uploading}
              />
              <label
                htmlFor="modal-job-photo-upload"
                className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
              >
                <Upload className="w-5 h-5 text-slate-500" />
                <span className="text-xs font-semibold text-slate-800">
                  {uploading ? 'Uploading media...' : 'Upload Machine Photos'}
                </span>
                <span className="text-[10px] text-slate-500">JPG, PNG up to 10MB</span>
              </label>
            </div>

            {formData.images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2.5">
                {formData.images.map((img, idx) => (
                  <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 group">
                    <img src={img} alt="Machine" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Budget */}
          {formData.hiring_mode === 'DIRECT' ? (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Fixed Service Payout (₹)</label>
              <input
                type="number"
                placeholder="e.g. 6500"
                value={formData.budget_min}
                onChange={(e) => setFormData({ ...formData, budget_min: e.target.value, budget_max: e.target.value })}
                required
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
              />
              <div className="text-[10px] text-slate-500 mt-1">This exact fixed amount will be paid into escrow upon assignment.</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Min Budget (₹)</label>
                <input
                  type="number"
                  value={formData.budget_min}
                  onChange={(e) => setFormData({ ...formData, budget_min: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Max Budget (₹)</label>
                <input
                  type="number"
                  value={formData.budget_max}
                  onChange={(e) => setFormData({ ...formData, budget_max: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
                />
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
            >
              <span>{submitting ? 'Publishing Breakdown...' : 'List Machine Breakdown'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
