import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, AlertTriangle, Cpu, MapPin, Navigation, Map as MapIcon } from 'lucide-react';
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
    operating_hours: '14200 hrs',
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
    images: []
  });

  const [showMapPicker, setShowMapPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (showMapPicker && mapContainerRef.current && !leafletMapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [formData.lat || 18.6276, formData.lng || 73.8447],
        zoom: 13
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      const marker = L.marker([formData.lat || 18.6276, formData.lng || 73.8447], { draggable: true }).addTo(map);
      markerRef.current = marker;

      marker.on('dragend', (e) => {
        const { lat, lng } = e.target.getLatLng();
        setFormData(prev => ({
          ...prev,
          lat: parseFloat(lat.toFixed(6)),
          lng: parseFloat(lng.toFixed(6)),
          address: `Pinned Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`
        }));
      });

      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setFormData(prev => ({
          ...prev,
          lat: parseFloat(lat.toFixed(6)),
          lng: parseFloat(lng.toFixed(6)),
          address: `Pinned Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`
        }));
      });

      leafletMapRef.current = map;
    }
  }, [showMapPicker]);

  if (!isOpen) return null;

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(6));
          const lng = parseFloat(pos.coords.longitude.toFixed(6));
          setFormData(prev => ({
            ...prev,
            lat,
            lng,
            address: `GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`
          }));
          if (leafletMapRef.current) {
            leafletMapRef.current.setView([lat, lng], 14);
            if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
          }
        },
        (err) => {
          console.warn('Geolocation unavailable:', err);
          setError('Unable to retrieve current location.');
        }
      );
    }
  };

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
      if (leafletMapRef.current) {
        leafletMapRef.current.setView([selected.lat, selected.lng], 13);
        if (markerRef.current) markerRef.current.setLatLng([selected.lat, selected.lng]);
      }
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
      setError('Failed to upload image');
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
        company_user_id: currentUser.id,
        title: formData.title || `${formData.machine_brand || ''} ${formData.machine_model || 'Machinery'} Repair`,
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
        direct_assigned_mechanic_id: formData.hiring_mode === 'DIRECT' ? (formData.direct_assigned_mechanic_id || mechanics[0]?.user_id) : null,
        fault_description: formData.fault_description,
        urgency: formData.urgency,
        address: formData.address,
        city: formData.city,
        lat: formData.lat,
        lng: formData.lng,
        budget_min: parseFloat(formData.budget_min) || 5000,
        budget_max: parseFloat(formData.budget_max) || 12000,
        images: formData.images
      };

      const res = await api.createJob(payload);
      if (res.error) {
        setError(res.error);
      } else {
        onJobCreated(res.jobId);
        onClose();
      }
    } catch (err) {
      console.error(err);
      setError('Failed to create job listing');
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
            <div className="text-[11px] text-slate-500">Specify machinery details, hiring system, and facility coordinates</div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-medium flex items-center gap-2">
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
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                <div className="font-semibold text-xs mb-0.5">Open Bidding</div>
                <div className={`text-[11px] ${formData.hiring_mode === 'BIDDING' ? 'text-slate-300' : 'text-slate-500'}`}>
                  Technicians submit competitive quotes.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, hiring_mode: 'DIRECT' })}
                className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                  formData.hiring_mode === 'DIRECT'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                <div className="font-semibold text-xs mb-0.5">Direct Hire</div>
                <div className={`text-[11px] ${formData.hiring_mode === 'DIRECT' ? 'text-slate-300' : 'text-slate-500'}`}>
                  Instant 1-click booking of a selected specialist.
                </div>
              </button>
            </div>

            {formData.hiring_mode === 'DIRECT' && (
              <div className="mt-2.5">
                <label className="block text-xs font-medium text-slate-700 mb-1">Select Technician for Direct Hire</label>
                <select
                  value={formData.direct_assigned_mechanic_id}
                  onChange={(e) => setFormData({ ...formData, direct_assigned_mechanic_id: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
                >
                  {mechanics.map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.full_name} &bull; Rating {m.rating} &bull; ₹{m.hourly_rate}/hr
                    </option>
                  ))}
                </select>
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

          {/* Fault Description & Location Selection */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Alarm / Error Code</label>
                <input
                  type="text"
                  placeholder="e.g. E-402"
                  value={formData.error_code}
                  onChange={(e) => setFormData({ ...formData, error_code: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
                />
              </div>
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-700">Location & Facility</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleLocateMe}
                      className="text-[11px] text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Navigation className="w-3 h-3 text-slate-700" />
                      <span>Locate Me</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowMapPicker(!showMapPicker)}
                      className="text-[11px] text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <MapIcon className="w-3 h-3 text-slate-700" />
                      <span>{showMapPicker ? 'Hide Map' : 'Select on Map'}</span>
                    </button>
                  </div>
                </div>

                <select
                  onChange={handleZoneSelect}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
                >
                  {PRESET_ZONES.map((zone) => (
                    <option key={zone.name} value={zone.name}>{zone.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Map Location Picker */}
            {showMapPicker && (
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                  <span>Click anywhere on the map or drag pin to choose coordinates</span>
                  <span>Lat: {formData.lat}, Lng: {formData.lng}</span>
                </div>
                <div ref={mapContainerRef} className="w-full h-44 rounded border border-slate-200" />
              </div>
            )}

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

          {/* Photo Upload */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Attach Photos</label>
            <div className="flex flex-wrap items-center gap-2">
              {formData.images.map((imgUrl, i) => (
                <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200 group">
                  <img src={imgUrl} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute inset-0 bg-slate-900/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              <label className="w-14 h-14 rounded-lg border border-dashed border-slate-300 hover:border-slate-500 flex flex-col items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer transition bg-slate-50">
                <Upload className="w-4 h-4 mb-0.5" />
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

          {/* Budget */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Budget Range (₹)</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min Budget"
                value={formData.budget_min}
                onChange={(e) => setFormData({ ...formData, budget_min: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
              />
              <input
                type="number"
                placeholder="Max Budget"
                value={formData.budget_max}
                onChange={(e) => setFormData({ ...formData, budget_max: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
              />
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || uploading}
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-5 py-2 rounded-lg transition cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : formData.hiring_mode === 'DIRECT' ? 'Confirm Direct Hire' : 'Broadcast Listing'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
