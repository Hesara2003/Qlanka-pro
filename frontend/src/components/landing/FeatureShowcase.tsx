export default function FeatureShowcase() {
    return (
        <section id="solutions" className="py-24 bg-white relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">

                {/* Header Section */}
                <div className="text-center mb-16 max-w-2xl">
                    <span className="inline-block py-1.5 px-4 rounded-full border border-gray-200 text-xs font-semibold text-gray-500 mb-6 bg-white shadow-sm">
                        Solutions
                    </span>
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight leading-tight">
                        Solve your team's <br /> biggest challenges
                    </h2>
                </div>

                {/* Top 3 Features Grid */}
                <div className="grid md:grid-cols-3 gap-10 md:gap-16 w-full max-w-5xl mb-20 relative">
                    {/* Subtle connecting lines behind features (decorative) */}
                    <div className="absolute top-6 left-[15%] right-[15%] h-px bg-gray-100 hidden md:block -z-10" />

                    {/* Feature 1 */}
                    <div className="flex flex-col relative bg-white">
                        <div className="w-10 h-10 mb-4 flex items-center justify-center text-orange-400">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed font-medium">
                            Ensure your team is always on the same page with task sharing and transparent updates.
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="flex flex-col relative bg-white">
                        <div className="w-10 h-10 mb-4 flex items-center justify-center text-orange-400">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed font-medium">
                            Prioritize and manage tasks effectively so your team can focus on what matters most.
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="flex flex-col relative bg-white">
                        <div className="w-10 h-10 mb-4 flex items-center justify-center text-orange-400">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed font-medium">
                            Hold everyone accountable without the need for constant check-ins.
                        </p>
                    </div>
                </div>

                {/* Immersive Dashboard Mockup Section */}
                <div className="w-full relative px-4 lg:px-0">

                    <div className="w-full bg-[#1db5ff] rounded-[2rem] pt-8 px-8 sm:pt-12 sm:px-12 md:pt-16 md:px-16 shadow-[0_20px_50px_rgba(29,181,255,0.2)] overflow-hidden relative group">

                        {/* The white app mockup window */}
                        <div className="w-full bg-white rounded-t-[1.5rem] shadow-2xl border border-gray-100/50 flex flex-col h-[500px] overflow-hidden transform transition-transform duration-700 group-hover:-translate-y-2 relative">

                            {/* App Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white z-10">
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1">
                                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                        <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                    </div>
                                    <div className="ml-4 flex items-center gap-2 text-gray-800 font-bold">
                                        <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle></svg>
                                        </div>
                                        QueueLanka
                                    </div>
                                </div>
                                {/* Fake user profile */}
                                <div className="flex flex-col items-end">
                                    <p className="text-xs font-semibold text-gray-700">Amanda P.</p>
                                    <p className="text-[10px] text-gray-400">Admin</p>
                                </div>
                            </div>

                            {/* App Body Placeholder with subtle dashboard elements drawing */}
                            <div className="flex-1 bg-gray-50 flex p-6 gap-6">
                                {/* Sidebar mock */}
                                <div className="w-48 hidden md:flex flex-col gap-2">
                                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-4"></div>
                                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-3 w-full bg-gray-200 rounded animate-pulse opacity-50"></div>)}
                                </div>
                                {/* Main content area */}
                                <div className="flex-1 flex flex-col gap-6">
                                    <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
                                    <div className="flex gap-4">
                                        {/* Task list mock */}
                                        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                                            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-6"></div>
                                            <div className="space-y-4">
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} className="flex gap-3 items-center">
                                                        <div className="w-4 h-4 rounded border border-gray-300"></div>
                                                        <div className="h-2 flex-1 bg-gray-100 rounded"></div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        {/* Right side widgets */}
                                        <div className="w-1/3 flex flex-col gap-4">
                                            <div className="h-32 bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                                                <div className="text-2xl font-mono font-bold text-gray-800">04:21:58</div>
                                                <div className="text-xs text-gray-400 mt-2">Time tracker</div>
                                            </div>
                                            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-4 relative overflow-hidden">
                                                <div className="absolute top-4 right-4 w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center border-4 border-blue-500">
                                                    <div className="w-8 h-8 rounded-full border-4 border-teal-400"></div>
                                                </div>
                                                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
                                                <div className="text-xl font-bold text-gray-800">29/40</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Floating UI Badges on the dashboard container */}
                    <div className="absolute left-0 lg:-left-6 bottom-32 w-20 h-20 bg-white rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.12)] border border-gray-100 flex items-center justify-center transform -rotate-12 z-20">
                        <span className="text-3xl font-bold text-gray-800 tracking-tighter">20</span>
                    </div>

                    <div className="absolute right-0 lg:-right-6 top-32 w-16 h-16 bg-white rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.12)] border border-gray-100 flex items-center justify-center transform rotate-12 z-20">
                        <div className="w-8 h-8 bg-teal-400 rounded-lg flex items-center justify-center text-white">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
