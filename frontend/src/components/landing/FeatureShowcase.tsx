import { motion } from "framer-motion";

export default function FeatureShowcase() {
    const fadeUp = {
        hidden: { opacity: 0, y: 40 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <section id="about" className="py-20 lg:py-28 bg-white overflow-hidden font-sans border-b border-gray-50">
            <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-12">

                {/* Label */}
                <motion.div 
                    initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
                    variants={fadeUp} transition={{ duration: 0.6 }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 text-gray-500 font-medium text-xs tracking-wider uppercase mb-8"
                >
                    <span className="w-2 h-2 rounded-full bg-[#78d64b]" /> Our Mission
                </motion.div>

                <div className="flex flex-col lg:flex-row gap-16 lg:gap-20">
                    
                    {/* Left Column: Mission Statement */}
                    <div className="flex-1 lg:w-[50%]">
                        <motion.h2 
                            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
                            variants={fadeUp} transition={{ duration: 0.6, delay: 0.1 }}
                            className="text-[2rem] md:text-[2.8rem] text-[#1a1c23] leading-[1.2] tracking-tight mb-10"
                            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                        >
                            Empowering individuals to achieve{" "}
                            <span className="italic text-[#78d64b]">operational freedom</span>{" "}
                            through intuitive and personalized tools.
                        </motion.h2>

                        <motion.div
                            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
                            variants={fadeUp} transition={{ duration: 0.6, delay: 0.2 }}
                            className="border-t border-gray-100 pt-8 mt-8 space-y-6"
                        >
                            <p className="text-[#6b7280] text-[15px] leading-relaxed max-w-lg">
                                As a leading provider of innovative queue management software, we're dedicated to empowering businesses like yours to achieve their operational goals.
                            </p>

                            <div className="space-y-5">
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-full bg-[#78d64b]/10 flex items-center justify-center shrink-0 mt-0.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#78d64b]" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-[#1a1c23] text-[15px] mb-1">Business Growth and Efficiency</h4>
                                        <p className="text-[13px] text-gray-400 leading-relaxed">Empowering businesses to achieve operational excellence through innovative solutions.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-full bg-[#78d64b]/10 flex items-center justify-center shrink-0 mt-0.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#78d64b]" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-[#1a1c23] text-[15px] mb-1">Technological Innovation</h4>
                                        <p className="text-[13px] text-gray-400 leading-relaxed">Leveraging state-of-the-art technology innovation to empower businesses.</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column: Image Collage */}
                    <div className="flex-1 w-full relative h-[450px] lg:h-[550px]">
                        <div className="absolute inset-0 grid grid-cols-3 gap-3">
                            <motion.div 
                                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }}
                                className="col-span-1 rounded-[1.5rem] overflow-hidden shadow-sm border border-gray-100 bg-gray-100 translate-y-8"
                            >
                                <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=500&q=80" alt="Office" className="w-full h-full object-cover" />
                            </motion.div>

                            <motion.div 
                                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.3 }}
                                className="col-span-1 rounded-[1.5rem] overflow-hidden shadow-sm border border-gray-100 bg-gray-100 -translate-y-4"
                            >
                                <img src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=500&q=80" alt="Meeting" className="w-full h-full object-cover" />
                            </motion.div>

                            <motion.div 
                                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.4 }}
                                className="col-span-1 rounded-[1.5rem] overflow-hidden shadow-sm border border-gray-100 bg-gray-100 translate-y-12"
                            >
                                <img src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=500&q=80" alt="Team" className="w-full h-full object-cover" />
                            </motion.div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
