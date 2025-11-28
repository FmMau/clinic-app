import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';
import RegisterScreen from '../app/auth/register';

jest.mock('@/lib/firebase/firebaseConfig', () => ({
  auth: {} as any,
  db: {} as any,
}));

// Mocks de Firebase Auth y Firestore
const mockCreateUserWithEmailAndPassword = jest.fn();
const mockSetDoc = jest.fn();
const mockDoc = jest.fn();

jest.mock('firebase/auth', () => {
  const actual = jest.requireActual('firebase/auth');
  return {
    ...actual,
    createUserWithEmailAndPassword: (...args: unknown[]) =>
      mockCreateUserWithEmailAndPassword(...args),
  };
});

jest.mock('firebase/firestore', () => {
  const actual = jest.requireActual('firebase/firestore');
  return {
    ...actual,
    doc: (...args: unknown[]) => mockDoc(...args),
    setDoc: (...args: unknown[]) => mockSetDoc(...args),
  };
});

// Mock de expo-router
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

describe('RegisterScreen', () => {
  let alertSpy: jest.SpyInstance;

  beforeAll(() => {
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    alertSpy.mockRestore();
  });

  const fillValidForm = (utils: ReturnType<typeof render>) => {
    const { getByPlaceholderText, getByText } = utils;

    fireEvent.changeText(getByPlaceholderText('Ingrese su nombre'), 'Juan');
    fireEvent.changeText(getByPlaceholderText('Ingrese su apellido'), 'Pérez');
    fireEvent.changeText(getByPlaceholderText('Ingrese su correo'), 'juan@test.com');
    fireEvent.changeText(getByPlaceholderText('Ingrese su contraseña'), '123456');
    fireEvent.changeText(getByPlaceholderText('Ingrese su confirmar contraseña'), '123456');
    fireEvent.changeText(getByPlaceholderText('Ingrese su teléfono'), '5512345678');
    fireEvent.changeText(getByPlaceholderText('Ingrese su curp'), 'CURP12345678901234');
    fireEvent.changeText(getByPlaceholderText('Ingrese su dirección'), 'Calle falsa 123');
    fireEvent.changeText(getByPlaceholderText('Ingrese alergias si hay'), 'Ninguna');

    // Seleccionar sexo
    fireEvent.press(getByText('Masculino'));

    // Abrir datepicker (el mock en jest.setup se encargará de llamar a onChange)
    fireEvent.press(getByText('Selecciona una fecha'));
  };

  it('muestra error si se presiona Registrar con el formulario vacío', () => {
    const utils = render(<RegisterScreen />);

    const registerButton = utils.getByText('Registrar');
    fireEvent.press(registerButton);

    expect(alertSpy).toHaveBeenCalledWith('Error', 'Nombre es requerido');
    expect(mockCreateUserWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it('muestra error si las contraseñas no coinciden', () => {
    const utils = render(<RegisterScreen />);

    const { getByPlaceholderText, getByText } = utils;

    fireEvent.changeText(getByPlaceholderText('Ingrese su nombre'), 'Juan');
    fireEvent.changeText(getByPlaceholderText('Ingrese su apellido'), 'Pérez');
    fireEvent.changeText(getByPlaceholderText('Ingrese su correo'), 'juan@test.com');
    fireEvent.changeText(getByPlaceholderText('Ingrese su contraseña'), '123456');
    fireEvent.changeText(getByPlaceholderText('Ingrese su confirmar contraseña'), '654321');

    const registerButton = getByText('Registrar');
    fireEvent.press(registerButton);

    expect(alertSpy).toHaveBeenCalledWith('Error', 'Las contraseñas no coinciden');
    expect(mockCreateUserWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it('registra correctamente cuando todos los datos son válidos', async () => {
    const utils = render(<RegisterScreen />);
    const { getByText } = utils;

    // Simular que Firebase Auth devuelve un usuario con uid
    mockCreateUserWithEmailAndPassword.mockResolvedValueOnce({
      user: { uid: 'test-uid' },
    });
    mockSetDoc.mockResolvedValueOnce(undefined);

    fillValidForm(utils);

    const registerButton = getByText('Registrar');
    fireEvent.press(registerButton);

    await waitFor(() => {
      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.any(Object),
        'juan@test.com',
        '123456'
      );
      expect(mockSetDoc).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  it('muestra alerta si createUserWithEmailAndPassword lanza error', async () => {
    const utils = render(<RegisterScreen />);
    const { getByText } = utils;

    mockCreateUserWithEmailAndPassword.mockRejectedValueOnce({
      message: 'Error de Firebase',
    });

    fillValidForm(utils);

    const registerButton = getByText('Registrar');
    fireEvent.press(registerButton);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error', 'Error de Firebase');
    });
  });
});