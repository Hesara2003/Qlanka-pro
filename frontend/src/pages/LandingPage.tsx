import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Navbar from "../components/landing/Navbar";
import HeroSection from "../components/landing/HeroSection";
import AbstractionsSection from "../components/landing/AbstractionsSection";
import SurfaceAgentsSection from "../components/landing/SurfaceAgentsSection";
import DeveloperShowcase from "../components/landing/DeveloperShowcase";
import TestimonialsSection from "../components/landing/TestimonialsSection";
import BannerHighlight from "../components/landing/BannerHighlight";
import BannerMarquee from "../components/landing/BannerMarquee";
import BannerStats from "../components/landing/BannerStats";
import Footer from "../components/landing/Footer";

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
    const containerRef = useRef<HTMLDivElement>(null);

    // Background morphing & Cinematic Lighting
    useGSAP(() => {
        // Main Background shift
        gsap.to(containerRef.current, {
            backgroundColor: "#050b07", // Darker subtle shift for cinematic contrast
            scrollTrigger: {
                trigger: "#features",
                start: "top 80%",
                end: "top 20%",
                scrub: 1.5
            }
        });

        // Cinematic Spotlight Movement - Follow the user down
        gsap.to(".cinematic-spotlight", {
            y: "70vh",
            scrollTrigger: {
                trigger: "main",
                start: "top top",
                end: "bottom bottom",
                scrub: 2
            }
        });

        // Slow Aurora pulse
        gsap.to(".cinematic-spotlight", {
            opacity: 0.08,
            duration: 8,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });
    }, { scope: containerRef });

    return (
        <div ref={containerRef} className="min-h-screen bg-[#0a1e14] font-sans text-white overflow-x-hidden selection:bg-[#78d64b]/30 selection:text-white transition-colors duration-1000">
            {/* Global Grain Overlay - Balanced Matte Finish */}
            <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.11] mix-blend-soft-light" 
                 style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

            {/* Cinematic Spotlight - Focused background beam */}
            <div className="cinematic-spotlight fixed top-[-20%] left-[10%] w-[80vw] h-[80vw] pointer-events-none opacity-[0.05] z-0 rounded-full" 
                 style={{ background: "radial-gradient(circle at center, #78d64b 0%, transparent 65%)", filter: "blur(120px)" }} />

            <Navbar />

            <HeroSection />

            {/* Main Content Area */}
            <main>
                <BannerMarquee />
                <BannerStats />
                <div id="features">
                    <AbstractionsSection />
                </div>
                <SurfaceAgentsSection />
                <div id="testimonials">
                    <DeveloperShowcase />
                </div>
                <TestimonialsSection />
                <div id="pricing">
                    <BannerHighlight />
                </div>
            </main>

            <Footer />

        </div>
    );
}
