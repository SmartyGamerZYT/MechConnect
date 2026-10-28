import React, { useState, useEffect } from 'react';
import { X, Upload, Trash2, Award, Briefcase } from 'lucide-react';
import { api } from '../services/api';

const SKILL_OPTIONS = [
  'CNC Machines (Lathe, Milling, 5-Axis)',
  'Hydraulic Systems (Presses, Pumps, Valves)',
  'Electrical Panels & PLCs (Siemens, Fanuc)',
  'Compressors & Pneumatics',
  'Conveyor & Material Handling',
  'Industrial Generators',
  'Boilers & Heat Exchangers',
  'Robotic Cells & Automation'
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

  const [newCert, setNewCert] = useState({
    title: '',
    issuer: '',
    year: '2023',
    doc_url: ''
  });

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

  const toggleSkill = (skill) => {
    setProfile(prev => {
      const exists = prev.skills.includes(skill);
      return {
        ...prev,
        skills: exists ? prev.skills.filter(s => s !== skill) : [...prev.skills, skill]
      };
    });
  };

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
        <div className="fixed inset-0 z-[1350] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl relative my-auto max-h-[94vh] flex flex-col text-slate-900">

            {/* Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                <h3 className="font-bold text-slate-900 text-sm">Edit Technician Credentials</h3>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {loading ? (
                  <div className="p-10 text-center text-slate-400 text-xs">
                    Loading...
                  </div>
                  ) : (
                    <form onSubmit={handleSaveProfile} className="flex-1 overflow-y-auto p-5 space-y-4">

                            {/* PFP Upload */}
                            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-3">
                              <img
                                src={profile.avatar_url || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100'}
                                alt=""
                                className="w-14 h-14 rounded-xl object-cover border border-slate-200"
                              />
                              <div className="flex-1">
                                <div className="text-xs font-semibold text-slate-800 mb-1">Profile Photo (PFP)</div>
                                <label className="inline-flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-md cursor-pointer hover:bg-slate-50">
                                  <Upload className="w-3 h-3" />
                                  <span>{uploadingPfp ? 'Uploading...' : 'Change Photo'}</span>
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
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                                  <input
                                    type="text"
                                    value={profile.full_name}
                                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                    required
                                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-slate-700 mb-1">Headline</label>
                                  <input
                                    type="text"
                                    value={profile.headline}
                                    onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                                  />
                                </div>
                              </div>

                                <div className="grid grid-cols-3 gap-2">
                                  <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Experience (Yrs)</label>
                                    <input
                                      type="number"
                                      value={profile.years_experience}
                                      onChange={(e) => setProfile({ ...profile, years_experience: e.target.value })}
                                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Rate (₹/hr)</label>
                                    <input
                                      type="number"
                                      value={profile.hourly_rate}
                                      onChange={(e) => setProfile({ ...profile, hourly_rate: e.target.value })}
                                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Radius (km)</label>
                                    <input
                                      type="number"
                                      value={profile.service_radius_km}
                                      onChange={(e) => setProfile({ ...profile, service_radius_km: e.target.value })}
                                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                                    />
                                  </div>
                                </div>

                                {/* Skills */}
                                <div>
                                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Specialized Skills</label>
                                  <div className="flex flex-wrap gap-1.5">
                                    {SKILL_OPTIONS.map((skill) => {
                                      const selected = profile.skills.includes(skill);
                                      return (
                                        <button
                                          key={skill}
                                          type="button"
                                          onClick={() => toggleSkill(skill)}
                                          className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
                                            selected
                                              ? 'bg-slate-900 text-white'
                                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                          }`}
                                        >
                                          {skill}
                                        </button>
                  );
                })}
              </div>
            </div>

            {/* Certifications Upload */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
              <div className="text-xs font-semibold text-slate-800">Certificates ({profile.certifications.length})</div>
              
              <div className="space-y-1.5">
                {profile.certifications.map((cert, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 p-2 rounded flex items-center justify-between text-xs">
                    <div>
                      <div className="font-medium text-slate-900">{cert.title}</div>
                      <div className="text-[11px] text-slate-500">{cert.issuer} &bull; {cert.year}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCertificate(idx)}
                      className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200">
                <input
                  type="text"
                  placeholder="Cert Name"
                  value={newCert.title}
                  onChange={(e) => setNewCert({ ...newCert, title: e.target.value })}
                  className="bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-900"
                />
                <input
                  type="text"
                  placeholder="Issuer"
                  value={newCert.issuer}
                  onChange={(e) => setNewCert({ ...newCert, issuer: e.target.value })}
                  className="bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-900"
                />
                <div className="flex gap-1.5">
                  <label className="flex-1 bg-white border border-slate-200 rounded flex items-center justify-center text-[11px] text-slate-600 cursor-pointer">
                    <Upload className="w-3 h-3 mr-1" />
                    {uploadingCert ? '...' : newCert.doc_url ? 'Doc OK' : 'File'}
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
                    className="bg-slate-900 text-white text-xs font-medium px-2.5 py-1 rounded"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Past Works Gallery Upload */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
              <div className="text-xs font-semibold text-slate-800">Past Works Gallery ({profile.portfolio.length})</div>

              <div className="grid grid-cols-2 gap-2">
                {profile.portfolio.map((work, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-lg overflow-hidden relative group">
                    <img src={work.image_url} className="w-full h-16 object-cover" />
                    <div className="p-2">
                      <div className="font-medium text-slate-900 text-xs truncate">{work.title}</div>
                      <div className="text-[10px] text-slate-500 truncate">{work.machine_type}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePastWork(idx)}
                      className="absolute top-1 right-1 bg-slate-900/70 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5 pt-1 border-t border-slate-200">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Work Title"
                    value={newWork.title}
                    onChange={(e) => setNewWork({ ...newWork, title: e.target.value })}
                    className="bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-900"
                  />
                  <input
                    type="text"
                    placeholder="Machine Category"
                    value={newWork.machine_type}
                    onChange={(e) => setNewWork({ ...newWork, machine_type: e.target.value })}
                    className="bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-900"
                  />
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Outcome summary"
                    value={newWork.description}
                    onChange={(e) => setNewWork({ ...newWork, description: e.target.value })}
                    className="flex-1 bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-900"
                  />
                  <label className="bg-white border border-slate-200 px-2.5 rounded flex items-center text-[11px] text-slate-600 cursor-pointer">
                    <Upload className="w-3 h-3 mr-1" />
                    {uploadingWork ? '...' : newWork.image_url ? 'Photo OK' : 'Photo'}
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
                    className="bg-slate-900 text-white text-xs font-medium px-3 py-1 rounded"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2 rounded-lg transition"
              >
                {saving ? 'Saving...' : 'Save Credentials'}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
