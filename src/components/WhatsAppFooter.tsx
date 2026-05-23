import React from "react";
import { Plus, Send, Mic } from "lucide-react";

interface WhatsAppFooterProps {
  value: string;
  onChange: (val: string) => void;
  onSend: (text: string) => void;
  disabled?: boolean;
}

export const WhatsAppFooter: React.FC<WhatsAppFooterProps> = ({ 
  value,
  onChange,
  onSend,
  disabled = false
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !disabled) {
      onSend(value);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="bg-[#f0f2f5] min-h-[56px] border-t border-slate-200/50 px-4 py-2 flex items-center gap-3 shrink-0 select-none"
    >
      <button 
        type="button" 
        disabled={disabled}
        className="p-2 hover:bg-slate-200/80 text-[#54656f] rounded-full transition-colors active:scale-95"
      >
        <Plus className="w-6 h-6" />
      </button>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={disabled ? "মেসেজ লিখতে এখানে ক্লিক করুন (বুট ট্র্যাকার)..." : "Type a message / মেসেজ লিখুন..."}
        className="flex-1 bg-white h-[40px] rounded-full px-5 text-[#111] text-[14px] border border-slate-200 shadow-sm focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50"
      />

      <button 
        type="submit" 
        disabled={disabled || !value.trim()}
        className={`p-2 rounded-full transition-colors active:scale-95 ${
          value.trim() && !disabled
            ? "bg-[#00a884] text-white hover:bg-[#008f70]"
            : "hover:bg-slate-200/80 text-[#54656f]"
        }`}
      >
        {value.trim() ? (
          <Send className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </button>
    </form>
  );
};
