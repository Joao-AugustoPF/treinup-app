import { useAuth } from '@/src/context/AuthContext';
import { usePlan } from '@/src/context/PlanContext';
import { useRouter } from 'expo-router';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Crown,
  Send,
  X,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ManagePlanScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { userPlan, transferPlan, upgradePlan, cancelPlan } = usePlan();
  const [loading, setLoading] = useState(false);

  const handleTransfer = () => {
    router.push('/trna');
  };

  const handleUpgrade = () => {
    router.push('/plans');
  };

  const handleDowngrade = () => {
    Alert.alert(
      'Downgrade Plan',
      'Are you sure you want to downgrade your plan? You will lose access to premium features.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Downgrade',
          style: 'destructive',
          onPress: () => router.push('/plans'),
        },
      ]
    );
  };

  const handleCancel = async () => {
    Alert.alert(
      'Cancel Plan',
      'Are you sure you want to cancel your plan? You will lose access to all premium features.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await cancelPlan();
              Alert.alert('Success', 'Your plan has been cancelled.');
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel plan. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (!userPlan) {
    router.replace('/plans');
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Manage Plan</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.planCard, { borderColor: userPlan.color }]}>
          <View style={styles.planHeader}>
            <Crown size={24} color={userPlan.color} />
            <Text style={[styles.planName, { color: userPlan.color }]}>
              {userPlan.name}
            </Text>
          </View>
          <Text style={styles.planPrice}>${userPlan.price}/month</Text>
          <Text style={styles.planExpiry}>
            Expires on {userPlan.expiresAt.toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#00E6C3' }]}
            onPress={handleTransfer}
          >
            <Send size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Transfer Plan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#6C5CE7' }]}
            onPress={handleUpgrade}
          >
            <ArrowUp size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Upgrade Plan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#FFD93D' }]}
            onPress={handleDowngrade}
          >
            <ArrowDown size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Downgrade Plan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#FF4444' }]}
            onPress={handleCancel}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <X size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Cancel Plan</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>Your Plan Features</Text>
          {userPlan.features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Crown size={16} color={userPlan.color} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
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
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  planCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 12,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  planPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  planExpiry: {
    fontSize: 14,
    color: '#666',
  },
  actionsContainer: {
    gap: 10,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  featuresCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 20,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  featureText: {
    fontSize: 16,
    color: '#fff',
  },
});
