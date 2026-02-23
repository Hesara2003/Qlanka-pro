import Navbar from "../components/landing/Navbar";
import HeroSection from "../components/landing/HeroSection";
import FeatureShowcase from "../components/landing/FeatureShowcase";
import BentoGrid from "../components/landing/BentoGrid";
import IntegrationsSection from "../components/landing/IntegrationsSection";
import TestimonialsSection from "../components/landing/TestimonialsSection";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 overflow-x-hidden selection:bg-blue-100 selection:text-blue-900">

            <Navbar />

            <HeroSection />

            {/* Main Content Area */}
            <main>
                <FeatureShowcase />
                <BentoGrid />
                <IntegrationsSection />
                <TestimonialsSection />
            </main>

        </div>
    );
}
