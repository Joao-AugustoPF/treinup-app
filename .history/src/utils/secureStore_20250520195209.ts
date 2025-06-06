// Mock implementation for testing
const mockStorage: Record<string, string> = {};

const KEYS = {
  SESSION_ID: 'session_id',
  JWT: 'jwt',
  ACTIVE_TENANT_ID: 'active_tenant_id',
} as const;

export const secureStore = {
  async setSessionId(sessionId: string) {
    mockStorage[KEYS.SESSION_ID] = sessionId;
    console.log('Mock: Set session ID:', sessionId);
  },

  async getSessionId() {
    const value = mockStorage[KEYS.SESSION_ID];
    console.log('Mock: Get session ID:', value);
    return value;
  },

  async setJWT(jwt: string) {
    mockStorage[KEYS.JWT] = jwt;
    console.log('Mock: Set JWT:', jwt);
  },

  async getJWT() {
    const value = mockStorage[KEYS.JWT];
    console.log('Mock: Get JWT:', value);
    return value;
  },

  async setActiveTenantId(tenantId: string) {
    mockStorage[KEYS.ACTIVE_TENANT_ID] = tenantId;
    console.log('Mock: Set active tenant ID:', tenantId);
  },

  async getActiveTenantId() {
    const value = mockStorage[KEYS.ACTIVE_TENANT_ID];
    console.log('Mock: Get active tenant ID:', value);
    return value;
  },

  async clearAll() {
    Object.keys(mockStorage).forEach((key) => {
      delete mockStorage[key];
    });
    console.log('Mock: Cleared all storage');
  },
};
