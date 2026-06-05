import axios from "axios";

const baseURL = "http://localhost:5000";

export const api = axios.create({ baseURL, timeout: 4000 });

// Configure Axios interceptor to automatically append JWT bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("kns_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export interface StandupPost {
  _id?: string;
  user_id?: string;
  author: string;
  yesterday: string;
  today: string;
  blockers: string;
  has_blocker: boolean;
  file_attachment: string | null;
  timestamp: string;
}

export interface StandupStats {
  posts_per_day: { date: string; count: number }[];
  blocker_count: number;
  total_posts: number;
  total_blockers: number;
  active_members: number;
}

export const standupsApi = {
  list: async (): Promise<StandupPost[]> => {
    const r = await api.get<StandupPost[]>("/standups");
    return r.data;
  },
  create: async (formData: FormData): Promise<StandupPost> => {
    const r = await api.post<StandupPost>("/standups", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return r.data;
  },
  stats: async (): Promise<StandupStats> => {
    const r = await api.get<StandupStats>("/stats");
    return r.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/standups/${id}`);
  }
};

export const authApi = {
  login: async (email: string, password: string): Promise<{ token: string; user: { id: string; name: string; email: string; role: string } }> => {
    const r = await api.post("/api/auth/login", { email, password });
    return r.data;
  },
  provisionUser: async (userData: { email: string; name: string; role: string; password?: string }): Promise<any> => {
    const r = await api.post("/api/users", userData);
    return r.data;
  }
};

// Storage helper functions
export const getToken = () => localStorage.getItem("kns_token");
export const getStoredUser = () => localStorage.getItem("kns_user");
export const setToken = (token: string) => localStorage.setItem("kns_token", token);
export const setStoredUser = (user: string) => localStorage.setItem("kns_user", user);
