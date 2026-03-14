import { motion } from "framer-motion";

export default function IntegrationsSection() {
    const fadeUp = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <section className="py-24 bg-white relative overflow-hidden font-sans">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">

                {/* Arch graphic with icons */}
                <div className="relative w-full max-w-4xl h-64 md:h-80 mb-8 flex justify-center items-end overflow-hidden">
                    {/* Dashed arch line */}
                    <svg className="absolute bottom-0 w-full h-[200%] text-gray-200" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M 0 100 A 50 50 0 0 1 100 100" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
                    </svg>

                    {/* Center Base Logo */}
                    <motion.div 
                        initial={{ scale: 0, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
                        className="w-16 h-16 bg-[#0a5c4e] rounded-xl flex items-center justify-center shadow-lg relative z-20 mb-8"
                    >
                        <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center">
                            <span className="w-3 h-3 bg-[#78d64b] rounded-full animate-pulse"></span>
                        </div>
                    </motion.div>

                    {/* Nodes along the arch */}
                    <div className="absolute w-full h-full bottom-0">
                        {/* 1 (Leftmost bottom) */}
                        <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="absolute bottom-[20%] left-[10%] w-10 h-10 bg-[#e0f5ff] rounded-full flex items-center justify-center text-[#0aa1e5] shadow-md font-black italic">c</motion.div>
                        {/* 2 */}
                        <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="absolute bottom-[45%] left-[22%] w-12 h-12 bg-[#5d5bfc] rounded-full flex items-center justify-center text-white shadow-md">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>
                        </motion.div>
                        {/* 3 */}
                        <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="absolute bottom-[70%] left-[35%] w-14 h-14 bg-[#2e8cf0] rounded-full flex items-center justify-center text-white shadow-md text-[10px] font-bold">zoom</motion.div>
                        {/* 4 (Top center-ish) */}
                        <motion.div initial={{ scale: 0, y: -20 }} whileInView={{ scale: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4, type: "spring" }} className="absolute bottom-[85%] left-1/2 -translate-x-1/2 w-16 h-16 bg-[#007ebb] rounded-full flex items-center justify-center text-white shadow-md text-2xl font-bold">in</motion.div>
                        {/* 5 */}
                        <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.5 }} className="absolute bottom-[70%] right-[35%] w-14 h-14 bg-[#0a5c4e] rounded-full flex items-center justify-center text-white shadow-md text-lg">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
                        </motion.div>
                        {/* 6 */}
                        <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.6 }} className="absolute bottom-[45%] right-[22%] w-12 h-12 bg-[#5b5cc0] rounded-full flex items-center justify-center text-white shadow-md font-bold text-sm">
                            <div className="bg-white text-[#5b5cc0] px-1 rounded-sm text-[8px]">T</div>
                        </motion.div>
                        {/* 7 (Rightmost bottom) */}
                        <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.7 }} className="absolute bottom-[20%] right-[10%] w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 shadow-md font-bold">H</motion.div>
                    </div>
                    
                    {/* Replaced gradient cover with flat base layer */}
                    <div className="absolute bottom-0 w-full h-[15%] bg-white/80 backdrop-blur-[2px] z-10 pointer-events-none" />
                </div>

                {/* Text Content */}
                <div className="text-center max-w-2xl relative z-30 mt-[-2rem]">
                    <motion.h2 
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeUp}
                        transition={{ duration: 0.6 }}
                        className="text-[2.5rem] md:text-[3.2rem] font-bold text-[#1a1c23] tracking-tight leading-[1.1] mb-6"
                    >
                        Connect With The <br /> Tools <span className="text-[#a0a4ab]">You Already Use Daily</span>
                    </motion.h2>
                    <motion.p 
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeUp}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-[#6b7280] text-base mb-10 max-w-lg mx-auto leading-relaxed"
                    >
                        Effortlessly integrate with your favorite platforms with all in one unified queueing experience.
                    </motion.p>
                    <motion.button 
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeUp}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="bg-[#78d64b] hover:bg-[#68c63b] text-[#074b42] font-bold px-8 py-3.5 rounded-full transition-colors shadow-sm"
                    >
                        Explore Integrations
                    </motion.button>
                </div>

            </div>
        </section>
    );
}
