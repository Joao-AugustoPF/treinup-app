import { useAuth } from '@/src/context/AuthContext';
import { useLocalization } from '@/src/context/LocalizationContext';
import { useNotifications } from '@/src/context/NotificationContext';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, Check, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type NotificationType = 'info' | 'success' | 'warning' | 'error';

const NotificationIcon = ({ type }: { type: NotificationType }) => {
  const iconColor = {
    info: 'rgba(255,20,147,0.7)',
    success: '#4CAF50',
    warning: '#FFC107',
    error: '#FF4444',
  }[type];

  return <Bell size={24} color={iconColor} />;
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { t } = useLocalization();
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    refreshNotifications,
  } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);

  console.log(notifications);

  const handleNotificationPress = async (id: string) => {
    await markAsRead(id);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  };

  const isNotificationRead = (notification: any) => {
    return notification.readBy?.includes(user?.$id);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>{t('notificationsTitle')}</Text>
          <Text style={styles.subtitle}>
            {unreadCount} {t('unread')}
          </Text>
        </View>
      </View>

      {notifications.length > 0 && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={markAllAsRead}>
            <Check size={20} color="rgba(255,20,147,0.7)" />
            <Text style={styles.actionButtonText}>{t('markAllAsRead')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.clearButton]}
            onPress={clearAllNotifications}
          >
            <Trash2 size={20} color="#FF4444" />
            <Text style={[styles.actionButtonText, styles.clearButtonText]}>
              {t('delete')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Bell size={48} color="#333" />
            <Text style={styles.emptyTitle}>{t('noNotifications')}</Text>
            <Text style={styles.emptyText}>{t('noNotifications')}</Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationCard,
                !isNotificationRead(notification) && styles.unreadCard,
              ]}
              onPress={() => handleNotificationPress(notification.id)}
            >
              <View style={styles.notificationIcon}>
                <NotificationIcon type={notification.type} />
              </View>
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>
                  {notification.title}
                </Text>
                <Text style={styles.notificationMessage}>
                  {notification.message}
                </Text>
                <Text style={styles.notificationTime}>
                  {new Date(notification.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => clearNotification(notification.id)}
              >
                <Trash2 size={16} color="#666" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: '#1a1a1a',
    gap: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#252525',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: 'rgba(255,20,147,0.7)',
    fontSize: 14,
    fontWeight: 'bold',
  },
  clearButton: {
    backgroundColor: '#1a1a1a',
  },
  clearButtonText: {
    color: '#FF4444',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  unreadCard: {
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(255,20,147,0.7)',
  },
  notificationIcon: {
    marginRight: 15,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#444',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 10,
  },
});
