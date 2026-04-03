import { useRef } from "react";
import { motion } from "framer-motion";
import { Monitor, Smartphone, Tv } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

export default function SurfaceAgentsSection() {
    const sectionRef = useRef<HTMLElement>(null);
    const textRef = useRef<HTMLDivElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: sectionRef.current,
                start: "top 80%",
                toggleActions: "play none none reverse",
            }
        });

        // Text Content Sequence
        tl.fromTo(".reveal-item",
            { x: 40, opacity: 0 },
            {
                x: 0,
                opacity: 1,
                duration: 0.8,
                stagger: 0.15,
                ease: "power3.out"
            }
        )
            .fromTo(cardRef.current,
                { x: -60, y: 40, rotateY: -15, opacity: 0, scale: 0.9 },
                {
                    x: 0,
                    y: 0,
                    rotateY: 0,
                    opacity: 1,
                    scale: 1,
                    duration: 1.2,
                    ease: "expo.out"
                }, "-=0.6");

        // Subtle Parallax for the card
        gsap.to(cardRef.current, {
            y: -30,
            scrollTrigger: {
                trigger: sectionRef.current,
                start: "top bottom",
                end: "bottom top",
                scrub: 1.5,
            }
        });

    }, { scope: sectionRef });

    return (
        <section ref={sectionRef} className="py-24 lg:py-48 bg-transparent overflow-hidden font-sans relative">
            <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
                <div className="flex flex-col lg:flex-row-reverse items-center gap-16 lg:gap-24">

                    {/* Right: Text Content */}
                    <div ref={textRef} className="flex-1 max-w-xl">
                        <div className="reveal-item inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-10 shadow-soft">
                            Inter-Device Sync
                        </div>
                        <h2 className="reveal-item text-[2.8rem] md:text-[4.2rem] font-medium text-white leading-[0.98] tracking-tighter mb-10">
                            Seamless Cross-Device <br />
                            <span className="font-serif italic text-white/40">Control</span>
                        </h2>
                        <p className="reveal-item text-[17px] md:text-[20px] text-gray-400 leading-relaxed font-normal">
                            Synchronized queue management across your counter terminals, digital displays, and manager consoles for a unified branch experience.
                        </p>
                    </div>

                    {/* Left: High-Fidelity Command Card */}
                    <div className="flex-1 w-full relative">
                        <motion.div
                            ref={cardRef}
                            animate={{ y: [0, 12, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                            className="bg-gray-950 rounded-[2.5rem] border border-white/5 shadow-[0_50px_100px_-20px_rgba(30,58,138,0.3)] p-10 md:p-12 relative z-10 overflow-hidden noise-overlay"
                        >
                            {/* Command Header: Branch Sync Status */}
                            <div className="flex items-center justify-between mb-10">
                                <div className="flex items-center gap-4">
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                            <Monitor size={12} className="text-gray-400" />
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                            <Smartphone size={12} className="text-gray-400" />
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                            <Tv size={12} className="text-gray-400" />
                                        </div>
                                    </div>
                                    <div className="h-4 w-px bg-white/10" />
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Active Channels</span>
                                </div>
                                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6] animate-pulse" />
                            </div>

                            {/* Command Center Interaction */}
                            <div className="bg-white/5 rounded-[2rem] border border-white/10 p-8 md:p-10 relative z-20 group hover:border-[#78d64b]/30 transition-all duration-500">
                                <div className="space-y-8">
                                    <div className="text-[18px] md:text-[22px] text-gray-500 font-medium">
                                        Issue token, # for branch...<span className="animate-pulse">|</span>
                                    </div>
                                    <div className="flex items-center justify-between pt-8 border-t border-white/5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 group-hover:text-[#78d64b] transition-colors">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                                            </div>
                                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] font-bold text-gray-500">
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9" /></svg>
                                                Dispatch
                                            </div>
                                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-[11px] font-bold text-white">
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9" /></svg>
                                                Enterprise
                                            </div>
                                        </div>
                                        <button className="w-12 h-12 rounded-full bg-[#78d64b] flex items-center justify-center text-white shadow-lg shadow-[#78d64b]/20 hover:scale-105 transition-transform active:scale-95 group-hover:shadow-[0_0_20px_#78d64b55]">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Background Mesh Glow */}
                            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
                        </motion.div>

                    </div>

                </div>
            </div>
        </section>
    );
}
