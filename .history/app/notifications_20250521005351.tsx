import { useAuth } from '@/src/context/AuthContext';
import { useLocalization } from '@/src/context/LocalizationContext';
import { useNotifications } from '@/src/context/NotificationContext';
import { useTheme } from '@/src/context/ThemeContext';
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
  const { paperTheme } = useTheme();

  const iconColor = {
    info: paperTheme.colors.primary,
    success: paperTheme.colors.primary,
    warning: paperTheme.colors.error,
    error: paperTheme.colors.error,
  }[type];

  return <Bell size={24} color={iconColor} />;
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { t } = useLocalization();
  const { user } = useAuth();
  const { paperTheme } = useTheme();
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
    <View
      style={[
        styles.container,
        { backgroundColor: paperTheme.colors.background },
      ]}
    >
      <View
        style={[styles.header, { backgroundColor: paperTheme.colors.surface }]}
      >
        <TouchableOpacity
          onPress={() => router.back}
          style={[
            styles.backButton,
            { backgroundColor: paperTheme.colors.surfaceVariant },
          ]}
        >
          <ArrowLeft size={24} color={paperTheme.colors.onSurface} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.title, { color: paperTheme.colors.onSurface }]}>
            {t('notificationsTitle')}
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: paperTheme.colors.onSurfaceVariant },
            ]}
          >
            {unreadCount} {t('unread')}
          </Text>
        </View>
      </View>

      {notifications.length > 0 && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: paperTheme.colors.surface },
            ]}
            onPress={markAllAsRead}
          >
            <Check size={20} color={paperTheme.colors.primary} />
            <Text
              style={[
                styles.actionButtonText,
                { color: paperTheme.colors.primary },
              ]}
            >
              {t('markAllAsRead')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.clearButton,
              { backgroundColor: paperTheme.colors.surface },
            ]}
            onPress={clearAllNotifications}
          >
            <Trash2 size={20} color={paperTheme.colors.error} />
            <Text
              style={[
                styles.actionButtonText,
                styles.clearButtonText,
                { color: paperTheme.colors.error },
              ]}
            >
              {t('delete')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[paperTheme.colors.primary]}
            tintColor={paperTheme.colors.primary}
          />
        }
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Bell size={48} color={paperTheme.colors.onSurfaceVariant} />
            <Text
              style={[
                styles.emptyTitle,
                { color: paperTheme.colors.onSurface },
              ]}
            >
              {t('noNotifications')}
            </Text>
            <Text
              style={[
                styles.emptyText,
                { color: paperTheme.colors.onSurfaceVariant },
              ]}
            >
              {t('noNotifications')}
            </Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationCard,
                { backgroundColor: paperTheme.colors.surface },
                !isNotificationRead(notification) && {
                  borderLeftColor: paperTheme.colors.primary,
                },
              ]}
              onPress={() => handleNotificationPress(notification.id)}
            >
              <View style={styles.notificationIcon}>
                <NotificationIcon type={notification.type} />
              </View>
              <View style={styles.notificationContent}>
                <Text
                  style={[
                    styles.notificationTitle,
                    { color: paperTheme.colors.onSurface },
                  ]}
                >
                  {notification.title}
                </Text>
                <Text
                  style={[
                    styles.notificationMessage,
                    { color: paperTheme.colors.onSurfaceVariant },
                  ]}
                >
                  {notification.message}
                </Text>
                <Text
                  style={[
                    styles.notificationTime,
                    { color: paperTheme.colors.onSurfaceVariant },
                  ]}
                >
                  {new Date(notification.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => clearNotification(notification.id)}
              >
                <Trash2 size={16} color={paperTheme.colors.onSurfaceVariant} />
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    gap: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
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
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  clearButton: {
    backgroundColor: 'transparent',
  },
  clearButtonText: {
    color: 'inherit',
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
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  notificationCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
    borderLeftWidth: 3,
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
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 10,
  },
});
