import { db } from "@/lib/firebase";
import { plainToScheduleEntry } from "@/types/adapters/PlainToScheduleEntry";
import { ScheduleEntry } from "@/types/scheduleEntry.types";
import { collection, getDoc, getDocs, query, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from "@react-native-firebase/firestore";
import { getAuth} from "@react-native-firebase/auth";

const getScheduleEntryCollection = () => {
  const currentUser = getAuth().currentUser;
  if (!currentUser) {
    throw new Error('User is not authenticated');
  }
  return collection(db, 'Users', currentUser.uid, 'ScheduleEntries');
};

export const getScheduleEntries = async (): Promise<ScheduleEntry[]> => {
  try {
    let q = query(getScheduleEntryCollection());
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => (plainToScheduleEntry({ id: doc.id, ...doc.data() })));
  } catch (error) {
    console.error("Error getting documents from scheduleEntryApi: ", error);
    throw error;
  }
}

export const getScheduleEntryById = async (args: { id: string }): Promise<ScheduleEntry> => {
  const { id } = args;
  try {
    const docRef = doc(getScheduleEntryCollection(), id);
    const snapshot = await getDoc(docRef);
    return plainToScheduleEntry({ id: snapshot.id, ...snapshot.data() });
  } catch (error) {
    console.error("Error getting document from scheduleEntryApi: ", error);
    throw error;
  }
}

export const addScheduleEntry = async (args: { data: Omit<ScheduleEntry, 'id' | 'completed'> }): Promise<string> => {
  const { data } = args;
  try {
    const docRef = await addDoc(getScheduleEntryCollection(), {
      ...data,
      completed: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding document in scheduleEntryApi: ", error);
    throw error;
  }
}


export const updateScheduleEntry = async (args: { id: string, data: Partial<ScheduleEntry> }): Promise<void> => {
  const { id, data } = args;
  try {
    const docRef = doc(getScheduleEntryCollection(), id);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error("Error updating document in scheduleEntryApi: ", error);
    throw error;
  }
}

export const deleteScheduleEntry = async (args: { id: string }): Promise<void> => {
  const { id } = args;
  try {
    const docRef = doc(getScheduleEntryCollection(), id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting document in scheduleEntryApi: ", error);
    throw error;
  }
}