const API_PORT = 8082;

let APP_ENV: 'dev' | 'prod' = 'prod';

const DEV_HOST = '192.168.1.2';

const CLOUD_API_BASE_URL = 'https://api.dhritex.com';

const getDevelopmentApiBaseUrl = () => {
  return `http://${DEV_HOST}:${API_PORT}`;
};

const getApiBaseUrl = () => {
  if (APP_ENV === 'prod') {
    return CLOUD_API_BASE_URL;
  }

  return getDevelopmentApiBaseUrl();
};

export const API_BASE_URL = getApiBaseUrl();

export const IS_PRODUCTION = APP_ENV === 'prod';