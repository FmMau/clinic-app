import express from 'express';
import * as admin from 'firebase-admin';
import { HttpsError, onCall, onRequest } from 'firebase-functions/v2/https';
import Stripe from 'stripe';

if (!admin.apps.length) {
  admin.initializeApp();
}


const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

interface CheckoutSessionData {
  amount: number;
  paymentId: string;
  patientId: string;
}

// Helper opcional para crear Stripe
function getStripe() {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error('STRIPE_SECRET_KEY no está definida en las variables de entorno');
  }

  return new Stripe(apiKey, {
    // apiVersion: '2025-08-27.basil', // si quieres fijar versión
  });
}

export const createCheckoutSession = onCall<CheckoutSessionData>(async (request) => {
  const { amount, paymentId, patientId } = request.data || {};

  if (!amount || !paymentId || !patientId) {
    console.error('Datos faltantes:', { amount, paymentId, patientId });
    throw new HttpsError('invalid-argument', 'Faltan campos requeridos');
  }

  try {
    const stripe = getStripe(); // 👈 AHORA SÍ AQUÍ

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'mxn',
            product_data: { name: 'Pago de consulta' },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `https://medaccess.com/stripe-success?paymentId=${paymentId}`,
      cancel_url: `https://medaccess.com/stripe-cancel`,
      metadata: {
        paymentId,
        patientId,
      },
    });

    if (!session.url) {
      console.error('Stripe no regresó URL de checkout:', session);
      throw new HttpsError('internal', 'Stripe no regresó URL de checkout');
    }

    return { url: session.url };
  } catch (error: any) {
    console.error('Error al crear sesión de pago:', error);
    throw new HttpsError(
      'internal',
      error?.message || 'Error al crear sesión de pago',
      error
    );
  }
});

// --- Webhook ---

const app = express();

app.post('/stripe-webhook', async (req, res) => {
  console.log('🚀 Webhook recibido');

  const sig = req.headers['stripe-signature'];
  const raw = (req as any).rawBody;

  if (!sig || !raw) {
    console.error('❌ No hay firma o rawBody');
    return res.status(400).send('Missing signature or raw body');
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();

    event = stripe.webhooks.constructEvent(raw, sig as string, webhookSecret);
    console.log(`✅ Tipo de evento: ${event.type}`);
  } catch (err: any) {
    console.error('❌ Error en constructEvent:', err.message);
    return res.status(400).send(`Error verificando firma: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const paymentId = session?.metadata?.paymentId;

    console.log('📦 Metadata recibida:', session.metadata);

    if (!paymentId) {
      console.error('❌ paymentId faltante');
      return res.status(400).send('paymentId faltante en metadata');
    }

    try {
      const db = admin.firestore();
      const ref = db.doc(`payments/${paymentId}`);
      const snap = await ref.get();

      if (!snap.exists) {
        console.error(`❌ Documento no encontrado: payments/${paymentId}`);
        return res.status(404).send('Documento no encontrado');
      }

      await ref.update({ status: 'pagado' });
      console.log(`✅ Estado actualizado a "pagado" para ${paymentId}`);

      // ✅ éxito cuando SÍ procesamos el evento
      return res.status(200).json({ received: true });
    } catch (err) {
      console.error('❌ Error al actualizar Firestore:', err);
      return res.status(500).send('Error al actualizar Firestore');
    }
  }

  // ✅ Para cualquier otro tipo de evento, respondemos 200 igual
  return res.status(200).json({ received: true });
});


export const stripeWebhook = onRequest({ cors: true }, app);
