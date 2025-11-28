import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

import CreateAppointment from '@/app/(tabs)/patient/appointments/create';


// Hook de roles
jest.mock('@/hooks/useRoleGuard', () => ({
  useRoleGuard: jest.fn(),
}));

// Router de Expo
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));

// Firebase config
jest.mock('@/lib/firebase/firebaseConfig', () => ({
  auth: {
    currentUser: {
      uid: 'patient-123',
      displayName: 'Juan Paciente',
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
    getDocs: jest.fn(async () => ({
      docs: [],
    })),
    addDoc: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    Timestamp: {
      fromDate: jest.fn((d: Date) => ({ toDate: () => d })),
      now: jest.fn(() => ({ toDate: () => new Date() })),
    },
  };
});

// Calendar y DropDownPicker
jest.mock('react-native-calendars', () => ({
  Calendar: (props: any) => {
    return <></>;
  },
}));

jest.mock('react-native-dropdown-picker', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return (props: any) => <Text>MockDropDown</Text>;
});

const mockedUseRoleGuard =
  require('@/hooks/useRoleGuard').useRoleGuard as jest.Mock;
const { addDoc } = require('firebase/firestore');

describe('CreateAppointment', () => {
  const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    alertSpy.mockRestore();
  });

  //1. Si está cargando o no está permitido, no renderiza nada
  it('no renderiza contenido cuando guardLoading es true o allowed es false', () => {
    mockedUseRoleGuard.mockReturnValue({
      loading: true,
      allowed: false,
    });

    const { toJSON } = render(<CreateAppointment />);
    expect(toJSON()).toBeNull();
  });

  //2. Renderiza el formulario principal cuando el paciente está permitido
  it('muestra el formulario de creación de cita cuando el paciente está permitido', () => {
    mockedUseRoleGuard.mockReturnValue({
      loading: false,
      allowed: true,
    });

    const { getByText } = render(<CreateAppointment />);

    expect(getByText('Agendar nueva cita')).toBeTruthy();
    expect(getByText('MockDropDown')).toBeTruthy(); // nuestro DropDownPicker mockeado
    expect(getByText('Motivo / Tipo de consulta')).toBeTruthy();
    expect(getByText('Confirmar cita')).toBeTruthy();
  });

  //3. Validación: si faltan campos, muestra alerta y NO intenta crear cita
  it('muestra error si faltan campos al intentar confirmar la cita', async () => {
    mockedUseRoleGuard.mockReturnValue({
      loading: false,
      allowed: true,
    });

    const { getByText } = render(<CreateAppointment />);

    const confirmButton = getByText('Confirmar cita');
    fireEvent.press(confirmButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Completa todos los campos, incluyendo fecha y horario.'
      );
    });

    expect(addDoc).not.toHaveBeenCalled();
  });

  //4. Validación: si la sesión no es válida (sin uid), muestra error
  it('muestra error si no hay sesión válida (sin uid)', async () => {
    // Sobrescribir temporalmente el auth mock
    const { auth } = require('@/lib/firebase/firebaseConfig');
    auth.currentUser = null;

    mockedUseRoleGuard.mockReturnValue({
      loading: false,
      allowed: true,
    });

    const { getByText } = render(<CreateAppointment />);

    const confirmButton = getByText('Confirmar cita');
    fireEvent.press(confirmButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Completa todos los campos, incluyendo fecha y horario.');
    });
  });
});
