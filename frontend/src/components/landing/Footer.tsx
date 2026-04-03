import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Footer() {
    return (
        <footer className="w-full bg-[#07090d] font-sans relative overflow-hidden pt-24 pb-12">
            
            {/* Background Decorative Typography */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none">
                <span className="text-[22vw] font-black text-white/[0.02] tracking-tighter leading-none translate-y-24">
                    QUELANKA
                </span>
            </div>

            <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
                
                {/* Pre-Footer CTA */}
                <div className="mb-32 text-center max-w-3xl mx-auto">
                    <motion.h3 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-[2.5rem] md:text-[3.5rem] font-medium text-white leading-[1.1] tracking-tighter mb-8"
                    >
                        Ready to transform <br className="hidden md:block" /> your branch experience?
                    </motion.h3>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/register" className="h-12 px-8 rounded-full bg-[#78d64b] text-[#074b42] font-bold text-[14px] hover:scale-105 transition-transform flex items-center justify-center min-w-[160px]">
                            Get Started
                        </Link>
                        <Link to="/contact" className="h-12 px-8 rounded-full bg-white/5 border border-white/10 text-white font-medium text-[14px] hover:bg-white/10 transition-all flex items-center justify-center min-w-[160px]">
                            Book a Demo
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-12 lg:gap-24 mb-24 pb-24 border-b border-white/5">
                    
                    {/* Brand Column */}
                    <div className="col-span-2">
                        <Link to="/" className="inline-flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-[#78d64b] flex items-center justify-center">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#074b42" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                            </div>
                            <span className="font-bold text-[20px] text-white tracking-tighter">QUELANKA</span>
                        </Link>
                        <p className="text-[14px] text-gray-500 leading-relaxed max-w-[280px]">
                            The all-in-one queue management platform for modern service centers and high-traffic retail branches.
                        </p>
                    </div>

                    {/* Navigation Columns */}
                    {[
                        { heading: "Product", links: ["Features", "Predictive AI", "Reporting", "API"] },
                        { heading: "Company", links: ["Our Mission", "Success Stories", "Careers", "Contact"] },
                        { heading: "Resources", links: ["Documentation", "Help Center", "Blog", "Security"] },
                    ].map((col) => (
                        <div key={col.heading}>
                            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-8">{col.heading}</h4>
                            <ul className="space-y-4">
                                {col.links.map(item => (
                                    <li key={item}>
                                        <a href="#" className="text-[14px] text-gray-500 hover:text-[#78d64b] transition-colors">{item}</a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Footer Bottom Bar */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-[12px] text-gray-600 font-medium">
                        © {new Date().getFullYear()} QueueLanka Intelligence. All rights reserved.
                    </p>
                    
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#78d64b] shadow-[0_0_8px_#78d64b]" />
                            <span className="text-[10px] font-bold text-[#78d64b] uppercase tracking-widest">Global Status 99.9%</span>
                        </div>
                        <div className="flex items-center gap-5">
                            <a href="#" className="text-gray-600 hover:text-white transition-colors"><svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg></a>
                            <a href="#" className="text-gray-600 hover:text-white transition-colors"><svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg></a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
