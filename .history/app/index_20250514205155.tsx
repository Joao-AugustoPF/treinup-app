import { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Redirect } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  Easing,
  interpolate,
  Extrapolate,
  interpolateColor,
} from 'react-native-reanimated';
import { useAuth } from '@/src/context/AuthContext';
import { useTenant } from '@/src/context/TenantContext';

export default function Index() {
  const { user, isLoading: isLoadingAuth } = useAuth();
  const { activeTenantId, isLoading: isLoadingTenant } = useTenant();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);

  useEffect(() => {
    // Start animation sequence
    const timeout = setTimeout(() => {
      scale.value = withSpring(1.2, { damping: 15 });
      opacity.value = withTiming(0, {
        duration: 800,
        easing: Easing.out(Easing.ease),
      });
      translateY.value = withTiming(-50, {
        duration: 800,
        easing: Easing.out(Easing.ease),
      });
    }, 1500);

    return () => clearTimeout(timeout);
  }, []);

  const logoStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }, { translateY: translateY.value }],
      opacity: opacity.value,
    };
  });

  const backgroundStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        opacity.value,
        [0, 1],
        ['#121212', '#1a1a1a']
      ),
      opacity: interpolate(opacity.value, [0, 1], [0, 1], Extrapolate.CLAMP),
    };
  });

  console.log('isLoadingAuth', isLoadingAuth);
  console.log('isLoadingTenant', isLoadingTenant);

  if (isLoadingAuth || isLoadingTenant) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00E6C3" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!activeTenantId) {
    return <Redirect href="/plans" />;
  }

  if()

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.background, backgroundStyle]} />
      <Animated.View style={[styles.logoContainer, logoStyle]}>
        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=1000&auto=format&fit=crop',
          }}
          style={styles.logo}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 32px rgba(0, 230, 195, 0.2)',
      },
      default: {
        elevation: 8,
        shadowColor: '#00E6C3',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 32,
      },
    }),
  },
  logo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});
