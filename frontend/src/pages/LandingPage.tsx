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

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 overflow-x-hidden selection:bg-[#78d64b] selection:text-[#074b42]">

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
