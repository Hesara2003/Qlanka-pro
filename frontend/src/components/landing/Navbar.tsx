import { Link } from "react-router-dom";

export default function Navbar() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">

                    {/* Logo Section */}
                    <div className="flex-shrink-0 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <span className="font-bold text-xl text-gray-900 tracking-tight">QueueLanka</span>
                    </div>

                    {/* Center Navigation Links */}
                    <div className="hidden md:flex space-x-8">
                        <a href="#features" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">Features</a>
                        <a href="#solutions" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">Solutions</a>
                        <a href="#resources" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">Resources</a>
                        <a href="#pricing" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">Pricing</a>
                    </div>

                    {/* Right CTA Buttons */}
                    <div className="flex items-center space-x-4">
                        <Link to="/login" className="text-gray-600 hover:text-gray-900 text-sm font-semibold transition-colors">
                            Sign in
                        </Link>
                        <Link to="/register" className="bg-white border border-gray-200 text-gray-900 hover:bg-gray-50 text-sm font-semibold py-2 px-4 rounded-full shadow-sm transition-all duration-200">
                            Get demo
                        </Link>
                    </div>

                </div>
            </div>
        </nav>
    );
}
