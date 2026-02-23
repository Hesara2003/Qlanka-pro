import Navbar from "../components/landing/Navbar";
import HeroSection from "../components/landing/HeroSection";
import FeatureShowcase from "../components/landing/FeatureShowcase";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-[#fafafa] font-sans text-gray-900 overflow-x-hidden selection:bg-blue-100 selection:text-blue-900">
            <Navbar />

            {/* Main Content Area */}
            <main className="pt-20">
                <HeroSection />
                <FeatureShowcase />
            </main>

        </div>
    );
}
