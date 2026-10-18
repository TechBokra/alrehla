export const API_PREFIX = '/api' as const;

export const API_ROUTES = {
  health: `${API_PREFIX}/health`,
  message: `${API_PREFIX}/message`
} as const;

export const APP_NAME = 'System Design Practice' as const;
