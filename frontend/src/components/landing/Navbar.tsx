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
            className="fixed top-0 left-0 right-0 z-50 bg-[#fcfcfc]/80 backdrop-blur-md border-b border-gray-100 flex justify-center py-4"
        >
            <nav className="w-full max-w-6xl flex items-center justify-between px-4 sm:px-6 lg:px-8">
                
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-[#78d64b] flex items-center justify-center">
                        {/* Hirsland-like icon */}
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
                            className={`text-sm font-semibold transition-colors ${item === 'Home' ? 'text-gray-900 border-b-2 border-[#78d64b] pb-1' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            {item}
                        </a>
                    ))}
                </div>

                {/* Right side */}
                <div className="flex items-center gap-4">
                    <Link
                        to="/login"
                        className="hidden md:inline-flex items-center justify-center text-sm font-semibold px-6 py-2.5 rounded-full bg-[#1a1c23] text-white hover:bg-black transition-colors"
                    >
                        Log In
                    </Link>
                    
                    {/* Mobile hamburger */}
                    <button
                        className="md:hidden p-1.5 rounded-full text-gray-900 hover:bg-gray-100 transition-colors"
                        onClick={() => setMenuOpen(!menuOpen)}
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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
                <div className="absolute top-[100%] left-0 right-0 bg-white border-b border-gray-100 p-4 flex flex-col gap-2 shadow-lg">
                    {["Home", "Features", "Pricing", "Testimonials"].map((item) => (
                        <a
                            key={item}
                            href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                            className="text-base font-semibold text-gray-600 hover:text-gray-900 px-4 py-2 hover:bg-gray-50 rounded-lg"
                            onClick={() => setMenuOpen(false)}
                        >
                            {item}
                        </a>
                    ))}
                    <div className="border-t border-gray-100 pt-3 mt-2 px-4">
                        <Link to="/login" className="w-full inline-flex justify-center text-sm font-semibold bg-[#1a1c23] text-white px-4 py-3 rounded-xl hover:bg-black transition-colors" onClick={() => setMenuOpen(false)}>Log In</Link>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
