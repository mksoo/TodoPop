import { db } from "@/lib/firebase";
import { plainToScheduleEntry } from "@/types/adapters/PlainToScheduleEntry";
import { ScheduleEntry } from "@/types/scheduleEntry.types";
import { collection, getDoc, getDocs, query, doc, updateDoc, deleteDoc } from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";

const scheduleEntryCollection = (() => {
  const currentUser = auth().currentUser;
  if (!currentUser) {
    throw new Error('User is not authenticated');
  }
  return collection(db, 'Users', currentUser.uid, 'ScheduleEntries');
})();

export const getScheduleEntries = async (): Promise<ScheduleEntry[]> => {
  try {
    let q = query(scheduleEntryCollection);
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
    const docRef = doc(scheduleEntryCollection, id);
    const snapshot = await getDoc(docRef);
    return plainToScheduleEntry({ id: snapshot.id, ...snapshot.data() });
  } catch (error) {
    console.error("Error getting document from scheduleEntryApi: ", error);
    throw error;
  }
}

export const updateScheduleEntry = async (args: { id: string, data: Partial<ScheduleEntry> }): Promise<void> => {
  const { id, data } = args;
  try {
    const docRef = doc(scheduleEntryCollection, id);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error("Error updating document in scheduleEntryApi: ", error);
    throw error;
  }
}

export const deleteScheduleEntry = async (args: { id: string }): Promise<void> => {
  const { id } = args;
  try {
    const docRef = doc(scheduleEntryCollection, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting document in scheduleEntryApi: ", error);
    throw error;
  }
}