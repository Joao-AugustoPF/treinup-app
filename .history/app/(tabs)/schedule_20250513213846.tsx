import { useAuth } from '@/src/context/AuthContext';
import {
  ScheduleService,
  type Schedule,
  type Trainer,
} from '@/src/services/schedule';
import {
  Calendar,
  CalendarCheck,
  CalendarX,
  Clock,
  CreditCard as Edit2,
  User,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
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

export default function ScheduleScreen() {
  const { user } = useAuth();
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

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [dates, trainers, slots, userSchedules] = await Promise.all([
          ScheduleService.getAvailableDates(),
          ScheduleService.getAvailableTrainers(),
          ScheduleService.getAvailableSlots(),
          ScheduleService.getUserSchedules(user),
        ]);

        if (mounted) {
          setAvailableDates(dates);
          setAvailableTrainers(trainers);
          setAvailableSlots(slots);
          setSchedules(userSchedules);
        }
      } catch (err) {
        if (mounted) {
          setError('Failed to load schedule data');
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
  }, [user]);

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
    } catch (err) {
      Alert.alert('Erro', 'Falha ao agendar avaliação');
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
            } catch (err) {
              Alert.alert('Erro', 'Falha ao cancelar avaliação');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleReschedule = async (schedule: Schedule) => {
    if (!selectedDate || !selectedTime) {
      Alert.alert('Erro', 'Por favor, selecione uma nova data e horário');
      return;
    }

    try {
      setLoading(true);
      await ScheduleService.rescheduleAppointment(
        user,
        schedule.id,
        selectedDate,
        selectedTime
      );

      // Refresh schedules
      const updatedSchedules = await ScheduleService.getUserSchedules(user);
      setSchedules(updatedSchedules);

      Alert.alert('Sucesso', 'Avaliação reagendada com sucesso!');
      setShowNewSchedule(false);
    } catch (err) {
      Alert.alert('Erro', 'Falha ao reagendar avaliação');
    } finally {
      setLoading(false);
    }
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
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!showNewSchedule) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Minhas Avaliações</Text>
          <TouchableOpacity
            style={styles.newButton}
            onPress={() => setShowNewSchedule(true)}
          >
            <Text style={styles.newButtonText}>Nova Avaliação</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {schedules.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Sem Avaliações</Text>
              <Text style={styles.emptyText}>
                Agende sua primeira avaliação agora!
              </Text>
            </View>
          ) : (
            schedules.map((schedule) => (
              <View
                key={schedule.id}
                style={[
                  styles.scheduleCard,
                  schedule.status === 'cancelled' && styles.cancelledCard,
                ]}
              >
                <View style={styles.scheduleHeader}>
                  <View>
                    <Text style={styles.scheduleDate}>
                      {schedule.date.toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Text>
                    <Text style={styles.scheduleTime}>{schedule.time}</Text>
                  </View>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>
                      {schedule.status === 'scheduled'
                        ? 'Agendado'
                        : 'Cancelado'}
                    </Text>
                  </View>
                </View>

                <View style={styles.scheduleTrainer}>
                  <Text style={styles.trainerLabel}>Treinador:</Text>
                  <Text style={styles.trainerName}>
                    {
                      availableTrainers.find((t) => t.id === schedule.trainerId)
                        ?.name
                    }
                  </Text>
                </View>

                {schedule.status === 'scheduled' && (
                  <View style={styles.scheduleActions}>
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        { backgroundColor: '#FF4444' },
                      ]}
                      onPress={() => handleCancel(schedule.id)}
                    >
                      <CalendarX size={20} color="#fff" />
                      <Text style={styles.actionButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        { backgroundColor: '#00E6C3' },
                      ]}
                      onPress={() => handleReschedule(schedule)}
                    >
                      <Edit2 size={20} color="#fff" />
                      <Text style={styles.actionButtonText}>Reagendar</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Agendar Avaliação</Text>
          <Text style={styles.subtitle}>
            Agende sua avaliação física com nossos treinadores especializados
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={24} color="#00E6C3" />
            <Text style={styles.sectionTitle}>Selecionar Data</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.datesContainer}
          >
            {availableDates.map((date) => (
              <TouchableOpacity
                key={date.toISOString()}
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
                  {date.toLocaleDateString('pt-BR', { weekday: 'short' })}
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
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={24} color="#00E6C3" />
            <Text style={styles.sectionTitle}>Selecionar Horário</Text>
          </View>
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
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={24} color="#00E6C3" />
            <Text style={styles.sectionTitle}>Selecionar Treinador</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.trainersContainer}
          >
            {availableTrainers.map((trainer) => (
              <TouchableOpacity
                key={trainer.id}
                style={[
                  styles.trainerCard,
                  selectedTrainer === trainer.id && styles.selectedTrainerCard,
                ]}
                onPress={() => setSelectedTrainer(trainer.id)}
              >
                <View style={styles.trainerImageContainer}>
                  <View style={styles.trainerImage} />
                </View>
                <View style={styles.trainerInfo}>
                  <Text style={styles.trainerName}>{trainer.name}</Text>
                  <Text style={styles.trainerSpecialty}>
                    {trainer.specialty}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowNewSchedule(false)}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.scheduleButton,
              (!selectedDate || !selectedTime || !selectedTrainer) &&
                styles.disabledButton,
            ]}
            onPress={handleSchedule}
            disabled={!selectedDate || !selectedTime || !selectedTrainer}
          >
            <CalendarCheck size={20} color="#fff" />
            <Text style={styles.scheduleButtonText}>Agendar Avaliação</Text>
          </TouchableOpacity>
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
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
  },
  content: {
    flex: 1,
    padding: 20,
  },
  newButton: {
    backgroundColor: '#00E6C3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 10,
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
  scheduleCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
  },
  cancelledCard: {
    opacity: 0.6,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  scheduleDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  scheduleTime: {
    fontSize: 16,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#333',
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  scheduleTrainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  trainerLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  trainerName: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
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
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
  },
  datesContainer: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  dateCard: {
    width: 80,
    height: 80,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#333',
  },
  selectedCard: {
    backgroundColor: '#00E6C3',
    borderColor: '#00E6C3',
  },
  dateDay: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  dateNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  selectedText: {
    color: '#fff',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeCard: {
    width: '31%',
    paddingVertical: 15,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
  },
  timeText: {
    fontSize: 16,
    color: '#fff',
  },
  trainersContainer: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  trainerCard: {
    width: 200,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginRight: 15,
    padding: 15,
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
  },
  trainerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  trainerInfo: {
    gap: 4,
  },
  trainerSpecialty: {
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    padding: 20,
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
