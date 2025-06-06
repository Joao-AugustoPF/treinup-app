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
  const positionAnim = useRef(new Animated.Value(-28)).current; // Start with half of button hidden

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

  return (
    <Animated.View
      style={[
        styles.container,
        {
          right: positionAnim, // Directly animate the right position
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
