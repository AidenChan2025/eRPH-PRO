
/**
 * eRPH Pro MySQL API Client
 * This service handles communication with the MySQL-backed REST API.
 * In production, replace the BASE_URL with your Node.js/PHP backend.
 */

const BASE_URL = '/index.cgi';

const fetchApi = async (endpoint: string, options: any = {}) => {
  const token = localStorage.getItem('erph_token');
  const isFormData = options.body instanceof FormData;
  const headers: any = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${BASE_URL}/api${endpoint}`, { ...options, headers });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${response.statusText} - ${errorText.substring(0, 200)}`);
  }
  return response.json();
};

export const api = {
  auth: {
    login: (credentials: any) => fetchApi('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    logout: () => { localStorage.removeItem('erph_token'); },
    getProfile: () => fetchApi('/auth/profile')
  },
  lessonPlans: {
    list: (params: any) => fetchApi(`/lesson-plans?${new URLSearchParams(params)}`),
    get: (id: string) => fetchApi(`/lesson-plans/${id}`),
    save: (data: any) => fetchApi('/lesson-plans', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi(`/lesson-plans/${id}`, { method: 'DELETE' })
  },
  cms: {
    getArticles: (params: any) => fetchApi(`/articles?${new URLSearchParams(params)}`),
    getArticle: (slug: string) => fetchApi(`/articles/${slug}`),
    triggerCrawl: () => fetchApi('/cms/crawl', { method: 'POST' }),
    notifications: {
      get: (userId: string) => fetchApi(`/notifications/${userId}`),
      markRead: (id: string) => fetchApi(`/notifications/${id}/read`, { method: 'POST' })
    },
    auth: {
      getGoogleUrl: () => fetchApi('/auth/google/url'),
      connectGoogle: (code: string, userId: string) => fetchApi('/auth/google/callback', {
        method: 'POST',
        body: JSON.stringify({ code, userId })
      })
    },
    user: {
      backupToDrive: (userId: string) => fetchApi('/backup/drive', {
        method: 'POST',
        body: JSON.stringify({ userId })
      })
    }
  },
  admin: {
    createSchool: (formData: FormData) => fetchApi('/admin/schools', {
      method: 'POST',
      body: formData,
      headers: {}
    }),
    sendNewsletter: (data: any) => fetchApi('/admin/newsletter/send', { method: 'POST', body: JSON.stringify(data) }),
    getSettings: () => fetchApi('/admin/settings'),
    updateSettings: (data: any) => fetchApi('/admin/settings', { method: 'PUT', body: JSON.stringify(data) }),
    getSchools: () => fetchApi('/admin/schools'),
    getUsers: (params?: any) => fetchApi(`/admin/users?${new URLSearchParams(params)}`)
  },
  tasks: {
    list: () => fetchApi('/tasks'),
    updateStatus: (id: string, status: string) => fetchApi(`/tasks/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
  },
  dskp: {
    list: (params: any) => fetchApi(`/dskp?${new URLSearchParams(params)}`),
    getOptions: () => fetchApi('/dskp/options'),
    listStructure: () => fetchApi('/dskp/structure'),
    updateNode: (id: string | number, data: any) => fetchApi(`/dskp/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string | number) => fetchApi(`/dskp/${id}`, { method: 'DELETE' }),
    sync: (data: any) => fetchApi('/dskp/sync', { method: 'POST', body: JSON.stringify(data) })
  },
  users: {
    check: (email: string) => fetchApi(`/users/check?email=${encodeURIComponent(email)}`)
  },
  leave: {
    list: (params: any) => fetchApi(`/leaves?${new URLSearchParams(params)}`),
    create: (data: any) => fetchApi('/leaves', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi(`/leaves/${id}`, { method: 'DELETE' })
  }
};
