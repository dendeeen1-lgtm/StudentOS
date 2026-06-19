import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

export const uploadExcuseLetter = async (
  localUri: string,
  studentUid: string,
  sessionId: string
): Promise<string> => {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const path = `excuse-letters/${studentUid}/${sessionId}_${Date.now()}.jpg`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob);
  return await getDownloadURL(storageRef);
};
