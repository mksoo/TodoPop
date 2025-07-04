import { PermissionsAndroid, Platform } from "react-native"
import { getMessaging } from '@react-native-firebase/messaging';

import auth from '@react-native-firebase/auth';
import { collection, doc, updateDoc, deleteField} from "@react-native-firebase/firestore";
import { db } from "@/lib/firebase";

class FCMService {
    requestUserPermission = async () => {
        if (Platform.OS === 'ios') {
            const authStatus = await messaging().requestPermission();
            const enabled =
              authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
              authStatus === messaging.AuthorizationStatus.PROVISIONAL;
            return enabled;
        } else if (Platform.OS === 'android') {
            PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            ]);
        }
    };

    // 특정 유저에게 푸시 메시지를 보내기 위한 토큰
    registerToken = () => {
        const messaging = getMessaging();
        messaging.getToken().then(this.saveToken);
        return messaging.onTokenRefresh(this.saveToken);
    }

    saveToken = async (fcmToken: string) => {
        const uid = auth().currentUser?.uid;
        const col = collection(db, 'Users');
        const docRef = doc(col, uid);
        await updateDoc(docRef, {fcmToken});
      };
    
    deRegisterToken = async () => {
    const userId = auth().currentUser?.uid;
    if (userId) {
        const uid = auth().currentUser?.uid;
        const col = collection(db, 'Users');
        const docRef = doc(col, uid);
        await updateDoc(docRef, {
        fcmToken: deleteField(),
        })
    }
    };
}

export default new FCMService();
