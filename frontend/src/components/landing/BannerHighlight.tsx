import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function BannerHighlight() {
    return (
        <div className="w-full bg-[#1a1c23] py-16 lg:py-20 px-4 sm:px-6 lg:px-8 border-t border-white/5 font-sans relative overflow-hidden">
            {/* Background design elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#0a5c4e]/30 rounded-full blur-[100px] pointer-events-none translate-x-1/2 -translate-y-1/2"></div>
            
            <div className="max-w-[70rem] mx-auto flex flex-col md:flex-row items-center justify-between gap-10 md:gap-12 relative z-10">
                <div className="text-center md:text-left">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-[#a0ccbc] font-semibold text-xs tracking-wider uppercase mb-6"
                    >
                        <span className="w-2 h-2 rounded-full bg-[#78d64b]"></span> Join The Future
                    </motion.div>
                    
                    <motion.h2 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-white text-3xl md:text-5xl font-bold tracking-tight leading-[1.1]"
                    >
                        Ready to elevate your <br className="hidden md:block" /> 
                        <span className="text-[#a0a4ab] font-normal">customer experience?</span>
                    </motion.h2>
                </div>
                
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col sm:flex-row gap-4 shrink-0"
                >
                    <Link
                        to="/register"
                        className="bg-[#78d64b] hover:bg-[#68c63b] text-[#074b42] text-center font-bold px-10 py-5 rounded-full transition-colors shadow-lg text-lg"
                    >
                        Get Started Today
                    </Link>
                    <Link
                        to="/contact"
                        className="bg-white/5 hover:bg-white/10 text-white text-center border border-white/10 font-bold px-10 py-5 rounded-full transition-colors text-lg"
                    >
                        Contact Sales
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}
