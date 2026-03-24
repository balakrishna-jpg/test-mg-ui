// app/components/ElectionsWeb/Survey/SurveyLaunch.jsx
import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "@remix-run/react";
import { ArrowLeft, Loader2, Globe, Copy } from "lucide-react";
import {
    getMargadarshSurveySummary,
    publishMargadarshSurvey,
    unpublishMargadarshSurvey,
    updateMargadarshSurvey,
} from "~/api";
import { message } from "antd";
import { Pencil } from "lucide-react";

const SUB_TABS = [
    { label: "Summary", section: "survey-summary" },
    { label: "Builder", section: "survey-builder" },
    { label: "Responses", section: "survey-responses" },
    { label: "Audit Logs", section: "survey-audit" },
    { label: "Launch", section: "survey-launch" },
    { label: "Reports", section: "survey-reports" },
];

export default function SurveyLaunch() {
    
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const surveyId = searchParams.get("surveyId");

    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [publishing, setPublishing] = useState(false);
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

    const fetchSummary = async () => {
        if (!surveyId) return;
        setLoading(true);
        try {
            const res = await getMargadarshSurveySummary(surveyId);
            if (res?.success) setSummary(res.data);
        } catch {
            message.error("Failed to load survey");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSummary(); }, [surveyId]);

    const handlePublish = async () => {
        if (!surveyId) return;
        setPublishing(true);
        try {
            if (summary?.status === "active") {
                await unpublishMargadarshSurvey(surveyId);
                message.success("Survey unpublished");
            } else {
                await publishMargadarshSurvey(surveyId);
                message.success("Survey published!");
            }
            fetchSummary();
        } catch {
            message.error("Failed to update survey status");
        } finally {
            setPublishing(false);
        }
    };

    const copyLink = (url) => {
        navigator.clipboard.writeText(url);
        message.success("Link copied!");
    };

    const isPublished = summary?.status === "active";
    const publicUrl =
        summary?.public_url ||
        summary?.public_link ||
        (typeof window !== "undefined" ? `${window.location.origin}/survey/${surveyId}` : "");

    if (!surveyId) {
        return (
            <div className="flex-1 flex items-center justify-center bg-white dark:bg-[#111]">
                <p className="text-sm text-gray-400">No survey selected.</p>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-49px)] flex flex-col bg-white dark:bg-[#111]">

            {/* ── Top nav (underline tabs – consistent with Builder/AuditLogs) ── */}
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
                <div className="flex items-center h-full">
                    {SUB_TABS.map(tab => {
                        const isActive = tab.section === "survey-launch";
                        return (
                            <button
                                key={tab.section}
                                onClick={() => navigate(`/elections/${tab.section}?surveyId=${surveyId}`)}
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

            {/* ── Body ── */}
            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#0d0d0d] flex items-start justify-center p-10">
                    {!isPublished ? (
                        /* ── Unpublished state ── */
                        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded p-10 max-w-md w-full text-center">
                            <div className="flex justify-center mb-5">
                                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center">
                                    <Globe className="w-8 h-8 text-gray-400" />
                                </div>
                            </div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Your survey is not published yet
                            </p>
                            <p className="text-xs text-gray-400 mb-6">
                                Publish it to share with respondents and start collecting answers.
                            </p>
                            <button
                                onClick={handlePublish}
                                disabled={publishing}
                                className="w-full py-2.5 text-sm font-semibold tracking-wide text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {publishing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                PUBLISH
                            </button>
                        </div>
                    ) : (
                        /* ── Published state – matches reference image ── */
                        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded p-7 max-w-2xl w-full">
                            {/* Title */}
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-0.5">
                                Survey link
                            </h3>
                            <p className="text-xs text-gray-400 mb-4">
                                Use this link to distribute your survey
                            </p>

                            {/* URL row */}
                            <div className="flex items-stretch gap-0 mb-4">
                                <input
                                    readOnly
                                    value={publicUrl}
                                    className="flex-1 text-sm border border-gray-300 dark:border-[#3a3a3a] border-r-0 rounded-l bg-white dark:bg-[#111] text-gray-700 dark:text-gray-300 px-3 py-2 focus:outline-none truncate"
                                />
                                <button
                                    onClick={() => window.open(publicUrl, "_blank", "noopener,noreferrer")}
                                    className="px-5 text-xs font-bold tracking-widest text-white bg-teal-500 hover:bg-teal-600 transition-colors rounded-r uppercase whitespace-nowrap"
                                >
                                    Access This Survey
                                </button>
                            </div>

                            {/* Share row */}
                            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                                <span className="text-xs font-medium">Share:</span>
                                {/* Facebook */}
                                <a
                                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicUrl)}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="text-gray-500 hover:text-blue-600 transition-colors"
                                    title="Share on Facebook"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                                    </svg>
                                </a>
                                {/* X (Twitter) */}
                                <a
                                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(publicUrl)}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                                    title="Share on X"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                </a>
                                {/* LinkedIn */}
                                <a
                                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicUrl)}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="text-gray-500 hover:text-blue-700 transition-colors"
                                    title="Share on LinkedIn"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zm2-3a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
                                    </svg>
                                </a>
                                {/* Copy */}
                                <button
                                    onClick={() => copyLink(publicUrl)}
                                    className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors ml-1"
                                    title="Copy link"
                                >
                                    <Copy className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {/* Divider + Unpublish */}
                            {/* <div className="mt-6 pt-5 border-t border-gray-100 dark:border-[#222] flex items-center justify-between">
                                <p className="text-xs text-gray-400">
                                    Survey is <span className="text-green-600 font-medium">Live</span>
                                </p>
                                <button
                                    onClick={handlePublish}
                                    disabled={publishing}
                                    className="px-4 py-1.5 text-xs font-medium text-red-600 border border-red-200 dark:border-red-900/50 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    {publishing && <Loader2 className="w-3 h-3 animate-spin" />}
                                    Unpublish
                                </button>
                            </div> */}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
