import { DocumentData, DocumentSnapshot, Timestamp } from "firebase-admin/firestore";

export interface User {
    id: string;
    uid: string; // Firebase Authentication UID
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
    createdAt: Timestamp;
    fcmToken: string | null;
  } 

export const docToUser = (doc: DocumentSnapshot<DocumentData>): User => {
    const data = doc.data();
    return {
        id: doc.id,
        uid: data?.uid,
        displayName: data?.displayName,
        email: data?.email,
        photoURL: data?.photoURL,
        createdAt: data?.createdAt,
        fcmToken: data?.fcmToken,
    }
}