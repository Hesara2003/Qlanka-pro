import { motion } from "framer-motion";

export default function SurfaceAgentsSection() {
    const fadeUp = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <section className="py-24 lg:py-36 bg-[#f8fafc] overflow-hidden font-sans">
            <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-12">
                <div className="flex flex-col lg:flex-row-reverse items-center gap-16 lg:gap-24">
                    
                    {/* Right: Text Content */}
                    <div className="flex-1 max-w-xl">
                        <motion.h2 
                            initial="hidden" whileInView="visible" viewport={{ once: true }}
                            variants={fadeUp} transition={{ duration: 0.7 }}
                            className="text-[2.8rem] md:text-[3.8rem] font-medium text-[#1a1c23] leading-[1.05] tracking-tighter mb-8"
                        >
                            Cross-surface <br /> Agents
                        </motion.h2>
                        <motion.p 
                            initial="hidden" whileInView="visible" viewport={{ once: true }}
                            variants={fadeUp} transition={{ duration: 0.7, delay: 0.1 }}
                            className="text-[17px] md:text-[19px] text-gray-500 leading-relaxed font-normal"
                        >
                            Synchronized agentic control across your editor, terminal, and browser for powerful development workflows.
                        </motion.p>
                    </div>

                    {/* Left: Input Card */}
                    <div className="flex-1 w-full relative">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, x: -20 }}
                            whileInView={{ opacity: 1, scale: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="bg-white/40 backdrop-blur-3xl rounded-[2.5rem] border border-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.06)] p-12 md:p-16 relative z-10 overflow-hidden"
                        >
                            {/* Card Content: Input Box */}
                            <div className="bg-white rounded-[1.8rem] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.03)] border border-gray-100 p-8 md:p-10 relative z-20 group hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.08)] transition-all duration-500">
                                <div className="space-y-6">
                                    <div className="text-[18px] md:text-[20px] text-gray-400 font-medium">
                                        Ask anything, @ for context
                                    </div>
                                    <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 text-gray-400 group-hover:text-[#1a1c23] transition-colors">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                                            </div>
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-100 text-[12px] font-bold text-gray-500">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                                                Planning
                                            </div>
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-100 text-[12px] font-bold text-gray-500">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                                                Gemini model
                                            </div>
                                        </div>
                                        <button className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform active:scale-95">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Background Mesh Blobs */}
                            <div className="absolute top-0 right-0 w-80 h-80 bg-red-100/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                            <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-100/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                        </motion.div>
                    </div>

                </div>
            </div>
        </section>
    );
}
