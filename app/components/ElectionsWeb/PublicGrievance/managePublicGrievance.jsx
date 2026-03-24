// app/components/ElectionsWeb/PublicGrievance/managePublicGrievance.jsx
// Public-facing citizen grievance portal
// Views: home | submit | success | track

import { useState, useRef, useEffect } from "react";
import {
    getOrgPublicInfo,
    createPublicTicket,
    trackPublicTicket,
    addPublicTicketReply,
    getCustomCategories,
} from "~/utils/GrievanceService";
import { Map, Droplet, Zap, Toilet, Hospital, BookCheck, ClipboardList, HeartPulse, AlertCircle, Search, Building, Tag, Copy, CheckCheck } from "lucide-react";


// ─── Category definitions ────────────────────────────────────────────────────
const CATEGORIES = [
    {
        id: "infrastructure",
        label: "Public Infrastructure",
        icon: <Building />,
        description: "Parks, public buildings, bus stops, community halls",
        color: "#ffedd5",
        accent: "#ea580c",
    },
    {
        id: "water_supply",
        label: "Water Supply",
        icon: <Droplet />,
        description: "Water shortage, leakage, quality issues, billing",
        color: "#e0f2fe",
        accent: "#0284c7",
    },
    {
        id: "electricity",
        label: "Electricity",
        icon: <Zap />,
        description: "Power cuts, faulty meters, streetlights, wiring",
        color: "#fef9c3",
        accent: "#ca8a04",
    },
    {
        id: "roads",
        label: "Roads & Transport",
        icon: <Map />,
        description: "Potholes, road damage, traffic signals, footpaths",
        color: "#e8f4fd",
        accent: "#2563eb",
    },
    {
        id: "sanitation",
        label: "Sanitation",
        icon: <Toilet />,
        description: "Garbage collection, drainage, sewage, cleanliness",
        color: "#dcfce7",
        accent: "#16a34a",
    },
    {
        id: "health",
        label: "Health Services",
        icon: <HeartPulse />,
        description: "Hospitals, clinics, medicines, public health",
        color: "#fce7f3",
        accent: "#db2777",
    },
    {
        id: "education",
        label: "Education",
        icon: <BookCheck />,
        description: "Schools, angwanwadis, libraries, scholarships",
        color: "#e0e7ff",
        accent: "#4f46e5",
    },
    {
        id: "other",
        label: "Other Issues",
        icon: <ClipboardList />,
        description: "Any other civic issue not listed above",
        color: "#f3e8ff",
        accent: "#9333ea",
    },
];

// ─── Timeline steps ──────────────────────────────────────────────────────────
const TIMELINE_STEPS = [
    { id: "open", label: "Grievance Received" },
    { id: "pending", label: "Pending Assignment" },
    { id: "in_progress", label: "In Progress / Assessed" },
    { id: "on_hold", label: "On Hold" },
    { id: "work_order_issued", label: "Work Order Issued" },
    { id: "work_in_progress", label: "Work in Progress" },
    { id: "work_completed", label: "Work Completed" },
    { id: "resolved", label: "Resolved" },
    { id: "closed", label: "Closed" },
];

