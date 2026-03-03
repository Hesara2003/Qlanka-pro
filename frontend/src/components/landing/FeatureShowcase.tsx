import { motion } from "framer-motion";

export default function FeatureShowcase() {
    const fadeUp = {
        hidden: { opacity: 0, y: 40 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <section id="about" className="py-20 lg:py-28 bg-white overflow-hidden font-sans border-b border-gray-100">
            <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-12">

                <div className="flex flex-col lg:flex-row gap-16 lg:gap-20 items-center">
                    
                    {/* Left Column: Text Content */}
                    <div className="flex-1 lg:w-[45%] shrink-0">
                        <motion.div 
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-100px" }}
                            variants={fadeUp}
                            transition={{ duration: 0.6 }}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-[#0a5c4e] font-semibold text-xs tracking-wider uppercase mb-6"
                        >
                            <span className="w-2 h-2 rounded-full bg-[#78d64b]"></span> About Our Platform
                        </motion.div>
                        
                        <motion.h2 
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-100px" }}
                            variants={fadeUp}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="text-[2.5rem] md:text-[4rem] font-bold text-[#1a1c23] leading-[1.05] tracking-tight mb-8"
                        >
                            Transform Your <br /> Queue Process With <br />
                            <span className="text-gray-400 font-normal">Smarter Technology</span>
                        </motion.h2>

                        <motion.p 
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-100px" }}
                            variants={fadeUp}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-[#6b7280] text-[17px] leading-relaxed max-w-lg mb-10"
                        >
                            From generating tokens to serving customers, our platform streamlines every step. Manage confidently with tools built to reduce wait times and boost efficiency.
                        </motion.p>

                        <motion.div 
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-100px" }}
                            variants={fadeUp}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="flex gap-12 border-t border-gray-100 pt-8 mt-8"
                        >
                            <div>
                                <h3 className="text-4xl font-bold text-[#1a1c23] tracking-tighter mb-1">120k<span className="text-[#78d64b]">+</span></h3>
                                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Active Users</p>
                            </div>
                            <div>
                                <h3 className="text-4xl font-bold text-[#1a1c23] tracking-tighter mb-1">120<span className="text-[#78d64b]">+</span></h3>
                                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Branches</p>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column: Image Collage */}
                    <div className="flex-1 w-full relative h-[500px] lg:h-[600px]">
                        <div className="absolute inset-0 grid grid-cols-2 gap-4 lg:gap-6">
                            
                            {/* Tall Image */}
                            <motion.div 
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="w-full h-[90%] mt-auto rounded-[2rem] overflow-hidden shadow-lg relative bg-gray-100 border border-gray-100/50"
                            >
                                <img src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=800&q=80" alt="Business Metrics" className="w-full h-full object-cover" />
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-2xl shadow-sm">
                                    <div className="w-12 h-12 rounded-xl bg-[#0a5c4e] flex items-center justify-center text-[#78d64b]">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Stacked Images/Boxes */}
                            <div className="w-full h-full flex flex-col gap-4 lg:gap-6">
                                <motion.div 
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.8, delay: 0.4 }}
                                    className="w-full h-[55%] rounded-[2rem] overflow-hidden shadow-md relative bg-gray-100"
                                >
                                    <img src="https://images.unsplash.com/photo-1572021335469-31706a17aaef?auto=format&fit=crop&w=800&q=80" alt="Collaboration" className="w-full h-full object-cover" />
                                </motion.div>
                                
                                <motion.div 
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.8, delay: 0.6 }}
                                    className="w-full h-[45%] bg-[#1a1c23] rounded-[2rem] shadow-xl p-8 flex flex-col justify-between"
                                >
                                    <div className="w-10 h-10 rounded-full bg-[#0a5c4e] flex items-center justify-center text-white mb-4">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-xl mb-1">Enterprise Grade</h3>
                                        <p className="text-gray-400 text-sm">Secure & reliable systems</p>
                                    </div>
                                </motion.div>
                            </div>

                        </div>
                    </div>

                </div>

            </div>
        </section>
    );
}
