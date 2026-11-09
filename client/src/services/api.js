// API Service Client with Environment-Specific Configuration

/**
 * Resolves the API Base URL based on environment:
 * - Development / Localhost:
 *     Uses empty string '' so requests route through the Vite proxy (/api -> http://127.0.0.1:5000)
 *     or hits the local Express server directly on port 5000.
 *     If VITE_API_URL is explicitly set to a local URL (e.g., http://localhost:5000), it uses that.
 *     Never uses a remote Render URL when running locally.
 * - Production:
 *     Uses VITE_API_URL (e.g., https://foodrescueai.onrender.com) if configured (e.g. for Vercel/Netlify).
 *     Falls back to '' for unified Express deployment (where Express serves frontend from client/dist).
 */
export const getApiBaseUrl = () => {
  const envUrl = (import.meta.env.VITE_API_URL || '').trim();

  // Check if running on localhost / private IP in browser
  const isLocalhost = 
    typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1' || 
     window.location.hostname.startsWith('192.168.') ||
     window.location.hostname.startsWith('172.') ||
     window.location.hostname.startsWith('10.'));

  // 1. Local Development or running on Localhost:
  if (import.meta.env.DEV || isLocalhost) {
    if (envUrl && (envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))) {
      return envUrl.replace(/\/+$/, '');
    }
    // Default for local development: use relative path with Vite proxy
    return '';
  }

  // 2. Production Deployment (e.g. Vercel frontend calling Render backend):
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  // Fallback to relative path for same-origin production deployment
  return '';
};

export const API_BASE_URL = getApiBaseUrl();

function getHeaders() {
  const token = localStorage.getItem('fr_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

/**
 * Robust fetch wrapper that handles:
 * - Environment base URL prefixing
 * - Non-JSON responses (HTML 404/500/CORS) without throwing "Unexpected token 'T' is not valid JSON"
 * - Clear error message extraction
 */
export async function apiFetch(endpoint, options = {}) {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${cleanEndpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...getHeaders(),
    ...(options.headers || {})
  };

  // If body is FormData or not a JSON string, let browser handle Content-Type
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  let res;
  try {
    res = await fetch(url, {
      ...options,
      headers
    });
  } catch (networkErr) {
    console.error(`Network fetch error calling ${url}:`, networkErr);
    throw new Error(`Cannot connect to server at ${url}. Please verify the backend server is running.`);
  }

  // Safely parse response content
  const contentType = res.headers.get('content-type') || '';
  let data = null;

  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch (parseErr) {
      console.warn('JSON parse error despite application/json header:', parseErr);
      data = null;
    }
  } else {
    // Non-JSON response (e.g. HTML 404/500 page or plain text)
    const text = await res.text();
    if (!res.ok) {
      // Clean HTML tags if error page was returned
      const cleanText = text.replace(/<[^>]*>?/gm, '').trim().slice(0, 150);
      throw new Error(cleanText || `Request failed with status ${res.status}`);
    }
    return text;
  }

  if (!res.ok) {
    const errorMsg = data?.error || data?.message || `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Authentication
  login: async (email, password, role) => {
    return apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role })
    });
  },

  register: async (userData) => {
    return apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  quickLogin: async (role) => {
    return apiFetch('/api/auth/quick-login', {
      method: 'POST',
      body: JSON.stringify({ role })
    });
  },

  getMe: async () => {
    return apiFetch('/api/auth/me');
  },

  updateProfile: async (data) => {
    return apiFetch('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // Donations
  getDonations: async (params = {}) => {
    const searchParams = new URLSearchParams(params).toString();
    return apiFetch(`/api/donations?${searchParams}`);
  },

  getDonationById: async (id) => {
    return apiFetch(`/api/donations/${id}`);
  },

  createDonation: async (data) => {
    return apiFetch('/api/donations', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  previewSafety: async (data) => {
    return apiFetch('/api/donations/preview-safety', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  deleteDonation: async (id) => {
    return apiFetch(`/api/donations/${id}`, {
      method: 'DELETE'
    });
  },

  // Requests
  getRequests: async (params = {}) => {
    const searchParams = new URLSearchParams(params).toString();
    return apiFetch(`/api/requests?${searchParams}`);
  },

  createRequest: async (data) => {
    return apiFetch('/api/requests', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateRequestStatus: async (id, status, donor_notes = '') => {
    return apiFetch(`/api/requests/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, donor_notes })
    });
  },

  // Smart Matching
  getSmartMatches: async (params = {}) => {
    const searchParams = new URLSearchParams(params).toString();
    return apiFetch(`/api/matching/recommendations?${searchParams}`);
  },

  // Analytics
  getAnalytics: async () => {
    return apiFetch('/api/analytics/dashboard');
  },

  // Notifications
  getNotifications: async () => {
    return apiFetch('/api/notifications');
  },

  markNotificationRead: async (id) => {
    return apiFetch(`/api/notifications/${id}/read`, {
      method: 'PUT'
    });
  },

  markAllNotificationsRead: async () => {
    return apiFetch('/api/notifications/read-all', {
      method: 'PUT'
    });
  },

  // Ratings
  submitRating: async (data) => {
    return apiFetch('/api/ratings', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  getDonorRatings: async (donorId) => {
    return apiFetch(`/api/ratings/donor/${donorId}`);
  },

  // Reports
  submitReport: async (data) => {
    return apiFetch('/api/reports', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  getReports: async () => {
    return apiFetch('/api/reports');
  },

  updateReportStatus: async (id, status) => {
    return apiFetch(`/api/reports/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  },

  // Chatbot
  sendChatMessage: async (message, language = 'en') => {
    return apiFetch('/api/chatbot/message', {
      method: 'POST',
      body: JSON.stringify({ message, language })
    });
  },

  // Admin
  getAdminUsers: async (params = {}) => {
    const searchParams = new URLSearchParams(params).toString();
    return apiFetch(`/api/admin/users?${searchParams}`);
  },

  getUsers: async (params = {}) => {
    const searchParams = new URLSearchParams(params).toString();
    return apiFetch(`/api/admin/users?${searchParams}`);
  },

  verifyUser: async (id, is_verified) => {
    return apiFetch(`/api/admin/users/${id}/verify`, {
      method: 'PUT',
      body: JSON.stringify({ is_verified })
    });
  },

  moderateDonation: async (id, data) => {
    return apiFetch(`/api/admin/donations/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  deleteUser: async (id) => {
    return apiFetch(`/api/admin/users/${id}`, {
      method: 'DELETE'
    });
  }
};
