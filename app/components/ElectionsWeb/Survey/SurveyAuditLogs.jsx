// app/components/ElectionsWeb/Survey/SurveyAuditLogs.jsx
import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "@remix-run/react";
import {
    ArrowLeft,
    Loader2,
    FileText,
    Download,
    Filter,
    ChevronDown,
    User,
} from "lucide-react";
import {
    getMargadarshSurveyAuditLogs,
    exportMargadarshSurveyAuditLogs,
    getMargadarshSurveySummary,
    updateMargadarshSurvey,
} from "~/api";
import { message } from "antd";
import { Pencil } from "lucide-react";
import dayjs from "dayjs";

const SUB_TABS = [
    { label: "Summary", section: "survey-summary" },
    { label: "Builder", section: "survey-builder" },
    { label: "Responses", section: "survey-responses" },
    { label: "Audit Logs", section: "survey-audit" },
    { label: "Launch", section: "survey-launch" },
    { label: "Reports", section: "survey-reports" },
];

// Build a human-readable sentence from a log entry.
// Tries `message` first, falls back to event_type + actor_name.
function buildMessage(log) {
    if (log.message) return log.message;
    if (log.description) return log.description;
    const actor = log.actor?.display_name || "Someone";
    const evt = (log.event_type || "").replace(/_/g, " ");
    return `${actor} performed ${evt}`;
}

// Decide whether the "linked word" in the sentence should be blue.
// We bold/color specific keywords that match known event types.
const LINKED_KEYWORDS = ["response", "question", "page", "survey"];

function FormattedMessage({ log }) {
    const text = buildMessage(log);
    // Check if actor_name appears at the start (e.g. "Balu konda published the survey")
    // vs anonymous entries. Simple render with blue link highlight on keywords.
    const parts = [];
    let remaining = text;

    LINKED_KEYWORDS.forEach((kw) => {
        const idx = remaining.toLowerCase().indexOf(kw);
        if (idx !== -1) {
            parts.push({ before: remaining.slice(0, idx), link: remaining.slice(idx, idx + kw.length), after: remaining.slice(idx + kw.length) });
            remaining = "";
        }
    });

    if (parts.length === 0) {
        return <span className="text-sm text-gray-700 dark:text-gray-300">{text}</span>;
    }

    const { before, link, after } = parts[0];
    return (
        <span className="text-sm text-gray-700 dark:text-gray-300">
            {before}
            <span className="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">{link}</span>
            {after}
        </span>
    );
}

