import * as SecureStore from 'expo-secure-store';

const KEYS = {
  SESSION_ID: 'session_id',
  JWT: 'jwt',
  ACTIVE_TENANT_ID: 'active_tenant_id',
} as const;

export const secureStore = {
  async setSessionId(sessionId: string) {
    await SecureStore.setItemAsync(KEYS.SESSION_ID, sessionId);
  },

  async getSessionId() {
    console.log(
      'getSessionId',
      await SecureStore.getItemAsync(KEYS.SESSION_ID)
    );
    return await SecureStore.getItemAsync(KEYS.SESSION_ID);
  },

  async setJWT(jwt: string) {
    await SecureStore.setItemAsync(KEYS.JWT, jwt);
  },

  async getJWT() {
    return await SecureStore.getItemAsync(KEYS.JWT);
  },

  async setActiveTenantId(tenantId: string) {
    await SecureStore.setItemAsync(KEYS.ACTIVE_TENANT_ID, tenantId);
  },

  async getActiveTenantId() {
    
    return await SecureStore.getItemAsync(KEYS.ACTIVE_TENANT_ID);
  },

  async clearAll() {
    await Promise.all([
      SecureStore.deleteItemAsync(KEYS.SESSION_ID),
      SecureStore.deleteItemAsync(KEYS.JWT),
      SecureStore.deleteItemAsync(KEYS.ACTIVE_TENANT_ID),
    ]);
  },
};
