import React, { useState, useEffect } from 'react';
import { X, Printer, ShieldCheck, CheckCircle2, Building2, Wrench, FileText, Calendar, Hash } from 'lucide-react';
import { api } from '../services/api';

export default function ReceiptModal({ jobId, isOpen, onClose }) {
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && jobId) {
      setLoading(true);
      api.getReceipt(jobId)
        .then((res) => {
          if (!res.error) setReceipt(res);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, jobId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1400] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl relative my-auto max-h-[94vh] flex flex-col text-slate-900">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-800" />
            <h3 className="font-bold text-slate-900 text-sm">Industrial Work Completion Receipt</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 font-mono">
            Loading official work order receipt...
          </div>
        ) : !receipt ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No receipt has been generated yet for this job. Work must be marked completed first.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 font-sans">
            
            {/* Top Brand & Receipt Meta */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-200 gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
                  <Wrench className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="font-extrabold text-base tracking-tight text-slate-900">MechConnect</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Official Work Certificate</div>
                </div>
              </div>

              <div className="sm:text-right">
                <div className="text-xs font-bold font-mono text-slate-900">
                  {receipt.receipt_number}
                </div>
                <div className="text-[11px] text-slate-500">
                  Issued: {new Date(receipt.issued_at).toLocaleDateString()} at {new Date(receipt.issued_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>

            {/* Parties Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Industrial Plant / Client</span>
                <div className="font-bold text-slate-900">{receipt.company_name || 'Apex Heavy Machining'}</div>
                <div className="text-slate-600">{receipt.company_contact_name} &bull; {receipt.company_phone}</div>
                <div className="text-slate-500 text-[11px] mt-0.5">{receipt.address}, {receipt.city}</div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Certified Field Technician</span>
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span>{receipt.mechanic_name}</span>
                  <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded font-mono font-medium">Verified</span>
                </div>
                <div className="text-slate-600">{receipt.mechanic_headline || 'Specialist'}</div>
                <div className="text-slate-500 text-[11px] mt-0.5">Phone: {receipt.mechanic_phone || 'Verified on platform'}</div>
              </div>
            </div>

            {/* Machinery Specifications */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Machinery Serviced</span>
              <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2 text-xs">
                <div className="flex justify-between items-center font-bold text-slate-900">
                  <span>{receipt.job_title}</span>
                  <span className="font-mono text-slate-500 text-[11px]">{receipt.machine_category}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Brand / Model</span>
                    <span className="font-medium text-slate-800">{receipt.machine_brand || 'N/A'} {receipt.machine_model || ''}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Serial Number</span>
                    <span className="font-mono text-slate-800">{receipt.serial_number || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Asset Tag</span>
                    <span className="font-mono text-slate-800">{receipt.asset_tag || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Labor Hours</span>
                    <span className="font-mono text-slate-800">{receipt.time_taken_hours || 2.5} hrs</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Scope of Work & Parts */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Work Performed & Consumables</span>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 block">Technical Diagnostic Summary:</span>
                  <p className="text-slate-800">{receipt.work_summary || 'Diagnosed failure, aligned precision tolerances, and verified operational parameters under full industrial load.'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 block">Parts / Materials Replaced:</span>
                  <p className="text-slate-800 font-mono text-[11px]">{receipt.parts_used || 'Standard OEM replacement seals & lubricants'}</p>
                </div>
              </div>
            </div>

            {/* Itemized Financials */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Payment & Settlement Breakdown</span>
              <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200 text-left text-[11px] text-slate-500">
                    <tr>
                      <th className="py-2 px-3">Item Description</th>
                      <th className="py-2 px-3 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-2 px-3 text-slate-800">Field Diagnostics & Specialized Labor</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-900">₹{receipt.base_price?.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-800">Replacement Spares & Hardware Consumables</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-900">₹{receipt.parts_cost?.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-500">Platform Escrow & Guarantee Protection (5%)</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-500">₹{receipt.service_fee?.toLocaleString()}</td>
                    </tr>
                    <tr className="bg-slate-50 font-bold border-t border-slate-200">
                      <td className="py-2.5 px-3 text-slate-900">Total Settlement Authorized</td>
                      <td className="py-2.5 px-3 text-right font-mono text-sm text-slate-900">₹{receipt.total_amount?.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Settlement Confirmation Stamp */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="font-semibold">Payment Status: Authorized & Released via MechConnect Escrow</span>
              </div>
              <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-300">
                PAID
              </span>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

