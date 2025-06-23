import { DATABASE_ID, PROFILES_COLLECTION_ID, db } from '@/src/api/appwrite-client';
import { useAuth } from '@/src/context/AuthContext';
import { useGym } from '@/src/context/GymContext';
import { useProfile } from '@/src/context/ProfileContext';
import { useTheme } from '@/src/context/ThemeContext';
import {
  ScheduleService,
  type Schedule,
  type Trainer,
} from '@/src/services/schedule';
import { Query } from 'appwrite';
import {
  Calendar,
  CalendarCheck,
  CalendarX,
  ChevronLeft,
  Clock,
  CreditCard as Edit2,
  MapPin,
  User,
  X,
} from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export default function ScheduleScreen() {
  const { user } = useAuth();
  const { currentGym } = useGym();
  const { paperTheme } = useTheme();
  const { profile, loading: profileLoading, refreshProfile } = useProfile();
  const [showNewSchedule, setShowNewSchedule] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedTrainer, setSelectedTrainer] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [availableTrainers, setAvailableTrainers] = useState<Trainer[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateLoading, setDateLoading] = useState(false);
  const [slotLoading, setSlotLoading] = useState(false);
  const [scheduleToReschedule, setScheduleToReschedule] =
    useState<Schedule | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    upcoming: true,
    completed: false,
    cancelled: false,
  });
  const [localMaxBookings, setLocalMaxBookings] = useState<number | undefined>(undefined);

  // Animation values
  const upcomingAnimation = useRef(new Animated.Value(1)).current;
  const completedAnimation = useRef(new Animated.Value(0)).current;
  const cancelledAnimation = useRef(new Animated.Value(0)).current;
  const upcomingIconRotation = useRef(new Animated.Value(1)).current;
  const completedIconRotation = useRef(new Animated.Value(0)).current;
  const cancelledIconRotation = useRef(new Animated.Value(0)).current;

  // Animation effect
  useEffect(() => {
    Animated.timing(upcomingAnimation, {
      toValue: expandedSections.upcoming ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();

    Animated.timing(completedAnimation, {
      toValue: expandedSections.completed ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();

    Animated.timing(cancelledAnimation, {
      toValue: expandedSections.cancelled ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();

    Animated.timing(upcomingIconRotation, {
      toValue: expandedSections.upcoming ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    Animated.timing(completedIconRotation, {
      toValue: expandedSections.completed ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    Animated.timing(cancelledIconRotation, {
      toValue: expandedSections.cancelled ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [expandedSections]);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!currentGym) {
          setError('Selecione uma academia nas configurações do perfil');
          setLoading(false);
          return;
        }

        const [dates, trainers, userSchedules] = await Promise.all([
          ScheduleService.getAvailableDates(),
          ScheduleService.getAvailableTrainers(),
          ScheduleService.getUserSchedules(user),
        ]);

        // Separate upcoming and past/cancelled schedules for debugging
        const upcoming = userSchedules.filter(
          (s) => s.status === 'booked' && new Date(s.date) >= new Date()
        );
        const history = userSchedules.filter(
          (s) => s.status === 'cancelled' || new Date(s.date) < new Date()
        );
        
        if (mounted) {
          setAvailableDates(dates);
          setAvailableTrainers(trainers);
          setSchedules(userSchedules);
        }
      } catch (err) {
        if (mounted) {
          setError('Falha ao carregar dados. Tente novamente.');
          console.error('Error loading schedule data:', err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [user, currentGym]);

  // Função para buscar apenas o maxBookings do perfil
  const fetchMaxBookings = async () => {
    try {
      if (!user) return;
      
      const profilesResponse = await db.listDocuments(
        DATABASE_ID,
        PROFILES_COLLECTION_ID,
        [Query.equal('userId', user.$id)]
      );

      if (profilesResponse.documents.length > 0) {
        const profileDoc = profilesResponse.documents[0];
        setLocalMaxBookings(profileDoc.maxBookings ?? 0);
      }
    } catch (error) {
      console.error('Error fetching maxBookings:', error);
    }
  };

  // Atualizar localMaxBookings quando o profile carregar
  useEffect(() => {
    if (profile?.maxBookings !== undefined) {
      setLocalMaxBookings(profile.maxBookings);
    }
  }, [profile?.maxBookings]);

  // Buscar maxBookings na primeira carga
  useEffect(() => {
    if (user && !localMaxBookings) {
      fetchMaxBookings();
    }
  }, [user, localMaxBookings]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (!currentGym) {
        setError('Selecione uma academia nas configurações do perfil');
        return;
      }

      // Buscar maxBookings atualizado
      await fetchMaxBookings();

      const [dates, trainers, userSchedules] = await Promise.all([
        ScheduleService.getAvailableDates(),
        ScheduleService.getAvailableTrainers(),
        ScheduleService.getUserSchedules(user),
      ]);

      setAvailableDates(dates);
      setAvailableTrainers(trainers);
      setSchedules(userSchedules);
      setError(null);
    } catch (err) {
      setError('Falha ao atualizar dados. Tente novamente.');
      console.error('Error refreshing schedule data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Load available time slots when a date is selected
  useEffect(() => {
    const loadTimeSlots = async () => {
      if (selectedDate) {
        try {
          setSlotLoading(true);
          const slots = await ScheduleService.getAvailableSlots(
            selectedDate,
            selectedTrainer || undefined
          );
          setAvailableSlots(slots);
        } catch (error) {
          console.error('Error loading time slots:', error);
          Alert.alert(
            'Erro',
            'Não foi possível carregar os horários disponíveis'
          );
        } finally {
          setSlotLoading(false);
        }
      } else {
        setAvailableSlots([]);
      }
    };

    loadTimeSlots();
  }, [selectedDate, selectedTrainer]);

  const handleSchedule = async () => {
    if (!selectedDate || !selectedTime || !selectedTrainer) {
      Alert.alert(
        'Erro',
        'Por favor, selecione uma data, horário e treinador.'
      );
      return;
    }

    try {
      setLoading(true);
      await ScheduleService.createSchedule(
        user,
        selectedDate,
        selectedTime,
        selectedTrainer
      );
      Alert.alert('Sucesso', 'Avaliação agendada com sucesso!');
      setShowNewSchedule(false);

      // Refresh schedules
      const updatedSchedules = await ScheduleService.getUserSchedules(user);
      setSchedules(updatedSchedules);
    } catch (err: any) {
      console.error('Error scheduling:', err);
      Alert.alert(
        'Erro',
        err.message ||
          'Falha ao agendar avaliação. Verifique se o horário ainda está disponível.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (scheduleId: string) => {
    Alert.alert(
      'Cancelar Avaliação',
      'Tem certeza que deseja cancelar esta avaliação?',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, Cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await ScheduleService.cancelSchedule(user, scheduleId);

              // Refresh schedules
              const updatedSchedules = await ScheduleService.getUserSchedules(
                user
              );
              setSchedules(updatedSchedules);

              Alert.alert('Sucesso', 'Avaliação cancelada com sucesso');
            } catch (err: any) {
              console.error('Error cancelling:', err);
              Alert.alert('Erro', err.message || 'Falha ao cancelar avaliação');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime || !scheduleToReschedule) {
      Alert.alert('Erro', 'Por favor, selecione uma nova data e horário');
      return;
    }

    try {
      setLoading(true);
      await ScheduleService.rescheduleAppointment(
        user,
        scheduleToReschedule.id,
        selectedDate,
        selectedTime
      );

      // Refresh schedules
      const updatedSchedules = await ScheduleService.getUserSchedules(user);
      setSchedules(updatedSchedules);

      Alert.alert('Sucesso', 'Avaliação reagendada com sucesso!');
      setShowNewSchedule(false);
      setScheduleToReschedule(null);
    } catch (err: any) {
      console.error('Error rescheduling:', err);
      Alert.alert('Erro', err.message || 'Falha ao reagendar avaliação');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    });
  };

  // Cálculo de agendamentos ativos
  const activeSchedulesCount = schedules.filter(
    (s) => s.status === 'booked' && new Date(s.date) >= new Date()
  ).length;
  // Pega o máximo permitido do profile (default 0 se não vier)
  const maxBookings = localMaxBookings ?? profile?.maxBookings ?? 0;
  const canBook = activeSchedulesCount < maxBookings;

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          { backgroundColor: paperTheme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={paperTheme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          { backgroundColor: paperTheme.colors.background },
        ]}
      >
        <Text style={[styles.errorText, { color: paperTheme.colors.error }]}>
          {error}
        </Text>
        <TouchableOpacity
          style={[
            styles.retryButton,
            { backgroundColor: paperTheme.colors.primary },
          ]}
          onPress={() => setError(null)}
        >
          <Text
            style={[
              styles.retryButtonText,
              { color: paperTheme.colors.onPrimary },
            ]}
          >
            Tentar Novamente
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!showNewSchedule) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: paperTheme.colors.background },
        ]}
      >
        <View
          style={[
            styles.header,
            { backgroundColor: paperTheme.colors.surface },
          ]}
        >
          <Text style={[styles.title, { color: paperTheme.colors.onSurface }]}>
            Avaliações Físicas
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: paperTheme.colors.onSurfaceVariant },
            ]}
          >
            Agende e gerencie suas avaliações físicas
          </Text>
          <TouchableOpacity
            style={[
              styles.newButton,
              { backgroundColor: paperTheme.colors.primary },
              !canBook && { opacity: 0.5 },
            ]}
            onPress={() => canBook && setShowNewSchedule(true)}
            disabled={!canBook}
          >
            <Calendar size={16} color={paperTheme.colors.onPrimary} />
            <Text
              style={[
                styles.newButtonText,
                { color: paperTheme.colors.onPrimary },
              ]}
            >
              Nova Avaliação
            </Text>
          </TouchableOpacity>
          {canBook && (
            <Text style={{ color: paperTheme.colors.primary, marginTop: 8 }}>
              Você ainda pode agendar {maxBookings - activeSchedulesCount} avaliação(ões).
            </Text>
          )}
          {!canBook && (
            <Text style={{ color: paperTheme.colors.error, marginTop: 8 }}>
              Você atingiu o limite de avaliações agendadas ({maxBookings}). Cancele uma para agendar outra.
            </Text>
          )}
        </View>

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
          {schedules.length === 0 ? (
            <View
              style={[
                styles.emptyState,
                { backgroundColor: paperTheme.colors.surface },
              ]}
            >
              <Image
                source={require('@/assets/images/empty-calendar.png')}
                style={styles.emptyImage}
                defaultSource={require('@/assets/images/empty-calendar.png')}
              />
              <Text
                style={[
                  styles.emptyTitle,
                  { color: paperTheme.colors.onSurface },
                ]}
              >
                Sem Avaliações
              </Text>
              <Text
                style={[
                  styles.emptyText,
                  { color: paperTheme.colors.onSurfaceVariant },
                ]}
              >
                Agende sua primeira avaliação física para acompanhar seu
                progresso
              </Text>
            </View>
          ) : (
            <View>
              <TouchableOpacity
                onPress={() =>
                  setExpandedSections((prev) => ({
                    ...prev,
                    upcoming: !prev.upcoming,
                  }))
                }
                style={[
                  styles.sectionHeader,
                  { backgroundColor: paperTheme.colors.surface },
                ]}
              >
                <Calendar size={20} color={paperTheme.colors.primary} />
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: paperTheme.colors.onSurface },
                  ]}
                >
                  Próximas Avaliações
                </Text>
                <View
                  style={[
                    styles.countBadge,
                    { backgroundColor: paperTheme.colors.primary },
                  ]}
                >
                  <Text
                    style={[
                      styles.countText,
                      { color: paperTheme.colors.onPrimary },
                    ]}
                  >
                    {
                      schedules.filter(
                        (s) =>
                          s.status === 'booked' &&
                          new Date(s.date) >= new Date()
                      ).length
                    }
                  </Text>
                </View>
                <View style={{ flex: 1 }} />
                <Animated.Text
                  style={[
                    styles.accordionIcon,
                    { color: paperTheme.colors.onSurface },
                    {
                      transform: [
                        {
                          rotate: upcomingIconRotation.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '90deg'],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  ▶
                </Animated.Text>
              </TouchableOpacity>

              <Animated.View
                style={{
                  maxHeight: upcomingAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1000],
                  }),
                  opacity: upcomingAnimation,
                  overflow: 'hidden',
                }}
              >
                {schedules.filter(
                  (s) => s.status === 'booked' && new Date(s.date) >= new Date()
                ).length > 0 ? (
                  schedules
                    .filter(
                      (s) =>
                        s.status === 'booked' && new Date(s.date) >= new Date()
                    )
                    .map((schedule) => (
                      <ScheduleCard
                        key={schedule.id}
                        schedule={schedule}
                        trainers={availableTrainers}
                        onCancel={handleCancel}
                        onReschedule={() => {
                          setSelectedDate(null);
                          setSelectedTime(null);
                          setShowNewSchedule(true);
                          setScheduleToReschedule(schedule);
                        }}
                      />
                    ))
                ) : (
                  <View style={styles.emptySection}>
                    <Text style={styles.emptySectionText}>
                      Você não tem avaliações agendadas.
                    </Text>

                    {canBook && (
                    <TouchableOpacity
                      style={styles.emptyActionButton}
                      onPress={() => setShowNewSchedule(true)}
                    >
                      <Text style={styles.emptyActionButtonText}>
                        Agendar Avaliação
                      </Text>
                    </TouchableOpacity>
                    )}
                  </View>
                )}
              </Animated.View>

              {/* Avaliações completadas (data passada e status booked ou completed) */}
              {schedules.filter(
                (s) =>
                  (s.status === 'booked' || s.status === 'completed') &&
                  new Date(s.date) < new Date()
              ).length > 0 && (
                <>
                  <TouchableOpacity
                    onPress={() =>
                      setExpandedSections((prev) => ({
                        ...prev,
                        completed: !prev.completed,
                      }))
                    }
                    style={styles.sectionHeader}
                  >
                    <CalendarCheck size={20} color="#8A2BE2" />
                    <Text style={[styles.sectionTitle, { color: '#8A2BE2' }]}>
                      Avaliações Realizadas
                    </Text>
                    <View
                      style={[
                        styles.countBadge,
                        { backgroundColor: '#8A2BE2' },
                      ]}
                    >
                      <Text style={styles.countText}>
                        {
                          schedules.filter(
                            (s) =>
                              (s.status === 'booked' ||
                                s.status === 'completed') &&
                              new Date(s.date) < new Date()
                          ).length
                        }
                      </Text>
                    </View>
                    <View style={{ flex: 1 }} />
                    <Animated.Text
                      style={[
                        styles.accordionIcon,
                        { color: '#8A2BE2' },
                        {
                          transform: [
                            {
                              rotate: completedIconRotation.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0deg', '90deg'],
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      ▶
                    </Animated.Text>
                  </TouchableOpacity>

                  <Animated.View
                    style={{
                      maxHeight: completedAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 1000],
                      }),
                      opacity: completedAnimation,
                      overflow: 'hidden',
                    }}
                  >
                    {schedules.filter(
                      (s) =>
                        (s.status === 'booked' || s.status === 'completed') &&
                        new Date(s.date) < new Date()
                    ).length > 0 ? (
                      schedules
                        .filter(
                          (s) =>
                            (s.status === 'booked' ||
                              s.status === 'completed') &&
                            new Date(s.date) < new Date()
                        )
                        .map((schedule) => (
                          <ScheduleCard
                            key={schedule.id}
                            schedule={schedule}
                            trainers={availableTrainers}
                            onCancel={handleCancel}
                            onReschedule={() => {}}
                            isHistory
                            historyType="completed"
                          />
                        ))
                    ) : (
                      <View style={styles.emptySection}>
                        <Text style={styles.emptySectionText}>
                          Você ainda não tem avaliações realizadas.
                        </Text>
                      </View>
                    )}
                  </Animated.View>
                </>
              )}

              {/* Avaliações canceladas */}
              {schedules.filter((s) => s.status === 'cancelled').length > 0 && (
                <>
                  <TouchableOpacity
                    onPress={() =>
                      setExpandedSections((prev) => ({
                        ...prev,
                        cancelled: !prev.cancelled,
                      }))
                    }
                    style={styles.sectionHeader}
                  >
                    <CalendarX size={20} color="#FF4444" />
                    <Text style={[styles.sectionTitle, { color: '#FF4444' }]}>
                      Avaliações Canceladas
                    </Text>
                    <View
                      style={[
                        styles.countBadge,
                        { backgroundColor: '#FF4444' },
                      ]}
                    >
                      <Text style={styles.countText}>
                        {
                          schedules.filter((s) => s.status === 'cancelled')
                            .length
                        }
                      </Text>
                    </View>
                    <View style={{ flex: 1 }} />
                    <Animated.Text
                      style={[
                        styles.accordionIcon,
                        { color: '#FF4444' },
                        {
                          transform: [
                            {
                              rotate: cancelledIconRotation.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0deg', '90deg'],
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      ▶
                    </Animated.Text>
                  </TouchableOpacity>

                  <Animated.View
                    style={{
                      maxHeight: cancelledAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 1000],
                      }),
                      opacity: cancelledAnimation,
                      overflow: 'hidden',
                    }}
                  >
                    {schedules.filter((s) => s.status === 'cancelled').length >
                    0 ? (
                      schedules
                        .filter((s) => s.status === 'cancelled')
                        .map((schedule) => (
                          <ScheduleCard
                            key={schedule.id}
                            schedule={schedule}
                            trainers={availableTrainers}
                            onCancel={handleCancel}
                            onReschedule={() => {}}
                            isHistory
                            historyType="cancelled"
                          />
                        ))
                    ) : (
                      <View style={styles.emptySection}>
                        <Text style={styles.emptySectionText}>
                          Você não tem avaliações canceladas.
                        </Text>
                      </View>
                    )}
                  </Animated.View>
                </>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: paperTheme.colors.background },
      ]}
    >
      <View
        style={[
          styles.bookingHeader,
          { backgroundColor: paperTheme.colors.surface },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            setShowNewSchedule(false);
            setScheduleToReschedule(null);
          }}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color={paperTheme.colors.onSurface} />
        </TouchableOpacity>
        <Text
          style={[styles.bookingTitle, { color: paperTheme.colors.onSurface }]}
        >

          {scheduleToReschedule ?  'Reagendar Avaliação' : 'Agendar Avaliação'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[paperTheme.colors.primary]}
            tintColor={paperTheme.colors.primary}
          />
        }
      >
        <View style={styles.stepContainer}>
          <View style={styles.stepIndicator}>
            <View
              style={[
                styles.stepNumber,
                selectedDate ? styles.stepCompleted : {},
              ]}
            >
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepLabel}>Data</Text>
          </View>

          <View style={styles.stepIndicator}>
            <View
              style={[
                styles.stepNumber,
                selectedTrainer ? styles.stepCompleted : {},
              ]}
            >
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepLabel}>Treinador</Text>
          </View>

          <View style={styles.stepIndicator}>
            <View
              style={[
                styles.stepNumber,
                selectedTime ? styles.stepCompleted : {},
              ]}
            >
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepLabel}>Horário</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={20} color={paperTheme.colors.primary} />
            <Text
              style={[
                styles.sectionTitle,
                { color: paperTheme.colors.onSurface },
              ]}
            >
              Selecionar Data
            </Text>
          </View>
          {dateLoading ? (
            <ActivityIndicator
              size="small"
              color={paperTheme.colors.primary}
              style={styles.sectionLoader}
            />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.datesContainer}
            >
              {availableDates.length === 0 ? (
                <View style={styles.noDataContainer}>
                  <Text
                    style={[
                      styles.noDataText,
                      { color: paperTheme.colors.onSurfaceVariant },
                    ]}
                  >
                    Nenhuma data disponível
                  </Text>
                </View>
              ) : (
                availableDates.map((date, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dateCard,
                      {
                        backgroundColor: paperTheme.colors.surface,
                        borderColor: paperTheme.colors.outline,
                      },
                      selectedDate?.toDateString() === date.toDateString() && {
                        backgroundColor: paperTheme.colors.primary,
                        borderColor: paperTheme.colors.primary,
                      },
                    ]}
                    onPress={() => setSelectedDate(date)}
                  >
                    <Text
                      style={[
                        styles.dateDay,
                        { color: paperTheme.colors.onSurface },
                        selectedDate?.toDateString() ===
                          date.toDateString() && {
                          color: paperTheme.colors.onPrimary,
                        },
                      ]}
                    >
                      {date
                        .toLocaleDateString('pt-BR', { weekday: 'short' })
                        .toUpperCase()}
                    </Text>
                    <Text
                      style={[
                        styles.dateNumber,
                        { color: paperTheme.colors.onSurface },
                        selectedDate?.toDateString() ===
                          date.toDateString() && {
                          color: paperTheme.colors.onPrimary,
                        },
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                    <Text
                      style={[
                        styles.dateMonth,
                        { color: paperTheme.colors.onSurface },
                        selectedDate?.toDateString() ===
                          date.toDateString() && {
                          color: paperTheme.colors.onPrimary,
                        },
                      ]}
                    >
                      {date
                        .toLocaleDateString('pt-BR', { month: 'short' })
                        .toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={20} color="rgba(255,20,147,0.7)" />
            <Text style={styles.sectionTitle}>Selecionar Treinador</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.trainersContainer}
          >
            {availableTrainers.length === 0 ? (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>
                  Nenhum treinador disponível
                </Text>
              </View>
            ) : (
              availableTrainers.map((trainer) => (
                <TouchableOpacity
                  key={trainer.id}
                  style={[
                    styles.trainerCard,
                    selectedTrainer === trainer.id &&
                      styles.selectedTrainerCard,
                  ]}
                  onPress={() => setSelectedTrainer(trainer.id)}
                >
                  <View style={styles.trainerImageContainer}>
                    {trainer.image ? (
                      <Image
                        source={{ uri: trainer.image }}
                        style={styles.trainerImage}
                      />
                    ) : (
                      <View style={styles.trainerPlaceholder}>
                        <User size={24} color="#444" />
                      </View>
                    )}
                  </View>
                  <View style={styles.trainerInfo}>
                    <Text style={styles.trainerName}>{trainer.name}</Text>
                    <Text style={styles.trainerSpecialty}>
                      {trainer.specialty}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={20} color={paperTheme.colors.primary} />
            <Text
              style={[
                styles.sectionTitle,
                { color: paperTheme.colors.onSurface },
              ]}
            >
              Selecionar Horário
            </Text>
          </View>

          {!selectedDate || !selectedTrainer ? (
            <View style={styles.noDataContainer}>
              <Text
                style={[
                  styles.noDataText,
                  { color: paperTheme.colors.onSurfaceVariant },
                ]}
              >
                Selecione uma data e um treinador primeiro
              </Text>
            </View>
          ) : slotLoading ? (
            <ActivityIndicator
              size="small"
              color={paperTheme.colors.primary}
              style={styles.sectionLoader}
            />
          ) : availableSlots.length === 0 ? (
            <View style={styles.noDataContainer}>
              <Text
                style={[
                  styles.noDataText,
                  { color: paperTheme.colors.onSurfaceVariant },
                ]}
              >
                Nenhum horário disponível para esta data e treinador
              </Text>
            </View>
          ) : (
            <View style={styles.timeGrid}>
              {availableSlots.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeCard,
                    {
                      backgroundColor: paperTheme.colors.surface,
                      borderColor: paperTheme.colors.outline,
                    },
                    selectedTime === time && {
                      backgroundColor: paperTheme.colors.primary,
                      borderColor: paperTheme.colors.primary,
                    },
                  ]}
                  onPress={() => setSelectedTime(time)}
                >
                  <Text
                    style={[
                      styles.timeText,
                      { color: paperTheme.colors.onSurface },
                      selectedTime === time && {
                        color: paperTheme.colors.onPrimary,
                      },
                    ]}
                  >
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.summarySection}>
          {selectedDate && selectedTrainer && selectedTime && (
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>Resumo da Avaliação</Text>

              <View style={styles.summaryRow}>
                <Calendar size={16} color="rgba(255,20,147,0.7)" />
                <Text style={styles.summaryText}>
                  {selectedDate.toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Clock size={16} color="rgba(255,20,147,0.7)" />
                <Text style={styles.summaryText}>{selectedTime}</Text>
              </View>

              <View style={styles.summaryRow}>
                <User size={16} color="rgba(255,20,147,0.7)" />
                <Text style={styles.summaryText}>
                  {availableTrainers.find((t) => t.id === selectedTrainer)
                    ?.name || 'Treinador selecionado'}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <MapPin size={16} color="rgba(255,20,147,0.7)" />
                <Text style={styles.summaryText}>
                  {currentGym?.name || 'Local da avaliação'}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setShowNewSchedule(false);
              setScheduleToReschedule(null);
            }}
          >
            <X size={20} color="#fff" />
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.scheduleButton,
              (!selectedDate || !selectedTime || !selectedTrainer || !canBook) &&
                styles.disabledButton,
            ]}
            onPress={scheduleToReschedule ? handleReschedule : handleSchedule}
            disabled={!selectedDate || !selectedTime || !selectedTrainer || !canBook}
          >
            <CalendarCheck size={20} color="#fff" />
            <Text style={styles.scheduleButtonText}>Confirmar</Text>
          </TouchableOpacity>
        </View>
        {!canBook && (
          <Text style={{ color: paperTheme.colors.error, margin: 16, textAlign: 'center' }}>
            Você atingiu o limite de avaliações agendadas ({maxBookings}). Cancele uma para agendar outra.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

// ScheduleCard Component for better organization
function ScheduleCard({
  schedule,
  trainers,
  onCancel,
  onReschedule,
  isHistory = false,
  historyType = 'booked',
}: {
  schedule: Schedule;
  trainers: Trainer[];
  onCancel: (id: string) => void;
  onReschedule: (schedule: Schedule) => void;
  isHistory?: boolean;
  historyType?: string;
}) {
  const { paperTheme } = useTheme();
  const trainerName =
    trainers.find((t) => t.id === schedule.trainerId)?.name || 'Treinador';
  const isCancelled = schedule.status === 'cancelled';
  const isActive = schedule.status === 'booked';

  return (
    <View
      style={[
        styles.scheduleCard,
        { backgroundColor: paperTheme.colors.surface },
        isCancelled && { borderLeftColor: paperTheme.colors.error },
        isHistory &&
          historyType === 'completed' && {
            borderLeftColor: paperTheme.colors.secondary,
          },
        isHistory &&
          historyType === 'cancelled' && {
            borderLeftColor: paperTheme.colors.error,
          },
      ]}
    >
      <View style={styles.scheduleCardHeader}>
        <View style={styles.dateTimeContainer}>
          <Text
            style={[
              styles.scheduleDate,
              { color: paperTheme.colors.onSurface },
            ]}
          >
            {new Date(schedule.date).toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: '2-digit',
              month: 'long',
            })}
          </Text>
          <Text
            style={[styles.scheduleTime, { color: paperTheme.colors.primary }]}
          >
            {schedule.time}
          </Text>
        </View>

        {!isHistory && isActive && (
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: paperTheme.colors.primaryContainer },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: paperTheme.colors.onPrimaryContainer },
              ]}
            >
              Agendado
            </Text>
          </View>
        )}

        {isHistory && historyType === 'completed' && (
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: paperTheme.colors.secondaryContainer },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: paperTheme.colors.onSecondaryContainer },
              ]}
            >
              Realizada
            </Text>
          </View>
        )}

        {isHistory && historyType === 'cancelled' && (
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: paperTheme.colors.errorContainer },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: paperTheme.colors.onErrorContainer },
              ]}
            >
              Cancelada
            </Text>
          </View>
        )}
      </View>

      <View style={styles.scheduleTrainer}>
        <User size={16} color={paperTheme.colors.onSurfaceVariant} />
        <Text
          style={[
            styles.trainerInfoText,
            { color: paperTheme.colors.onSurface },
          ]}
        >
          {trainerName}
        </Text>
      </View>

      {!isHistory && isActive && (
        <View style={styles.scheduleActions}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: paperTheme.colors.error },
            ]}
            onPress={() => onCancel(schedule.id)}
          >
            <CalendarX size={16} color={paperTheme.colors.onError} />
            <Text
              style={[
                styles.actionButtonText,
                { color: paperTheme.colors.onError },
              ]}
            >
              Cancelar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: paperTheme.colors.primary },
            ]}
            onPress={() => onReschedule(schedule)}
          >
            <Edit2 size={16} color={paperTheme.colors.onPrimary} />
            <Text
              style={[
                styles.actionButtonText,
                { color: paperTheme.colors.onPrimary },
              ]}
            >
              Reagendar
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  newButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  newButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    borderRadius: 16,
    marginVertical: 20,
  },
  emptyImage: {
    width: 120,
    height: 120,
    marginBottom: 20,
    opacity: 0.7,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scheduleCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    borderLeftWidth: 4,
  },
  scheduleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateTimeContainer: {
    flex: 1,
  },
  scheduleDate: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  scheduleTime: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  scheduleTrainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  trainerInfoText: {
    fontSize: 14,
  },
  scheduleActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  bookingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  bookingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  stepContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    marginBottom: 20,
  },
  stepIndicator: {
    alignItems: 'center',
    gap: 8,
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCompleted: {
    backgroundColor: 'rgba(255,20,147,0.7)',
  },
  stepNumberText: {
    fontWeight: 'bold',
  },
  stepLabel: {
    fontSize: 12,
  },
  section: {
    padding: 20,
    marginBottom: 16,
  },
  sectionLoader: {
    marginVertical: 20,
  },
  datesContainer: {
    marginBottom: 8,
  },
  dateCard: {
    width: 90,
    height: 100,
    borderRadius: 12,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    padding: 8,
  },
  selectedCard: {
    borderColor: 'rgba(255,20,147,0.7)',
  },
  dateDay: {
    fontSize: 12,
    marginBottom: 6,
  },
  dateNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  dateMonth: {
    fontSize: 12,
  },
  selectedText: {
    color: '#fff',
  },
  noDataContainer: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    fontSize: 14,
    textAlign: 'center',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  timeCard: {
    width: '31%',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: 10,
  },
  timeText: {
    fontSize: 16,
  },
  trainersContainer: {
    marginBottom: 8,
  },
  trainerCard: {
    width: 150,
    borderRadius: 12,
    marginRight: 12,
    padding: 12,
    borderWidth: 2,
  },
  selectedTrainerCard: {
    borderColor: 'rgba(255,20,147,0.7)',
  },
  trainerImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 10,
    overflow: 'hidden',
  },
  trainerImage: {
    width: '100%',
    height: '100%',
  },
  trainerPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trainerInfo: {
    gap: 4,
  },
  trainerName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  trainerSpecialty: {
    fontSize: 12,
  },
  summarySection: {
    padding: 20,
  },
  summaryContainer: {
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  summaryText: {
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    padding: 20,
    paddingBottom: 40,
  },
  scheduleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  scheduleButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
    padding: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  accordionIcon: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  countBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  countText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptySection: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySectionText: {
    fontSize: 16,
    marginBottom: 20,
  },
  emptyActionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyActionButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
