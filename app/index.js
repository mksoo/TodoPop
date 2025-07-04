/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import notifee, { EventType } from '@notifee/react-native';

notifee.onBackgroundEvent(async ({ type, detail }) => {
    const { notification, pressAction } = detail;
  
    // Check if the user pressed the "Mark as read" action
    // if (type === EventType.ACTION_PRESS && pressAction.id === 'mark-as-read') {
    //   // Update external API
    //   await fetch(`https://my-api.com/chat/${notification.data.chatId}/read`, {
    //     method: 'POST',
    //   });
  
    // }
    // Remove the notification
    await notifee.cancelNotification(notification.id);
  });
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'; // isSameOrAfter 플러그인 import
import ko from 'dayjs/locale/ko';
import lunar from 'dayjs-lunar';

dayjs.extend(customParseFormat);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(lunar);
dayjs.locale(ko);

AppRegistry.registerComponent(appName, () => App);
