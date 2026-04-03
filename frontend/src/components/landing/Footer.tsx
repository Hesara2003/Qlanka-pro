import { Link } from "react-router-dom";

export default function Footer() {
    return (
        <footer className="w-full font-sans relative overflow-hidden" style={{ background: "linear-gradient(160deg, #0c0e13 0%, #111827 100%)" }}>
            {/* Top border glow */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#78d64b]/20 to-transparent" />
            {/* Subtle glow blob */}
            <div className="absolute bottom-0 right-[15%] w-[400px] h-[300px] pointer-events-none opacity-10" style={{ background: "radial-gradient(circle, #78d64b 0%, transparent 70%)", filter: "blur(80px)" }} />

            <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-12 pt-14 pb-8 relative z-10">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-14">
                    
                    {/* Brand */}
                    <div className="col-span-2">
                        <Link to="/" className="flex items-center gap-2.5 mb-5">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#78d64b] to-[#4abe8e] flex items-center justify-center">
                                <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 1L1 15H15L8 1Z" fill="white"/></svg>
                            </div>
                            <span className="font-medium text-[15px] text-white tracking-tight">QueueLanka</span>
                        </Link>
                        <p className="text-[13px] text-gray-500 leading-relaxed max-w-[240px] mb-6">
                            The all-in-one queue management platform for modern service centers.
                        </p>
                        {/* Social icons */}
                        <div className="flex items-center gap-3">
                            {[
                                { label: "Twitter", path: "M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" },
                                { label: "GitHub", path: "M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" },
                                { label: "LinkedIn", path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" }
                            ].map((s) => (
                                <a key={s.label} href="#" className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:text-gray-400 hover:bg-white/5 border border-white/5 transition-all" aria-label={s.label}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d={s.path}/></svg>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links */}
                    {[
                        { heading: "Product", links: ["Features", "Pricing", "Changelog", "Integrations"] },
                        { heading: "Company", links: ["About", "Blog", "Careers", "Contact"] },
                        { heading: "Legal", links: ["Privacy Policy", "Terms of Service", "Cookie Policy"] },
                    ].map((col) => (
                        <div key={col.heading}>
                            <h4 className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-5">{col.heading}</h4>
                            <ul className="space-y-3">
                                {col.links.map(item => (
                                    <li key={item}><a href="#" className="text-[13px] text-gray-500 hover:text-gray-200 transition-colors">{item}</a></li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom bar */}
                <div className="border-t border-white/5 pt-7 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-[12px] text-gray-600">© {new Date().getFullYear()} QueueLanka. All rights reserved.</p>
                    <div className="flex items-center gap-1.5 text-[12px] text-gray-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#78d64b]" />
                        All systems operational
                    </div>
                </div>
            </div>
        </footer>
    );
}
