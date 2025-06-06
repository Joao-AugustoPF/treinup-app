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
  status: 'scheduled' | 'completed' | 'cancelled';
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

      // First, get the user's profile
      const profilesResponse = await db.listDocuments(
        DATABASE_ID,
        PROFILES_COLLECTION_ID,
        [Query.equal('userId', user.id)]
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

      // Map to the return type expected by the UI
      const schedules = await Promise.all(
        bookingsResponse.documents.map(async (booking) => {
          // Get the slot details
          const slotId = booking.evaluationSlots;
          let slotDetails;

          try {
            slotDetails = await db.getDocument(
              DATABASE_ID,
              EVALUATION_SLOTS_COLLECTION_ID,
              slotId
            );
          } catch (error) {
            console.error(`Error fetching slot ${slotId}:`, error);
            // Return a placeholder if slot not found
            return {
              id: booking.$id,
              date: new Date(),
              time: 'Unknown',
              trainerId: booking.trainerProfileId || 'Unknown',
              status: booking.status,
              slotId: slotId,
            };
          }

          // Convert slot start time to date and time format
          const slotDate = new Date(slotDetails.start);
          const time = slotDate.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          });

          return {
            id: booking.$id,
            date: slotDate,
            time: time,
            trainerId: slotDetails.trainerProfileId,
            status: booking.status,
            slotId: slotId,
          };
        })
      );

      return schedules;
    } catch (error) {
      console.error('Error fetching user schedules:', error);
      throw new Error('Failed to fetch user schedules');
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
        throw new Error('User not authenticated');
      }

      // Find the user's profile ID
      const profilesResponse = await db.listDocuments(
        DATABASE_ID,
        PROFILES_COLLECTION_ID,
        [Query.equal('userId', user.id)]
      );

      if (profilesResponse.documents.length === 0) {
        throw new Error('User profile not found');
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
        throw new Error('No matching slot found');
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
        throw new Error('This slot is already booked');
      }

      // Create a booking
      await db.createDocument(
        DATABASE_ID,
        EVALUATION_BOOKINGS_COLLECTION_ID,
        'unique()',
        {
          status: 'booked',
          tenantId: matchingSlot.tenantId,
          evaluationSlots: matchingSlot.$id,
          memberProfileId: userProfileId,
        }
      );
    } catch (error) {
      console.error('Error creating schedule:', error);
      throw new Error('Failed to create schedule');
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

      // Get the booking document
      const booking = await db.getDocument(
        DATABASE_ID,
        EVALUATION_BOOKINGS_COLLECTION_ID,
        scheduleId
      );

      // Update the status to cancelled
      await db.updateDocument(
        DATABASE_ID,
        EVALUATION_BOOKINGS_COLLECTION_ID,
        scheduleId,
        {
          status: 'cancelled',
        }
      );
    } catch (error) {
      console.error('Error cancelling schedule:', error);
      throw new Error('Failed to cancel schedule');
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

      // Get current booking
      const currentBooking = await db.getDocument(
        DATABASE_ID,
        EVALUATION_BOOKINGS_COLLECTION_ID,
        scheduleId
      );

      // Get current slot to find the trainer
      const currentSlot = await db.getDocument(
        DATABASE_ID,
        EVALUATION_SLOTS_COLLECTION_ID,
        currentBooking.evaluationSlots
      );

      const trainerId = currentSlot.trainerProfileId;

      // Cancel current booking
      await this.cancelSchedule(user, scheduleId);

      // Create new booking
      await this.createSchedule(user, newDate, newTime, trainerId);
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      throw new Error('Failed to reschedule appointment');
    }
  }
}
