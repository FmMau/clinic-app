import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';
import LoginScreen from '../app/auth/login';

// Mocks de Firebase
const mockSignIn = jest.fn();
const mockResetPassword = jest.fn();

jest.mock('../lib/firebase/auth', () => ({
  signIn: (...args: unknown[]) => mockSignIn(...args),
  resetPassword: (...args: unknown[]) => mockResetPassword(...args),
}));

// Mocks de expo-router
const mockReplace = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
  }),
}));

jest.mock('expo-linking', () => ({
  openURL: jest.fn(),
}));

describe('LoginScreen', () => {
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

  const setup = () => {
    const utils = render(<LoginScreen />);

    const emailInput = utils.getByPlaceholderText('Correo electrónico');
    const passwordInput = utils.getByPlaceholderText('Contraseña');

    return { ...utils, emailInput, passwordInput };
  };

  it('muestra error si el correo es inválido', () => {
    const { emailInput, passwordInput, getAllByText } = setup();

    fireEvent.changeText(emailInput, 'correo-malo');
    fireEvent.changeText(passwordInput, '123456');

    const loginButton = getAllByText('Iniciar sesión')[1];
    fireEvent.press(loginButton);

    expect(alertSpy).toHaveBeenCalledWith('Error', 'Ingresa un correo válido');
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('llama a signIn si los datos son válidos', async () => {
    const { emailInput, passwordInput, getAllByText } = setup();

    mockSignIn.mockResolvedValueOnce({});

    fireEvent.changeText(emailInput, 'user@test.com');
    fireEvent.changeText(passwordInput, '123456');

    const loginButton = getAllByText('Iniciar sesión')[1];
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('user@test.com', '123456');
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  it('muestra error si signIn retorna user-not-found', async () => {
    const { emailInput, passwordInput, getAllByText } = setup();

    mockSignIn.mockRejectedValueOnce({ code: 'auth/user-not-found' });

    fireEvent.changeText(emailInput, 'user@test.com');
    fireEvent.changeText(passwordInput, '123456');

    const loginButton = getAllByText('Iniciar sesión')[1];
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error', 'Usuario no registrado');
    });
  });

  it('navega a registro cuando se toca el link', () => {
    const { getByText } = setup();

    const register = getByText('¿No tienes cuenta? Regístrate');
    fireEvent.press(register);

    expect(mockPush).toHaveBeenCalledWith('/auth/register');
  });
});
