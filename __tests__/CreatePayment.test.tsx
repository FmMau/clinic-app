import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

import CreatePayment from '@/app/(tabs)/doctor/payments/create';


// Router (expo-router)
const mockUseRouter = jest.fn();
const mockUseLocalSearchParams = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => mockUseRouter(),
  useLocalSearchParams: () => mockUseLocalSearchParams(),
}));

// Firebase config
jest.mock('@/lib/firebase/firebaseConfig', () => ({
  auth: {
    currentUser: {
      uid: 'doctor-123',
      displayName: 'Dr. Test',
    },
  },
  db: {},
}));

// Firestore
jest.mock('firebase/firestore', () => {
  const actual = jest.requireActual('firebase/firestore');
  return {
    ...actual,
    collection: jest.fn((db, path) => ({ _path: path })),
    doc: jest.fn((db, col, id) => ({ _path: `${col}/${id}` })),
    getDoc: jest.fn(),
    addDoc: jest.fn(),
    serverTimestamp: jest.fn(() => 'MOCK_TIMESTAMP'),
  };
});

const { getDoc, addDoc } = require('firebase/firestore');

describe('CreatePayment', () => {
  const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

  const doctorProfile = { name: 'Dr. Strange', specialty: 'Neurología' };
  const patientInfo = { name: 'Juan Paciente' };

  let router: { replace: jest.Mock; push: jest.Mock; back: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();

    const { auth } = require('@/lib/firebase/firebaseConfig');
    auth.currentUser = {
      uid: 'doctor-123',
      displayName: 'Dr. Test',
    };

    // Router
    router = {
      replace: jest.fn(),
      push: jest.fn(),
      back: jest.fn(),
    };
    mockUseRouter.mockReturnValue(router);

    // Params con patientId válido por defecto
    mockUseLocalSearchParams.mockReturnValue({ patientId: 'patient-123' });

    // getDoc: devuelve doctor y paciente por defecto
    (getDoc as jest.Mock).mockImplementation((ref: any) => {
      if (ref._path === 'doctors/doctor-123') {
        return Promise.resolve({
          exists: () => true,
          data: () => doctorProfile,
        });
      }
      if (ref._path === 'patients/patient-123') {
        return Promise.resolve({
          exists: () => true,
          data: () => patientInfo,
        });
      }
      return Promise.resolve({ exists: () => false, data: () => ({}) });
    });
  });

  afterAll(() => {
    alertSpy.mockRestore();
  });

  // 1. Muestra el estado de "cargando" al inicio
  it('muestra el texto de carga al iniciar', () => {
    const { getByText } = render(<CreatePayment />);

    expect(getByText('Cargando datos del pago...')).toBeTruthy();
  });

  // 2. Renderiza el formulario con datos cargados
  it('renderiza el formulario con datos del doctor y paciente', async () => {
    const { getByText, getByPlaceholderText } = render(<CreatePayment />);

    await waitFor(() => {
      expect(getByText('Crear Pago')).toBeTruthy();
    });

    expect(getByText('ID del Paciente')).toBeTruthy();
    expect(getByText('Nombre del Paciente')).toBeTruthy();
    expect(getByText('Nombre del Doctor')).toBeTruthy();
    expect(getByText('Especialidad')).toBeTruthy();

    expect(getByPlaceholderText('Consulta médica').props.value).toBe(
      'Consulta médica'
    );
    expect(getByPlaceholderText('500.00').props.value).toBe('');
  });

  // 3. Validación: falta patientId
  it('muestra error si falta el patientId', async () => {
    mockUseLocalSearchParams.mockReturnValue({}); // sin patientId

    const { getByText, getByPlaceholderText } = render(<CreatePayment />);

    await waitFor(() => {
      expect(getByText('Crear Pago')).toBeTruthy();
    });

    fireEvent.changeText(getByPlaceholderText('500.00'), '500');

    fireEvent.press(getByText('Enviar Pago'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Falta el paciente asociado al pago.'
      );
    });

    expect(addDoc).not.toHaveBeenCalled();
  });

  // 4. Validación: campos obligatorios vacíos
  it('muestra error si faltan campos obligatorios', async () => {
    const { getByText } = render(<CreatePayment />);

    await waitFor(() => {
      expect(getByText('Crear Pago')).toBeTruthy();
    });

    fireEvent.press(getByText('Enviar Pago'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Completa todos los campos obligatorios.'
      );
    });

    expect(addDoc).not.toHaveBeenCalled();
  });

  // 5. Validación: monto con formato inválido
  it('muestra error si el monto no tiene formato válido', async () => {
    const { getByText, getByPlaceholderText } = render(<CreatePayment />);

    await waitFor(() => {
      expect(getByText('Crear Pago')).toBeTruthy();
    });

    fireEvent.changeText(getByPlaceholderText('500.00'), '123.456');

    fireEvent.press(getByText('Enviar Pago'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Monto inválido. Usa solo números y hasta 2 decimales (ej. 500 o 500.50).'
      );
    });

    expect(addDoc).not.toHaveBeenCalled();
  });

  // 6. Validación: monto <= 0
  it('muestra error si el monto es menor o igual a 0', async () => {
    const { getByText, getByPlaceholderText } = render(<CreatePayment />);

    await waitFor(() => {
      expect(getByText('Crear Pago')).toBeTruthy();
    });

    fireEvent.changeText(getByPlaceholderText('500.00'), '0');

    fireEvent.press(getByText('Enviar Pago'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'El monto debe ser mayor a 0.'
      );
    });

    expect(addDoc).not.toHaveBeenCalled();
  });

  // 7. Validación: sin sesión activa al enviar
  it('muestra error si no hay sesión activa al enviar', async () => {
    const { auth } = require('@/lib/firebase/firebaseConfig');
    auth.currentUser = null;

    const { getByText, getByPlaceholderText } = render(<CreatePayment />);

    await waitFor(() => {
      expect(getByText('Crear Pago')).toBeTruthy();
    });

    fireEvent.changeText(getByPlaceholderText('500.00'), '500');

    fireEvent.press(getByText('Enviar Pago'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'No se encontró sesión activa.'
      );
    });

    expect(addDoc).not.toHaveBeenCalled();
  });

  // 8. Flujo feliz: crea el pago correctamente
  it('crea el pago correctamente cuando los datos son válidos', async () => {
    const { getByText, getByPlaceholderText } = render(<CreatePayment />);

    await waitFor(() => {
      expect(getByText('Crear Pago')).toBeTruthy();
    });

    fireEvent.changeText(getByPlaceholderText('500.00'), '500.50');

    fireEvent.press(getByText('Enviar Pago'));

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledTimes(1);
      expect(Alert.alert).toHaveBeenCalledWith(
        'Éxito',
        'Pago creado exitosamente.'
      );
      expect(router.replace).toHaveBeenCalledWith(
        '/(tabs)/doctor/payments'
      );
    });

    const [collectionArg, payload] = (addDoc as jest.Mock).mock.calls[0];

    expect(collectionArg).toEqual({ _path: 'payments' });
    expect(payload.amount).toBe(500.5);
    expect(payload.concept).toBe('Consulta médica');
    expect(payload.patientId).toBe('patient-123');
    expect(payload.patientName).toBe('Juan Paciente');
    expect(payload.doctorId).toBe('doctor-123');
    expect(payload.doctorName).toBe('Dr. Strange');
    expect(payload.specialty).toBe('Neurología');
    expect(payload.status).toBe('pendiente');
    expect(payload.rating).toBeNull();
    expect(payload.comments).toBe('');
  });
});
