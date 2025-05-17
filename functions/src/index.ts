import * as admin from 'firebase-admin';
import { onCall } from 'firebase-functions/v2/https';
import Stripe from 'stripe';

admin.initializeApp();

const stripe = new Stripe('sk_test_51RPFfMKDCb8gyhPIY6HGTh6InhlZh3WG4B7XfF1IU4JlI2M5bczEFq3MOVn0cVlHiCGPcECKsijk98dPkMPt9xFk00XpItuJgZ', {
  apiVersion: '2025-04-30.basil',
});

interface CheckoutSessionData {
  amount: number;
  paymentId: string;
  patientId: string;
}

export const createCheckoutSession = onCall<CheckoutSessionData>(async (request) => {
  const { data } = request;
  const { amount, paymentId, patientId } = data;

  if (!amount || !paymentId || !patientId) {
    console.error('Datos faltantes:', { amount, paymentId, patientId });
    throw new Error('Faltan campos requeridos');
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'mxn',
            product_data: {
              name: 'Pago de consulta',
            },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'https://example.com/pago-exitoso',
      cancel_url: 'https://example.com/pago-cancelado',
      metadata: {
        paymentId,
        patientId,
      },
    });

    return { url: session.url };
  } catch (error: any) {
    console.error('Error al crear sesión de pago:', error.message, error.stack);
    throw new Error(error.message || 'Error desconocido');
  }
});
