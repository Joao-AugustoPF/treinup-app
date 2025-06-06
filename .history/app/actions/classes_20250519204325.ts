'use server';

import { Api } from '@/src/services/api';
import type { ClassType } from '@/types';

export async function getClasses(type?: ClassType) {
  try {
    const response = await Api.getClasses(type);
    return {
      classes: response.data.classes,
      error: response.error,
    };
  } catch (error) {
    console.error('Error fetching classes:', error);
    return {
      classes: [],
      error: 'Falha ao carregar as aulas',
    };
  }
}

export async function getClassTypes() {
  try {
    const response = await Api.getClassTypes();
    return {
      types: response.data.types,
      error: response.error,
    };
  } catch (error) {
    console.error('Error fetching class types:', error);
    return {
      types: ['functional'],
      error: 'Falha ao carregar tipos de aula',
    };
  }
}

export async function checkIn(classId: string) {
  try {
    const response = await Api.checkIn(classId);
    return {
      success: !response.error,
      error: response.error,
    };
  } catch (error) {
    console.error('Error checking in:', error);
    return {
      success: false,
      error: 'Falha ao fazer check-in',
    };
  }
}

export async function cancelCheckIn(classId: string) {
  try {
    const response = await Api.cancelCheckIn(classId);
    return {
      success: !response.error,
      error: response.error,
    };
  } catch (error) {
    console.error('Error canceling check-in:', error);
    return {
      success: false,
      error: 'Falha ao cancelar check-in',
    };
  }
} 