import Navbar from "../components/landing/Navbar";
import HeroSection from "../components/landing/HeroSection";
import FeatureShowcase from "../components/landing/FeatureShowcase";
import BentoGrid from "../components/landing/BentoGrid";
import IntegrationsSection from "../components/landing/IntegrationsSection";
import TestimonialsSection from "../components/landing/TestimonialsSection";
import BannerStats from "../components/landing/BannerStats";
import BannerMarquee from "../components/landing/BannerMarquee";
import BannerHighlight from "../components/landing/BannerHighlight";
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
                <FeatureShowcase />
                <BentoGrid />
                <IntegrationsSection />
                <TestimonialsSection />
                <BannerHighlight />
            </main>

            <Footer />

        </div>
    );
}
