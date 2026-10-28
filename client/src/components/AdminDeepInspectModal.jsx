import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Wrench, Building2, FileCheck, CheckCircle2, Clock, AlertTriangle, User, DollarSign, Calendar } from 'lucide-react';
import { api } from '../services/api';

export default function AdminDeepInspectModal({ type = 'job', id, isOpen, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && id) {
      setLoading(true);
      if (type === 'job') {
        api.adminJobInspect(id)
          .then(setData)
          .catch(console.error)
          .finally(() => setLoading(false));
      } else {
        api.adminTechnicianInspect(id)
          .then(setData)
          .catch(console.error)
          .finally(() => setLoading(false));
      }
    }
  }, [isOpen, id, type]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1400] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl relative my-auto max-h-[94vh] flex flex-col text-slate-900">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-900" />
            <h3 className="font-bold text-slate-900 text-sm">
              {type === 'job' ? 'Supervisor Audit: Complete Bid & Work Details' : 'Supervisor Audit: Complete Technician Profile & Credentials'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 font-mono">
            Loading deep inspection records...
          </div>
        ) : !data ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Record not found.
          </div>
        ) : type === 'job' ? (
          /* Inspect Job & Bids */
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs font-sans">
            
            {/* Job Header */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-slate-500 text-[11px] font-bold">{data.job.id}</span>
                <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-900 text-white">
                  {data.job.status}
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900">{data.job.title}</h2>
              <div className="text-slate-600">
                Facility: <b>{data.job.company_name}</b> ({data.job.company_contact_name} &bull; {data.job.company_phone})
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Category</span>
                  <span className="font-semibold">{data.job.machine_category}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Brand / Model</span>
                  <span className="font-semibold">{data.job.machine_brand} {data.job.machine_model}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Serial Number</span>
                  <span className="font-mono">{data.job.serial_number || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Budget</span>
                  <span className="font-mono font-bold">₹{data.job.budget_min?.toLocaleString()} - ₹{data.job.budget_max?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* All Proposals Submitted */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                All Proposals & Bids Submitted ({data.proposals?.length || 0})
              </h4>

              {data.proposals?.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-400 text-center">
                  No bids submitted yet for this breakdown.
                </div>
              ) : (
                <div className="space-y-2">
                  {data.proposals.map((prop) => (
                    <div key={prop.id} className="p-3 border border-slate-200 rounded-lg bg-white space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-900">{prop.mechanic_name}</div>
                          <div className="text-[11px] text-slate-500">{prop.mechanic_email} &bull; {prop.mechanic_phone}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold text-slate-900 text-sm">
                            ₹{prop.proposed_price?.toLocaleString()}
                          </div>
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                            prop.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-700' :
                            prop.status === 'WITHDRAWN' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {prop.status}
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                        "{prop.message}" &bull; ETA: <b>{prop.estimated_arrival}</b>
                      </div>

                      {prop.counter_price && (
                        <div className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                          Counter-Offer: ₹{prop.counter_price.toLocaleString()} (by {prop.counter_by})
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Audit History Log */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                Complete Job Audit Trail ({data.history?.length || 0})
              </h4>
              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white">
                {data.history?.map((h) => (
                  <div key={h.id} className="p-2.5 flex items-center justify-between text-[11px]">
                    <div>
                      <span className="font-semibold text-slate-800">{h.status}:</span>
                      <span className="text-slate-600 ml-1.5">{h.note}</span>
                    </div>
                    <span className="text-slate-400 font-mono text-[10px]">
                      {new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          /* Inspect Technician Profile */
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs font-sans">
            
            {/* Tech Profile Summary */}
            <div className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <img
                src={data.user.avatar_url || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100'}
                className="w-14 h-14 rounded-lg object-cover border border-slate-200"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">{data.user.name}</h2>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    data.profile?.is_verified === 1 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {data.profile?.is_verified === 1 ? 'VERIFIED' : 'PENDING'}
                  </span>
                </div>
                <div className="text-slate-600 text-[11px]">{data.user.email} &bull; {data.user.phone}</div>
                <div className="text-slate-700 font-medium mt-0.5">{data.profile?.headline}</div>
              </div>
            </div>

            {/* Certifications Verified */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                Uploaded Certifications ({data.profile?.certifications?.length || 0})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {data.profile?.certifications?.map((c, i) => (
                  <div key={i} className="p-3 bg-white border border-slate-200 rounded-lg flex items-start gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-slate-900">{c.title}</div>
                      <div className="text-slate-500 text-[11px]">{c.issuer} &bull; Year: {c.year}</div>
                      {c.certificate_number && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">Cert ID: {c.certificate_number}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Past Work Case Studies */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                Past Work Portfolio & Case Studies ({data.profile?.portfolio?.length || 0})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.profile?.portfolio?.map((pf, i) => (
                  <div key={i} className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                    <img src={pf.image_url} className="w-full h-24 object-cover" />
                    <div className="p-2.5">
                      <div className="font-bold text-slate-900">{pf.title}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-mono">{pf.machine_type}</div>
                      <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">{pf.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Verified Reviews */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                Plant Manager Reviews ({data.reviews?.length || 0})
              </h4>
              <div className="space-y-2">
                {data.reviews?.map((r) => (
                  <div key={r.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-900">{r.company_name}</span>
                      <span className="font-mono text-slate-700">Rating: {r.rating}.0</span>
                    </div>
                    <p className="text-slate-600 text-[11px] italic">"{r.review_text}"</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

