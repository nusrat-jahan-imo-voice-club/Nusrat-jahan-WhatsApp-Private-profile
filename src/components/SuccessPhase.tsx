import React from "react";
import { CheckCircle2, MessageSquare, ShieldAlert } from "lucide-react";
import { motion } from "motion/react";

interface SuccessPhaseProps {
  onStartChat: () => void;
}

export const SuccessPhase: React.FC<SuccessPhaseProps> = ({ onStartChat }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="bg-white rounded-2xl p-7 mx-auto my-6 max-w-[340px] shadow-xl border border-emerald-500/10 text-center relative z-10"
      id="successSection"
    >
      <div className="w-16 h-16 bg-[#e8f5e9] rounded-full flex items-center justify-center mx-auto mb-5 border border-emerald-100 shadow-sm relative">
        <div className="absolute inset-0 rounded-full bg-emerald-300 opacity-20 animate-ping" />
        <CheckCircle2 className="w-10 h-10 text-[#075e54] fill-[#e8f5e9]" />
      </div>

      <h2 className="text-[19px] font-extrabold text-slate-800 mb-1.5 tracking-tight">ভেরিফিকেশন সফল হয়েছে</h2>
      
      <p className="text-[12.5px] text-[#075e54] bg-emerald-50 rounded-lg py-2 px-3.5 font-bold leading-relaxed mb-4">
        ডিভাইস নিবন্ধন সম্পন্ন হয়েছে।
      </p>

      <p className="text-[11.5px] text-[#667781] leading-relaxed mb-6 font-sans">
        Security handshake established. Your local communication endpoints are now authenticated successfully with Nusrat jahan.
      </p>

      <button
        type="button"
        onClick={onStartChat}
        className="w-full bg-[#128c7e] hover:bg-[#075e54] text-white rounded-xl py-3.5 px-6 font-extrabold text-[14.5px] shadow-md hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 border-none cursor-pointer"
        id="startBtn"
      >
        <MessageSquare className="w-4 h-4 text-white fill-white" />
        <span>চ্যাট শুরু করুন</span>
      </button>
    </motion.div>
  );
};
