import { useAuth } from '@/src/context/AuthContext';
import { useNotifications } from '@/src/context/NotificationContext';
import { useTheme } from '@/src/context/ThemeContext';
import { ProfileService } from '@/src/services/profile';
import { Player } from 'expo-audio';
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
  const { unreadCount } = useNotifications();
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [showIcon, setShowIcon] = useState(true);
  const positionAnim = useRef(new Animated.Value(-28)).current; // Start with half of button hidden
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const [audioPlayer, setAudioPlayer] = useState<Player | null>(null);

  // Colors based on theme
  const buttonBg = isDarkMode ? 'rgba(255,20,147,0.7)' : '#00A090';
  const shadowColor = isDarkMode ? 'rgba(255,20,147,0.7)' : '#00A090';
  const badgeBg = '#FF4444';
  const textColor = '#fff';

  useEffect(() => {
    // Initialize audio player
    const initAudio = async () => {
      try {
        const player = new Player();
        await player.loadAsync(require('@/assets/sounds/notification.mp3'));
        setAudioPlayer(player);
      } catch (error) {
        console.error('Failed to initialize audio player:', error);
      }
    };

    initAudio();

    return () => {
      if (audioPlayer) {
        audioPlayer.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    // Play animation and sound when unreadCount changes
    if (unreadCount > 0) {
      playNotificationEffect();
    }
  }, [unreadCount]);

  const playNotificationEffect = async () => {
    // Shake animation
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
    try {
      if (audioPlayer) {
        await audioPlayer.seekToAsync(0);
        await audioPlayer.playAsync();
      }
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
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
      // If already expanded, navigate to notifications
      router.push('/notifications');

      // Then collapse after a delay
      setTimeout(() => {
        Animated.timing(positionAnim, {
          toValue: -28, // Half hidden
          duration: 300,
          useNativeDriver: false, // Must be false to animate position
        }).start(() => setExpanded(false));
      }, 300);
    } else {
      // If collapsed, expand
      setExpanded(true);
      Animated.timing(positionAnim, {
        toValue: 20, // Fully visible
        duration: 300,
        useNativeDriver: false, // Must be false to animate position
      }).start();
    }
  };

  // Don't render anything if user has chosen to hide the icon
  if (!showIcon) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          right: positionAnim, // Directly animate the right position
          transform: [{ translateX: shakeAnim }],
        },
      ]}
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
});
