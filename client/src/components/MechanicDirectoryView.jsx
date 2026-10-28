import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Star,
  MapPin,
  Shield,
  Briefcase,
  CheckCircle2,
  Clock,
  Heart,
  Wrench,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';

const SKILL_FILTERS = [
  'ALL',
  'CNC Machines',
  'Hydraulic Systems',
  'Electrical Panels & PLCs',
  'Compressors',
  'Conveyor & Material Handling',
  'Industrial Generators'
];

export default function MechanicDirectoryView({
  currentUser,
  onSelectMechanic,
  onDirectHire
}) {
  const [mechanics, setMechanics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSkill, setActiveSkill] = useState('ALL');
  const [availabilityFilter, setAvailabilityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMechanics = async () => {
    setLoading(true);
    try {
      const data = await api.getMechanics({
        availability: availabilityFilter !== 'ALL' ? availabilityFilter : null,
        search: searchQuery || null
      });
      setMechanics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMechanics();
  }, [availabilityFilter, searchQuery]);

  const filtered = mechanics.filter((m) => {
    if (activeSkill === 'ALL') return true;
    return m.skills?.some(s => s.toLowerCase().includes(activeSkill.toLowerCase()));
  });

  return (
    <div className="space-y-6">
      
      {/* Header & Controls */}
      <div className="bg-[#1E1E1E] border border-[#2C2C2E] rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00E5FF] animate-pulse"></span>
              <span className="text-[10px] font-mono text-[#00E5FF] uppercase font-bold tracking-wider">
                VETTED INDUSTRIAL TALENT
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Certified Technicians Directory</h1>
            <p className="text-xs text-[#98989D]">
              Browse ITI & OEM-certified mechanics with real factory floor track records.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#98989D] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by skill, name or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#121212] border border-[#2C2C2E] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-[#505050] focus:border-[#00E5FF]"
            />
          </div>
        </div>

        {/* Skill Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {SKILL_FILTERS.map((skill) => (
            <button
              key={skill}
              onClick={() => setActiveSkill(skill)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeSkill === skill
                  ? 'bg-[#00E5FF] text-black font-bold shadow-[0_0_10px_rgba(0,229,255,0.3)]'
                  : 'bg-[#141414] text-[#98989D] border border-[#2C2C2E] hover:text-white hover:border-[#404040]'
              }`}
            >
              {skill}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#2C2C2E] text-xs">
          <span className="text-[#98989D] text-[11px] font-mono">Availability:</span>
          <button
            onClick={() => setAvailabilityFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono ${availabilityFilter === 'ALL' ? 'bg-[#00E5FF]/20 text-[#00E5FF]' : 'text-[#98989D]'}`}
          >
            All ({mechanics.length})
          </button>
          <button
            onClick={() => setAvailabilityFilter('AVAILABLE_NOW')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1 ${availabilityFilter === 'AVAILABLE_NOW' ? 'bg-[#32D74B]/20 text-[#32D74B]' : 'text-[#98989D]'}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#32D74B] animate-pulse"></span>
            Available Now
          </button>
        </div>
      </div>

      {/* Mechanics Grid */}
      {loading ? (
        <div className="text-center py-12 text-[#98989D] font-mono text-xs">
          Querying certified mechanics database...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((mech) => {
            const isAvail = mech.availability_status === 'AVAILABLE_NOW';

            return (
              <div
                key={mech.user_id}
                className="bg-[#1E1E1E] border border-[#2C2C2E] hover:border-[#00E5FF]/50 rounded-2xl p-5 flex flex-col justify-between transition group shadow-lg"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={mech.avatar_url || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100'}
                        alt={mech.full_name}
                        className="w-12 h-12 rounded-xl object-cover border border-[#00E5FF]/40 shadow flex-shrink-0"
                      />
                      <div>
                        <h3 className="font-bold text-white text-sm leading-tight group-hover:text-[#00E5FF] transition">
                          {mech.full_name}
                        </h3>
                        <div className="text-[11px] text-[#98989D] flex items-center gap-1.5 mt-0.5">
                          <MapPin className="w-3 h-3 text-[#00E5FF]" />
                          <span>{mech.city} ({mech.service_radius_km} km)</span>
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono bg-[#00E5FF]/15 text-[#00E5FF] px-2 py-0.5 rounded font-bold">
                      {mech.verification_tier || 'CERTIFIED'}
                    </span>
                  </div>

                  {/* Headline & Bio */}
                  <p className="text-xs text-gray-300 font-medium line-clamp-1 mb-1">
                    {mech.headline}
                  </p>
                  <p className="text-[11px] text-[#98989D] line-clamp-2 mb-3">
                    {mech.bio}
                  </p>

                  {/* Skills tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {mech.skills?.slice(0, 3).map((s, idx) => (
                      <span
                        key={idx}
                        className="bg-[#141414] border border-[#2C2C2E] text-[#00E5FF] text-[10px] font-mono px-2 py-0.5 rounded"
                      >
                        {s}
                      </span>
                    ))}
                    {mech.skills?.length > 3 && (
                      <span className="text-[10px] text-[#98989D] font-mono self-center">
                        +{mech.skills.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  {/* Stats Bar */}
                  <div className="border-t border-[#2C2C2E] pt-3 mb-3 flex items-center justify-between text-xs">
                    <span className="text-yellow-400 font-bold flex items-center gap-1">
                      ⭐ {mech.rating} <span className="text-[#98989D] font-normal text-[11px]">({mech.reviews_count})</span>
                    </span>
                    <span className="text-white font-mono font-bold">
                      ₹{mech.hourly_rate}<span className="text-[#98989D] font-normal text-[10px]">/hr</span>
                    </span>
                    <span className={`text-[10px] font-mono font-bold flex items-center gap-1 ${
                      isAvail ? 'text-[#32D74B]' : 'text-[#FF9F0A]'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isAvail ? 'bg-[#32D74B] animate-pulse' : 'bg-[#FF9F0A]'}`}></span>
                      {isAvail ? 'Ready' : 'Standby'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onSelectMechanic(mech.user_id)}
                      className="bg-[#141414] hover:bg-[#252525] border border-[#2C2C2E] text-white text-xs font-semibold py-2 rounded-xl transition cursor-pointer"
                    >
                      View Portfolio &rarr;
                    </button>
                    <button
                      onClick={() => onSelectMechanic(mech.user_id)}
                      className="bg-[#00E5FF] hover:bg-[#00c5dc] text-black text-xs font-extrabold py-2 rounded-xl transition shadow-[0_0_10px_rgba(0,229,255,0.2)] cursor-pointer"
                    >
                      Direct Contact
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

