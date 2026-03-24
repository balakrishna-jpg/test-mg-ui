// app/components/ElectionsWeb/Survey/SurveySummary.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "@remix-run/react";
import {
    Pencil,
    Loader2,
    FileQuestion,
    Users,
    CheckCircle,
    Clock,
    ArrowLeft,
    Send,
    Eye,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { getMargadarshSurveySummary, updateMargadarshSurvey } from "~/api";
import { message } from "antd";
import dayjs from "dayjs";

export default function SurveySummary() {
    
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const surveyId = searchParams.get("surveyId");

    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditingName, setIsEditingName] = useState(false);
    const [editNameValue, setEditNameValue] = useState("");

    const handleNameSave = async () => {
        if (!editNameValue.trim() || editNameValue.trim() === summary?.survey_name) {
            setIsEditingName(false);
            return;
        }
        try {
            await updateMargadarshSurvey(surveyId, { survey_name: editNameValue.trim() });
            setIsEditingName(false);
            fetchSummary();
            message.success("Survey name updated");
        } catch {
            message.error("Failed to update survey name");
        }
    };

    const fetchSummary = useCallback(async () => {
        if (!surveyId) return;
        setLoading(true);
        try {
            const res = await getMargadarshSurveySummary(surveyId);
            if (res?.success) setSummary(res.data);
        } catch (err) {
            console.error(err);
            message.error("Failed to load survey summary");
        } finally {
            setLoading(false);
        }
    }, [surveyId]);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    const isPublished = summary?.status === "active" || summary?.access?.is_published;
    const kpis = summary?.kpis || {};
    const structure = summary?.structure || {};
    const access = summary?.access || {};
    const questionCount = structure.questions_count ?? summary?.structure?.total_questions ?? summary?.questions_count ?? 0;
    const pageCount = structure.pages_count ?? summary?.structure?.total_pages ?? summary?.pages_count ?? 0;
    const responseCount = kpis.responses_total ?? summary?.responses_count ?? 0;
    const visitsTotal = kpis.visits_total ?? 0;
    const activeForDays = kpis.active_for_days ?? 0;
    const questionTitles = structure.question_titles || [];

    return (
        <div className="min-h-[calc(100vh-49px)] flex flex-col bg-white dark:bg-[#111111]">
            {/* Top nav bar */}
            <div className="flex-shrink-0 bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-[#333] px-4 py-0 flex items-center">
                <button
                    onClick={() => navigate(`/elections/surveys-list`)}
                    className="p-2 mr-1 text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
                {isEditingName ? (
                    <div className="mr-auto max-w-xs flex items-center">
                        <input
                            autoFocus
                            value={editNameValue}
                            onChange={(e) => setEditNameValue(e.target.value)}
                            onBlur={handleNameSave}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleNameSave();
                                if (e.key === "Escape") {
                                    setIsEditingName(false);
                                    setEditNameValue(summary?.survey_name || "");
                                }
                            }}
                            className="text-sm font-medium text-gray-900 dark:text-white bg-transparent border-b border-gray-400 focus:outline-none focus:border-blue-500 w-full"
                        />
                    </div>
                ) : (
                    <div
                        className="flex items-center gap-2 mr-auto cursor-pointer group"
                        onClick={() => {
                            setEditNameValue(summary?.survey_name || "");
                            setIsEditingName(true);
                        }}
                    >
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-xs">
                            {summary?.survey_name || "Survey"}
                        </span>
                        <Pencil className="w-3.5 h-3.5 text-gray-400 transition-opacity" />
                    </div>
                )}

                {/* Sub-nav tabs */}
                <div className="flex items-center h-full">
                    {[
                        { label: "Summary", section: "survey-summary" },
                        { label: "Builder", section: "survey-builder" },
                        { label: "Responses", section: "survey-responses" },
                        { label: "Audit Logs", section: "survey-audit" },
                        { label: "Launch", section: "survey-launch" },
                        { label: "Reports", section: "survey-reports" },
                    ].map((tab) => {
                        const isActive = tab.section === "survey-summary";
                        return (
                            <button
                                key={tab.section}
                                onClick={() =>
                                    navigate(
                                        `/elections/${tab.section}?surveyId=${surveyId}`
                                    )
                                }
                                className={`px-4 py-3.5 text-sm font-medium border-b-2 transition-colors ${isActive
                                    ? "border-gray-900 dark:border-white text-gray-900 dark:text-white"
                                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                    }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                </div>
            ) : (
                <div className="flex-1 overflow-auto">
                    <div className="max-w-6xl mx-auto px-6 py-8 flex gap-6">
                        {/* Left column */}
                        <div className="w-64 flex-shrink-0 space-y-4">
                            {/* Dates */}
                            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#3d3d3d] p-5 space-y-3">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">
                                        Created on
                                    </p>
                                    <p className="text-sm font-semibold text-gray-800 dark:text-white">
                                        {summary?.created_at
                                            ? dayjs(summary.created_at).format("MMM DD, YYYY")
                                            : "—"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">
                                        Modified on
                                    </p>
                                    <p className="text-sm font-semibold text-gray-800 dark:text-white">
                                        {(summary?.modified_at || summary?.updated_at)
                                            ? dayjs(summary.modified_at || summary.updated_at).format("MMM DD, YYYY")
                                            : "—"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">
                                        Status
                                    </p>
                                    <span
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isPublished
                                            ? "bg-green-100 text-green-700"
                                            : "bg-gray-100 text-gray-600"
                                            }`}
                                    >
                                        {isPublished ? (
                                            <CheckCircle className="w-3 h-3" />
                                        ) : (
                                            <Clock className="w-3 h-3" />
                                        )}
                                        {summary?.status || "draft"}
                                    </span>
                                </div>
                            </div>



                            {/* Share link */}

                        </div>

                        {/* Center column */}
                        <div className="flex-1 space-y-6">
                            {/* Published on + KPIs row */}
                            {isPublished && (access.published_at || summary?.modified_at) && (
                                <div className="flex flex-wrap items-center gap-4 mb-2">
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                        <Send className="w-5 h-5 text-red-500" />
                                        <span className="text-sm font-medium">
                                            Published on {dayjs(access.published_at || summary?.modified_at).format("MMM DD, YYYY")}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* KPIs: Visits, Active for, Responses */}
                            <div className="flex flex-wrap gap-6 text-sm">
                                <div className="flex items-center gap-2">
                                    <Eye className="w-4 h-4 text-gray-500" />
                                    <span className="text-gray-700 dark:text-gray-300 font-medium">Visits:</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">{visitsTotal}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-gray-500" />
                                    <span className="text-gray-700 dark:text-gray-300 font-medium">Active for:</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {activeForDays} day{activeForDays !== 1 ? "s" : ""}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-gray-500" />
                                    <span className="text-gray-700 dark:text-gray-300 font-medium">Responses:</span>
                                    {responseCount === 0 ? (
                                        <span className="text-gray-500 dark:text-gray-400 italic">No responses yet</span>
                                    ) : (
                                        <span className="font-semibold text-gray-900 dark:text-white">{responseCount}</span>
                                    )}
                                </div>
                            </div>

                            {/* Structure: Questions count + Pages count (prominent teal numbers) */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#3d3d3d] p-6 flex flex-col items-center justify-center">
                                    <p className="text-4xl font-bold text-teal-500 dark:text-teal-400">{questionCount}</p>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-1">
                                        {questionCount === 1 ? "Question" : "Questions"}
                                    </p>
                                </div>
                                <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#3d3d3d] p-6 flex flex-col items-center justify-center">
                                    <p className="text-4xl font-bold text-teal-500 dark:text-teal-400">{pageCount}</p>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-1">
                                        {pageCount === 1 ? "Page" : "Pages"}
                                    </p>
                                </div>
                            </div>


                            {/* QUESTIONS list from structure.question_titles */}
                            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#3d3d3d] p-6">
                                <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-4">
                                    Questions
                                </p>
                                {questionCount === 0 ? (
                                    <div className="flex flex-col items-center py-10 text-gray-400">
                                        <div className="w-20 h-20 mb-4 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                                            <FileQuestion className="w-10 h-10 text-orange-400" />
                                        </div>
                                        <p className="text-base font-medium text-gray-500 dark:text-gray-400 mb-1">
                                            Your survey is empty
                                        </p>
                                        <p className="text-sm text-gray-400 mb-4">
                                            Add questions in the builder to get started
                                        </p>
                                        <Button
                                            onClick={() =>
                                                navigate(
                                                    `/elections/survey-builder?surveyId=${surveyId}`
                                                )
                                            }
                                            className="bg-emerald-500 hover:bg-emerald-600 text-white"
                                        >
                                            ADD YOUR FIRST QUESTION
                                        </Button>
                                    </div>
                                ) : questionTitles.length > 0 ? (
                                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                                        {questionTitles.map((title, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-[#2a2a2a]"
                                            >
                                                <span className="text-xs font-semibold text-gray-400 w-6 flex-shrink-0 mt-0.5">
                                                    {idx + 1}.
                                                </span>
                                                <p className="text-sm text-gray-800 dark:text-gray-200">
                                                    {title || "Untitled question"}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                                        {(summary?.structure?.pages || []).map((page) =>
                                            (page.questions || []).map((q, qi) => (
                                                <div
                                                    key={q.question_id || qi}
                                                    className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-[#2a2a2a]"
                                                >
                                                    <span className="text-xs font-semibold text-gray-400 w-6 flex-shrink-0 mt-0.5">
                                                        {qi + 1}.
                                                    </span>
                                                    <p className="text-sm text-gray-800 dark:text-gray-200">
                                                        {q.title || "Untitled question"}
                                                    </p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>


                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
