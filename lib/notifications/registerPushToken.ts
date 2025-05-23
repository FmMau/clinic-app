import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { doc, setDoc } from 'firebase/firestore';
import { Platform } from 'react-native';
import { auth, db } from '../firebase/firebaseConfig';

export async function registerForPushNotificationsAsync() {
  console.log('🔁 Ejecutando registro de notificaciones...');

  let token: string | undefined;

  if (Device.isDevice) {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      console.log('🔍 Permiso actual:', existingStatus);

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log('📩 Nuevo permiso:', finalStatus);
      }

      if (finalStatus !== 'granted') {
        console.warn('❌ Permiso de notificaciones no concedido');
        return;
      }

      token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('📲 Token obtenido:', token);

      const uid = auth.currentUser?.uid;
      console.log('👤 UID actual:', uid);

      if (uid && token) {
        console.log('💾 Guardando token en Firestore...');
        await setDoc(doc(db, 'doctors', uid), { expoPushToken: token }, { merge: true });
        console.log('✅ Token guardado correctamente');
      } else {
        console.warn('⚠️ UID o token no disponibles, no se guardó');
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
        });
      }
    } catch (err) {
      console.error('🔥 Error en el registro de notificaciones:', err);
    }
  } else {
    alert('Las notificaciones push requieren un dispositivo físico.');
  }

  return token;
}
