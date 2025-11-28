import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

import PaymentAndReview from '@/app/(tabs)/patient/payments/[id]/review';


// Mock del hook de roles
jest.mock('@/hooks/useRoleGuard', () => ({
  useRoleGuard: jest.fn(),
}));

// Mock de expo-router con funciones configurables
const mockUseRouter = jest.fn();
const mockUseLocalSearchParams = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => mockUseRouter(),
  useLocalSearchParams: () => mockUseLocalSearchParams(),
}));

// Mock de Firebase config
jest.mock('@/lib/firebase/firebaseConfig', () => ({
  db: {},
}));

// Mock de Firestore
jest.mock('firebase/firestore', () => {
  const actual = jest.requireActual('firebase/firestore');
  return {
    ...actual,
    doc: jest.fn((db, col, id) => ({ _path: `${col}/${id}` })),
    getDoc: jest.fn(),
    updateDoc: jest.fn(),
  };
});

// Mock de LoadingScreen para que realmente haya un <Text> con el mensaje
jest.mock('@/components/ui/LoadingScreen', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return function MockLoadingScreen({ message }: { message: string }) {
    return <Text>{message}</Text>;
  };
});

const mockedUseRoleGuard =
  require('@/hooks/useRoleGuard').useRoleGuard as jest.Mock;
const { getDoc, updateDoc } = require('firebase/firestore');

describe('PaymentAndReview', () => {
  const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

  let router: { back: jest.Mock; replace: jest.Mock; push: jest.Mock };

  const basePayment = {
    amount: 500,
    status: 'pagado',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Router "global" para todos los tests
    router = {
      back: jest.fn(),
      replace: jest.fn(),
      push: jest.fn(),
    };

    mockUseRouter.mockReturnValue(router);
    mockUseLocalSearchParams.mockReturnValue({ id: 'payment-123' });
  });

  afterAll(() => {
    alertSpy.mockRestore();
  });

  // 1. Pantalla de carga
  it('muestra pantalla de carga mientras se cargan permisos o pago', () => {
    mockedUseRoleGuard.mockReturnValue({ loading: true, allowed: false });

    const { getByText } = render(<PaymentAndReview />);

    expect(getByText('Cargando pago y valoración...')).toBeTruthy();
  });

  //  2. Pago no existe
  it('muestra error si el pago no existe', async () => {
    mockedUseRoleGuard.mockReturnValue({ loading: false, allowed: true });

    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => false,
    });

    render(<PaymentAndReview />);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Pago no encontrado');
      expect(router.back).toHaveBeenCalled();
    });
  });

  // 3. Pago no pagado redirige a la pantalla de pago
  it('redirige si el pago no está pagado', async () => {
    mockedUseRoleGuard.mockReturnValue({ loading: false, allowed: true });

    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({ amount: 300, status: 'pendiente' }),
    });

    render(<PaymentAndReview />);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Este pago aún no ha sido completado.'
      );
      expect(router.replace).toHaveBeenCalledWith(
        '/(tabs)/patient/payments/payment-123/pay'
      );
    });
  });

  // 4. Muestra el total pagado
  it('renderiza el total pagado cuando el pago es válido', async () => {
    mockedUseRoleGuard.mockReturnValue({ loading: false, allowed: true });

    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => basePayment,
    });

    const { getByText } = render(<PaymentAndReview />);

    await waitFor(() => {
      expect(getByText('Pagos y Valoraciones')).toBeTruthy();
      expect(getByText('$500.00')).toBeTruthy();
    });
  });

  // 5. Flujo exitoso: envía valoración
  it('permite enviar valoración exitosa', async () => {
    mockedUseRoleGuard.mockReturnValue({ loading: false, allowed: true });

    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => basePayment,
    });

    const { getByText, getByPlaceholderText, getByTestId } = render(
      <PaymentAndReview />
    );

    // Esperamos a que deje de estar en Loading
    await waitFor(() => {
      expect(getByText('Enviar')).toBeTruthy();
    });

    // Seleccionamos 5 estrellas
    fireEvent.press(getByTestId('star-4'));

    // Escribimos comentarios
    fireEvent.changeText(
      getByPlaceholderText('Escribe tus comentarios aquí...'),
      'Muy buen servicio'
    );

    // Enviamos
    fireEvent.press(getByText('Enviar'));

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledTimes(1);
      expect(Alert.alert).toHaveBeenCalledWith(
        'Gracias',
        'Tu valoración ha sido registrada.'
      );
      expect(router.push).toHaveBeenCalledWith('/(tabs)/patient/payments');
    });

    const [refArg, payload] = (updateDoc as jest.Mock).mock.calls[0];
    expect(refArg).toEqual({ _path: 'payments/payment-123' });
    expect(payload.rating).toBe(5);
    expect(payload.comments).toBe('Muy buen servicio');
  });
});
