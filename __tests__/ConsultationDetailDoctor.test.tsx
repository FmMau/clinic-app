import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

import ConsultationDetail from '@/app/(tabs)/doctor/consultation/[id]';

// Mocks de expo-router
const mockUseRouter = jest.fn();
const mockUseLocalSearchParams = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => mockUseRouter(),
  useLocalSearchParams: () => mockUseLocalSearchParams(),
}));

// Mock firebase config
jest.mock('@/lib/firebase/firebaseConfig', () => ({
  auth: {
    currentUser: {
      uid: 'doctor-123',
    },
  },
  db: {},
}));

// Mock Firestore
jest.mock('firebase/firestore', () => {
  const actual = jest.requireActual('firebase/firestore');
  return {
    ...actual,
    collection: jest.fn((db, path) => ({ _path: path })),
    doc: jest.fn((db, col, id) => ({ _path: `${col}/${id}` })),
    getDoc: jest.fn(),
    addDoc: jest.fn(),
    Timestamp: {
      now: jest.fn(() => 'MOCK_TIMESTAMP'),
    },
  };
});

const { getDoc, addDoc } = require('firebase/firestore');

describe('ConsultationDetailDoctor', () => {
  const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

  const basePatient = {
    name: 'Juan',
    lastname: 'Pérez',
  };

  let router: { push: jest.Mock; replace: jest.Mock; back: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();

    router = {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
    };
    mockUseRouter.mockReturnValue(router);

    // Por defecto, hay id de paciente
    mockUseLocalSearchParams.mockReturnValue({ id: 'patient-123' });

    // Paciente existe por defecto
    (getDoc as jest.Mock).mockImplementation((ref: any) => {
      if (ref._path === 'patients/patient-123') {
        return Promise.resolve({
          exists: () => true,
          data: () => basePatient,
        });
      }
      return Promise.resolve({
        exists: () => false,
        data: () => ({}),
      });
    });

    // Sesión válida por defecto
    const { auth } = require('@/lib/firebase/firebaseConfig');
    auth.currentUser = { uid: 'doctor-123' };
  });

  afterAll(() => {
    alertSpy.mockRestore();
  });

  it('muestra el estado de carga al iniciar', () => {
    const { getByText } = render(<ConsultationDetail />);
    expect(getByText('Cargando...')).toBeTruthy();
  });

  it('muestra "Paciente no encontrado" si el paciente no existe', async () => {
    (getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => false,
      data: () => ({}),
    });

    const { getByText } = render(<ConsultationDetail />);

    await waitFor(() => {
      expect(getByText('Paciente no encontrado')).toBeTruthy();
    });
  });

  it('renderiza datos del paciente y los campos del diagnóstico', async () => {
    const { getByText, getByPlaceholderText } = render(<ConsultationDetail />);

    await waitFor(() => {
      expect(getByText('Registrar diagnóstico')).toBeTruthy();
    });

    expect(getByText('Juan Pérez')).toBeTruthy();
    expect(getByText(/ID: patient-123/)).toBeTruthy();
    expect(getByPlaceholderText('Describe el diagnóstico')).toBeTruthy();
    expect(getByPlaceholderText('Lista de medicamentos')).toBeTruthy();
    expect(getByPlaceholderText('Instrucciones adicionales')).toBeTruthy();
  });

  // TEST CORREGIDO: aquí solo quitamos al doctor, no al paciente
  it('muestra error si faltan datos de paciente o doctor', async () => {
    const { auth } = require('@/lib/firebase/firebaseConfig');
    auth.currentUser = null; // sin doctor

    const { getByText } = render(<ConsultationDetail />);

    await waitFor(() => {
      expect(getByText('Guardar diagnóstico')).toBeTruthy();
    });

    const button = getByText('Guardar diagnóstico');
    fireEvent.press(button);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Faltan datos del paciente o del doctor. Intenta volver a abrir la consulta.'
      );
    });

    expect(addDoc).not.toHaveBeenCalled();
  });

  it('muestra error si el diagnóstico está vacío', async () => {
    const { getByText } = render(<ConsultationDetail />);

    await waitFor(() => {
      expect(getByText('Guardar diagnóstico')).toBeTruthy();
    });

    const button = getByText('Guardar diagnóstico');
    fireEvent.press(button);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'El diagnóstico es obligatorio.'
      );
    });

    expect(addDoc).not.toHaveBeenCalled();
  });

  it('guarda el diagnóstico y redirige a la creación de pago cuando los datos son válidos', async () => {
    const { getByText, getByPlaceholderText } = render(<ConsultationDetail />);

    await waitFor(() => {
      expect(getByText('Guardar diagnóstico')).toBeTruthy();
    });

    fireEvent.changeText(
      getByPlaceholderText('Describe el diagnóstico'),
      'Gripe común'
    );
    fireEvent.changeText(
      getByPlaceholderText('Lista de medicamentos'),
      'Paracetamol'
    );
    fireEvent.changeText(
      getByPlaceholderText('Instrucciones adicionales'),
      'Reposo y líquidos'
    );

    const button = getByText('Guardar diagnóstico');
    fireEvent.press(button);

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledTimes(1);
      expect(Alert.alert).toHaveBeenCalledTimes(1);
    });

    const [collectionArg, record] = (addDoc as jest.Mock).mock.calls[0];
    expect(collectionArg).toEqual({ _path: 'medicalRecords' });
    expect(record.patientId).toBe('patient-123');
    expect(record.doctorId).toBe('doctor-123');
    expect(record.diagnosis).toBe('Gripe común');
    expect(record.medications).toBe('Paracetamol');
    expect(record.instructions).toBe('Reposo y líquidos');
    expect(record.createdAt).toBe('MOCK_TIMESTAMP');

    const alertArgs = (Alert.alert as jest.Mock).mock.calls[0];
    const buttons = alertArgs[2];
    const okButton = buttons[0];
    okButton.onPress();

    expect(router.push).toHaveBeenCalledWith(
      '/(tabs)/doctor/payments/create?patientId=patient-123'
    );
  });
});
