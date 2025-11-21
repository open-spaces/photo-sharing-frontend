// API Configuration - Used only by App.js to configure the entire application
// Respects environment variables set during Docker build or development
const API_CONFIG = {
  // Base URL for the API
  // In development: http://localhost:8000
  // In production: uses REACT_APP_API_URL from environment (e.g., https://wedding.open-spaces.xyz/api)
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8000',

  // WebSocket URL (without protocol)
  // In development: localhost:8000
  // In production: uses REACT_APP_WS_URL from environment (e.g., wedding.open-spaces.xyz)
  WS_URL: process.env.REACT_APP_WS_URL || 'localhost:8000',

  // Available endpoints (for documentation)
  ENDPOINTS: {
    PHOTOS: '/api/photos',
    MY_PHOTOS: '/api/my-photos',
    GOOGLE_LOGIN: '/api/google-login',
    VERIFY_TOKEN: '/api/verify-token',
    UPLOAD: '/api/upload',
    GUEST_COUNT: '/api/guest',
    WEBSOCKET: '/ws'
  }
};

// Helper function to get full API URL - used by App.js
export const getApiUrl = (endpoint = '') => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to get WebSocket URL - used by App.js
export const getWebSocketUrl = (endpoint = '') => {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${protocol}://${API_CONFIG.WS_URL}${endpoint}`;
};

export default API_CONFIG;

// Helper for building DELETE photo endpoint
export const deletePhotoUrl = (id) => `${API_CONFIG.BASE_URL}/photos/${id}`;
