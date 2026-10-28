import React, { useState } from 'react';
import {
  Wrench,
  AlertCircle,
  PlusCircle,
  MapPin,
  Users,
  MessageSquare,
  Shield,
  UserCheck,
  ChevronDown,
  Activity,
  Layers,
  FileText
} from 'lucide-react';

export default function Navbar({
  currentUser,
  users = [],
  onSwitchUser,
  onOpenPostJob,
  activeTab,
  setActiveTab,
  unreadCount = 0,
  onOpenAuthModal
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isCompany = currentUser?.role === 'company';
  const isMechanic = currentUser?.role === 'mechanic';
  const isAdmin = currentUser?.role === 'admin';

  return (
    <header className="sticky top-0 z-[1000] bg-[#121212]/95 backdrop-blur-md border-b border-[#2C2C2E] px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div 
            onClick={() => setActiveTab('feed')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#1E1E1E] border border-[#00E5FF]/40 flex items-center justify-center text-[#00E5FF] shadow-[0_0_12px_rgba(0,229,255,0.25)] group-hover:scale-105 transition">
              <Wrench className="w-5 h-5 text-[#00E5FF]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-white font-sans">MECH<span className="text-[#00E5FF]">CONNECT</span></span>
                <span className="text-[10px] bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30 px-1.5 py-0.5 rounded font-mono font-bold">
                  v2.0
                </span>
              </div>
              <div className="text-[10px] text-[#98989D] flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#32D74B] animate-pulse"></span>
                INDUSTRIAL ON-DEMAND REPAIR
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-[#1E1E1E] p-1 rounded-xl border border-[#2C2C2E]">
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'feed'
                ? 'bg-[#00E5FF] text-black shadow'
                : 'text-[#98989D] hover:text-white hover:bg-[#2C2C2E]'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            Breakdown Radar & Feed
          </button>

          <button
            onClick={() => setActiveTab('directory')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'directory'
                ? 'bg-[#00E5FF] text-black shadow'
                : 'text-[#98989D] hover:text-white hover:bg-[#2C2C2E]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Technicians Directory
          </button>

          <button
            onClick={() => setActiveTab('myjobs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'myjobs'
                ? 'bg-[#00E5FF] text-black shadow'
                : 'text-[#98989D] hover:text-white hover:bg-[#2C2C2E]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            {isCompany ? 'My Plant Jobs & History' : 'My Repair Tasks'}
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 relative transition ${
              activeTab === 'chat'
                ? 'bg-[#00E5FF] text-black shadow'
                : 'text-[#98989D] hover:text-white hover:bg-[#2C2C2E]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Negotiation & Chat
            {unreadCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#FF453A] animate-ping"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'admin'
                ? 'bg-[#00E5FF] text-black shadow'
                : 'text-[#98989D] hover:text-white hover:bg-[#2C2C2E]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Ops Dashboard
          </button>
        </nav>

        {/* Actions & Persona Selector */}
        <div className="flex items-center gap-3">
          {/* Post Breakdown Button for Companies */}
          {isCompany && (
            <button
              onClick={onOpenPostJob}
              className="bg-[#FF453A] hover:bg-[#e03a30] text-white font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-[0_0_12px_rgba(255,69,58,0.4)] transition cursor-pointer animate-pulse"
            >
              <PlusCircle className="w-4 h-4" />
              <span>POST BREAKDOWN (&lt;2 MIN)</span>
            </button>
          )}

          {/* User Persona Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 bg-[#1E1E1E] hover:bg-[#252525] border border-[#2C2C2E] rounded-xl px-2.5 py-1.5 text-left transition cursor-pointer"
            >
              <img
                src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                alt={currentUser?.name}
                className="w-7 h-7 rounded-full object-cover border border-[#00E5FF]/40"
              />
              <div className="hidden sm:block">
                <div className="text-xs font-bold text-white leading-tight flex items-center gap-1.5">
                  <span className="truncate max-w-[130px]">{currentUser?.name?.split('(')[0] || 'Select User'}</span>
                  <span className={`text-[9px] px-1 py-0.2 rounded font-mono uppercase ${
                    isCompany ? 'bg-blue-500/20 text-blue-400' : isMechanic ? 'bg-[#32D74B]/20 text-[#32D74B]' : 'bg-purple-500/20 text-purple-400'
                  }`}>
                    {currentUser?.role}
                  </span>
                </div>
                <div className="text-[10px] text-[#98989D] truncate max-w-[140px]">
                  {currentUser?.company_name || currentUser?.mechanic_headline || currentUser?.email}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#98989D]" />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-[#1E1E1E] border border-[#2C2C2E] rounded-xl shadow-2xl p-2 z-[1100]">
                <div className="px-3 py-1.5 border-b border-[#2C2C2E] mb-2 flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#98989D]">Instant Switch Persona</span>
                  <span className="text-[9px] bg-[#00E5FF]/20 text-[#00E5FF] px-1.5 py-0.5 rounded font-mono">No OTP</span>
                </div>

                <div className="space-y-1 max-h-72 overflow-y-auto">
                  {users.map((u) => {
                    const isSelected = u.id === currentUser?.id;
                    return (
                      <button
                        key={u.id}
                        onClick={() => {
                          onSwitchUser(u);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2 rounded-lg flex items-center gap-2.5 transition cursor-pointer ${
                          isSelected ? 'bg-[#00E5FF]/10 border border-[#00E5FF]/40' : 'hover:bg-[#252525]'
                        }`}
                      >
                        <img src={u.avatar_url} className="w-8 h-8 rounded-full object-cover" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-white truncate flex items-center justify-between">
                            <span>{u.name}</span>
                            <span className="text-[9px] text-[#00E5FF] font-mono uppercase">{u.role}</span>
                          </div>
                          <div className="text-[10px] text-[#98989D] truncate">
                            {u.company_name || u.mechanic_headline || u.email}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 mt-2 border-t border-[#2C2C2E]">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenAuthModal();
                    }}
                    className="w-full bg-[#121212] hover:bg-[#252525] text-xs font-bold text-[#00E5FF] border border-[#00E5FF]/30 py-2 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Create New Account (Frictionless)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}