const STATUS_ORDER = {
    open: 0,
    pending: 1,
    in_progress: 2,
    on_hold: 2,
    work_order_issued: 3,
    work_in_progress: 4,
    work_completed: 5,
    resolved: 6,
    closed: 7,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const PRIORITY_COLORS = {
    low: "#16a34a",
    medium: "#ca8a04",
    high: "#dc2626",
    urgent: "#7c3aed",
};

// ─── Styles (inline object helpers) ─────────────────────────────────────────
const S = {
    // Hero / page-level
    page: {
        minHeight: "100vh",
        background: "#f8fafc",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
    },
    hero: {
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #1d4ed8 100%)",
        padding: "64px 24px",
        textAlign: "center",
        color: "#fff",
    },
    badge: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "rgba(255,255,255,0.12)",
        border: "1px solid rgba(255,255,255,0.2)",
        borderRadius: 999,
        padding: "6px 16px",
        fontSize: 13,
        marginBottom: 20,
        backdropFilter: "blur(8px)",
    },
    h1: {
        fontSize: "clamp(28px, 5vw, 52px)",
        fontWeight: 800,
        margin: "0 0 16px",
        letterSpacing: "-1px",
        lineHeight: 1.1,
    },
    subtitle: {
        fontSize: 17,
        color: "rgba(255,255,255,0.75)",
        maxWidth: 560,
        margin: "0 auto 32px",
        lineHeight: 1.6,
    },
    btnRow: {
        display: "flex",
        gap: 12,
        justifyContent: "center",
        flexWrap: "wrap",
        marginBottom: 40,
    },
    btnPrimary: {
        background: "linear-gradient(135deg, #4F6EF7, #6366f1)",
        color: "#fff",
        border: "none",
        borderRadius: 10,
        padding: "13px 28px",
        fontSize: 15,
        fontWeight: 600,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 8,
        transition: "transform 0.15s, box-shadow 0.15s",
        boxShadow: "0 4px 20px rgba(79,110,247,0.4)",
    },
    btnOutline: {
        background: "rgba(255,255,255,0.1)",
        color: "#fff",
        border: "1px solid rgba(255,255,255,0.3)",
        borderRadius: 10,
        padding: "13px 28px",
        fontSize: 15,
        fontWeight: 600,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 8,
        backdropFilter: "blur(8px)",
        transition: "background 0.15s",
    },
    statsRow: {
        display: "flex",
        gap: 24,
        justifyContent: "center",
        flexWrap: "wrap",
    },
    statItem: {
        textAlign: "center",
    },
    statNum: {
        fontSize: 28,
        fontWeight: 800,
        color: "#fff",
        display: "block",
    },
    statLabel: {
        fontSize: 12,
        color: "rgba(255,255,255,0.6)",
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    // Category grid
    gridSection: {
        maxWidth: 1100,
        margin: "0 auto",
        padding: "56px 24px",
    },
    gridH2: {
        fontSize: 26,
        fontWeight: 700,
        color: "#0f172a",
        marginBottom: 8,
        textAlign: "center",
    },
    gridSub: {
        textAlign: "center",
        color: "#64748b",
        marginBottom: 36,
        fontSize: 15,
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 20,
        maxHeight: 500,
        overflowY: "auto",
        padding: "8px",
    },
    card: (accent, bg, hovered) => ({
        background: hovered ? bg : "#fff",
        border: `2px solid ${hovered ? accent : "#e2e8f0"}`,
        borderRadius: 16,
        padding: "24px 20px",
        cursor: "pointer",
        transition: "all 0.2s",
        transform: hovered ? "translateY(-4px)" : "none",
        boxShadow: hovered
            ? `0 12px 32px rgba(0,0,0,0.12)`
            : "0 1px 4px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
    }),
    cardHeader: {
        display: "flex",
        alignItems: "center",
        gap: 14,
    },
    iconBox: (accent, bg) => ({
        width: 52,
        height: 52,
        borderRadius: 14,
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 26,
        flexShrink: 0,
    }),
    cardTitle: {
        fontSize: 16,
        fontWeight: 700,
        color: "#0f172a",
    },
    cardDesc: {
        fontSize: 13,
        color: "#64748b",
        lineHeight: 1.5,
    },
    cardActive: (accent) => ({
        fontSize: 12,
        color: accent,
        fontWeight: 600,
        marginTop: 4,
    }),
    // Quick track bar
    trackBar: {
        background: "linear-gradient(135deg, #4F6EF7 0%, #6366f1 100%)",
        padding: "28px 24px",
    },
    trackBarInner: {
        maxWidth: 700,
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        gap: 16,
        flexWrap: "wrap",
    },
    trackBarText: {
        color: "#fff",
        fontWeight: 600,
        fontSize: 16,
        flex: "0 0 auto",
    },
    trackInput: {
        flex: 1,
        minWidth: 200,
        padding: "11px 16px",
        borderRadius: 10,
        border: "none",
        fontSize: 14,
        outline: "none",
        background: "rgba(255,255,255,0.95)",
        color: "#0f172a",
    },
    trackBtn: {
        background: "#fff",
        color: "#4F6EF7",
        border: "none",
        borderRadius: 10,
        padding: "11px 22px",
        fontWeight: 700,
        fontSize: 14,
        cursor: "pointer",
        whiteSpace: "nowrap",
        transition: "opacity 0.15s",
    },
    // Submit wizard
    wizardWrap: {
        maxWidth: 680,
        margin: "0 auto",
        padding: "40px 24px 60px",
    },
    progressBar: {
        display: "flex",
        alignItems: "center",
        marginBottom: 40,
    },
    stepCircle: (done, active) => ({
        width: 36,
        height: 36,
        borderRadius: "50%",
        background: done
            ? "linear-gradient(135deg, #4F6EF7, #6366f1)"
            : active
                ? "#fff"
                : "#e2e8f0",
        border: active ? "2px solid #4F6EF7" : "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: done ? 14 : 13,
        fontWeight: 700,
        color: done ? "#fff" : active ? "#4F6EF7" : "#94a3b8",
        flexShrink: 0,
        transition: "all 0.2s",
    }),
    stepLabel: (active) => ({
        fontSize: 12,
        fontWeight: active ? 700 : 500,
        color: active ? "#4F6EF7" : "#94a3b8",
        marginTop: 4,
        whiteSpace: "nowrap",
    }),
    stepLine: (done) => ({
        flex: 1,
        height: 2,
        background: done ? "#4F6EF7" : "#e2e8f0",
        margin: "0 6px",
        marginBottom: 20,
        transition: "background 0.3s",
    }),
    stepWrap: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
    },
    // Form elements
    formCard: {
        background: "#fff",
        borderRadius: 16,
        padding: "32px",
        boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
        border: "1px solid #e2e8f0",
    },
    formTitle: {
        fontSize: 20,
        fontWeight: 700,
        color: "#0f172a",
        marginBottom: 6,
    },
    formSub: {
        fontSize: 14,
        color: "#64748b",
        marginBottom: 28,
    },
    label: {
        display: "block",
        fontSize: 13,
        fontWeight: 600,
        color: "#374151",
        marginBottom: 6,
    },
    input: {
        width: "100%",
        padding: "11px 14px",
        borderRadius: 10,
        border: "1.5px solid #e2e8f0",
        fontSize: 14,
        color: "#0f172a",
        outline: "none",
        boxSizing: "border-box",
        transition: "border-color 0.15s",
        background: "#fff",
    },
    textarea: {
        width: "100%",
        padding: "11px 14px",
        borderRadius: 10,
        border: "1.5px solid #e2e8f0",
        fontSize: 14,
        color: "#0f172a",
        outline: "none",
        boxSizing: "border-box",
        resize: "vertical",
        minHeight: 100,
        fontFamily: "inherit",
        background: "#fff",
    },
    formGroup: {
        marginBottom: 20,
    },
    dropZone: {
        border: "2px dashed #cbd5e1",
        borderRadius: 12,
        padding: "24px",
        textAlign: "center",
        color: "#94a3b8",
        cursor: "pointer",
        fontSize: 14,
        transition: "border-color 0.15s",
    },
    btnRow2: {
        display: "flex",
        gap: 12,
        justifyContent: "flex-end",
        marginTop: 28,
    },
    btnBack: {
        background: "#f1f5f9",
        color: "#475569",
        border: "none",
        borderRadius: 10,
        padding: "12px 24px",
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
    },
    btnNext: (disabled) => ({
        background: disabled
            ? "#e2e8f0"
            : "linear-gradient(135deg, #4F6EF7, #6366f1)",
        color: disabled ? "#94a3b8" : "#fff",
        border: "none",
        borderRadius: 10,
        padding: "12px 28px",
        fontSize: 14,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.15s",
    }),
    btnGreen: {
        background: "linear-gradient(135deg, #16a34a, #15803d)",
        color: "#fff",
        border: "none",
        borderRadius: 10,
        padding: "12px 28px",
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
    },
    // Category tile (step 0)
    catGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 14,
        marginBottom: 8,
        maxHeight: 400,
        overflowY: "auto",
        padding: "8px",
    },
    catTile: (selected, accent, bg) => ({
        border: `2px solid ${selected ? accent : "#e2e8f0"}`,
        background: selected ? bg : "#fafafa",
        borderRadius: 12,
        padding: "16px 14px",
        cursor: "pointer",
        textAlign: "center",
        transition: "all 0.15s",
        transform: selected ? "scale(1.02)" : "none",
    }),
    catTileIcon: {
        fontSize: 28,
        marginBottom: 6,
    },
    catTileLabel: (selected, accent) => ({
        fontSize: 13,
        fontWeight: 700,
        color: selected ? accent : "#374151",
    }),
    // Anonymous toggle
    anonRow: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 16px",
        borderRadius: 12,
        background: "#fffbeb",
        border: "1.5px solid #fde68a",
        marginBottom: 20,
        cursor: "pointer",
    },
    toggle: (on) => ({
        width: 44,
        height: 24,
        borderRadius: 12,
        background: on ? "#f59e0b" : "#cbd5e1",
        position: "relative",
        flexShrink: 0,
        transition: "background 0.2s",
        cursor: "pointer",
    }),
    toggleKnob: (on) => ({
        position: "absolute",
        top: 3,
        left: on ? 22 : 3,
        width: 18,
        height: 18,
        borderRadius: "50%",
        background: "#fff",
        transition: "left 0.2s",
        boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
    }),
    // Review table
    reviewTable: {
        width: "100%",
        borderCollapse: "collapse",
        marginBottom: 20,
    },
    reviewTd: {
        padding: "10px 12px",
        fontSize: 14,
        borderBottom: "1px solid #f1f5f9",
        verticalAlign: "top",
    },
    reviewLabel: {
        color: "#64748b",
        fontWeight: 600,
        width: "35%",
    },
    reviewValue: {
        color: "#0f172a",
    },
    disclaimer: {
        background: "#fffbeb",
        border: "1px solid #fde68a",
        borderRadius: 10,
        padding: "14px 16px",
        fontSize: 13,
        color: "#92400e",
        marginBottom: 20,
        lineHeight: 1.6,
    },
    // Success view
    successWrap: {
        maxWidth: 560,
        margin: "60px auto",
        padding: "0 24px",
        textAlign: "center",
    },
    successEmoji: {
        fontSize: 72,
        marginBottom: 20,
        display: "block",
    },
    successH2: {
        fontSize: 28,
        fontWeight: 800,
        color: "#0f172a",
        marginBottom: 10,
    },
    successSub: {
        color: "#64748b",
        fontSize: 15,
        marginBottom: 28,
    },
    ticketBox: {
        background: "linear-gradient(135deg, #4F6EF7, #6366f1)",
        borderRadius: 14,
        padding: "20px 28px",
        marginBottom: 32,
    },
    ticketLabel: {
        fontSize: 12,
        color: "rgba(255,255,255,0.7)",
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 6,
    },
    ticketNum: {
        fontSize: 26,
        fontWeight: 800,
        color: "#fff",
        fontFamily: "monospace",
        letterSpacing: 2,
    },
    // Track view
    trackWrap: {
        maxWidth: 640,
        margin: "0 auto",
        padding: "40px 24px 60px",
    },
    searchCard: {
        background: "#fff",
        borderRadius: 16,
        padding: "28px",
        boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
        border: "1px solid #e2e8f0",
        marginBottom: 28,
    },
    resultHeader: {
        background: "linear-gradient(135deg, #0f172a, #1e3a5f)",
        borderRadius: "14px 14px 0 0",
        padding: "20px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
    },
    resultCard: {
        background: "#fff",
        borderRadius: 14,
        boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
        border: "1px solid #e2e8f0",
        overflow: "hidden",
    },
    metaGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: 0,
        borderBottom: "1px solid #f1f5f9",
    },
    metaCell: {
        padding: "16px 20px",
        borderRight: "1px solid #f1f5f9",
    },
    metaCellLast: {
        padding: "16px 20px",
    },
    metaKey: {
        fontSize: 11,
        color: "#94a3b8",
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 4,
    },
    metaVal: {
        fontSize: 14,
        fontWeight: 700,
        color: "#0f172a",
    },
    // Timeline
    timeline: {
        padding: "24px 24px",
    },
    timelineItem: (done) => ({
        display: "flex",
        gap: 16,
        position: "relative",
    }),
    tlDot: (done) => ({
        width: 20,
        height: 20,
        borderRadius: "50%",
        background: done ? "#16a34a" : "#e2e8f0",
        border: done ? "none" : "2px solid #cbd5e1",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        marginTop: 2,
        zIndex: 1,
    }),
    tlLine: (done) => ({
        position: "absolute",
        left: 9,
        top: 22,
        width: 2,
        height: "calc(100% + 4px)",
        background: done ? "#16a34a" : "#e2e8f0",
    }),
    tlLabel: (done) => ({
        fontSize: 14,
        fontWeight: done ? 600 : 400,
        color: done ? "#0f172a" : "#94a3b8",
        paddingBottom: 24,
    }),
    statusBadge: (status) => {
        const map = {
            open: { bg: "#dbeafe", color: "#1d4ed8" },
            pending: { bg: "#fef3c7", color: "#92400e" },
            in_progress: { bg: "#fef9c3", color: "#92400e" },
            on_hold: { bg: "#fee2e2", color: "#b91c1c" },
            work_order_issued: { bg: "#e0e7ff", color: "#4338ca" },
            work_in_progress: { bg: "#fef9c3", color: "#92400e" },
            work_completed: { bg: "#dcfce7", color: "#15803d" },
            resolved: { bg: "#dcfce7", color: "#15803d" },
            closed: { bg: "#f1f5f9", color: "#475569" },
        };
        const c = map[status] || map.open;
        return {
            background: c.bg,
            color: c.color,
            borderRadius: 999,
            padding: "4px 14px",
            fontSize: 12,
            fontWeight: 700,
            textTransform: "capitalize",
        };
    },
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ManagePublicGrievance({ orgId }) {
    // View: "home" | "submit" | "success" | "track"
    const [view, setView] = useState("home");
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const fetchCategories = async () => {
            if (!orgId) return;
            try {
                const res = await getCustomCategories(orgId);
                const data = res?.data || res;
                if (data && Array.isArray(data)) {
                    const customCats = data.map(c => {
                        const predefined = CATEGORIES.find(p => p.id === c.name);
                        return {
                            id: c.name?.toLowerCase().replace(/\s+/g, '_') || c._id,
                            label: c.label || c.name,
                            icon: predefined ? predefined.icon : <Tag />,
                            description: c.description || predefined?.description || "Custom category",
                            color: predefined ? predefined.color : "#f0fdfa",
                            accent: predefined ? predefined.accent : "#0d9488",
                        };
                    });
                    setCategories(customCats);
                }
            } catch (error) {
                console.error("Failed to fetch custom categories:", error);
            }
        };
        fetchCategories();
    }, [orgId]);
    const [wizardStep, setWizardStep] = useState(0);
    const [hoveredCard, setHoveredCard] = useState(null);
    const [quickTrackInput, setQuickTrackInput] = useState("");
    const [copied, setCopied] = useState(false);

    // Submit form state
    const [form, setForm] = useState({
        category: "",
        subject: "",
        description: "",
        location_address: "",
        attachments: [],
        is_anonymous: false,
        name: "",
        email: "",
        phone_number: "",
    });

    // Success state
    const [ticketNumber, setTicketNumber] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");

    // Track state
    const [trackInput, setTrackInput] = useState("");
    const [trackResult, setTrackResult] = useState(null);
    const [tracking, setTracking] = useState(false);
    const [trackError, setTrackError] = useState("");

    // Reply state
    const [replyText, setReplyText] = useState("");
    const [sendingReply, setSendingReply] = useState(false);
    const [replyError, setReplyError] = useState("");

    const [activeTab, setActiveTab] = useState("track");

    const fileInputRef = useRef(null);

    // ── Navigation helpers ──────────────────────────────────────────────────────
    const goHome = () => {
        setView("home");
        setWizardStep(0);
        setForm({
            category: "",
            subject: "",
            description: "",
            location_address: "",
            attachments: [],
            is_anonymous: false,
            name: "",
            email: "",
            phone_number: "",
        });
        setSubmitError("");
        setTrackResult(null);
        setTrackError("");
        setReplyText("");
        setReplyError("");
    };

    const startSubmit = (preCategory = "") => {
        if (preCategory) {
            setForm((f) => ({ ...f, category: preCategory }));
            setWizardStep(1);
        } else {
            setWizardStep(0);
        }
        setView("submit");
    };

    const goTrack = () => {
        setView("track");
        setTrackResult(null);
        setTrackError("");
        setReplyText("");
        setReplyError("");
        setActiveTab("track");
    };

    // ── Submit ticket ───────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        setSubmitting(true);
        setSubmitError("");
        try {
            const payload = {
                category: form.category,
                subject: form.subject,
                description: form.description,
                location_address: form.location_address || undefined,
                is_anonymous: form.is_anonymous,
                name: form.is_anonymous ? undefined : form.name || undefined,
                email: form.is_anonymous ? undefined : form.email || undefined,
                phone_number: form.is_anonymous ? undefined : form.phone_number || undefined,
            };
            // Extract actual File objects from form.attachments
            const files = form.attachments.map(a => a.file).filter(Boolean);
            const res = await createPublicTicket(orgId || "default", payload, files);
            const num = res?.ticket_number || res?.data?.ticket_number || "TKT-XXXXXXXX";
            setTicketNumber(num);
            setView("success");
        } catch (err) {
            setSubmitError(err?.detail || err?.message || "Failed to submit. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    // ── Track ticket ────────────────────────────────────────────────────────────
    const handleTrack = async (num) => {
        const q = (num || trackInput).trim();
        if (!q) return;
        setTracking(true);
        setTrackError("");
        setTrackResult(null);
        setReplyText("");
        setReplyError("");
        setActiveTab("track");
        try {
            const res = await trackPublicTicket(q);
            setTrackResult(res?.data || res);
        } catch (err) {
            setTrackError("Ticket not found. Please check the ticket number.");
        } finally {
            setTracking(false);
        }
    };

    const handleReply = async () => {
        if (!replyText.trim() || !trackResult?.ticket_number) return;
        setSendingReply(true);
        setReplyError("");
        try {
            const payload = {
                description: replyText,
                name: "Anonymous",
                attachments: [],
            };
            await addPublicTicketReply(trackResult.ticket_number, payload);
            setReplyText("");
            // Refresh thread quietly
            const res = await trackPublicTicket(trackResult.ticket_number);
            setTrackResult(res?.data || res);
        } catch (err) {
            setReplyError(err?.message || "Failed to send reply. Please try again.");
        } finally {
            setSendingReply(false);
        }
    };

    // ── File drop ───────────────────────────────────────────────────────────────
    const handleFiles = (files) => {
        const newFiles = Array.from(files).map((f) => ({
            file: f,
            filename: f.name,
            size: f.size,
        }));
        setForm((prev) => ({
            ...prev,
            attachments: [...prev.attachments, ...newFiles],
        }));
    };

    // ── Wizard step validation ──────────────────────────────────────────────────
    const canContinue = () => {
        if (wizardStep === 0) return !!form.category;
        if (wizardStep === 1) return form.subject.trim() && form.description.trim().length >= 10;
        return true;
    };

    // Validation messages
    const getValidationMessage = () => {
        if (wizardStep === 1) {
            if (!form.subject.trim()) return "";
            if (form.description.trim().length > 0 && form.description.trim().length < 10) {
                return `Description must be at least 10 characters (${form.description.trim().length}/10)`;
            }
        }
        return "";
    };

    const selectedCat = [...CATEGORIES, ...categories].find((c) => c.id === form.category);

    // ══════════════════════════════════════════════════════════════════════════
    // RENDER: HOME VIEW
    // ══════════════════════════════════════════════════════════════════════════
    if (view === "home") {
        return (
            <div style={S.page}>
                {/* Hero */}
                <div style={S.hero}>

                    <h1 style={S.h1}>Submit Your Grievance.</h1>
                    <p style={S.subtitle}>
                        Raise civic issues directly with your ward office. We ensure every
                        complaint is tracked, assigned, and resolved transparently.
                    </p>

                    {/* Share URL Block */}
                    {orgId && orgId !== "default" && (
                        <div style={{ maxWidth: 500, margin: "0 auto 32px", display: "flex", alignItems: "center", background: "rgba(255,255,255,0.1)", borderRadius: 10, padding: "8px 12px", border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}>
                            <div style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "rgba(255,255,255,0.9)", fontSize: 13, textAlign: "left", marginRight: 12 }}>
                                {typeof window !== "undefined" ? `${window.location.origin}/public_grievance/${orgId}` : `.../public_grievance/${orgId}`}
                            </div>
                            <button
                                onClick={() => {
                                    const url = typeof window !== "undefined" ? `${window.location.origin}/public_grievance/${orgId}` : "";
                                    if (url) {
                                        navigator.clipboard.writeText(url);
                                        setCopied(true);
                                        setTimeout(() => setCopied(false), 2000);
                                    }
                                }}
                                style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", cursor: "pointer", padding: "8px 14px", borderRadius: 8, display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, transition: "background 0.2s" }}
                                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.3)"}
                                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
                                title="Copy public portal link for sharing on social media"
                            >
                                {copied ? <><CheckCheck size={16} /> Copied!</> : <><Copy size={16} /> Copy URL</>}
                            </button>
                        </div>
                    )}

                    <div style={S.btnRow}>
                        <button
                            style={S.btnPrimary}
                            onClick={() => startSubmit()}
                            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
                        >
                            Submit a Grievance →
                        </button>
                        <button
                            style={S.btnOutline}
                            onClick={goTrack}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.18)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                        >
                            <Search /> Track My Ticket
                        </button>
                    </div>
                    <div style={S.statsRow}>
                        {[
                            { num: "12,480", label: "Tickets Resolved" },
                            { num: "98%", label: "Resolution Rate" },
                            { num: "3.2 days", label: "Avg. Resolution" },
                            { num: "24/7", label: "Always Open" },
                        ].map((s) => (
                            <div key={s.label} style={S.statItem}>
                                <span style={S.statNum}>{s.num}</span>
                                <span style={S.statLabel}>{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Category Grid */}
                <div style={S.gridSection}>
                    <h2 style={S.gridH2}>What do you want to report?</h2>
                    <p style={S.gridSub}>
                        Select a category to quickly file your complaint with the right department.
                    </p>
                    <div style={S.grid}>
                        {categories.map((cat) => (
                            <div
                                key={cat.id}
                                style={S.card(cat.accent, cat.color, hoveredCard === cat.id)}
                                onMouseEnter={() => setHoveredCard(cat.id)}
                                onMouseLeave={() => setHoveredCard(null)}
                                onClick={() => startSubmit(cat.id)}
                            >
                                <div style={S.cardHeader}>
                                    <div style={S.iconBox(cat.accent, cat.color)}>
                                        {cat.icon}
                                    </div>
                                    <div>
                                        <div style={S.cardTitle}>{cat.label}</div>
                                        <div style={S.cardDesc}>{cat.description}</div>
                                    </div>
                                </div>
                                <div style={S.cardActive(cat.accent)}>● Active complaints →</div>
                            </div>
                        ))}
                    </div>
                </div>



            </div>
        );
    }

    // ══════════════════════════════════════════════════════════════════════════
    // RENDER: SUBMIT VIEW (4-step wizard)
    // ══════════════════════════════════════════════════════════════════════════
    if (view === "submit") {
        const STEPS = ["Category", "Details", "Contact", "Review"];

        return (
            <div style={{ ...S.page, background: "#f8fafc" }}>
                {/* Back nav */}
                <div style={{ padding: "16px 24px", borderBottom: "1px solid #e2e8f0", background: "#fff" }}>
                    <button
                        onClick={goHome}
                        style={{ background: "none", border: "none", color: "#4F6EF7", cursor: "pointer", fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}
                    >
                        ← Back to Home
                    </button>
                </div>

                <div style={S.wizardWrap}>
                    {/* Progress bar */}
                    <div style={S.progressBar}>
                        {STEPS.map((label, i) => (
                            <div key={label} style={{ display: "flex", alignItems: "flex-end", flex: i < STEPS.length - 1 ? 1 : 0 }}>
                                <div style={S.stepWrap}>
                                    <div style={S.stepCircle(i < wizardStep, i === wizardStep)}>
                                        {i < wizardStep ? "✓" : i + 1}
                                    </div>
                                    <span style={S.stepLabel(i === wizardStep)}>{label}</span>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div style={S.stepLine(i < wizardStep)} />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Step 0 — Select Category */}
                    {wizardStep === 0 && (
                        <div style={S.formCard}>
                            <div style={S.formTitle}>Select a Category</div>
                            <div style={S.formSub}>Choose the type of issue you want to report.</div>
                            <div style={S.catGrid}>
                                {categories.map((cat) => (
                                    <div
                                        key={cat.id}
                                        style={S.catTile(form.category === cat.id, cat.accent, cat.color)}
                                        onClick={() => setForm((f) => ({ ...f, category: cat.id }))}
                                    >
                                        <div style={S.catTileIcon}>{cat.icon}</div>
                                        <div style={S.catTileLabel(form.category === cat.id, cat.accent)}>
                                            {cat.label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div style={S.btnRow2}>
                                <button style={S.btnNext(!canContinue())} disabled={!canContinue()} onClick={() => setWizardStep(1)}>
                                    Continue →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 1 — Grievance Details */}
                    {wizardStep === 1 && (
                        <div style={S.formCard}>
                            <div style={S.formTitle}>Grievance Details</div>
                            <div style={S.formSub}>
                                Category: <strong>{selectedCat?.icon} {selectedCat?.label}</strong>
                            </div>

                            <div style={S.formGroup}>
                                <label style={S.label}>Subject *</label>
                                <input
                                    style={S.input}
                                    placeholder="Brief title of your complaint"
                                    value={form.subject}
                                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                                    onFocus={(e) => (e.target.style.borderColor = "#4F6EF7")}
                                    onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                                />
                            </div>

                            <div style={S.formGroup}>
                                <label style={S.label}>Detailed Description * <span style={{ fontWeight: 400, color: "#94a3b8" }}>(min. 10 characters)</span></label>
                                <textarea
                                    style={{
                                        ...S.textarea,
                                        borderColor: form.description.trim().length > 0 && form.description.trim().length < 10 ? "#f59e0b" : undefined
                                    }}
                                    rows={4}
                                    placeholder="Describe the issue in detail — what happened, when, and how it affects you..."
                                    value={form.description}
                                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                                    onFocus={(e) => (e.target.style.borderColor = "#4F6EF7")}
                                    onBlur={(e) => (e.target.style.borderColor = form.description.trim().length > 0 && form.description.trim().length < 10 ? "#f59e0b" : "#e2e8f0")}
                                />
                                {form.description.trim().length > 0 && form.description.trim().length < 10 && (
                                    <div style={{ color: "#f59e0b", fontSize: 12, marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                                        <AlertCircle size={14} /> {getValidationMessage()}
                                    </div>
                                )}
                            </div>

                            <div style={S.formGroup}>
                                <label style={S.label}>Location / Address</label>
                                <input
                                    style={S.input}
                                    placeholder="Street, locality, landmark..."
                                    value={form.location_address}
                                    onChange={(e) => setForm((f) => ({ ...f, location_address: e.target.value }))}
                                    onFocus={(e) => (e.target.style.borderColor = "#4F6EF7")}
                                    onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                                />
                            </div>

                            <div style={S.formGroup}>
                                <label style={S.label}>Attachments (optional)</label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    style={{ display: "none" }}
                                    onChange={(e) => handleFiles(e.target.files)}
                                />
                                <div
                                    style={S.dropZone}
                                    onClick={() => fileInputRef.current?.click()}
                                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "#4F6EF7"; }}
                                    onDragLeave={(e) => { e.currentTarget.style.borderColor = "#cbd5e1"; }}
                                    onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); e.currentTarget.style.borderColor = "#cbd5e1"; }}
                                >
                                    📎 Click or drag files here to attach
                                    {form.attachments.length > 0 && (
                                        <div style={{ marginTop: 8, color: "#4F6EF7", fontWeight: 600 }}>
                                            {form.attachments.length} file(s) selected
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={S.btnRow2}>
                                <button style={S.btnBack} onClick={() => setWizardStep(0)}>← Back</button>
                                <button style={S.btnNext(!canContinue())} disabled={!canContinue()} onClick={() => setWizardStep(2)}>
                                    Continue →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2 — Contact Info */}
                    {wizardStep === 2 && (
                        <div style={S.formCard}>
                            <div style={S.formTitle}>Contact Information</div>
                            <div style={S.formSub}>Help us reach you with updates on your grievance.</div>

                            {/* Anonymous toggle */}
                            <div style={S.anonRow} onClick={() => setForm((f) => ({ ...f, is_anonymous: !f.is_anonymous }))}>
                                <div style={S.toggle(form.is_anonymous)}>
                                    <div style={S.toggleKnob(form.is_anonymous)} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 14, color: "#92400e" }}>Submit Anonymously</div>
                                    <div style={{ fontSize: 12, color: "#b45309" }}>Your identity will not be shared with any department.</div>
                                </div>
                            </div>

                            {!form.is_anonymous && (
                                <>
                                    <div style={S.formGroup}>
                                        <label style={S.label}>Full Name</label>
                                        <input
                                            style={S.input}
                                            placeholder="Your name"
                                            value={form.name}
                                            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                            onFocus={(e) => (e.target.style.borderColor = "#4F6EF7")}
                                            onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                                        />
                                    </div>
                                    <div style={S.formGroup}>
                                        <label style={S.label}>Email Address</label>
                                        <input
                                            style={S.input}
                                            type="email"
                                            placeholder="you@example.com"
                                            value={form.email}
                                            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                                            onFocus={(e) => (e.target.style.borderColor = "#4F6EF7")}
                                            onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                                        />
                                    </div>
                                    <div style={S.formGroup}>
                                        <label style={S.label}>Phone Number</label>
                                        <input
                                            style={S.input}
                                            type="tel"
                                            placeholder="+91 98765 43210"
                                            value={form.phone_number}
                                            onChange={(e) => setForm((f) => ({ ...f, phone_number: e.target.value }))}
                                            onFocus={(e) => (e.target.style.borderColor = "#4F6EF7")}
                                            onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                                        />
                                    </div>
                                </>
                            )}

                            <div style={S.btnRow2}>
                                <button style={S.btnBack} onClick={() => setWizardStep(1)}>← Back</button>
                                <button style={S.btnNext(false)} onClick={() => setWizardStep(3)}>
                                    Review & Submit →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3 — Review & Submit */}
                    {wizardStep === 3 && (
                        <div style={S.formCard}>
                            <div style={S.formTitle}>Review Your Grievance</div>
                            <div style={S.formSub}>Please verify all details before submitting.</div>

                            <table style={S.reviewTable}>
                                <tbody>
                                    <tr>
                                        <td style={{ ...S.reviewTd, ...S.reviewLabel }}>Category</td>
                                        <td style={{ ...S.reviewTd, ...S.reviewValue, display: "flex", alignItems: "center", gap: 8 }}>
                                            {selectedCat?.icon} {selectedCat?.label}
                                        </td>
                                    </tr>
                                    {[
                                        ["Subject", form.subject],
                                        ["Description", form.description],
                                        ["Location", form.location_address || "—"],
                                        ["Attachments", form.attachments.length > 0 ? `${form.attachments.length} file(s)` : "None"],
                                        ["Anonymous", form.is_anonymous ? "Yes" : "No"],
                                        ...(!form.is_anonymous
                                            ? [
                                                ["Name", form.name || "—"],
                                                ["Email", form.email || "—"],
                                                ["Phone", form.phone_number || "—"],
                                            ]
                                            : []),
                                    ].map(([k, v]) => (
                                        <tr key={k}>
                                            <td style={{ ...S.reviewTd, ...S.reviewLabel }}>{k}</td>
                                            <td style={{ ...S.reviewTd, ...S.reviewValue }}>{v}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div style={S.disclaimer}>
                                ⚠️ By submitting this grievance, you confirm that the information provided is
                                accurate to the best of your knowledge. False complaints may be subject to
                                action under applicable laws.
                            </div>

                            {submitError && (
                                <div style={{ color: "#dc2626", fontSize: 13, marginBottom: 16, padding: "10px 14px", background: "#fef2f2", borderRadius: 8 }}>
                                    {submitError}
                                </div>
                            )}

                            <div style={{ ...S.btnRow2, justifyContent: "space-between" }}>
                                <button style={S.btnBack} onClick={() => setWizardStep(2)}>← Edit</button>
                                <button
                                    style={{ ...S.btnGreen, opacity: submitting ? 0.7 : 1 }}
                                    disabled={submitting}
                                    onClick={handleSubmit}
                                >
                                    {submitting ? "Submitting…" : "✓ Submit Grievance"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ══════════════════════════════════════════════════════════════════════════
    // RENDER: SUCCESS VIEW
    // ══════════════════════════════════════════════════════════════════════════
    if (view === "success") {
        return (
            <div style={S.page}>
                <div style={S.successWrap}>
                    <span style={S.successEmoji}>🎉</span>
                    <h2 style={S.successH2}>Grievance Submitted!</h2>
                    <p style={S.successSub}>
                        Your complaint has been registered. You can track its status using the
                        ticket number below.
                    </p>
                    <div style={S.ticketBox}>
                        <div style={S.ticketLabel}>Your Ticket Number</div>
                        <p style={{ fontSize: 12, color: "#ffffff", marginBottom: 8 }}>Copy and save this number. It will be useful while tracking your ticket status.</p>

                        <div style={S.ticketNum}>{ticketNumber}</div>
                    </div>
                    <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                        <button
                            style={{ ...S.btnPrimary, boxShadow: "none" }}
                            onClick={() => {
                                setTrackInput(ticketNumber);
                                setView("track");
                                setTimeout(() => handleTrack(ticketNumber), 100);
                            }}
                        >
                            🔍 Track Status
                        </button>
                        <button style={S.btnBack} onClick={goHome}>
                            ← Back to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ══════════════════════════════════════════════════════════════════════════
    // RENDER: TRACK VIEW
    // ══════════════════════════════════════════════════════════════════════════
    if (view === "track") {
        const apiTimeline = trackResult?.timeline || [];

        return (
            <div style={{ ...S.page, background: "#f8fafc" }}>
                {/* Back nav */}
                <div style={{ padding: "16px 24px", borderBottom: "1px solid #e2e8f0", background: "#fff" }}>
                    <button
                        onClick={goHome}
                        style={{ background: "none", border: "none", color: "#4F6EF7", cursor: "pointer", fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}
                    >
                        ← Back to Home
                    </button>
                </div>

                <div style={S.trackWrap}>
                    <h2 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>
                        Track Your Grievance
                    </h2>
                    <p style={{ color: "#64748b", marginBottom: 24, fontSize: 14 }}>
                        Enter your ticket number to check the current status.
                    </p>

                    {/* Search card */}
                    <div style={S.searchCard}>
                        <div style={{ display: "flex", gap: 12 }}>
                            <input
                                style={{ ...S.input, flex: 1 }}
                                placeholder="e.g. TKT-20240218-0001"
                                value={trackInput}
                                onChange={(e) => setTrackInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleTrack()}
                                onFocus={(e) => (e.target.style.borderColor = "#4F6EF7")}
                                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                            />
                            <button
                                style={{ ...S.btnNext(tracking || !trackInput.trim()), padding: "11px 22px" }}
                                disabled={tracking || !trackInput.trim()}
                                onClick={() => handleTrack()}
                            >
                                {tracking ? "Searching…" : "Search →"}
                            </button>
                        </div>
                        {trackError && (
                            <div style={{ color: "#dc2626", fontSize: 13, marginTop: 12, padding: "10px 14px", background: "#fef2f2", borderRadius: 8 }}>
                                {trackError}
                            </div>
                        )}
                    </div>

                    {/* Result card */}
                    {trackResult && (
                        <div style={S.resultCard}>
                            {/* Header */}
                            <div style={S.resultHeader}>
                                <div>
                                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>
                                        TICKET ID
                                    </div>
                                    <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "monospace" }}>
                                        {trackResult.ticket_number || trackInput}
                                    </div>
                                </div>
                                <div style={S.statusBadge(trackResult.status)}>
                                    {trackResult.status?.replace("_", " ") || "Open"}
                                </div>
                            </div>

                            {/* Meta grid */}
                            <div style={S.metaGrid}>
                                <div style={S.metaCell}>
                                    <div style={S.metaKey}>Category</div>
                                    <div style={S.metaVal}>
                                        {[...CATEGORIES, ...categories].find((c) => c.id === trackResult.category)?.label ||
                                            trackResult.category ||
                                            "—"}
                                    </div>
                                </div>
                                {/* <div style={S.metaCell}>
                                    <div style={S.metaKey}>Priority</div>
                                    <div style={{ ...S.metaVal, color: PRIORITY_COLORS[trackResult.priority] || "#0f172a" }}>
                                        {trackResult.priority || "Normal"}
                                    </div>
                                </div> */}
                                <div style={S.metaCellLast}>
                                    <div style={S.metaKey}>Filed On</div>
                                    <div style={S.metaVal}>{fmtDate(trackResult.created_at)}</div>
                                </div>
                            </div>

                            {/* Subject */}
                            {trackResult.subject && (
                                <div style={{ padding: "16px 24px" }}>
                                    <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Subject</div>
                                    <div style={{ fontSize: 15, fontWeight: 600, color: "#0f172a" }}>{trackResult.subject}</div>
                                </div>
                            )}

                            {/* Tabs Navigation */}
                            <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
                                <button
                                    onClick={() => setActiveTab("track")}
                                    style={{
                                        flex: 1,
                                        padding: "16px",
                                        background: activeTab === "track" ? "#fff" : "transparent",
                                        border: "none",
                                        borderBottom: activeTab === "track" ? "2px solid #4F6EF7" : "2px solid transparent",
                                        color: activeTab === "track" ? "#0f172a" : "#64748b",
                                        fontWeight: activeTab === "track" ? 700 : 500,
                                        cursor: "pointer",
                                        fontSize: 15,
                                        transition: "all 0.2s"
                                    }}
                                >
                                    Track
                                </button>
                                <button
                                    onClick={() => setActiveTab("chat")}
                                    style={{
                                        flex: 1,
                                        padding: "16px",
                                        background: activeTab === "chat" ? "#fff" : "transparent",
                                        border: "none",
                                        borderBottom: activeTab === "chat" ? "2px solid #4F6EF7" : "2px solid transparent",
                                        color: activeTab === "chat" ? "#0f172a" : "#64748b",
                                        fontWeight: activeTab === "chat" ? 700 : 500,
                                        cursor: "pointer",
                                        fontSize: 15,
                                        transition: "all 0.2s"
                                    }}
                                >
                                    Chat
                                </button>
                            </div>

                            {/* Content Area */}
                            <div>
                                {/* Timeline Tab */}
                                {activeTab === "track" && (
                                    <div style={{ ...S.timeline, borderTop: "none", background: "#fff" }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 20 }}>
                                            Progress Timeline
                                        </div>
                                        {TIMELINE_STEPS.filter(s => s.id !== "on_hold" || trackResult.status === "on_hold").map((step, i, arr) => {
                                            const currentIdx = STATUS_ORDER[trackResult.status || "open"] || 0;
                                            const stepIdx = STATUS_ORDER[step.id] || 0;
                                            const done = currentIdx >= stepIdx;
                                            const isLast = i === arr.length - 1;
                                            return (
                                                <div key={step.id} style={{ display: "flex", gap: 16, position: "relative" }}>
                                                    {/* Connector line */}
                                                    {!isLast && (
                                                        <div style={{
                                                            position: "absolute",
                                                            left: 9,
                                                            top: 22,
                                                            width: 2,
                                                            height: "calc(100% - 4px)",
                                                            background: done ? "#16a34a" : "#e2e8f0",
                                                            zIndex: 0,
                                                        }} />
                                                    )}
                                                    {/* Dot */}
                                                    <div style={{
                                                        width: 20,
                                                        height: 20,
                                                        borderRadius: "50%",
                                                        background: done ? "#16a34a" : "#e2e8f0",
                                                        border: done ? "none" : "2px solid #cbd5e1",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        flexShrink: 0,
                                                        marginTop: 2,
                                                        zIndex: 1,
                                                        color: "#fff",
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                    }}>
                                                        {done ? "✓" : ""}
                                                    </div>
                                                    {/* Label */}
                                                    <div style={{
                                                        fontSize: 14,
                                                        fontWeight: done ? 600 : 400,
                                                        color: done ? "#0f172a" : "#94a3b8",
                                                        paddingBottom: isLast ? 0 : 24,
                                                        paddingTop: 1,
                                                    }}>
                                                        {step.label}
                                                        {done && trackResult.status === step.id && (
                                                            <div style={{ fontSize: 13, fontWeight: 400, color: "#64748b", marginTop: 4, lineHeight: 1.4 }}>
                                                                Current Status
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Chat Tab */}
                                {activeTab === "chat" && (
                                    <div style={{ padding: "24px", background: "#fff" }}>
                                        {/* Default content if no thread */}
                                        {(!trackResult.thread || trackResult.thread.length === 0) && (
                                            <div style={{ marginBottom: 24 }}>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                                                    Conversation
                                                </div>
                                                <div style={{ fontSize: 14, color: "#94a3b8" }}>No messages yet.</div>
                                            </div>
                                        )}

                                        {/* Conversation History */}
                                        {trackResult.thread && trackResult.thread.length > 0 && (
                                            <>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 20 }}>
                                                    Conversation History
                                                </div>
                                                <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24, minHeight: 150, maxHeight: 400, overflowY: "auto", paddingRight: 8 }}>
                                                    {trackResult.thread.map((msg, idx) => {
                                                        const isSupport = msg.author_type === "support_team";
                                                        return (
                                                            <div key={idx} style={{ display: "flex", gap: 12, flexDirection: isSupport ? "row-reverse" : "row" }}>
                                                                <div style={{
                                                                    width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                                                                    background: isSupport ? "#4F6EF7" : "#e2e8f0",
                                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                                    color: isSupport ? "#fff" : "#64748b", fontWeight: 700, fontSize: 12
                                                                }}>
                                                                    {isSupport ? "ST" : "U"}
                                                                </div>
                                                                <div style={{
                                                                    background: isSupport ? "#fff" : "#f1f5f9",
                                                                    border: isSupport ? "1px solid #e2e8f0" : "none",
                                                                    padding: "12px 16px", borderRadius: 12,
                                                                    maxWidth: "85%", fontSize: 14, color: "#374151"
                                                                }}>
                                                                    <div style={{ marginBottom: 4, lineHeight: 1.5 }}>
                                                                        {msg.description}
                                                                    </div>
                                                                    <div style={{ fontSize: 11, color: "#94a3b8" }}>
                                                                        {new Date(msg.created_at).toLocaleString("en-IN", {
                                                                            day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </>
                                        )}

                                        {/* Reply Box */}
                                        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
                                            <textarea
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                placeholder="Write a message to the organization..."
                                                style={{ ...S.textarea, border: "none", borderRadius: 0, minHeight: 80, fontSize: 14 }}
                                            />
                                            <div style={{ padding: "12px 16px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
                                                <span style={{ fontSize: 13, color: "#dc2626" }}>{replyError}</span>
                                                <button
                                                    disabled={sendingReply || !replyText.trim()}
                                                    onClick={handleReply}
                                                    style={{ ...S.btnNext(sendingReply || !replyText.trim()), padding: "8px 20px" }}
                                                >
                                                    {sendingReply ? "Sending..." : "Send Message"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return null;
}
