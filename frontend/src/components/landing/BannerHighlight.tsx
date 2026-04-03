import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function BannerHighlight() {
    const fadeUp = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <section className="w-full py-32 lg:py-48 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden bg-[#07090d]">
            
            {/* Tactical Noise Overlay */}
            <div className="absolute inset-0 noise-overlay pointer-events-none opacity-[0.4]" />
            
            {/* Subtle Gradient Bloom */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute bottom-[-20%] left-[30%] w-[600px] h-[600px] rounded-full opacity-[0.08]" style={{ background: "radial-gradient(circle, #78d64b 0%, transparent 70%)", filter: "blur(120px)" }} />
            </div>

            <div className="max-w-[75rem] mx-auto text-center relative z-10">
                
                {/* Section Indicator */}
                <motion.div 
                    initial="hidden" whileInView="visible" viewport={{ once: true }}
                    variants={fadeUp} transition={{ duration: 0.7 }}
                    className="inline-block px-3 py-1 bg-white/5 border border-white/5 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-12 shadow-soft"
                >
                    Get Started Today
                </motion.div>
                
                <motion.h2 
                    initial="hidden" whileInView="visible" viewport={{ once: true }}
                    variants={fadeUp} transition={{ duration: 0.7, delay: 0.1 }}
                    className="text-[3rem] md:text-[5rem] font-medium text-white tracking-tighter leading-[0.96] mb-10"
                >
                    Ready to eliminate <br /> 
                    <span className="font-serif italic text-gray-500 underline decoration-white/10 decoration-[4px] underline-offset-[8px]">
                        the waiting game
                    </span>
                    <span className="text-[#78d64b]">?</span>
                </motion.h2>

                <motion.p
                    initial="hidden" whileInView="visible" viewport={{ once: true }}
                    variants={fadeUp} transition={{ duration: 0.7, delay: 0.2 }}
                    className="text-gray-500 text-[18px] md:text-[21px] mb-14 max-w-xl mx-auto leading-relaxed"
                >
                    Join the 2,300+ operational teams already transforming their customer experience. Setup takes under 5 minutes.
                </motion.p>
                
                <motion.div 
                    initial="hidden" whileInView="visible" viewport={{ once: true }}
                    variants={fadeUp} transition={{ duration: 0.7, delay: 0.3 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                    <Link
                        to="/register"
                        className="h-14 px-10 rounded-full bg-[#78d64b] text-[#074b42] font-bold text-[15px] hover:scale-105 transition-transform flex items-center justify-center min-w-[200px]"
                    >
                        Start For Free
                        <svg className="ml-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
                    </Link>
                    <Link
                        to="/login"
                        className="h-14 px-10 rounded-full bg-white/5 border border-white/10 text-white font-medium text-[15px] hover:bg-white/10 transition-all flex items-center justify-center min-w-[200px]"
                    >
                        Talk to Sales
                    </Link>
                </motion.div>

                {/* Micro Trust badges */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6 }}
                    className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 mt-16"
                >
                    {["No credit card", "14-day trial", "Enterprise ready"].map((txt, i) => (
                        <div key={i} className="flex items-center gap-2 text-[11px] font-bold text-gray-600 uppercase tracking-widest">
                            <div className="w-1 h-1 rounded-full bg-[#78d64b]" />
                            {txt}
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* Seamless Transition to Footer */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#07090d] via-[#07090d]/80 to-transparent pointer-events-none" />
        </section>
    );
}
