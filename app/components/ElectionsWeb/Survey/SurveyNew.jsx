// app/components/ElectionsWeb/Survey/SurveyNew.jsx
import { useState } from "react";
import { useNavigate, useParams } from "@remix-run/react";
import {
    PenLine,
    Sparkles,
    Upload,
    LayoutTemplate,
    Copy,
    X,
    Loader2,
    ChevronLeft,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import { createMargadarshSurvey } from "~/api";
import { message } from "antd";

const CREATION_CARDS = [
    {
        id: "scratch",
        icon: PenLine,
        iconBg: "bg-emerald-50",
        iconColor: "text-emerald-600",
        title: "Create from scratch",
        description:
            "Create a survey from scratch by manually adding questions using the survey builder",
        action: "Create Survey",
        enabled: true,
    },
    {
        id: "ai",
        icon: Sparkles,
        iconBg: "bg-purple-50",
        iconColor: "text-purple-600",
        title: "Create using AI",
        description:
            "Let AI generate a complete survey based on your topic and goals",
        action: "Coming Soon",
        enabled: false,
    },
    {
        id: "editor",
        icon: Sparkles,
        iconBg: "bg-purple-50",
        iconColor: "text-purple-600",
        title: "Create with Quick Editor",
        description:
            "Let AI generate a complete survey based on your topic and goals",
        action: "Coming Soon",
        enabled: false,
    }



];

const CATEGORIES = [
    { value: "other", label: "Other" },
    // Telangana / election-focused
    { value: "telangana_voter_mood", label: "Telangana Voter Mood" },
    { value: "government_schemes_impact", label: "Government Schemes Impact" },
    { value: "farmer_rural_distress", label: "Farmer / Rural Distress" },
    { value: "youth_unemployment_jobs", label: "Youth Unemployment & Jobs" },
    { value: "women_voters", label: "Women Voters" },
    { value: "hyderabad_urban_issues", label: "Hyderabad Urban Issues" },
    { value: "candidate_image_mla_mp", label: "Candidate Image & MLA/MP Performance" },
    { value: "caste_community_social", label: "Caste & Community / Social" },
    { value: "booth_level_readiness", label: "Booth Level Readiness" },
    { value: "anti_incumbency_change", label: "Anti-Incumbency / Change" },
    { value: "minority_welfare_access", label: "Minority & Welfare Access" },
    { value: "urban_body_municipal", label: "Urban Body / Municipal" },
];

export default function SurveyNew() {
    
    const navigate = useNavigate();

    const [showModal, setShowModal] = useState(false);
    const [surveyName, setSurveyName] = useState("");
    const [surveyCategory, setSurveyCategory] = useState("");
    const [creating, setCreating] = useState(false);

    const openModal = () => {
        setSurveyName("");
        setSurveyCategory("");
        setShowModal(true);
    };

    const closeModal = () => {
        if (creating) return;
        setShowModal(false);
    };

    const handleCreate = async () => {
        if (!surveyName.trim()) {
            message.warning("Please enter a survey name");
            return;
        }
        if (!surveyCategory) {
            message.warning("Please select a category");
            return;
        }
        setCreating(true);
        try {
            const res = await createMargadarshSurvey({
                survey_name: surveyName.trim(),
                survey_category: surveyCategory,
            });
            if (res?.success && res?.data?.survey_id) {
                message.success("Survey created!");
                navigate(
                    `/elections/survey-builder?surveyId=${res.data.survey_id}`
                );
            } else {
                message.error("Failed to create survey");
            }
        } catch (err) {
            console.error(err);
            message.error("Failed to create survey");
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-49px)] flex flex-col bg-white dark:bg-[#111111]">
            {/* ── Header ── */}
            <div className="flex-shrink-0 px-8 py-12 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-6">
                    <Sparkles className="w-3.5 h-3.5" />
                    New Survey
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 dark:from-white dark:via-blue-200 dark:to-white mb-4 tracking-tight">
                    How would you like to start?
                </h1>
                <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                    Choose a method to create your new survey. You can start fresh or use our AI tools to get a head start.
                </p>
            </div>

            {/* ── Cards Grid ── */}
            <div className="flex-1 overflow-y-auto px-8 pb-20 custom-scrollbar">
                <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {CREATION_CARDS.map((card) => {
                        const Icon = card.icon;
                        return (
                            <div
                                key={card.id}
                                onClick={card.enabled ? openModal : undefined}
                                className={`group relative rounded-3xl p-1 transition-all duration-300 ${card.enabled
                                    ? "cursor-pointer hover:-translate-y-1"
                                    : "opacity-70 grayscale-[0.5] cursor-not-allowed"
                                    }`}
                            >
                                {/* Gradient Border & Glow Effect */}
                                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${card.enabled
                                    ? "from-gray-100 via-white to-gray-100 dark:from-[#2a2a2a] dark:via-[#1a1a1a] dark:to-[#2a2a2a] group-hover:from-blue-200 group-hover:via-purple-200 group-hover:to-emerald-200 dark:group-hover:from-blue-900/40 dark:group-hover:via-purple-900/40 dark:group-hover:to-emerald-900/40"
                                    : "from-gray-100 to-gray-50 dark:from-[#222] dark:to-[#1a1a1a]"
                                    } transition-colors duration-500`} />

                                {/* Card Content */}
                                <div className="relative h-full bg-white dark:bg-[#161616] rounded-[22px] p-6 flex flex-col overflow-hidden">
                                    {/* Shiny overlay */}
                                    {card.enabled && (
                                        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/40 to-white/0 dark:from-white/0 dark:via-white/5 dark:to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                                    )}

                                    <div className="flex items-center justify-between mb-6">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${card.iconBg} ${card.enabled ? "shadow-inner" : ""}`}>
                                            <Icon className={`w-7 h-7 ${card.iconColor}`} />
                                        </div>
                                        {!card.enabled && (
                                            <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-[#222] text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                                                Coming Soon
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {card.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-8 flex-1">
                                        {card.description}
                                    </p>

                                    <div className="flex items-center text-sm font-semibold group/btn">
                                        <span className={`${card.enabled
                                            ? "text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400"
                                            : "text-gray-400"
                                            } transition-colors`}>
                                            {card.action}
                                        </span>
                                        {card.enabled && (
                                            <ChevronLeft className="w-4 h-4 ml-1 rotate-180 transition-transform group-hover/btn:translate-x-1 text-blue-500" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Create Survey Modal */}
            {showModal && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={closeModal}
                    />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div
                            className="bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all"
                            style={{ animation: "fadeInScale 0.2s ease-out" }}
                        >
                            <style>{`
                @keyframes fadeInScale {
                  from { opacity: 0; transform: scale(0.95); }
                  to   { opacity: 1; transform: scale(1); }
                }
              `}</style>

                            {/* Modal Header */}
                            <div className="relative px-8 py-6 border-b border-gray-100 dark:border-[#2a2a2a] bg-gradient-to-r from-gray-50/50 to-white/50 dark:from-[#222]/50 dark:to-[#1a1a1a]/50">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Create New Survey
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Give your survey a name and category to get started
                                </p>
                                <button
                                    onClick={closeModal}
                                    className="absolute top-6 right-6 p-2 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="px-8 py-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                                        Survey Name <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        value={surveyName}
                                        onChange={(e) => setSurveyName(e.target.value)}
                                        placeholder="e.g. Annual Customer Feedback 2024"
                                        className="w-full h-11 rounded-xl border-gray-200 dark:border-[#333] bg-gray-50 dark:bg-[#222] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                                        autoFocus
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                                        Category <span className="text-red-500">*</span>
                                    </label>
                                    <Select
                                        value={surveyCategory}
                                        onValueChange={setSurveyCategory}
                                    >
                                        <SelectTrigger className="w-full h-11 rounded-xl border-gray-200 dark:border-[#333] bg-gray-50 dark:bg-[#222] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all">
                                            <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-[#1a1a1a] border-gray-100 dark:border-[#333] rounded-xl shadow-xl">
                                            {CATEGORIES.map((cat) => (
                                                <SelectItem key={cat.value} value={cat.value} className="focus:bg-gray-50 dark:focus:bg-[#2a2a2a] rounded-lg cursor-pointer py-2.5">
                                                    {cat.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex items-center justify-end gap-3 px-8 py-6 bg-gray-50/50 dark:bg-[#222]/50 border-t border-gray-100 dark:border-[#2a2a2a]">
                                <Button
                                    variant="ghost"
                                    onClick={closeModal}
                                    disabled={creating}
                                    className="h-11 px-6 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] hover:text-gray-900 dark:hover:text-white"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleCreate}
                                    disabled={creating || !surveyName.trim() || !surveyCategory}
                                    className="h-11 px-8 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 border-0 transition-all hover:scale-105 active:scale-95"
                                >
                                    {creating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Creating Survey...
                                        </>
                                    ) : (
                                        "Create Survey"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
