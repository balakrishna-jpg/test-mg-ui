import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "@remix-run/react";
import { loginUserV2, checkEmailExists, createOrganization, getElectionStates } from "~/api";
import { getUserLandingRoute } from "~/utils/session";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import {
    Loader2, ArrowLeft, Mail, Lock, User, Calendar,
    Newspaper, MessageCircle, Shield, FileText, Vote,
    CheckCircle2, ArrowRight, Eye, EyeOff, Building2
} from "lucide-react";
import { jwtDecode } from "jwt-decode";
import ManageSubscriptions from "../subscriptions/manageSubscriptions";

const TAMIL_NADU_PARTIES = [
    { value: "1", label: "BJP" },
    { value: "2", label: "DMK" },
    { value: "3", label: "AIDMK" },
    { value: "4", label: "Congress" },
    { value: "999999", label: "Independent" },
];

const PRODUCTS = [
    { icon: Newspaper, name: "Monitor", desc: "Topics, breaking, trending & popular media", color: "text-blue-400" },
    { icon: MessageCircle, name: "Communication", desc: "Multi-channel broadcast & alerts", color: "text-violet-400" },
    { icon: Shield, name: "Grievance", desc: "Citizen ticket tracking & resolution", color: "text-orange-400" },
    { icon: FileText, name: "Survey", desc: "Create & analyse surveys in real-time", color: "text-emerald-400" },
    { icon: Vote, name: "Elections", desc: "End-to-end campaign management", color: "text-red-400" },
];

