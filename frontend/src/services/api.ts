// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// API Client with automatic token handling
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };

    // Add ngrok bypass header if using ngrok
    if (this.baseURL.includes('ngrok-free.app')) {
      headers['ngrok-skip-browser-warning'] = 'true';
    }

    return headers;
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    return response.json();
  }

  async get(endpoint: string) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async post(endpoint: string, data?: any) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined
    });
    return this.handleResponse(response);
  }

  async put(endpoint: string, data: any) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  async delete(endpoint: string) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async uploadFile(endpoint: string, formData: FormData) {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {
      ...(token && { 'Authorization': `Bearer ${token}` })
      // Don't set Content-Type for FormData - let browser set it with boundary
    };

    // Add ngrok bypass header if using ngrok
    if (this.baseURL.includes('ngrok-free.app')) {
      headers['ngrok-skip-browser-warning'] = 'true';
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData
    });
    return this.handleResponse(response);
  }
}

export const api = new ApiClient(API_BASE_URL);