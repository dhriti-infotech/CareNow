
const API_PORT = 8082;

// Expo Go running on a physical device must use this machine's LAN address.
const DEV_HOST = '192.168.1.4';

const getDevelopmentApiBaseUrl = () => {
  return `http://${DEV_HOST}:${API_PORT}`;
};

export const API_BASE_URL = __DEV__
  ? getDevelopmentApiBaseUrl()
  : 'https://api.carenow.example.com';
