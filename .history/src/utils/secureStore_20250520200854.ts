import * as SecureStore from 'expo-secure-store';

const KEYS = {
  SESSION_ID: 'session_id',
  JWT: 'jwt',
  ACTIVE_TENANT_ID: 'active_tenant_id',
} as const;

// Debug log to check if SecureStore is properly imported
console.log('SecureStore import check:', {
  isDefined: typeof SecureStore !== 'undefined',
  methods: Object.keys(SecureStore),
});

export const secureStore = {
  async setSessionId(sessionId: string) {
    console.log('setSessionId called with:', sessionId);
    try {
      await SecureStore.setItemAsync(KEYS.SESSION_ID, sessionId);
      console.log('setSessionId successful');
    } catch (error) {
      console.error('setSessionId error:', error);
      throw error;
    }
  },

  async getSessionId() {
    console.log('getSessionId called');
    try {
      const result = await SecureStore.getItemAsync(KEYS.SESSION_ID);
      console.log('getSessionId result:', result);
      return result;
    } catch (error) {
      console.error('getSessionId error:', error);
      throw error;
    }
  },

  async setJWT(jwt: string) {
    console.log('setJWT called with:', jwt);
    try {
      await SecureStore.setItemAsync(KEYS.JWT, jwt);
      console.log('setJWT successful');
    } catch (error) {
      console.error('setJWT error:', error);
      throw error;
    }
  },

  async getJWT() {
    console.log('getJWT called');
    try {
      const result = await SecureStore.getItemAsync(KEYS.JWT);
      console.log('getJWT result:', result);
      return result;
    } catch (error) {
      console.error('getJWT error:', error);
      throw error;
    }
  },

  async setActiveTenantId(tenantId: string) {
    console.log('setActiveTenantId called with:', tenantId);
    try {
      await SecureStore.setItemAsync(KEYS.ACTIVE_TENANT_ID, tenantId);
      console.log('setActiveTenantId successful');
    } catch (error) {
      console.error('setActiveTenantId error:', error);
      throw error;
    }
  },

  async getActiveTenantId() {
    console.log('getActiveTenantId called');
    try {
      const result = await SecureStore.getItemAsync(KEYS.ACTIVE_TENANT_ID);
      console.log('getActiveTenantId result:', result);
      return result;
    } catch (error) {
      console.error('getActiveTenantId error:', error);
      throw error;
    }
  },

  async clearAll() {
    console.log('clearAll called');
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(KEYS.SESSION_ID),
        SecureStore.deleteItemAsync(KEYS.JWT),
        SecureStore.deleteItemAsync(KEYS.ACTIVE_TENANT_ID),
      ]);
      console.log('clearAll successful');
    } catch (error) {
      console.error('clearAll error:', error);
      throw error;
    }
  },
};
