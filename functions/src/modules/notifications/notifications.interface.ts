import {DocumentSnapshot, Timestamp} from "firebase-admin/firestore";

export interface Notification {
  title: string;
  body: string;
  imageUrl: string;
  deepLink: string;
  novelId?: string; // legacy
  episodeId?: string; // legacy
  chatbotId?: string;
  createdAt?: Timestamp;
  inAppPush?: {
    inAppTitle: string;
    actionText?: string;
  };
  visible: boolean; // 알림함에 뜨는지 여부
  skipPush?: boolean;
}

export interface NotificationSetting {
  main: {
    update?: boolean;
    event?: boolean;
  };
  community: {
    newPost?: boolean;
    newComment?: boolean;
  };
  comment: {
    newComment?: boolean;
    newReply?: boolean;
    newLike?: boolean;
  };
  novel: {
    newComment?: boolean;
    newSubscription?: boolean;
  };
  characterUpdate: {
    newUpdate?: boolean;
    newVoice?: boolean;
    newNovel?: boolean;
  };
  misc: {
    recommendation?: boolean;
  };
  follow: {
    newFollow?: boolean;
  };
}

export const docToNotification = (doc: DocumentSnapshot) => {
  const ret: Notification = {
    title: doc.data()?.title ?? "",
    body: doc.data()?.body ?? "",
    imageUrl: doc.data()?.imageUrl ?? "",
    deepLink: doc.data()?.deepLink ?? "",
    createdAt: doc.data()?.createdAt,
    inAppPush: doc.data()?.inAppPush,
    chatbotId: doc.data()?.chatbotId,
    visible: doc.data()?.visible,
    skipPush: doc.data()?.skipPush,
  };

  return ret;
};

export const docToNotificationSetting = (doc: DocumentSnapshot) => {
  const ret: NotificationSetting = {
    main: doc.data()?.main,
    community: doc.data()?.community,
    comment: doc.data()?.comment,
    novel: doc.data()?.novel,
    characterUpdate: doc.data()?.characterUpdate,
    misc: doc.data()?.misc,
    follow: doc.data()?.follow,
  };

  return ret;
};

export type ChatbotFirstPublicAtPubSub = {
  chatbotId: string;
  uid: string;
  chatbotName: string;
  chatbotImageUrl: string;
};
