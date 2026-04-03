import { motion } from "framer-motion";

export default function FeatureShowcase() {
    const fadeUp = {
        hidden: { opacity: 0, y: 40 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <section id="about" className="py-20 lg:py-32 bg-white overflow-hidden font-sans border-b border-gray-50 relative">
            {/* Grid dot background for subtle texture */}
            <div className="absolute inset-0 bg-grid-dots opacity-20 pointer-events-none" />

            <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-12 relative z-10">

                {/* Label */}
                <motion.div 
                    initial="hidden" whileInView="visible" viewport={{ once: true }}
                    variants={fadeUp} transition={{ duration: 0.6 }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#78d64b]/20 bg-[#78d64b]/5 text-[#078d42] font-medium text-[11px] tracking-wider uppercase mb-8"
                >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#78d64b] animate-pulse" /> Our Mission
                </motion.div>

                <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-center">
                    
                    {/* Left Column: Mission Statement */}
                    <div className="flex-1 lg:w-[50%]">
                        <motion.h2 
                            initial="hidden" whileInView="visible" viewport={{ once: true }}
                            variants={fadeUp} transition={{ duration: 0.6, delay: 0.1 }}
                            className="text-[2.2rem] md:text-[3.2rem] text-[#1a1c23] leading-[1.1] tracking-tight mb-8"
                        >
                            Empowering individuals to achieve{" "}
                            <span 
                                className="italic"
                                style={{ 
                                    fontFamily: "'Playfair Display', Georgia, serif",
                                    background: "linear-gradient(135deg, #78d64b 0%, #4abe8e 100%)",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    backgroundClip: "text"
                                }}
                            >
                                operational freedom
                            </span>{" "}
                            through intuitive and personalized tools.
                        </motion.h2>

                        <motion.div
                            initial="hidden" whileInView="visible" viewport={{ once: true }}
                            variants={fadeUp} transition={{ duration: 0.6, delay: 0.2 }}
                            className="border-t border-gray-100 pt-10 mt-10 space-y-8"
                        >
                            <p className="text-[#6b7280] text-[16px] leading-relaxed max-w-[500px]">
                                As a leading provider of innovative queue management software, we're dedicated to helping businesses like yours achieve their operational goals with zero friction.
                            </p>

                            <div className="grid grid-cols-1 gap-6">
                                {[
                                    { title: "Business Growth & Efficiency", desc: "Achieve operational excellence through innovative SaaS solutions.", icon: "🚀" },
                                    { title: "Technological Innovation", desc: "Leveraging state-of-the-art AI to empower your service branch.", icon: "⚡" }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-start gap-5 p-4 rounded-2xl border border-gray-50 hover:bg-gray-50 transition-colors">
                                        <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-lg shadow-sm">
                                            {item.icon}
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-[#1a1c23] text-[15px] mb-1">{item.title}</h4>
                                            <p className="text-[13px] text-gray-500 leading-relaxed">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column: Image Collage */}
                    <div className="flex-1 w-full relative h-[450px] lg:h-[580px]">
                        {/* Background glow behind images */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#78d64b]/5 blur-[80px] rounded-full pointer-events-none" />
                        
                        <div className="absolute inset-0 grid grid-cols-3 gap-3">
                            {[
                                { url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80", y: "translate-y-12", delay: 0.2 },
                                { url: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=600&q=80", y: "-translate-y-6", delay: 0.3 },
                                { url: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=600&q=80", y: "translate-y-16", delay: 0.4 }
                            ].map((img, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }} transition={{ duration: 0.8, delay: img.delay }}
                                    className={`col-span-1 rounded-[2rem] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-white p-1 bg-white ${img.y}`}
                                >
                                    <div className="w-full h-full rounded-[1.8rem] overflow-hidden">
                                        <img src={img.url} alt="Office setting" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
