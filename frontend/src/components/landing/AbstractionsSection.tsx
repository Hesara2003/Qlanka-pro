import { motion } from "framer-motion";

export default function AbstractionsSection() {
    const fadeUp = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <section className="py-24 lg:py-36 bg-white overflow-hidden font-sans">
            <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-12">
                <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
                    
                    {/* Left: Text Content */}
                    <div className="flex-1 max-w-xl">
                        <motion.h2 
                            initial="hidden" whileInView="visible" viewport={{ once: true }}
                            variants={fadeUp} transition={{ duration: 0.7 }}
                            className="text-[2.8rem] md:text-[3.8rem] font-medium text-[#1a1c23] leading-[1.05] tracking-tighter mb-8"
                        >
                            Flow Control <br /> Abstractions
                        </motion.h2>
                        <motion.p 
                            initial="hidden" whileInView="visible" viewport={{ once: true }}
                            variants={fadeUp} transition={{ duration: 0.7, delay: 0.1 }}
                            className="text-[17px] md:text-[19px] text-gray-500 leading-relaxed font-normal"
                        >
                            A more intuitive approach to monitoring branch activity, presenting managers with essential queue artifacts and verification results to build operational trust.
                        </motion.p>
                    </div>

                    {/* Right: Task Execution Card */}
                    <div className="flex-1 w-full relative">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, x: 20 }}
                            whileInView={{ opacity: 1, scale: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="bg-white rounded-[2rem] border border-blue-100/50 shadow-[0_40px_100px_-20px_rgba(30,58,138,0.08)] p-8 md:p-10 relative z-10 overflow-hidden"
                            style={{ 
                                background: "linear-gradient(145deg, #ffffff 0%, #f8faff 100%)",
                                borderTop: "4px solid #78d64b"
                            }}
                        >
                            {/* Card Content: Queue Logic Setup */}
                            <div className="space-y-8">
                                <div>
                                    <h4 className="text-[18px] font-bold text-[#1a1c23] mb-2 tracking-tight">Activating Branch Terminals</h4>
                                    <p className="text-[13px] text-gray-400 font-medium">Manager approved flow. Starting execution by syncing <span className="text-blue-500">Counter_A</span>,</p>
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {['Terminal_B', 'Live_Display', 'SMS_Gateway', 'Wait_Logger'].map((pkg) => (
                                            <span key={pkg} className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-500 text-[10px] font-bold border border-blue-100/50">
                                                {pkg}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-gray-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-[11px] font-bold text-gray-300 uppercase tracking-widest">Active Operations</span>
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gray-50 border border-gray-100">
                                            <div className="w-2.5 h-2.5 rounded-sm bg-[#78d64b]" />
                                            <span className="text-[10px] font-bold text-gray-500">Queues</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-[11px] font-bold text-gray-300 uppercase tracking-widest">Sync progress</span>
                                        <span className="text-[10px] font-bold text-gray-400">Expand all &lt;</span>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[12px] font-bold text-[#1a1c23]">1</span>
                                            <span className="text-[13px] font-medium text-[#1a1c23]">Establishing WebSocket link</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }} whileInView={{ width: "82%" }} transition={{ duration: 1.5, delay: 0.5 }}
                                                className="h-full bg-[#78d64b] rounded-full" 
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Background Glow */}
                            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl pointer-events-none" />
                        </motion.div>

                        {/* Floating Element - decorative */}
                        <div className="absolute -top-6 -right-6 w-12 h-12 bg-[#78d64b]/10 backdrop-blur-xl border border-[#78d64b]/20 rounded-2xl z-20" />
                    </div>

                </div>
            </div>
        </section>
    );
}
