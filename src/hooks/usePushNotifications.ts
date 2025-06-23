import { useNotifications } from '@/src/context/NotificationContext';
import { useCallback } from 'react';

export const usePushNotifications = () => {
  const {
    pushToken,
    isPushRegistered,
    registerForPushNotifications,
    scheduleLocalNotification,
    scheduleWorkoutReminder,
    scheduleDailyReminder,
    scheduleWeeklyReminder,
    cancelNotification,
    cancelAllNotifications,
    getBadgeCount,
    setBadgeCount,
    clearBadge,
  } = useNotifications();

  const sendTestNotification = useCallback(async () => {
    try {
      const notificationId = await scheduleLocalNotification(
        'Teste de Notificação',
        'Esta é uma notificação de teste do TreinUp!',
        { screen: '/workouts' }
      );
      console.log('Test notification scheduled:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error sending test notification:', error);
      throw error;
    }
  }, [scheduleLocalNotification]);

  const scheduleWorkoutReminderForTomorrow = useCallback(async (
    workoutName: string,
    time: string
  ) => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0); // 8:00 AM

      const notificationId = await scheduleWorkoutReminder(
        'Lembrete de Treino',
        `Seu treino "${workoutName}" está agendado para ${time}`,
        tomorrow,
        { 
          screen: '/workouts',
          workoutName,
          scheduledTime: time
        }
      );
      console.log('Workout reminder scheduled:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling workout reminder:', error);
      throw error;
    }
  }, [scheduleWorkoutReminder]);

  const scheduleDailyWorkoutReminder = useCallback(async (
    hour: number = 7,
    minute: number = 0
  ) => {
    try {
      const notificationId = await scheduleDailyReminder(
        'Hora do Treino! 💪',
        'Não esqueça do seu treino diário. Mantenha a consistência!',
        hour,
        minute,
        { screen: '/workouts' }
      );
      console.log('Daily workout reminder scheduled:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling daily workout reminder:', error);
      throw error;
    }
  }, [scheduleDailyReminder]);

  const scheduleProgressReminder = useCallback(async (
    hour: number = 20,
    minute: number = 0
  ) => {
    try {
      const notificationId = await scheduleDailyReminder(
        'Atualize seu Progresso 📊',
        'Registre seus resultados de hoje para acompanhar sua evolução!',
        hour,
        minute,
        { screen: '/progress' }
      );
      console.log('Progress reminder scheduled:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling progress reminder:', error);
      throw error;
    }
  }, [scheduleDailyReminder]);

  const scheduleWeeklyMotivation = useCallback(async (
    weekday: number = 1, // Sunday
    hour: number = 9,
    minute: number = 0
  ) => {
    try {
      const notificationId = await scheduleWeeklyReminder(
        'Motivação Semanal 🌟',
        'Nova semana, novos objetivos! Você está mais forte a cada dia!',
        weekday,
        hour,
        minute,
        { screen: '/workouts' }
      );
      console.log('Weekly motivation scheduled:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling weekly motivation:', error);
      throw error;
    }
  }, [scheduleWeeklyReminder]);

  return {
    pushToken,
    isPushRegistered,
    registerForPushNotifications,
    sendTestNotification,
    scheduleWorkoutReminderForTomorrow,
    scheduleDailyWorkoutReminder,
    scheduleProgressReminder,
    scheduleWeeklyMotivation,
    cancelNotification,
    cancelAllNotifications,
    getBadgeCount,
    setBadgeCount,
    clearBadge,
  };
}; 