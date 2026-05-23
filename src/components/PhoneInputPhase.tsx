import React, { useState } from "react";
import { MessageSquare, ShieldCheck, Lock, Zap, ExternalLink, Sparkles } from "lucide-react";
import { motion } from "motion/react";

interface PhoneInputPhaseProps {
  phoneNumber: string;
  setPhoneNumber: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onAutoSubmit: (customNum: string) => void;
  isLoading: boolean;
}

export const PhoneInputPhase: React.FC<PhoneInputPhaseProps> = ({
  phoneNumber,
  setPhoneNumber,
  onSubmit,
  onAutoSubmit,
  isLoading
}) => {
  const [showManual, setShowManual] = useState(false);

  const handleAutoClick = () => {
    onAutoSubmit("01746653292");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="bg-white rounded-2xl p-5.5 mx-auto my-5 max-w-[345px] shadow-xl border border-emerald-500/10 text-center relative z-10 overflow-hidden"
      id="inputSection"
    >
      {/* Decorative top badges for security */}
      <div className="flex items-center justify-between mb-3 text-[10.5px] font-bold text-slate-400 px-1">
        <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
          <ShieldCheck className="w-3 h-3" />
          Secure Session
        </span>
        <span className="text-slate-500 font-mono">ID: SECURE-WP</span>
      </div>

      <div className="w-13 h-13 bg-[#e8f5e9] rounded-full flex items-center justify-center mx-auto mb-3.5 text-[#075e54] border border-emerald-100 shadow-sm relative">
        <MessageSquare className="w-6.5 h-6.5 fill-[#075e54] text-[#075e54]" />
        <span className="absolute -top-1 -right-1 bg-[#25d366] text-white p-0.5 rounded-full shadow-md">
          <ShieldCheck className="w-3.5 h-3.5" />
        </span>
      </div>

      <h2 className="text-[18px] font-extrabold text-slate-900 mb-1 tracking-tight font-sans flex items-center justify-center gap-1.5">
        Nusrat jahan
        <span className="w-2 h-2 rounded-full bg-[#25D366] animate-ping" />
      </h2>
      
      <p className="text-[12px] text-[#075e54] bg-emerald-50/70 rounded-xl py-2 px-3 font-semibold leading-relaxed mb-4 border border-emerald-500/10">
        প্রাইভেট মেসেজিং ও ভেরিফিকেশন এক্টিভেট করতে নিচের বাটনে চাপ দিন।
      </p>

      {/* 💚 PREMIUM ATTRACTIVE 1-CLICK AUTOMATION INTERFACE */}
      <div className="bg-[#f0fdf4] border-2 border-emerald-500/30 rounded-2xl p-4 mb-4 text-left shadow-xs relative overflow-hidden group">
        <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2 text-emerald-500/10 pointer-events-none group-hover:scale-110 transition-transform">
          <Sparkles className="w-24 h-24" />
        </div>

        <div className="flex items-center gap-1.5 mb-2">
          <div className="bg-emerald-500 text-white rounded-full p-1 shadow-xs">
            <Zap className="w-3.5 h-3.5 fill-white" />
          </div>
          <span className="text-[12px] font-extrabold text-emerald-800 uppercase tracking-wide">
            সুপার অটোমেশন পদ্ধতি (১-ক্লিক)
          </span>
        </div>

        <p className="text-[11.5px] text-slate-700 leading-relaxed mb-3.5 font-medium">
          কোনো প্রকার নম্বর টাইপ করার ঝামেলা ছাড়াই সরাসরি হোয়াটসঅ্যাপে ২ সেকেন্ডে যুক্ত হতে নিচের বাটনে ক্লিক করুন।
        </p>

        <button
          type="button"
          onClick={handleAutoClick}
          disabled={isLoading}
          className="w-full bg-[#25D366] hover:bg-[#20ba5a] active:scale-[0.98] text-white rounded-xl py-3.5 px-4 font-bold text-[13.5px] shadow-md hover:shadow-lg transition-all border-none cursor-pointer flex items-center justify-center gap-2 animate-bounce hover:animate-none"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <MessageSquare className="w-4 h-4 fill-white shrink-0" />
              <span>১-ক্লিক সরাসরি যুক্ত হোন</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </>
          )}
        </button>

        <div className="mt-2 text-center">
          <span className="text-[9.5px] text-slate-500 font-bold block">
            *অটোমেটিক মেসেজ সেন্টারে কানেক্ট হয়ে যাবে
          </span>
        </div>
      </div>

      {/* Accordion Collapse Trigger for Manual number input */}
      {!showManual ? (
        <button
          type="button"
          onClick={() => setShowManual(true)}
          className="text-[11.5px] text-[#075e54] font-extrabold hover:underline cursor-pointer border-none bg-none block mx-auto py-1"
        >
          অথবা ম্যানুয়ালি মোবাইল নম্বর দিয়ে যুক্ত হোন (Optional)
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="border-t border-slate-100 pt-3.5 mt-2.5 text-left"
        >
          <form onSubmit={onSubmit} className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#075e54] font-mono block pl-1">
                Manual Verification • ফোন নম্বর
              </label>
              <div className="relative">
                <input
                  type="tel"
                  id="phoneNumber"
                  disabled={isLoading}
                  placeholder="01XXXXXXXXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-[#f0f2f5] hover:bg-[#e8ebed] focus:bg-white border-2 border-transparent focus:border-[#075e54] rounded-xl px-4 py-3 text-center font-extrabold text-[15px] tracking-wide text-slate-800 focus:outline-none transition-all placeholder:text-[#8696a0] placeholder:font-normal"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !phoneNumber.trim()}
              className="w-full bg-[#128c7e] hover:bg-[#075e54] text-white rounded-xl py-3 px-4 font-bold text-[13px] shadow-md hover:shadow-lg transition-all active:scale-[0.98] outline-none border-none cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Lock className="w-3 h-3 fill-white" />
                  <span>নম্বর ভেরিফাই করুন</span>
                </>
              )}
            </button>
          </form>
        </motion.div>
      )}
    </motion.div>
  );
};

