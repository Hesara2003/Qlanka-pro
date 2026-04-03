import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function TestimonialsSection() {
    const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
    const fadeUp = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0 }
    };

    const plans = [
        {
            name: "Starter",
            tag: "Free",
            price: "$0",
            sub: "Forever free",
            desc: "Perfect for small branches getting started with queue management.",
            features: ["Up to 100 tokens/day", "Basic queue tracking", "1 branch", "Email support", "3 months data retention"],
            cta: "Get Started",
            highlighted: false,
            dark: false,
        },
        {
            name: "Standard",
            tag: "Most Popular",
            price: billing === "monthly" ? "$50" : "$40",
            sub: billing === "monthly" ? "/month, billed monthly" : "/month, billed yearly",
            desc: "For growing teams that need real-time insights and multi-branch control.",
            features: ["Unlimited tokens/day", "Advanced analytics", "Up to 10 branches", "Priority support", "Unlimited data"],
            cta: "Get Started",
            highlighted: true,
            dark: false,
        },
        {
            name: "Enterprise",
            tag: "Best Value",
            price: billing === "monthly" ? "$200" : "$160",
            sub: billing === "monthly" ? "/month, billed monthly" : "/month, billed yearly",
            desc: "For large organizations needing full control and dedicated infrastructure.",
            features: ["Everything in Standard", "Unlimited branches", "Custom counter builder", "CRM & SMS integration", "Dedicated onboarding"],
            cta: "Contact Sales",
            highlighted: false,
            dark: true,
        },
    ];

    return (
        <section id="pricing" className="py-20 lg:py-28 overflow-hidden font-sans" style={{ background: "linear-gradient(180deg, #fafafa 0%, #ffffff 100%)" }}>
            <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-12">

                {/* Header */}
                <div className="text-center mb-14">
                    <motion.div 
                        initial="hidden" whileInView="visible" viewport={{ once: true }}
                        variants={fadeUp} transition={{ duration: 0.6 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#78d64b]/20 bg-[#78d64b]/5 text-[#078d42] font-medium text-[11px] tracking-wider uppercase mb-5"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#78d64b]" /> Pricing
                    </motion.div>
                    <motion.h2 
                        initial="hidden" whileInView="visible" viewport={{ once: true }}
                        variants={fadeUp} transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-[2.5rem] md:text-[3.5rem] font-medium text-[#1a1c23] leading-[1.05] tracking-tight mb-4"
                    >
                        Simple, Transparent{" "}
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
                            Pricing
                        </span>
                    </motion.h2>
                    <motion.p
                        initial="hidden" whileInView="visible" viewport={{ once: true }}
                        variants={fadeUp} transition={{ duration: 0.6, delay: 0.15 }}
                        className="text-gray-400 text-[15px] mb-8 max-w-md mx-auto leading-relaxed"
                    >
                        Start free. Scale as you grow. No hidden fees.
                    </motion.p>

                    {/* Billing Toggle */}
                    <motion.div
                        initial="hidden" whileInView="visible" viewport={{ once: true }}
                        variants={fadeUp} transition={{ duration: 0.6, delay: 0.2 }}
                        className="inline-flex items-center gap-0.5 bg-gray-100 border border-gray-200 rounded-xl p-1"
                    >
                        {["monthly", "yearly"].map((b) => (
                            <button
                                key={b}
                                onClick={() => setBilling(b as "monthly" | "yearly")}
                                className={`text-[13px] font-medium px-5 py-2 rounded-lg transition-all flex items-center gap-2 ${billing === b ? "bg-white shadow-sm text-[#1a1c23] border border-gray-100" : "text-gray-400 hover:text-gray-600"}`}
                            >
                                {b.charAt(0).toUpperCase() + b.slice(1)}
                                {b === "yearly" && <span className="text-[10px] font-medium text-[#78d64b] bg-[#78d64b]/10 px-1.5 py-0.5 rounded-md">-20%</span>}
                            </button>
                        ))}
                    </motion.div>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
                    {plans.map((plan, i) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
                            className={`relative rounded-[2rem] p-8 flex flex-col transition-all duration-300 ${
                                plan.highlighted 
                                    ? "shadow-[0_20px_60px_rgba(120,214,75,0.2)] scale-[1.02]" 
                                    : "hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
                            } ${plan.dark ? "text-white" : "bg-white border border-gray-100"}`}
                            style={plan.highlighted 
                                ? { background: "linear-gradient(145deg, #78d64b 0%, #5ec941 50%, #4abe8e 100%)", border: "1px solid rgba(120,214,75,0.3)" }
                                : plan.dark 
                                ? { background: "linear-gradient(145deg, #1a1c23 0%, #0f1117 100%)", border: "1px solid rgba(255,255,255,0.06)" }
                                : {}
                            }
                        >
                            {plan.highlighted && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <span className="bg-[#1a1c23] text-white text-[11px] font-medium px-4 py-1 rounded-full shadow-lg">Most Popular</span>
                                </div>
                            )}

                            {/* Tag */}
                            <div className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full w-max mb-6 ${
                                plan.highlighted ? "bg-[#074b42]/15 text-[#074b42]" 
                                : plan.dark ? "bg-white/5 text-gray-400 border border-white/10"
                                : "bg-gray-50 text-gray-500 border border-gray-100"
                            }`}>
                                {plan.tag}
                            </div>

                            {/* Price */}
                            <div className="mb-1">
                                <span className={`text-[3rem] font-medium tracking-tighter leading-none ${plan.highlighted ? "text-[#074b42]" : plan.dark ? "text-white" : "text-[#1a1c23]"}`}>
                                    {plan.price}
                                </span>
                            </div>
                            <p className={`text-[12px] mb-4 ${plan.highlighted ? "text-[#074b42]/60" : plan.dark ? "text-gray-500" : "text-gray-400"}`}>{plan.sub}</p>
                            <p className={`text-[13px] leading-relaxed mb-7 ${plan.highlighted ? "text-[#074b42]/80" : plan.dark ? "text-gray-400" : "text-gray-500"}`}>{plan.desc}</p>

                            {/* Divider */}
                            <div className={`h-px mb-7 ${plan.highlighted ? "bg-[#074b42]/15" : plan.dark ? "bg-white/5" : "bg-gray-100"}`} />

                            {/* Features */}
                            <ul className="space-y-3 mb-8 flex-1">
                                {plan.features.map((f, j) => (
                                    <li key={j} className={`flex items-start gap-3 text-[13px] ${plan.highlighted ? "text-[#074b42]" : plan.dark ? "text-gray-300" : "text-gray-600"}`}>
                                        <div className="mt-0.5 shrink-0">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={plan.highlighted ? "#074b42" : plan.dark ? "#78d64b" : "#78d64b"} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                        </div>
                                        {f}
                                    </li>
                                ))}
                            </ul>

                            {/* CTA */}
                            <Link 
                                to="/register"
                                className={`w-full py-3.5 rounded-xl text-[14px] font-medium transition-all text-center inline-block ${
                                    plan.highlighted 
                                        ? "bg-[#1a1c23] text-white hover:bg-black shadow-sm" 
                                        : plan.dark
                                        ? "text-[#074b42] hover:opacity-90 shadow-sm"
                                        : "bg-gray-50 border border-gray-200 text-[#1a1c23] hover:bg-gray-100"
                                }`}
                                style={plan.dark ? { background: "linear-gradient(135deg, #78d64b, #4abe8e)" } : {}}
                            >
                                {plan.cta}
                            </Link>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom enterprise note */}
                <motion.p
                    initial="hidden" whileInView="visible" viewport={{ once: true }}
                    variants={fadeUp} transition={{ duration: 0.6, delay: 0.5 }}
                    className="text-center text-[13px] text-gray-400 mt-8"
                >
                    All plans include a 14-day free trial. No credit card required.
                </motion.p>

            </div>
        </section>
    );
}
