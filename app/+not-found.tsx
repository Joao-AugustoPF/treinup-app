import { useLocalization } from '@/src/context/LocalizationContext';
import { useTheme } from '@/src/context/ThemeContext';
import { Link, Stack, useRouter } from 'expo-router';
import { AlertTriangle, ArrowLeft, Home } from 'lucide-react-native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function NotFoundScreen() {
  const { paperTheme } = useTheme();
  const { t } = useLocalization();
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ 
        title: '404',
        headerShown: false 
      }} />
      <View style={[styles.container, { backgroundColor: paperTheme.colors.background }]}>
        <View style={styles.content}>
          {/* 404 Icon */}
          <View style={[styles.iconContainer, { backgroundColor: paperTheme.colors.errorContainer }]}>
            <AlertTriangle size={80} color={paperTheme.colors.error} />
          </View>

          {/* Main Text */}
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: paperTheme.colors.onSurface }]}>
              404
            </Text>
            <Text style={[styles.subtitle, { color: paperTheme.colors.onSurface }]}>
              {t('pageNotFound') || 'Página não encontrada'}
            </Text>
            <Text style={[styles.description, { color: paperTheme.colors.onSurfaceVariant }]}>
              {t('pageNotFoundDescription') || 'A página que você está procurando não existe ou foi movida.'}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: paperTheme.colors.primary }]}
              onPress={() => router.back()}
            >
              <ArrowLeft size={20} color={paperTheme.colors.onPrimary} />
              <Text style={[styles.primaryButtonText, { color: paperTheme.colors.onPrimary }]}>
                {t('goBack') || 'Voltar'}
              </Text>
            </TouchableOpacity>

            <Link href="/" asChild>
              <TouchableOpacity style={[styles.secondaryButton, { borderColor: paperTheme.colors.outline }]}>
                <Home size={20} color={paperTheme.colors.primary} />
                <Text style={[styles.secondaryButtonText, { color: paperTheme.colors.primary }]}>
                  {t('goHome') || 'Ir para o início'}
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  title: {
    fontSize: 72,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
