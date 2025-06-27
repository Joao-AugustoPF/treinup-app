# Notificações Push - TreinUp App

Este documento descreve a implementação de notificações push no TreinUp App usando Expo Notifications e integração com Appwrite.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Configuração](#configuração)
- [Arquitetura](#arquitetura)
- [Registro de Push Tokens](#registro-de-push-tokens)
- [Uso](#uso)
- [Funcionalidades](#funcionalidades)
- [Testes](#testes)
- [Troubleshooting](#troubleshooting)

## 🎯 Visão Geral

O sistema de notificações push foi implementado seguindo o padrão do projeto, integrando com:

- **Expo Notifications**: Para notificações locais e push
- **Appwrite**: Para armazenamento e sincronização de notificações e push tokens
- **Context API**: Para gerenciamento de estado global
- **Hooks personalizados**: Para facilitar o uso

### 🔄 Fluxo de Push Tokens

1. **Login/Registro**: Push token é automaticamente registrado no Appwrite
2. **Verificação**: Sistema verifica se o token já está registrado
3. **Atualização**: Tokens são atualizados quando necessário
4. **Múltiplos Dispositivos**: Suporte para múltiplos tokens por usuário

## ⚙️ Configuração

### 1. Dependências

As seguintes dependências já estão instaladas:

```json
{
  "expo-notifications": "^0.31.3",
  "expo-device": "~5.9.3",
  "expo-constants": "~17.1.6"
}
```

### 2. Configuração do app.json

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/images/notification-icon.png",
          "color": "#ffffff",
          "sounds": ["./assets/sounds/notification.mp3"]
        }
      ]
    ],
    "android": {
      "permissions": [
        "android.permission.VIBRATE",
        "android.permission.RECEIVE_BOOT_COMPLETED",
        "android.permission.WAKE_LOCK"
      ]
    }
  }
}
```

### 3. Função Appwrite - Register Push Token

A função `registerPushToken` foi criada para gerenciar push tokens:

```javascript
// functions/Register Push Token/src/main.js
export default async ({ req, res, log }) => {
  // Registra ou atualiza push tokens para usuários
  // Suporta múltiplos dispositivos por usuário
};
```

## 🏗️ Arquitetura

### Estrutura de Arquivos

```
src/
├── services/
│   ├── notification.ts          # Serviço de notificações Appwrite
│   ├── pushNotification.ts      # Serviço de notificações push
│   └── pushToken.ts             # Serviço de gerenciamento de push tokens
├── context/
│   ├── AuthContext.tsx          # Contexto de autenticação (com registro automático)
│   └── NotificationContext.tsx  # Contexto de notificações
├── hooks/
│   ├── usePushNotifications.ts  # Hook para notificações push
│   └── usePushTokenRegistration.ts # Hook para registro de tokens
└── components/
    └── PushTokenStatus.tsx      # Componente de status e testes
```

### Fluxo de Dados

1. **Registro**: App solicita permissões e obtém tokens
2. **Armazenamento**: Tokens são armazenados no contexto e Appwrite
3. **Verificação**: Sistema verifica se tokens já estão registrados
4. **Sincronização**: Notificações são sincronizadas com Appwrite
5. **Exibição**: Badge count é atualizado automaticamente
6. **Navegação**: Taps em notificações navegam para telas específicas

## 🔄 Registro de Push Tokens

### Funcionalidades Principais

#### 1. Registro Automático

- **Login**: Push token é registrado automaticamente após login
- **Registro**: Push token é registrado após criação da conta
- **Verificação de Sessão**: Token é verificado/registrado ao restaurar sessão

#### 2. Suporte a Múltiplos Dispositivos

- Cada dispositivo tem um `deviceId` único
- Usuários podem ter múltiplos tokens ativos
- Tokens são identificados por `userId + deviceId`

#### 3. Verificação e Atualização

- Sistema verifica se token já está registrado
- Tokens são atualizados quando necessário
- Fallback para busca por `expoToken`

### Estrutura de Dados no Appwrite

```typescript
type PushTokenRecord = {
  id: string;
  userId: string;
  expoToken: string;
  deviceToken?: string;
  deviceId?: string;
  isActive: boolean;
  createdAt: string;
  lastUpdated: string;
};
```

## 🚀 Uso

### Hook Principal para Push Tokens

```typescript
import { usePushTokenRegistration } from '@/src/hooks/usePushTokenRegistration';

const MyComponent = () => {
  const {
    pushToken,
    isPushRegistered,
    isTokenRegistered,
    registerToken,
    removeToken,
    forceRegistration,
  } = usePushTokenRegistration();

  // Verificar se token está registrado no Appwrite
  const checkRegistration = async () => {
    const registered = await isTokenRegistered();
    console.log('Token registrado:', registered);
  };

  // Registrar token manualmente
  const handleRegister = async () => {
    const success = await registerToken();
    console.log('Registro bem-sucedido:', success);
  };
};
```

### Hook para Notificações

```typescript
import { usePushNotifications } from '@/src/hooks/usePushNotifications';

const MyComponent = () => {
  const {
    pushToken,
    isPushRegistered,
    sendTestNotification,
    scheduleWorkoutReminderForTomorrow,
    scheduleDailyWorkoutReminder,
    // ... outros métodos
  } = usePushNotifications();

  // Usar os métodos conforme necessário
};
```

### Contexto de Notificações

```typescript
import { useNotifications } from '@/src/context/NotificationContext';

const MyComponent = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    // ... outros métodos
  } = useNotifications();

  // Usar os métodos conforme necessário
};
```

### Componente de Status e Testes

```typescript
import { PushTokenStatus } from '@/src/components/PushTokenStatus';

