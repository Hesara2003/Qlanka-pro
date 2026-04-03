import { useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

export default function AbstractionsSection() {
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
        tl.fromTo(".reveal-text",
            { y: 40, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 0.8,
                stagger: 0.15,
                ease: "power3.out"
            }
        )
            .fromTo(cardRef.current,
                { x: 60, y: 40, rotateY: 15, opacity: 0, scale: 0.9 },
                {
                    x: 0,
                    y: 0,
                    rotateY: 0,
                    opacity: 1,
                    scale: 1,
                    duration: 1.2,
                    ease: "expo.out"
                }, "-=0.6");

    }, { scope: sectionRef });

    return (
        <section ref={sectionRef} className="py-24 lg:py-48 bg-transparent overflow-hidden font-sans relative">
            <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">

                    {/* Left: Text Content */}
                    <div ref={textRef} className="flex-1 max-w-xl">
                        <div className="reveal-text inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-10 shadow-soft">
                            System Oversight
                        </div>
                        <h2 className="reveal-text text-[2.8rem] md:text-[4.2rem] font-medium text-white leading-[0.98] tracking-tighter mb-10">
                            Flow Control <br />
                            <span className="font-serif italic text-white/40">Abstractions</span>
                        </h2>
                        <p className="reveal-text text-[17px] md:text-[20px] text-gray-400 leading-relaxed font-normal">
                            A more intuitive approach to monitoring branch activity, presenting managers with essential queue artifacts and verification results to build operational trust.
                        </p>
                    </div>

                    {/* Right: High-Fidelity Terminal Card */}
                    <div className="flex-1 w-full relative">
                        <motion.div
                            ref={cardRef}
                            animate={{ y: [0, -12, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="bg-gray-950 rounded-[2.5rem] border border-white/5 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] p-10 md:p-12 relative z-10 overflow-hidden noise-overlay"
                        >
                            {/* Terminal Header */}
                            <div className="flex items-center justify-between mb-10">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500/20" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                                    <div className="w-3 h-3 rounded-full bg-[#78d64b]/20" />
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#78d64b] animate-pulse shadow-[0_0_8px_#78d64b]" />
                                    <span className="text-[10px] font-bold text-[#78d64b] uppercase tracking-widest">Live Sync</span>
                                </div>
                            </div>

                            {/* Terminal Body */}
                            <div className="space-y-10">
                                <div>
                                    <h4 className="text-[13px] font-bold text-white/40 mb-3 uppercase tracking-widest">Current Action</h4>
                                    <p className="text-[18px] md:text-[21px] text-white font-medium mb-4 leading-snug">
                                        Activating <span className="text-[#78d64b] opacity-90">Branch_Terminals</span> for retail operations flow.
                                    </p>
                                    <div className="flex flex-wrap gap-2.5">
                                        {['Counter_A', 'Terminal_B', 'Live_Display', 'SMS_Gateway'].map((pkg) => (
                                            <span key={pkg} className="px-3 py-1 rounded-xl bg-white/5 text-gray-400 text-[11px] font-bold border border-white/10 backdrop-blur-md">
                                                {pkg}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-white/5">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="space-y-1">
                                            <span className="text-[13px] font-medium text-white">Establishing WebSocket link</span>
                                            <div className="text-[11px] text-white/30 font-medium tracking-tight">Handshake status [OK] 200ms</div>
                                        </div>
                                        <span className="text-[14px] font-bold text-white/60">82%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden p-[1px] border border-white/10">
                                        <motion.div
                                            initial={{ width: 0 }} whileInView={{ width: "82%" }} transition={{ duration: 1.5, delay: 0.5 }}
                                            className="h-full bg-gradient-to-r from-[#78d64b] to-emerald-400 rounded-full shadow-[0_0_15px_rgba(120,214,75,0.4)]"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Background Mesh Glow */}
                            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-[#78d64b]/15 rounded-full blur-[100px] pointer-events-none" />
                        </motion.div>

                    </div>

                </div>
            </div>
        </section>
    );
}
