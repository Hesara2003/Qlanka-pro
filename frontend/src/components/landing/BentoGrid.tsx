import { motion } from "framer-motion";

export default function BentoGrid() {
    const fadeUp = {
        hidden: { opacity: 0, y: 40 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <section id="features" className="py-20 lg:py-28 bg-[#fcfcfc] overflow-hidden font-sans border-b border-gray-100">
            <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-12">

                {/* Section Header */}
                <div className="text-center mb-16">
                    <motion.div 
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={fadeUp}
                        transition={{ duration: 0.6 }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-[#0a5c4e] font-semibold text-xs tracking-wider uppercase mb-6 shadow-sm"
                    >
                        <span className="w-2 h-2 rounded-full bg-[#78d64b]"></span> Our Features
                    </motion.div>
                    <motion.h2 
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={fadeUp}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-[2.5rem] md:text-[4rem] font-bold text-[#1a1c23] leading-[1.05] tracking-tight"
                    >
                        Streamline Your Workflow<br />
                        From Start To Finish
                    </motion.h2>
                </div>

                {/* Bento Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 lg:grid-rows-2 gap-4 lg:gap-6 mt-12 auto-rows-[400px]">

                    {/* Card 1: Wide (Top Left) */}
                    <motion.div 
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={fadeUp}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="lg:col-span-2 bg-[#0a5c4e] text-white rounded-[2rem] p-8 lg:p-10 flex flex-col md:flex-row items-center gap-8 overflow-hidden relative shadow-lg"
                    >
                        <div className="flex-1 z-10">
                            <h3 className="text-3xl font-bold mb-4 tracking-tight">Easy To Issue Tokens</h3>
                            <p className="text-[#a0ccbc] text-[17px] mb-8 leading-relaxed max-w-md">
                                Create and manage branch counters in minutes. Serve the right customer at the right time effortlessly with our digital kiosks.
                            </p>
                            <button className="bg-[#78d64b] hover:bg-[#68c63b] text-[#074b42] font-bold px-6 py-3 rounded-full transition-colors text-sm shadow-sm">
                                View Kiosks
                            </button>
                        </div>
                        <div className="w-full md:w-[45%] h-64 md:h-full relative mt-auto md:mt-0 z-10">
                            <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80" alt="Data Screen" className="w-full h-full object-cover rounded-2xl shadow-2xl border-4 border-[#0d6e5d]" />
                        </div>
                        {/* Decorative Background Element */}
                        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[150%] bg-[#0d6e5d] rounded-full blur-[100px] opacity-60 pointer-events-none"></div>
                    </motion.div>

                    {/* Card 2: Tall (Right Column) */}
                    <motion.div 
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={fadeUp}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="lg:row-span-2 bg-white rounded-[2rem] p-8 lg:p-10 flex flex-col overflow-hidden relative border border-gray-200 shadow-sm"
                    >
                        <h3 className="text-3xl font-bold text-[#1a1c23] mb-4 tracking-tight z-10">Manage Customers</h3>
                        <p className="text-[#6b7280] text-[17px] mb-8 z-10 leading-relaxed">
                            Track, review, and organize. Gain full visibility into every stage of the queue pipeline.
                        </p>
                        
                        {/* Interactive UI Mock */}
                        <div className="relative w-full flex-1 min-h-[300px] mt-4 z-10 flex flex-col gap-3">
                            <img src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=500&q=80" alt="Customer" className="w-full h-48 object-cover rounded-2xl mb-2" />
                            
                            <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 4 }} className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 flex items-center gap-4 relative -mt-12 mx-4 z-20">
                                <div className="w-10 h-10 rounded-full bg-[#1a1c23] flex items-center justify-center text-[#78d64b] font-bold text-sm shrink-0">VIP</div>
                                <div className="text-left w-full">
                                    <p className="text-sm font-bold text-gray-900">Kamal Perera</p>
                                    <p className="text-xs text-gray-500 mt-0.5">Token D-012 • Waiting</p>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Card 3: Wide (Bottom Left) */}
                    <motion.div 
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={fadeUp}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="lg:col-span-2 bg-[#1a1c23] text-white rounded-[2rem] p-0 flex flex-col md:flex-row overflow-hidden relative shadow-xl"
                    >
                        <div className="w-full md:w-1/2 h-64 md:h-full relative overflow-hidden">
                            <img src="https://images.unsplash.com/photo-1556761175-5973dd0f0f7f?auto=format&fit=crop&w=600&q=80" alt="Live Status updates" className="w-full h-full object-cover opacity-80" />
                            <div className="absolute inset-0 bg-[#1a1c23]/40"></div>
                        </div>
                        <div className="flex-1 p-8 lg:p-10 flex flex-col justify-center">
                            <h3 className="text-3xl font-bold mb-4 tracking-tight text-white">Live Status Updates</h3>
                            <p className="text-gray-400 text-[17px] mb-8 leading-relaxed">
                                Communicate instantly with waiting customers. Keep everyone in the loop with SMS and live display portals.
                            </p>
                            <div className="flex gap-4">
                                <div className="bg-[#272a35] px-4 py-3 rounded-xl border border-[#373b47] flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-[#78d64b] animate-pulse"></div>
                                    <span className="text-sm font-semibold text-white">Syncing Live</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}

