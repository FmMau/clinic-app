import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

import PatientProfileEdit from '@/app/(tabs)/patient/profile/edit';


jest.mock('@/hooks/useRoleGuard', () => ({
  useRoleGuard: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: jest.fn(),
  }),
}));

jest.mock('@/lib/firebase/firebaseConfig', () => ({
  auth: {
    currentUser: {
      uid: 'test-uid',
    },
  },
  db: {},
  storage: {},
}));

jest.mock('firebase/firestore', () => {
  const actual = jest.requireActual('firebase/firestore');
  return {
    ...actual,
    doc: jest.fn((db, col, id) => ({ _path: `${col}/${id}` })),
    getDoc: jest.fn(),
    updateDoc: jest.fn(),
    Timestamp: {
      fromDate: jest.fn((date: Date) => ({
        toDate: () => date,
        seconds: Math.floor(date.getTime() / 1000),
      })),
    },
  };
});

jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
  deleteObject: jest.fn(),
}));

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  requestMediaLibraryPermissionsAsync: jest
    .fn()
    .mockResolvedValue({ granted: true }),
  launchCameraAsync: jest.fn().mockResolvedValue({ canceled: true }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true }),
  MediaTypeOptions: { Images: 'Images' },
}));

jest.mock('react-native-modal-datetime-picker', () => {
  // Componente dummy
  return ({ isVisible }: any) =>
    isVisible ? null : null;
});

const mockedUseRoleGuard = require('@/hooks/useRoleGuard')
  .useRoleGuard as jest.Mock;
const { getDoc, updateDoc } = require('firebase/firestore');

describe('PatientProfileEdit', () => {
  const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

  const basePatientData = {
    name: 'Juan',
    lastname: 'Pérez',
    email: 'juan@test.com',
    phone: '1234567890',
    address: 'Calle Falsa 123',
    allergies: 'Ninguna',
    gender: 'Masculino',
    birthdate: { seconds: 1609459200 }, // 01/01/2021
    curp: 'ABCDEFGHIJKLMN1234',
    photoURL: '',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    alertSpy.mockRestore();
  });

  it('muestra pantalla de carga cuando guardLoading es true', () => {
    mockedUseRoleGuard.mockReturnValue({
      loading: true,
      allowed: false,
    });

    const { getByText } = render(<PatientProfileEdit />);

    expect(getByText('Cargando perfil...')).toBeTruthy();
  });

  it('muestra mensaje cuando el perfil no existe', async () => {
    mockedUseRoleGuard.mockReturnValue({
      loading: false,
      allowed: true,
    });

    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => false,
      data: () => null,
    });

    const { getByText } = render(<PatientProfileEdit />);

    await waitFor(() => {
      expect(getByText('Perfil no encontrado')).toBeTruthy();
    });
  });

  it('renderiza los datos del paciente cuando el perfil existe', async () => {
    mockedUseRoleGuard.mockReturnValue({
      loading: false,
      allowed: true,
    });

    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => basePatientData,
    });

    const { getByText } = render(<PatientProfileEdit />);

    await waitFor(() => {
      expect(getByText('Juan Pérez')).toBeTruthy();
      expect(getByText('Paciente')).toBeTruthy();
    });
  });

  it('muestra alerta si el correo es inválido al guardar', async () => {
    mockedUseRoleGuard.mockReturnValue({
      loading: false,
      allowed: true,
    });

    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({
        ...basePatientData,
        email: 'correo-invalido',
      }),
    });

    const { getByText } = render(<PatientProfileEdit />);

    await waitFor(() => {
      expect(getByText('Guardar cambios')).toBeTruthy();
    });

    const saveButton = getByText('Guardar cambios');
    fireEvent.press(saveButton);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Error',
      'Correo electrónico no válido.'
    );
    expect(updateDoc).not.toHaveBeenCalled();
  });

  it('muestra alerta si el teléfono no tiene 10 dígitos', async () => {
    mockedUseRoleGuard.mockReturnValue({
      loading: false,
      allowed: true,
    });

    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({
        ...basePatientData,
        phone: '123',
      }),
    });

    const { getByText } = render(<PatientProfileEdit />);

    await waitFor(() => {
      expect(getByText('Guardar cambios')).toBeTruthy();
    });

    const saveButton = getByText('Guardar cambios');
    fireEvent.press(saveButton);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Error',
      'Teléfono debe tener 10 dígitos numéricos.'
    );
    expect(updateDoc).not.toHaveBeenCalled();
  });

  it('muestra alerta si la CURP no tiene 18 caracteres', async () => {
    mockedUseRoleGuard.mockReturnValue({
      loading: false,
      allowed: true,
    });

    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({
        ...basePatientData,
        curp: 'CURP-CORTA',
      }),
    });

    const { getByText } = render(<PatientProfileEdit />);

    await waitFor(() => {
      expect(getByText('Guardar cambios')).toBeTruthy();
    });

    const saveButton = getByText('Guardar cambios');
    fireEvent.press(saveButton);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Error',
      'La CURP debe tener 18 caracteres.'
    );
    expect(updateDoc).not.toHaveBeenCalled();
  });

  it('actualiza el documento cuando los datos son válidos', async () => {
    mockedUseRoleGuard.mockReturnValue({
      loading: false,
      allowed: true,
    });

    const validDate = new Date('1990-01-01T00:00:00Z');

    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({
        ...basePatientData,
        birthdate: validDate,
      }),
    });

    const { getByText } = render(<PatientProfileEdit />);

    await waitFor(() => {
      expect(getByText('Guardar cambios')).toBeTruthy();
    });

    const saveButton = getByText('Guardar cambios');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledTimes(1);
      expect(Alert.alert).toHaveBeenCalledWith(
        'Éxito',
        'Datos actualizados correctamente'
      );
    });

    const [, updatedData] = (updateDoc as jest.Mock).mock.calls[0];
    expect(updatedData.birthdate).toBeDefined();
  });
});
