// jest.setup.js
import '@testing-library/jest-native/extend-expect';

// ❌ Quita esto si lo tienes, para evitar broncas de timers
// jest.useFakeTimers();

// Mock recomendado para react-native-reanimated (documentación oficial)
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// 🔹 Mock de @expo/vector-icons para evitar el warning de Icon / act(...)
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  // Devolvemos componentes tontos que solo renderizan un <Text />
  const MockIcon = ({ name }) => <Text>{name}</Text>;

  return {
    // Solo necesitas lo que usas en tu código
    FontAwesome6: MockIcon,
  };
});
jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');

  return ({ onChange, value }) => {
    React.useEffect(() => {
      if (onChange) {
        const date = value || new Date();
        onChange({}, date);
      }
    }, [onChange, value]);

    return null; // no renderiza nada visible en los tests
  };
});
// jest.setup.js (fragmento relevante)
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  const MockIcon = ({ name }) => <Text>{name}</Text>;

  return {
    FontAwesome6: MockIcon,
    Ionicons: MockIcon,
  };
});
