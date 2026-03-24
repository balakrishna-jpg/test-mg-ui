// app/components/ElectionsWeb/Grievance/CreateGrievance.jsx
// Internal form to create a new support ticket

import { useState } from "react";
import { createSupportTicket } from "~/utils/GrievanceService";

const TICKET_TYPES = ["general", "elections", "public_needs", "other"];

export default function CreateGrievance() {
    const [form, setForm] = useState({ ticket_type: "general", subject: "", description: "" });
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");
        setSuccess("");
        try {
            const userData = JSON.parse(localStorage.getItem("user_info") || "{}");
            const res = await createSupportTicket({
                ...form,
                user_id: userData?.id || userData?.user_id,
                organization_id: userData?.organization_id || userData?.org_id,
            });
            setSuccess(`Ticket created: ${res?.ticket_number || res?.data?.ticket_number || "—"}`);
            setForm({ ticket_type: "general", subject: "", description: "" });
        } catch (err) {
            setError(err?.message || "Failed to create ticket.");
        } finally {
            setSubmitting(false);
        }
    };

    const inputStyle = {
        width: "100%",
        padding: "11px 14px",
        borderRadius: 10,
        border: "1.5px solid #e2e8f0",
        fontSize: 14,
        color: "#0f172a",
        outline: "none",
        boxSizing: "border-box",
        fontFamily: "inherit",
    };

    return (
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 24px" }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Create Grievance</h1>
            <p style={{ color: "#64748b", marginBottom: 28, fontSize: 14 }}>Submit a new internal support ticket.</p>

            <form onSubmit={handleSubmit} style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 28 }}>
                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Type</label>
                    <select
                        style={{ ...inputStyle, background: "#fff" }}
                        value={form.ticket_type}
                        onChange={(e) => setForm((f) => ({ ...f, ticket_type: e.target.value }))}
                    >
                        {TICKET_TYPES.map((t) => (
                            <option key={t} value={t}>{t.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                        ))}
                    </select>
                </div>

                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Subject *</label>
                    <input
                        required
                        style={inputStyle}
                        placeholder="Brief subject"
                        value={form.subject}
                        onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                    />
                </div>

                <div style={{ marginBottom: 24 }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Description *</label>
                    <textarea
                        required
                        style={{ ...inputStyle, minHeight: 120, resize: "vertical" }}
                        placeholder="Describe the issue in detail…"
                        value={form.description}
                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    />
                </div>

                {error && (
                    <div style={{ padding: "10px 14px", background: "#fef2f2", color: "#dc2626", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
                        {error}
                    </div>
                )}
                {success && (
                    <div style={{ padding: "10px 14px", background: "#dcfce7", color: "#15803d", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
                        ✓ {success}
                    </div>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                        type="submit"
                        disabled={submitting}
                        style={{
                            background: submitting ? "#e2e8f0" : "linear-gradient(135deg, #4F6EF7, #6366f1)",
                            color: submitting ? "#94a3b8" : "#fff",
                            border: "none",
                            borderRadius: 10,
                            padding: "12px 28px",
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: submitting ? "not-allowed" : "pointer",
                        }}
                    >
                        {submitting ? "Submitting…" : "Submit Ticket"}
                    </button>
                </div>
            </form>
        </div>
    );
}
