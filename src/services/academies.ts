import { DATABASE_ID, db } from '../api/appwrite-client';

const ACADEMIES_COLLECTION_ID = 'academies';

export type Academy = {
  id: string;
  name: string;
  slug: string;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  lat?: number;
  lng?: number;
  phone?: string;
  logoUrl?: string;
  paymentGateway: 'stripe' | 'mercadoPago';
  gatewayKey?: string;
  ownerProfileId?: string;
};

export type ApiResponse<T> = {
  data: T;
  error?: string;
};

export class AcademyService {
  static async getAcademies(): Promise<ApiResponse<Academy[]>> {
    try {
      const response = await db.listDocuments(
        DATABASE_ID,
        ACADEMIES_COLLECTION_ID
      );

      const academies = response.documents.map((doc) => ({
        id: doc.$id,
        name: doc.name,
        slug: doc.slug,
        addressStreet: doc.addressStreet,
        addressCity: doc.addressCity,
        addressState: doc.addressState,
        addressZip: doc.addressZip,
        lat: doc.lat,
        lng: doc.lng,
        phone: doc.phone,
        logoUrl: doc.logoUrl,
        paymentGateway: doc.paymentGateway,
        gatewayKey: doc.gatewayKey,
        ownerProfileId: doc.ownerProfileId,
      }));

      return {
        data: academies,
      };
    } catch (error) {
      console.error('Error fetching academies:', error);
      return {
        data: [],
        error: 'Failed to fetch academies',
      };
    }
  }

  static async getAcademy(
    academyId: string
  ): Promise<ApiResponse<Academy | null>> {
    try {
      const doc = await db.getDocument(
        DATABASE_ID,
        ACADEMIES_COLLECTION_ID,
        academyId
      );

      const academy = {
        id: doc.$id,
        name: doc.name,
        slug: doc.slug,
        addressStreet: doc.addressStreet,
        addressCity: doc.addressCity,
        addressState: doc.addressState,
        addressZip: doc.addressZip,
        lat: doc.lat,
        lng: doc.lng,
        phone: doc.phone,
        logoUrl: doc.logoUrl,
        paymentGateway: doc.paymentGateway,
        gatewayKey: doc.gatewayKey,
        ownerProfileId: doc.ownerProfileId,
      };

      return {
        data: academy,
      };
    } catch (error) {
      console.error(`Error fetching academy ${academyId}:`, error);
      return {
        data: null,
        error: 'Failed to fetch academy',
      };
    }
  }
}
