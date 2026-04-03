import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import phoneMockup from "../../assets/auth/phone_mockup.png";

const trusted = ["Stripe", "Linear", "Vercel", "Figma", "Loom", "Notion"];

export default function HeroSection() {
    return (
        <section id="home" className="relative w-full overflow-hidden font-sans" style={{ background: "linear-gradient(160deg, #0f1117 0%, #111827 50%, #0d1f10 100%)" }}>
            {/* Mesh gradient blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] rounded-full opacity-20" style={{ background: "radial-gradient(circle, #78d64b 0%, transparent 70%)", filter: "blur(80px)" }} />
                <div className="absolute bottom-[-30%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-10" style={{ background: "radial-gradient(circle, #4abe8e 0%, transparent 70%)", filter: "blur(100px)" }} />
                <div className="absolute top-[30%] right-[20%] w-[400px] h-[400px] rounded-full opacity-10" style={{ background: "radial-gradient(circle, #78d64b 0%, transparent 70%)", filter: "blur(80px)" }} />
            </div>

            {/* Grid dot pattern overlay */}
            <div className="absolute inset-0 bg-grid-dots opacity-30 pointer-events-none" />

            {/* Top border glow */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#78d64b]/40 to-transparent" />

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
                        <span className="text-[#78d64b] hover:underline cursor-pointer">Learn more →</span>
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
                    className="text-center text-gray-400 text-[17px] leading-relaxed max-w-[520px] mx-auto mb-10"
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
                        className="inline-flex items-center gap-2 text-[14px] font-medium px-6 py-3 rounded-xl text-[#074b42] transition-all duration-200 shadow-lg shadow-[#78d64b]/25 hover:shadow-[#78d64b]/40 hover:scale-[1.02] active:scale-[0.98]"
                        style={{ background: "linear-gradient(135deg, #78d64b 0%, #5ec941 100%)" }}
                    >
                        Get Started Free
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
                    </Link>
                    <Link
                        to="#features"
                        className="inline-flex items-center gap-2 text-[14px] font-medium px-6 py-3 rounded-xl text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200"
                    >
                        View Demo
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none"/></svg>
                    </Link>
                </motion.div>

                {/* Social proof */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="flex items-center justify-center gap-3 mb-16"
                >
                    <div className="flex -space-x-2">
                        {["33","47","12","55","68"].map((id, i) => (
                            <img key={i} src={`https://i.pravatar.cc/100?img=${id}`} alt="" className="w-7 h-7 rounded-full border-2 border-[#1a1c23] object-cover" />
                        ))}
                    </div>
                    <div className="flex items-center gap-1.5 text-[13px] text-gray-400">
                        <span className="text-[#78d64b] font-medium">★★★★★</span>
                        <span className="font-medium text-white">4.9</span>
                        from <span className="font-medium text-white">2,300+</span> users
                    </div>
                </motion.div>

                {/* Phone mockup — positioned to bleed into next section */}
                <motion.div
                    initial={{ opacity: 0, y: 60, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 1, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="flex justify-center relative"
                >
                    {/* Phone glow */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(120,214,75,0.2) 0%, transparent 70%)", filter: "blur(20px)" }} />
                    
                    {/* Frame */}
                    <div className="relative w-[300px] lg:w-[360px]">
                        {/* Floating stats card — top left */}
                        <motion.div
                            animate={{ y: [0, -6, 0] }}
                            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                            className="absolute -left-16 top-16 bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl px-4 py-3 shadow-xl z-20"
                        >
                            <div className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mb-1">Wait Time</div>
                            <div className="text-xl font-medium text-white">~12 <span className="text-[13px] text-gray-400">min</span></div>
                            <div className="flex items-center gap-1 mt-1">
                                <span className="text-[10px] text-[#78d64b] font-medium">↓ 40%</span>
                                <span className="text-[10px] text-gray-500">vs last week</span>
                            </div>
                        </motion.div>

                        {/* Floating stats card — top right */}
                        <motion.div
                            animate={{ y: [0, -8, 0] }}
                            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                            className="absolute -right-16 top-8 bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl px-4 py-3 shadow-xl z-20"
                        >
                            <div className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mb-1">Tokens Today</div>
                            <div className="text-xl font-medium text-white">1,248</div>
                            <div className="flex items-center gap-1 mt-1">
                                <span className="text-[10px] text-[#78d64b] font-medium">↑ 12%</span>
                                <span className="text-[10px] text-gray-500">vs yesterday</span>
                            </div>
                        </motion.div>

                        <img 
                            src={phoneMockup} 
                            alt="QueueLanka app showing queue management dashboard" 
                            className="w-full h-auto relative z-10 drop-shadow-[0_40px_60px_rgba(0,0,0,0.5)]"
                        />
                    </div>
                </motion.div>
            </div>

            {/* Bottom fade into white */}
            <div className="relative z-10 h-24" style={{ background: "linear-gradient(to bottom, transparent, #fff)" }} />

            {/* Trusted by section — overlapping */}
            <div className="relative z-10 bg-white pb-12 pt-4 border-b border-gray-100">
                <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-12">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-10">
                        <span className="text-[11px] font-medium text-gray-300 uppercase tracking-[0.15em] whitespace-nowrap shrink-0">Trusted by teams at</span>
                        <div className="flex flex-wrap items-center justify-center gap-8">
                            {trusted.map((name, i) => (
                                <span key={i} className="text-[15px] font-medium tracking-tight text-gray-300 select-none hover:text-gray-500 transition-colors cursor-default">
                                    {name}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
