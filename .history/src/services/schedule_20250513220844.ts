import { Query } from 'appwrite';
import {
  DATABASE_ID,
  db,
  EVALUATION_BOOKINGS_COLLECTION_ID,
  EVALUATION_SLOTS_COLLECTION_ID,
  PROFILES_COLLECTION_ID,
} from '../api/appwrite-client';

export type Schedule = {
  id: string;
  date: Date;
  time: string;
  trainerId: string;
  status: 'booked' | 'scheduled' | 'completed' | 'cancelled';
  slotId: string;
};

export type Trainer = {
  id: string;
  name: string;
  specialty: string;
  image?: string;
  available: boolean;
};

export class ScheduleService {
  static async getAvailableDates(): Promise<Date[]> {
    try {
      // Get all future slots that haven't been booked
      const now = new Date();
      const slotsResponse = await db.listDocuments(
        DATABASE_ID,
        EVALUATION_SLOTS_COLLECTION_ID,
        [Query.greaterThan('start', now.toISOString())]
      );

      // Extract unique dates from slots
      const dates = slotsResponse.documents.map((slot) => new Date(slot.start));

      // Get unique dates by converting to date string and back
      const uniqueDates = [
        ...new Set(dates.map((date) => date.toDateString())),
      ].map((dateString) => new Date(dateString));

      // Sort dates
      return uniqueDates.sort((a, b) => a.getTime() - b.getTime());
    } catch (error) {
      console.error('Error fetching available dates:', error);
      throw new Error('Failed to fetch available dates');
    }
  }

  static async getAvailableTrainers(): Promise<Trainer[]> {
    try {
      // Query for profiles with role=TRAINER
      const trainersResponse = await db.listDocuments(
        DATABASE_ID,
        PROFILES_COLLECTION_ID,
        [Query.equal('role', 'TRAINER')]
      );

      return trainersResponse.documents.map((trainer) => ({
        id: trainer.$id,
        name: trainer.name,
        specialty: 'Personal Trainer', // Default specialty
        image: trainer.avatarUrl,
        available: true,
      }));
    } catch (error) {
      console.error('Error fetching available trainers:', error);
      throw new Error('Failed to fetch available trainers');
    }
  }

  static async getAvailableSlots(
    selectedDate?: Date,
    selectedTrainerId?: string
  ): Promise<string[]> {
    try {
      if (!selectedDate) {
        return [];
      }

      // Create date range for the selected date (start of day to end of day)
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Base queries for filtering slots
      const queries = [
        Query.greaterThanEqual('start', startOfDay.toISOString()),
        Query.lessThanEqual('start', endOfDay.toISOString()),
      ];

      // Add trainer filter if provided
      if (selectedTrainerId) {
        queries.push(Query.equal('trainerProfileId', selectedTrainerId));
      }

      // Get available slots for the selected date and trainer
      const slotsResponse = await db.listDocuments(
        DATABASE_ID,
        EVALUATION_SLOTS_COLLECTION_ID,
        queries
      );

      console.log('slotsResponse', slotsResponse);

      // Get all booked slots
      const bookingsResponse = await db.listDocuments(
        DATABASE_ID,
        EVALUATION_BOOKINGS_COLLECTION_ID,
        [Query.equal('status', 'booked')]
      );

      // Filter out slots that are already booked
      const bookedSlotIds = bookingsResponse.documents.map(
        (booking) => booking.evaluationSlots
      );

      const availableSlots = slotsResponse.documents.filter(
        (slot) => !bookedSlotIds.includes(slot.$id)
      );

      // Extract time strings
      return availableSlots.map((slot) => {
        const date = new Date(slot.start);
        return date.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
      });
    } catch (error) {
      console.error('Error fetching available slots:', error);
      throw new Error('Failed to fetch available slots');
    }
  }

