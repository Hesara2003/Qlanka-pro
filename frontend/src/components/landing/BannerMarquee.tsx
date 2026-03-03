import { motion } from "framer-motion";

export default function BannerMarquee() {
    return (
        <div className="w-full bg-[#78d64b] py-5 md:py-8 overflow-hidden flex flex-col font-sans border-y border-[#1a1c23]/10 relative z-20 shadow-sm">
            <div className="flex whitespace-nowrap overflow-hidden relative">
               {/* Marquee effect */}
               <motion.div 
                 animate={{ x: ["0%", "-50%"] }} 
                 transition={{ repeat: Infinity, ease: "linear", duration: 15 }}
                 className="flex whitespace-nowrap items-center font-black text-2xl md:text-4xl text-[#0a5c4e] uppercase tracking-widest gap-12 md:gap-20"
               >
                   <span>✦ Digital Queues</span>
                   <span>✦ Zero Wait Times</span>
                   <span>✦ Live Analytics</span>
                   <span>✦ Smart Tokens</span>
                   <span>✦ 98% Efficiency</span>
                   {/* Double the list to ensure seamless looping */}
                   <span>✦ Digital Queues</span>
                   <span>✦ Zero Wait Times</span>
                   <span>✦ Live Analytics</span>
                   <span>✦ Smart Tokens</span>
                   <span>✦ 98% Efficiency</span>
                   <span>✦ Digital Queues</span>
                   <span>✦ Zero Wait Times</span>
                   <span>✦ Live Analytics</span>
                   <span>✦ Smart Tokens</span>
                   <span>✦ 98% Efficiency</span>
               </motion.div>
            </div>
        </div>
    );
}
