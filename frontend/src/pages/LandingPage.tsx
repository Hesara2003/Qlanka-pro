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

    // Background morphing & Void Matte Transformation
    useGSAP(() => {
        // No background morphing or spotlight for Void Matte look
    }, { scope: containerRef });

    return (
        <div ref={containerRef} className="min-h-screen bg-[#050b07] font-sans text-white overflow-x-hidden selection:bg-[#78d64b]/30 selection:text-white transition-colors duration-1000">
            {/* Global Grain Overlay - Balanced Matte Finish */}
            <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.11] mix-blend-soft-light" 
                 style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

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
