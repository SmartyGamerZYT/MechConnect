import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  Award,
  Briefcase,
  CheckCircle,
  Plus,
  Trash2,
  FileCheck,
  Image as ImageIcon,
  User,
  Shield
} from 'lucide-react';
import { api } from '../services/api';

const SKILL_OPTIONS = [
  'CNC Machines (Lathe, Milling, 5-Axis)',
  'Hydraulic Systems (Presses, Pumps, Valves)',
  'Electrical Panels & PLCs (Siemens, Fanuc)',
  'Compressors & Pneumatics',
  'Conveyor & Material Handling',
  'Industrial Generators',
  'Boilers & Heat Exchangers',
  'Robotic Cells & Automation',
  'Spindle Dynamic Balancing',
  'Laser Alignment'
];

export default function TechnicianProfileEditModal({
  isOpen,
  onClose,
  currentUser,
  onProfileUpdated
}) {
  const [profile, setProfile] = useState({
    full_name: '',
    headline: '',
    bio: '',
    city: 'Pune',
    service_radius_km: 35,
    years_experience: 7,
    hourly_rate: 750,
    avatar_url: '',
    skills: [],
    certifications: [],
    portfolio: []
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPfp, setUploadingPfp] = useState(false);
  const [uploadingCert, setUploadingCert] = useState(false);
  const [uploadingWork, setUploadingWork] = useState(false);

  // New certificate temporary input
  const [newCert, setNewCert] = useState({
    title: '',
    issuer: '',
    year: '2023',
    doc_url: ''
  });

  // New past work temporary input
  const [newWork, setNewWork] = useState({
    title: '',
    machine_type: 'CNC Machines',
    description: '',
    image_url: '',
    date: '2026-09-15'
  });

  useEffect(() => {
    if (isOpen && currentUser) {
      fetchCurrentProfile();
    }
  }, [isOpen, currentUser]);

  const fetchCurrentProfile = async () => {
    setLoading(true);
    try {
      const data = await api.getMechanicProfile(currentUser.id);
      if (data.mechanic) {
        setProfile({
          full_name: data.mechanic.full_name || currentUser.name,
          headline: data.mechanic.headline || '',
          bio: data.mechanic.bio || '',
          city: data.mechanic.city || 'Pune',
          service_radius_km: data.mechanic.service_radius_km || 35,
          years_experience: data.mechanic.years_experience || 5,
          hourly_rate: data.mechanic.hourly_rate || 750,
          avatar_url: data.mechanic.avatar_url || currentUser.avatar_url,
          skills: data.mechanic.skills || [],
          certifications: data.mechanic.certifications || [],
          portfolio: data.mechanic.portfolio || []
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Handle PFP upload
  const handlePfpUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPfp(true);
    try {
      const res = await api.uploadFile(file, currentUser.id, 'avatar');
      if (res.url) {
        setProfile(prev => ({ ...prev, avatar_url: res.url }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingPfp(false);
    }
  };

  // Handle Certificate file upload
  const handleCertFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCert(true);
    try {
      const res = await api.uploadFile(file, currentUser.id, 'cert');
      if (res.url) {
        setNewCert(prev => ({ ...prev, doc_url: res.url }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingCert(false);
    }
  };

  // Handle Past Work photo upload
  const handleWorkFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingWork(true);
    try {
      const res = await api.uploadFile(file, currentUser.id, 'portfolio');
      if (res.url) {
        setNewWork(prev => ({ ...prev, image_url: res.url }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingWork(false);
    }
  };

  // Add Certificate to list
  const handleAddCertificate = () => {
    if (!newCert.title || !newCert.issuer) return;
    setProfile(prev => ({
      ...prev,
      certifications: [...prev.certifications, { ...newCert, id: 'cert_' + Date.now() }]
    }));
    setNewCert({ title: '', issuer: '', year: '2023', doc_url: '' });
  };

  const handleRemoveCertificate = (idx) => {
    setProfile(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== idx)
    }));
  };

  // Add Past Work to list
  const handleAddPastWork = () => {
    if (!newWork.title || !newWork.description) return;
    setProfile(prev => ({
      ...prev,
      portfolio: [
        ...prev.portfolio,
        {
          ...newWork,
          id: 'port_' + Date.now(),
          image_url: newWork.image_url || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600'
        }
      ]
    }));
    setNewWork({ title: '', machine_type: 'CNC Machines', description: '', image_url: '', date: '2026-09-15' });
  };

  const handleRemovePastWork = (idx) => {
    setProfile(prev => ({
      ...prev,
      portfolio: prev.portfolio.filter((_, i) => i !== idx)
    }));
  };

  // Toggle skill
  const toggleSkill = (skill) => {
    setProfile(prev => {
      const exists = prev.skills.includes(skill);
      return {
        ...prev,
        skills: exists ? prev.skills.filter(s => s !== skill) : [...prev.skills, skill]
      };
    });
  };

  // Save full profile to database
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateMechanicProfile(currentUser.id, profile);
      if (onProfileUpdated) onProfileUpdated();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1350] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#1E1E1E] border border-[#2C2C2E] rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl relative my-auto max-h-[94vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#2C2C2E] flex items-center justify-between bg-[#181818] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/40 flex items-center justify-center text-[#00E5FF]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Edit Technician Professional Credentials</h3>
              <p className="text-xs text-[#98989D]">Profile picture, verified certifications, and past works gallery</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#252525] hover:bg-[#303030] text-[#98989D] hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-[#98989D] font-mono text-xs">
            Loading technician records from database...
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            
            {/* PFP (Profile Picture) Upload Section */}
            <div className="bg-[#141414] border border-[#2C2C2E] rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4">
              <div className="relative group">
                <img
                  src={profile.avatar_url || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150'}
                  alt="PFP"
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.25)]"
                />
                <label className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition text-[9px] text-[#00E5FF] font-mono">
                  <Upload className="w-4 h-4 mb-0.5" />
                  Change PFP
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePfpUpload}
                    disabled={uploadingPfp}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex-1 text-center sm:text-left">
                <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider mb-1">
                  Technician Profile Picture (PFP)
                </h4>
                <p className="text-[11px] text-[#98989D] mb-2">
                  Upload a clear professional photo in work attire or safety helmet. Saved in database.
                </p>
                <label className="inline-flex items-center gap-1.5 bg-[#1E1E1E] hover:bg-[#252525] border border-[#00E5FF]/40 text-[#00E5FF] text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingPfp ? 'Uploading...' : 'Upload New Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePfpUpload}
                    disabled={uploadingPfp}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-[#98989D] mb-1">Full Name</label>
                <input
                  type="text"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  required
                  className="w-full bg-[#141414] border border-[#2C2C2E] rounded-xl px-3 py-2 text-xs text-white focus:border-[#00E5FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[#98989D] mb-1">Professional Headline</label>
                <input
                  type="text"
                  placeholder="e.g. Master CNC & Precision Machinery Specialist"
                  value={profile.headline}
                  onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
                  className="w-full bg-[#141414] border border-[#2C2C2E] rounded-xl px-3 py-2 text-xs text-white focus:border-[#00E5FF]"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-mono uppercase text-[#98989D] mb-1">Experience (Years)</label>
                <input
                  type="number"
                  value={profile.years_experience}
                  onChange={(e) => setProfile({ ...profile, years_experience: e.target.value })}
                  className="w-full bg-[#141414] border border-[#2C2C2E] rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[#98989D] mb-1">Bench Rate (₹/hr)</label>
                <input
                  type="number"
                  value={profile.hourly_rate}
                  onChange={(e) => setProfile({ ...profile, hourly_rate: e.target.value })}
                  className="w-full bg-[#141414] border border-[#2C2C2E] rounded-xl px-3 py-2 text-xs text-[#00E5FF] font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[#98989D] mb-1">Service Radius (km)</label>
                <input
                  type="number"
                  value={profile.service_radius_km}
                  onChange={(e) => setProfile({ ...profile, service_radius_km: e.target.value })}
                  className="w-full bg-[#141414] border border-[#2C2C2E] rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-xs font-mono uppercase text-[#98989D] mb-1">Technical Summary / Bio</label>
              <textarea
                rows={2}
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                className="w-full bg-[#141414] border border-[#2C2C2E] rounded-xl p-3 text-xs text-white focus:border-[#00E5FF]"
              />
            </div>

            {/* Skills Tags */}
            <div>
              <label className="block text-xs font-mono uppercase text-[#98989D] mb-2">Specialized Skill Tags</label>
              <div className="flex flex-wrap gap-1.5">
                {SKILL_OPTIONS.map((skill) => {
                  const selected = profile.skills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                        selected
                          ? 'bg-[#00E5FF] text-black font-bold'
                          : 'bg-[#141414] text-[#98989D] border border-[#2C2C2E]'
                      }`}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CERTIFICATIONS SECTION (Upload & List) */}
            <div className="bg-[#141414] border border-[#2C2C2E] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-[#32D74B] font-bold flex items-center gap-1.5">
                  <Award className="w-4 h-4" />
                  Verified Industrial Certifications ({profile.certifications.length})
                </span>
                <span className="text-[10px] text-[#98989D] font-mono">ITI, OEM & Diploma</span>
              </div>

              {/* Existing Certifications */}
              <div className="space-y-2">
                {profile.certifications.map((cert, idx) => (
                  <div key={idx} className="bg-[#1E1E1E] border border-[#2C2C2E] p-2.5 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white">{cert.title}</div>
                      <div className="text-[11px] text-[#98989D]">{cert.issuer} &bull; {cert.year}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCertificate(idx)}
                      className="text-[#98989D] hover:text-[#FF453A] p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Certificate Input */}
              <div className="border-t border-[#2C2C2E] pt-3 grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  placeholder="Cert Name (e.g. ITI Machinist)"
                  value={newCert.title}
                  onChange={(e) => setNewCert({ ...newCert, title: e.target.value })}
                  className="sm:col-span-2 bg-[#1E1E1E] border border-[#2C2C2E] rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Issuer (e.g. Govt ITI)"
                  value={newCert.issuer}
                  onChange={(e) => setNewCert({ ...newCert, issuer: e.target.value })}
                  className="bg-[#1E1E1E] border border-[#2C2C2E] rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
                <div className="flex gap-2">
                  <label className="flex-1 bg-[#1E1E1E] border border-[#2C2C2E] hover:border-[#00E5FF] rounded-lg flex items-center justify-center text-[10px] text-[#00E5FF] font-mono cursor-pointer">
                    <Upload className="w-3 h-3 mr-1" />
                    {uploadingCert ? '...' : newCert.doc_url ? '✓ Uploaded' : 'Doc File'}
                    <input
                      type="file"
                      onChange={handleCertFileUpload}
                      disabled={uploadingCert}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleAddCertificate}
                    className="bg-[#32D74B] text-black font-bold text-xs px-3 py-1.5 rounded-lg cursor-pointer"
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>

            {/* PAST WORKS COMPLETED SECTION (With Photos) */}
            <div className="bg-[#141414] border border-[#2C2C2E] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-[#00E5FF] font-bold flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4" />
                  Past Works Completed Gallery ({profile.portfolio.length})
                </span>
                <span className="text-[10px] text-[#98989D] font-mono">Case Studies & Machinery Restored</span>
              </div>

              {/* Existing Works */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {profile.portfolio.map((work, idx) => (
                  <div key={idx} className="bg-[#1E1E1E] border border-[#2C2C2E] rounded-xl overflow-hidden relative group">
                    <div className="h-24 w-full overflow-hidden">
                      <img src={work.image_url} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-2.5">
                      <div className="font-bold text-white text-xs truncate">{work.title}</div>
                      <div className="text-[10px] text-[#00E5FF] font-mono">{work.machine_type}</div>
                      <p className="text-[10px] text-[#98989D] line-clamp-1">{work.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePastWork(idx)}
                      className="absolute top-2 right-2 bg-red-950/80 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Work Input */}
              <div className="border-t border-[#2C2C2E] pt-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Work Title (e.g. 5-Axis Spindle Reconditioning)"
                    value={newWork.title}
                    onChange={(e) => setNewWork({ ...newWork, title: e.target.value })}
                    className="bg-[#1E1E1E] border border-[#2C2C2E] rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                  <select
                    value={newWork.machine_type}
                    onChange={(e) => setNewWork({ ...newWork, machine_type: e.target.value })}
                    className="bg-[#1E1E1E] border border-[#2C2C2E] rounded-lg px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="CNC Machines">CNC Machines</option>
                    <option value="Hydraulic Systems">Hydraulic Systems</option>
                    <option value="Electrical Panels & PLCs">Electrical Panels & PLCs</option>
                    <option value="Compressors">Compressors</option>
                    <option value="Conveyor Belts">Conveyor Belts</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Work description and outcome (e.g. Restored 2 micron runout within 4 hrs)"
                    value={newWork.description}
                    onChange={(e) => setNewWork({ ...newWork, description: e.target.value })}
                    className="flex-1 bg-[#1E1E1E] border border-[#2C2C2E] rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                  <label className="bg-[#1E1E1E] border border-[#2C2C2E] hover:border-[#00E5FF] px-3 rounded-lg flex items-center justify-center text-[10px] text-[#00E5FF] font-mono cursor-pointer">
                    <ImageIcon className="w-3.5 h-3.5 mr-1" />
                    {uploadingWork ? '...' : newWork.image_url ? '✓ Photo' : '+ Photo'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleWorkFileUpload}
                      disabled={uploadingWork}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleAddPastWork}
                    className="bg-[#00E5FF] text-black font-bold text-xs px-4 py-1.5 rounded-lg cursor-pointer"
                  >
                    + Add Work
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Bar */}
            <div className="pt-3 border-t border-[#2C2C2E] flex items-center justify-end gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#98989D] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-[#00E5FF] hover:bg-[#00c5dc] text-black font-extrabold text-xs px-6 py-2.5 rounded-xl transition shadow-[0_0_15px_rgba(0,229,255,0.3)] cursor-pointer"
              >
                {saving ? 'SAVING PROFILE TO DATABASE...' : 'SAVE ALL CREDENTIALS TO DATABASE'}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}

