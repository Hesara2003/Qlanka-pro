import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import phoneMockup from "../../assets/auth/phone_mockup.png";

const trusted = ["Stripe", "Linear", "Vercel", "Figma", "Loom", "Notion"];

export default function HeroSection() {
    return (
        <section id="home" className="relative w-full overflow-hidden font-sans bg-transparent">
            {/* Cinematic Stage Lighting */}
            <div className="absolute top-0 left-0 w-full h-[120%] pointer-events-none z-0" 
                 style={{ background: "radial-gradient(ellipse at 20% 0%, rgba(120,214,75,0.04) 0%, transparent 70%)" }} />

            {/* Mesh gradient blobs - forest theme */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] rounded-full opacity-[0.06]" style={{ background: "radial-gradient(circle, #78d64b 0%, transparent 70%)", filter: "blur(80px)" }} />
                <div className="absolute bottom-[-30%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-[0.01]" style={{ background: "radial-gradient(circle, #4abe8e 0%, transparent 70%)", filter: "blur(100px)" }} />
            </div>

            <div className="relative z-10 w-full max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-12 pt-32 pb-0">
                
                {/* Announcement badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex justify-center mb-8"
                >
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-[12px] font-medium text-gray-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#78d64b] animate-pulse" />
                        Now with real-time analytics
                        <span className="text-gray-500 mx-1">·</span>
                        <span className="text-[#a3e635] hover:underline cursor-pointer font-bold">Learn more →</span>
                    </div>
                </motion.div>

                {/* Main headline */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                    className="text-center mb-6"
                >
                    <h1 className="text-[3.2rem] sm:text-[4rem] lg:text-[5.5rem] font-medium text-white leading-[1.02] tracking-tight">
                        Manage Your{" "}
                        <span 
                            className="italic" 
                            style={{ 
                                fontFamily: "'Playfair Display', Georgia, serif",
                                background: "linear-gradient(135deg, #78d64b 0%, #4abe8e 50%, #a3e635 100%)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                backgroundClip: "text"
                            }}
                        >
                            Queues
                        </span>
                        <br />
                        With Confidence
                    </h1>
                </motion.div>

                {/* Subheading */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-center text-gray-400 text-[17px] leading-relaxed max-w-[520px] mx-auto mb-10 font-normal"
                >
                    The all-in-one queue management platform. Issue tokens, track wait times, and serve customers efficiently at scale.
                </motion.p>

                {/* CTAs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="flex items-center justify-center gap-3 mb-16"
                >
                    <Link
                        to="/register"
                        className="inline-flex items-center gap-2 text-[14px] font-bold px-7 py-3.5 rounded-full text-[#074b42] transition-all duration-300 shadow-xl shadow-[#78d64b]/20 hover:shadow-[#78d64b]/40 hover:scale-[1.02] active:scale-[0.98]"
                        style={{ background: "linear-gradient(135deg, #78d64b 0%, #a3e635 100%)" }}
                    >
                        Get Started Free
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
                    </Link>
                    <Link
                        to="#features"
                        className="inline-flex items-center gap-2 text-[14px] font-bold px-7 py-3.5 rounded-full text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300 shadow-sm"
                    >
                        View Demo
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none"/></svg>
                    </Link>
                </motion.div>

                {/* Trusted by section */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 mb-16 border-y border-white/5 py-8"
                >
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] whitespace-nowrap shrink-0">Trusted by teams at</span>
                    <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-12">
                        {trusted.map((name, i) => (
                            <span key={i} className="text-[14px] lg:text-[15px] font-bold tracking-tight text-gray-500 select-none hover:text-white transition-colors cursor-default">
                                {name}
                            </span>
                        ))}
                    </div>
                </motion.div>

                {/* Social proof */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="flex items-center justify-center gap-3 mb-16"
                >
                    <div className="flex -space-x-2">
                        {["33","47","12","55","68"].map((id, i) => (
                            <img key={id} src={`https://i.pravatar.cc/100?img=${id}`} alt="" className="w-8 h-8 rounded-full border-2 border-[#08120a] shadow-sm object-cover" />
                        ))}
                    </div>
                    <div className="flex items-center gap-1.5 text-[13px] text-gray-400 font-medium">
                        <span className="text-[#78d64b] font-bold">★★★★★</span>
                        <span className="font-bold text-white">4.9</span>
                        from <span className="font-bold text-white">2,300+</span> users
                    </div>
                </motion.div>

                {/* Phone mockup section */}
                <motion.div
                    initial={{ opacity: 0, y: 60, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 1, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="flex justify-center relative mt-16 lg:mt-20"
                >
                    {/* Phone glow - softened */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(120,214,75,0.15) 0%, transparent 70%)", filter: "blur(60px)" }} />
                    
                    {/* Frame */}
                    <div className="relative w-[360px] lg:w-[560px]">
                        {/* Floating stats card — top left */}
                        <motion.div
                            animate={{ y: [0, -6, 0] }}
                            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                            className="absolute -left-20 lg:-left-40 top-32 lg:top-48 bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl px-5 py-4 shadow-2xl z-20"
                        >
                            <div className="text-[10px] lg:text-[11px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">Wait Time</div>
                            <div className="text-xl lg:text-2xl font-bold text-white">~12 <span className="text-[14px] text-gray-400 font-normal">min</span></div>
                            <div className="flex items-center gap-1.5 mt-1.5">
                                <span className="text-[11px] text-[#78d64b] font-bold">↓ 40%</span>
                                <span className="text-[11px] text-gray-500">vs last week</span>
                            </div>
                        </motion.div>
 
                        {/* Floating stats card — top right */}
                        <motion.div
                            animate={{ y: [0, -8, 0] }}
                            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                            className="absolute -right-20 lg:-right-44 top-20 lg:top-36 bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl px-5 py-4 shadow-2xl z-20"
                        >
                            <div className="text-[10px] lg:text-[11px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">Tokens Today</div>
                            <div className="text-xl lg:text-2xl font-bold text-white">1,248</div>
                            <div className="flex items-center gap-1.5 mt-1.5">
                                <span className="text-[11px] text-[#78d64b] font-bold">↑ 12%</span>
                                <span className="text-[11px] text-gray-500">vs yesterday</span>
                            </div>
                        </motion.div>
 
                        <img 
                            src={phoneMockup} 
                            alt="QueueLanka app dashboard mockup" 
                            className="w-full h-auto relative z-10 drop-shadow-[0_45px_90px_rgba(0,0,0,0.45)]"
                        />
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
