import {
    Check, Zap, MessageCircle, Newspaper,
    FileText, Vote, Phone, Shield,
} from "lucide-react";
import { useState } from "react";

const iconMap = {
    "icon_news": Newspaper,
    "icon_communication": MessageCircle,
    "icon_grievance": Shield,
    "icon_survey": FileText,
    "icon_elections": Vote,
    "icon_ivr": Phone,
    "icon_whatsapp": MessageCircle,
};

export default function ProductCard({ product }) {
    const Icon = iconMap[product.icon] || Zap;

    return (
        <div className="group relative h-full">
            {/* Glow on hover */}
            <div className={`absolute -inset-0.5 bg-gradient-to-r ${product.gradient || "from-blue-600 to-violet-600"} rounded-2xl opacity-0 group-hover:opacity-40 transition-all duration-500 blur-md`} />

            <div className="relative h-full bg-white/5 border border-white/10 rounded-2xl p-7 flex flex-col transition-all duration-300 group-hover:-translate-y-1 group-hover:bg-white/8 group-hover:border-white/20 backdrop-blur-sm">
                {/* Icon badge */}
                <div className={`mb-5 w-12 h-12 rounded-xl bg-gradient-to-br ${product.gradient || "from-blue-500 to-violet-500"} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>

                {/* Title row */}
                <div className="flex items-center justify-between mb-2.5">
                    <h3 className="text-lg font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-violet-400 transition-all">
                        {product.name}
                    </h3>
                    <span className="text-xs font-mono text-white/25 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                        {product.skuCode}
                    </span>
                </div>

                <p className="text-white/50 text-sm mb-5 leading-relaxed">
                    {product.description}
                </p>

                {/* Features */}
                <div className="space-y-2 flex-grow">
                    {product.features.slice(0, 5).map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2.5 text-sm text-white/70">
                            <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${product.gradient || "from-blue-500 to-violet-500"} flex items-center justify-center flex-shrink-0`}>
                                <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                            </div>
                            <span>{feature}</span>
                        </div>
                    ))}
                    {/* {product.features.length > 5 && (
                        <p className="text-xs text-white/30 pl-6.5">+{product.features.length - 5} more features</p>
                    )} */}
                </div>

                {/* Sub-products */}
                {product.subProducts?.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-white/8">
                        <p className="text-xs font-semibold text-white/30 mb-2.5 uppercase tracking-widest">Includes</p>
                        <div className="flex flex-wrap gap-2">
                            {product.subProducts.map(sub => {
                                const SubIcon = iconMap[sub.icon] || Zap;
                                return (
                                    <div key={sub.skuCode} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg">
                                        <SubIcon className="w-3 h-3 text-white/40" />
                                        <span className="text-xs font-medium text-white/60">{sub.name}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
