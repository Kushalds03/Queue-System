import {
  User,
  Queue,
  Token,
  AnalyticsData,
} from '../types/index.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  [key: string]: any;
}

async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('queueflow_token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      // If unauthorized, clear token and notify
      if (res.status === 401 && !endpoint.includes('/auth/login')) {
        localStorage.removeItem('queueflow_token');
        localStorage.removeItem('queueflow_user');
        window.dispatchEvent(new Event('auth:unauthorized'));
      }

      throw new Error(data.message || `Request failed with status ${res.status}`);
    }

    return data;
  } catch (error: any) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
}

// 1. Auth API
export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    return request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  register: async (data: {
    name: string;
    email: string;
    password: string;
    organization?: string;
  }) => {
    return request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getMe: async () => {
    return request<{ user: User }>('/auth/me');
  },

  updateProfile: async (data: {
    name?: string;
    organization?: string;
    currentPassword?: string;
    newPassword?: string;
  }) => {
    return request<{ user: User }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// 2. Queue API
export const queueApi = {
  getQueues: async () => {
    return request<{ queues: Queue[] }>('/queues');
  },

  getQueueById: async (id: string) => {
    return request<{ queue: Queue }>(`/queues/${id}`);
  },

  createQueue: async (data: {
    name: string;
    description?: string;
    prefix: string;
  }) => {
    return request<{ queue: Queue }>('/queues', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateQueue: async (
    id: string,
    data: { name?: string; description?: string; prefix?: string; status?: string }
  ) => {
    return request<{ queue: Queue }>(`/queues/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  toggleQueueStatus: async (id: string) => {
    return request<{ queue: Queue }>(`/queues/${id}/toggle-status`, {
      method: 'PATCH',
    });
  },

  deleteQueue: async (id: string) => {
    return request(`/queues/${id}`, {
      method: 'DELETE',
    });
  },
};

// 3. Token API
export const tokenApi = {
  createToken: async (data: {
    queueId: string;
    customerName: string;
    customerPhone?: string;
    notes?: string;
  }) => {
    return request<{ token: Token }>('/tokens', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getWaitingTokens: async (queueId: string) => {
    return request<{ tokens: Token[]; count: number }>(
      `/tokens/queue/${queueId}/waiting`
    );
  },

  getCurrentlyServing: async (queueId: string) => {
    return request<{ servingToken: Token | null }>(
      `/tokens/queue/${queueId}/serving`
    );
  },

  callNext: async (queueId: string) => {
    return request<{ servingToken: Token }>('/tokens/call-next', {
      method: 'POST',
      body: JSON.stringify({ queueId }),
    });
  },

  completeService: async (tokenId: string) => {
    return request<{ token: Token }>(`/tokens/${tokenId}/complete`, {
      method: 'PATCH',
    });
  },

  cancelToken: async (tokenId: string) => {
    return request<{ token: Token }>(`/tokens/${tokenId}/cancel`, {
      method: 'PATCH',
    });
  },

  moveToken: async (tokenId: string, direction: 'UP' | 'DOWN') => {
    return request<{ tokens: Token[] }>(`/tokens/${tokenId}/move`, {
      method: 'PATCH',
      body: JSON.stringify({ direction }),
    });
  },

  batchReorderTokens: async (queueId: string, orderedTokenIds: string[]) => {
    return request<{ tokens: Token[] }>('/tokens/reorder', {
      method: 'POST',
      body: JSON.stringify({ queueId, orderedTokenIds }),
    });
  },

  getTokenHistory: async (queueId: string, status?: string) => {
    const query = status ? `?status=${status}` : '';
    return request<{ tokens: Token[] }>(`/tokens/queue/${queueId}/history${query}`);
  },
};

// 4. Analytics API
export const analyticsApi = {
  getAnalytics: async (queueId?: string) => {
    const query = queueId ? `?queueId=${queueId}` : '';
    return request<AnalyticsData>(`/analytics${query}`);
  },
};
