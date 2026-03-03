import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="fixed top-4 md:top-6 left-0 right-0 z-50 flex justify-center px-4 md:px-8 pointer-events-none"
        >
            <div className="relative w-full max-w-5xl pointer-events-auto">
                <nav className="flex items-center justify-between pl-5 pr-2 py-2 md:pl-8 md:pr-3 md:py-2.5 bg-white/95 backdrop-blur-lg border border-gray-200/80 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
                    
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-[#78d64b] flex items-center justify-center shadow-sm">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <path d="M12 2L2 22h20L12 2z" fill="white" stroke="none" />
                            </svg>
                        </div>
                        <span className="font-bold text-lg text-gray-900 tracking-tight">QueueLanka</span>
                    </Link>

                    {/* Center Nav Links */}
                    <div className="hidden md:flex items-center gap-8">
                        {["Home", "Features", "Pricing", "Testimonials"].map((item) => (
                            <a
                                key={item}
                                href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                                className={`text-sm font-bold transition-colors ${item === 'Home' ? 'text-[#1a1c23]' : 'text-gray-500 hover:text-[#1a1c23]'}`}
                            >
                                {item}
                            </a>
                        ))}
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-3">
                        <Link
                            to="/login"
                            className="hidden md:inline-flex items-center justify-center text-sm font-bold px-7 py-2.5 rounded-full bg-[#1a1c23] text-white hover:bg-black transition-colors shadow-sm"
                        >
                            Log In
                        </Link>
                        
                        {/* Mobile hamburger */}
                        <button
                            className="md:hidden p-2 rounded-full text-gray-900 bg-gray-50 hover:bg-gray-100 transition-colors"
                            onClick={() => setMenuOpen(!menuOpen)}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                {menuOpen
                                    ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
                                    : <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>
                                }
                            </svg>
                        </button>
                    </div>
                </nav>

                {/* Mobile dropdown */}
                {menuOpen && (
                    <div className="absolute top-[calc(100%+12px)] left-0 right-0 bg-white/95 backdrop-blur-lg border border-gray-100 p-4 flex flex-col gap-2 shadow-xl rounded-[2rem] overflow-hidden">
                        {["Home", "Features", "Pricing", "Testimonials"].map((item) => (
                            <a
                                key={item}
                                href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                                className="text-base font-semibold text-gray-600 hover:text-gray-900 px-5 py-3 hover:bg-gray-50 rounded-xl transition-colors"
                                onClick={() => setMenuOpen(false)}
                            >
                                {item}
                            </a>
                        ))}
                        <div className="pt-2">
                            <Link to="/login" className="w-full inline-flex justify-center text-base font-bold bg-[#1a1c23] text-white px-4 py-4 rounded-xl hover:bg-black transition-colors" onClick={() => setMenuOpen(false)}>Log In</Link>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
