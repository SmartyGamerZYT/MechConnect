import { io } from 'socket.io-client';

const API_BASE = '/api';

export const socket = io(typeof window !== 'undefined' ? window.location.origin : '', {
  transports: ['polling', 'websocket'],
  autoConnect: true,
  reconnection: true
});

export const api = {
  // Auth
  getUsers: async () => {
    const res = await fetch(`${API_BASE}/auth/users`);
    return res.json();
  },
  login: async (email) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return res.json();
  },
  register: async (userData) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return res.json();
  },

  // Jobs
  getJobs: async (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) searchParams.append(k, v);
    });
    const res = await fetch(`${API_BASE}/jobs?${searchParams.toString()}`);
    return res.json();
  },
  getJobDetails: async (id) => {
    const res = await fetch(`${API_BASE}/jobs/${id}`);
    return res.json();
  },
  createJob: async (jobData) => {
    const res = await fetch(`${API_BASE}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jobData)
    });
    return res.json();
  },
  updateJobStatus: async (id, statusData) => {
    const res = await fetch(`${API_BASE}/jobs/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(statusData)
    });
    return res.json();
  },
  deleteJob: async (jobId, userId) => {
    const res = await fetch(`${API_BASE}/jobs/${jobId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    });
    return res.json();
  },
  completeJob: async (jobId, data) => {
    const res = await fetch(`${API_BASE}/jobs/${jobId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Proposals & Quotes
  applyToJob: async (id, proposalData) => {
    const res = await fetch(`${API_BASE}/jobs/${id}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proposalData)
    });
    return res.json();
  },
  cancelBid: async (jobId, proposalId, mechanicUserId) => {
    const res = await fetch(`${API_BASE}/jobs/${jobId}/proposals/${proposalId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mechanic_user_id: mechanicUserId })
    });
    return res.json();
  },
  counterProposal: async (jobId, proposalId, counterData) => {
    const res = await fetch(`${API_BASE}/jobs/${jobId}/proposals/${proposalId}/counter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(counterData)
    });
    return res.json();
  },
  acceptProposal: async (jobId, proposalId, companyUserId) => {
    const res = await fetch(`${API_BASE}/jobs/${jobId}/proposals/${proposalId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company_user_id: companyUserId })
    });
    return res.json();
  },

  // Chat
  getChatMessages: async (jobId) => {
    const res = await fetch(`${API_BASE}/chats/${jobId}`);
    return res.json();
  },
  sendMessage: async (jobId, messageData) => {
    const res = await fetch(`${API_BASE}/chats/${jobId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messageData)
    });
    return res.json();
  },

  // Receipts
  getReceipt: async (jobId) => {
    const res = await fetch(`${API_BASE}/receipts/${jobId}`);
    return res.json();
  },

  // Wallet
  getWallet: async (userId) => {
    const res = await fetch(`${API_BASE}/wallet/${userId}`);
    return res.json();
  },
  withdrawFunds: async (userId, amount, bankAccount) => {
    const res = await fetch(`${API_BASE}/wallet/withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount, bankAccount })
    });
    return res.json();
  },
  topupWallet: async (userId, amount) => {
    const res = await fetch(`${API_BASE}/wallet/topup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount })
    });
    return res.json();
  },

  // Analytics
  getAnalytics: async (role, userId) => {
    const res = await fetch(`${API_BASE}/analytics/${role}/${userId}`);
    return res.json();
  },

  // Mechanics
  getMechanics: async (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) searchParams.append(k, v);
    });
    const res = await fetch(`${API_BASE}/mechanics?${searchParams.toString()}`);
    return res.json();
  },
  getMechanicProfile: async (userId) => {
    const res = await fetch(`${API_BASE}/mechanics/${userId}`);
    return res.json();
  },
  updateMechanicProfile: async (userId, data) => {
    const res = await fetch(`${API_BASE}/mechanics/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Companies
  getCompanyProfile: async (userId) => {
    const res = await fetch(`${API_BASE}/companies/${userId}`);
    return res.json();
  },
  updateCompanyProfile: async (userId, data) => {
    const res = await fetch(`${API_BASE}/companies/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  toggleTrustedMechanic: async (companyUserId, mechanicUserId) => {
    const res = await fetch(`${API_BASE}/companies/${companyUserId}/trusted`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mechanic_user_id: mechanicUserId })
    });
    return res.json();
  },

  // Reviews
  submitReview: async (reviewData) => {
    const res = await fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewData)
    });
    return res.json();
  },

  // Admin
  getAdminOverview: async () => {
    const res = await fetch(`${API_BASE}/admin/overview`);
    return res.json();
  },
  verifyTechnician: async (userId, action = 'approve') => {
    const res = await fetch(`${API_BASE}/admin/verify-technician`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, action })
    });
    return res.json();
  },
  adminJobInspect: async (jobId) => {
    const res = await fetch(`${API_BASE}/admin/job-deep-inspect/${jobId}`);
    return res.json();
  },
  adminTechnicianInspect: async (userId) => {
    const res = await fetch(`${API_BASE}/admin/technician-deep-inspect/${userId}`);
    return res.json();
  },

  // Upload File/Image
  uploadFile: async (file, uploadedByUserId, entityType = 'general', entityId = null) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploaded_by_user_id', uploadedByUserId);
    formData.append('entity_type', entityType);
    if (entityId) formData.append('entity_id', entityId);

    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData
    });
    return res.json();
  }
};
