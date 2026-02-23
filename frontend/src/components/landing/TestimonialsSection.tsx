export default function TestimonialsSection() {
    const testimonials = [
        {
            text: "This task manager has completely transformed the way my team works. We now collaborate in real-time and always meet deadlines.",
            name: "John D.",
            role: "Marketing Lead",
            avatar: "bg-blue-100 text-blue-600",
            height: "h-[220px]"
        },
        {
            text: "An essential tool for anyone looking to manage their tasks better.",
            name: "Sarah W.",
            role: "Freelance Designer",
            avatar: "bg-purple-100 text-purple-600",
            height: "h-[160px]"
        },
        {
            text: "The built-in analytics give me a complete overview of our team's productivity.",
            name: "Sam J.",
            role: "Project Coordinator",
            avatar: "bg-orange-100 text-orange-600",
            height: "h-[180px]"
        },
        {
            text: "I love how easy it is to create and assign tasks. The platform's interface makes work feel less overwhelming.",
            name: "Daniela T.",
            role: "Operations Manager",
            avatar: "bg-green-100 text-green-600",
            height: "h-[200px]"
        },
        {
            text: "The time-tracking feature has been a game-changer for my freelance projects. It helps me stay organized and productive.",
            name: "Alex M.",
            role: "Freelance Developer",
            avatar: "bg-red-100 text-red-600",
            height: "h-[260px]"
        }
    ];

    return (
        <section className="py-24 bg-[#fafafa] relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">

                {/* Header Section */}
                <div className="text-center mb-16 max-w-2xl">
                    <span className="inline-block py-1.5 px-4 rounded-full border border-gray-200 text-xs font-semibold text-gray-500 mb-6 bg-white shadow-sm">
                        Testimonials
                    </span>
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight leading-tight">
                        People just like you <br /> are already using QueueLanka
                    </h2>
                </div>

                {/* Masonry Grid Simulation */}
                <div className="w-full max-w-5xl mx-auto columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">

                    {testimonials.map((t, idx) => (
                        <div key={idx} className={`bg-white rounded-3xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 flex flex-col justify-between break-inside-avoid relative hover:-translate-y-1 transition-transform duration-300 ${t.height}`}>
                            <p className="text-gray-700 font-medium leading-relaxed text-sm">"{t.text}"</p>
                            <div className="flex items-center gap-3 mt-6">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${t.avatar}`}>
                                    {t.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900 leading-none">{t.name}</p>
                                    <p className="text-xs text-gray-500 mt-1">{t.role}</p>
                                </div>
                            </div>

                            {/* Random floating elements for style */}
                            {idx === 0 && (
                                <div className="absolute -left-6 top-1/2 w-12 h-12 bg-white rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center -rotate-12">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path><path d="M8 10h.01"></path><path d="M12 10h.01"></path><path d="M16 10h.01"></path></svg>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Fake Video Testimonial Card */}
                    <div className="bg-white rounded-3xl p-2 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 flex flex-col justify-between break-inside-avoid h-[300px] relative group overflow-hidden">
                        <div className="w-full h-full bg-gray-200 rounded-2xl relative overflow-hidden bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop')" }}>
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                            <div className="absolute bottom-4 left-4">
                                <span className="bg-white/90 backdrop-blur-sm text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                                    Watch video review
                                </span>
                            </div>
                        </div>
                        <div className="absolute -right-4 bottom-10 w-14 h-14 bg-red-600 rounded-2xl shadow-xl flex items-center justify-center rotate-12 group-hover:rotate-0 transition-transform duration-300">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                        </div>
                    </div>

                </div>

            </div>
        </section>
    );
}
