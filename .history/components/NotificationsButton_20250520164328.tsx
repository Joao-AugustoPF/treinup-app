import { useAuth } from '@/src/context/AuthContext';
import { useNotifications } from '@/src/context/NotificationContext';
import { useTheme } from '@/src/context/ThemeContext';
import { ProfileService } from '@/src/services/profile';
import { useAudioPlayer } from 'expo-audio';
import { useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function NotificationsButton() {
  const { unreadCount, notifications } = useNotifications();
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [showIcon, setShowIcon] = useState(true);
  const positionAnim = useRef(new Animated.Value(-28)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const prevNotificationsLength = useRef(notifications.length);

  // Initialize audio player with notification sound
  const player = useAudioPlayer(require('@/assets/sounds/notification.mp3'));

  // Colors based on theme
  const buttonBg = isDarkMode ? 'rgba(255,20,147,0.7)' : '#00A090';
  const shadowColor = isDarkMode ? 'rgba(255,20,147,0.7)' : '#00A090';
  const badgeBg = '#FF4444';
  const textColor = '#fff';

  useEffect(() => {
    // Play animation and sound when notifications array changes or unreadCount changes
    if (notifications.length > prevNotificationsLength.current) {
      playNotificationEffect();
    }
    prevNotificationsLength.current = notifications.length;
  }, [notifications, unreadCount]);

  const playSound = async () => {
    try {
      // Stop any current playback
      await player.stop();
      // Reset position to start
      await player.seekTo(0);
      // Play the sound
      await player.play();
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  const playNotificationEffect = async () => {
    // Shake animation - using native driver for transform
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Play sound
    await playSound();
  };

  const testSound = async () => {
    await playSound();
  };

  useEffect(() => {
    // Load user preference for showing notification icon
    const loadPreference = async () => {
      try {
        const profile = await ProfileService.getUserProfile(user);
        const shouldShow = profile.preferences.showNotificationIcon ?? true;
        setShowIcon(shouldShow);
      } catch (error) {
        console.error('Failed to load notification preferences:', error);
      }
    };

    if (user) {
      loadPreference();
    }
  }, [user]);

  const toggleExpand = () => {
    if (expanded) {
      router.push('/notifications');
      setTimeout(() => {
        Animated.timing(positionAnim, {
          toValue: -28,
          duration: 300,
          useNativeDriver: false,
        }).start(() => setExpanded(false));
      }, 300);
    } else {
      setExpanded(true);
      Animated.timing(positionAnim, {
        toValue: 20,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  if (!showIcon) {
    return null;
  }

  return (
    <>
      {/* Temporary test button */}
      <TouchableOpacity
        style={[styles.testButton, { backgroundColor: buttonBg }]}
        onPress={testSound}
      >
        <Text style={styles.testButtonText}>Test Sound</Text>
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.container,
          {
            right: positionAnim,
          },
        ]}
      >
        <Animated.View
          style={{
            transform: [{ translateX: shakeAnim }],
          }}
        >
          <TouchableOpacity
            style={[styles.button, { backgroundColor: buttonBg, shadowColor }]}
            onPress={toggleExpand}
          >
            <Bell size={24} color={textColor} />
            {unreadCount > 0 && (
              <View style={[styles.badge, { backgroundColor: badgeBg }]}>
                <Text style={[styles.badgeText, { color: textColor }]}>
                  {unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    zIndex: 1000,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  badge: {
    position: 'absolute',
    top: -4,
    left: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  testButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    padding: 10,
    borderRadius: 8,
    zIndex: 1000,
  },
  testButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
