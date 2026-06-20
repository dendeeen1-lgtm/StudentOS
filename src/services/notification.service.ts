import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { updateFCMToken } from './auth.service';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const registerForPushNotifications = async (
  uid: string
): Promise<string | null> => {
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'StudentOS',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3D2FA9',
    });
  }

  const tokenData = await Notifications.getExpoPushTokenAsync();
  const token = tokenData.data;
  await updateFCMToken(uid, token);
  return token;
};

export const sendPushToParents = async (
  studentUid: string,
  title: string,
  body: string
) => {
  // Get linked parents
  const studentSnap = await getDocs(
    query(collection(db, 'users'), where('__name__', '==', studentUid))
  );
  if (studentSnap.empty) return;

  const linkedParentUids: string[] = studentSnap.docs[0].data().linkedParentUids ?? [];
  if (linkedParentUids.length === 0) return;

  // Get parent FCM tokens
  const tokens: string[] = [];
  for (const parentUid of linkedParentUids) {
    const parentSnap = await getDocs(
      query(collection(db, 'users'), where('__name__', '==', parentUid))
    );
    if (!parentSnap.empty) {
      const token = parentSnap.docs[0].data().fcmToken;
      if (token) tokens.push(token);
    }
  }

  if (tokens.length === 0) return;

  // Send via Expo Push API
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(
      tokens.map((to) => ({ to, title, body, sound: 'default' }))
    ),
  });
};

export const sendPushToAdvisers = async (
  sectionId: string,
  title: string,
  body: string
) => {
  const snap = await getDocs(
    query(
      collection(db, 'users'),
      where('sectionId', '==', sectionId),
      where('role', 'in', ['adviser', 'monitor'])
    )
  );

  const tokens = snap.docs
    .map((d) => d.data().fcmToken)
    .filter(Boolean) as string[];

  if (tokens.length === 0) return;

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(
      tokens.map((to) => ({ to, title, body, sound: 'default' }))
    ),
  });
};

export const sendPushToStudent = async (
  studentUid: string,
  title: string,
  body: string
) => {
  const { getDocs, query, collection, where } = await import('firebase/firestore');
  const { db } = await import('./firebase');
  const snap = await getDocs(
    query(collection(db, 'users'), where('__name__', '==', studentUid))
  );
  if (snap.empty) return;
  const token = snap.docs[0].data().fcmToken;
  if (!token) return;
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: token, title, body, sound: 'default' }),
  });
};
