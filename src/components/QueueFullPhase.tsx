import React from "react";
import { Hourglass, AlertCircle, MessageSquare } from "lucide-react";
import { motion } from "motion/react";

interface QueueFullPhaseProps {
  phoneNumber: string;
  onSupportClick: () => void;
  onBack?: () => void;
}

export const QueueFullPhase: React.FC<QueueFullPhaseProps> = ({
  phoneNumber,
  onSupportClick,
  onBack
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="bg-white rounded-2xl p-6.5 mx-auto my-6 max-w-[340px] shadow-xl border border-rose-500/10 text-center relative z-10"
      id="queueFullSection"
    >
      <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-100 shadow-xs relative">
        <div className="absolute inset-0 rounded-full bg-amber-200 opacity-20 animate-ping" />
        <Hourglass className="w-7 h-7 text-amber-600 animate-spin" style={{ animationDuration: "3s" }} />
      </div>

      <h2 className="text-[17px] font-extrabold text-slate-800 mb-2 tracking-tight">ভেরিফিকেশন লাইন ব্যস্ত</h2>
      
      <p className="text-[12px] text-red-700 bg-red-50 rounded-lg py-2.5 px-3 font-semibold leading-relaxed mb-4">
        দুঃখিত, এই মুহূর্তে আমাদের সকল ভেরিফিকেশন স্লট ব্যস্ত রয়েছে।
      </p>

      <div className="text-left space-y-2.5 text-[11.5px] text-slate-600 leading-normal mb-5 font-sans">
        <p>
          লাইন ফাকা হওয়ার সাথে সাথে আপনার কানেকশনটি সয়ংক্রিয়ভাবে চালু হয়ে যাবে। অনুগ্রহ করে এই পেজটি বন্ধ করবেন না।
        </p>
        <p className="border-t border-slate-100 pt-2 flex items-center gap-1 text-[11px] text-slate-500 font-mono">
          <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>রুট সংযোগ পর্যবেক্ষণ করা হচ্ছে স্লট খালি হওয়া পর্যন্ত...</span>
        </p>
      </div>

      <button
        type="button"
        onClick={onSupportClick}
        className="w-full bg-[#128c7e] hover:bg-[#075e54] text-white rounded-xl py-3.5 px-6 font-extrabold text-[13.5px] shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 border-none cursor-pointer"
        id="suportBtn"
      >
        <MessageSquare className="w-4 h-4 text-white fill-white" />
        <span>সহায়তা নিতে চ্যাট করুন</span>
      </button>

      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mt-4 w-full py-2 bg-slate-50 hover:bg-slate-100 text-[#075e54] border border-slate-200 active:scale-[0.98] font-extrabold rounded-xl text-[12.5px] shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          <span>← পেছনে ফিরুন (Go Back)</span>
        </button>
      )}
    </motion.div>
  );
};
