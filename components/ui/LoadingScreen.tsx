import { ActivityIndicator, Text, View } from 'react-native';

export default function LoadingScreen({ message = 'Cargando...' }: { message?: string }) {
  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#fff',
      padding: 20,
    }}>
      <ActivityIndicator size="large" color="#5A5CFF" />
      <Text style={{ marginTop: 12, fontSize: 16, color: '#333' }}>{message}</Text>
    </View>
  );
}