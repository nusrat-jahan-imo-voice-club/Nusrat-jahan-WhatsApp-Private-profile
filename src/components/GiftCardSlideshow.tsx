import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Gift, 
  Sparkles, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  CreditCard,
  Heart,
  Video,
  ShieldCheck,
  Star
} from "lucide-react";

interface GiftCard {
  id: string;
  title: string;
  subtitle: string;
  amount: string;
  code: string;
  tagline: string;
  points: string[];
  gradient: string;
  textColor: string;
  badge: string;
  brand: string;
}

interface GiftCardSlideshowProps {
  onStartClick: () => void;
}

export const GiftCardSlideshow: React.FC<GiftCardSlideshowProps> = ({ onStartClick }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const giftCards: GiftCard[] = [
    {
      id: "vip-gold",
      title: "নুসরাত ভিআইপি লাইভ গোল্ড পাস",
      subtitle: "Nusrat Jahan VIP Live Premium Pass",
      amount: "আজীবন ফ্রি",
      code: "VIP-PASS-777",
      tagline: "আজীবন সম্পূর্ণ সুরক্ষিত লাইভ ডিরেক্ট সংযোগ প্যাক",
      points: [
        "সৌদি আরব, দুবাই, কাতার সহ বিশ্বের যেকোনো স্থান থেকে ভিপিএন ছাড়া স্পষ্ট কথা বলুন।",
        "সম্পূর্ণ সুরক্ষিত ও প্রাইভেট রুট—স্ক্রিনশট বা স্ক্রিন রেকর্ড চিরতরে নিষিদ্ধ।"
      ],
      gradient: "from-amber-400 via-yellow-500 to-amber-600",
      textColor: "text-amber-950",
      badge: "VIP GOLDEN PERK",
      brand: "VIP PASS"
    },
    {
      id: "google-play",
      title: "গুগল প্লে স্পেশাল গিফট ভাউচার",
      subtitle: "Google Play VIP Connect Gift Card",
      amount: "১,৫০০ ৳",
      code: "GP-CONNECT-99",
      tagline: "ফ্রি অ্যাক্টিভেশন কী এবং নুসরত হোয়াইট-লিস্ট মেম্বারশিপ",
      points: [
        "নুসরতের পার্সোনাল প্রিমিয়াম স্পেশাল মেমো প্যাক অ্যাক্সেস উইথআউট লিমিট।",
        "স্মার্ট এআই ব্যাকগ্রাউন্ড নয়েজ কন্ট্রোল ফিল্টার দিয়ে অডিও ক্লিয়ার সংযোগ।"
      ],
      gradient: "from-teal-400 via-emerald-500 to-[#128c7e]",
      textColor: "text-emerald-950",
      badge: "GOOGLE PROMO ACTIVE",
      brand: "Google Play"
    },
    {
      id: "apple-itunes",
      title: "অ্যাপল আইটিউনস এক্সক্লুসিভ গিফট কার্ড",
      subtitle: "Apple Store Premium Live Token",
      amount: "২,৫০০ ৳",
      code: "AP-EXCLUSIVE-88",
      tagline: "হাই-ডেফিনিশন ভিডিও ও ক্রিস্টাল ডেনসিটি অডিও কলিং",
      points: [
        "আপনার ফোনে লো নেটওয়ার্কেও স্পষ্ট ফেস-টু-ফেস ভিডিও প্রিভিউ।",
        "সারাজীবন প্রতি সপ্তাহে বিশেষ ক্লোজ সার্কেলে ১টি ফ্রি চ্যাট সেশন।"
      ],
      gradient: "from-slate-700 via-rose-500 to-indigo-800",
      textColor: "text-white",
      badge: "APPLE SPECIAL TICKET",
      brand: "iTunes Store"
    }
  ];

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % giftCards.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPlaying, giftCards.length]);

  const handleNext = () => {
    setIsPlaying(false);
    setActiveSlide((prev) => (prev + 1) % giftCards.length);
  };

  const handlePrev = () => {
    setIsPlaying(false);
    setActiveSlide((prev) => (prev - 1 + giftCards.length) % giftCards.length);
  };

  const current = giftCards[activeSlide];

  return (
    <div id="gift-card-slide-container" className="w-full max-w-[340px] mx-auto my-1 px-1">
      {/* Decorative slider header */}
      <div className="flex items-center justify-between mb-1 px-1.5">
        <div className="flex items-center gap-1">
          <Gift className="w-3.5 h-3.5 text-emerald-500 animate-bounce" />
          <span className="text-[10px] font-extrabold text-[#075e54] uppercase tracking-wider font-sans">
            গিফট কার্ড ও স্পেশাল অ্যাক্সেস
          </span>
        </div>
        <div className="flex items-center gap-1 text-[9px] font-mono text-slate-400">
          <Sparkles className="w-3 h-3 text-yellow-500 animate-pulse" />
          <span className="font-extrabold text-blue-500">EXCLUSIVE MOD</span>
        </div>
      </div>

      {/* Slide Carousel wrapper - Compact & elegant */}
      <div className="relative overflow-hidden rounded-2xl p-2 bg-slate-950/10 border border-slate-100/5 shadow-md">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide}
            initial={{ opacity: 0, scale: 0.98, x: 15 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.98, x: -15 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full"
          >
            {/* The Gift Card visual representation */}
            <div className={`relative h-[105px] w-full rounded-xl p-3 bg-gradient-to-br ${current.gradient} shadow-md overflow-hidden border border-white/15 select-none text-left`}>
              {/* Glassmorphism glossy reflection */}
              <div className="absolute -inset-y-12 -inset-x-24 bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-12 transform -translate-x-full animate-[shimmer_3.5s_infinite] pointer-events-none" />

              {/* Holographic glowing orb background decoration inside card */}
              <div className="absolute -bottom-8 -right-8 w-16 h-16 rounded-full bg-white/15 blur-lg" />
              <div className="absolute -top-8 -left-8 w-14 h-14 rounded-full bg-black/5 blur-md" />

              {/* Card Header */}
              <div className="flex justify-between items-start mb-1 relative z-10">
                <div className="flex items-center gap-1">
                  <CreditCard className="w-4 h-4 text-white/90 drop-shadow-sm" />
                  <span className="text-[8.5px] uppercase tracking-widest font-extrabold font-mono text-white/80">
                    {current.brand}
                  </span>
                </div>
                <span className="text-[7.5px] bg-white/25 text-white border border-white/30 backdrop-blur-md px-1.5 py-0.5 rounded-full font-sans tracking-wide font-extrabold uppercase">
                  {current.badge}
                </span>
              </div>

              {/* Card Code display */}
              <div className="mt-0.5 relative z-10">
                <span className="text-[7px] tracking-wider uppercase font-extrabold text-white/70 block">
                  ACTIVATION KEY VALUE
                </span>
                <span className="text-[11px] font-mono font-bold tracking-widest text-[#f8fafc] bg-black/20 rounded px-1.5 py-0.5 inline-block border border-white/5 select-all">
                  {current.code}
                </span>
              </div>

              {/* Amount / Free banner */}
              <div className="absolute bottom-3 right-3 text-right relative z-10 flex flex-col items-end">
                <span className="text-[7px] text-white/70 uppercase tracking-widest font-mono font-bold">
                  CARD VALUE
                </span>
                <span className="text-[15px] font-sans font-black tracking-tight text-white drop-shadow-md leading-none">
                  {current.amount}
                </span>
              </div>

              {/* Star details or Nusrat signature badge */}
              <div className="absolute bottom-3 left-3 relative z-10 flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-yellow-300 text-yellow-300 drop-shadow-sm animate-spin [animation-duration:12s]" />
                <span className="text-[9px] font-extrabold tracking-wider font-sans text-white/95 drop-shadow-xs">
                  নুসরাত স্পেশাল অ্যাক্টিভেশন
                </span>
              </div>
            </div>

            {/* Description & bullets */}
            <div className="mt-1.5 space-y-1 text-left bg-white p-2.5 rounded-xl border border-slate-100 shadow-xs relative z-10">
              <div className="flex justify-between items-center">
                <h4 className="text-[12px] font-extrabold text-[#075e54] flex items-center gap-1 leading-none">
                  <Heart className="w-3 h-3 fill-rose-500 text-rose-500 shrink-0" />
                  {current.title}
                </h4>
                <p className="text-[8px] font-mono font-bold text-slate-400">
                  {current.subtitle}
                </p>
              </div>

              <div className="py-0.5 px-1.5 rounded-md bg-emerald-50/70 text-emerald-800 text-[9.5px] font-bold border-l-2 border-[#128c7e] leading-tight">
                ⚡ {current.tagline}
              </div>

              <div className="space-y-0.5 pl-0.5">
                {current.points.map((pt, index) => (
                  <div key={index} className="flex items-start gap-1">
                    <Check className="w-3 h-3 text-emerald-600 mt-0.5 shrink-0" />
                    <p className="text-[9.5px] text-slate-600 font-medium leading-tight font-sans">
                      {pt}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Carousel pagination arrows and dot indicators */}
        <div className="flex items-center justify-between mt-1.5 px-0.5">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 active:scale-[0.92] text-slate-600 border border-slate-200 transition-all cursor-pointer"
              title="Previous Gift Card"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>

            {/* Pagination play indicator */}
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-1.5 py-0.5 font-mono text-[8px] font-black rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 active:scale-[0.94] transition-all cursor-pointer"
            >
              {isPlaying ? "AUTO: ON" : "PAUSED"}
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 active:scale-[0.92] text-slate-600 border border-slate-200 transition-all cursor-pointer"
              title="Next Gift Card"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center gap-1 mr-0.5">
            {giftCards.map((_, index) => (
              <span
                key={index}
                onClick={() => {
                  setIsPlaying(false);
                  setActiveSlide(index);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  index === activeSlide 
                    ? "w-3 bg-emerald-500" 
                    : "w-1.5 bg-slate-300 hover:bg-slate-400"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
