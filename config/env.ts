
const API_PORT = 8082;

// Development hosts
const DEV_HOST = '192.168.1.5';

const getDevelopmentApiBaseUrl = () => {
  // Expo Go on physical devices (iOS, Android) requires machine LAN IP.
  // Only simulators/emulators can use localhost variants.
  
  // For now, always use machine LAN IP to support Expo Go on physical devices.
  // Simulators also work fine with this.
  return `http://${DEV_HOST}:${API_PORT}`;
};

export const API_BASE_URL = __DEV__
  ? getDevelopmentApiBaseUrl()
  : 'https://api.carenow.example.com';
