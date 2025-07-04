/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import dayjs from "dayjs";
import {initializeApp} from "firebase-admin/app";
import ko from "dayjs/locale/ko";

dayjs.locale(ko);

initializeApp();

export * from "./modules/scheduleEntries/scheduleEntries.functions";
export * from "./modules/notifications/notifications.functions";
