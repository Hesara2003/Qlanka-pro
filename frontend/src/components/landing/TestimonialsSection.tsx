import { motion } from "framer-motion";

export default function TestimonialsSection() {
    const fadeUp = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <section className="py-20 lg:py-28 bg-[#fcfcfc] overflow-hidden font-sans border-t border-gray-100">
            <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-12">

                {/* Header */}
                <div className="text-center mb-16">
                    <motion.div 
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeUp}
                        transition={{ duration: 0.6 }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-[#0a5c4e] font-semibold text-xs tracking-wider uppercase mb-6 shadow-sm"
                    >
                        <span className="w-2 h-2 rounded-full bg-[#78d64b]"></span> Our Pricing
                    </motion.div>
                    <motion.h2 
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeUp}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-[2.5rem] md:text-[4rem] font-bold text-[#1a1c23] leading-[1.05] tracking-tight"
                    >
                        Flexible Plans That Scale <br />
                        With <span className="text-gray-400 font-normal">Your Goals</span>
                    </motion.h2>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-20 max-w-5xl mx-auto">

                    {/* Starting Plan */}
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="bg-white rounded-[2rem] p-10 lg:p-12 border border-gray-200 shadow-sm flex flex-col hover:shadow-md transition-shadow relative overflow-hidden"
                    >
                        <div className="inline-flex items-center gap-2 bg-gray-100 text-[#1a1c23] text-sm font-bold px-4 py-2 rounded-full mb-8 w-max">
                            Starting Plan
                        </div>
                        <div className="flex items-end gap-1 mb-4">
                            <span className="text-5xl lg:text-6xl font-black text-[#1a1c23] tracking-tighter">$50</span>
                            <span className="text-[#6b7280] pb-2 font-semibold">/Month</span>
                        </div>
                        <p className="text-[#6b7280] text-[17px] mb-10 leading-relaxed max-w-sm">
                            For small branches who want to streamline their queuing with essential tools & simple automation.
                        </p>
                        
                        <button className="w-full bg-white border-2 border-[#1a1c23] text-[#1a1c23] font-bold py-4 rounded-full hover:bg-[#1a1c23] hover:text-white transition-colors mb-10">
                            Get Started
                        </button>

                        <ul className="space-y-4 text-[15px] text-[#4b5563] font-medium">
                            {[
                                "Unlimited token issuing",
                                "Basic queue tracking",
                                "Single branch sync",
                                "In-app notifications",
                                "Email support"
                            ].map((feature, i) => (
                                <li key={i} className="flex items-center gap-4">
                                    <div className="w-6 h-6 rounded-full bg-[#f4f4f5] flex items-center justify-center text-[#1a1c23] shrink-0">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                    </div>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Enterprise Plan */}
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="bg-[#1a1c23] rounded-[2rem] p-10 lg:p-12 shadow-2xl flex flex-col text-white relative overflow-hidden"
                    >
                        <div className="inline-flex items-center gap-2 bg-[#272a35] text-white text-sm font-bold px-4 py-2 rounded-full mb-8 w-max">
                            <span className="w-2 h-2 rounded-full bg-[#78d64b] animate-pulse"></span> Enterprise
                        </div>
                        <div className="flex items-end gap-1 mb-4 relative z-10">
                            <span className="text-5xl lg:text-6xl font-black tracking-tighter text-white">$200</span>
                            <span className="text-gray-400 pb-2 font-semibold">/Month</span>
                        </div>
                        <p className="text-gray-400 text-[17px] mb-10 leading-relaxed max-w-sm relative z-10">
                            Growing organizations needing full control, advanced analytics, and powerful cross-branch features.
                        </p>
                        
                        <button className="w-full bg-[#78d64b] text-[#074b42] font-bold py-4 rounded-full hover:bg-[#68c63b] transition-colors mb-10 relative z-10">
                            Upgrade to Enterprise
                        </button>

                        <ul className="space-y-4 text-[15px] text-gray-300 font-medium relative z-10">
                            {[
                                "Everything in Starting Plan",
                                "Custom counter builder",
                                "Advanced multi-branch dashboard",
                                "Priority support & onboarding",
                                "Integration with CRM & SMS"
                            ].map((feature, i) => (
                                <li key={i} className="flex items-center gap-4">
                                    <div className="w-6 h-6 rounded-full bg-[#373b47] flex items-center justify-center text-[#78d64b] shrink-0">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                    </div>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                </div>

                {/* Bottom Banner Image / Final CTA */}
                <motion.div 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="w-full bg-[#0a5c4e] rounded-[2rem] p-8 lg:p-14 flex flex-col md:flex-row items-center justify-between gap-10 shadow-xl relative overflow-hidden"
                >
                    <div className="absolute inset-0 z-0">
                        <img src="https://images.unsplash.com/photo-1552581234-26160f608093?auto=format&fit=crop&w=1200&q=80" alt="Team meeting" className="w-full h-full object-cover opacity-20 mix-blend-overlay" />
                    </div>

                    <div className="flex-1 max-w-xl relative z-10">
                        <h3 className="text-[2.5rem] font-bold text-white mb-6 leading-tight tracking-tight">
                            Simplify Management <br />
                            <span className="text-[#a0ccbc]">Maximize Your Results</span>
                        </h3>
                        <p className="text-[17px] text-[#a0ccbc] mb-8 leading-relaxed max-w-md border-l-2 border-[#78d64b] pl-5">
                            Streamline your entire queue process with intelligent tools designed to help you make better decisions.
                        </p>
                        <button className="bg-[#78d64b] hover:bg-[#68c63b] text-[#074b42] font-bold px-8 py-4 rounded-full transition-colors shadow-sm">
                            Start Managing Now
                        </button>
                    </div>
                </motion.div>

            </div>
        </section>
    );
}
