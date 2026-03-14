import { motion } from "framer-motion";

export default function BannerStats() {
    return (
        <div className="w-full bg-[#0a5c4e] py-14 border-y border-[#1a1c23]/10 font-sans relative overflow-hidden">
            {/* Soft background shape */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-[#1a1c23]/10 rounded-full blur-[80px] pointer-events-none"></div>

            <div className="max-w-[80rem] mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 text-center divide-x divide-white/10">
                    
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="flex flex-col items-center"
                    >
                        <span className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-2">98<span className="text-[#78d64b]">%</span></span>
                        <span className="text-[#a0ccbc] text-sm font-semibold uppercase tracking-widest">Efficiency</span>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col items-center"
                    >
                        <span className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-2">2.1<span className="text-[#78d64b]">k</span></span>
                        <span className="text-[#a0ccbc] text-sm font-semibold uppercase tracking-widest">Active Users</span>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col items-center"
                    >
                        <span className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-2">12M<span className="text-[#78d64b]">+</span></span>
                        <span className="text-[#a0ccbc] text-sm font-semibold uppercase tracking-widest">Tokens Issued</span>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                        className="flex flex-col items-center"
                    >
                        <span className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-2">24<span className="text-[#78d64b]">/7</span></span>
                        <span className="text-[#a0ccbc] text-sm font-semibold uppercase tracking-widest">Support</span>
                    </motion.div>

                </div>
            </div>
        </div>
    );
}
