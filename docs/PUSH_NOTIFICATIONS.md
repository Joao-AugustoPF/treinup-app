# Notificações Push - TreinUp App

Este documento descreve a implementação de notificações push no TreinUp App usando Expo Notifications.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Configuração](#configuração)
- [Arquitetura](#arquitetura)
- [Uso](#uso)
- [Funcionalidades](#funcionalidades)
- [Testes](#testes)
- [Troubleshooting](#troubleshooting)

## 🎯 Visão Geral

O sistema de notificações push foi implementado seguindo o padrão do projeto, integrando com:
- **Expo Notifications**: Para notificações locais e push
- **Appwrite**: Para armazenamento e sincronização de notificações
- **Context API**: Para gerenciamento de estado global
- **Hooks personalizados**: Para facilitar o uso

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

### 3. Permissões

O sistema solicita automaticamente as permissões necessárias:
- **iOS**: Permissões de notificação são solicitadas em tempo de execução
- **Android**: Permissões são declaradas no manifest e solicitadas em tempo de execução

## 🏗️ Arquitetura

### Estrutura de Arquivos

```
src/
├── services/
│   ├── notification.ts          # Serviço de notificações Appwrite
│   └── pushNotification.ts      # Serviço de notificações push
├── context/
│   └── NotificationContext.tsx  # Contexto de notificações
└── hooks/
    └── usePushNotifications.ts  # Hook personalizado
```

### Fluxo de Dados

1. **Registro**: App solicita permissões e obtém tokens
2. **Armazenamento**: Tokens são armazenados no contexto
3. **Sincronização**: Notificações são sincronizadas com Appwrite
4. **Exibição**: Badge count é atualizado automaticamente
5. **Navegação**: Taps em notificações navegam para telas específicas

## 🚀 Uso

### Hook Principal

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

## 🔧 Funcionalidades

### 1. Notificações Locais

#### Notificação Imediata
```typescript
const notificationId = await scheduleLocalNotification(
  'Título',
  'Mensagem',
  { screen: '/workouts' }
);
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
  'Hora do Treino! 💪',
  'Não esqueça do seu treino diário',
  7, // hora
  0, // minuto
  { screen: '/workouts' }
);
```

#### Lembrete Semanal
```typescript
const notificationId = await scheduleWeeklyMotivation(
  1, // domingo
  9, // 9:00 AM
  0  // minuto
);
```

### 2. Gerenciamento de Badge

```typescript
// Obter contador atual
const count = await getBadgeCount();

// Definir contador
await setBadgeCount(5);

// Limpar badge
await clearBadge();
```

### 3. Cancelamento de Notificações

```typescript
// Cancelar notificação específica
await cancelNotification(notificationId);

// Cancelar todas as notificações
await cancelAllNotifications();
```

### 4. Canais Android

O sistema cria automaticamente os seguintes canais:
- **default**: Notificações gerais
- **workout**: Lembretes de treino
- **progress**: Atualizações de progresso
- **community**: Notificações da comunidade

## 🧪 Testes

### Hook Principal

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

## 🔍 Troubleshooting

### Problemas Comuns

#### 1. Notificações não aparecem
- **Causa**: Permissões não concedidas
- **Solução**: Verificar se `isPushRegistered` é `true`

#### 2. Badge não atualiza
- **Causa**: Permissões de badge não concedidas
- **Solução**: Verificar configurações do dispositivo

#### 3. Notificações não agendadas
- **Causa**: Data/hora inválida
- **Solução**: Verificar se a data é futura

#### 4. Tokens não obtidos
- **Causa**: Project ID não configurado
- **Solução**: Verificar `app.json` e `eas.json`

### Logs Úteis

```typescript
// Habilitar logs detalhados
console.log('Push token:', pushToken);
console.log('Badge count:', await getBadgeCount());
console.log('Scheduled notifications:', await getScheduledNotifications());
```

### Debug no Dispositivo

1. **iOS**: Verificar configurações de notificação
2. **Android**: Verificar configurações de aplicativo
3. **Expo Go**: Notificações push não funcionam, use development build

## 📱 Integração com Appwrite

### Estrutura de Dados

```typescript
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
```

### Sincronização

- Notificações são sincronizadas automaticamente
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

1. Atualize o serviço `pushNotification.ts`
2. Adicione métodos ao contexto `NotificationContext.tsx`
3. Crie hooks personalizados se necessário
4. Atualize a documentação
5. Teste em dispositivos físicos

### **🎨 Próximos Passos Sugeridos:**

1. **Integre com funcionalidades específicas** do app (agendamento de treinos, etc.)
2. **Configure notificações push remotas** via Expo Push Service
3. **Personalize ícones e sons** conforme necessário

O sistema está pronto para uso e segue exatamente o padrão arquitetural do projeto! 🎉

---

**Nota**: Notificações push requerem dispositivos físicos para funcionar corretamente. Emuladores/simuladores não suportam push notifications. 