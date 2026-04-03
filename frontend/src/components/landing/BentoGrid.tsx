import { motion } from "framer-motion";

export default function BentoGrid() {
    const fadeUp = {
        hidden: { opacity: 0, y: 40 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <section id="features" className="py-20 lg:py-28 bg-white overflow-hidden font-sans">
            <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-12">

                {/* Section Header */}
                <div className="text-center mb-14">
                    <motion.div 
                        initial="hidden" whileInView="visible" viewport={{ once: true }}
                        variants={fadeUp} transition={{ duration: 0.6 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#78d64b]/20 bg-[#78d64b]/5 text-[#078d42] font-medium text-[11px] tracking-wider uppercase mb-5"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#78d64b]" /> Key Features
                    </motion.div>
                    <motion.h2 
                        initial="hidden" whileInView="visible" viewport={{ once: true }}
                        variants={fadeUp} transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-[2.5rem] md:text-[3.5rem] font-medium text-[#1a1c23] leading-[1.05] tracking-tight"
                    >
                        Explore Our Standout{" "}
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
                            Features
                        </span>
                    </motion.h2>
                </div>

                {/* Bento Grid — premium dark inset container */}
                <div className="rounded-[2.5rem] border border-gray-100 p-1.5 shadow-[0_2px_40px_rgba(0,0,0,0.06)]" style={{ background: "linear-gradient(145deg, #f9fafb 0%, #ffffff 100%)" }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">

                        {/* Card 1: Tall left card */}
                        <motion.div 
                            initial="hidden" whileInView="visible" viewport={{ once: true }}
                            variants={fadeUp} transition={{ duration: 0.6, delay: 0.2 }}
                            className="lg:row-span-2 group rounded-[2rem] bg-white p-8 flex flex-col justify-between min-h-[380px] border border-gray-100/80 hover:border-[#78d64b]/20 hover:shadow-[0_8px_30px_rgba(120,214,75,0.08)] transition-all duration-300 relative overflow-hidden"
                        >
                            {/* Top glow on hover */}
                            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: "radial-gradient(circle, rgba(120,214,75,0.1) 0%, transparent 70%)" }} />

                            <div>
                                <div className="w-11 h-11 bg-gradient-to-br from-[#78d64b]/15 to-[#4abe8e]/10 rounded-2xl flex items-center justify-center mb-6 border border-[#78d64b]/10">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#78d64b" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                                </div>
                                <h3 className="text-[18px] font-medium text-[#1a1c23] mb-3 tracking-tight">Easy Token Issuance</h3>
                                <p className="text-[13px] text-gray-400 leading-relaxed">Create and manage branch counters in minutes. Serve the right customer at the right time — effortlessly.</p>
                            </div>

                            {/* Mini UI */}
                            <div className="mt-6 space-y-2">
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Current Token</span>
                                        <span className="text-[10px] bg-[#78d64b]/10 text-[#078d42] px-2 py-0.5 rounded-full font-medium">Live</span>
                                    </div>
                                    <div className="text-3xl font-medium text-[#1a1c23] tracking-tighter">A-104</div>
                                    <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <motion.div 
                                            className="h-full rounded-full" 
                                            style={{ background: "linear-gradient(90deg, #78d64b, #4abe8e)" }}
                                            initial={{ width: "0%" }}
                                            whileInView={{ width: "65%" }}
                                            transition={{ duration: 1.2, delay: 0.5 }}
                                        />
                                    </div>
                                    <p className="text-[11px] text-gray-400 mt-2">65% capacity used today</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Card 2: Smart Queue Goals */}
                        <motion.div 
                            initial="hidden" whileInView="visible" viewport={{ once: true }}
                            variants={fadeUp} transition={{ duration: 0.6, delay: 0.3 }}
                            className="lg:col-span-2 group rounded-[2rem] bg-white p-8 border border-gray-100/80 hover:border-[#78d64b]/20 hover:shadow-[0_8px_30px_rgba(120,214,75,0.08)] transition-all duration-300 flex flex-col md:flex-row gap-8"
                        >
                            <div className="flex-1">
                                <div className="w-11 h-11 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center mb-6 border border-blue-100/50">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                                </div>
                                <h3 className="text-[18px] font-medium text-[#1a1c23] mb-3 tracking-tight">Smart Queue Goals</h3>
                                <p className="text-[13px] text-gray-400 leading-relaxed max-w-sm">Set specific queue targets and track progress towards them with real-time analytics dashboards.</p>
                            </div>
                            <div className="flex flex-col gap-2.5 md:w-[260px] shrink-0">
                                {[
                                    { label: "Reduce Wait Time", val: "-40%", color: "#78d64b", bg: "rgba(120,214,75,0.06)", border: "rgba(120,214,75,0.12)" },
                                    { label: "Daily Tokens Target", val: "1,250", color: "#6366f1", bg: "rgba(99,102,241,0.06)", border: "rgba(99,102,241,0.12)" },
                                    { label: "Avg. Service Time", val: "3.2m", color: "#f59e0b", bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.12)" }
                                ].map((item, i) => (
                                    <div key={i} className="rounded-xl p-3.5 flex items-center justify-between" style={{ background: item.bg, border: `1px solid ${item.border}` }}>
                                        <span className="text-[13px] font-medium text-[#1a1c23]">{item.label}</span>
                                        <span className="text-[13px] font-medium" style={{ color: item.color }}>{item.val}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Card 3: Live Status */}
                        <motion.div 
                            initial="hidden" whileInView="visible" viewport={{ once: true }}
                            variants={fadeUp} transition={{ duration: 0.6, delay: 0.4 }}
                            className="group rounded-[2rem] bg-white p-8 border border-gray-100/80 hover:border-[#78d64b]/20 hover:shadow-[0_8px_30px_rgba(120,214,75,0.08)] transition-all duration-300"
                        >
                            <div className="w-11 h-11 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl flex items-center justify-center mb-6 border border-emerald-100/50">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                            </div>
                            <h3 className="text-[18px] font-medium text-[#1a1c23] mb-3 tracking-tight">Live Status Updates</h3>
                            <p className="text-[13px] text-gray-400 leading-relaxed mb-6">Communicate instantly with waiting customers via SMS and live display portals.</p>
                            <div className="space-y-2">
                                <div className="flex items-center gap-3 bg-emerald-50/50 border border-emerald-100 rounded-xl p-3">
                                    <div className="w-2 h-2 rounded-full bg-[#78d64b] animate-pulse" />
                                    <span className="text-[13px] font-medium text-[#1a1c23]">Syncing Live</span>
                                    <span className="text-[11px] text-gray-400 ml-auto">Just now</span>
                                </div>
                                <div className="flex items-center gap-3 bg-gray-50/50 border border-gray-100 rounded-xl p-3">
                                    <div className="w-2 h-2 rounded-full bg-gray-300" />
                                    <span className="text-[13px] text-gray-500">A-103 served</span>
                                    <span className="text-[11px] text-gray-400 ml-auto">2m ago</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Card 4: Analytics — Dark */}
                        <motion.div 
                            initial="hidden" whileInView="visible" viewport={{ once: true }}
                            variants={fadeUp} transition={{ duration: 0.6, delay: 0.5 }}
                            className="group rounded-[2rem] p-8 border transition-all duration-300 relative overflow-hidden flex flex-col justify-between"
                            style={{ background: "linear-gradient(145deg, #1a1c23 0%, #0f1117 100%)", borderColor: "rgba(255,255,255,0.06)" }}
                        >
                            {/* Card glow */}
                            <div className="absolute top-0 right-0 w-40 h-40 pointer-events-none" style={{ background: "radial-gradient(circle at top right, rgba(120,214,75,0.12) 0%, transparent 70%)" }} />

                            <div className="relative z-10">
                                <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-6" style={{ background: "rgba(120,214,75,0.1)", border: "1px solid rgba(120,214,75,0.15)" }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#78d64b" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><path d="M7 8l3 3 2-2 3 3"/></svg>
                                </div>
                                <h3 className="text-[18px] font-medium text-white mb-3 tracking-tight">Analytics Dashboard</h3>
                                <p className="text-[13px] text-gray-500 leading-relaxed">Generate reports and visualizations to optimize operational performance.</p>
                                
                                {/* Mini bar chart */}
                                <div className="mt-6 flex items-end gap-1 h-16">
                                    {[35, 55, 42, 70, 58, 85, 68, 90, 72, 80, 64, 95].map((h, i) => (
                                        <motion.div 
                                            key={i} 
                                            className="flex-1 rounded-t-sm"
                                            style={{ background: i >= 9 ? "linear-gradient(to top, #78d64b, #4abe8e)" : "rgba(120,214,75,0.15)" }}
                                            initial={{ height: 0 }}
                                            whileInView={{ height: `${h}%` }}
                                            transition={{ duration: 0.6, delay: 0.5 + i * 0.05 }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </motion.div>

                    </div>
                </div>
            </div>
        </section>
    );
}
