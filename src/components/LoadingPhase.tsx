import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ShieldCheck, RefreshCw } from "lucide-react";

export const LoadingPhase: React.FC = () => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "নিরাপদ সংযোগ তৈরি হচ্ছে...",
      sub: "Please wait while we verify signatures and establish endpoints..."
    },
    {
      title: "Firebase সিঙ্ক সম্পন্ন হচ্ছে...",
      sub: "Synchronizing security keys with server routing nodes..."
    },
    {
      title: "অনুমোদন যাচাই করা হচ্ছে...",
      sub: "Allocating unique persistent session handshake vectors..."
    }
  ];

  useEffect(() => {
    const timer1 = setTimeout(() => setStep(1), 1600);
    const timer2 = setTimeout(() => setStep(2), 3200);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className="bg-white rounded-2xl p-7 mx-auto my-6 max-w-[340px] shadow-xl border border-emerald-500/10 text-center relative z-10"
      id="loadingSection"
    >
      <div className="relative w-16 h-16 mx-auto mb-6 flex items-center justify-center">
        {/* Outer glowing halo */}
        <div className="absolute inset-0 rounded-full bg-emerald-100/65 animate-ping" />
        {/* Spinner ring */}
        <div className="absolute inset-0 border-4 border-slate-100 border-t-[#075e54] rounded-full animate-spin" />
        <ShieldCheck className="w-7 h-7 text-[#075e54] animate-pulse relative z-10" />
      </div>

      <h2 className="text-[17px] font-extrabold text-slate-800 mb-2 tracking-tight transition-all duration-300">
        {steps[step].title}
      </h2>
      <p className="text-[11.5px] text-[#667781] leading-relaxed transition-all duration-300 font-sans">
        {steps[step].sub}
      </p>

      {/* Progress timeline dashes bar */}
      <div className="flex justify-center gap-1.5 mt-5">
        {[0, 1, 2].map((i) => (
          <div 
            key={i} 
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === step ? "w-6 bg-[#00a884]" : "w-1.5 bg-slate-200"
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
};
