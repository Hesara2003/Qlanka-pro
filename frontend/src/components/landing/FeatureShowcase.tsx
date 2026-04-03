import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function FeatureShowcase() {
    const sectionRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "end start"]
    });

    const img1Y = useTransform(scrollYProgress, [0, 1], [-20, 40]);
    const img2Y = useTransform(scrollYProgress, [0, 1], [40, -60]);
    const img3Y = useTransform(scrollYProgress, [0, 1], [-40, 30]);

    const fadeUp = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <section 
            id="about" 
            ref={sectionRef}
            className="py-24 lg:py-40 bg-white overflow-hidden font-sans relative border-b border-gray-100/50"
        >
            {/* Premium background — subtle light mesh and grid */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[10%] left-[-5%] w-[600px] h-[600px] bg-[#78d64b]/3 rounded-full blur-[100px]" />
                <div className="absolute bottom-[10%] right-[-5%] w-[500px] h-[500px] bg-[#4abe8e]/3 rounded-full blur-[100px]" />
                <div className="absolute inset-0 bg-grid-dots opacity-[0.14]" />
                <div className="absolute inset-0 opacity-[0.02] bg-noise pointer-events-none" />
            </div>

            <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
                <div className="flex flex-col lg:flex-row gap-20 lg:gap-32 items-start">
                    
                    {/* Left Column: Missionary Editorial */}
                    <div className="w-full lg:w-[48%] sticky lg:top-32">
                        <motion.div 
                            initial="hidden" whileInView="visible" viewport={{ once: true }}
                            variants={fadeUp} transition={{ duration: 0.6 }}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#78d64b]/20 bg-[#78d64b]/10 text-[#078d42] font-semibold text-[10px] tracking-widest uppercase mb-10"
                        >
                            <span className="w-1 px-1.5 h-1 px-1.5 rounded-full bg-[#78d64b] animate-pulse" /> Our Mission
                        </motion.div>

                        <motion.h2 
                            initial="hidden" whileInView="visible" viewport={{ once: true }}
                            variants={fadeUp} transition={{ duration: 0.7, delay: 0.1 }}
                            className="text-[2.8rem] md:text-[3.8rem] lg:text-[4.8rem] text-[#1a1c23] leading-[1.02] tracking-tighter mb-10 font-medium"
                        >
                            Empowering teams <br/> to achieve{" "}
                            <span 
                                className="italic pr-2"
                                style={{ 
                                    fontFamily: "'Playfair Display', Georgia, serif",
                                    background: "linear-gradient(135deg, #78d64b 0%, #4abe8e 100%)",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    backgroundClip: "text"
                                }}
                            >
                                operational high-fidelity
                            </span>
                        </motion.h2>

                        <motion.p
                            initial="hidden" whileInView="visible" viewport={{ once: true }}
                            variants={fadeUp} transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-[#64748b] text-[18px] lg:text-[20px] leading-relaxed max-w-[540px] mb-12"
                        >
                            As a leading pioneer in queue logistics, we're dedicated to stripping away the friction of wait-times. Our mission? To turn waiting into an automated, seamless, and high-conversion point for your business.
                        </motion.p>

                    </div>

                    {/* Right Column: Premium Asymmetric Image Stack */}
                    <div className="w-full lg:w-[50%] relative h-[500px] sm:h-[650px] lg:h-[750px]">
                        {/* Center decorative circle */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] lg:w-[450px] h-[350px] lg:h-[450px] border border-[#78d64b]/10 rounded-full opacity-40 pointer-events-none" />
                        
                        <div className="relative w-full h-full">
                            {/* Layer 1: Left Small */}
                            <motion.div 
                                style={{ y: img1Y }}
                                initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }}
                                className="absolute left-0 top-[15%] w-[42%] aspect-[3/4] rounded-[2.5rem] overflow-hidden shadow-2xl border-[6px] border-white z-20"
                            >
                                <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80" alt="" className="w-full h-full object-cover" />
                            </motion.div>

                            {/* Layer 2: Main Center */}
                            <motion.div 
                                style={{ y: img2Y }}
                                initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }} transition={{ duration: 1, delay: 0.1 }}
                                className="absolute left-[20%] top-[10%] w-[65%] aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl border-[8px] border-white z-10"
                            >
                                <img src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1000&q=80" alt="" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                            </motion.div>

                            {/* Layer 3: Bottom Right */}
                            <motion.div 
                                style={{ y: img3Y }}
                                initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.3 }}
                                className="absolute right-0 bottom-[10%] w-[45%] aspect-square rounded-[2.8rem] overflow-hidden shadow-2xl border-[6px] border-white z-20"
                            >
                                <img src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=600&q=80" alt="" className="w-full h-full object-cover" />
                            </motion.div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
