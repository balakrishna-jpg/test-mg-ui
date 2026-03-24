// app/components/ElectionsWeb/Survey/MargadarshSurveysList.jsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "@remix-run/react";
import {
    Plus,
    Search,
    Pencil,
    BarChart2,
    Trash2,
    Loader2,
    ClipboardList,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { listMargadarshSurveys, deleteMargadarshSurvey } from "~/api";
import { message } from "antd";
import dayjs from "dayjs";

const STATUS_CONFIG = {
    draft: { label: "Draft", cls: "bg-gray-100 text-gray-600 dark:bg-[#2a2a2a] dark:text-gray-400" },
    active: { label: "Active", cls: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" },
    paused: { label: "Paused", cls: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400" },
    closed: { label: "Closed", cls: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400" },
};

const CATEGORY_LABELS = {
    general: "General",
    events: "Events",
    marketing: "Marketing",
    govt_political: "Govt / Political",
    ecommerce: "E-Commerce",
    business_survey: "Business",
    other: "Other",
    // Telangana / election-focused
    telangana_voter_mood: "Telangana Voter Mood",
    government_schemes_impact: "Government Schemes Impact",
    farmer_rural_distress: "Farmer / Rural Distress",
    youth_unemployment_jobs: "Youth Unemployment & Jobs",
    women_voters: "Women Voters",
    hyderabad_urban_issues: "Hyderabad Urban Issues",
    candidate_image_mla_mp: "Candidate Image & MLA/MP",
    caste_community_social: "Caste & Community / Social",
    booth_level_readiness: "Booth Level Readiness",
    anti_incumbency_change: "Anti-Incumbency / Change",
    minority_welfare_access: "Minority & Welfare Access",
    urban_body_municipal: "Urban Body / Municipal",
};

export default function MargadarshSurveysList() {
    
    const navigate = useNavigate();

    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const pageSize = 20;
    const [search, setSearch] = useState("");
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const fetchSurveys = async () => {
        setLoading(true);
        try {
            const res = await listMargadarshSurveys({ limit: pageSize, offset: (page - 1) * pageSize });
            if (res?.success) {
                setSurveys(res.data?.surveys || res.data || []);
                setTotal(res.data?.total || 0);
            }
        } catch {
            message.error("Failed to load surveys");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSurveys(); }, [page]);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await deleteMargadarshSurvey(deleteTarget.survey_id);
            message.success("Survey deleted");
            setDeleteTarget(null);
            fetchSurveys();
        } catch {
            message.error("Failed to delete survey");
        } finally {
            setDeleting(false);
        }
    };

    const filtered = surveys.filter(s =>
        search ? s.survey_name?.toLowerCase().includes(search.toLowerCase()) : true
    );

    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="min-h-[calc(100vh-49px)] flex flex-col bg-white dark:bg-[#111]">

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-[#2a2a2a]">
                <div>
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Surveys</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Manage and track your surveys</p>
                </div>
                <button
                    onClick={() => navigate(`/elections/surveys-new`)}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                    New Survey
                </button>
            </div>

            {/* ── Search bar ── */}
            <div className="px-6 py-2.5 border-b border-gray-100 dark:border-[#1e1e1e]">
                <div className="relative max-w-xs">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                        placeholder="Search surveys..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 dark:border-[#333] rounded bg-white dark:bg-[#111] text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors"
                    />
                </div>
            </div>

            {/* ── Table ── */}
            <div className="flex-1 overflow-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <ClipboardList className="w-10 h-10 mb-3 text-gray-300 dark:text-gray-600" />
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No surveys yet</p>
                        <p className="text-xs text-gray-400 mt-0.5 mb-4">Create your first survey to get started</p>
                        {/* <button
                            onClick={() => navigate(`/elections/surveys-new`)}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            New Survey
                        </button> */}
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-[#222] bg-white dark:bg-[#161616]">
                                <th className="px-6 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Survey Name</th>
                                <th className="px-6 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Category</th>
                                <th className="px-6 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Status</th>
                                <th className="px-6 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Created</th>
                                <th className="px-6 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Modified</th>
                                <th className="px-6 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((survey, idx) => {
                                const sc = STATUS_CONFIG[survey.status] || STATUS_CONFIG.draft;
                                return (
                                    <tr
                                        key={survey.survey_id || idx}
                                        onClick={() => navigate(`/elections/survey-summary?surveyId=${survey.survey_id}`)}
                                        className="border-b border-gray-50 dark:border-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-[#161616] cursor-pointer transition-colors group"
                                    >
                                        <td className="px-6 py-3 font-medium text-gray-900 dark:text-white text-sm">
                                            {survey.survey_name || "Untitled"}
                                        </td>
                                        <td className="px-6 py-3 text-gray-500 dark:text-gray-400 text-sm">
                                            {CATEGORY_LABELS[survey.survey_category] || survey.survey_category || "—"}
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${sc.cls}`}>
                                                {sc.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-gray-500 dark:text-gray-400 text-sm tabular-nums">
                                            {survey.created_at ? dayjs(survey.created_at).format("MMM D, YYYY") : "—"}
                                        </td>
                                        <td className="px-6 py-3 text-gray-500 dark:text-gray-400 text-sm tabular-nums">
                                            {survey.updated_at ? dayjs(survey.updated_at).format("MMM D, YYYY") : "—"}
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={e => { e.stopPropagation(); navigate(`/elections/survey-builder?surveyId=${survey.survey_id}`); }}
                                                    className="p-1.5 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
                                                    title="Open Builder"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={e => { e.stopPropagation(); navigate(`/elections/survey-summary?surveyId=${survey.survey_id}`); }}
                                                    className="p-1.5 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
                                                    title="View Summary"
                                                >
                                                    <BarChart2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={e => { e.stopPropagation(); setDeleteTarget(survey); }}
                                                    className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ── Pagination ── */}
            {!loading && total > pageSize && (
                <div className="border-t border-gray-100 dark:border-[#222] px-6 py-2.5 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                        {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total} surveys
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-1.5 rounded border border-gray-200 dark:border-[#333] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs text-gray-500 px-2">{page} / {totalPages}</span>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={page >= totalPages}
                            className="p-1.5 rounded border border-gray-200 dark:border-[#333] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            )}

            {/* ── Delete Confirm ── */}
            {deleteTarget && (
                <>
                    <div className="fixed inset-0 z-40 bg-black/40" onClick={() => !deleting && setDeleteTarget(null)} />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded shadow-xl p-6 max-w-sm w-full">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Delete Survey</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                                Are you sure you want to delete <strong className="text-gray-700 dark:text-gray-300">{deleteTarget.survey_name}</strong>? This cannot be undone.
                            </p>
                            <div className="flex items-center justify-end gap-2">
                                <button
                                    onClick={() => setDeleteTarget(null)}
                                    disabled={deleting}
                                    className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-[#333] rounded hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
