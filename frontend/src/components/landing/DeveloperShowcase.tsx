import { motion } from "framer-motion";
import { Building2, Hospital } from "lucide-react";

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
                        Built for businesses <br /> for the digital-first era
                    </motion.h2>
                    <motion.p 
                        initial="hidden" whileInView="visible" viewport={{ once: true }}
                        variants={fadeUp} transition={{ duration: 0.7, delay: 0.1 }}
                        className="text-[15px] md:text-[17px] text-gray-500 leading-relaxed font-normal max-w-md lg:text-right"
                    >
                        QueueLanka Pro is built for enterprise-grade trust, whether you're a small clinic managing daily arrivals or a large retail chain optimizing national branch operations.
                    </motion.p>
                </div>

                {/* Testimonial Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
                    
                    {/* Card 1: Retail Operations */}
                    <motion.div 
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="group relative h-[500px] lg:h-[700px] rounded-[3rem] overflow-hidden shadow-2xl transition-all duration-700 hover:shadow-gray-300/30"
                    >
                        <img 
                            src="/retail_executive.png" 
                            alt="Retail Operations Director"
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent opacity-70 group-hover:opacity-60 transition-opacity" />
                        
                        {/* Testimonial Overlay — Sleek Dark Mode */}
                        <div className="absolute bottom-8 left-8 right-8 z-20">
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="bg-black/90 backdrop-blur-sm border border-white/10 rounded-[2rem] p-6 lg:p-8 shadow-2xl"
                            >
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-[#78d64b] flex items-center justify-center shrink-0">
                                        <Building2 size={16} className="text-[#074b42]" />
                                    </div>
                                    <p className="text-white text-[15px] lg:text-[17px] font-medium leading-snug">
                                        "QueueLanka transformed our terminal traffic. We've seen a 30% increase in efficiency."
                                    </p>
                                </div>
                                <div className="pl-12">
                                    <div className="text-white font-bold text-[13px] uppercase tracking-wider">Global Retail Corp</div>
                                    <div className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-0.5">Operations Director</div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Card 2: Healthcare Director */}
                    <motion.div 
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                        className="group relative h-[500px] lg:h-[700px] rounded-[3rem] overflow-hidden shadow-2xl transition-all duration-700 hover:shadow-gray-300/30"
                    >
                        <img 
                            src="/healthcare_director.png" 
                            alt="Clinical Services Director"
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent opacity-70 group-hover:opacity-60 transition-opacity" />
                        
                        {/* Testimonial Overlay — Sleek Dark Mode */}
                        <div className="absolute bottom-8 left-8 right-8 z-20">
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="bg-black/90 backdrop-blur-sm border border-white/10 rounded-[2rem] p-6 lg:p-8 shadow-2xl"
                            >
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
                                        <Hospital size={16} className="text-white" />
                                    </div>
                                    <p className="text-white text-[15px] lg:text-[17px] font-medium leading-snug">
                                        "Patient satisfaction has soared. Real-time updates reduced lobby crowding by 45%."
                                    </p>
                                </div>
                                <div className="pl-12">
                                    <div className="text-white font-bold text-[13px] uppercase tracking-wider">City Health Systems</div>
                                    <div className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-0.5">Clinic Director</div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>

                </div>

            </div>
        </section>
    );
}
