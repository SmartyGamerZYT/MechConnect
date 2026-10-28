import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertTriangle, Clock, Calendar, Wrench, ShieldCheck, ArrowRight } from 'lucide-react';

export default function MapView({ jobs = [], mechanics = [], onSelectJob, onSelectMechanic, activeFilter = 'ALL' }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default to Pune industrial MIDC corridor
      const map = L.map(mapContainerRef.current, {
        center: [18.6276, 73.8447],
        zoom: 12,
        zoomControl: false
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Dark style CartoDB Positron / Dark Matter tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    markersLayer.clearLayers();

    // Add Job Pins
    jobs.forEach((job) => {
      if (!job.lat || !job.lng) return;

      const isEmergency = job.urgency === 'EMERGENCY';
      const isSameDay = job.urgency === 'SAME_DAY';

      const colorClass = isEmergency
        ? 'bg-[#FF453A] border-[#FF453A] shadow-[0_0_15px_#FF453A]'
        : isSameDay
          ? 'bg-[#FF9F0A] border-[#FF9F0A] shadow-[0_0_12px_#FF9F0A]'
          : 'bg-[#32D74B] border-[#32D74B] shadow-[0_0_10px_#32D74B]';

      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group">
          ${isEmergency ? '<div class="absolute w-8 h-8 rounded-full bg-[#FF453A] opacity-40 animate-ping"></div>' : ''}
          <div class="w-6 h-6 rounded-full border-2 ${colorClass} flex items-center justify-center text-black font-black text-xs">
            ${isEmergency ? '!' : isSameDay ? '24h' : 'S'}
          </div>
          <div class="absolute -bottom-6 bg-[#1E1E1E] border border-[#2C2C2E] text-[10px] text-white px-1.5 py-0.5 rounded shadow whitespace-nowrap pointer-events-none">
            ${job.machine_category}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-job-pin',
        html: iconHtml,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([job.lat, job.lng], { icon: customIcon });

      const popupContent = document.createElement('div');
      popupContent.className = 'p-3 bg-[#1E1E1E] text-white rounded-lg border border-[#2C2C2E] min-w-[240px] font-sans';
      popupContent.innerHTML = `
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-[10px] font-bold px-2 py-0.5 rounded ${isEmergency
          ? 'bg-[#FF453A]/20 text-[#FF453A] border border-[#FF453A]/40'
          : isSameDay
            ? 'bg-[#FF9F0A]/20 text-[#FF9F0A] border border-[#FF9F0A]/40'
            : 'bg-[#32D74B]/20 text-[#32D74B] border border-[#32D74B]/40'
        }">${job.urgency}</span>
          <span class="text-xs text-[#98989D]">${job.city}</span>
        </div>
        <h4 class="font-bold text-sm text-white mb-1 leading-snug">${job.title}</h4>
        <div class="text-xs text-[#00E5FF] mb-2 font-mono">
          ${job.budget_min ? `₹${job.budget_min.toLocaleString()} - ₹${job.budget_max?.toLocaleString() || ''}` : 'Budget: Open'}
        </div>
        <p class="text-[11px] text-[#98989D] mb-3 line-clamp-2">${job.fault_description}</p>
        <button id="view-job-${job.id}" class="w-full bg-[#00E5FF] hover:bg-[#00c8e0] text-black font-bold text-xs py-1.5 px-3 rounded flex items-center justify-center gap-1 transition">
          View Breakdown Details &rarr;
        </button>
      `;

      popupContent.querySelector(`#view-job-${job.id}`).addEventListener('click', () => {
        if (onSelectJob) onSelectJob(job);
      });

      marker.bindPopup(popupContent, {
        className: 'dark-leaflet-popup',
        maxWidth: 320
      });

      markersLayer.addLayer(marker);
    });

    // Add Mechanic Availability Pins
    mechanics.forEach((mech) => {
      if (!mech.lat || !mech.lng) return;
      const isAvailable = mech.availability_status === 'AVAILABLE_NOW';

      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group">
          ${isAvailable ? '<div class="absolute w-7 h-7 rounded-full bg-[#00E5FF] opacity-30 animate-pulse"></div>' : ''}
          <div class="w-5 h-5 rounded-full border-2 ${isAvailable ? 'bg-[#00E5FF] border-[#FFFFFF]' : 'bg-[#98989D] border-[#2C2C2E]'} flex items-center justify-center text-[10px] text-black font-bold">
            T
          </div>
          <div class="absolute -top-5 bg-[#1E1E1E]/90 border border-[#2C2C2E] text-[9px] text-[#00E5FF] px-1 py-0.2 rounded shadow whitespace-nowrap pointer-events-none">
            ${mech.full_name.split(' ')[0]}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-mech-pin',
        html: iconHtml,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([mech.lat, mech.lng], { icon: customIcon });

      const popupContent = document.createElement('div');
      popupContent.className = 'p-3 bg-[#1E1E1E] text-white rounded-lg border border-[#2C2C2E] min-w-[230px] font-sans';
      popupContent.innerHTML = `
        <div class="flex items-center gap-2 mb-2">
          <img src="${mech.avatar_url || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100'}" class="w-9 h-9 rounded-full border border-[#00E5FF] object-cover" />
          <div>
            <div class="font-bold text-sm text-white leading-tight">${mech.full_name}</div>
            <div class="text-[11px] text-[#00E5FF]">${mech.headline || 'Certified Mechanic'}</div>
          </div>
        </div>
        <div class="flex items-center justify-between text-[11px] text-[#98989D] mb-2 border-y border-[#2C2C2E] py-1.5">
          <span>Rating: <b class="text-white">${mech.rating}</b> (${mech.reviews_count} reviews)</span>
          <span class="text-[#32D74B] font-semibold">${isAvailable ? 'Available Now' : 'Standby'}</span>
        </div>
        <button id="view-mech-${mech.user_id}" class="w-full bg-[#1E1E1E] hover:bg-[#2C2C2E] border border-[#00E5FF] text-[#00E5FF] font-semibold text-xs py-1.5 px-3 rounded flex items-center justify-center gap-1 transition">
          View Profile & Past Work &rarr;
        </button>
      `;

      popupContent.querySelector(`#view-mech-${mech.user_id}`).addEventListener('click', () => {
        if (onSelectMechanic) onSelectMechanic(mech.user_id);
      });

      marker.bindPopup(popupContent, {
        className: 'dark-leaflet-popup',
        maxWidth: 300
      });

      markersLayer.addLayer(marker);
    });

  }, [jobs, mechanics, onSelectJob, onSelectMechanic]);

  return (
    <div className="relative w-full h-[550px] lg:h-[620px] rounded-xl overflow-hidden border border-[#2C2C2E] bg-[#121212] shadow-2xl">
      {/* Map Element */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Map Legend Overlay */}
      <div className="absolute top-4 right-4 z-[500] bg-[#1E1E1E]/90 backdrop-blur-md border border-[#2C2C2E] p-3 rounded-lg shadow-xl text-xs space-y-1.5 max-w-[210px]">
        <div className="font-bold text-white text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse"></span>
          Live Spatial Radar
        </div>
        <div className="flex items-center gap-2 text-[#98989D]">
          <span className="w-3 h-3 rounded-full bg-[#FF453A] border border-[#FF453A]"></span>
          <span>Emergency Breakdown (<span className="text-[#FF453A]">&lt;1hr</span>)</span>
        </div>
        <div className="flex items-center gap-2 text-[#98989D]">
          <span className="w-3 h-3 rounded-full bg-[#FF9F0A] border border-[#FF9F0A]"></span>
          <span>Same Day Service</span>
        </div>
        <div className="flex items-center gap-2 text-[#98989D]">
          <span className="w-3 h-3 rounded-full bg-[#32D74B] border border-[#32D74B]"></span>
          <span>Scheduled Overhaul</span>
        </div>
        <div className="flex items-center gap-2 text-[#98989D]">
          <span className="w-3 h-3 rounded-full bg-[#00E5FF] border border-white"></span>
          <span>Available Mechanic GPS</span>
        </div>
      </div>
    </div>
  );
}

