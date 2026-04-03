import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [activeNav, setActiveNav] = useState("Home");
    const navRef = useRef<HTMLDivElement>(null);

    const navItems = ["Home", "Features", "Pricing", "Testimonials"];

    useGSAP(() => {
        gsap.from(navRef.current, {
            y: -20,
            opacity: 0,
            duration: 1,
            ease: "power4.out",
            delay: 0.2
        });
    }, { scope: navRef });

    return (
        <div ref={navRef} className="fixed top-8 left-0 right-0 z-50 flex justify-center px-4 md:px-8 pointer-events-none">
            <div className="relative w-full max-w-6xl pointer-events-auto">
                <nav className="flex items-center justify-between px-8 py-3 bg-[#0b0c10] border border-white/5 rounded-full shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.05)_inset]">
                    
                    {/* Logo (Left) */}
                    <Link to="/" className="flex items-center flex-shrink-0">
                        <span className="font-bold text-[14px] text-white tracking-widest uppercase">QueueLanka</span>
                    </Link>

                    {/* Right-aligned cluster */}
                    <div className="flex items-center gap-2">
                        {/* Nav Items */}
                        <div className="hidden md:flex items-center mr-4">
                            {navItems.map((item) => (
                                <a
                                    key={item}
                                    href={`#${item.toLowerCase()}`}
                                    onClick={() => setActiveNav(item)}
                                    className={`relative text-[13px] font-medium px-4 py-2 transition-all duration-300 ${
                                        activeNav === item 
                                            ? 'text-white' 
                                            : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    {item}
                                    {activeNav === item && (
                                        <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-white rounded-full" />
                                    )}
                                </a>
                            ))}
                        </div>

                        {/* CTAs */}
                        <div className="flex items-center gap-1">
                            <Link to="/login" className="hidden md:inline-flex items-center text-[13px] font-medium text-gray-400 hover:text-white px-4 py-2 transition-colors">
                                Sign in
                            </Link>
                            <Link
                                to="/register"
                                className="inline-flex items-center justify-center text-[13px] font-bold px-6 py-2.5 rounded-full bg-[#78d64b] text-[#074b42] hover:bg-[#a3e635] transition-all active:scale-95 shadow-lg shadow-[#78d64b]/20"
                            >
                                Get Started
                            </Link>
                        </div>
                        
                        {/* Mobile hamburger */}
                        <button
                            className="md:hidden w-10 h-10 flex items-center justify-center rounded-full text-gray-400 bg-white/5 hover:bg-white/10 transition-colors ml-2"
                            onClick={() => setMenuOpen(!menuOpen)}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                {menuOpen
                                    ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
                                    : <><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /></>
                                }
                            </svg>
                        </button>
                    </div>
                </nav>

                {/* Mobile dropdown */}
                {menuOpen && (
                    <div className="absolute top-[calc(100%+16px)] left-0 right-0 bg-[#0b0c10]/98 backdrop-blur-3xl border border-white/5 p-4 flex flex-col gap-2 shadow-[0_45px_70px_-15px_rgba(0,0,0,0.9)] rounded-[2.5rem] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                        {navItems.map((item) => (
                            <a
                                key={item}
                                href={`#${item.toLowerCase()}`}
                                className="text-[14px] font-medium text-gray-400 hover:text-white px-6 py-4 hover:bg-white/5 rounded-2xl transition-colors"
                                onClick={() => setMenuOpen(false)}
                            >
                                {item}
                            </a>
                        ))}
                        <div className="pt-4 border-t border-white/5 mt-2">
                            <Link to="/register" className="w-full inline-flex justify-center text-[14px] font-bold bg-[#78d64b] text-[#074b42] px-6 py-4 rounded-full hover:bg-[#a3e635] transition-colors" onClick={() => setMenuOpen(false)}>Get Started</Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
