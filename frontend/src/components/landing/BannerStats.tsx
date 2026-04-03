import { motion } from "framer-motion";

const stats = [
    { value: "98", suffix: "%", label: "Efficiency Rate" },
    { value: "2.3", suffix: "M+", label: "Queues Managed" },
    { value: "120", suffix: "+", label: "Service Centers" },
    { value: "24", suffix: "/7", label: "Uptime" },
];

export default function BannerStats() {
    return (
        <div className="w-full py-16 font-sans relative overflow-hidden border-b border-white/5 bg-transparent">
            <div className="max-w-[80rem] mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-white/5">
                    {stats.map((s, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="flex flex-col items-center px-8 py-4"
                        >
                            <span className="text-[3rem] md:text-[3.5rem] font-medium text-white tracking-tighter leading-none">
                                {s.value}<span style={{ background: "linear-gradient(135deg, #78d64b, #4abe8e)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{s.suffix}</span>
                            </span>
                            <span className="text-gray-500 text-[12px] font-medium uppercase tracking-[0.1em] mt-2">{s.label}</span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
