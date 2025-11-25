// jest.config.mjs
export default {
  preset: 'jest-expo',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|@react-navigation|@react-native-community|expo(nent)?|@expo(nent)?/.*|expo-router|@expo/vector-icons|react-native-.*|@react-native-.*)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1', // para tus imports con @/...
  },
  // si usas TypeScript:
  testMatch: ['**/__tests__/**/*.(test|spec).(js|jsx|ts|tsx)'],
};
