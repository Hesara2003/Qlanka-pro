import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const trusted = [
    "RCK",
    "miro",
    "stripe",
    "Google",
    "Adobe",
    "Spotify",
];

export default function HeroSection() {
    // Animation variants
    const fadeUp = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0 }
    };

    const floatAnimation = (delay: number) => ({
        initial: { y: 0 },
        animate: {
            y: [-10, 10, -10],
            transition: {
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: delay
            }
        }
    });

    return (
        <section className="relative w-full bg-[#fcfcfc] overflow-hidden pt-28 lg:pt-32 pb-12 font-sans flex flex-col justify-center min-h-[calc(100vh-80px)] border-b border-gray-100">
            
            <div className="relative z-10 w-full max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-12 flex-1 flex flex-col justify-center">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-8">
                    
                    {/* Left Column: Text & CTAs */}
                    <div className="flex flex-col items-start text-left lg:w-[45%] xl:w-[42%] shrink-0">
                        <motion.h1
                            initial="hidden"
                            animate="visible"
                            variants={fadeUp}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="font-bold text-[#1a1c23] leading-[1.05] tracking-tight"
                            style={{ fontSize: "clamp(3rem, 5vw, 4.5rem)" }}
                        >
                            Turn Your Chaos <br />
                            into Streamlined <br />
                            Queues with Ease
                        </motion.h1>

                        <motion.p
                            initial="hidden"
                            animate="visible"
                            variants={fadeUp}
                            transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
                            className="mt-6 text-[17px] text-[#6b7280] leading-relaxed font-normal max-w-md"
                        >
                            Set up your branches in minutes, and let our platform manage your customer wait times with breathtaking, high-efficiency workflows.
                        </motion.p>

                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={fadeUp}
                            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
                            className="mt-8 flex flex-wrap items-center gap-4"
                        >
                            <Link
                                to="/register"
                                className="inline-flex items-center justify-center bg-[#1a1c23] hover:bg-black text-white text-[15px] font-semibold px-8 py-3.5 rounded-full transition-all duration-200 shadow-sm"
                            >
                                Start Managing
                            </Link>
                            <Link
                                to="/features"
                                className="inline-flex items-center justify-center bg-white text-[#1a1c23] border border-gray-200 text-[15px] font-semibold px-8 py-3.5 rounded-full hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm"
                            >
                                Explore Features
                            </Link>
                        </motion.div>

                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={fadeUp}
                            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                            className="mt-10 flex items-center gap-4 text-sm text-[#6b7280] font-medium"
                        >
                            <div className="flex -space-x-2 shrink-0">
                                <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center overflow-hidden"><img src="https://i.pravatar.cc/100?img=33" alt="user" className="w-full h-full object-cover" /></div>
                                <div className="w-10 h-10 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center overflow-hidden"><img src="https://i.pravatar.cc/100?img=47" alt="user" className="w-full h-full object-cover" /></div>
                                <div className="w-10 h-10 rounded-full bg-gray-400 border-2 border-white flex items-center justify-center overflow-hidden"><img src="https://i.pravatar.cc/100?img=12" alt="user" className="w-full h-full object-cover" /></div>
                                <div className="w-10 h-10 rounded-full bg-gray-500 border-2 border-white flex items-center justify-center overflow-hidden"><img src="https://i.pravatar.cc/100?img=68" alt="user" className="w-full h-full object-cover" /></div>
                            </div>
                            <span className="max-w-[200px] leading-snug">Join with <strong>2100+ Users</strong> and start managing queues now</span>
                        </motion.div>
                    </div>

                    {/* Right Column: Visual Masonry Grid w/ Real Images */}
                    <div className="w-full lg:w-[55%] h-[480px] lg:h-[550px] relative overflow-hidden hidden md:block rounded-l-3xl">
                         <div className="absolute right-0 top-0 h-full w-[110%] flex gap-4 lg:gap-5 px-4 transform -rotate-1 scale-105 origin-center">
                             
                             {/* Column 1 */}
                             <div className="flex flex-col gap-4 lg:gap-5 w-1/3 h-[120%] translate-y-4">
                                  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="w-full rounded-2xl h-[45%] overflow-hidden relative shadow-sm border border-gray-100">
                                        <img src="https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=500&q=80" alt="Customer Service" className="w-full h-full object-cover" />
                                  </motion.div>
                                  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="w-full bg-[#1a1c23] rounded-2xl h-[55%] overflow-hidden relative p-5 shadow-xl flex flex-col justify-end">
                                      <div className="mb-auto">
                                          <div className="w-10 h-10 rounded-full bg-[#0a5c4e] text-[#78d64b] flex items-center justify-center mb-4">
                                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                                          </div>
                                      </div>
                                      <h3 className="text-white font-bold text-lg leading-tight mb-2">Automated Tokens</h3>
                                      <p className="text-gray-400 text-xs">Seamless self-service kiosk workflows.</p>
                                  </motion.div>
                             </div>

                             {/* Column 2 */}
                             <div className="flex flex-col gap-4 lg:gap-5 w-1/3 h-[120%] -translate-y-8">
                                  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="w-full rounded-2xl h-[60%] overflow-hidden relative shadow-md">
                                        <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=500&q=80" alt="Modern Waiting Area" className="w-full h-full object-cover" />
                                  </motion.div>
                                  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="w-full rounded-2xl h-[40%] overflow-hidden relative shadow-sm border border-gray-100">
                                        <img src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=500&q=80" alt="Happy Customer" className="w-full h-full object-cover" />
                                  </motion.div>
                             </div>

                             {/* Column 3 */}
                             <div className="flex flex-col gap-4 lg:gap-5 w-1/3 h-[120%] translate-y-12">
                                  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }} className="w-full bg-[#78d64b] rounded-2xl h-[35%] overflow-hidden relative shadow-sm flex items-center justify-center p-6 text-center">
                                       <div>
                                            <span className="block text-4xl lg:text-5xl font-black text-[#074b42] tracking-tighter">98%</span>
                                            <span className="block text-[10px] font-bold text-[#0a5c4e] mt-2 uppercase tracking-widest">Efficiency</span>
                                       </div>
                                  </motion.div>
                                  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8 }} className="w-full rounded-2xl h-[65%] overflow-hidden relative shadow-lg bg-gray-100">
                                        <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=500&q=80" alt="Dashboard Analytics" className="w-full h-full object-cover" />
                                  </motion.div>
                             </div>

                         </div>
                    </div>

                </div>

                {/* Brand logos strip */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                    className="mt-12 lg:mt-16 w-full pt-8 border-t border-gray-200 flex flex-col items-center justify-center gap-4 hidden sm:flex"
                >
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Trusted by industry leaders</p>
                    <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
                        {trusted.map((name, i) => (
                            <span key={i} className="text-lg md:text-xl font-bold tracking-tight text-[#d1d5db] select-none opacity-80">
                                {name}
                            </span>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
