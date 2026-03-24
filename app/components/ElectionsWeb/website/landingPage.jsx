import { useRef, useState } from "react";
import Header from "./Header";
import ProductCard from "./ProductCard";
import { products } from "./data/products";
import {
    CheckCircle2, ArrowRight, Zap, Globe, Shield,
    Users, Mail, Phone, MapPin, Building2, Award, Star
} from "lucide-react";

// ─── shared helpers ────────────────────────────────────────────────────────
const sectionBadge = (color, label) => (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-${color}-500/10 border border-${color}-500/20 rounded-full mb-4`}>
        <span className={`w-1.5 h-1.5 rounded-full bg-${color}-400`} />
        <span className={`text-xs font-semibold text-${color}-400 uppercase tracking-widest`}>{label}</span>
    </div>
);

// ─── Pricing ───────────────────────────────────────────────────────────────
function PricingSection() {
    const [billing, setBilling] = useState("monthly");
    const region = "IN";

    const sym = "₹";
    const cur = "INR";

    const getPrice = (p) => p.plans?.find(pl => pl.type === billing && pl.currency === cur)?.price ?? null;
    const savings = (p) => {
        const m = p.plans?.find(pl => pl.type === "monthly" && pl.currency === cur);
        const y = p.plans?.find(pl => pl.type === "yearly" && pl.currency === cur);
        if (!m || !y) return null;
        return Math.round(((m.price * 12 - y.price) / (m.price * 12)) * 100);
    };

    const colorMap = {
        SKU001: "from-blue-500 to-cyan-500",
        SKU002: "from-violet-500 to-purple-600",
        SKU003: "from-orange-500 to-amber-500",
        SKU004: "from-emerald-500 to-teal-500",
        SKU005: "from-red-500 to-rose-600",
    };

    const featured = "SKU005";

    const Toggle = ({ options, value, onChange }) => (
        <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1">
            {options.map(o => (
                <button key={o.id} onClick={() => onChange(o.id)}
                    className={`relative px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${value === o.id ? "bg-white/10 text-white shadow" : "text-white/40 hover:text-white/70"}`}>
                    {o.label}
                    {o.badge && value !== o.id && (
                        <span className="ml-1.5 text-xs bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-bold">{o.badge}</span>
                    )}
                </button>
            ))}
        </div>
    );

    return (
        <div>
            {/* Toggles */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
                <Toggle
                    options={[{ id: "monthly", label: "Monthly" }, { id: "yearly", label: "Yearly", badge: "−17%" }]}
                    value={billing} onChange={setBilling}
                />
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {products.map((product) => {
                    const price = getPrice(product);
                    const save = billing === "yearly" ? savings(product) : null;
                    const isFeatured = product.skuCode === featured;
                    const grad = colorMap[product.skuCode] || "from-blue-500 to-violet-500";

                    return (
                        <div key={product.skuCode}
                            className={`relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1
                                ${isFeatured
                                    ? "ring-2 ring-red-500/60 shadow-xl shadow-red-500/10 bg-white/8"
                                    : "bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/8"
                                }`}>

                            {/* Top accent bar */}
                            <div className={`h-0.5 w-full bg-gradient-to-r ${grad}`} />

                            {/* Header */}
                            <div className="p-5">
                                {isFeatured && (
                                    <div className="flex items-center gap-1.5 mb-3">
                                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                                        <span className="text-xs font-bold uppercase tracking-widest text-yellow-400">Most Popular</span>
                                    </div>
                                )}
                                <h3 className="text-base font-bold text-white mb-1">{product.name}</h3>
                                <p className="text-xs text-white/40 leading-relaxed">{product.description}</p>
                            </div>

                            {/* Price */}
                            <div className="px-5 pb-4 border-b border-white/8">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-extrabold text-white">{sym}{price?.toLocaleString() ?? "—"}</span>
                                    <span className="text-xs text-white/30">/{billing === "yearly" ? "yr" : "mo"}</span>
                                </div>
                                {save && <p className="text-xs text-emerald-400 font-semibold mt-1">Save {save}% vs monthly</p>}
                                {billing === "yearly" && price && (
                                    <p className="text-xs text-white/25 mt-0.5">≈ {sym}{Math.round(price / 12).toLocaleString()}/mo</p>
                                )}
                            </div>

                            {/* Features */}
                            <div className="px-5 py-4 flex-grow space-y-2">
                                {product.features.slice(0, 5).map((f, i) => (
                                    <div key={i} className="flex items-start gap-2 text-xs text-white/60">
                                        <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 bg-clip-text`}
                                            style={{ color: product.skuCode === "SKU001" ? "#38bdf8" : product.skuCode === "SKU002" ? "#a78bfa" : product.skuCode === "SKU003" ? "#fb923c" : product.skuCode === "SKU004" ? "#34d399" : "#f87171" }} />
                                        {f}
                                    </div>
                                ))}
                                {product.features.length > 5 && (
                                    <p className="text-xs text-white/25 pl-5">+{product.features.length - 5} more</p>
                                )}

                                {/* Add-ons */}
                                {product.subProducts?.length > 0 && (
                                    <div className="pt-3 mt-2 border-t border-white/8">
                                        <p className="text-xs text-white/25 font-semibold mb-2 uppercase tracking-wider">Add-ons</p>
                                        {product.subProducts.map(sub => {
                                            const sp = sub.plans?.find(p => p.type === billing && p.currency === cur);
                                            return (
                                                <div key={sub.skuCode} className="flex justify-between items-center text-xs py-1.5 px-2.5 bg-white/5 rounded-lg mb-1 border border-white/8">
                                                    <span className="text-white/50 font-medium">{sub.name}</span>
                                                    <span className="text-white/70 font-bold">+{sym}{sp?.price?.toLocaleString() ?? "—"}/{billing === "yearly" ? "yr" : "mo"}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* CTA */}
                            <div className="px-5 pb-5">
                                <button className={`w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r ${grad} text-white hover:opacity-90 hover:scale-[1.02] transition-all shadow-md`}>
                                    Get Started
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── About ─────────────────────────────────────────────────────────────────
function AboutSection() {
    const stats = [
        { label: "State Governments", value: "12+", icon: Building2 },
        { label: "Organizations", value: "100+", icon: Users },
        { label: "Surveys Published", value: "10K", icon: MapPin },
        { label: "Constituencies Downloaded", value: "500", icon: Shield },
    ];

    const values = [
        { title: "Transparency", desc: "Making governance transparent and accountable for every citizen.", icon: Globe },
        { title: "Reliability", desc: "Mission-critical infra built for peak loads — elections and beyond.", icon: Shield },
        { title: "Innovation", desc: "Cutting-edge AI and analytics embedded in governance workflows.", icon: Zap },
        { title: "Citizen First", desc: "Every product decision starts and ends with the citizen's experience.", icon: Star },
    ];

    // const tags = ["ISO Certified", "CERT-In Compliant", "Data Residency: India", "SOC 2 Ready"];

    return (
        <div className="space-y-20">
            {/* Mission */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full mb-5">
                        <Award className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest">Our Mission</span>
                    </div>
                    <h3 className="text-3xl font-extrabold text-white mb-4 leading-tight">
                        Empowering Governance with{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
                            Digital Intelligence
                        </span>
                    </h3>
<p className="text-white/50 leading-relaxed mb-3 text-sm">
    Margadarsh is a product suite designed for the complex needs of Indian governance — from managing elections at scale to resolving citizen grievances with modern, efficient tools.
</p>
                    <p className="text-white/50 leading-relaxed text-sm">
                        We believe technology should simplify the relationship between citizens and their representatives. Each product is grounded in real-world government workflows and battle-tested in live deployments.
                    </p>
                    {/* <div className="mt-6 flex flex-wrap gap-2">
                        {tags.map(tag => (
                            <span key={tag} className="flex items-center gap-1.5 text-xs font-semibold text-white/50 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> {tag}
                            </span>
                        ))}
                    </div> */}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                    {stats.map(({ label, value, icon: Icon }) => (
                        <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/8 hover:border-white/20 transition-all">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center mb-3 shadow-lg shadow-blue-500/20">
                                <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-3xl font-extrabold text-white">{value}</div>
                            <div className="text-xs text-white/40 mt-0.5">{label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Values */}
            <div>
                <div className="text-center mb-10">
                    <h3 className="text-2xl font-extrabold text-white mb-2">What We Stand For</h3>
                    <p className="text-white/40 text-sm">Core principles that drive every product decision</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {values.map(({ title, desc, icon: Icon }) => (
                        <div key={title} className="group bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/8 hover:border-white/20 hover:-translate-y-1 transition-all duration-300">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/20 to-violet-600/20 border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Icon className="w-5 h-5 text-blue-400" />
                            </div>
                            <h4 className="font-bold text-white mb-1.5 text-sm">{title}</h4>
                            <p className="text-xs text-white/40 leading-relaxed">{desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Contact CTA */}
            <div className="relative rounded-3xl overflow-hidden p-10 text-center">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 via-violet-700/30 to-gray-950" />
                <div className="absolute inset-0 border border-white/10 rounded-3xl" />
                <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-60 h-60 bg-violet-600/20 rounded-full blur-3xl" />
                <div className="relative z-10">
                    <h3 className="text-2xl font-extrabold text-white mb-2">Ready to get started?</h3>
                    <p className="text-white/50 mb-8 max-w-md mx-auto text-sm">
                        Talk to our team and get a personalised demo tailored to your governance needs.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <a href="mailto:hello@margadarsh.in"
                            className="flex items-center gap-2 bg-white/10 border border-white/20 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/20 transition-all text-sm backdrop-blur-sm">
                            <Mail className="w-4 h-4" /> helpmargadarsh@gmail.com

                        </a>
                        <a href="tel:+918888888888"
                            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-all text-sm shadow-lg shadow-blue-500/25">
                            <Phone className="w-4 h-4" /> +91 7670862601
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main Landing Page ─────────────────────────────────────────────────────
export default function LandingPage() {
    const sectionHead = (badgeColor, badgeLabel, title, sub) => (
        <div className="text-center mb-14">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-${badgeColor}-500/10 border border-${badgeColor}-500/20 rounded-full mb-4`}>
                <span className={`w-1.5 h-1.5 rounded-full bg-${badgeColor}-400`} />
                <span className={`text-xs font-semibold text-${badgeColor}-400 uppercase tracking-widest`}>{badgeLabel}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">{title}</h2>
            <p className="text-white/40 max-w-2xl mx-auto text-base">{sub}</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-950 font-sans">
            <Header />

            {/* ── Hero ── */}
            <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
                {/* Background glows */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />
                <div className="absolute top-20 right-1/4 w-80 h-80 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-6">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-sm font-semibold text-white/60">Trusted by 12+ State Governments</span>
                    </div>

                    <h1 className="text-5xl sm:text-6xl font-extrabold text-white tracking-tight mb-6 leading-tight">
                        Powerful Tools for{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-violet-400 to-purple-400">
                            Modern Governance
                        </span>
                    </h1>
                    <p className="text-lg text-white/50 max-w-2xl mx-auto leading-relaxed">
                        Five purpose-built modules that work independently or as a unified governance platform — built for India, ready for the world.
                    </p>

                    <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })}
                            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold text-base hover:opacity-90 transition-all shadow-xl shadow-blue-500/25 hover:scale-105"
                        >
                            Explore Products <ArrowRight className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
                            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-base hover:bg-white/10 hover:border-white/20 transition-all"
                        >
                            View Pricing
                        </button>
                    </div>
                </div>
            </section>

            {/* ── Products ── */}
            <section id="products" className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {sectionHead("blue", "Everything You Need for Smarter Governance",
                        "Five purpose-built modules designed to work independently or together as a unified governance platform.")}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {products.map((product) => (
                            <ProductCard key={product.skuCode} product={product} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Divider */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>

            {/* ── Pricing ── */}
            <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {sectionHead("emerald", "Simple, Predictable Pricing",
                        "No hidden fees. No surprise charges. Switch plans anytime.")}
                    <PricingSection />
                </div>
            </section>

            {/* Divider */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>

            {/* ── About ── */}
            <section id="about" className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {sectionHead("violet", "About Us", "Built by Margadarsh",
                        "We've been at the intersection of media and governance for over a decade.")}
                    <AboutSection />
                </div>
            </section>

        </div>
    );
}
