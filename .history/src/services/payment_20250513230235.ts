import { Platform } from 'react-native';

export type PaymentMethod = {
  id: string;
  type: 'card' | 'google_pay' | 'apple_pay';
  last4?: string;
  brand?: string;
  expiryMonth?: string;
  expiryYear?: string;
};

export type PaymentGateway = 'stripe' | 'paypal';

export type PaymentIntent = {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed';
  paymentMethod?: PaymentMethod;
  created: Date;
};

// Mock data for saved payment methods
const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'pm_1',
    type: 'card',
    last4: '4242',
    brand: 'visa',
    expiryMonth: '12',
    expiryYear: '2025',
  },
];

// Mock payment intents
const MOCK_PAYMENT_INTENTS: PaymentIntent[] = [];

export class PaymentService {
  static async getAvailablePaymentMethods(): Promise<string[]> {
    const methods = ['card'];

    if (Platform.OS === 'ios') {
      methods.push('apple_pay');
    } else if (Platform.OS === 'android') {
      methods.push('google_pay');
    }

    return methods;
  }

  static async getSavedPaymentMethods(user: User | null): Promise<PaymentMethod[]> {
    if (!user) throw new Error('User not authenticated');
    await new Promise(resolve => setTimeout(resolve, 500));
    return MOCK_PAYMENT_METHODS;
  }

  static async createPaymentMethod(
    user: any | null,
    data: {
      type: 'card';
      cardNumber: string;
      expiryMonth: string;
      expiryYear: string;
      cvc: string;
    }
  ): Promise<PaymentMethod> {
    if (!user) throw new Error('User not authenticated');
    
    // Simulate API call to create payment method
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Basic validation
    if (data.cardNumber.length !== 16) {
      throw new Error('Invalid card number');
    }

    const paymentMethod: PaymentMethod = {
      id: `pm_${Math.random().toString(36).substr(2, 9)}`,
      type: 'card',
      last4: data.cardNumber.slice(-4),
      brand: 'visa', // In real implementation, determine from card number
      expiryMonth: data.expiryMonth,
      expiryYear: data.expiryYear,
    };

    MOCK_PAYMENT_METHODS.push(paymentMethod);
    return paymentMethod;
  }

  static async createPaymentIntent(
    user: User | null,
    data: {
      amount: number;
      currency: string;
      paymentMethodId: string;
      gateway: PaymentGateway;
    }
  ): Promise<PaymentIntent> {
    if (!user) throw new Error('User not authenticated');

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const paymentMethod = MOCK_PAYMENT_METHODS.find(pm => pm.id === data.paymentMethodId);
    if (!paymentMethod) {
      throw new Error('Payment method not found');
    }

    const paymentIntent: PaymentIntent = {
      id: `pi_${Math.random().toString(36).substr(2, 9)}`,
      amount: data.amount,
      currency: data.currency,
      status: 'pending',
      paymentMethod,
      created: new Date(),
    };

    MOCK_PAYMENT_INTENTS.push(paymentIntent);
    return paymentIntent;
  }

  static async confirmPayment(
    user: User | null,
    paymentIntentId: string
  ): Promise<PaymentIntent> {
    if (!user) throw new Error('User not authenticated');

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    const paymentIntent = MOCK_PAYMENT_INTENTS.find(pi => pi.id === paymentIntentId);
    if (!paymentIntent) {
      throw new Error('Payment intent not found');
    }

    // Simulate payment processing
    paymentIntent.status = 'processing';
    await new Promise(resolve => setTimeout(resolve, 1000));
    paymentIntent.status = Math.random() > 0.1 ? 'succeeded' : 'failed';

    return paymentIntent;
  }

  static async deletePaymentMethod(
    user: User | null,
    paymentMethodId: string
  ): Promise<void> {
    if (!user) throw new Error('User not authenticated');

    await new Promise(resolve => setTimeout(resolve, 500));
    const index = MOCK_PAYMENT_METHODS.findIndex(pm => pm.id === paymentMethodId);
    if (index !== -1) {
      MOCK_PAYMENT_METHODS.splice(index, 1);
    }
  }
}