const TestScreen = () => {
  return (
    <View>
      <PushTokenStatus />
    </View>
  );
};
```

## 🔧 Funcionalidades

### 1. Registro Automático de Tokens

O sistema registra automaticamente push tokens nos seguintes momentos:

- **Login**: Após autenticação bem-sucedida
- **Registro**: Após criação de conta
- **Restauração de Sessão**: Ao abrir o app com sessão ativa

### 2. Verificação de Registro

```typescript
// Verificar se token está registrado
const isRegistered = await PushTokenService.isTokenRegistered(userId, token);

// Registrar token
const result = await PushTokenService.registerPushToken(userId, token);
```

### 3. Notificações Locais

#### Notificação Imediata

```typescript
const notificationId = await scheduleLocalNotification('Título', 'Mensagem', {
  screen: '/workouts',
});
```

#### Lembrete de Treino

```typescript
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(8, 0, 0, 0);

const notificationId = await scheduleWorkoutReminder(
  'Lembrete de Treino',
  'Seu treino está agendado para 8:00',
  tomorrow,
  { screen: '/workouts' }
);
```

#### Lembrete Diário

```typescript
const notificationId = await scheduleDailyReminder(
  'Hora do Treino',
  'Não esqueça do seu treino diário!',
  8, // hora
  0, // minuto
  { screen: '/workouts' }
);
```

### 4. Gerenciamento de Badge

```typescript
// Definir badge count
await setBadgeCount(5);

// Limpar badge
await clearBadge();

// Obter badge count
const count = await getBadgeCount();
```

## 🧪 Testes

### Componente de Teste

Use o componente `PushTokenStatus` para testar todas as funcionalidades:

```typescript
import { PushTokenStatus } from '@/src/components/PushTokenStatus';

// Adicione em qualquer tela para testes
<PushTokenStatus />;
```

### Testes Manuais

1. **Login/Logout**: Verificar se tokens são registrados/removidos
2. **Múltiplos Dispositivos**: Testar em diferentes dispositivos
3. **Permissões**: Verificar solicitação de permissões
4. **Notificações**: Testar envio de notificações locais

### Logs Úteis

```typescript
// Habilitar logs detalhados
console.log('Push token:', pushToken);
console.log('Badge count:', await getBadgeCount());
console.log('Scheduled notifications:', await getScheduledNotifications());
```

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. Tokens não registrados

- **Causa**: Função Appwrite não configurada
- **Solução**: Verificar se a função `registerPushToken` está ativa

#### 2. Permissões negadas

- **Causa**: Usuário negou permissões de notificação
- **Solução**: Guiar usuário para configurações do app

#### 3. Badge não atualiza

- **Causa**: Permissões de badge não concedidas
- **Solução**: Verificar configurações do dispositivo

#### 4. Notificações não agendadas

- **Causa**: Data/hora inválida
- **Solução**: Verificar se a data é futura

#### 5. Tokens não obtidos

- **Causa**: Project ID não configurado
- **Solução**: Verificar `app.json` e `eas.json`

### Debug no Dispositivo

1. **iOS**: Verificar configurações de notificação
2. **Android**: Verificar configurações de aplicativo
3. **Expo Go**: Notificações push não funcionam, use development build

## 📱 Integração com Appwrite

### Estrutura de Dados

```typescript
// Notificações
type Notification = {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  tenantId: string;
  readBy: string[];
  deletedBy: string[];
  createdAt: Date;
};

// Push Tokens
type PushTokenRecord = {
  id: string;
  userId: string;
  expoToken: string;
  deviceToken?: string;
  deviceId?: string;
  isActive: boolean;
  createdAt: string;
  lastUpdated: string;
};
```

### Sincronização

- Notificações são sincronizadas automaticamente
- Push tokens são registrados/atualizados automaticamente
- Badge count é atualizado baseado em notificações não lidas
- Realtime updates via Appwrite subscriptions

## 🎨 Personalização

### Cores e Sons

Edite `app.json` para personalizar:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/images/notification-icon.png",
          "color": "#007AFF",
          "sounds": ["./assets/sounds/custom-notification.mp3"]
        }
      ]
    ]
  }
}
```

### Canais Android

Modifique `pushNotification.ts` para adicionar novos canais:

```typescript
await Notifications.setNotificationChannelAsync('custom', {
  name: 'Custom Channel',
  importance: Notifications.AndroidImportance.HIGH,
  vibrationPattern: [0, 250, 250, 250],
  lightColor: '#FF0000',
});
```

## 📚 Referências

- [Expo Notifications Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Appwrite Documentation](https://appwrite.io/docs)
- [React Native Push Notifications](https://github.com/zo0r/react-native-push-notification)

## 🤝 Contribuição

Para adicionar novas funcionalidades:

1. Atualize o serviço `pushToken.ts`
2. Adicione métodos ao contexto `NotificationContext.tsx`
3. Crie hooks personalizados se necessário
4. Atualize a documentação
5. Teste em dispositivos físicos

### **🎨 Próximos Passos Sugeridos:**

1. **Integre com funcionalidades específicas** do app (agendamento de treinos, etc.)
2. **Configure notificações push remotas** via Expo Push Service
3. **Personalize ícones e sons** conforme necessário
4. **Implemente notificações push remotas** usando os tokens registrados

O sistema está pronto para uso e segue exatamente o padrão arquitetural do projeto! 🎉

---

**Nota**: Notificações push requerem dispositivos físicos para funcionar corretamente. Emuladores/simuladores não suportam push notifications.
