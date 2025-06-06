import { useAuth } from '@/src/context/AuthContext';
import { useGym } from '@/src/context/GymContext';
import {
  ScheduleService,
  type Schedule,
  type Trainer,
} from '@/src/services/schedule';
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
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ScheduleScreen() {
  const { user } = useAuth();
  const { currentGym } = useGym();
  const [showNewSchedule, setShowNewSchedule] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedTrainer, setSelectedTrainer] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [availableTrainers, setAvailableTrainers] = useState<Trainer[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateLoading, setDateLoading] = useState(false);
  const [slotLoading, setSlotLoading] = useState(false);
  const [scheduleToReschedule, setScheduleToReschedule] =
    useState<Schedule | null>(null);

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

        console.log('Dates loaded:', dates.length);
        console.log('Trainers loaded:', trainers.length);
        console.log('User schedules loaded:', userSchedules);

        // Separate upcoming and past/cancelled schedules for debugging
        const upcoming = userSchedules.filter(
          (s) => s.status === 'booked' && new Date(s.date) >= new Date()
        );
        const history = userSchedules.filter(
          (s) => s.status === 'cancelled' || new Date(s.date) < new Date()
        );

        console.log('Upcoming schedules:', upcoming.length);
        console.log('History schedules:', history.length);

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

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#00E6C3" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => setError(null)}
        >
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!showNewSchedule) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Avaliações Físicas</Text>
          <Text style={styles.subtitle}>
            Agende e gerencie suas avaliações físicas
          </Text>
          <TouchableOpacity
            style={styles.newButton}
            onPress={() => setShowNewSchedule(true)}
          >
            <Calendar size={16} color="#fff" />
            <Text style={styles.newButtonText}>Nova Avaliação</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {schedules.length === 0 ? (
            <View style={styles.emptyState}>
              <Image
                source={require('@/assets/images/empty-calendar.png')}
                style={styles.emptyImage}
                defaultSource={require('@/assets/images/empty-calendar.png')}
              />
              <Text style={styles.emptyTitle}>Sem Avaliações</Text>
              <Text style={styles.emptyText}>
                Agende sua primeira avaliação física para acompanhar seu
                progresso
              </Text>
            </View>
          ) : (
            <View>
              <View style={styles.sectionHeader}>
                <Calendar size={20} color="#00E6C3" />
                <Text style={styles.sectionTitle}>Próximas Avaliações</Text>
              </View>
              {schedules
                .filter(
                  (s) => s.status === 'booked' && new Date(s.date) >= new Date()
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
                ))}

              {/* Avaliações completadas (data passada e status booked ou completed) */}
              {schedules.filter(
                (s) =>
                  (s.status === 'booked' || s.status === 'completed') &&
                  new Date(s.date) < new Date()
              ).length > 0 && (
                <>
                  <View style={styles.sectionHeader}>
                    <CalendarCheck size={20} color="#8A2BE2" />
                    <Text style={[styles.sectionTitle, { color: '#8A2BE2' }]}>
                      Avaliações Realizadas
                    </Text>
                  </View>
                  {schedules
                    .filter(
                      (s) =>
                        (s.status === 'booked' || s.status === 'completed') &&
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
                    ))}
                </>
              )}

              {/* Avaliações canceladas */}
              {schedules.filter((s) => s.status === 'cancelled').length > 0 && (
                <>
                  <View style={styles.sectionHeader}>
                    <CalendarX size={20} color="#FF4444" />
                    <Text style={[styles.sectionTitle, { color: '#FF4444' }]}>
                      Avaliações Canceladas
                    </Text>
                  </View>
                  {schedules
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
                    ))}
                </>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.bookingHeader}>
        <TouchableOpacity
          onPress={() => {
            setShowNewSchedule(false);
            setScheduleToReschedule(null);
          }}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.bookingTitle}>
          {scheduleToReschedule ? 'Reagendar Avaliação' : 'Agendar Avaliação'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
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
            <Calendar size={20} color="#00E6C3" />
            <Text style={styles.sectionTitle}>Selecionar Data</Text>
          </View>
          {dateLoading ? (
            <ActivityIndicator
              size="small"
              color="#00E6C3"
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
                  <Text style={styles.noDataText}>Nenhuma data disponível</Text>
                </View>
              ) : (
                availableDates.map((date, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dateCard,
                      selectedDate?.toDateString() === date.toDateString() &&
                        styles.selectedCard,
                    ]}
                    onPress={() => setSelectedDate(date)}
                  >
                    <Text
                      style={[
                        styles.dateDay,
                        selectedDate?.toDateString() === date.toDateString() &&
                          styles.selectedText,
                      ]}
                    >
                      {date
                        .toLocaleDateString('pt-BR', { weekday: 'short' })
                        .toUpperCase()}
                    </Text>
                    <Text
                      style={[
                        styles.dateNumber,
                        selectedDate?.toDateString() === date.toDateString() &&
                          styles.selectedText,
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                    <Text
                      style={[
                        styles.dateMonth,
                        selectedDate?.toDateString() === date.toDateString() &&
                          styles.selectedText,
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
            <User size={20} color="#00E6C3" />
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
            <Clock size={20} color="#00E6C3" />
            <Text style={styles.sectionTitle}>Selecionar Horário</Text>
          </View>

          {!selectedDate || !selectedTrainer ? (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>
                Selecione uma data e um treinador primeiro
              </Text>
            </View>
          ) : slotLoading ? (
            <ActivityIndicator
              size="small"
              color="#00E6C3"
              style={styles.sectionLoader}
            />
          ) : availableSlots.length === 0 ? (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>
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
                    selectedTime === time && styles.selectedCard,
                  ]}
                  onPress={() => setSelectedTime(time)}
                >
                  <Text
                    style={[
                      styles.timeText,
                      selectedTime === time && styles.selectedText,
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
                <Calendar size={16} color="#00E6C3" />
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
                <Clock size={16} color="#00E6C3" />
                <Text style={styles.summaryText}>{selectedTime}</Text>
              </View>

              <View style={styles.summaryRow}>
                <User size={16} color="#00E6C3" />
                <Text style={styles.summaryText}>
                  {availableTrainers.find((t) => t.id === selectedTrainer)
                    ?.name || 'Treinador selecionado'}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <MapPin size={16} color="#00E6C3" />
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
              (!selectedDate || !selectedTime || !selectedTrainer) &&
                styles.disabledButton,
            ]}
            onPress={scheduleToReschedule ? handleReschedule : handleSchedule}
            disabled={!selectedDate || !selectedTime || !selectedTrainer}
          >
            <CalendarCheck size={20} color="#fff" />
            <Text style={styles.scheduleButtonText}>Confirmar</Text>
          </TouchableOpacity>
        </View>
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
  const trainerName =
    trainers.find((t) => t.id === schedule.trainerId)?.name || 'Treinador';
  const isCancelled = schedule.status === 'cancelled';
  const isActive = schedule.status === 'booked';

  return (
    <View
      style={[
        styles.scheduleCard,
        isCancelled && styles.cancelledCard,
        isHistory && historyType === 'completed' && styles.completedCard,
        isHistory && historyType === 'cancelled' && styles.cancelledCard,
      ]}
    >
      <View style={styles.scheduleCardHeader}>
        <View style={styles.dateTimeContainer}>
          <Text style={styles.scheduleDate}>
            {new Date(schedule.date).toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: '2-digit',
              month: 'long',
            })}
          </Text>
          <Text style={styles.scheduleTime}>{schedule.time}</Text>
        </View>

        {/* Status badge for upcoming appointments */}
        {!isHistory && isActive && (
          <View style={[styles.statusBadge, styles.scheduledBadge]}>
            <Text style={styles.statusText}>Agendado</Text>
          </View>
        {!isHistory && (
          <View
            style={[
              styles.statusBadge,
              isCancelled ? styles.cancelledBadge : styles.scheduledBadge,
            ]}
          >
            <Text style={styles.statusText}>
              {isCancelled ? 'Cancelado' : 'Agendado'}
            </Text>
          </View>
        )}

        {isHistory && historyType === 'completed' && (
          <View style={[styles.statusBadge, styles.completedBadge]}>
            <Text style={styles.statusText}>Realizada</Text>
          </View>
        )}

        {isHistory && historyType === 'cancelled' && (
          <View style={[styles.statusBadge, styles.cancelledBadge]}>
            <Text style={styles.statusText}>Cancelada</Text>
          </View>
        )}
      </View>

      <View style={styles.scheduleTrainer}>
        <User size={16} color="#666" />
        <Text style={styles.trainerInfoText}>{trainerName}</Text>
      </View>

      {!isHistory && isActive && (
        <View style={styles.scheduleActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelActionButton]}
            onPress={() => onCancel(schedule.id)}
          >
            <CalendarX size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.rescheduleActionButton]}
            onPress={() => onReschedule(schedule)}
          >
            <Edit2 size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Reagendar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    backgroundColor: '#1a1a1a',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  newButton: {
    backgroundColor: '#00E6C3',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  newButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#1a1a1a',
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
    color: '#fff',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 16,
  },
  scheduleCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#00E6C3',
  },
  cancelledCard: {
    opacity: 0.7,
    borderLeftColor: '#FF4444',
  },
  completedCard: {
    opacity: 0.5,
    borderLeftColor: '#8A2BE2',
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
    color: '#fff',
    marginBottom: 4,
  },
  scheduleTime: {
    fontSize: 14,
    color: '#00E6C3',
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  scheduledBadge: {
    backgroundColor: 'rgba(0, 230, 195, 0.2)',
  },
  cancelledBadge: {
    backgroundColor: 'rgba(255, 68, 68, 0.2)',
  },
  completedBadge: {
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#fff',
  },
  scheduleTrainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  trainerInfoText: {
    fontSize: 14,
    color: '#fff',
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
  cancelActionButton: {
    backgroundColor: '#FF4444',
  },
  rescheduleActionButton: {
    backgroundColor: '#00E6C3',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bookingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingBottom: 20,
    backgroundColor: '#1a1a1a',
  },
  backButton: {
    padding: 4,
  },
  bookingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  stepContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#1a1a1a',
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
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCompleted: {
    backgroundColor: '#00E6C3',
  },
  stepNumberText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  stepLabel: {
    color: '#999',
    fontSize: 12,
  },
  section: {
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
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
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#333',
    padding: 8,
  },
  selectedCard: {
    backgroundColor: '#00E6C3',
    borderColor: '#00E6C3',
  },
  dateDay: {
    fontSize: 12,
    color: '#999',
    marginBottom: 6,
  },
  dateNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  dateMonth: {
    fontSize: 12,
    color: '#999',
  },
  selectedText: {
    color: '#fff',
  },
  noDataContainer: {
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    color: '#666',
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
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
    marginBottom: 10,
  },
  timeText: {
    fontSize: 16,
    color: '#fff',
  },
  trainersContainer: {
    marginBottom: 8,
  },
  trainerCard: {
    width: 150,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginRight: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: '#333',
  },
  selectedTrainerCard: {
    borderColor: '#00E6C3',
  },
  trainerImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#333',
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
    backgroundColor: '#333',
  },
  trainerInfo: {
    gap: 4,
  },
  trainerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  trainerSpecialty: {
    fontSize: 12,
    color: '#666',
  },
  summarySection: {
    padding: 20,
  },
  summaryContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#00E6C3',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
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
    color: '#fff',
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
    backgroundColor: '#00E6C3',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#333',
    opacity: 0.5,
  },
  scheduleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#333',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#FF4444',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
    padding: 20,
  },
  retryButton: {
    backgroundColor: '#00E6C3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
