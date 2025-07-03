import notifee, { AuthorizationStatus } from '@notifee/react-native';

class PermissionService {
    async requestNotificationPermission(): Promise<boolean> {
        const settings = await notifee.requestPermission();

        if (settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED) {
            console.log('Notification permission granted');
            return true;
        } else {
            console.log('Notification permission denied');
            return false;
        }
    }
}

export default new PermissionService();