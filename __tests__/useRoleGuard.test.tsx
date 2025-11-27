import { useUserRole } from '@/lib/firebase/useUserRole';
import { render } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';
import { useRoleGuard } from '../hooks/useRoleGuard';

// Mock de useUserRole
jest.mock('@/lib/firebase/useUserRole', () => ({
  useUserRole: jest.fn(),
}));

// Mock de expo-router
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

const mockedUseUserRole = useUserRole as jest.MockedFunction<typeof useUserRole>;

// Componente de prueba que usa el hook
function TestComponent({ allowedRoles }: { allowedRoles: string[] }) {
  const { allowed, loading } = useRoleGuard(allowedRoles);

  return (
    <>
      <Text testID="allowed">{allowed ? 'true' : 'false'}</Text>
      <Text testID="loading">{loading ? 'true' : 'false'}</Text>
    </>
  );
}

describe('useRoleGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('devuelve allowed=true cuando el rol está permitido y no redirige', () => {
    mockedUseUserRole.mockReturnValue({
      role: 'doctor',
      loading: false,
    });

    const { getByTestId } = render(<TestComponent allowedRoles={['doctor']} />);

    expect(getByTestId('allowed').props.children).toBe('true');
    expect(getByTestId('loading').props.children).toBe('false');
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('redirige a la pestaña de paciente cuando el rol es paciente y no está permitido', () => {
    mockedUseUserRole.mockReturnValue({
      role: 'paciente',
      loading: false,
    });

    render(<TestComponent allowedRoles={['doctor']} />);

    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/patient');
  });

  it('redirige a la pestaña de doctor cuando el rol es doctor y no está permitido', () => {
    mockedUseUserRole.mockReturnValue({
      role: 'doctor',
      loading: false,
    });

    render(<TestComponent allowedRoles={['paciente']} />);

    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/doctor');
  });

  it('redirige a la pestaña de admin cuando el rol es admin y no está permitido', () => {
    mockedUseUserRole.mockReturnValue({
      role: 'admin',
      loading: false,
    });

    render(<TestComponent allowedRoles={['paciente']} />);

    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/admin');
  });

  it('redirige a /auth/login cuando el rol es desconocido y no está permitido', () => {
    mockedUseUserRole.mockReturnValue({
      role: 'otro-rol',
      loading: false,
    });

    render(<TestComponent allowedRoles={['doctor']} />);

    expect(mockReplace).toHaveBeenCalledWith('/auth/login');
  });

  it('no redirige mientras loading=true aunque el rol no esté permitido', () => {
    mockedUseUserRole.mockReturnValue({
      role: 'paciente',
      loading: true,
    });

    const { getByTestId } = render(<TestComponent allowedRoles={['doctor']} />);

    expect(getByTestId('loading').props.children).toBe('true');
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
