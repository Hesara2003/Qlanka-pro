import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [activeNav, setActiveNav] = useState("Home");

    const navItems = ["Home", "Features", "Pricing", "Testimonials"];

    return (
        <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="fixed top-4 md:top-6 left-0 right-0 z-50 flex justify-center px-4 md:px-8 pointer-events-none"
        >
            <div className="relative w-full max-w-5xl pointer-events-auto">
                <nav className="flex items-center justify-between pl-4 pr-2 py-2 md:pl-7 md:pr-2.5 md:py-2 bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06),0_0_0_1px_rgba(255,255,255,0.5)_inset]">
                    
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#78d64b] to-[#4abe8e] flex items-center justify-center shadow-sm">
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                                <path d="M8 1L1 15H15L8 1Z" fill="white"/>
                            </svg>
                        </div>
                        <span className="font-medium text-[15px] text-[#1a1c23] tracking-tight">QueueLanka</span>
                    </Link>

                    {/* Center Nav Links */}
                    <div className="hidden md:flex items-center gap-0.5 bg-gray-50/80 border border-gray-100 rounded-xl px-1 py-1">
                        {navItems.map((item) => (
                            <a
                                key={item}
                                href={`#${item.toLowerCase()}`}
                                onClick={() => setActiveNav(item)}
                                className={`relative text-[13px] font-medium px-4 py-2 rounded-lg transition-all duration-200 ${
                                    activeNav === item 
                                        ? 'text-[#1a1c23] bg-white shadow-sm border border-gray-100' 
                                        : 'text-gray-400 hover:text-gray-700'
                                }`}
                            >
                                {activeNav === item && (
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-[#78d64b]" />
                                )}
                                <span className={activeNav === item ? "pl-1.5" : ""}>{item}</span>
                            </a>
                        ))}
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-2">
                        <Link to="/login" className="hidden md:inline-flex items-center text-[13px] font-medium text-gray-500 hover:text-gray-900 px-4 py-2 transition-colors">
                            Sign in
                        </Link>
                        <Link
                            to="/register"
                            className="hidden md:inline-flex items-center justify-center text-[13px] font-medium px-5 py-2.5 rounded-xl bg-[#1a1c23] text-white hover:bg-black transition-all shadow-sm"
                        >
                            Get Started
                            <svg className="ml-1.5" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                        </Link>
                        
                        {/* Mobile hamburger */}
                        <button
                            className="md:hidden p-2 rounded-lg text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors"
                            onClick={() => setMenuOpen(!menuOpen)}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                {menuOpen
                                    ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
                                    : <><line x1="3" y1="7" x2="21" y2="7" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="17" x2="21" y2="17" /></>
                                }
                            </svg>
                        </button>
                    </div>
                </nav>

                {/* Mobile dropdown */}
                {menuOpen && (
                    <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white/95 backdrop-blur-xl border border-gray-100 p-3 flex flex-col gap-1 shadow-xl rounded-2xl overflow-hidden">
                        {navItems.map((item) => (
                            <a
                                key={item}
                                href={`#${item.toLowerCase()}`}
                                className="text-[14px] font-medium text-gray-600 hover:text-gray-900 px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors"
                                onClick={() => setMenuOpen(false)}
                            >
                                {item}
                            </a>
                        ))}
                        <div className="pt-2 border-t border-gray-100 mt-1">
                            <Link to="/register" className="w-full inline-flex justify-center text-[14px] font-medium bg-[#1a1c23] text-white px-4 py-3 rounded-xl hover:bg-black transition-colors" onClick={() => setMenuOpen(false)}>Get Started</Link>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
