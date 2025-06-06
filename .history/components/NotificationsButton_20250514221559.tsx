import { useNotifications } from '@/src/context/NotificationContext';
import { useTheme } from '@/src/context/ThemeContext';
import { useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { useRef, useState } from 'react';
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
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Colors based on theme
  const buttonBg = isDarkMode ? '#00E6C3' : '#00A090';
  const shadowColor = isDarkMode ? '#00E6C3' : '#00A090';
  const badgeBg = '#FF4444';
  const textColor = '#fff';

  const toggleExpand = () => {
    if (expanded) {
      // If already expanded, navigate to notifications
      router.push('/notifications');

      // Then collapse after a delay
      setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setExpanded(false));
      }, 300);
    } else {
      // If collapsed, expand
      setExpanded(true);
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  // Calculate right position based on animation
  const rightPosition = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-28, 20], // From -28 (half hidden) to 20 (fully visible)
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX: rightPosition }],
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.button, { backgroundColor: buttonBg }]}
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
    right: 0, // Position reference for animation
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
    right: -4,
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
