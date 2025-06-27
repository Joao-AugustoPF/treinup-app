import * as Device from 'expo-device';
import { account } from '../api/appwrite-client';
import { PushNotificationToken } from './pushNotification';

export type PushTarget = {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  name: string;
  userId: string;
  providerId: string;
  identifier: string;
  providerType: string;
};

export class PushTokenService {
  /**
   * Registra um push token usando Push Targets nativo do Appwrite
   */
  static async registerPushToken(
    token: PushNotificationToken
  ): Promise<{ success: boolean; targetId?: string; action?: string }> {
    try {
      if (!token.expoToken) {
        throw new Error('Expo token is required');
      }

      // Obter deviceId único para o dispositivo
      const deviceId = await this.getDeviceId();
      const targetName = `Device_${deviceId}`;

      console.log('🔔 Registrando push target:', {
        name: targetName,
        identifier: token.expoToken,
        deviceId,
      });

      // Usar o sistema nativo de Push Targets do Appwrite
      const result = await account.createPushTarget(
        targetName, // targetId (nome único)
        token.expoToken, // identifier (expo token)
        'expo' // providerId (para Expo)
      );

      console.log('✅ Push target criado com sucesso:', result);

      return {
        success: true,
        targetId: result.$id,
        action: 'created',
      };
    } catch (error: any) {
      // Se o target já existe, tentar atualizar
      if (error.code === 409) {
        console.log('🔄 Push target já existe, tentando atualizar...');
        return await this.updatePushTarget(token);
      }

      console.error('❌ Erro ao registrar push target:', error);
      return {
        success: false,
      };
    }
  }

  /**
   * Atualiza um push target existente
   */
  private static async updatePushTarget(
    token: PushNotificationToken
  ): Promise<{ success: boolean; targetId?: string; action?: string }> {
    try {
      const deviceId = await this.getDeviceId();
      const targetName = `Device_${deviceId}`;

      // Atualizar o target existente
      const result = await account.updatePushTarget(
        targetName, // targetId
        token.expoToken, // identifier
        'expo' // providerId
      );

      console.log('✅ Push target atualizado com sucesso:', result);

      return {
        success: true,
        targetId: result.$id,
        action: 'updated',
      };
    } catch (error) {
      console.error('❌ Erro ao atualizar push target:', error);
      return {
        success: false,
      };
    }
  }

  /**
   * Obtém um deviceId único para o dispositivo
   */
  private static async getDeviceId(): Promise<string> {
    try {
      // Usar Device.osInternalBuildId se disponível, senão usar Device.modelName
      const deviceId =
        Device.osInternalBuildId || Device.modelName || 'unknown';
      const platform = Device.osName || 'unknown';
      const version = Device.osVersion || 'unknown';

      // Criar um ID único baseado nas características do dispositivo
      return `${platform}_${version}_${deviceId}`.replace(
        /[^a-zA-Z0-9_-]/g,
        '_'
      );
    } catch (error) {
      console.warn('Erro ao obter deviceId:', error);
      return 'unknown_device';
    }
  }

  /**
   * Lista todos os push targets do usuário atual
   */
  static async listPushTargets(): Promise<PushTarget[]> {
    try {
      const targets = await account.listPushTargets();
      console.log('📱 Push targets encontrados:', targets.targets);
      return targets.targets;
    } catch (error) {
      console.error('❌ Erro ao listar push targets:', error);
      return [];
    }
  }

  /**
   * Verifica se um push token já está registrado
   */
  static async isTokenRegistered(
    token: PushNotificationToken
  ): Promise<boolean> {
    try {
      if (!token.expoToken) {
        return false;
      }

      const targets = await this.listPushTargets();
      return targets.some((target) => target.identifier === token.expoToken);
    } catch (error) {
      console.error('Erro ao verificar se token está registrado:', error);
      return false;
    }
  }

  /**
   * Remove um push target específico
   */
  static async removePushTarget(targetId: string): Promise<boolean> {
    try {
      await account.deletePushTarget(targetId);
      console.log('✅ Push target removido:', targetId);
      return true;
    } catch (error) {
      console.error('❌ Erro ao remover push target:', error);
      return false;
    }
  }

  /**
   * Remove todos os push targets do usuário
   */
  static async removeAllPushTargets(): Promise<boolean> {
    try {
      const targets = await this.listPushTargets();

      for (const target of targets) {
        await this.removePushTarget(target.$id);
      }

      console.log('✅ Todos os push targets removidos');
      return true;
    } catch (error) {
      console.error('❌ Erro ao remover todos os push targets:', error);
      return false;
    }
  }

  /**
   * Remove push target por token
   */
  static async removePushToken(token: PushNotificationToken): Promise<boolean> {
    try {
      if (!token.expoToken) {
        return false;
      }

      const targets = await this.listPushTargets();
      const target = targets.find((t) => t.identifier === token.expoToken);

      if (target) {
        return await this.removePushTarget(target.$id);
      }

      return false;
    } catch (error) {
      console.error('Erro ao remover push token:', error);
      return false;
    }
  }
}
