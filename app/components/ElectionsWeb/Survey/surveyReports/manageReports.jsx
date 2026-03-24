// app/components/ElectionsWeb/Survey/surveyReports/manageReports.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "@remix-run/react";
import {
    ArrowLeft,
    Loader2,
    Users,
    Eye,
    Calendar,
    Clock,
    TrendingUp,
    BarChart2,
    Pencil,
} from "lucide-react";
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { getMargadarshSurveySummaryReport, updateMargadarshSurvey } from "~/api";
import { message } from "antd";

// ── Color palette for chart slices / bars ───────────────────────────────────
const CHART_COLORS = [
    "#6366f1", "#ec4899", "#14b8a6", "#f97316", "#84cc16",
    "#8b5cf6", "#06b6d4", "#eab308", "#ef4444", "#10b981",
    "#f43f5e", "#0ea5e9", "#a855f7", "#22c55e", "#fb923c",
];

// ── Tiny percentage-bar pill used in the table ──────────────────────────────
function PercentBar({ pct }) {
    const fill = Math.max(0, Math.min(100, parseFloat(pct) || 0));
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-[#2a2a2a] overflow-hidden">
                <div
                    className="h-full rounded-full bg-indigo-500 transition-all"
                    style={{ width: `${fill}%` }}
                />
            </div>
            <span className="text-xs tabular-nums text-gray-600 dark:text-gray-400 w-12 text-right">
                {fill.toFixed(2)}%
            </span>
        </div>
    );
}

// ── Custom tooltip for charts ────────────────────────────────────────────────
function CustomTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const d = payload[0];
    return (
        <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#333] rounded shadow-lg px-3 py-2 text-xs">
            <p className="font-semibold text-gray-800 dark:text-white mb-0.5">{d.name}</p>
            <p className="text-gray-500 dark:text-gray-400">
                Count: <span className="font-medium text-gray-800 dark:text-white">{d.value}</span>
            </p>
            {d.payload?.response_percent !== undefined && (
                <p className="text-gray-500 dark:text-gray-400">
                    Percent:{" "}
                    <span className="font-medium text-gray-800 dark:text-white">
                        {d.payload.response_percent}%
                    </span>
                </p>
            )}
        </div>
    );
}

// ── Horizontal bar chart (Zoho-style) ───────────────────────────────────────
function HorizontalBarChart({ data }) {
    const chartData = data.map((d, i) => ({
        name: d.label,
        value: d.response_count,
        response_percent: d.response_percent,
        fill: CHART_COLORS[i % CHART_COLORS.length],
    }));

    return (
        <ResponsiveContainer width="100%" height={Math.max(160, chartData.length * 42)}>
            <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 4, right: 40, left: 8, bottom: 4 }}
            >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    tickFormatter={(v) => `${v}%`}
                    domain={[0, 100]}
                />
                <YAxis
                    dataKey="name"
                    type="category"
                    width={130}
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} label={{ position: "right", fontSize: 11, fill: "#6b7280", formatter: (v) => `${v}` }}>
                    {chartData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}

// ── Vertical column chart ────────────────────────────────────────────────────
function VerticalBarChart({ data }) {
    const chartData = data.map((d, i) => ({
        name: d.label,
        value: d.response_count,
        response_percent: d.response_percent,
        fill: CHART_COLORS[i % CHART_COLORS.length],
    }));

    return (
        <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    interval={0}
                    angle={-30}
                    textAnchor="end"
                />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} label={{ position: "top", fontSize: 11, fill: "#6b7280" }}>
                    {chartData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}

// ── Pie chart ────────────────────────────────────────────────────────────────
const RADIAN = Math.PI / 180;
function renderCustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
    if (percent < 0.05) return null;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
            {`${(percent * 100).toFixed(1)}%`}
        </text>
    );
}

