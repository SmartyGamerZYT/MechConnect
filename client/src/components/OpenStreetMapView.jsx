import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Crosshair } from 'lucide-react';

export default function OpenStreetMapView({
  mode = 'jobs', // 'jobs' (technician view), 'mechanics' (company view), or 'all' (admin view)
  jobs = [],
  mechanics = [],
  onSelectJob,
  onSelectMechanic,
  height = '500px',
  showLocateMe = true
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);
  const [locating, setLocating] = useState(false);
  const [locateNotice, setLocateNotice] = useState('');
  const [myLocation, setMyLocation] = useState([18.6276, 73.8447]); // Default Pune MIDC industrial corridor

  // Attempt initial GPS query in background to position My Location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setMyLocation([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  // Handle Locate Me (GPS centering)
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setLocateNotice('Geolocation not supported');
      setTimeout(() => setLocateNotice(''), 3000);
      return;
    }

    setLocating(true);
    setLocateNotice('Detecting coordinates...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setMyLocation([lat, lng]);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 14, { duration: 1.2 });
        }

        setLocateNotice('Centered on your location');
        setTimeout(() => setLocateNotice(''), 3000);
      },
      (err) => {
        setLocating(false);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo(myLocation, 13);
        }
        setLocateNotice('Corridor centered');
        setTimeout(() => setLocateNotice(''), 3000);
      },
      { enableHighAccuracy: true, timeout: 7000 }
    );
  };

  // Map cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {}
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Leaflet map instance once
    if (!mapInstanceRef.current) {
      if (mapContainerRef.current._leaflet_id) {
        delete mapContainerRef.current._leaflet_id;
      }

      const map = L.map(mapContainerRef.current, {
        center: myLocation,
        zoom: 12,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const layer = layerGroupRef.current;
    if (!layer) return;

    layer.clearLayers();

    const bounds = [];

    // ALWAYS ADD "MY LOCATION" PIN (Required for all dashboards)
    const myLat = myLocation[0];
    const myLng = myLocation[1];
    bounds.push([myLat, myLng]);

    const myPinIcon = L.divIcon({
      className: 'custom-my-location-pin',
      html: `
        <div style="background-color: #0F172A; width: 34px; height: 34px; border-radius: 50%; border: 3px solid #22C55E; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 0 0 5px rgba(34, 197, 94, 0.4); color: white; font-weight: 800; font-size: 10px; cursor: pointer;">
          ME
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    const myLocationMarker = L.marker([myLat, myLng], { icon: myPinIcon, zIndexOffset: 2000 });
    const myPopup = document.createElement('div');
    myPopup.style.cssText = 'padding: 6px; font-family: sans-serif; font-size: 12px; color: #0F172A; min-width: 160px;';
    myPopup.innerHTML = `
      <div style="font-size: 10px; font-weight: 800; color: #16A34A; text-transform: uppercase; margin-bottom: 2px;">Active Base</div>
      <div style="font-size: 13px; font-weight: 700; margin-bottom: 2px;">My Location</div>
      <div style="font-size: 11px; color: #64748B;">Lat: ${myLat.toFixed(4)}, Lng: ${myLng.toFixed(4)}</div>
    `;
    myLocationMarker.bindPopup(myPopup);
    layer.addLayer(myLocationMarker);

    // Render Jobs Pins (for Technician or Admin view)
    if (mode === 'jobs' || mode === 'all') {
      (jobs || []).forEach((job) => {
        if (!job) return;
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

        const tagEl = document.createElement('div');
        tagEl.style.cssText = `font-size: 10px; font-weight: 700; color: ${color}; margin-bottom: 2px; text-transform: uppercase;`;
        tagEl.textContent = `${job.urgency || 'NORMAL'} • ${job.machine_category || 'Industrial'}`;
        popupDiv.appendChild(tagEl);

        const titleEl = document.createElement('div');
        titleEl.style.cssText = 'font-size: 13px; font-weight: 700; margin-bottom: 4px;';
        titleEl.textContent = job.title || 'Breakdown Work';
        popupDiv.appendChild(titleEl);

        const locEl = document.createElement('div');
        locEl.style.cssText = 'font-size: 11px; color: #64748B; margin-bottom: 6px;';
        locEl.textContent = `${job.address || 'Industrial MIDC'}, ${job.city || 'Pune'}`;
        popupDiv.appendChild(locEl);

        const budgetEl = document.createElement('div');
        budgetEl.style.cssText = 'font-size: 12px; font-weight: 700; color: #0F172A; margin-bottom: 8px;';
        budgetEl.textContent = `₹${job.budget_min ? job.budget_min.toLocaleString() : 'Open'} ${job.budget_max ? `- ₹${job.budget_max.toLocaleString()}` : ''}`;
        popupDiv.appendChild(budgetEl);

        const btn = document.createElement('button');
        btn.textContent = job.hiring_mode === 'DIRECT' ? 'View & Claim Direct Work' : 'View Details & Bid';
        btn.style.cssText = 'width: 100%; background: #0F172A; color: white; font-size: 11px; font-weight: 600; padding: 6px; border-radius: 6px; border: none; cursor: pointer;';
        btn.onclick = (e) => {
          e.preventDefault();
          if (onSelectJob) onSelectJob(job.id);
        };
        popupDiv.appendChild(btn);

        marker.bindPopup(popupDiv);
        layer.addLayer(marker);
      });
    }

    // Render Mechanics Pins (for Company or Admin view)
    if (mode === 'mechanics' || mode === 'all') {
      (mechanics || []).forEach((mech) => {
        if (!mech) return;
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

        const tagEl = document.createElement('div');
        tagEl.style.cssText = `font-size: 10px; font-weight: 700; color: ${color}; margin-bottom: 2px; text-transform: uppercase;`;
        tagEl.textContent = isAvailable ? 'AVAILABLE NOW' : 'ON STANDBY';
        popupDiv.appendChild(tagEl);

        const nameEl = document.createElement('div');
        nameEl.style.cssText = 'font-size: 13px; font-weight: 700; margin-bottom: 2px;';
        nameEl.textContent = mech.full_name || 'Certified Specialist';
        popupDiv.appendChild(nameEl);

        const headEl = document.createElement('div');
        headEl.style.cssText = 'font-size: 11px; color: #64748B; margin-bottom: 4px;';
        headEl.textContent = mech.headline || 'Machine Maintenance Specialist';
        popupDiv.appendChild(headEl);

        const metaEl = document.createElement('div');
        metaEl.style.cssText = 'font-size: 11px; margin-bottom: 6px;';
        metaEl.textContent = `Rating: ${mech.rating || 5.0} (${mech.reviews_count || 0} reviews) • ₹${mech.hourly_rate || 500}/hr`;
        popupDiv.appendChild(metaEl);

        const btn = document.createElement('button');
        btn.textContent = 'View Profile / Direct Hire';
        btn.style.cssText = 'width: 100%; background: #0F172A; color: white; font-size: 11px; font-weight: 600; padding: 6px; border-radius: 6px; border: none; cursor: pointer;';
        btn.onclick = (e) => {
          e.preventDefault();
          if (onSelectMechanic) onSelectMechanic(mech.user_id);
        };
        popupDiv.appendChild(btn);

        marker.bindPopup(popupDiv);
        layer.addLayer(marker);
      });
    }

    if (bounds.length > 0) {
      try {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      } catch (e) {}
    }
  }, [mode, jobs, mechanics, onSelectJob, onSelectMechanic, myLocation]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-xs" style={{ height }}>
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Locate Me Button Overlay */}
      {showLocateMe && (
        <button
          onClick={handleLocateMe}
          disabled={locating}
          title="Center map on your location"
          className="absolute top-3 left-3 z-[400] bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 py-1.5 px-3 rounded-lg shadow-sm text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer active:scale-95 disabled:opacity-60"
        >
          <Crosshair className={`w-3.5 h-3.5 ${locating ? 'animate-spin text-sky-600' : 'text-slate-700'}`} />
          <span>{locating ? 'Locating...' : 'Locate Me'}</span>
        </button>
      )}

      {/* Notice Pill */}
      {locateNotice && (
        <div className="absolute top-12 left-3 z-[400] bg-slate-900 text-white text-[10px] font-mono py-1 px-2.5 rounded shadow-md">
          {locateNotice}
        </div>
      )}

      {/* Mode Badge Overlay with My Location indicator */}
      <div className="absolute top-3 right-3 z-[400] bg-white/95 backdrop-blur-xs border border-slate-200 py-1.5 px-3 rounded-lg shadow-sm text-xs font-semibold text-slate-800 flex items-center gap-2">
        <MapPin className="w-3.5 h-3.5 text-slate-600" />
        <span>{mode === 'jobs' ? 'Open Breakdowns' : mode === 'mechanics' ? 'Nearby Technicians' : 'Corridor Overview'} &bull; Pin: My Location</span>
      </div>
    </div>
  );
}
