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
        <div ref={navRef} className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 md:px-8 pointer-events-none">
            <div className="relative w-full max-w-5xl pointer-events-auto">
                <nav className="flex items-center justify-between pl-6 pr-2 py-2 bg-[#0b0c10]/80 backdrop-blur-2xl border border-white/5 rounded-full shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)_inset]">
                    
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 flex-shrink-0 group">
                        <div className="w-8 h-8 rounded-full bg-[#78d64b] flex items-center justify-center transition-transform duration-500 group-hover:rotate-[360deg] shadow-[0_0_15px_rgba(120,214,75,0.3)]">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#074b42" strokeWidth="3"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                        </div>
                        <span className="font-bold text-[15px] text-white tracking-tighter uppercase mb-[-1px]">QueueLanka</span>
                    </Link>

                    {/* Center Nav Links */}
                    <div className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => (
                            <a
                                key={item}
                                href={`#${item.toLowerCase()}`}
                                onClick={() => setActiveNav(item)}
                                className={`relative text-[12px] font-bold uppercase tracking-widest px-5 py-2.5 rounded-full transition-all duration-300 ${
                                    activeNav === item 
                                        ? 'text-[#78d64b] bg-white/5' 
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                {item}
                                {activeNav === item && (
                                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#78d64b] shadow-[0_0_8px_#78d64b]" />
                                )}
                            </a>
                        ))}
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-3">
                        <Link to="/login" className="hidden md:inline-flex items-center text-[12px] font-bold uppercase tracking-widest text-gray-400 hover:text-white px-4 py-2 transition-colors">
                            Sign in
                        </Link>
                        <Link
                            to="/register"
                            className="hidden md:inline-flex items-center justify-center text-[12px] font-bold uppercase tracking-widest px-6 py-3 rounded-full bg-[#78d64b] text-[#074b42] hover:bg-[#a3e635] transition-all shadow-lg shadow-[#78d64b]/20 active:scale-95"
                        >
                            Get Started
                        </Link>
                        
                        {/* Mobile hamburger */}
                        <button
                            className="md:hidden w-10 h-10 flex items-center justify-center rounded-full text-gray-400 bg-white/5 hover:bg-white/10 transition-colors"
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
                    <div className="absolute top-[calc(100%+12px)] left-0 right-0 bg-[#0b0c10]/95 backdrop-blur-2xl border border-white/5 p-4 flex flex-col gap-2 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] rounded-[2rem] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                        {navItems.map((item) => (
                            <a
                                key={item}
                                href={`#${item.toLowerCase()}`}
                                className="text-[13px] font-bold uppercase tracking-widest text-gray-400 hover:text-[#78d64b] px-5 py-4 hover:bg-white/5 rounded-2xl transition-colors"
                                onClick={() => setMenuOpen(false)}
                            >
                                {item}
                            </a>
                        ))}
                        <div className="pt-4 border-t border-white/5 mt-2">
                            <Link to="/register" className="w-full inline-flex justify-center text-[13px] font-bold uppercase tracking-widest bg-[#78d64b] text-[#074b42] px-6 py-4 rounded-full hover:bg-[#a3e635] transition-colors" onClick={() => setMenuOpen(false)}>Get Started</Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
