import { motion } from "framer-motion";

const features = [
    { icon: "📊", title: "Advanced Analytics", desc: "Real-time queue performance insights and reporting dashboards." },
    { icon: "🔔", title: "Smart Notifications", desc: "Automated SMS and in-app alerts that keep customers informed." },
    { icon: "🏢", title: "Multi-Branch Control", desc: "Manage unlimited branches from a single unified dashboard." },
    { icon: "🔐", title: "Enterprise Security", desc: "Role-based access control and audit logs for compliance." },
    { icon: "🔗", title: "CRM Integration", desc: "Sync seamlessly with your existing CRM and workflow tools." },
    { icon: "📋", title: "Custom Counters", desc: "Build custom service counter flows to match your workflow." },
];

export default function IntegrationsSection() {
    const fadeUp = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <section className="py-20 lg:py-28 bg-white relative overflow-hidden font-sans">
            <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-12">

                {/* Header */}
                <div className="text-center mb-14">
                    <motion.div 
                        initial="hidden" whileInView="visible" viewport={{ once: true }}
                        variants={fadeUp} transition={{ duration: 0.6 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#78d64b]/20 bg-[#78d64b]/5 text-[#078d42] font-medium text-[11px] tracking-wider uppercase mb-5"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#78d64b]" /> Everything Included
                    </motion.div>
                    <motion.h2 
                        initial="hidden" whileInView="visible" viewport={{ once: true }}
                        variants={fadeUp} transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-[2.5rem] md:text-[3.5rem] font-medium text-[#1a1c23] leading-[1.05] tracking-tight"
                    >
                        Built for Modern{" "}
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
                            Operations
                        </span>
                    </motion.h2>
                    <motion.p
                        initial="hidden" whileInView="visible" viewport={{ once: true }}
                        variants={fadeUp} transition={{ duration: 0.6, delay: 0.15 }}
                        className="text-gray-400 text-[15px] mt-4 max-w-md mx-auto leading-relaxed"
                    >
                        Everything you need to deliver exceptional customer experiences, right out of the box.
                    </motion.p>
                </div>

                {/* Feature Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto mb-24">
                    {features.map((f, i) => (
                        <motion.div
                            key={i}
                            initial="hidden" whileInView="visible" viewport={{ once: true }}
                            variants={fadeUp} transition={{ duration: 0.5, delay: 0.1 * i }}
                            className="group flex items-start gap-4 p-5 rounded-2xl border border-gray-100 hover:border-[#78d64b]/20 hover:bg-[#78d64b]/[0.02] hover:shadow-[0_4px_20px_rgba(120,214,75,0.06)] transition-all duration-300"
                        >
                            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-lg shrink-0 group-hover:border-[#78d64b]/20 group-hover:bg-[#78d64b]/5 transition-all">
                                {f.icon}
                            </div>
                            <div>
                                <h4 className="font-medium text-[#1a1c23] text-[14px] mb-1">{f.title}</h4>
                                <p className="text-[13px] text-gray-400 leading-relaxed">{f.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* "Experience The Future" — dark premium block */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ duration: 0.8 }}
                    className="rounded-[2.5rem] overflow-hidden relative"
                    style={{ background: "linear-gradient(145deg, #1a1c23 0%, #0f1117 100%)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                    {/* Glow blob */}
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] pointer-events-none" style={{ background: "radial-gradient(circle at top right, rgba(120,214,75,0.12) 0%, transparent 60%)" }} />
                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] pointer-events-none" style={{ background: "radial-gradient(circle at bottom left, rgba(74,190,142,0.08) 0%, transparent 60%)" }} />
                    <div className="absolute inset-0 bg-grid-dots opacity-20 pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12 p-10 lg:p-16">
                        {/* Activity chart card */}
                        <div className="lg:w-1/2 w-full">
                            <div className="rounded-2xl p-6 border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h4 className="font-medium text-white text-[15px]">Queue Activity</h4>
                                        <p className="text-gray-500 text-[12px] mt-0.5">Last 12 hours</p>
                                    </div>
                                    <span className="text-[12px] font-medium text-[#78d64b] bg-[#78d64b]/10 px-3 py-1 rounded-full border border-[#78d64b]/20">▲ 24%</span>
                                </div>
                                <div className="flex items-end gap-1.5 h-24">
                                    {[30, 50, 42, 68, 55, 82, 65, 78, 60, 85, 70, 92].map((h, i) => (
                                        <motion.div 
                                            key={i} 
                                            className="flex-1 rounded-t-md"
                                            style={{ background: i >= 9 ? "linear-gradient(to top, #78d64b, #4abe8e)" : "rgba(120,214,75,0.12)", boxShadow: i >= 9 ? "0 0 12px rgba(120,214,75,0.3)" : "none" }}
                                            initial={{ height: 0 }}
                                            whileInView={{ height: `${h}%` }}
                                            transition={{ duration: 0.7, delay: 0.4 + i * 0.05 }}
                                        />
                                    ))}
                                </div>
                                <div className="flex items-center justify-between mt-4">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-[#78d64b]" />
                                        <span className="text-[11px] text-gray-500">Tokens served</span>
                                    </div>
                                    <span className="text-[11px] text-gray-500">1,248 today</span>
                                </div>
                            </div>
                        </div>

                        {/* Text content */}
                        <div className="lg:w-1/2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#78d64b]/20 bg-[#78d64b]/5 text-[#78d64b] font-medium text-[11px] tracking-wider uppercase mb-6">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#78d64b] animate-pulse" /> Live Data
                            </div>
                            <h3 className="text-[2rem] font-medium text-white tracking-tight leading-[1.15] mb-4">
                                Experience The{" "}
                                <span className="italic" style={{ fontFamily: "'Playfair Display', Georgia, serif", background: "linear-gradient(135deg, #78d64b, #4abe8e)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                                    Future of Queue Management
                                </span>
                            </h3>
                            <p className="text-[14px] text-gray-400 leading-relaxed mb-8 max-w-md">
                                Automate token issuance, track live wait times, and serve customers faster — all from one powerful platform.
                            </p>
                            <ul className="space-y-3 mb-8">
                                {["Reduce wait times by up to 40%", "Real-time queue analytics", "Automated customer notifications"].map((txt, i) => (
                                    <li key={i} className="flex items-center gap-3 text-[13px] text-gray-300">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#78d64b" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                        {txt}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
