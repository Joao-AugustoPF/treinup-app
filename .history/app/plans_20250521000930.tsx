import { useAuth } from '@/src/context/AuthContext';
import { PLANS, PlanTier, usePlan } from '@/src/context/PlanContext';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check } from 'lucide-react-native';
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function PlansScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { userPlan, upgradePlan } = usePlan();
  const [processing, setProcessing] = useState(false);

  const handleSelectPlan = async (planId: PlanTier) => {
    if (!user) {
      Alert.alert('Error', 'Please login to select a plan');
      return;
    }

    const selectedPlan = PLANS[planId];
    const currentPlan = userPlan;

    // If downgrading or same plan, no payment needed
    if (
      currentPlan &&
      Number(selectedPlan.price) <= Number(currentPlan.price)
    ) {
      try {
        setProcessing(true);
        await upgradePlan(planId);
        Alert.alert('Success', 'Your plan has been updated!');
        router.back();
      } catch (error) {
        Alert.alert('Error', 'Failed to update plan. Please try again.');
      } finally {
        setProcessing(false);
      }
      return;
    }

    // For new plans or upgrades
    try {
      setProcessing(true);
      await upgradePlan(planId);
      Alert.alert('Success', 'Your plan has been updated!');
      router.bac;
    } catch (error) {
      Alert.alert('Error', 'Failed to update plan. Please try again.');
    } finally {
      setProcessing(false);
    }
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
        <Text style={styles.title}>Choose Your Plan</Text>
      </View>

      <ScrollView style={styles.content}>
        {(Object.keys(PLANS) as PlanTier[]).map((planId) => {
          const plan = PLANS[planId];
          const isCurrentPlan = userPlan?.id === planId;

          return (
            <View
              key={planId}
              style={[styles.planCard, { borderColor: plan.color }]}
            >
              <View style={styles.planHeader}>
                <View>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planPrice}>${plan.price}/month</Text>
                </View>
                {isCurrentPlan && (
                  <View
                    style={[
                      styles.currentPlanBadge,
                      { backgroundColor: plan.color },
                    ]}
                  >
                    <Text style={styles.currentPlanText}>Current Plan</Text>
                  </View>
                )}
              </View>

              <View style={styles.featuresContainer}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Check size={20} color={plan.color} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.selectButton,
                  { backgroundColor: isCurrentPlan ? '#333' : plan.color },
                ]}
                onPress={() => handleSelectPlan(planId)}
                disabled={isCurrentPlan || processing}
              >
                <Text style={styles.selectButtonText}>
                  {isCurrentPlan
                    ? 'Current Plan'
                    : processing
                    ? 'Processing...'
                    : 'Select Plan'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
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
    paddingTop: 60,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  planPrice: {
    fontSize: 18,
    color: '#666',
  },
  currentPlanBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  currentPlanText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 12,
  },
  selectButton: {
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
