import { Menu, X, LogIn } from "lucide-react";
import { useState } from "react";
import { Link } from "@remix-run/react";

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const scrollTo = (id) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth" });
        setIsMenuOpen(false);
    };

    const navItems = [
        { label: "Products", id: "products" },
        { label: "Pricing", id: "pricing" },
        { label: "About", id: "about" },
    ];

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-white/8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/30">M</div>
                        <span className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
                            Margadarsh
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => scrollTo(item.id)}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/8 transition-all duration-200"
                            >
                                {item.label}
                            </button>
                        ))}
                        <div className="w-px h-5 bg-white/10 mx-2" />
                        <Link
                            to="/login"
                            className="flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-blue-500/25 hover:scale-105"
                        >
                            <LogIn className="w-4 h-4" />
                            Login
                        </Link>
                    </div>

                    {/* Mobile hamburger */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/8 transition-all"
                        >
                            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {isMenuOpen && (
                <div className="md:hidden border-t border-white/8 bg-gray-950/95 backdrop-blur-md">
                    <div className="px-4 py-4 space-y-1">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => scrollTo(item.id)}
                                className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/8 transition-all"
                            >
                                {item.label}
                            </button>
                        ))}
                        <Link
                            to="/login"
                            className="mt-2 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold text-sm"
                        >
                            <LogIn className="w-4 h-4" /> Login
                        </Link>
                    </div>
                </div>
            )}
        </header>
    );
}
