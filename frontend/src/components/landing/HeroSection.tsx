import { Link } from "react-router-dom";

export default function HeroSection() {
    return (
        <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32 overflow-hidden flex flex-col items-center justify-center text-center">

            {/* Background Dot Pattern */}
            <div className="absolute inset-0 bg-dot-pattern [mask-image:radial-gradient(ellipse_at_center,white,transparent_80%)] opacity-60 pointer-events-none" />

            {/* Center Main Content */}
            <div className="relative z-20 flex flex-col items-center max-w-3xl mt-12">
                {/* Core Icon / Logo above title */}
                <div className="mb-8 w-16 h-16 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex items-center justify-center border border-gray-100">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#2563EB" />
                        <path d="M2 17L12 22L22 17" fill="#60A5FA" />
                        <path d="M2 12L12 17L22 12" fill="#3B82F6" />
                    </svg>
                </div>

                <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 leading-[1.1]">
                    Think, plan, and track <br className="hidden md:block" />
                    <span className="text-gray-400">all in one place</span>
                </h1>

                <p className="mt-6 text-lg md:text-xl text-gray-600 font-medium">
                    Efficiently manage your tasks and boost productivity.
                </p>

                <div className="mt-10">
                    <Link to="/register" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-8 rounded-xl shadow-[0_8px_20px_rgb(37,99,235,0.3)] transition-all hover:-translate-y-0.5">
                        Get free demo
                    </Link>
                </div>
            </div>

            {/* Floating Widgets Mockups */}

            {/* Top Left: Sticky Note & Checkbox */}
            <div className="absolute top-10 left-[5%] md:left-[10%] xl:left-[15%] hidden md:block w-72 h-64 rotate-[-6deg] transition-transform hover:rotate-0 duration-500 z-10">
                <div className="absolute top-0 right-10 w-48 h-56 bg-[#FFF8CC] rounded-sm shadow-xl p-5 border border-yellow-200/50">
                    {/* Pin */}
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-red-500 shadow-sm z-20" />
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-3 bg-gray-400 z-10" />
                    <p className="font-writing text-gray-800 text-lg leading-snug font-medium handwritten-font">
                        Take notes to keep track of crucial details, and accomplish more tasks with ease.
                    </p>
                </div>

                {/* Floating Checkbox over sticky note */}
                <div className="absolute bottom-10 left-0 w-20 h-20 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] flex items-center justify-center border border-gray-50 transform rotate-12">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                </div>
            </div>

            {/* Top Right: Reminders Calendar */}
            <div className="absolute top-20 right-[5%] md:right-[8%] xl:right-[15%] hidden md:block w-64 h-56 rotate-[4deg] transition-transform hover:rotate-0 duration-500 z-10">
                <div className="w-full h-full bg-white rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.06)] border border-gray-100 p-5 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-900">Reminders</h3>
                        <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-md">Meetings</span>
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <h4 className="font-semibold text-gray-900 text-sm">Today's Meeting</h4>
                        <p className="text-xs text-gray-500 mt-1">Call with marketing team</p>
                        <div className="mt-4 inline-flex items-center gap-1 bg-blue-50 text-blue-600 text-xs font-semibold px-2.5 py-1 rounded-md">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            13:00 - 13:45
                        </div>
                    </div>
                </div>
                {/* Floating Clock Icon */}
                <div className="absolute -top-6 -left-8 w-16 h-16 bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] flex items-center justify-center border border-gray-50 transform -rotate-12">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                </div>
            </div>

            {/* Bottom Left: Tasks List */}
            <div className="absolute bottom-[-20px] left-[5%] md:left-[10%] xl:left-[15%] hidden md:block w-72 bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-gray-100 p-5 rotate-[-2deg] transition-transform hover:rotate-0 duration-500 z-10">
                <h3 className="font-bold text-gray-900 mb-4">Today's tasks</h3>
                <div className="space-y-4">

                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 bg-orange-100 text-orange-600 rounded flex items-center justify-center text-[10px] font-bold">8</div>
                                <span className="text-sm font-semibold text-gray-800">New Ideas for campaign</span>
                            </div>
                            <div className="flex -space-x-2">
                                <div className="w-5 h-5 rounded-full bg-gray-200 border border-white"></div>
                                <div className="w-5 h-5 rounded-full bg-gray-300 border border-white"></div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-400 w-10">Sep 10</span>
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="w-[60%] h-full bg-blue-500 rounded-full"></div>
                            </div>
                            <span className="text-[10px] font-bold text-gray-500">60%</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 bg-green-100 text-green-600 rounded flex items-center justify-center text-[10px] font-bold">3</div>
                                <span className="text-sm font-semibold text-gray-800">Design PPT #4</span>
                            </div>
                            <div className="flex -space-x-2">
                                <div className="w-5 h-5 rounded-full bg-gray-200 border border-white"></div>
                                <div className="w-5 h-5 rounded-full bg-gray-300 border border-white"></div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-400 w-10">Sep 18</span>
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="w-full h-full bg-blue-500 rounded-full"></div>
                            </div>
                            <span className="text-[10px] font-bold text-gray-500">112%</span>
                        </div>
                    </div>

                </div>
            </div>

            {/* Bottom Right: Integrations */}
            <div className="absolute bottom-[20px] right-[5%] md:right-[10%] xl:right-[15%] hidden md:block w-64 bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-gray-100 p-5 rotate-[3deg] transition-transform hover:rotate-0 duration-500 z-10">
                <h3 className="font-bold text-gray-900 mb-4">100+ Integrations</h3>
                <div className="flex items-center gap-3 justify-center">
                    {/* Mocked integration icons visually */}
                    <div className="w-14 h-14 bg-white shadow-md rounded-xl flex items-center justify-center transform -rotate-6">
                        <span className="font-bold text-red-500 text-xl">M</span> {/* Gmail mock */}
                    </div>
                    <div className="w-16 h-16 bg-white shadow-lg rounded-2xl flex items-center justify-center z-10">
                        <span className="font-bold text-green-500 text-2xl">S</span> {/* Slack mock */}
                    </div>
                    <div className="w-14 h-14 bg-white shadow-md rounded-xl flex items-center justify-center transform rotate-6">
                        <span className="font-bold text-blue-500 text-xl">31</span> {/* Calendar mock */}
                    </div>
                </div>
            </div>

        </section>
    );
}
