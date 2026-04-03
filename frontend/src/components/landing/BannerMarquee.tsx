import { motion } from "framer-motion";

const items = ["QUEUE MANAGEMENT", "DIGITAL TOKENS", "ZERO WAIT TIMES", "LIVE ANALYTICS", "98% EFFICIENCY", "SMART AUTOMATION"];
const all = [...items, ...items, ...items];

export default function BannerMarquee() {
    return (
        <div className="w-full overflow-hidden font-sans border-y border-[#6bc63b]/20" style={{ background: "linear-gradient(135deg, #78d64b 0%, #5ec941 50%, #4abe8e 100%)" }}>
            <div className="flex whitespace-nowrap py-4 md:py-5 relative">
               <motion.div 
                 animate={{ x: ["0%", "-33.33%"] }} 
                 transition={{ repeat: Infinity, ease: "linear", duration: 22 }}
                 className="flex whitespace-nowrap items-center text-[13px] md:text-[14px] font-medium text-[#074b42] uppercase tracking-[0.25em] gap-0"
               >
                    {all.map((item, i) => (
                        <span key={i} className="flex items-center">
                            <span className="px-8">{item}</span>
                            <span className="text-[#074b42]/40 text-[8px]">✦</span>
                        </span>
                    ))}
               </motion.div>
            </div>
        </div>
    );
}