  static async getUserSchedules(user: any | null): Promise<Schedule[]> {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('user', user);

      // First, get the user's profile
      const profilesResponse = await db.listDocuments(
        DATABASE_ID,
        PROFILES_COLLECTION_ID,
        [Query.equal('userId', user.$id)]
      );

      if (profilesResponse.documents.length === 0) {
        throw new Error('User profile not found');
      }

      const userProfileId = profilesResponse.documents[0].$id;

      // Get bookings for this user
      const bookingsResponse = await db.listDocuments(
        DATABASE_ID,
        EVALUATION_BOOKINGS_COLLECTION_ID,
        [Query.equal('memberProfileId', userProfileId)]
      );

      console.log('bookings found:', bookingsResponse.documents);

      // Map to the return type expected by the UI
      const schedules = bookingsResponse.documents.map((booking) => {
        // The slot can either be a string ID or the full embedded object
        const slotData = booking.evaluationSlots;

        // Check if slotData is an object with the slot information or just an ID
        if (slotData && typeof slotData === 'object') {
          const slotDate = new Date(slotData.start);
          const time = slotDate.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          });

          // Get the trainerId from the embedded slot data
          let trainerId = 'Unknown';
          if (slotData.trainerProfileId) {
            trainerId =
              typeof slotData.trainerProfileId === 'object'
                ? slotData.trainerProfileId.$id || 'Unknown'
                : slotData.trainerProfileId;
          }

          return {
            id: booking.$id,
            date: slotDate,
            time: time,
            trainerId: trainerId,
            status: booking.status,
            slotId: slotData.$id || '',
          };
        } else {
          // Handle the case where we only have an ID and need to fetch the slot
          // This is more of a fallback and might not be needed
          console.log('Slot is not embedded, only ID is present:', slotData);
          return {
            id: booking.$id,
            date: new Date(),
            time: 'Unknown',
            trainerId: 'Unknown',
            status: booking.status,
            slotId: typeof slotData === 'string' ? slotData : '',
          };
        }
      });

      console.log('processed schedules:', schedules);
      return schedules;
    } catch (error: any) {
      console.error('Error fetching user schedules:', error);
      throw new Error(`Failed to fetch user schedules: ${error.message}`);
    }
  }

  static async createSchedule(
    user: any | null,
    date: Date,
    time: string,
    trainerId: string
  ): Promise<void> {
    try {
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      console.log('Creating schedule:', { date, time, trainerId });

      // Find the user's profile ID
      const profilesResponse = await db.listDocuments(
        DATABASE_ID,
        PROFILES_COLLECTION_ID,
        [Query.equal('userId', user.$id)]
      );

      if (profilesResponse.documents.length === 0) {
        throw new Error('Perfil de usuário não encontrado');
      }

      const userProfileId = profilesResponse.documents[0].$id;

      // Convert date and time to find the matching slot
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Parse the time string to get hours and minutes
      const [hours, minutes] = time.split(':').map(Number);

      // Find the slot that matches our criteria
      const slotsResponse = await db.listDocuments(
        DATABASE_ID,
        EVALUATION_SLOTS_COLLECTION_ID,
        [
          Query.greaterThanEqual('start', startOfDay.toISOString()),
          Query.lessThanEqual('start', endOfDay.toISOString()),
          Query.equal('trainerProfileId', trainerId),
        ]
      );

      // Find the slot with the matching time
      const matchingSlot = slotsResponse.documents.find((slot) => {
        const slotTime = new Date(slot.start);
        return (
          slotTime.getHours() === hours && slotTime.getMinutes() === minutes
        );
      });

      if (!matchingSlot) {
        throw new Error('Horário não disponível para o treinador selecionado');
      }

      // Check if this slot is already booked
      const bookingsResponse = await db.listDocuments(
        DATABASE_ID,
        EVALUATION_BOOKINGS_COLLECTION_ID,
        [
          Query.equal('evaluationSlots', matchingSlot.$id),
          Query.equal('status', 'booked'),
        ]
      );

      if (bookingsResponse.documents.length > 0) {
        throw new Error('Este horário já está reservado');
      }

      // Create a booking
      const result = await db.createDocument(
        DATABASE_ID,
        EVALUATION_BOOKINGS_COLLECTION_ID,
        'unique()',
        {
          status: 'booked',
          tenantId: matchingSlot.tenantId,
          evaluationSlots: matchingSlot.$id, // Store just the ID, not the full object
          memberProfileId: userProfileId,
        }
      );

      console.log('Booking created successfully:', result);
    } catch (error: any) {
      console.error('Error creating schedule:', error);
      throw new Error(`Falha ao agendar: ${error.message}`);
    }
  }

  static async cancelSchedule(
    user: any | null,
    scheduleId: string
  ): Promise<void> {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('Cancelling booking:', scheduleId);

      // Get the booking document to check if it exists and its current status
      const booking = await db.getDocument(
        DATABASE_ID,
        EVALUATION_BOOKINGS_COLLECTION_ID,
        scheduleId
      );

      // Only booked appointments can be cancelled
      if (booking.status !== 'booked') {
        throw new Error('Apenas avaliações agendadas podem ser canceladas');
      }

      // Make sure the booking belongs to the current user
      const profilesResponse = await db.listDocuments(
        DATABASE_ID,
        PROFILES_COLLECTION_ID,
        [Query.equal('userId', user.$id)]
      );

      if (profilesResponse.documents.length === 0) {
        throw new Error('Perfil de usuário não encontrado');
      }

      const userProfileId = profilesResponse.documents[0].$id;

      console.log('userProfileId', userProfileId);
      console.log('booking', booking.memberProfileId);

      // Optional: check if the booking belongs to the current user
      if (booking.memberProfileId !== userProfileId) {
        throw new Error(
          'Você não tem permissão para cancelar este agendamento'
        );
      }

      // Update the status to cancelled
      const result = await db.updateDocument(
        DATABASE_ID,
        EVALUATION_BOOKINGS_COLLECTION_ID,
        scheduleId,
        {
          status: 'cancelled',
        }
      );

      console.log('Booking cancelled successfully:', result);
    } catch (error: any) {
      console.error('Error cancelling schedule:', error);
      throw new Error(`Falha ao cancelar: ${error.message}`);
    }
  }

  static async rescheduleAppointment(
    user: any | null,
    scheduleId: string,
    newDate: Date,
    newTime: string
  ): Promise<void> {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('Rescheduling appointment:', {
        scheduleId,
        newDate,
        newTime,
      });

      // Get current booking
      const currentBooking = await db.getDocument(
        DATABASE_ID,
        EVALUATION_BOOKINGS_COLLECTION_ID,
        scheduleId
      );

      if (currentBooking.status !== 'booked') {
        throw new Error(
          'Não é possível reagendar uma avaliação que não está confirmada'
        );
      }

      // Convert date and time to find the new matching slot
      const startOfDay = new Date(newDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(newDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Parse the time string to get hours and minutes
      const [hours, minutes] = newTime.split(':').map(Number);

      // Get trainer from the current slot
      let trainerId;
      try {
        // If evaluationSlots is a string ID
        if (typeof currentBooking.evaluationSlots === 'string') {
          const currentSlot = await db.getDocument(
            DATABASE_ID,
            EVALUATION_SLOTS_COLLECTION_ID,
            currentBooking.evaluationSlots
          );
          trainerId = currentSlot.trainerProfileId;
        }
        // If evaluationSlots is an embedded object
        else if (typeof currentBooking.evaluationSlots === 'object') {
          trainerId = currentBooking.evaluationSlots.trainerProfileId;
          if (typeof trainerId === 'object' && trainerId.$id) {
            trainerId = trainerId.$id;
          }
        }
      } catch (error) {
        console.error('Error getting trainer ID:', error);
        throw new Error('Falha ao obter informações do treinador atual');
      }

      if (!trainerId) {
        throw new Error('Treinador não encontrado para este agendamento');
      }

      // Find a new slot that matches our criteria
      const slotsResponse = await db.listDocuments(
        DATABASE_ID,
        EVALUATION_SLOTS_COLLECTION_ID,
        [
          Query.greaterThanEqual('start', startOfDay.toISOString()),
          Query.lessThanEqual('start', endOfDay.toISOString()),
          Query.equal('trainerProfileId', trainerId),
        ]
      );

      // Find the slot with the matching time
      const newSlot = slotsResponse.documents.find((slot) => {
        const slotTime = new Date(slot.start);
        return (
          slotTime.getHours() === hours && slotTime.getMinutes() === minutes
        );
      });

      if (!newSlot) {
        throw new Error(
          'Nenhum horário disponível encontrado para esta data e treinador'
        );
      }

      // Check if this slot is already booked
      const bookingsResponse = await db.listDocuments(
        DATABASE_ID,
        EVALUATION_BOOKINGS_COLLECTION_ID,
        [
          Query.equal('evaluationSlots', newSlot.$id),
          Query.equal('status', 'booked'),
        ]
      );

      if (bookingsResponse.documents.length > 0) {
        throw new Error('Este horário já está reservado');
      }

      // Update the existing booking with the new slot
      const result = await db.updateDocument(
        DATABASE_ID,
        EVALUATION_BOOKINGS_COLLECTION_ID,
        scheduleId,
        {
          evaluationSlots: newSlot.$id,
          // Maintaining other fields (memberProfileId, status, tenantId) unchanged
        }
      );

      console.log('Appointment rescheduled successfully:', result);
    } catch (error: any) {
      console.error('Error rescheduling appointment:', error);
      throw new Error(`Falha ao reagendar: ${error.message}`);
    }
  }
}
