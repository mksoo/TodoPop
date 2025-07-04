import { useLinkTo } from "@react-navigation/native"
import { useCallback, useEffect } from "react";

import { getMessaging } from '@react-native-firebase/messaging'

const useDeeplink = () => {
    const linkTo = useLinkTo();

    const handlePushMessage = useCallback(async (remoteMessage: any) => {
        const url = remoteMessage?.data?.deepLink;

        console.log('remoteMessage', remoteMessage);

        if (!url) {
            return;
        }

        linkTo(url);
    }, []);

    useEffect(() => {
        getMessaging().getInitialNotification().then(handlePushMessage);
        getMessaging().onNotificationOpenedApp(handlePushMessage);
    }, []);
};

export default useDeeplink;