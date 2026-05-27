export enum AppPhase {
  PROFILE = "profile",
  AI_CHAT = "ai_chat",
  GOOGLE_LOGIN = "google_login",
  PHONE_INPUT = "phone_input",
  LOADING = "loading",
  GUIDE_AND_CODE = "guide_and_code",
  SUCCESS = "success",
  QUEUE_FULL = "queue_full"
}

export interface AppConfig {
  firebase: {
    apiKey: string;
    authDomain: string;
    databaseURL: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
  };
  supportNumber: string;
  avatarUrl: string;
}
