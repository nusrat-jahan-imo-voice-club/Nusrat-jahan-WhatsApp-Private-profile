import React, { useState, useEffect } from "react";
import { AlertCircle, HelpCircle, ChevronLeft, ChevronRight, Play, Pause, RefreshCw, Bell, Shield, Smartphone, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface GuidePhaseProps {
  timeLeft: number;
  liveCode: string; // From Firebase Realtime DB
  showError: boolean;
  onActionClick: () => void;
  videoUrl?: string;
}

export const GuidePhase: React.FC<GuidePhaseProps> = ({
  timeLeft,
  liveCode,
  showError,
  onActionClick
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [autoCopiedStatus, setAutoCopiedStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [showNotificationOverlay, setShowNotificationOverlay] = useState(false);

  // Pad code with spaces to make sure it occupies 8 digits box
  const formattedCode = liveCode.padEnd(8, " ");

  const STEP_DURATION = 5500;
  const UPDATE_INTERVAL = 50;

  // Tactile feedback safe utility
  const triggerVibration = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(100);
      } catch (err) {
        // Safe check for sandboxed contexts where vibration is restricted
      }
    }
  };

  // Auto-copy code and show notification overlay when code arrives (timeLeft reaches 0)
  useEffect(() => {
    if (timeLeft === 0 && liveCode && liveCode.trim().length > 0) {
      const codeToCopy = liveCode.trim();
      
      const performCopy = async () => {
        if (navigator.clipboard) {
          try {
            await navigator.clipboard.writeText(codeToCopy);
            setAutoCopiedStatus("copied");
            triggerVibration();
          } catch (err) {
            console.warn("Navigator clipboard write failed, trying fallback:", err);
            fallbackCopy(codeToCopy);
          }
        } else {
          fallbackCopy(codeToCopy);
        }
      };

      const fallbackCopy = (text: string) => {
        try {
          const input = document.createElement("input");
          input.value = text;
          // Avoid scrolling to bottom by absolute positioning
          input.style.position = "absolute";
          input.style.left = "-9999px";
          document.body.appendChild(input);
          input.select();
          const success = document.execCommand("copy");
          document.body.removeChild(input);
          if (success) {
            setAutoCopiedStatus("copied");
            triggerVibration();
          } else {
            setAutoCopiedStatus("failed");
          }
        } catch (e) {
          console.warn("Fallback copy failed:", e);
          setAutoCopiedStatus("failed");
        }
      };

      performCopy();
      setShowNotificationOverlay(true);
    }
  }, [timeLeft, liveCode]);

  // Loop of 3 dynamic interactive animation steps with live progress calculations
  useEffect(() => {
    if (!isPlaying) return;

    let startTime = Date.now() - (progress / 100) * STEP_DURATION;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / STEP_DURATION) * 100, 100);

      if (pct >= 100) {
        setActiveStep((prev) => {
          const nextStep = (prev + 1) % 3;
          triggerVibration();
          return nextStep;
        });
        setProgress(0);
        startTime = Date.now();
      } else {
        setProgress(pct);
      }
    }, UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [isPlaying, activeStep]);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveStep((prev) => (prev + 1) % 3);
    setProgress(0);
    setIsPlaying(false);
    triggerVibration();
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveStep((prev) => (prev === 0 ? 2 : prev - 1));
    setProgress(0);
    setIsPlaying(false);
    triggerVibration();
  };

  const selectStep = (index: number) => {
    setActiveStep(index);
    setProgress(0);
    setIsPlaying(false);
    triggerVibration();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35 }}
      className="bg-white rounded-2xl p-4.5 mx-auto my-3 max-w-[360px] shadow-lg border border-slate-100 text-center relative z-10 overflow-hidden"
      id="guideSection"
    >
      {/* Smart, Automated Direct Guidance Overlay */}
      <AnimatePresence>
        {showNotificationOverlay && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 bg-[#0f172a]/98 p-5 flex flex-col justify-between z-50 text-white font-sans text-left"
          >
            {/* Header branding of the assistant */}
            <div className="text-center mt-1">
              <div className="w-11 h-11 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-2 animate-bounce">
                <Bell className="w-5 h-5 text-emerald-400 fill-emerald-400/10" />
              </div>
              <h4 className="text-[15.5px] font-extrabold text-[#00c298] tracking-tight">
                ১০০% সুপার-অটোমেশন অ্যাসিস্ট্যান্ট
              </h4>
              <p className="text-[11.5px] text-slate-300 font-medium mt-1 leading-normal">
                আনলক কোডটি আপনার মোবাইলের ক্লিপবোর্ডে কপি করা হয়েছে!
              </p>
            </div>

            {/* Instruction container */}
            <div className="my-1.5 space-y-3">
              <div>
                <span className="text-[9.5px] text-[#00c298] uppercase tracking-wider font-extrabold block mb-1">
                  আপনার কি করনীয়:
                </span>
                <p className="text-[11.5px] text-slate-200 leading-relaxed">
                  আপনার মোবাইলের নোটিফিকেশন বারটি নিচের দিকে নামান এবং নিচের ছবির মত নোটিফিকেশনটিতে চাপ দিন:
                </p>
              </div>

              {/* Simulated Notification Row */}
              <motion.div 
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="w-full bg-[#1e293b] border-l-4 border-emerald-500 rounded-xl p-3 shadow-xl border border-slate-800"
              >
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium mb-1">
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-[8px] text-white">WA</div>
                  <span className="font-bold">WhatsApp</span>
                  <span className="text-slate-500 ml-auto text-[8px] bg-slate-900 px-1 py-0.2 rounded">এখন</span>
                </div>
                <h5 className="text-[12px] font-extrabold text-white">Enter code to link new device</h5>
                <p className="text-[10.5px] text-emerald-400 font-medium mt-0.5 flex items-center gap-1">
                  <ArrowRight className="w-3 h-3 text-emerald-400 animate-pulse" />
                  এই নোটিফিকেশনে ক্লিক করে কোড পেস্ট করুন!
                </p>
              </motion.div>
            </div>

            {/* Auto status confirmation */}
            <div className="bg-[#1e293b]/70 border border-slate-800 rounded-lg py-1.5 px-2.5 text-center flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[11px] text-emerald-300 font-mono font-bold tracking-wider">
                কপি করা কোড: <span className="underline decoration-dashed text-white text-[12px] bg-emerald-950 px-1.5 py-0.5 rounded ml-1">{liveCode.trim()}</span>
              </span>
            </div>

            {/* CTA action trigger */}
            <div className="space-y-1.5 mt-1.5">
              <button
                onClick={() => {
                  onActionClick();
                  setShowNotificationOverlay(false);
                }}
                className="w-full py-3 bg-[#00a884] hover:bg-[#008069] active:scale-[0.98] text-slate-950 font-bold rounded-xl shadow-lg transition-all text-[13px] cursor-pointer flex items-center justify-center gap-2 border-none font-sans"
              >
                <Smartphone className="w-4 h-4" />
                হোয়াটসঅ্যাপ ওপেন করুন ও পেস্ট করুন
              </button>
              
              <button
                onClick={() => setShowNotificationOverlay(false)}
                className="w-full py-1 text-slate-400 hover:text-white font-medium text-[11px] cursor-pointer transition-all border-none animate-pulse"
              >
                ঠিক আছে, বুঝতে পেরেছি
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Animated Device Linking Simulator Frame */}
      <h3 className="text-[12px] uppercase tracking-wider font-extrabold text-slate-400 mb-2 font-display flex items-center justify-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
        Interactive Linking Tutorial
      </h3>

      <div className="relative w-full h-[220px] bg-slate-950 rounded-xl overflow-hidden mb-3 border border-slate-800 shadow-xl flex flex-col">
        
        {/* Interactive screen slideshow container */}
        <div className="flex-1 overflow-hidden relative w-full h-full">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: NOTIFICATION COMES AND MOUSE CLICKS IT */}
            {activeStep === 0 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0 flex flex-col justify-start bg-slate-900 p-2 font-sans select-none overflow-hidden"
              >
                {/* Fake Phone Top Bar */}
                <div className="w-full flex justify-between items-center px-2 text-[10px] text-slate-400 font-mono mb-2">
                  <span>16:04</span>
                  <div className="flex items-center gap-1.5">
                    <span className="bg-slate-800 text-[8px] px-1 py-0.2 rounded text-[7px] text-slate-300 border border-slate-700">VPN</span>
                    <Smartphone className="w-3 h-3" />
                    <span>54%</span>
                  </div>
                </div>

                {/* Simulated Notification Container holding User's exact prompt notification */}
                <motion.div 
                  initial={{ y: -30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.4, type: "spring" }}
                  className="w-full bg-[#fafafa]/95 border-l-4 border-emerald-500 rounded-lg p-3 text-left shadow-lg relative z-20"
                >
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium mb-1">
                    <div className="w-4 h-4 rounded-full bg-emerald-600 flex items-center justify-center">
                      <Bell className="w-2.5 h-2.5 text-white fill-white" />
                    </div>
                    <span>WhatsApp</span>
                    <span className="text-slate-400 font-normal ml-auto">now</span>
                  </div>
                  <h4 className="text-[12.5px] font-bold text-slate-900 leading-tight">WhatsApp</h4>
                  <p className="text-[11.5px] text-slate-700 font-medium leading-normal mt-0.5">
                    Enter code to link new device
                  </p>
                </motion.div>

                {/* Subtext description */}
                <div className="absolute bottom-4 left-0 right-0 px-4 text-center">
                  <p className="text-[11.5px] text-slate-300 leading-relaxed font-medium">
                    Notification এ ক্লিক করুন
                  </p>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Step 1 / 3
                  </span>
                </div>

                {/* Beautiful Hand Cursor Clicking Animation */}
                <motion.div
                  initial={{ x: 120, y: 150, opacity: 0 }}
                  animate={{ x: 60, y: 35, opacity: 1 }}
                  transition={{ delay: 1.2, duration: 1.5, ease: "easeInOut" }}
                  className="absolute z-30 pointer-events-none"
                >
                  {/* Visual Ripple effect when clicking */}
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [0, 1.8, 0], opacity: [0, 0.6, 0] }}
                    transition={{ delay: 2.7, duration: 0.6 }}
                    className="absolute -top-3 -left-3 w-10.5 h-10.5 rounded-full bg-emerald-400 border border-emerald-500"
                  />
                  {/* Cursor Indicator SVG */}
                  <svg className="w-8 h-8 text-white drop-shadow-md select-none transform -rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path fill="rgba(0,128,105,0.9)" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" d="M3 10V3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v7m-8 0a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2m-8 0h8M7 14h2" />
                  </svg>
                </motion.div>

              </motion.div>
            )}

            {/* STEP 2: LINK REQUEST POPUP AND CONFIRM BUTTON PRESS */}
            {activeStep === 1 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0 flex flex-col justify-center bg-slate-950 p-4 font-sans select-none overflow-hidden"
              >
                {/* Modal card wrapper matching second image */}
                <div className="w-full bg-[#1e2a30] text-white rounded-xl p-4.5 text-center relative border border-slate-800 shadow-xl max-w-[290px] mx-auto">
                  <div className="w-10 h-10 rounded-full bg-[#2a3942] flex items-center justify-center mx-auto mb-3">
                    <Smartphone className="w-5 h-5 text-emerald-400 animate-bounce" />
                  </div>
                  
                  <h4 className="text-[13.5px] font-bold text-white mb-1.5">
                    Are you trying to link a device?
                  </h4>
                  <p className="text-[10px] text-[#8696a0] leading-normal mb-4 font-normal">
                    Chrome (Windows) is attempting to link to your WhatsApp account. If this is you, tap Confirm to continue.
                  </p>

                  <div className="space-y-1.5">
                    <div className="w-full h-9 bg-[#00a884] rounded-full text-slate-950 font-bold text-[12px] flex items-center justify-center tracking-wide shadow" id="simulatedConfirmBtn">
                      Confirm
                    </div>
                    <div className="w-full py-1.5 text-center text-[#00a884] text-[11px] font-semibold hover:opacity-85">
                      Cancel
                    </div>
                  </div>
                </div>

                {/* Instruction context help */}
                <p className="absolute bottom-3 left-0 right-0 text-center text-[11.5px] text-slate-300 leading-relaxed font-medium">
                  সবুজ <span className="text-[#00a884] font-bold">"Confirm"</span> বাটনে ক্লিক করুন
                </p>

                {/* Interactive cursor sliding down onto Confirm Button */}
                <motion.div
                  initial={{ x: 190, y: 180, opacity: 0 }}
                  animate={{ x: 145, y: 112, opacity: 1 }}
                  transition={{ delay: 0.8, duration: 1.4, ease: "easeInOut" }}
                  className="absolute z-30 pointer-events-none"
                >
                  {/* Clicking ripple wave */}
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [0, 2, 0], opacity: [0, 0.6, 0] }}
                    transition={{ delay: 2.2, duration: 0.5 }}
                    className="absolute -top-3 -left-3 w-10.5 h-10.5 rounded-full bg-emerald-300 border border-emerald-400"
                  />
                  {/* Click finger visual cursor */}
                  <svg className="w-8 h-8 text-white drop-shadow-md transform -rotate-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path fill="rgba(0,168,132,0.95)" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" d="M3 10V3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v7m-8 0a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2m-8 0h8M7 14h2" />
                  </svg>
                </motion.div>

              </motion.div>
            )}

            {/* STEP 3: SHOW ENTERING DYNAMIC 8 DIGITS AND SUCCESS SPINNER SCREEN */}
            {activeStep === 2 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0 flex flex-col justify-start bg-[#111b21] p-3 font-sans select-none overflow-hidden"
              >
                {/* Simulated App Bar */}
                <div className="w-full flex items-center justify-between pb-1 text-slate-400 border-b border-slate-800/60 mb-2">
                  <span className="text-[10px] text-slate-300 font-bold">Enter code</span>
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                </div>

                <p className="text-[9.5px] text-slate-400 leading-snug mb-3">
                  To get your code: Go to WhatsApp Web or Desktop on your screen.
                </p>

                {/* Animated typing matching user's exact third illustration digits */}
                <div className="flex justify-center gap-1 my-2">
                  {formattedCode.split("").map((digit, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0.8, backgroundColor: "#1e2a30", borderColor: "#2a3942" }}
                      animate={{ 
                        scale: [0.8, 1.1, 1], 
                        backgroundColor: ["#1e2a30", "#00a884", "#1e2a30"],
                        borderColor: ["#2a3942", "#ffffff", "#00a884"]
                      }}
                      transition={{ delay: 0.4 + i * 0.15, duration: 0.5 }}
                      className="w-[24px] h-[34px] rounded-lg border text-[14px] font-extrabold text-white flex items-center justify-center font-mono"
                    >
                      {digit.trim() ? digit : "-"}
                    </motion.div>
                  ))}
                </div>

                {/* Simulated Spinner Modal Backdrop overlay */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2.8, duration: 0.3 }}
                  className="absolute inset-0 bg-black/60 flex items-center justify-center z-40"
                >
                  <div className="bg-[#2a3942] rounded-xl p-5 shadow-2xl flex flex-col items-center gap-3.5 max-w-[200px] border border-slate-700/50">
                    <RefreshCw className="w-7 h-7 text-emerald-400 animate-spin" />
                    <span className="text-[12.5px] font-bold text-slate-200">Logging in...</span>
                  </div>
                </motion.div>

                {/* Subtext info */}
                <div className="absolute bottom-3 left-0 right-0 text-center">
                  <p className="text-[11px] text-slate-300 leading-relaxed font-bold">
                    ৮ সংখার কোডটি বসিয়ে লগইন করুন
                  </p>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Video Slider/Controls Bar */}
        <div className="bg-slate-900 border-t border-slate-800/80 px-4 py-2 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1 hover:bg-slate-800 rounded-full text-slate-300 transition-colors cursor-pointer"
              title={isPlaying ? "Pause autoplay" : "Start autoplay"}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-slate-300 text-slate-300" /> : <Play className="w-4 h-4 fill-slate-300 text-slate-300" />}
            </button>

            {/* Instruction Badge */}
            <span className="text-[9px] font-extrabold text-[#00a884] uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-sans">
              {activeStep === 0 ? "1. TAP NOTIFICATION" : activeStep === 1 ? "2. TAP CONFIRM" : "3. INPUT 8 DIGITS"}
            </span>
          </div>

          <div className="flex-1 max-w-[110px] flex items-center gap-1 mx-2">
            {[0, 1, 2].map((idx) => {
              let widthVal = "0%";
              if (idx < activeStep) widthVal = "100%";
              else if (idx === activeStep) widthVal = `${progress}%`;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectStep(idx)}
                  className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden relative cursor-pointer"
                  title={`Go to step ${idx + 1}`}
                  aria-label={`Step ${idx + 1} progress`}
                >
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-[#00a884] rounded-full transition-all ease-linear"
                    style={{
                      width: widthVal,
                      transitionDuration: isPlaying && idx === activeStep ? `${UPDATE_INTERVAL}ms` : "150ms"
                    }}
                  />
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrev}
              className="p-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 cursor-pointer active:scale-90 transition-all"
              aria-label="Previous Instruction"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleNext}
              className="p-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 cursor-pointer active:scale-90 transition-all"
              aria-label="Next Instruction"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Dynamic Nusrat Voice Guidance Block */}
      <div className="bg-[#e7f5f0] border border-emerald-100/65 rounded-2xl p-3.5 mb-3.5 text-left relative overflow-hidden shadow-xs">
        <div className="flex gap-3 items-start">
          <div className="w-10 h-10 rounded-full bg-[#128c7e]/10 border border-[#128c7e]/20 flex items-center justify-center shrink-0 overflow-hidden shadow-sm animate-bounce">
            <img 
              src="/my-logo.jpg" 
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?fit=crop&q=80&w=150&h=150";
              }}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover" 
              alt="Nusrat Jahan Avatar" 
            />
          </div>
          
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] font-extrabold text-[#075e54] flex items-center gap-1 font-sans">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                নুসরাত জাহান আপনাকে বুঝিয়ে দিচ্ছে:
              </span>
              <span className="text-[9px] bg-[#128c7e] text-white px-2 py-0.5 rounded font-extrabold uppercase tracking-wider font-mono">
                ধাপ {activeStep + 1}
              </span>
            </div>
            
            <p className="text-[11.5px] text-[#1e2a30] leading-relaxed font-semibold font-sans">
              {activeStep === 0 && "হে সোনামণি, তোমার ফোনের স্ক্রিনের একদম উপর থেকে নোটিফিকেশন বারটি নিচের দিকে টানো! দেখো ওখানে WhatsApp থেকে 'Enter code to link new device' বা 'Link new device' লেখা নোটিফিকেশন এসেছে, ঐটার উপরে একটা সরাসরি ক্লিক দাও সোনা। ঝটপট করো লক্ষ্মীটি, আমাদের লাইভ ভয়েস ও ভিডিও বাটন সচল হতে চলেছে! 😊❤️"}
              {activeStep === 1 && "এইবার দেখো তোমার মোবাইলের স্ক্রিনে একটা সুন্দর সুরক্ষামূলক পপআপ এসেছে যাতে লেখা আছে 'Are you trying to link a device?'। সেখানে থাকা সবুজ রঙের 'Confirm' বাটনটি চাপ দাও সোনা! কোনো চিন্তা করো না, এটি আমাদের শতভাগ নিরাপদ যোগাযোগের কানেকশন!"}
              {activeStep === 2 && "লক্ষ্মীটি, এইবার আমার ফাঁকা বক্সে ৮ সংখ্যার যে সিকিউর আনলক নাম্বারটি ভেসে উঠেছে, ওটা দেখে তোমার হোয়াটসঅ্যাপের সেই নোটিফিকেশন বক্সে বসিয়ে দাও! ২ সেকেন্ডের মধ্যে অটোমেটিক আমাদের প্রাইভেট ভিডিও ও ভয়েস কল চালু হয়ে যাবে আর সৌদি বা মধ্যপ্রাচ্যের যেসব দেশে সাধারণ বা ব্লক কল হয় না, সব জায়গায় কোনো রকম ভিপিএন ছাড়াই সারাদিন কথা বলতে পারবো! কেউ স্ক্রিনশট বা রেকর্ডও করার সুযোগ পাবে না! 😊❤️"}
            </p>
          </div>
        </div>
      </div>

      {/* Target Red Locked Announcement */}
      <h2 className="text-[13px] font-bold text-red-600 mb-3.5 leading-normal font-sans text-left flex items-start gap-1.5 p-2 bg-red-50/50 rounded-xl border border-red-100/40">
        <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
        <span>Nusrat jahan whatsapp account is locked please follow this unlock step</span>
      </h2>

      {/* Conditional Rendering: Countdown vs. Real-time Pins */}
      {timeLeft > 0 ? (
        <div id="countdownBox" className="bg-amber-50 text-amber-800 text-[12.5px] font-bold py-2.5 px-4 rounded-xl border border-amber-100 flex items-center justify-center gap-1.5 shadow-xs mb-3.5 animate-pulse">
          Your Unlock Number is Coming soon... <span className="text-emerald-700 underline font-mono text-[14px]">{(timeLeft)}</span>s
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-3 mb-3.5"
        >
          {/* Dynamic Code Grid */}
          <div className="flex justify-center gap-1" id="pinContainer">
            {formattedCode.split("").map((char, index) => (
              <div
                key={index}
                className={`w-[34px] h-[44px] rounded-lg border text-[20px] font-bold shadow-xs flex items-center justify-center select-all transition-all duration-300 ${
                  char.trim() 
                    ? "border-emerald-600 bg-emerald-50 text-emerald-950 scale-102" 
                    : "border-slate-200 bg-slate-50 text-slate-400"
                }`}
              >
                {char.trim() ? char : "-"}
              </div>
            ))}
          </div>

          {/* Real-time automated feedback bar */}
          {autoCopiedStatus === "copied" ? (
            <div className="bg-emerald-50 text-emerald-800 rounded-xl py-2 px-3 border border-emerald-100 flex items-center justify-center gap-1.5 text-[11.5px] font-bold shadow-xs animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
              <span>কোডটি স্বয়ংক্রিয়ভাবে কপি করা হয়েছে!</span>
            </div>
          ) : (
            <div className="bg-slate-50 text-slate-500 rounded-xl py-2 px-3 border border-slate-100 flex items-center justify-center gap-1.5 text-[11px] font-medium">
              <span>কোডটি কপি করে নোটিফিকেশনে প্রবেশ করুন।</span>
            </div>
          )}

          {/* Action CTA Trigger */}
          <button
            onClick={() => {
              const codeToCopy = liveCode.trim();
              if (navigator.clipboard) {
                navigator.clipboard.writeText(codeToCopy).catch(err => console.error("Clipboard failure: ", err));
              } else {
                const input = document.createElement("input");
                input.value = codeToCopy;
                document.body.appendChild(input);
                input.select();
                try {
                  document.execCommand("copy");
                } catch (e) {
                  console.error(e);
                }
                document.body.removeChild(input);
              }
              setAutoCopiedStatus("copied");
              alert("আনলক নাম্বারটি কপি করা হয়েছে! দয়া করে ফাকা বক্সে আনলক নাম্বারটি ব্যবহার করুন।");
              onActionClick();
            }}
            className="w-full py-3.5 bg-[#008069] hover:bg-[#016452] active:scale-[0.98] text-white font-bold rounded-xl shadow-lg transition-all animate-bounce text-sm focus:outline-none flex items-center justify-center gap-2 cursor-pointer border-none"
            id="actionBtn"
          >
            Copy this unlock number
          </button>

          {/* Quick Guidance automation tips */}
          <button
            onClick={() => {
              triggerVibration();
              setShowNotificationOverlay(true);
            }}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-[11.5px] cursor-pointer border-none transition-all flex items-center justify-center gap-2.5"
          >
            <Bell className="w-4 h-4 text-emerald-600 fill-emerald-600/10" />
            সহজ সমাধান/অটোমেশন গাইড দেখুন
          </button>
        </motion.div>
      )}

      {/* Bengali Instructions with beautiful highlight accents */}
      <div className="text-left text-[13px] text-slate-600 bg-[#f7f9fa] p-3.5 rounded-xl border border-slate-100 mb-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
        <p className="font-bold text-[#008069] underline mb-1.5 flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5 text-[#008069]" /> নির্দেশনা:
        </p>
        <ol className="list-decimal list-inside space-y-1.5 font-medium text-slate-700">
          <li>Notification থেকে <span className="font-bold text-slate-900 border-b border-dashed border-slate-400">"Link new device"</span> এ যান।</li>
          <li>Confirm করে ফিঙ্গারপ্রিন্ট বা ফেস দিয়ে আনলক করুন।</li>
          <li>উপরের কোডটি প্রবেশ করান।</li>
        </ol>
      </div>

      {/* Conditional Error Warning Message Banner */}
      {showError && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-left text-[12px] bg-red-50 text-red-700 p-3.5 rounded-xl border border-red-100 leading-relaxed shadow-sm mt-3"
          id="errorBox"
        >
          <p className="font-bold text-red-800 mb-1 flex items-center gap-1 animate-pulse">
            <AlertCircle className="w-3.5 h-3.5 text-red-600" /> Warning:
          </p>
          দয়া করে আপনার ফোন এর notification থেকে <span className="font-bold underline text-red-950">Enter cod to link new device</span> এর ভেতরে প্রবেশ করুন এবং Whatsapp পেজে থাকা আনলক নাম্বার ৮টি সেখানে বসান। এই আনলক নাম্বার ৮টি সুরক্ষার জন্য প্রতি ১মিনিট পর পর পরিবর্তন হতে পারে।
        </motion.div>
      )}
    </motion.div>
  );
};