export default function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [checkingEmail, setCheckingEmail] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [step, setStep] = useState("email"); // email | password | register | subscription
    const [successMessage, setSuccessMessage] = useState(null);

    const [registrationForm, setRegistrationForm] = useState({
        name: "", organization_name: "", age: "", gender: "male",
        email: "", password: "", state_id: "", state_name: "", party_id: "",
    });
    const [states, setStates] = useState([]);
    const [loadingStates, setLoadingStates] = useState(true);
    const [registering, setRegistering] = useState(false);
    const [stateSearch, setStateSearch] = useState("");
    const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false);
    const [stateError, setStateError] = useState(null);
    const [partyError, setPartyError] = useState(null);
    const [showRegPassword, setShowRegPassword] = useState(false);

    useEffect(() => {
        // Auto-redirect if already logged in and token is not expired
        try {
            const token = localStorage.getItem("token");
            const userInfo = JSON.parse(localStorage.getItem("user_info") || "{}");
            if (token && userInfo?.user_id) {
                const decoded = jwtDecode(token);
                if (decoded.exp * 1000 > Date.now()) {
                    navigate(getUserLandingRoute(userInfo), { replace: true });
                } else {
                    // Token expired. Clear local storage.
                    localStorage.removeItem("token");
                    localStorage.removeItem("user_info");
                    localStorage.removeItem("role");
                }
            }
        } catch (error) {
            console.error("Token decode error:", error);
            localStorage.removeItem("token");
            localStorage.removeItem("user_info");
            localStorage.removeItem("role");
        }

        (async () => {
            try {
                const res = await getElectionStates();
                if (Array.isArray(res)) {
                    setStates(res.map((s) => ({ id: String(s.state_id), name: s.state_name })));
                }
            } catch (err) {
                console.error("Failed to load states:", err);
            } finally {
                setLoadingStates(false);
            }
        })();
    }, []);

    const filteredStates = states.filter((s) =>
        s.name.toLowerCase().includes(stateSearch.toLowerCase())
    );

    const handleContinueWithEmail = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);
        setCheckingEmail(true);
        if (!email.trim()) { setError("Please enter your email address."); setCheckingEmail(false); return; }
        try {
            const response = await checkEmailExists(email);
            if (response.success) {
                if (response.exists) {
                    setStep("password");
                } else {
                    setError("Account not found with this email. Please sign up.");
                }
            } else {
                setError(response.detail || "Failed to check email.");
            }
        } catch {
            setError("Unable to verify email. Please try again.");
        } finally {
            setCheckingEmail(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);
        if (!password.trim()) { setError("Please enter your password."); return; }
        try {
            setSubmitting(true);
            const response = await loginUserV2(email, password);
            if (response.success && response.data && response.token) {
                localStorage.setItem("token", response.token);
                localStorage.setItem("role", response.data.role || "");
                localStorage.setItem("user_info", JSON.stringify(response.data));
                localStorage.setItem("showWelcomeModal", "true");
                navigate(getUserLandingRoute(response.data));
            } else {
                setError(response.detail || "Invalid credentials.");
            }
        } catch {
            setError("Login failed. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleRegistration = async (e) => {
        e.preventDefault();
        setError(null); setStateError(null); setPartyError(null);
        if (!registrationForm.email.trim() || !registrationForm.name.trim() || !registrationForm.organization_name.trim() || !registrationForm.age || !registrationForm.password.trim() || registrationForm.password.trim().length < 8) {
            setError("Please fill in all required fields and ensure password is at least 8 characters."); return;
        }
        if (!registrationForm.state_id) { setStateError("Please select a state."); return; }

        // Move to subscription step
        setStep("subscription");
    };

    const setRegistrationField = (key, value) => {
        setRegistrationForm((prev) => ({ ...prev, [key]: value }));
        if (key === "state_id") {
            const selectedState = states.find((s) => s.id === value);
            setRegistrationForm((prev) => ({
                ...prev, state_id: value,
                state_name: selectedState?.name || "", party_id: "",
            }));
            setStateError(null);
        }
        if (key === "party_id") setPartyError(null);
    };

    // ── shared input style ──────────────────────────────────────────────────
    const inputCls = (hasError) =>
        `w-full bg-white/5 border ${hasError ? "border-red-500" : "border-white/10"} rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/40 transition-all text-sm`;

    const labelCls = "block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wide";

    return (
        <div className="min-h-screen flex flex-col bg-gray-950 font-sans">

            <div className="flex-1 flex flex-col items-center justify-center relative px-6 py-12 lg:px-12">
                {/* Back link */}
                <div className="absolute top-6 left-6 lg:top-10 lg:left-10 z-20">
                    <Link to="/" className="inline-flex items-center gap-2 p-2.5 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all text-sm w-fit">
                        <ArrowLeft size={15} />
                        Back to Home
                    </Link>
                </div>

                {/* Gradient backdrops */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-violet-700/10 to-gray-950 pointer-events-none" />
                <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-72 h-72 bg-violet-600/10 rounded-full blur-3xl translate-x-1/4 translate-y-1/4 pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

                {/* ── Form Container ──────────────────────────────── */}
                <div className="w-full max-w-md relative z-10">

                    {/* Header */}
                    <div className="mb-8">
                        {/* Logo */}
                        {/* <div className="flex items-center justify-center gap-2 mb-8">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white font-bold text-sm">M</div>
                            <span className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">Margadarsh</span>
                        </div> */}

                        <h1 className="text-3xl font-extrabold text-white mb-1.5">
                            {step === "register" ? "Create your account" : step === "subscription" ? "Select Products" : ""}
                        </h1>
                    </div>

                    {/* Error banner */}
                    {error && (
                        <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
                            <span className="text-red-400 text-base mt-0.5">⚠</span>
                            <p className="text-red-300 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Success banner */}
                    {successMessage && (
                        <div className="mb-5 p-3.5 bg-green-500/10 border border-green-500/30 rounded-xl flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
                            <p className="text-green-300 text-sm">{successMessage}</p>
                        </div>
                    )}

                    {/* ─ Email Step ─ */}
                    {step === "email" && (
                        <form onSubmit={handleContinueWithEmail} className="space-y-5">
                            <div>
                                <label className={labelCls}>Email address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className={`${inputCls(false)} pl-10`}
                                        placeholder="you@example.com"
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div className="flex justify-end mt-2">
                                    <p className="text-white/40 text-xs">
                                        New to Margadarsh?{" "}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setError(null);
                                                setRegistrationForm(p => ({ ...p, email }));
                                                setStep("register");
                                            }}
                                            className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                                        >
                                            Sign up
                                        </button>
                                    </p>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={checkingEmail}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-60"
                            >
                                {checkingEmail ? <Loader2 className="animate-spin w-4 h-4" /> : <>Continue <ArrowRight className="w-4 h-4" /></>}
                            </button>
                        </form>
                    )}

                    {/* ─ Password Step ─ */}
                    {step === "password" && (
                        <form onSubmit={handleLogin} className="space-y-5">
                            {/* Email chip */}
                            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                                <div className="flex items-center gap-2.5 text-sm text-white/70">
                                    <Mail className="w-4 h-4 text-blue-400" />
                                    {email}
                                </div>
                                <button type="button" onClick={() => setStep("email")} className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                                    Edit
                                </button>
                            </div>

                            <div>
                                <div className="flex justify-between mb-1.5">
                                    <label className={labelCls}>Password</label>
                                    <Link to="/forgot-password" className="text-xs text-white/30 hover:text-white/60 transition-colors">Forgot password?</Link>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className={`${inputCls(false)} pl-10 pr-10`}
                                        placeholder="Enter your password"
                                        required
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-60"
                            >
                                {submitting ? <Loader2 className="animate-spin w-4 h-4" /> : <>Log In <ArrowRight className="w-4 h-4" /></>}
                            </button>
                        </form>
                    )}

                    {/* ─ Register Step ─ */}
                    {step === "register" && (
                        <form onSubmit={handleRegistration} className="space-y-4">
                            <div>
                                <label className={labelCls}>Email address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                                    <input
                                        type="email" required
                                        className={`${inputCls(false)} pl-10`}
                                        placeholder="you@example.com"
                                        value={registrationForm.email}
                                        onChange={(e) => setRegistrationField("email", e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelCls}>Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                                        <input
                                            type="text" required
                                            className={`${inputCls(false)} pl-9`}
                                            placeholder="Your name"
                                            value={registrationForm.name}
                                            onChange={(e) => setRegistrationField("name", e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelCls}>Organization Name</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                                        <input
                                            type="text" required
                                            className={`${inputCls(false)} pl-9`}
                                            placeholder="Your organization"
                                            value={registrationForm.organization_name}
                                            onChange={(e) => setRegistrationField("organization_name", e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelCls}>Age</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                                        <input
                                            type="number" required min={18} max={120}
                                            className={`${inputCls(false)} pl-9`}
                                            placeholder="Age"
                                            value={registrationForm.age}
                                            onChange={(e) => setRegistrationField("age", e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelCls}>Gender</label>
                                    <Select value={registrationForm.gender} onValueChange={(v) => setRegistrationField("gender", v)}>
                                        <SelectTrigger className="w-full bg-white/5 border-white/10 text-white h-[42px] text-sm rounded-xl focus:ring-blue-500/60">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-gray-900 border-white/10 text-white">
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="female">Female</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <label className={labelCls}>Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                                    <input
                                        type={showRegPassword ? "text" : "password"} required
                                        className={`${inputCls(false)} pl-10 pr-10`}
                                        placeholder="Create a password"
                                        value={registrationForm.password}
                                        onChange={(e) => setRegistrationField("password", e.target.value)}
                                    />
                                    <button type="button" onClick={() => setShowRegPassword(!showRegPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                                        {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={`${labelCls} ${stateError ? "text-red-400" : ""}`}>State</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search state…"
                                            className={inputCls(!!stateError)}
                                            value={isStateDropdownOpen ? stateSearch : (registrationForm.state_id ? states.find((s) => s.id === registrationForm.state_id)?.name : "")}
                                            onChange={(e) => { setStateSearch(e.target.value); setIsStateDropdownOpen(true); }}
                                            onFocus={() => setIsStateDropdownOpen(true)}
                                            onBlur={() => setTimeout(() => setIsStateDropdownOpen(false), 200)}
                                        />
                                        {isStateDropdownOpen && filteredStates.length > 0 && (
                                            <div className="absolute z-20 w-full mt-1 bg-gray-900 border border-white/10 rounded-xl shadow-2xl max-h-40 overflow-y-auto">
                                                {filteredStates.map((state) => (
                                                    <button key={state.id} type="button"
                                                        onMouseDown={() => { setRegistrationField("state_id", state.id); setIsStateDropdownOpen(false); setStateSearch(""); }}
                                                        className="w-full text-left px-3.5 py-2.5 hover:bg-white/5 text-sm text-white/80 transition-colors"
                                                    >
                                                        {state.name}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {stateError && <p className="text-red-400 text-xs mt-1">{stateError}</p>}
                                </div>

                                <div>
                                    <label className={labelCls}>Party <span className="text-white/30 lowercase">(Optional)</span></label>
                                    <Select value={registrationForm.party_id} onValueChange={(v) => setRegistrationField("party_id", v)}>
                                        <SelectTrigger className="w-full bg-white/5 border-white/10 text-white h-[42px] text-sm rounded-xl">
                                            <SelectValue placeholder="Select Party" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-gray-900 border-white/10 text-white">
                                            {TAMIL_NADU_PARTIES.map((p) => (
                                                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={registering}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-60 mt-2"
                            >
                                {registering ? <Loader2 className="animate-spin w-4 h-4" /> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
                            </button>
                        </form>
                    )}

                    {/* ─ Subscription Step ─ */}
                    {step === "subscription" && (
                        <ManageSubscriptions
                            registrationData={registrationForm}
                            onSuccess={(msg) => {
                                setSuccessMessage(msg || "Organization created successfully! Please log in.");
                                setStep("email");
                                setRegistrationForm({
                                    name: "", organization_name: "", age: "", gender: "male",
                                    email: "", password: "", state_id: "", state_name: "", party_id: "",
                                });
                            }}
                            onBack={() => setStep("register")}
                        />
                    )}

                    <p className="mt-8 text-center text-xs text-white/20">
                        By continuing, you agree to our{" "}
                        <a href="#" className="underline hover:text-white/50 transition-colors">Terms of Service</a>
                        {" "}and{" "}
                        <a href="#" className="underline hover:text-white/50 transition-colors">Privacy Policy</a>.
                    </p>
                </div>
            </div>

            {/* ── Bottom Products Footer ──────────────────────────────── */}
            <div className="relative z-20 border-t border-white/5 bg-black/40 py-8 px-6 lg:px-12">
                <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:flex lg:justify-between gap-8 lg:gap-4">
                    {PRODUCTS.map(({ icon: Icon, name, desc, color }) => (
                        <div key={name} className="flex flex-col items-center text-center">
                            <Icon className={`w-7 h-7 mb-3 ${color}`} strokeWidth={1.5} />
                            <p className="text-sm font-bold text-white mb-1 tracking-wide uppercase">{name}</p>
                            <p className="text-xs text-white/40 leading-relaxed max-w-[150px]">{desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
