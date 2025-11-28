import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

import DoctorProfileEdit from '@/app/(tabs)/doctor/profile/edit';


// Hook de roles
jest.mock('@/hooks/useRoleGuard', () => ({
  useRoleGuard: jest.fn(),
}));

// Router de Expo
const mockUseRouter = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => mockUseRouter(),
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
  storage: {},
}));

jest.mock('firebase/firestore', () => {
  const actual = jest.requireActual('firebase/firestore');
  return {
    ...actual,
    doc: jest.fn((db, col, id) => ({ _path: `${col}/${id}` })),
    getDoc: jest.fn(),
    updateDoc: jest.fn(),
  };
});

// Storage
jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
}));

// Auth (para updatePassword)
jest.mock('firebase/auth', () => ({
  updatePassword: jest.fn(),
}));

// ImagePicker
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  requestMediaLibraryPermissionsAsync: jest
    .fn()
    .mockResolvedValue({ granted: true }),
  launchCameraAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
  launchImageLibraryAsync: jest
    .fn()
    .mockResolvedValue({ canceled: true, assets: [] }),
  MediaTypeOptions: { Images: 'Images' },
}));

// MapView
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockMap = (props: any) => <View>{props.children}</View>;
  const MockMarker = (props: any) => <View />;
  return {
    __esModule: true,
    default: MockMap,
    Marker: MockMarker,
  };
});

// LoadingScreen
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
const { updatePassword } = require('firebase/auth');

describe('DoctorProfileEdit', () => {
  const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

  let router: { back: jest.Mock };

  const baseProfile = {
    name: 'Dr. House',
    email: 'doctor@test.com',
    specialty: 'Cardiología',
    phone: '1234567890',
    photoURL: '',
    birthdate: '1990-01-01',
    location: {
      latitude: 19.4326,
      longitude: -99.1332,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    router = {
      back: jest.fn(),
    };

    mockUseRouter.mockReturnValue(router);

    mockedUseRoleGuard.mockReturnValue({
      loading: false,
      allowed: true,
    });

    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => baseProfile,
    });
  });

  afterAll(() => {
    alertSpy.mockRestore();
  });

  // Loading
  it('muestra pantalla de carga mientras se carga el perfil', () => {
    mockedUseRoleGuard.mockReturnValue({
      loading: true,
      allowed: true,
    });

    const { getByText } = render(<DoctorProfileEdit />);

    expect(getByText('Cargando perfil...')).toBeTruthy();
  });

  // Renderiza datos del doctor
  it('renderiza el formulario con los datos del doctor', async () => {
    const { getByText, getByPlaceholderText } = render(<DoctorProfileEdit />);

    await waitFor(() => {
      expect(getByText('Guardar cambios')).toBeTruthy();
    });

    expect(getByPlaceholderText('Nombre completo').props.value).toBe(
      baseProfile.name
    );
    expect(getByPlaceholderText('Correo electrónico').props.value).toBe(
      baseProfile.email
    );
    expect(getByPlaceholderText('Especialidad').props.value).toBe(
      baseProfile.specialty
    );
    expect(getByPlaceholderText('Teléfono').props.value).toBe(
      baseProfile.phone
    );
  });

  // Email inválido
  it('muestra error si el correo es inválido al guardar', async () => {
    const { getByText, getByPlaceholderText } = render(<DoctorProfileEdit />);

    await waitFor(() => {
      expect(getByText('Guardar cambios')).toBeTruthy();
    });

    fireEvent.changeText(
      getByPlaceholderText('Correo electrónico'),
      'correo-invalido'
    );

    fireEvent.press(getByText('Guardar cambios'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Correo electrónico no válido.'
      );
    });

    expect(updateDoc).not.toHaveBeenCalled();
  });

  // Teléfono inválido
  it('muestra error si el teléfono no tiene 10 dígitos', async () => {
    const { getByText, getByPlaceholderText } = render(<DoctorProfileEdit />);

    await waitFor(() => {
      expect(getByText('Guardar cambios')).toBeTruthy();
    });

    fireEvent.changeText(getByPlaceholderText('Teléfono'), '12345');

    fireEvent.press(getByText('Guardar cambios'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'El teléfono debe tener 10 dígitos numéricos.'
      );
    });

    expect(updateDoc).not.toHaveBeenCalled();
  });

  // Contraseña muy corta
  it('muestra error si la nueva contraseña es demasiado corta', async () => {
    const { getByText, getByPlaceholderText } = render(<DoctorProfileEdit />);

    await waitFor(() => {
      expect(getByText('Guardar cambios')).toBeTruthy();
    });

    fireEvent.changeText(
      getByPlaceholderText('Nueva contraseña'),
      '123'
    );
    fireEvent.changeText(
      getByPlaceholderText('Confirmar contraseña'),
      '123'
    );

    fireEvent.press(getByText('Guardar cambios'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'La contraseña debe tener al menos 6 caracteres.'
      );
    });

    expect(updateDoc).not.toHaveBeenCalled();
    expect(updatePassword).not.toHaveBeenCalled();
  });

  // Contraseñas no coinciden
  it('muestra error si las contraseñas no coinciden', async () => {
    const { getByText, getByPlaceholderText } = render(<DoctorProfileEdit />);

    await waitFor(() => {
      expect(getByText('Guardar cambios')).toBeTruthy();
    });

    fireEvent.changeText(
      getByPlaceholderText('Nueva contraseña'),
      '123456'
    );
    fireEvent.changeText(
      getByPlaceholderText('Confirmar contraseña'),
      '654321'
    );

    fireEvent.press(getByText('Guardar cambios'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Las contraseñas no coinciden.'
      );
    });

    expect(updateDoc).not.toHaveBeenCalled();
    expect(updatePassword).not.toHaveBeenCalled();
  });

  // Flujo feliz sin cambiar contraseña
  it('actualiza el perfil correctamente sin cambiar contraseña', async () => {
    const { getByText } = render(<DoctorProfileEdit />);

    await waitFor(() => {
      expect(getByText('Guardar cambios')).toBeTruthy();
    });

    fireEvent.press(getByText('Guardar cambios'));

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledTimes(1);
      expect(Alert.alert).toHaveBeenCalledWith(
        'Éxito',
        'Datos actualizados correctamente'
      );
      expect(router.back).toHaveBeenCalled();
    });

    expect(updatePassword).not.toHaveBeenCalled();

    const [refArg, payload] = (updateDoc as jest.Mock).mock.calls[0];
    expect(refArg).toEqual({ _path: 'doctors/doctor-123' });
    expect(payload.name).toBe(baseProfile.name);
    expect(payload.email).toBe(baseProfile.email);
    expect(payload.phone).toBe(baseProfile.phone);
  });

  // Flujo feliz cambiando contraseña
  it('actualiza el perfil y la contraseña cuando los datos son válidos', async () => {
    const { getByText, getByPlaceholderText } = render(<DoctorProfileEdit />);

    await waitFor(() => {
      expect(getByText('Guardar cambios')).toBeTruthy();
    });

    fireEvent.changeText(
      getByPlaceholderText('Nueva contraseña'),
      '123456'
    );
    fireEvent.changeText(
      getByPlaceholderText('Confirmar contraseña'),
      '123456'
    );

    fireEvent.press(getByText('Guardar cambios'));

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledTimes(1);
      expect(updatePassword).toHaveBeenCalledTimes(1);
      expect(Alert.alert).toHaveBeenCalledWith(
        'Éxito',
        'Datos actualizados correctamente'
      );
      expect(router.back).toHaveBeenCalled();
    });
  });
});
