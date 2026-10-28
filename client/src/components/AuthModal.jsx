import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('company');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [companyName, setCompanyName] = useState('');
  const [industryType, setIndustryType] = useState('Manufacturing');
  const [city, setCity] = useState('Pune');
  const [skills, setSkills] = useState('CNC Machines, Hydraulic Systems');
  const [experience, setExperience] = useState('5');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (isLogin) {
        const res = await api.login(email);
        if (res.success && res.user) {
          onAuthSuccess(res.user);
          onClose();
        } else {
          setError(res.error || 'Login failed');
        }
      } else {
        const payload = {
          name,
          email,
          password: password || 'pass123',
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
      }
    } catch (err) {
      console.error(err);
      setError('Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = async (targetEmail) => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.login(targetEmail);
      if (res.success && res.user) {
        onAuthSuccess(res.user);
        onClose();
      } else {
        setError(res.error || 'Login failed');
      }
    } catch (err) {
      setError('Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
        <div className="fixed inset-0 z-[1400] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md overflow-hidden shadow-2xl relative my-auto text-slate-900">

            {/* Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">
                  {isLogin ? 'Sign In' : 'Create Account'}
                </h3>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {error && (
                  <div className="mx-5 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
        )}

                    <form onSubmit={handleSubmit} className="p-5 space-y-3.5">

                          {!isLogin && (
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">Account Type</label>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => setRole('company')}
                                  className={`py-2 text-xs font-semibold rounded-lg border transition cursor-pointer ${role === 'company'
                                      ? 'bg-slate-900 text-white border-slate-900'
                                      : 'bg-white text-slate-600 border-slate-200'
                                    }`}
                                >
                                  Company
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRole('mechanic')}
                                  className={`py-2 text-xs font-semibold rounded-lg border transition cursor-pointer ${role === 'mechanic'
                                      ? 'bg-slate-900 text-white border-slate-900'
                                      : 'bg-white text-slate-600 border-slate-200'
                                    }`}
                                >
                                  Technician
                                </button>
                              </div>
                            </div>
          )}

                          {!isLogin && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {role === 'company' ? 'Manager Name' : 'Full Name'}
              </label>
              <input
                type="text"
                placeholder={role === 'company' ? 'e.g. Ramesh Kulkarni' : 'e.g. Anand Shinde'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
              />
            </div>
          )}

                          {!isLogin && role === 'company' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Company Name</label>
              <input
                type="text"
                placeholder="e.g. Precision Engineering Ltd."
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required={!isLogin}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
              />
            </div>
          )}

                            {!isLogin && role === 'mechanic' && (
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-xs font-medium text-slate-700 mb-1">Experience (Years)</label>
                                  <input
                                  type="number"
                                  value={experience}
                                  onChange={(e) => setExperience(e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">City</label>
                                <select
                                  value={city}
                                  onChange={(e) => setCity(e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
                                >
                                  <option value="Pune">Pune</option>
                                  <option value="Mumbai">Mumbai</option>
                                  <option value="Chennai">Chennai</option>
                                  <option value="Bangalore">Bangalore</option>
                                </select>
                              </div>
                            </div>
          )}

                              <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                                <input
                                  type="email"
                                  placeholder="name@domain.com"
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  required
                                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
                                <input
                                  type="password"
                                  placeholder="••••••••"
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  required
                                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                                />
                              </div>

                              <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2.5 rounded-lg transition cursor-pointer mt-2"
                              >
                                {submitting ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
                              </button>

                              <div className="text-center pt-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsLogin(!isLogin);
                                    setError(null);
                                  }}
                                  className="text-xs text-slate-600 hover:text-slate-900 underline cursor-pointer"
                                >
                                  {isLogin ? "Don't have an account? Register" : "Already have an account? Sign In"}
                                </button>
                              </div>

                              {/* Quick Demo Logins */}
                              <div className="pt-3 border-t border-slate-100 space-y-1.5">
                                <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
                                  Test Accounts
                                </span>
                                <div className="grid grid-cols-3 gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleQuickLogin('operations@apexmfg.com')}
                                    className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium py-1.5 px-2 rounded-lg transition cursor-pointer truncate"
                                  >
                                    Apex (Company)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleQuickLogin('rajesh.cnc@mechconnect.pro')}
                                    className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium py-1.5 px-2 rounded-lg transition cursor-pointer truncate"
                                  >
                                    Rajesh (Tech)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleQuickLogin('admin@mechconnect.io')}
                                    className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium py-1.5 px-2 rounded-lg transition cursor-pointer truncate"
                                  >
                                    Admin (Ops)
                                  </button>
                                </div>
                              </div>

                            </form>
                          </div>
    </div>
                      );
}
