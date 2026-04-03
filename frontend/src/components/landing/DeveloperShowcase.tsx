import { motion } from "framer-motion";

export default function DeveloperShowcase() {
    const fadeUp = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <section className="py-24 lg:py-48 bg-white overflow-hidden font-sans">
            <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-12">
                
                {/* Header Context */}
                <div className="flex flex-col lg:flex-row items-end justify-between gap-12 mb-24 lg:mb-32">
                    <motion.h2 
                        initial="hidden" whileInView="visible" viewport={{ once: true }}
                        variants={fadeUp} transition={{ duration: 0.7 }}
                        className="text-[2.8rem] md:text-[3.8rem] font-medium text-[#1a1c23] leading-[1.02] tracking-tighter max-w-xl"
                    >
                        Built for developers <br /> for the agent-first era
                    </motion.h2>
                    <motion.p 
                        initial="hidden" whileInView="visible" viewport={{ once: true }}
                        variants={fadeUp} transition={{ duration: 0.7, delay: 0.1 }}
                        className="text-[15px] md:text-[17px] text-gray-500 leading-relaxed font-normal max-w-md lg:text-right"
                    >
                        Google Antigravity is built for user trust, whether you're a professional developer working in a large enterprise codebase, a hobbyist vibe-coding in their spare time, or anyone in between.
                    </motion.p>
                </div>

                {/* Developer Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
                    
                    {/* Column 1: Frontend Developer */}
                    <motion.div 
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="group relative h-[500px] lg:h-[700px] rounded-[3rem] overflow-hidden shadow-2xl transition-all duration-700 hover:shadow-gray-300/30"
                    >
                        <img 
                            src="frontend_developer_portrait_1775214543665.png" 
                            alt="Frontend Developer"
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                        
                        {/* Overlay Content */}
                        <div className="absolute bottom-12 left-12 z-20">
                            <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 }}
                                className="text-[3rem] lg:text-[4rem] font-medium text-white leading-tight tracking-tighter"
                            >
                                Frontend <br /> developer <span className="text-[#78d64b]">|</span>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Column 2: Backend Developer / Professional Era */}
                    <motion.div 
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                        className="group relative h-[500px] lg:h-[700px] rounded-[3rem] overflow-hidden shadow-2xl transition-all duration-700 hover:shadow-gray-300/30"
                    >
                        <img 
                            src="backend_developer_portrait_1775214563399.png" 
                            alt="Backend Developer"
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                        
                        {/* Overlay Content: Optional text from the user's screenshots but focusing on high fidelity visuals */}
                        <div className="absolute bottom-12 left-12 z-20">
                            <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 }}
                                className="text-[3rem] lg:text-[4rem] font-medium text-white leading-tight tracking-tighter"
                            >
                                Enterprise <br /> engineer <span className="text-blue-500">_</span>
                            </motion.div>
                        </div>
                    </motion.div>

                </div>

            </div>
        </section>
    );
}
