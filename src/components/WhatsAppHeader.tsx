import React, { useState } from "react";
import { ArrowLeft, Video, Phone, MoreVertical } from "lucide-react";

interface WhatsAppHeaderProps {
  avatarUrl?: string;
  name?: string;
  subtitle?: string;
  onBack?: () => void;
  isTyping?: boolean;
  onCallClick?: () => void;
}

export const WhatsAppHeader: React.FC<WhatsAppHeaderProps> = ({
  avatarUrl = "/my-logo.jpg",
  name = "Nusrat jahan",
  subtitle = "Message yourself",
  onBack,
  isTyping = false,
  onCallClick
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="bg-[#075e54] h-[60px] flex items-center px-4 shadow-md z-30 shrink-0 w-full select-none relative">
      <div className="flex items-center gap-2.5 text-white w-full">
        <button 
          onClick={onBack}
          className="p-1 hover:bg-[#004d40] rounded-full transition-colors active:scale-95 focus:outline-none cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden relative border border-white/20 shadow-inner flex items-center justify-center shrink-0">
          <img 
            src={avatarUrl} 
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?fit=crop&q=80&w=150&h=150";
            }}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover" 
            alt="Profile Avatar" 
          />
        </div>

        <div className="flex-1 flex flex-col justify-center leading-tight ml-0.5">
          <h1 className="text-[15.5px] font-bold tracking-wide text-white font-sans">{name}</h1>
          {isTyping ? (
            <div className="flex items-center gap-1 text-[11px] text-[#25d366] font-bold font-sans">
              <span>typing</span>
              <span className="flex gap-0.5 mt-1">
                <span className="w-1 h-1 rounded-full bg-[#25d366] animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1 h-1 rounded-full bg-[#25d366] animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1 h-1 rounded-full bg-[#25d366] animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-emerald-100/90 font-medium font-sans">{subtitle}</span>
          )}
        </div>

        <div className="flex items-center gap-2.5 text-white pr-0.5 relative">
          <button 
            onClick={onCallClick}
            className="p-1.5 hover:bg-[#004d40] rounded-full transition-colors active:scale-95 focus:outline-none cursor-pointer" 
            aria-label="Video Call"
          >
            <Video className="w-[18px] h-[18px] text-white" />
          </button>
          <button 
            onClick={onCallClick}
            className="p-1.5 hover:bg-[#004d40] rounded-full transition-colors active:scale-95 focus:outline-none cursor-pointer" 
            aria-label="Voice Call"
          >
            <Phone className="w-[15px] h-[15px] text-white fill-white" />
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setShowDropdown((prev) => !prev)}
              className="p-1.5 hover:bg-[#004d40] rounded-full transition-colors active:scale-95 focus:outline-none cursor-pointer" 
              aria-label="More Settings"
              id="headerDropdownBtn"
            >
              <MoreVertical className="w-4 h-4 text-white" />
            </button>

            {/* Premium dropdown list mimicking native android dropdown overlay style */}
            {showDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowDropdown(false)} 
                />
                <div 
                  className="absolute right-1 top-9 bg-white text-slate-800 rounded-lg shadow-xl border border-slate-100 py-1.5 w-[140px] z-50 animate-in fade-in slide-in-from-top-2 duration-120"
                  id="adminDropdownMenu"
                >
                  <button
                    onClick={() => setShowDropdown(false)}
                    className="w-full px-4 py-2.5 text-left text-[13.5px] text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    Mute details
                  </button>
                  <button
                    onClick={() => setShowDropdown(false)}
                    className="w-full px-4 py-2.5 text-left text-[13.5px] text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    Clear chat
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
