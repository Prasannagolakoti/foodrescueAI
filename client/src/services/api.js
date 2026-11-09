// API Service Client

function getHeaders() {
  const token = localStorage.getItem('fr_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const api = {
  // Donations
  getDonations: async (params = {}) => {
    const searchParams = new URLSearchParams(params).toString();
    const res = await fetch(`/api/donations?${searchParams}`, { headers: getHeaders() });
    return res.json();
  },

  getDonationById: async (id) => {
    const res = await fetch(`/api/donations/${id}`, { headers: getHeaders() });
    return res.json();
  },

  createDonation: async (data) => {
    const res = await fetch('/api/donations', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to create donation');
    return result;
  },

  previewSafety: async (data) => {
    const res = await fetch('/api/donations/preview-safety', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  deleteDonation: async (id) => {
    const res = await fetch(`/api/donations/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.json();
  },

  // Requests
  getRequests: async (params = {}) => {
    const searchParams = new URLSearchParams(params).toString();
    const res = await fetch(`/api/requests?${searchParams}`, { headers: getHeaders() });
    return res.json();
  },

  createRequest: async (data) => {
    const res = await fetch('/api/requests', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to submit request');
    return result;
  },

  updateRequestStatus: async (id, status, donor_notes = '') => {
    const res = await fetch(`/api/requests/${id}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status, donor_notes })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to update request');
    return result;
  },

  // Smart Matching
  getSmartMatches: async (params = {}) => {
    const searchParams = new URLSearchParams(params).toString();
    const res = await fetch(`/api/matching/recommendations?${searchParams}`, { headers: getHeaders() });
    return res.json();
  },

  // Analytics
  getAnalytics: async () => {
    const res = await fetch('/api/analytics/dashboard', { headers: getHeaders() });
    return res.json();
  },

  // Notifications
  getNotifications: async () => {
    const res = await fetch('/api/notifications', { headers: getHeaders() });
    return res.json();
  },

  markNotificationRead: async (id) => {
    const res = await fetch(`/api/notifications/${id}/read`, {
      method: 'PUT',
      headers: getHeaders()
    });
    return res.json();
  },

  markAllNotificationsRead: async () => {
    const res = await fetch('/api/notifications/read-all', {
      method: 'PUT',
      headers: getHeaders()
    });
    return res.json();
  },

  // Ratings
  submitRating: async (data) => {
    const res = await fetch('/api/ratings', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to submit rating');
    return result;
  },

  getDonorRatings: async (donorId) => {
    const res = await fetch(`/api/ratings/donor/${donorId}`, { headers: getHeaders() });
    return res.json();
  },

  // Reports
  submitReport: async (data) => {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to file report');
    return result;
  },

  getReports: async () => {
    const res = await fetch('/api/reports', { headers: getHeaders() });
    return res.json();
  },

  updateReportStatus: async (id, status) => {
    const res = await fetch(`/api/reports/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });
    return res.json();
  },

  // Chatbot
  sendChatMessage: async (message, language = 'en') => {
    const res = await fetch('/api/chatbot/message', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ message, language })
    });
    return res.json();
  },

  // Admin
  getAdminUsers: async (params = {}) => {
    const searchParams = new URLSearchParams(params).toString();
    const res = await fetch(`/api/admin/users?${searchParams}`, { headers: getHeaders() });
    return res.json();
  },

  verifyUser: async (id, is_verified) => {
    const res = await fetch(`/api/admin/users/${id}/verify`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ is_verified })
    });
    return res.json();
  },

  moderateDonation: async (id, data) => {
    const res = await fetch(`/api/admin/donations/${id}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  deleteUser: async (id) => {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.json();
  },

  updateProfile: async (data) => {
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  }
};

