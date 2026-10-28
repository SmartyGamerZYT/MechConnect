import React, { useState } from 'react';
import {
  X,
  UserCheck,
  Building2,
  Wrench,
  Shield,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [role, setRole] = useState('company');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [companyName, setCompanyName] = useState('');
  const [industryType, setIndustryType] = useState('Heavy Engineering & Fabrication');
  const [city, setCity] = useState('Pune');
  const [skills, setSkills] = useState('CNC Machines, Hydraulic Systems');
  const [experience, setExperience] = useState('6');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const payload = {
        name,
        email,
        phone,
        role,
        company_name: companyName,
        industry_type: industryType,
        city,
        skills,
        experience
      };

      const res = await api.register(payload);
      if (res.success && res.user) {
        onAuthSuccess(res.user);
        onClose();
      } else {
        setError(res.error || 'Registration failed');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred during instant registration.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1400] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#1E1E1E] border border-[#2C2C2E] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative my-auto">
        
        {/* Header */}
        <div className="p-5 border-b border-[#2C2C2E] flex items-center justify-between bg-[#181818]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/40 flex items-center justify-center text-[#00E5FF]">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Frictionless Registration</h3>
              <p className="text-xs text-[#00E5FF] font-mono">No OTP &bull; No Email Verify &bull; Direct Access</p>
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
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Role Picker */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-[#98989D] mb-2">
              Select Your Operational Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('company')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  role === 'company'
                    ? 'bg-[#00E5FF]/15 border-[#00E5FF] shadow-[0_0_12px_rgba(0,229,255,0.2)]'
                    : 'bg-[#121212] border-[#2C2C2E]'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs text-white mb-0.5">
                  <Building2 className="w-4 h-4 text-[#00E5FF]" />
                  Industrial Company
                </div>
                <div className="text-[10px] text-[#98989D]">Post breakdowns & hire technicians</div>
              </button>

              <button
                type="button"
                onClick={() => setRole('mechanic')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  role === 'mechanic'
                    ? 'bg-[#32D74B]/15 border-[#32D74B] shadow-[0_0_12px_rgba(50,215,75,0.2)]'
                    : 'bg-[#121212] border-[#2C2C2E]'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs text-white mb-0.5">
                  <Wrench className="w-4 h-4 text-[#32D74B]" />
                  Field Technician
                </div>
                <div className="text-[10px] text-[#98989D]">Accept jobs & submit proposals</div>
              </button>
            </div>
          </div>

          {/* Full Name & Email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono uppercase text-[#98989D] mb-1">
                {role === 'company' ? 'Manager Name *' : 'Technician Name *'}
              </label>
              <input
                type="text"
                placeholder={role === 'company' ? 'e.g. Ramesh Kulkarni' : 'e.g. Anand Shinde'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-[#121212] border border-[#2C2C2E] rounded-xl px-3 py-2 text-xs text-white focus:border-[#00E5FF]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase text-[#98989D] mb-1">
                Work Email *
              </label>
              <input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#121212] border border-[#2C2C2E] rounded-xl px-3 py-2 text-xs text-white focus:border-[#00E5FF]"
              />
            </div>
          </div>

          {/* Phone & City */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono uppercase text-[#98989D] mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#121212] border border-[#2C2C2E] rounded-xl px-3 py-2 text-xs text-white focus:border-[#00E5FF]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase text-[#98989D] mb-1">
                City / Industrial Hub
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-[#121212] border border-[#2C2C2E] rounded-xl px-3 py-2 text-xs text-white focus:border-[#00E5FF]"
              >
                <option value="Pune">Pune (Bhosari / Chakan MIDC)</option>
                <option value="Mumbai">Mumbai (Bhiwandi / Thane / Taloja)</option>
                <option value="Chennai">Chennai (Ambattur / Sriperumbudur)</option>
                <option value="Bangalore">Bangalore (Peenya / Bommasandra)</option>
                <option value="Ahmedabad">Ahmedabad (Sanand / Changodar)</option>
              </select>
            </div>
          </div>

          {/* Role specific inputs */}
          {role === 'company' ? (
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono uppercase text-[#98989D] mb-1">
                  Company / Factory Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mahavir Precision Castings Ltd."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-[#121212] border border-[#2C2C2E] rounded-xl px-3 py-2 text-xs text-white focus:border-[#00E5FF]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-[#98989D] mb-1">
                  Industry Sector
                </label>
                <input
                  type="text"
                  value={industryType}
                  onChange={(e) => setIndustryType(e.target.value)}
                  className="w-full bg-[#121212] border border-[#2C2C2E] rounded-xl px-3 py-2 text-xs text-white focus:border-[#00E5FF]"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono uppercase text-[#98989D] mb-1">
                  Years of Experience
                </label>
                <input
                  type="number"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="w-full bg-[#121212] border border-[#2C2C2E] rounded-xl px-3 py-2 text-xs text-white focus:border-[#00E5FF]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-[#98989D] mb-1">
                  Specialized Skills
                </label>
                <input
                  type="text"
                  placeholder="CNC, Hydraulics, PLCs"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="w-full bg-[#121212] border border-[#2C2C2E] rounded-xl px-3 py-2 text-xs text-white focus:border-[#00E5FF]"
                />
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="pt-2 border-t border-[#2C2C2E]">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#00E5FF] hover:bg-[#00c5dc] text-black font-extrabold text-xs py-2.5 rounded-xl transition shadow-[0_0_15px_rgba(0,229,255,0.3)] cursor-pointer"
            >
              {submitting ? 'Creating Profile & Database Record...' : 'CREATE ACCOUNT & ENTER PLATFORM'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

