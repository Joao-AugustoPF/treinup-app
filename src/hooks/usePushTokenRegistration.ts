import { useAuth } from '@/src/context/AuthContext';
import { useNotifications } from '@/src/context/NotificationContext';
import { PushTokenService } from '@/src/services/pushToken';
import { useCallback, useEffect } from 'react';

export const usePushTokenRegistration = () => {
  const { user } = useAuth();
  const { pushToken, isPushRegistered, registerForPushNotifications } =
    useNotifications();

  /**
   * Verifica se o push token atual está registrado no Appwrite
   */
  const checkTokenRegistration = useCallback(async (): Promise<boolean> => {
    if (!pushToken?.expoToken) {
      return false;
    }

    try {
      return await PushTokenService.isTokenRegistered(pushToken);
    } catch (error) {
      console.error('Erro ao verificar registro do token:', error);
      return false;
    }
  }, [pushToken]);

  /**
   * Registra o push token atual no Appwrite
   */
  const registerCurrentToken = useCallback(async (): Promise<boolean> => {
    if (!pushToken?.expoToken) {
      console.log('Token não disponível');
      return false;
    }

    try {
      const result = await PushTokenService.registerPushToken(pushToken);
      return result.success;
    } catch (error) {
      console.error('Erro ao registrar push token:', error);
      return false;
    }
  }, [pushToken]);

  /**
   * Remove o push token atual do Appwrite
   */
  const removeCurrentToken = useCallback(async (): Promise<boolean> => {
    if (!pushToken?.expoToken) {
      return false;
    }

    try {
      return await PushTokenService.removePushToken(pushToken);
    } catch (error) {
      console.error('Erro ao remover push token:', error);
      return false;
    }
  }, [pushToken]);

  /**
   * Remove todos os push targets do usuário
   */
  const removeAllTokens = useCallback(async (): Promise<boolean> => {
    try {
      return await PushTokenService.removeAllPushTargets();
    } catch (error) {
      console.error('Erro ao remover todos os push tokens:', error);
      return false;
    }
  }, []);

  /**
   * Lista todos os push targets do usuário
   */
  const listTokens = useCallback(async () => {
    try {
      return await PushTokenService.listPushTargets();
    } catch (error) {
      console.error('Erro ao listar push tokens:', error);
      return [];
    }
  }, []);

  /**
   * Força o registro de push notifications e token
   */
  const forceRegistration = useCallback(async (): Promise<void> => {
    try {
      console.log('🔄 Forçando registro de push notifications...');
      await registerForPushNotifications();
    } catch (error) {
      console.error('Erro ao forçar registro:', error);
    }
  }, [registerForPushNotifications]);

  // Verificar automaticamente se o token está registrado quando o usuário logar
  useEffect(() => {
    if (user?.$id && pushToken?.expoToken && isPushRegistered) {
      checkTokenRegistration().then((isRegistered) => {
        if (!isRegistered) {
          console.log(
            '🔄 Token não registrado, registrando automaticamente...'
          );
          registerCurrentToken();
        } else {
          console.log('✅ Token já registrado no Appwrite');
        }
      });
    }
  }, [
    user?.$id,
    pushToken,
    isPushRegistered,
    checkTokenRegistration,
    registerCurrentToken,
  ]);

  return {
    isTokenRegistered: checkTokenRegistration,
    registerToken: registerCurrentToken,
    removeToken: removeCurrentToken,
    removeAllTokens,
    listTokens,
    forceRegistration,
    pushToken,
    isPushRegistered,
  };
};