export default function SurveyAuditLogs() {
    
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const surveyId = searchParams.get("surveyId");

    const [surveyName, setSurveyName] = useState("");
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);

    const [isEditingName, setIsEditingName] = useState(false);
    const [editNameValue, setEditNameValue] = useState("");

    const handleNameSave = async () => {
        if (!editNameValue.trim() || editNameValue.trim() === surveyName) {
            setIsEditingName(false);
            return;
        }
        try {
            await updateMargadarshSurvey(surveyId, { survey_name: editNameValue.trim() });
            setIsEditingName(false);
            setSurveyName(editNameValue.trim());
            message.success("Survey name updated");
        } catch {
            message.error("Failed to update survey name");
        }
    };

    useEffect(() => {
        if (!surveyId) return;
        getMargadarshSurveySummary(surveyId)
            .then(res => { if (res?.success) setSurveyName(res.data?.survey_name || ""); })
            .catch(() => { });
    }, [surveyId]);

    const fetchLogs = async () => {
        if (!surveyId) return;
        setLoading(true);
        try {
            const res = await getMargadarshSurveyAuditLogs(surveyId, { limit: 200 });
            if (res?.success) setGroups(res.data?.groups || []);
        } catch {
            message.error("Failed to load audit logs");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLogs(); }, [surveyId]);

    const handleExport = async (format) => {
        setExporting(true);
        setShowExportMenu(false);
        try {
            await exportMargadarshSurveyAuditLogs(surveyId, { format });
            message.success(`Export started (${format.toUpperCase()})`);
        } catch {
            message.error("Export failed");
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="h-[calc(100vh-49px)] flex flex-col bg-white dark:bg-[#111]">

            {/* ── Top nav (same style as Builder) ── */}
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
                                    setEditNameValue(surveyName || "");
                                }
                            }}
                            className="text-sm font-medium text-gray-900 dark:text-white bg-transparent border-b border-gray-400 focus:outline-none focus:border-blue-500 w-full"
                        />
                    </div>
                ) : (
                    <div
                        className="flex items-center gap-2 mr-auto cursor-pointer group"
                        onClick={() => {
                            setEditNameValue(surveyName || "");
                            setIsEditingName(true);
                        }}
                    >
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-xs">
                            {surveyName || "Survey"}
                        </span>
                        <Pencil className="w-3.5 h-3.5 text-gray-400 transition-opacity" />
                    </div>
                )}
                <div className="flex items-center h-full">
                    {SUB_TABS.map(tab => {
                        const isActive = tab.section === "survey-audit";
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

            {/* ── Content ── */}
            <div className="flex-1 overflow-y-auto">

                {/* Page title + actions bar */}
                <div className="flex items-start justify-between px-8 pt-6 pb-4 border-b border-gray-100 dark:border-[#222]">
                    <div>
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white leading-tight">
                            Audit Logs
                        </h2>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Track all the activities associated with the survey
                        </p>
                    </div>
                    {/* <div className="flex items-center gap-2 mt-0.5">
                        
                        <button className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors px-2 py-1.5 border border-gray-200 dark:border-[#333] rounded">
                            <Filter className="w-3.5 h-3.5" />
                            <ChevronDown className="w-3 h-3 ml-0.5" />
                        </button> */}

                    {/*                        
                        <div className="relative">
                            <button
                                onClick={() => setShowExportMenu(v => !v)}
                                disabled={exporting}
                                className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-[#333] rounded px-3 py-1.5 transition-colors disabled:opacity-50"
                            >
                                {exporting
                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    : <span>Export</span>
                                }
                                <ChevronDown className="w-3 h-3 ml-0.5" />
                            </button>
                            {showExportMenu && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
                                    <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded shadow-lg overflow-hidden w-28">
                                        {["csv", "xlsx", "pdf"].map(fmt => (
                                            <button
                                                key={fmt}
                                                onClick={() => handleExport(fmt)}
                                                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors"
                                            >
                                                {fmt.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div> */}
                    {/* </div> */}
                </div>

                {/* Log list */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    </div>
                ) : groups.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <FileText className="w-10 h-10 mb-3 opacity-30" />
                        <p className="text-sm font-medium">No audit logs yet</p>
                        <p className="text-xs mt-1 text-gray-300 dark:text-gray-600">
                            Actions on this survey will appear here
                        </p>
                    </div>
                ) : (
                    <div className="px-8 py-2">
                        {groups.map((group, gi) => (
                            <div key={gi} className="mt-5">
                                {/* Date header */}
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">
                                    {group.day
                                        ? dayjs(group.day).format("MMM D, YYYY")
                                        : "Unknown Date"}
                                </p>

                                {/* Entries */}
                                <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded">
                                    {(group.logs || group.events || []).map((log, li, arr) => (
                                        <div
                                            key={log.log_id || li}
                                            className={`flex items-center gap-4 px-4 py-3 ${li < arr.length - 1 ? "border-b border-gray-100 dark:border-[#222]" : ""}`}
                                        >
                                            {/* Left accent + time */}
                                            <div className="flex items-center gap-3 flex-shrink-0 w-24">
                                                <div className="w-0.5 h-5 bg-gray-200 dark:bg-[#3a3a3a] flex-shrink-0" />
                                                <span className="text-xs text-gray-400 tabular-nums">
                                                    {log.occurred_at
                                                        ? dayjs(log.occurred_at).format("hh:mm A")
                                                        : "—"}
                                                </span>
                                            </div>

                                            {/* Avatar */}
                                            <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center flex-shrink-0">
                                                <User className="w-3.5 h-3.5 text-gray-400" />
                                            </div>

                                            {/* Message */}
                                            <div className="flex-1 min-w-0">
                                                <FormattedMessage log={log} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <div className="h-8" />
                    </div>
                )}
            </div>
        </div>
    );
}
