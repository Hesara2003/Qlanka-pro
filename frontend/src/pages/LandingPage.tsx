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

    // Background morphing - now even more subtle forest depth
    useGSAP(() => {
        // Main Background shift
        gsap.to(containerRef.current, {
            backgroundColor: "#081b10", // Deeper forest shift
            scrollTrigger: {
                trigger: "#features",
                start: "top 80%",
                end: "top 20%",
                scrub: 1.5
            }
        });

        // Slow Aurora movement
        gsap.to(".aurora-mist", {
            x: "10%",
            y: "5%",
            duration: 20,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });
    }, { scope: containerRef });

    return (
        <div ref={containerRef} className="min-h-screen bg-[#0a1e14] font-sans text-white overflow-x-hidden selection:bg-[#78d64b]/30 selection:text-white transition-colors duration-1000">
            {/* Emerald Mist - Living background layer */}
            <div className="aurora-mist absolute top-[-20%] left-[-20%] w-[150%] h-[150%] pointer-events-none opacity-[0.08] z-0" 
                 style={{ background: "radial-gradient(circle at center, #78d64b 0%, transparent 60%)", filter: "blur(120px)" }} />

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
