import { db } from "@/lib/firebase";
import { plainToScheduleEntry } from "@/types/adapters/PlainToScheduleEntry";
import { ScheduleEntry } from "@/types/scheduleEntry.types";
import { collection, getDoc, getDocs, query, doc } from "@react-native-firebase/firestore";

export const getScheduleEntries = async (args: { uid: string }): Promise<ScheduleEntry[]> => {
  const { uid } = args;
  const scheduleEntriesCollection = collection(db, 'Users', uid, 'ScheduleEntries');
  try {
    let q = query(scheduleEntriesCollection);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => (plainToScheduleEntry({ id: doc.id, ...doc.data() })));
  } catch (error) {
    console.error("Error getting documents from scheduleEntryApi: ", error);
    throw error;
  }
}

export const getScheduleEntryById = async (args: { id: string, uid: string }): Promise<ScheduleEntry> => {
  const { id, uid } = args;
  const scheduleEntriesCollection = collection(db, 'Users', uid, 'ScheduleEntries');
  try {
    const docRef = doc(scheduleEntriesCollection, id);
    const snapshot = await getDoc(docRef);
    return plainToScheduleEntry({ id: snapshot.id, ...snapshot.data() });
  } catch (error) {
    console.error("Error getting document from scheduleEntryApi: ", error);
    throw error;
  }
}