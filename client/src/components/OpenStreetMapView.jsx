import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Wrench, MapPin, AlertTriangle, ShieldCheck, DollarSign, Clock } from 'lucide-react';

export default function OpenStreetMapView({
  mode = 'jobs', // 'jobs' (for technician view) or 'mechanics' (for company view)
  jobs = [],
  mechanics = [],
  onSelectJob,
  onSelectMechanic,
  height = '500px'
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default to industrial corridor (Pune MIDC / Chakan / Bhosari)
      const map = L.map(mapContainerRef.current, {
        center: [18.6276, 73.8447],
        zoom: 12,
        zoomControl: true
      });

      // Standard clean OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const layer = layerGroupRef.current;
    layer.clearLayers();

    const bounds = [];

    if (mode === 'jobs') {
      // Pins for jobs available (for Technician view)
      jobs.forEach((job) => {
        const lat = parseFloat(job.lat) || (18.6276 + (Math.random() - 0.5) * 0.08);
        const lng = parseFloat(job.lng) || (73.8447 + (Math.random() - 0.5) * 0.08);
        bounds.push([lat, lng]);

        const isEmergency = job.urgency === 'EMERGENCY';
        const isSameDay = job.urgency === 'SAME_DAY';
        const color = isEmergency ? '#DC2626' : isSameDay ? '#D97706' : '#2563EB';

        const iconHtml = `
          <div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.3); color: white; font-weight: bold; font-size: 11px;">
            ${isEmergency ? '!' : 'W'}
          </div>
        `;

        const customIcon = L.divIcon({
          className: 'custom-job-marker',
          html: iconHtml,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const marker = L.marker([lat, lng], { icon: customIcon });

        const popupDiv = document.createElement('div');
        popupDiv.className = 'p-2 font-sans text-slate-900 min-w-[200px]';
        popupDiv.innerHTML = `
          <div style="font-size: 10px; font-weight: 700; color: ${color}; margin-bottom: 2px;">
            ${job.urgency} &bull; ${job.machine_category}
          </div>
          <div style="font-size: 13px; font-weight: 700; margin-bottom: 4px;">
            ${job.title}
          </div>
          <div style="font-size: 11px; color: #64748B; margin-bottom: 6px;">
            ${job.address || 'Industrial MIDC'}, ${job.city || 'Pune'}
          </div>
          <div style="font-size: 12px; font-weight: 700; color: #0F172A; margin-bottom: 8px;">
            ₹${job.budget_min ? job.budget_min.toLocaleString() : 'Open'} ${job.budget_max ? `- ₹${job.budget_max.toLocaleString()}` : ''}
          </div>
          <button id="view-job-btn-${job.id}" style="width: 100%; background: #0F172A; color: white; font-size: 11px; font-weight: 600; padding: 6px; border-radius: 6px; border: none; cursor: pointer;">
            View Details & Bid
          </button>
        `;

        popupDiv.querySelector(`#view-job-btn-${job.id}`).addEventListener('click', () => {
          if (onSelectJob) onSelectJob(job.id);
        });

        marker.bindPopup(popupDiv);
        layer.addLayer(marker);
      });
    } else {
      // Pins for nearby available technicians (for Company view)
      mechanics.forEach((mech) => {
        const lat = parseFloat(mech.lat) || (18.6276 + (Math.random() - 0.5) * 0.08);
        const lng = parseFloat(mech.lng) || (73.8447 + (Math.random() - 0.5) * 0.08);
        bounds.push([lat, lng]);

        const isAvailable = mech.availability_status === 'AVAILABLE_NOW';
        const color = isAvailable ? '#059669' : '#64748B';

        const iconHtml = `
          <div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.3); color: white; font-weight: bold; font-size: 11px;">
            T
          </div>
        `;

        const customIcon = L.divIcon({
          className: 'custom-mech-marker',
          html: iconHtml,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const marker = L.marker([lat, lng], { icon: customIcon });

        const popupDiv = document.createElement('div');
        popupDiv.className = 'p-2 font-sans text-slate-900 min-w-[210px]';
        popupDiv.innerHTML = `
          <div style="font-size: 10px; font-weight: 700; color: ${color}; margin-bottom: 2px;">
            ${isAvailable ? 'AVAILABLE NOW' : 'ON STANDBY'}
          </div>
          <div style="font-size: 13px; font-weight: 700; margin-bottom: 2px;">
            ${mech.full_name}
          </div>
          <div style="font-size: 11px; color: #64748B; margin-bottom: 4px;">
            ${mech.headline || 'Certified Specialist'}
          </div>
          <div style="font-size: 11px; margin-bottom: 6px;">
            Rating: <b>${mech.rating}</b> (${mech.reviews_count} reviews) &bull; ₹${mech.hourly_rate}/hr
          </div>
          <button id="view-mech-btn-${mech.user_id}" style="width: 100%; background: #0F172A; color: white; font-size: 11px; font-weight: 600; padding: 6px; border-radius: 6px; border: none; cursor: pointer;">
            View Profile / Direct Hire
          </button>
        `;

        popupDiv.querySelector(`#view-mech-btn-${mech.user_id}`).addEventListener('click', () => {
          if (onSelectMechanic) onSelectMechanic(mech.user_id);
        });

        marker.bindPopup(popupDiv);
        layer.addLayer(marker);
      });
    }

    if (bounds.length > 0) {
      try {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      } catch (e) {}
    }
  }, [mode, jobs, mechanics, onSelectJob, onSelectMechanic]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-xs" style={{ height }}>
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      
      {/* Overlay Badge */}
      <div className="absolute top-3 right-3 z-[400] bg-white/95 backdrop-blur-xs border border-slate-200 py-1.5 px-3 rounded-lg shadow-sm text-xs font-semibold text-slate-800 flex items-center gap-2">
        <MapPin className="w-3.5 h-3.5 text-slate-600" />
        <span>{mode === 'jobs' ? 'Open Breakdown Work Locations' : 'Nearby Certified Technicians'}</span>
      </div>
    </div>
  );
}

