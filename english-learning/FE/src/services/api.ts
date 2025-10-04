// Works with CRA env; for Vite change to import.meta.env.VITE_API_URL
const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

type User = { id: string; email: string; name?: string };
export type Vocab = { id?: string; word: string; definition?: string; example?: string; difficulty?: string };

const authHeaders = (token?: string) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {})
});

export const authApi = {
  async register(email: string, password: string, name?: string) {
    const r = await fetch(`${BASE}/auth/register`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ email, password, name }) });
    if (!r.ok) throw new Error((await r.json()).error || 'Registration failed');
    return r.json() as Promise<{ token: string; user: User }>;
  },
  async login(email: string, password: string) {
    const r = await fetch(`${BASE}/auth/login`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ email, password }) });
    if (!r.ok) throw new Error((await r.json()).error || 'Login failed');
    return r.json() as Promise<{ token: string }>;
  },
  async me(token: string) {
    const r = await fetch(`${BASE}/auth/me`, { headers: authHeaders(token) });
    if (!r.ok) throw new Error('Failed to fetch user');
    return r.json() as Promise<{ data: User }>;
  }
};

export const vocabApi = {
  async list(token: string) {
    const r = await fetch(`${BASE}/vocab`, { headers: authHeaders(token) });
    if (!r.ok) return [];
    return r.json() as Promise<Vocab[]>;
  },
  async add(token: string, body: Vocab) {
    const r = await fetch(`${BASE}/vocab`, { method: 'POST', headers: authHeaders(token), body: JSON.stringify(body) });
    if (!r.ok) throw new Error((await r.json()).error || 'Failed to add vocab');
    return r.json() as Promise<Vocab>;
  },
  async update(token: string, id: string, body: Partial<Vocab>) {
    const r = await fetch(`${BASE}/vocab/${id}`, { method: 'PUT', headers: authHeaders(token), body: JSON.stringify(body) });
    if (!r.ok) throw new Error('Failed to update vocab');
    return r.json() as Promise<Vocab>;
  },
  async remove(token: string, id: string) {
    const r = await fetch(`${BASE}/vocab/${id}`, { method: 'DELETE', headers: authHeaders(token) });
    if (!r.ok) throw new Error('Failed to delete vocab');
    return r.json() as Promise<{ ok: true }>;
  }
};

export const dictionaryApi = {
  async getDefinition(word: string) {
    const r = await fetch(`${BASE}/auth/dictionary/${encodeURIComponent(word)}`);
    if (!r.ok) throw new Error('Failed to fetch definition');
    return r.json() as Promise<{
      word: string;
      definition: string;
      partOfSpeech: string;
      pronunciation: string;
      synonyms: string;
      source: string;
    }>;
  },
  async test() {
    const r = await fetch(`${BASE}/auth/dictionary/test`);
    if (!r.ok) throw new Error('Dictionary API not available');
    return r.json() as Promise<{ message: string; baseUrl: string }>;
  }
};
