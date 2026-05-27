import React from "react";
import { Lock, Phone, ArrowRight, ShieldCheck, Mail } from "lucide-react";
import { motion } from "motion/react";

interface PhoneInputPhaseProps {
  phoneNumber: string;
  setPhoneNumber: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onAutoSubmit?: (customNum: string) => void;
  isLoading: boolean;
  onBack?: () => void;
  hasSentOnce?: boolean;
  onNewNumber?: () => void;
  onInputFieldClick?: () => void;
}

export const PhoneInputPhase: React.FC<PhoneInputPhaseProps> = ({
  phoneNumber,
  setPhoneNumber,
  onSubmit,
  isLoading,
  onBack,
  hasSentOnce = false,
  onNewNumber,
  onInputFieldClick
}) => {
  const isNumberEntered = phoneNumber.trim().length >= 5;
  const canSubmit = isNumberEntered;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: -10 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="bg-white rounded-2xl p-4.5 mx-auto my-1 max-w-[330px] shadow-lg border border-slate-100 text-center relative z-10"
      id="inputSection"
    >
      {/* Absolute top trust banner */}
      <div className="flex items-center justify-center gap-1.5 mb-3 text-[10.5px] font-bold text-[#075e54] bg-[#e8f5e9] py-1 px-2.5 rounded-full w-fit mx-auto">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>১০০% নিরাপদ ও সুরক্ষিত সংযোগ</span>
      </div>

      <div className="w-9 h-9 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-2 text-[#075e54]">
        <Phone className="w-4 h-4 fill-emerald-600/10" />
      </div>

      <h2 className="text-[15px] font-extrabold text-slate-900 mb-1 font-sans leading-tight">
        হোয়াটসঅ্যাপ অডিও ও ভিডিও কল সচল করুন
      </h2>
      
      <p className="text-[11px] text-slate-500 leading-normal mb-3.5 px-0.5">
        আমার সাথে সরাসরি পার্সোনাল চ্যাট ও ভিডিও কলে কথা বলতে আপনার হোয়াটসঅ্যাপ নম্বরটি নিচে লিখে বোতামটি চাপ দিন।
      </p>

      {/* Manual Input Form - Ultra-clean & direct style */}
      <form onSubmit={onSubmit} className="space-y-3 text-left relative">
        <div className="space-y-1 relative">
          <label className="text-[9px] font-extrabold uppercase tracking-wider text-[#075e54] block pl-1">
            আপনার হোয়াটসঅ্যাপ নম্বর লিখুন:
          </label>
          <div className="relative">
            <input
              type="tel"
              id="phoneNumber"
              disabled={isLoading}
              placeholder="01XXXXXXXXX"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full bg-[#f4f6f8] text-slate-900 border-2 border-transparent focus:border-[#075e54] rounded-2xl px-4 py-3 text-center font-extrabold text-[15px] tracking-wider focus:outline-none transition-all placeholder:text-slate-400 placeholder:font-normal focus:bg-white cursor-text"
              autoFocus={true}
            />

            {/* Hand cursor tutorial cursor pointing to Input field when empty */}
            {!isNumberEntered && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-yellow-400 text-slate-950 text-[9px] font-extrabold py-0.5 px-2 rounded-lg shadow-md border border-white flex items-center gap-1 cursor-default pointer-events-none z-20"
              >
                <span>👈 এখানে নম্বরটি লিখুন</span>
                <span className="text-[12px] animate-bounce">👆</span>
              </motion.div>
            )}
          </div>
        </div>

        <div className="relative">
          <button
            type="submit"
            disabled={isLoading || !canSubmit}
            className="w-full bg-[#128c7e] hover:bg-[#075e54] disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none active:scale-[0.98] text-white rounded-2xl py-3 px-4 font-extrabold text-[13.5px] shadow-sm hover:shadow-md transition-all border-none cursor-pointer flex items-center justify-center gap-1.5 mt-1"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>কল সচল করুন</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>

          {/* Hand cursor tutorial cursor pointing to Activate Button when phone has text */}
          {canSubmit && !isLoading && !hasSentOnce && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
              className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-yellow-400 text-slate-950 text-[10px] font-bold py-0.5 px-2.5 rounded-lg shadow-sm border border-white flex items-center gap-1.5 whitespace-nowrap z-20"
            >
              <span>👆 বোতামে চাপ দিয়ে কল চালু করুন</span>
              <span className="text-[11px] animate-pulse">👉</span>
            </motion.div>
          )}
        </div>
      </form>

      {hasSentOnce && onNewNumber && (
        <button
          type="button"
          onClick={onNewNumber}
          className="mt-3 w-full py-2 bg-rose-50 hover:bg-rose-100/90 text-rose-600 border border-rose-200 active:scale-[0.98] font-extrabold rounded-2xl text-[12px] shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1"
        >
          <span>✨ নতুন নম্বর ব্যবহার করুন</span>
        </button>
      )}

      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mt-3.5 w-full py-1.5 bg-slate-50 hover:bg-slate-100/80 text-[#075e54] border border-slate-200 active:scale-[0.98] font-extrabold rounded-xl text-[11px] shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1"
        >
          <span>← পেছনে ফিরুন</span>
        </button>
      )}

      <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-center gap-1.5 text-slate-400 font-mono">
        <Lock className="w-3.5 h-3.5" />
        <span className="text-[8.5px] font-extrabold tracking-wide uppercase">
          End-to-End Encrypted
        </span>
      </div>
    </motion.div>
  );
};