function PieChartBlock({ data, legendPosition = "bottom" }) {
    const chartData = data.map((d, i) => ({
        name: d.label,
        value: d.response_count,
        response_percent: d.response_percent,
    }));
    const isRight = legendPosition === "right";

    return (
        <div className={`flex ${isRight ? "flex-row gap-6 items-center" : "flex-col"}`}>
            <ResponsiveContainer width={isRight ? 220 : "100%"} height={220}>
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        dataKey="value"
                        labelLine={false}
                        label={renderCustomLabel}
                    >
                        {chartData.map((_, index) => (
                            <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                </PieChart>
            </ResponsiveContainer>
            {/* Legend */}
            <div className={`flex ${isRight ? "flex-col gap-1.5" : "flex-row flex-wrap justify-center gap-x-4 gap-y-1.5 mt-2"}`}>
                {chartData.map((d, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                        <span
                            className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                        />
                        {d.name}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Question block ───────────────────────────────────────────────────────────
function QuestionReportBlock({ question, questionNumber }) {
    const {
        show_chart = true,
        chart_type = "bar",
        legend_position = "bottom",
        show_data_table = true,
    } = question.customization || {};

    const choices = question.choices_data || [];
    const hasImages = choices.some((c) => c.image_url);

    return (
        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2e2e2e] rounded overflow-hidden">

            {/* ── Top header ─────────────────────────────────── */}
            <div className="px-6 pt-5 pb-3">
                {/* Row 1: Q-number + action buttons */}
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-400 font-medium">{questionNumber}</span>
                    <div className="flex items-center gap-2">
                        <button className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-[#444] rounded hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors">
                            Customize
                        </button>

                        <div className="relative flex items-center">
                            <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-[#444] rounded hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors">
                                Export
                                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M6 9l6 6 6-6" /></svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Row 2: Question title */}
                <h3 className="text-base font-semibold text-gray-800 dark:text-white leading-snug mb-1">
                    {question.question_title || "Untitled Question"}
                </h3>

                {/* Row 3: Answered / Skipped */}
                <p className="text-xs text-gray-400">
                    Answered:&nbsp;<span className="text-gray-600 dark:text-gray-300">{question.answered_count ?? 0}</span>
                    &nbsp;&nbsp;&nbsp;
                    Skipped:&nbsp;<span className="text-gray-600 dark:text-gray-300">{question.skipped_count ?? 0}</span>
                    {question.average_rating != null && (
                        <>&nbsp;&nbsp;&nbsp;Avg Rating:&nbsp;<span className="text-gray-600 dark:text-gray-300">{question.average_rating}</span></>
                    )}
                </p>
            </div>

            {/* ── Chart area — light gray container ──────────── */}
            {show_chart && choices.length > 0 && (
                <div className="mx-6 mb-4 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#2a2a2a] rounded px-4 py-6">
                    {chart_type === "pie" && (
                        <PieChartBlock data={choices} legendPosition={legend_position} />
                    )}
                    {chart_type === "bar" && (
                        <HorizontalBarChart data={choices} />
                    )}
                    {chart_type === "column" && (
                        <VerticalBarChart data={choices} />
                    )}
                    {!["pie", "bar", "column"].includes(chart_type) && (
                        <HorizontalBarChart data={choices} />
                    )}
                </div>
            )}

            {/* ── Data table ─────────────────────────────────── */}
            {show_data_table && choices.length > 0 && (
                <div className="border-t border-gray-100 dark:border-[#2a2a2a]">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-[#1e1e1e] border-b border-gray-200 dark:border-[#2a2a2a]">
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 w-1/2">
                                    {hasImages ? "Image choice" : "Answer choice"}
                                </th>
                                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 w-1/4">
                                    Response percent
                                </th>
                                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 w-1/4">
                                    Response count
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-[#252525]">
                            {choices.map((row, idx) => (
                                <tr key={idx} className="hover:bg-gray-50/60 dark:hover:bg-[#1c1c1c] transition-colors">
                                    <td className="px-5 py-3 text-gray-700 dark:text-gray-300">
                                        <div className="flex items-center gap-3">
                                            {row.image_url && (
                                                <img
                                                    src={row.image_url}
                                                    alt={row.label}
                                                    className="w-10 h-10 rounded object-cover flex-shrink-0 border border-gray-200 dark:border-[#333]"
                                                />
                                            )}
                                            <span className="text-sm text-gray-700 dark:text-gray-300">{row.label}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-center tabular-nums text-gray-700 dark:text-gray-300 text-sm">
                                        {parseFloat(row.response_percent || 0).toFixed(2)}%
                                    </td>
                                    <td className="px-5 py-3 text-center tabular-nums text-gray-700 dark:text-gray-300 text-sm font-medium">
                                        {row.response_count}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* No data */}
            {choices.length === 0 && (
                <div className="px-6 py-8 text-center text-sm text-gray-400">
                    No response data available for this question.
                </div>
            )}
        </div>
    );
}


// ── KPI card — Zoho-style: large coral number + label ────────────────────────
function KpiCard({ label, value }) {
    return (
        <div className="flex flex-col gap-1 p-6">
            <p className="text-4xl font-light text-[#f05252] dark:text-[#f87171] leading-none tabular-nums">
                {value ?? 0}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{label}</p>
        </div>
    );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function ManageReports() {
    
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const surveyId = searchParams.get("surveyId");

    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [surveyName, setSurveyName] = useState("");
    const [isEditingName, setIsEditingName] = useState(false);
    const [editNameValue, setEditNameValue] = useState("");

    const fetchReport = useCallback(async () => {
        if (!surveyId) return;
        setLoading(true);
        try {
            const res = await getMargadarshSurveySummaryReport(surveyId);
            if (res?.success) {
                setReportData(res.data);
                setSurveyName(res.data?.survey_name || "Survey");
            }
        } catch (err) {
            console.error(err);
            message.error("Failed to load summary report");
        } finally {
            setLoading(false);
        }
    }, [surveyId]);

    useEffect(() => { fetchReport(); }, [fetchReport]);

    const handleNameSave = async () => {
        const trimmed = editNameValue.trim();
        if (!trimmed || trimmed === surveyName) {
            setIsEditingName(false);
            return;
        }
        try {
            await updateMargadarshSurvey(surveyId, { survey_name: trimmed });
            setSurveyName(trimmed);
            setIsEditingName(false);
            message.success("Survey name updated");
        } catch {
            message.error("Failed to update survey name");
        }
    };

    const kpis = reportData?.kpis || {};
    const questions = reportData?.questions || [];

    // ── Tab navigation (same as other survey pages) ──────────────────────────
    const tabs = [
        { label: "Summary", section: "survey-summary" },
        { label: "Builder", section: "survey-builder" },
        { label: "Responses", section: "survey-responses" },
        { label: "Audit Logs", section: "survey-audit" },
        { label: "Launch", section: "survey-launch" },
        { label: "Reports", section: "survey-reports" },
    ];

    return (
        <div className="h-[calc(100vh-49px)] flex flex-col bg-gray-50 dark:bg-[#0f0f0f]">

            {/* ── Top nav bar ─────────────────────────────────────────────── */}
            <div className="flex-shrink-0 bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-[#333] px-4 flex items-center">
                <button
                    onClick={() => navigate(`/elections/surveys-list`)}
                    className="p-2 mr-1 text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>

                {/* Editable survey name */}
                {isEditingName ? (
                    <div className="mr-auto max-w-xs flex items-center">
                        <input
                            autoFocus
                            value={editNameValue}
                            onChange={(e) => setEditNameValue(e.target.value)}
                            onBlur={handleNameSave}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleNameSave();
                                if (e.key === "Escape") { setIsEditingName(false); setEditNameValue(surveyName); }
                            }}
                            className="text-sm font-medium text-gray-900 dark:text-white bg-transparent border-b border-gray-400 focus:outline-none focus:border-blue-500 w-full"
                        />
                    </div>
                ) : (
                    <div
                        className="flex items-center gap-2 mr-auto cursor-pointer group"
                        onClick={() => { setEditNameValue(surveyName); setIsEditingName(true); }}
                    >
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-xs">
                            {surveyName || "Survey"}
                        </span>
                        <Pencil className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                )}

                {/* Tab navigation */}
                <div className="flex items-center h-full">
                    {tabs.map((tab) => {
                        const isActive = tab.section === "survey-reports";
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

            {/* ── Body ────────────────────────────────────────────────────── */}
            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
            ) : !reportData ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
                    <BarChart2 className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No report data found</p>
                    <p className="text-xs text-gray-400">Responses will appear here once people have submitted the survey.</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

                        {/* ── Response Statistics panel — outer white card ── */}
                        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2e2e2e] rounded shadow-sm">
                            {/* Panel header row */}
                            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#2a2a2a]">
                                <h2 className="text-sm font-semibold text-gray-800 dark:text-white">Response Statistics</h2>

                            </div>
                            {/* 4 stat cards inside */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100 dark:divide-[#2a2a2a] p-4 gap-0">
                                <KpiCard label="Survey Visits" value={kpis.visits_total ?? 0} />
                                <KpiCard label="Total Responses" value={kpis.responses_total ?? 0} />
                                <KpiCard label="Completed Responses" value={kpis.completed_responses ?? kpis.todays_responses ?? 0} />
                                <KpiCard label="Partial Responses" value={kpis.partial_responses ?? kpis.active_for_days ?? 0} />
                            </div>
                        </div>

                        {/* Latest response stamp */}
                        {kpis.latest_response_at && (
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <Calendar className="w-3.5 h-3.5" />
                                Last response:{" "}
                                <span className="font-medium text-gray-600 dark:text-gray-300">
                                    {new Date(kpis.latest_response_at).toLocaleString()}
                                </span>
                            </div>
                        )}

                        {/* ── Divider ─────────────────────────────────────── */}
                        <div className="border-b border-gray-200 dark:border-[#2a2a2a]" />

                        {/* ── Questions ───────────────────────────────────── */}
                        {questions.length === 0 ? (
                            <div className="text-center py-16 text-gray-400">
                                <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                <p className="text-sm">No questions to display in the report.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <p className="text-xs uppercase tracking-wider font-semibold text-gray-400">
                                    Page 1
                                </p>
                                {questions.map((question, index) => (
                                    <QuestionReportBlock
                                        key={question.question_id || index}
                                        question={question}
                                        questionNumber={`Q${index + 1}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
