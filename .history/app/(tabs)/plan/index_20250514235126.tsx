import { useAuth } from '@/src/context/AuthContext';
import { useLocalization } from '@/src/context/LocalizationContext';
import { PLANS, PlanTier, usePlan } from '@/src/context/PlanContext';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check, CreditCard, Gift, X } from 'lucide-react-native';
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function PlanScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { userPlan, upgradePlan, cancelPlan, transferPlan } = usePlan();
  const { t } = useLocalization();
  const [processing, setProcessing] = useState(false);
  const [transferEmail, setTransferEmail] = useState('');

  const handleSelectPlan = async (planId: PlanTier) => {
    if (!user) {
      Alert.alert(t('error'), t('loginRequired'));
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
        Alert.alert(t('success'), t('planUpdated'));
        router.replace('/(tabs)/classes');
      } catch (error) {
        Alert.alert(t('error'), t('planUpdateFailed'));
      } finally {
        setProcessing(false);
      }
      return;
    }

    // For new plans or upgrades
    try {
      setProcessing(true);
      await upgradePlan(planId);
      Alert.alert(t('success'), t('planUpdated'));
      router.replace('/(tabs)/classes');
    } catch (error) {
      Alert.alert(t('error'), t('planUpdateFailed'));
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelPlan = () => {
    Alert.alert(t('cancelPlan'), t('cancelPlanConfirmation'), [
      { text: t('no'), style: 'cancel' },
      {
        text: t('yes'),
        style: 'destructive',
        onPress: async () => {
          try {
            setProcessing(true);
            await cancelPlan();
            Alert.alert(t('success'), t('planCancelled'));
            router.replace('/(tabs)/classes');
          } catch (error) {
            Alert.alert(t('error'), t('planCancelFailed'));
          } finally {
            setProcessing(false);
          }
        },
      },
    ]);
  };

  const handleTransferPlan = () => {
    if (!transferEmail) {
      Alert.alert(t('error'), t('enterEmail'));
      return;
    }

    Alert.alert(
      t('transferPlan'),
      t('transferPlanConfirmation').replace('{email}', transferEmail),
      [
        { text: t('no'), style: 'cancel' },
        {
          text: t('yes'),
          onPress: async () => {
            try {
              setProcessing(true);
              await transferPlan(transferEmail);
              Alert.alert(t('success'), t('planTransferred'));
              setTransferEmail('');
              router.replace('/(tabs)/classes');
            } catch (error) {
              Alert.alert(t('error'), t('planTransferFailed'));
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
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
        <Text style={styles.title}>{t('subscriptionPlan')}</Text>
      </View>

      <ScrollView style={styles.content}>
        {userPlan && (
          <View style={styles.currentPlanSection}>
            <View
              style={[styles.currentPlanCard, { borderColor: userPlan.color }]}
            >
              <View style={styles.currentPlanHeader}>
                <View>
                  <Text style={styles.currentPlanName}>{userPlan.name}</Text>
                  <Text style={styles.currentPlanPrice}>
                    ${PLANS[userPlan.id].price}/month
                  </Text>
                </View>
                <View
                  style={[
                    styles.currentPlanBadge,
                    { backgroundColor: userPlan.color },
                  ]}
                >
                  <Text style={styles.currentPlanText}>{t('currentPlan')}</Text>
                </View>
              </View>

              <View style={styles.featuresContainer}>
                {PLANS[userPlan.id].features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Check size={20} color={userPlan.color} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.planActions}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#333' }]}
                  onPress={() => router.push('/(tabs)/payment')}
                >
                  <CreditCard size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>
                    {t('managePayment')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#333' }]}
                  onPress={handleCancelPlan}
                  disabled={processing}
                >
                  <X size={20} color="#FF4444" />
                  <Text style={[styles.actionButtonText, { color: '#FF4444' }]}>
                    {t('cancelPlan')}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.transferSection}>
                <Text style={styles.transferTitle}>{t('transferPlan')}</Text>
                <TextInput
                  style={styles.transferInput}
                  placeholder={t('enterEmail')}
                  placeholderTextColor="#666"
                  value={transferEmail}
                  onChangeText={setTransferEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={[styles.transferButton, { backgroundColor: '#333' }]}
                  onPress={handleTransferPlan}
                  disabled={processing || !transferEmail}
                >
                  <Gift size={20} color="#00E6C3" />
                  <Text
                    style={[styles.transferButtonText, { color: '#00E6C3' }]}
                  >
                    {t('transfer')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <Text style={styles.availablePlansTitle}>{t('availablePlans')}</Text>
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
                    <Text style={styles.currentPlanText}>
                      {t('currentPlan')}
                    </Text>
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
                    ? t('currentPlan')
                    : processing
                    ? t('processing')
                    : t('selectPlan')}
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
  },
  backButton: {
    marginRight: 20,
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
  currentPlanSection: {
    marginBottom: 30,
  },
  currentPlanCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 20,
    borderWidth: 2,
  },
  currentPlanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  currentPlanName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  currentPlanPrice: {
    fontSize: 18,
    color: '#666',
  },
  currentPlanBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  currentPlanText: {
    color: '#121212',
    fontWeight: 'bold',
    fontSize: 12,
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
    color: '#fff',
    marginLeft: 10,
    fontSize: 16,
  },
  planActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  transferSection: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 20,
  },
  transferTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  transferInput: {
    backgroundColor: '#333',
    borderRadius: 10,
    padding: 12,
    color: '#fff',
    marginBottom: 10,
  },
  transferButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  transferButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  availablePlansTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
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
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  planPrice: {
    fontSize: 16,
    color: '#666',
  },
  selectButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
