import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function BannerHighlight() {
    return (
        <div className="w-full py-20 lg:py-24 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden" style={{ background: "linear-gradient(160deg, #0f1117 0%, #111827 50%, #0d1f10 100%)" }}>
            {/* Mesh glow blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute bottom-[-30%] left-[20%] w-[500px] h-[500px] rounded-full opacity-20" style={{ background: "radial-gradient(circle, #78d64b 0%, transparent 70%)", filter: "blur(80px)" }} />
                <div className="absolute top-[-20%] right-[10%] w-[400px] h-[400px] rounded-full opacity-10" style={{ background: "radial-gradient(circle, #4abe8e 0%, transparent 70%)", filter: "blur(100px)" }} />
            </div>

            {/* Grid dots */}
            <div className="absolute inset-0 bg-grid-dots opacity-20 pointer-events-none" />

            {/* Top border glow */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#78d64b]/30 to-transparent" />
            
            <div className="max-w-[65rem] mx-auto text-center relative z-10">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 text-gray-400 font-medium text-[11px] tracking-wider uppercase mb-8"
                >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#78d64b] animate-pulse" /> Get Started Today
                </motion.div>
                
                <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-[2.75rem] md:text-[4.5rem] font-medium text-white tracking-tight leading-[1.02] mb-6"
                >
                    Ready to eliminate <br /> 
                    <span 
                        className="italic"
                        style={{ 
                            fontFamily: "'Playfair Display', Georgia, serif",
                            background: "linear-gradient(135deg, #78d64b 0%, #4abe8e 50%, #a3e635 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text"
                        }}
                    >
                        the waiting game?
                    </span>
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15 }}
                    className="text-gray-400 text-[16px] mb-10 max-w-lg mx-auto leading-relaxed"
                >
                    Join 2,300+ teams who've already transformed their customer experience. Setup takes under 5 minutes.
                </motion.p>
                
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col sm:flex-row gap-3 justify-center"
                >
                    <Link
                        to="/register"
                        className="inline-flex items-center justify-center gap-2 text-[14px] font-medium px-8 py-4 rounded-xl text-[#074b42] transition-all duration-200 shadow-lg shadow-[#78d64b]/25 hover:shadow-[#78d64b]/40 hover:scale-[1.02] active:scale-[0.98]"
                        style={{ background: "linear-gradient(135deg, #78d64b 0%, #5ec941 100%)" }}
                    >
                        Start For Free
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
                    </Link>
                    <Link
                        to="/login"
                        className="inline-flex items-center justify-center gap-2 text-[14px] font-medium px-8 py-4 rounded-xl text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200"
                    >
                        Talk to Sales
                    </Link>
                </motion.div>

                {/* Trust badges */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center justify-center gap-8 mt-10"
                >
                    {["No credit card", "14-day trial", "Cancel anytime"].map((txt, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[12px] text-gray-500">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#78d64b" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                            {txt}
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}
