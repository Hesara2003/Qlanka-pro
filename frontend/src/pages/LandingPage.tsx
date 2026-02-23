import Navbar from "../components/landing/Navbar";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-[#fafafa] font-sans text-gray-900 overflow-x-hidden selection:bg-blue-100 selection:text-blue-900">
            <Navbar />

            {/* Main Content Area */}
            <main className="pt-20">
                <section className="min-h-[80vh] flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-5xl font-bold tracking-tight mb-4">Building the Hero Section</h1>
                        <p className="text-gray-500">More updates to follow based on the implementation plan.</p>
                    </div>
                </section>
            </main>

        </div>
    );
}
