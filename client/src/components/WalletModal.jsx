import React, { useState, useEffect } from 'react';
import { X, Wallet, ArrowDownRight, ArrowUpRight, ShieldCheck, DollarSign, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export default function WalletModal({ isOpen, onClose, currentUser, onBalanceUpdated }) {
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'withdraw', 'topup'
  
  // Withdraw form
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankAccount, setBankAccount] = useState('HDFC Bank - •••• 4092');
  const [withdrawing, setWithdrawing] = useState(false);
  
  // Topup form
  const [topupAmount, setTopupAmount] = useState('25000');
  const [toppingUp, setToppingUp] = useState(false);
  
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);

  const isTechnician = currentUser?.role === 'mechanic';

  const fetchWallet = async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    try {
      const res = await api.getWallet(currentUser.id);
      setWalletData(res);
    } catch (err) {
      console.error('Wallet error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && currentUser) {
      fetchWallet();
      setMsg(null);
      setError(null);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const wallet = walletData?.wallet || { balance: 0, escrow_locked: 0, total_withdrawn: 0 };
  const transactions = walletData?.transactions || [];

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setError(null);
    setMsg(null);
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt <= 0 || amt > wallet.balance) {
      setError('Please enter a valid amount within your available balance.');
      return;
    }

    setWithdrawing(true);
    try {
      const res = await api.withdrawFunds(currentUser.id, amt, bankAccount);
      if (res.error) {
        setError(res.error);
      } else {
        setMsg(`Payout of ₹${amt.toLocaleString()} transferred to ${bankAccount}.`);
        setWithdrawAmount('');
        setActiveTab('overview');
        fetchWallet();
        if (onBalanceUpdated) onBalanceUpdated();
      }
    } catch (err) {
      setError('Withdrawal failed');
    } finally {
      setWithdrawing(false);
    }
  };

  const handleTopup = async (e) => {
    e.preventDefault();
    setError(null);
    setMsg(null);
    const amt = parseFloat(topupAmount);
    if (!amt || amt <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    setToppingUp(true);
    try {
      const res = await api.topupWallet(currentUser.id, amt);
      if (res.error) {
        setError(res.error);
      } else {
        setMsg(`Added ₹${amt.toLocaleString()} to operational escrow account.`);
        setActiveTab('overview');
        fetchWallet();
        if (onBalanceUpdated) onBalanceUpdated();
      }
    } catch (err) {
      setError('Top-up failed');
    } finally {
      setToppingUp(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1400] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl relative my-auto max-h-[94vh] flex flex-col text-slate-900">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-slate-800" />
            <h3 className="font-bold text-slate-900 text-sm">Industrial Escrow & Settlement Wallet</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          
          {msg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{msg}</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Wallet KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-slate-900 text-white rounded-xl">
              <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider mb-1">
                Available Balance
              </div>
              <div className="text-2xl font-bold font-mono">
                ₹{wallet.balance?.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Instant liquid settlement</div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-[10px] text-slate-500 uppercase font-mono tracking-wider mb-1">
                Escrow Protected
              </div>
              <div className="text-2xl font-bold font-mono text-slate-800">
                ₹{wallet.escrow_locked?.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Active repair milestones</div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-[10px] text-slate-500 uppercase font-mono tracking-wider mb-1">
                Total Payouts
              </div>
              <div className="text-2xl font-bold font-mono text-slate-800">
                ₹{wallet.total_withdrawn?.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Transferred to bank</div>
            </div>
          </div>

          {/* Action Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'overview' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Transaction Ledger
            </button>

            {isTechnician ? (
              <button
                onClick={() => setActiveTab('withdraw')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'withdraw' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Withdraw Funds
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('topup')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'topup' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Top-Up Escrow Funds
              </button>
            )}
          </div>

          {/* Tab 1: Withdraw (for Technician) */}
          {activeTab === 'withdraw' && (
            <form onSubmit={handleWithdraw} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h4 className="font-bold text-xs text-slate-900">Transfer Funds to Linked Bank Account</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Withdrawal Amount (₹) - Max ₹{wallet.balance?.toLocaleString()}
                  </label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="e.g. 15000"
                    required
                    max={wallet.balance}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Destination Bank Account
                  </label>
                  <select
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
                  >
                    <option value="HDFC Bank - •••• 4092">HDFC Bank - •••• 4092 (Primary)</option>
                    <option value="SBI Industrial - •••• 1928">State Bank of India - •••• 1928</option>
                    <option value="ICICI Current - •••• 8841">ICICI Bank - •••• 8841</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="px-3 py-1.5 text-xs text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={withdrawing || wallet.balance <= 0}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2 rounded-lg transition disabled:opacity-50 cursor-pointer"
                >
                  {withdrawing ? 'Processing Transfer...' : 'Confirm Withdrawal'}
                </button>
              </div>
            </form>
          )}

          {/* Tab 2: Top-up (for Company) */}
          {activeTab === 'topup' && (
            <form onSubmit={handleTopup} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h4 className="font-bold text-xs text-slate-900">Pre-Fund Breakdown Repair Escrow</h4>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Top-up Amount (₹)
                </label>
                <input
                  type="number"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  placeholder="e.g. 50000"
                  required
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="px-3 py-1.5 text-xs text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={toppingUp}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                >
                  {toppingUp ? 'Adding Funds...' : 'Add Escrow Funds'}
                </button>
              </div>
            </form>
          )}

          {/* Tab 3: Transaction History */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Settlement Activity ({transactions.length})
            </h4>

            {transactions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No transactions recorded yet.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200 text-left text-[11px] text-slate-500">
                    <tr>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">Description</th>
                      <th className="py-2 px-3 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.map((tx) => {
                      const isPositive = tx.amount > 0;
                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 text-[11px] text-slate-500 font-mono">
                            {new Date(tx.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-2 px-3">
                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                              tx.type === 'PAYOUT' || tx.type === 'CREDIT'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {tx.type}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-700 text-xs">
                            {tx.description}
                          </td>
                          <td className={`py-2 px-3 text-right font-mono font-semibold ${
                            isPositive ? 'text-emerald-600' : 'text-slate-900'
                          }`}>
                            {isPositive ? `+₹${tx.amount.toLocaleString()}` : `-₹${Math.abs(tx.amount).toLocaleString()}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

