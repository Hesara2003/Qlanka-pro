export default function BentoGrid() {
    return (
        <section id="features" className="py-24 bg-[#fafafa] overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">

                {/* Section Header */}
                <div className="text-center mb-16 max-w-2xl">
                    <span className="inline-block py-1.5 px-4 rounded-full border border-gray-200 text-xs font-semibold text-gray-500 mb-6 bg-white shadow-sm">
                        Features
                    </span>
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight leading-tight mb-4">
                        Keep everything in one place
                    </h2>
                    <p className="text-gray-500 font-medium">
                        Forget complex project management tools.
                    </p>
                </div>

                {/* Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 w-full max-w-6xl">

                    {/* Top Left: Collaboration (Span 2) */}
                    <div className="md:col-span-2 bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden flex flex-col group relative">
                        {/* Illustration Area */}
                        <div className="h-64 bg-gray-50/50 relative flex items-center justify-center p-6 overflow-hidden">
                            <div className="absolute w-[180px] h-[100px] bg-white rounded-xl shadow-lg border border-gray-100 flex flex-col p-3 transform -rotate-6 group-hover:rotate-0 transition-transform duration-500 z-10 bottom-10 -left-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-5 h-5 rounded bg-orange-100 text-orange-500 flex items-center justify-center text-[10px] font-bold">M</div>
                                    <span className="text-xs font-semibold text-gray-700">Marketing</span>
                                </div>
                                <div className="flex -space-x-2">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 border-2 border-white"></div>
                                    <div className="w-6 h-6 rounded-full bg-green-100 border-2 border-white"></div>
                                    <div className="w-6 h-6 rounded-full bg-purple-100 border-2 border-white flex justify-center items-center text-[8px]">+2</div>
                                </div>
                            </div>
                            <div className="absolute w-[200px] h-[120px] bg-white rounded-xl shadow-xl border border-gray-100 flex flex-col p-4 transform rotate-3 group-hover:rotate-5 transition-transform duration-500 z-20 top-10 right-4">
                                <span className="text-[10px] text-gray-400 font-semibold mb-2 uppercase">Invite Members</span>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-6 h-6 rounded-full bg-gray-200"></div>
                                    <div className="flex-1 border-b border-gray-200 border-dashed pb-1"><span className="text-xs text-gray-700">Amanda P.</span></div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-gray-200"></div>
                                    <div className="flex-1 border-b border-gray-200 border-dashed pb-1"><span className="text-xs text-gray-700">Jane Doe</span></div>
                                </div>
                            </div>
                        </div>
                        {/* Text Area */}
                        <div className="p-8 mt-auto">
                            <h3 className="font-bold text-gray-900 text-xl mb-2">Seamless Collaboration</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                Work together with your team effortlessly, share tasks, and update progress in real-time.
                            </p>
                        </div>
                    </div>

                    {/* Top Right: Time Management (Span 3) */}
                    <div className="md:col-span-3 bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden flex flex-col group relative">
                        {/* Illustration Area */}
                        <div className="h-64 bg-gray-50/50 flex flex-col items-center justify-end px-12 pt-12 overflow-hidden relative">
                            <div className="w-full h-48 bg-white rounded-t-2xl shadow-[0_-10px_30px_rgba(0,0,0,0.05)] border border-gray-100 p-6 flex gap-6 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                {/* Fake Chart */}
                                <div className="w-1/3 flex items-end gap-2 pb-2">
                                    <div className="w-1/3 h-[40%] bg-blue-400 rounded-t-md"></div>
                                    <div className="w-1/3 h-[70%] bg-blue-500 rounded-t-md"></div>
                                    <div className="w-1/3 h-[50%] bg-blue-300 rounded-t-md"></div>
                                </div>
                                {/* Fake Schedule List */}
                                <div className="flex-1 flex flex-col gap-3">
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Weekly Schedule</span>
                                    <div className="bg-gray-50 p-2 rounded-lg flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 bg-white rounded shadow-sm flex items-center justify-center text-xs font-bold text-gray-600">15</div>
                                            <span className="text-xs text-gray-700 font-medium">Meeting with marketing</span>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-2 rounded-lg flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 bg-white rounded shadow-sm flex items-center justify-center text-xs font-bold text-gray-600">16</div>
                                            <span className="text-xs text-gray-700 font-medium">Product sync</span>
                                        </div>
                                        <div className="w-4 h-4 rounded-full border-2 border-purple-400"></div>
                                    </div>
                                </div>
                                {/* Fake Progress Ring */}
                                <div className="w-1/4 flex flex-col items-center justify-center">
                                    <div className="w-16 h-16 rounded-full border-4 border-orange-100 border-t-orange-400 flex items-center justify-center">
                                        <span className="text-sm font-bold text-gray-700">75%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Text Area */}
                        <div className="p-8 text-center mt-auto">
                            <h3 className="font-bold text-gray-900 text-xl mb-2">Time Management Tools</h3>
                            <p className="text-gray-500 text-sm leading-relaxed max-w-md mx-auto">
                                Optimize your time with integrated tools like timers, reminders, and schedules.
                            </p>
                        </div>
                    </div>

                    {/* Bottom Left: Timeline (Span 3) */}
                    <div className="md:col-span-3 bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden flex group relative flex-col md:flex-row items-center">
                        {/* Text Area */}
                        <div className="p-8 md:w-5/12 z-10">
                            <div className="w-10 h-10 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mb-6">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="13 17 18 12 13 7"></polyline><polyline points="6 17 11 12 6 7"></polyline></svg>
                            </div>
                            <h3 className="font-bold text-gray-900 text-xl mb-2">Advanced task tracking</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                A bird's eye view of your entire behavior and productivity workflows.
                            </p>
                        </div>
                        {/* Illustration Area */}
                        <div className="h-48 md:h-full w-full md:w-7/12 bg-gray-50/50 relative overflow-hidden flex items-center justify-start pl-6 md:pl-0">
                            <div className="w-[120%] h-[120%] bg-white rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-gray-100 absolute transform rotate-6 translate-x-10 group-hover:rotate-3 transition-transform duration-500 p-6 flex flex-col gap-4">
                                <div className="flex justify-between items-center w-[80%]">
                                    <span className="text-xs font-bold text-gray-800">Project Timeline</span>
                                    <div className="flex -space-x-2">
                                        <div className="w-5 h-5 rounded-full bg-blue-200"></div>
                                        <div className="w-5 h-5 rounded-full bg-green-200"></div>
                                    </div>
                                </div>
                                {/* Mock Gantt elements */}
                                <div className="flex gap-2 items-center">
                                    <span className="text-[10px] text-gray-400 w-10">Week 1</span>
                                    <div className="h-6 w-32 bg-orange-400 rounded-full"></div>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <span className="text-[10px] text-gray-400 w-10">Week 2</span>
                                    <div className="w-12"></div>
                                    <div className="h-6 w-40 bg-blue-500 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Right: Extensibility (Span 2) */}
                    <div className="md:col-span-2 bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden flex flex-col group relative">
                        {/* Illustration Area */}
                        <div className="h-48 bg-gray-50/50 flex items-center justify-center overflow-hidden">
                            <div className="grid grid-cols-2 gap-3 transform group-hover:scale-110 transition-transform duration-500">
                                <div className="w-16 h-16 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col p-2 pointer-events-none">
                                    <div className="h-2 w-8 bg-gray-200 rounded mb-1"></div>
                                    <div className="grid grid-cols-2 gap-1 mt-auto">
                                        <div className="h-4 bg-blue-100 rounded"></div>
                                        <div className="h-4 bg-orange-100 rounded"></div>
                                    </div>
                                </div>
                                <div className="w-16 h-16 bg-orange-400 rounded-xl shadow-md border border-orange-300 flex flex-col items-center justify-center pointer-events-none transform -translate-y-2">
                                    <span className="text-white font-bold text-sm">04:21</span>
                                    <div className="w-3 h-3 bg-red-500 rounded-full mt-1 border-2 border-orange-400"></div>
                                </div>
                                <div className="w-16 h-16 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center col-span-2 pointer-events-none">
                                    <div className="flex gap-1">
                                        <div className="w-4 h-4 bg-gray-100 rounded"></div>
                                        <div className="w-4 h-4 bg-gray-100 rounded"></div>
                                        <div className="w-4 h-4 bg-gray-100 rounded"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Text Area */}
                        <div className="p-8 text-center mt-auto">
                            <h3 className="font-bold text-gray-900 text-xl mb-2">Customizable Workspaces</h3>
                        </div>
                    </div>

                </div>

                <div className="mt-12 text-center text-sm font-semibold text-gray-500 relative">
                    and a lot more features...
                </div>

            </div>
        </section>
    );
}
