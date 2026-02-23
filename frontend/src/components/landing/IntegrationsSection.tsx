export default function IntegrationsSection() {
    return (
        <section className="py-24 bg-white relative overflow-hidden">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">

                {/* Header Section */}
                <div className="text-center mb-16 max-w-2xl relative z-10">
                    <span className="inline-block py-1.5 px-4 rounded-full border border-gray-200 text-xs font-semibold text-gray-500 mb-6 bg-white shadow-sm">
                        Integrations
                    </span>
                    <h2 className="text-4xl font-bold text-gray-900 tracking-tight leading-tight mb-4">
                        Connect integrations <br /> you use every day
                    </h2>
                </div>

                {/* Central Connecting Node */}
                <div className="relative w-full flex justify-center mb-12 z-10">
                    <div className="absolute w-full top-1/2 h-px bg-gray-200 -z-10"></div>
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-gray-100 flex items-center justify-center p-3">
                        <div className="w-8 h-8 bg-gray-900 rounded-full flex flex-wrap items-center justify-center p-1.5 gap-0.5">
                            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                        </div>
                    </div>
                </div>

                {/* Grid of integration icons */}
                <div className="w-full relative z-10">
                    {/* Subtle connecting lines in background */}
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiNFM0U4RUYiLz48L3N2Zz4=')] opacity-50 -z-10"></div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-4 md:gap-6 lg:gap-8 justify-items-center">

                        {/* Row 1 */}
                        <div className="flex justify-center w-full"><IntegrationCard color="bg-green-50" icon="drive" /></div>
                        <div className="flex justify-center w-full"><IntegrationCard color="bg-purple-50" icon="figma" /></div>
                        <div className="flex justify-center w-full"><IntegrationCard color="bg-blue-50" icon="jira" /></div>
                        <div className="flex justify-center w-full"><IntegrationCard color="bg-red-50" icon="gmail" /></div>
                        <div className="flex justify-center w-full"><IntegrationCard color="bg-orange-50" icon="slack" /></div>
                        <div className="flex justify-center w-full"><IntegrationCard color="bg-teal-50" icon="notion" /></div>
                        <div className="flex justify-center w-full"><IntegrationCard color="bg-indigo-50" icon="teams" /></div>

                        {/* Row 2 */}
                        <div className="flex justify-center w-full"><IntegrationCard color="bg-pink-50" icon="dribbble" /></div>
                        <div className="flex justify-center w-full"><IntegrationCard color="bg-sky-50" icon="zoom" /></div>
                        <div className="flex justify-center w-full"><IntegrationCard color="bg-yellow-50" icon="salesforce" /></div>
                        <div className="flex justify-center w-full"><IntegrationCard color="bg-stone-50" icon="github" /></div>
                        <div className="flex justify-center w-full"><IntegrationCard color="bg-rose-50" icon="asana" /></div>
                        <div className="flex justify-center w-full"><IntegrationCard color="bg-cyan-50" icon="trello" /></div>
                        <div className="flex justify-center w-full"><IntegrationCard color="bg-lime-50" icon="linear" /></div>

                    </div>
                </div>
            </div>
        </section>
    );
}

function IntegrationCard({ color, icon }: { color: string, icon: string }) {
    // Simple placeholders for integration icons based on color prop
    return (
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_15px_30px_rgba(0,0,0,0.08)] transition-shadow duration-300 border border-gray-100 flex items-center justify-center p-4 cursor-pointer">
            <div className={`w-full h-full rounded-xl ${color} flex items-center justify-center border border-white`}>
                {/* Placeholder logic for icons based on the string */}
                <span className="text-xl font-bold uppercase opacity-80" style={{ color: 'var(--tw-gradient-from, #6b7280)' }}>
                    {icon[0]}
                </span>
            </div>
        </div>
    )
}
