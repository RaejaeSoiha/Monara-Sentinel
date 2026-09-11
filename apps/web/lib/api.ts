const API_BASE = 'http://localhost:3002/api/v1';

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const refreshToken = localStorage.getItem('refreshToken');

  // Make initial request
  let response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: token ? `Bearer ${token}` : '',
    },
  });

  // If 401, try to refresh token
  if (response.status === 401 && refreshToken) {
    try {
      const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);

        // Retry original request with new token
        response = await fetch(`${API_BASE}${url}`, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${data.accessToken}`,
          },
        });
      } else {
        // Refresh failed, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('organization');
        window.location.href = '/login';
        throw new Error('Session expired');
      }
    } catch (error) {
      // Refresh failed, redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('organization');
      window.location.href = '/login';
      throw error;
    }
  }

  // Handle non-200 responses
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Request failed with status ${response.status}`);
  }

  return response;
}

export function handleApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
}
