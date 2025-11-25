// jest.setup.js
import '@testing-library/jest-native/extend-expect';

// Timers fake para manejar setTimeout, etc.
jest.useFakeTimers();

// Mock de react-native-reanimated (recomendado por ellos)
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// Mock de expo-router (para que Tabs, Stack, useRouter, etc. no truene)
jest.mock('expo-router', () => {
  const React = require('react');
  const View = require('react-native').View;

  return {
    // Navegador
    useRouter: () => ({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
    }),
    useLocalSearchParams: () => ({}),
    useSegments: () => [],
    Stack: ({ children }) => <View>{children}</View>,
    Tabs: ({ children }) => <View>{children}</View>,
    Slot: ({ children }) => <View>{children}</View>,
    Link: ({ children }) => <View>{children}</View>,
  };
});

// Mock de AsyncStorage si lo usas
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock de tu firebaseConfig central
jest.mock('@/lib/firebase/firebaseConfig', () => {
  const authMock = {
    currentUser: null,
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn(),
    updateProfile: jest.fn(),
    updatePassword: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
  };

  const dbMock = {
    // puedes dejarlo vacío y mockear por test si usas getDoc, collection, etc.
  };

  const storageMock = {
    // mock de storage para imágenes, etc.
  };

  return {
    auth: authMock,
    db: dbMock,
    storage: storageMock,
  };
});
