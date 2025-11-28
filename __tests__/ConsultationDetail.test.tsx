import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';
import ConsultationDetail from '../app/(tabs)/doctor/consultation/[id]';

// -------------------- MOCK FIREBASE CONFIG --------------------
const mockAuth = { currentUser: { uid: 'doctor-123' } } as any;
const mockDb = {} as any;

jest.mock('../lib/firebase/firebaseConfig', () => ({
  auth: mockAuth,
  db: mockDb,
}));

// -------------------- MOCK FIRESTORE --------------------
const mockGetDoc = jest.fn();

jest.mock('firebase/firestore', () => ({
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  doc: jest.fn((...args: unknown[]) => ({ _path: args })),
}));

// -------------------- MOCK ROUTER --------------------
const mockUseLocalSearchParams = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useLocalSearchParams: () => mockUseLocalSearchParams(),
}));

// -------------------- TESTS --------------------
describe('ConsultationDetail', () => {
  let alertSpy: jest.SpyInstance;

  beforeAll(() => {
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseLocalSearchParams.mockReturnValue({ id: 'patient-123' });

    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ name: 'Juan', lastname: 'Pérez' }),
    });

    mockAuth.currentUser = { uid: 'doctor-123' };
  });

  afterAll(() => {
    alertSpy.mockRestore();
  });

  it('muestra "Paciente no encontrado" cuando no hay patientId', async () => {
    mockUseLocalSearchParams.mockReturnValue({});

    const { getByText } = render(<ConsultationDetail />);

    await waitFor(() => {
      expect(getByText('Paciente no encontrado')).toBeTruthy();
    });

    expect(mockGetDoc).not.toHaveBeenCalled();
  });

  it('muestra el nombre completo del paciente cuando existe', async () => {
    const { getByText } = render(<ConsultationDetail />);

    await waitFor(() => {
      expect(getByText('Juan Pérez')).toBeTruthy();
      expect(getByText('ID: patient-123')).toBeTruthy();
    });
  });

  it('muestra error de falta de datos cuando se intenta guardar sin contexto válido', async () => {
    mockAuth.currentUser = null as any;

    const { getByText } = render(<ConsultationDetail />);

    await waitFor(() => {
      expect(getByText('Registrar diagnóstico')).toBeTruthy();
    });

    const saveButton = getByText('Guardar diagnóstico');
    fireEvent.press(saveButton);

    expect(alertSpy).toHaveBeenCalledWith(
      'Error',
      'Faltan datos del paciente o del doctor. Intenta volver a abrir la consulta.'
    );
  });
});
