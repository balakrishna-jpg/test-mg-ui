// app/components/ElectionsWeb/Survey/SurveyBuilder.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "@remix-run/react";
import {
    ArrowLeft,
    Loader2,
    Plus,
    Pencil,
    Trash2,
    X,
    GripVertical,
    LogIn,
    ZoomIn,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import {
    getMargadarshSurvey,
    addMargadarshSurveyPage,
    updateMargadarshSurveyPage,
    deleteMargadarshSurveyPage,
    addMargadarshSurveyQuestion,
    updateMargadarshSurveyQuestion,
    deleteMargadarshSurveyQuestion,
    uploadSurveyImage,
    updateMargadarshSurvey,
} from "~/api";
import { message } from "antd";

// ── Question types ──────────────────────────────────────────
const QUESTION_TYPES = [
    {
        id: "multiple_choice_one",
        label: "Multiple Choice",
        sublabel: "One Answer",
        Icon: () => <span className="text-base">◉</span>,
        hasOptions: true,
    },
    {
        id: "multiple_choice_many",
        label: "Multiple Choice",
        sublabel: "Many Answers",
        Icon: () => <span className="text-base">☑</span>,
        hasOptions: true,
    },
    {
        id: "dropdown_one",
        label: "Dropdown",
        sublabel: "One Answer",
        Icon: () => <span className="text-base">▾</span>,
        hasOptions: true,
    },
    {
        id: "dropdown_many",
        label: "Dropdown",
        sublabel: "Many Answers",
        Icon: () => <span className="text-base">▾▾</span>,
        hasOptions: true,
    },
    {
        id: "image_selection",
        label: "Image Selection",
        sublabel: "",
        Icon: () => <span className="text-base">🖼</span>,
        hasOptions: true,
    },
    {
        id: "rating_scale",
        label: "Rating Scale",
        sublabel: "",
        Icon: () => <span className="text-base">⊢⊣</span>,
        hasRating: true,
    },
    {
        id: "star_rating",
        label: "Star Rating",
        sublabel: "",
        Icon: () => <span className="text-base">★</span>,
        hasStar: true,
    },

    {
        id: "slider",
        label: "Slider Scale",
        sublabel: "",
        Icon: () => <span className="text-base">←→</span>,
        hasSlider: true,
    },

    {
        id: "ranking",
        label: "Ranking",
        sublabel: "",
        Icon: () => <span className="text-base">↕</span>,
        hasOptions: true,
    },
    {
        id: "boolean",
        label: "Boolean",
        sublabel: "Yes/No",
        Icon: () => <span className="text-base">⊙</span>,
        hasBoolean: true,
    },
    {
        id: "text",
        label: "Text",
        sublabel: "Free-form response",
        Icon: () => <span className="text-base">Aa</span>,
        hasText: true,
    },
];

const SUB_TABS = [
    { label: "Summary", section: "survey-summary" },
    { label: "Builder", section: "survey-builder" },
    { label: "Responses", section: "survey-responses" },
    { label: "Audit Logs", section: "survey-audit" },
    { label: "Launch", section: "survey-launch" },
    { label: "Reports", section: "survey-reports" },
];

// ── Default question form ───────────────────────────────────
function defaultForm(typeId) {
    return {
        question_type: typeId,
        title: "",
        description: "",
        required: false,
        allow_comment: false,
        comment_label: "Add a comment",
        randomize_options: false,
        options_text: "",
        rating_scale: { min_value: 1, max_value: 10, min_label: "", max_label: "" },
        star_rating: { max_stars: 5, allow_half_stars: false },
        boolean: { true_label: "Yes", false_label: "No" },
        slider: {
            min_value: 0,
            max_value: 100,
            step: 1,
            min_label: "",
            max_label: "",
        },
        text: {
            placeholder: "Enter your feedback here",
            input_type: "text",
            multiline: true,
            max_length: 500,
        },
        image_options:
            typeId === "image_selection"
                ? [
                    { id: `opt_${Date.now()}_1`, label: "Option 1", image_url: "" },
                    { id: `opt_${Date.now()}_2`, label: "Option 2", image_url: "" },
                ]
                : undefined,
    };
}

function parseOptions(text) {
    return text
        .split("\n")
        .filter(Boolean)
        .map((label, i) => ({
            option_id: `opt_${Date.now()}_${i}`,
            label,
            value: label,
            order: i,
        }));
}

// ── Toggle component ────────────────────────────────────────
function Toggle({ checked, onChange }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${checked ? "bg-gray-900 dark:bg-white" : "bg-gray-200 dark:bg-[#444]"
                }`}
        >
            <div
                className={`absolute top-0.5 w-4 h-4 bg-white dark:bg-gray-900 rounded-full shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"
                    }`}
            />
        </button>
    );
}

// ── Question Editor Modal ───────────────────────────────────
function QuestionModal({ typeId, existing, onSave, onClose, saving }) {
    const typeInfo =
        QUESTION_TYPES.find((t) => t.id === typeId) || QUESTION_TYPES[0];
    const [form, setForm] = useState(() => {
        if (existing) {
            return {
                ...defaultForm(typeId),
                title: existing.title || "",
                description: existing.description || "",
                required: existing.required || false,
                allow_comment: existing.allow_comment || false,
                comment_label: existing.comment_label || "Add a comment",
                randomize_options: existing.randomize_options || false,
                options_text:
                    typeId !== "image_selection"
                        ? (existing.options || []).map((o) => o.label).join("\n")
                        : "",
                image_options:
                    typeId === "image_selection"
                        ? (existing.options || []).map((o) => ({
                            ...o,
                            id: o.option_id || `opt_${Date.now()}_${Math.random()}`,
                            image_label: o.image_label || o.label || "",
                        }))
                        : [
                            {
                                id: `opt_${Date.now()}_1`,
                                image_label: "Option 1",
                                image_url: "",
                            },
                            {
                                id: `opt_${Date.now()}_2`,
                                image_label: "Option 2",
                                image_url: "",
                            },
                        ],
                rating_scale: existing.rating_scale || {
                    min_value: 1,
                    max_value: 10,
                    min_label: "",
                    max_label: "",
                },
                star_rating: existing.star_rating || {
                    max_stars: 5,
                    allow_half_stars: false,
                },
                boolean: existing.boolean || { true_label: "Yes", false_label: "No" },
                slider: existing.slider || {
                    min_value: 0,
                    max_value: 100,
                    step: 1,
                    min_label: "",
                    max_label: "",
                },
                text:
                    typeId === "text"
                        ? {
                              placeholder: existing.text?.placeholder ?? "Enter your feedback here",
                              input_type: existing.text?.input_type ?? "text",
                              multiline: existing.text?.multiline ?? true,
                              max_length: existing.text?.max_length ?? 500,
                          }
                        : undefined,
            };
        }
        return defaultForm(typeId);
    });

    const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
    const setNested = (key, sub, val) =>
        setForm((f) => ({ ...f, [key]: { ...f[key], [sub]: val } }));

    const handleImageUpload = async (idx, file) => {
        if (!file) return;
        const searchParams = new URLSearchParams(window.location.search);
        const sid = searchParams.get("surveyId");
        if (!sid) return message.error("Survey ID missing");

        try {
            message.loading({ content: "Uploading...", key: "img_upload" });
            const res = await uploadSurveyImage(sid, file);
            if (res?.success) {
                const newOpts = [...form.image_options];
                newOpts[idx].image_url = res.data?.image_url;
                if (
                    !newOpts[idx].image_label ||
                    newOpts[idx].image_label.startsWith("Option ")
                ) {
                    // try to use filename without extension as label if it's default
                    newOpts[idx].image_label =
                        file.name.split(".")[0] || `Option ${idx + 1}`;
                }
                set("image_options", newOpts);
                message.success({ content: "Uploaded!", key: "img_upload" });
            } else {
                message.error({ content: "Upload failed", key: "img_upload" });
            }
        } catch (e) {
            console.error(e);
            message.error({ content: "Upload error", key: "img_upload" });
        }
    };

    const handleSave = () => {
        if (!form.title.trim()) {
            message.warning("Question title is required");
            return;
        }
        onSave({
            question_type: typeId,
            title: form.title.trim(),
            description: form.description.trim() || undefined,
            required: form.required,
            allow_comment: form.allow_comment,
            comment_label: form.allow_comment ? form.comment_label : undefined,
            randomize_options: typeInfo.hasOptions
                ? form.randomize_options
                : undefined,
            options: typeInfo.hasOptions
                ? typeId === "image_selection"
                    ? form.image_options.map((o, i) => ({
                        option_id: o.option_id || `opt_${Date.now()}_${i}`,
                        label: "",
                        image_label: o.image_label || `Option ${i + 1}`,
                        value: o.image_label || `Option ${i + 1}`,
                        image_url: o.image_url,
                        order: i,
                    }))
                    : parseOptions(form.options_text)
                : [],
            rating_scale: typeInfo.hasRating ? form.rating_scale : undefined,
            star_rating: typeInfo.hasStar ? form.star_rating : undefined,
            boolean: typeInfo.hasBoolean ? form.boolean : undefined,
            slider: typeInfo.hasSlider ? form.slider : undefined,
            text: typeInfo.hasText ? form.text : undefined,
        });
    };

    const inputClass =
        "w-full border border-gray-200 dark:border-[#333] rounded-md px-3 py-2 text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-[#111] placeholder-gray-400 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors";

    return (
        <>
            <div className="fixed inset-0 z-[100] bg-black/50" onClick={onClose} />
            <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
                <div
                    className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-sm shadow-xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden"
                    style={{ animation: "fadeUp 0.18s ease-out" }}
                >
                    <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>

                    {/* Modal header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#2a2a2a]">
                        <div>
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                                {typeInfo.label}
                                {typeInfo.sublabel && (
                                    <span className="text-gray-400 font-normal ml-1.5">
                                        ({typeInfo.sublabel})
                                    </span>
                                )}
                            </h2>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Configure your question
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Modal tabs */}
                    <div className="flex border-b border-gray-100 dark:border-[#2a2a2a] px-6 ">
                        {["Editor"].map((tab, i) => (
                            <button
                                key={tab}
                                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${i === 0
                                    ? "border-gray-900 dark:border-white text-gray-900 dark:text-white"
                                    : "border-transparent text-gray-400 cursor-not-allowed"
                                    }`}
                                disabled={i !== 0}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Modal body */}
                    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                        {/* Question */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                                Question <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={form.title}
                                onChange={(e) => set("title", e.target.value)}
                                placeholder="Enter your question..."
                                rows={2}
                                className={`${inputClass} resize-none`}
                                autoFocus
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                                Description{" "}
                                <span className="text-gray-400 font-normal">(optional)</span>
                            </label>
                            <input
                                value={form.description}
                                onChange={(e) => set("description", e.target.value)}
                                placeholder="Add a description..."
                                className={inputClass}
                            />
                        </div>

                        {/* Answer section */}
                        <div className="pt-1 border-t border-gray-100 dark:border-[#2a2a2a]">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 pt-2">
                                Answer
                            </p>

                            {typeInfo.hasOptions && typeId !== "image_selection" && (
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1.5">
                                        Choices{" "}
                                        <span className="text-gray-300">(one per line)</span>
                                    </label>
                                    <textarea
                                        value={form.options_text}
                                        onChange={(e) => set("options_text", e.target.value)}
                                        placeholder={"Option 1\nOption 2\nOption 3"}
                                        rows={5}
                                        className={`${inputClass} resize-none font-mono`}
                                    />
                                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={form.randomize_options}
                                            onChange={(e) =>
                                                set("randomize_options", e.target.checked)
                                            }
                                            className="w-3.5 h-3.5 rounded border-gray-300"
                                        />
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            Randomize options order
                                        </span>
                                    </label>
                                </div>
                            )}

                            {typeId === "image_selection" && (
                                <div>
                                    {/* Choices header */}
                                    <div className="mb-4">
                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">
                                            Choices
                                        </p>

                                    </div>

                                    {/* Image option rows */}
                                    <div className="space-y-2.5">
                                        {(form.image_options || []).map((opt, i) => (
                                            <div key={opt.id} className="flex items-center gap-3">
                                                {/* Clickable dashed image box — THE upload trigger */}
                                                <label
                                                    htmlFor={`img-upload-${opt.id}`}
                                                    className="w-14 h-14 flex-shrink-0 border-2 border-dashed border-gray-300 dark:border-[#555] rounded flex items-center justify-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors overflow-hidden bg-white dark:bg-[#111] relative group"
                                                >
                                                    {opt.image_url ? (
                                                        <>
                                                            <img
                                                                src={opt.image_url}
                                                                alt=""
                                                                className="w-full h-full object-cover"
                                                            />
                                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                                <span className="text-white text-[10px] font-medium">
                                                                    Change
                                                                </span>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <svg
                                                            className="w-6 h-6 text-gray-300 dark:text-gray-600"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={1.5}
                                                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                            />
                                                        </svg>
                                                    )}
                                                    <input
                                                        id={`img-upload-${opt.id}`}
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) =>
                                                            handleImageUpload(i, e.target.files?.[0])
                                                        }
                                                    />
                                                </label>

                                                {/* Label input */}
                                                <input
                                                    value={
                                                        opt.image_label?.startsWith("Option ")
                                                            ? ""
                                                            : opt.image_label || ""
                                                    }
                                                    onChange={(e) => {
                                                        const newOpts = [...form.image_options];
                                                        newOpts[i] = {
                                                            ...newOpts[i],
                                                            image_label: e.target.value,
                                                        };
                                                        set("image_options", newOpts);
                                                    }}
                                                    placeholder="Enter an image label (Optional)"
                                                    className="flex-1 border border-gray-200 dark:border-[#333] rounded px-3 py-2 text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-[#111] placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
                                                />

                                                {/* + button: also triggers upload for this row */}
                                                <label
                                                    htmlFor={`img-upload-${opt.id}`}
                                                    className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer transition-colors flex-shrink-0"
                                                    title="Upload image"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </label>

                                                {/* × remove button */}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (form.image_options.length > 2) {
                                                            set(
                                                                "image_options",
                                                                form.image_options.filter((_, idx) => idx !== i)
                                                            );
                                                        }
                                                    }}
                                                    className={`w-7 h-7 flex items-center justify-center transition-colors flex-shrink-0 ${form.image_options.length > 2
                                                        ? "text-gray-400 hover:text-red-500 cursor-pointer"
                                                        : "text-gray-200 dark:text-[#3a3a3a] cursor-not-allowed"
                                                        }`}
                                                    title={
                                                        form.image_options.length > 2
                                                            ? "Remove option"
                                                            : "Minimum 2 options required"
                                                    }
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Add Choice */}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            set("image_options", [
                                                ...(form.image_options || []),
                                                {
                                                    id: `opt_${Date.now()}_${Math.random()}`,
                                                    image_label: `Option ${(form.image_options?.length || 0) + 1
                                                        }`,
                                                    image_url: "",
                                                },
                                            ])
                                        }
                                        className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                                    >
                                        <Plus className="w-3 h-3" /> Add Choice
                                    </button>
                                </div>
                            )}

                            {typeInfo.hasRating && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">
                                            Min Value
                                        </label>
                                        <input
                                            type="number"
                                            value={form.rating_scale.min_value}
                                            onChange={(e) =>
                                                setNested("rating_scale", "min_value", +e.target.value)
                                            }
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">
                                            Max Value
                                        </label>
                                        <input
                                            type="number"
                                            value={form.rating_scale.max_value}
                                            onChange={(e) =>
                                                setNested("rating_scale", "max_value", +e.target.value)
                                            }
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">
                                            Min Label
                                        </label>
                                        <input
                                            value={form.rating_scale.min_label}
                                            onChange={(e) =>
                                                setNested("rating_scale", "min_label", e.target.value)
                                            }
                                            placeholder="e.g. Not at all"
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">
                                            Max Label
                                        </label>
                                        <input
                                            value={form.rating_scale.max_label}
                                            onChange={(e) =>
                                                setNested("rating_scale", "max_label", e.target.value)
                                            }
                                            placeholder="e.g. Extremely"
                                            className={inputClass}
                                        />
                                    </div>
                                </div>
                            )}

                            {typeInfo.hasStar && (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">
                                            Max Stars
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={10}
                                            value={form.star_rating.max_stars}
                                            onChange={(e) =>
                                                setNested("star_rating", "max_stars", +e.target.value)
                                            }
                                            className="w-28 border border-gray-200 dark:border-[#333] rounded-md px-3 py-2 text-sm bg-white dark:bg-[#111] text-gray-800 dark:text-gray-200 focus:outline-none"
                                        />
                                    </div>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={form.star_rating.allow_half_stars}
                                            onChange={(e) =>
                                                setNested(
                                                    "star_rating",
                                                    "allow_half_stars",
                                                    e.target.checked
                                                )
                                            }
                                            className="w-3.5 h-3.5 rounded"
                                        />
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            Allow half stars
                                        </span>
                                    </label>
                                </div>
                            )}

                            {typeInfo.hasBoolean && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">
                                            True Label
                                        </label>
                                        <input
                                            value={form.boolean.true_label}
                                            onChange={(e) =>
                                                setNested("boolean", "true_label", e.target.value)
                                            }
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">
                                            False Label
                                        </label>
                                        <input
                                            value={form.boolean.false_label}
                                            onChange={(e) =>
                                                setNested("boolean", "false_label", e.target.value)
                                            }
                                            className={inputClass}
                                        />
                                    </div>
                                </div>
                            )}

                            {typeInfo.hasSlider && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">
                                            Min Value
                                        </label>
                                        <input
                                            type="number"
                                            value={form.slider.min_value}
                                            onChange={(e) =>
                                                setNested("slider", "min_value", +e.target.value)
                                            }
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">
                                            Max Value
                                        </label>
                                        <input
                                            type="number"
                                            value={form.slider.max_value}
                                            onChange={(e) =>
                                                setNested("slider", "max_value", +e.target.value)
                                            }
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">
                                            Step
                                        </label>
                                        <input
                                            type="number"
                                            value={form.slider.step}
                                            onChange={(e) =>
                                                setNested("slider", "step", +e.target.value)
                                            }
                                            className={inputClass}
                                        />
                                    </div>
                                    <div className="hidden"></div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">
                                            Min Label
                                        </label>
                                        <input
                                            value={form.slider.min_label}
                                            onChange={(e) =>
                                                setNested("slider", "min_label", e.target.value)
                                            }
                                            placeholder="e.g. Low"
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">
                                            Max Label
                                        </label>
                                        <input
                                            value={form.slider.max_label}
                                            onChange={(e) =>
                                                setNested("slider", "max_label", e.target.value)
                                            }
                                            placeholder="e.g. High"
                                            className={inputClass}
                                        />
                                    </div>
                                </div>
                            )}

                            {typeInfo.hasText && (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">
                                            Placeholder
                                        </label>
                                        <input
                                            value={form.text?.placeholder ?? ""}
                                            onChange={(e) =>
                                                setNested("text", "placeholder", e.target.value)
                                            }
                                            placeholder="e.g. Enter your name, Enter your email, Enter mobile number"
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">
                                            Input type
                                        </label>
                                        <select
                                            value={form.text?.input_type ?? "text"}
                                            onChange={(e) =>
                                                setNested("text", "input_type", e.target.value)
                                            }
                                            className={inputClass}
                                        >
                                            <option value="text">Text</option>
                                            <option value="email">Email</option>
                                            <option value="tel">Phone (tel)</option>
                                            <option value="number">Number</option>
                                        </select>
                                        <p className="text-[10px] text-gray-400 mt-1">
                                            Hint for keyboard / validation (e.g. email, phone keypad)
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">
                                            Max length (characters)
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={10000}
                                            value={form.text?.max_length ?? 500}
                                            onChange={(e) =>
                                                setNested("text", "max_length", Math.max(1, +e.target.value || 500))
                                            }
                                            className={inputClass}
                                        />
                                    </div>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={form.text?.multiline ?? true}
                                            onChange={(e) =>
                                                setNested("text", "multiline", e.target.checked)
                                            }
                                            className="w-3.5 h-3.5 rounded"
                                        />
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            Multiline (textarea)
                                        </span>
                                    </label>
                                </div>
                            )}
                        </div>

                        {/* Toggles */}
                        <div className="border-t border-gray-100 dark:border-[#2a2a2a] pt-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                    Required
                                </span>
                                <Toggle
                                    checked={form.required}
                                    onChange={(v) => set("required", v)}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                    Allow comment
                                </span>
                                <Toggle
                                    checked={form.allow_comment}
                                    onChange={(v) => set("allow_comment", v)}
                                />
                            </div>
                            {form.allow_comment && (
                                <input
                                    value={form.comment_label}
                                    onChange={(e) => set("comment_label", e.target.value)}
                                    placeholder="Comment label"
                                    className={inputClass}
                                />
                            )}
                        </div>
                    </div>

                    {/* Modal footer */}
                    <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 dark:border-[#2a2a2a] bg-gray-50/50 dark:bg-[#111]/50">
                        <button
                            onClick={onClose}
                            disabled={saving}
                            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-[#333] rounded-md hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving || !form.title.trim()}
                            className="px-5 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-md hover:bg-gray-700 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                            Save Question
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

// ── Main Builder ────────────────────────────────────────────
export default function SurveyBuilder() {
    
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const surveyId = searchParams.get("surveyId");

    const [survey, setSurvey] = useState(null);
    const [pages, setPages] = useState([]);
    const [activePageId, setActivePageId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dragTypeId, setDragTypeId] = useState(null);
    const [modal, setModal] = useState(null);
    const [saving, setSaving] = useState(false);
    const [renamingPageId, setRenamingPageId] = useState(null);
    const [renameValue, setRenameValue] = useState("");
    const [deleteQ, setDeleteQ] = useState(null);
    const [deleteP, setDeleteP] = useState(null);
    const [isEditingName, setIsEditingName] = useState(false);
    const [editNameValue, setEditNameValue] = useState("");

    const handleNameSave = async () => {
        if (!editNameValue.trim() || editNameValue.trim() === survey?.survey_name) {
            setIsEditingName(false);
            return;
        }
        try {
            await updateMargadarshSurvey(surveyId, { survey_name: editNameValue.trim() });
            setIsEditingName(false);
            setSurvey((prev) => ({ ...prev, survey_name: editNameValue.trim() }));
            message.success("Survey name updated");
        } catch {
            message.error("Failed to update survey name");
        }
    };

    const fetchSurvey = useCallback(async () => {
        if (!surveyId) return;
        try {
            const res = await getMargadarshSurvey(surveyId);
            if (res?.success) {
                setSurvey(res.data);
                const ps = res.data?.editor?.pages || res.data?.pages || [];
                setPages(ps);
                if (ps.length > 0 && !activePageId) setActivePageId(ps[0].page_id);
            }
        } catch (err) {
            console.error(err);
        }
    }, [surveyId]);

    useEffect(() => {
        setLoading(true);
        fetchSurvey().finally(() => setLoading(false));
    }, [fetchSurvey]);

    const activePage = pages.find((p) => p.page_id === activePageId);

    // ── Page actions ─────────────────────────────────────────
    const addPage = async () => {
        try {
            const res = await addMargadarshSurveyPage(surveyId, {
                title: `Page ${pages.length + 1}`,
            });
            if (res?.success) {
                await fetchSurvey();
                if (res.data?.page_id) setActivePageId(res.data.page_id);
                message.success("Page added");
            }
        } catch {
            message.error("Failed to add page");
        }
    };

    const startRename = (page) => {
        setRenamingPageId(page.page_id);
        setRenameValue(page.title || "");
    };

    const commitRename = async (pageId) => {
        if (!renameValue.trim()) {
            setRenamingPageId(null);
            return;
        }
        try {
            await updateMargadarshSurveyPage(surveyId, pageId, {
                title: renameValue.trim(),
            });
            setRenamingPageId(null);
            fetchSurvey();
        } catch {
            message.error("Failed to rename page");
        }
    };

    const deletePage = async (pageId) => {
        try {
            await deleteMargadarshSurveyPage(surveyId, pageId);
            setDeleteP(null);
            const remaining = pages.filter((p) => p.page_id !== pageId);
            if (activePageId === pageId && remaining.length > 0)
                setActivePageId(remaining[0].page_id);
            await fetchSurvey();
            message.success("Page deleted");
        } catch {
            message.error("Failed to delete page");
        }
    };

    // ── Question actions ──────────────────────────────────────
    const openAddModal = (typeId) => {
        if (!activePageId) {
            message.warning("Please add a page first");
            return;
        }
        setModal({ typeId, existing: null, pageId: activePageId });
    };
    const openEditModal = (question, pageId) =>
        setModal({ typeId: question.question_type, existing: question, pageId });

    const handleModalSave = async (payload) => {
        setSaving(true);
        try {
            if (modal.existing) {
                await updateMargadarshSurveyQuestion(
                    surveyId,
                    modal.pageId,
                    modal.existing.question_id,
                    payload
                );
                message.success("Question updated");
            } else {
                await addMargadarshSurveyQuestion(surveyId, modal.pageId, payload);
                message.success("Question added");
            }
            setModal(null);
            fetchSurvey();
        } catch {
            message.error("Failed to save question");
        } finally {
            setSaving(false);
        }
    };

    const deleteQuestion = async () => {
        if (!deleteQ) return;
        try {
            await deleteMargadarshSurveyQuestion(
                surveyId,
                deleteQ.pageId,
                deleteQ.questionId
            );
            setDeleteQ(null);
            fetchSurvey();
            message.success("Question deleted");
        } catch {
            message.error("Failed to delete question");
        }
    };

    if (loading) {
        return (
            <div className="h-[calc(100vh-49px)] flex items-center justify-center bg-white dark:bg-[#111]">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-49px)] flex flex-col bg-white dark:bg-[#111]">
            {/* ── Top bar ── */}
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
                                    setEditNameValue(survey?.survey_name || "");
                                }
                            }}
                            className="text-sm font-medium text-gray-900 dark:text-white bg-transparent border-b border-gray-400 focus:outline-none focus:border-blue-500 w-full"
                        />
                    </div>
                ) : (
                    <div
                        className="flex items-center gap-2 mr-auto cursor-pointer group"
                        onClick={() => {
                            setEditNameValue(survey?.survey_name || "");
                            setIsEditingName(true);
                        }}
                    >
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-xs">
                            {survey?.survey_name || "Survey Builder"}
                        </span>
                        <Pencil className="w-3.5 h-3.5 text-gray-400 transition-opacity" />
                    </div>
                )}

                {/* Sub-nav tabs */}
                <div className="flex items-center h-full">
                    {SUB_TABS.map((tab) => {
                        const isActive = tab.section === "survey-builder";
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

            {/* ── 3-column layout ── */}
            <div className="flex-1 flex min-h-0 overflow-hidden">
                {/* ── Left panel: Question Types ── */}
                <div className="w-52 flex-shrink-0 bg-white dark:bg-[#1a1a1a] border-r border-gray-200 dark:border-[#333] overflow-y-auto">
                    <div className="px-3 pt-4 pb-2">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-2 mb-2">
                            Question Types
                        </p>
                    </div>
                    <div className="pb-4">
                        {QUESTION_TYPES.map((qt) => (
                            <div
                                key={qt.id}
                                draggable
                                onDragStart={() => setDragTypeId(qt.id)}
                                onDragEnd={() => setDragTypeId(null)}
                                onClick={() => openAddModal(qt.id)}
                                className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#222] transition-colors group"
                            >
                                <span className="w-5 text-gray-500 dark:text-gray-400 text-center flex-shrink-0 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
                                    <qt.Icon />
                                </span>
                                <div className="min-w-0">
                                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                        {qt.label}
                                    </span>
                                    {qt.sublabel && (
                                        <span className="text-xs text-gray-400 ml-1.5">
                                            ({qt.sublabel})
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Center canvas ── */}
                <div
                    className="flex-1 min-h-0 overflow-y-auto bg-[#f4f5f5] dark:bg-[#0d0d0d]"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                        if (dragTypeId) {
                            openAddModal(dragTypeId);
                            setDragTypeId(null);
                        }
                    }}
                >
                    {pages.length === 0 ? (
                        /* Empty state */
                        <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-6">
                            <p className="text-sm text-gray-400 max-w-xs mb-6 leading-relaxed">
                                Add your first page, then click or drag and drop question types
                                from the left side to build your form.
                            </p>
                            <button
                                onClick={addPage}
                                className="px-5 py-2.5 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-md hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Create First Page
                            </button>
                        </div>
                    ) : (
                        <div className="max-w-3xl mx-auto py-8">
                            {/* Page header bar */}
                            <div className="bg-black text-white px-6 py-4 flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-3">
                                    {renamingPageId === activePage?.page_id ? (
                                        <input
                                            value={renameValue}
                                            onChange={(e) => setRenameValue(e.target.value)}
                                            onBlur={() => commitRename(activePage.page_id)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") commitRename(activePage.page_id);
                                                if (e.key === "Escape") setRenamingPageId(null);
                                            }}
                                            autoFocus
                                            className="bg-transparent text-white text-sm font-medium border-b border-white/50 focus:outline-none min-w-[160px]"
                                        />
                                    ) : (
                                        <button
                                            onClick={() => activePage && startRename(activePage)}
                                            className="flex items-center gap-2 text-sm font-medium text-white hover:text-gray-300 transition-colors group"
                                        >
                                            {activePage?.title || "Page 1"}
                                            <span className="text-gray-500 dark:text-gray-600">
                                                ▾
                                            </span>
                                            <Pencil className="w-3 h-3 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <span className="text-gray-600">|</span>
                                    <button
                                        onClick={() => setDeleteP(activePage?.page_id)}
                                        className="hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            {/* Drop zone / Complete White Page containing questions */}
                            <div
                                className={`min-h-[200px] bg-white dark:bg-[#111] border-x border-b border-gray-200 dark:border-[#333] shadow-sm transition-all p-6 sm:p-10 ${dragTypeId
                                    ? "bg-blue-50/60 dark:bg-blue-900/10 border-2 border-dashed border-blue-300 dark:border-blue-700"
                                    : ""
                                    }`}
                            >
                                {(activePage?.questions || []).length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <p className="text-sm font-medium text-gray-400 mb-1">
                                            Drag and drop questions here
                                        </p>
                                        <p className="text-xs text-gray-300 dark:text-gray-500">
                                            Click a question type on the left to add it here
                                        </p>
                                    </div>
                                ) : (
                                    (activePage?.questions || []).map((q, qi) => {
                                        const qt = QUESTION_TYPES.find(
                                            (t) => t.id === q.question_type
                                        );
                                        const isChoice =
                                            q.question_type?.includes("choice") ||
                                            q.question_type?.includes("dropdown");
                                        const isMany = q.question_type?.includes("many");
                                        return (
                                            <div
                                                key={q.question_id || qi}
                                                className="group relative bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] shadow-sm mb-6 transition-colors cursor-pointer overflow-hidden"
                                                onClick={() => openEditModal(q, activePage.page_id)}
                                            >
                                                <div className="px-3 sm:px-6 py-4 sm:py-6">
                                                    {/* Q number + required badge */}
                                                    <div className="flex items-start justify-between mb-3">
                                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100 leading-snug flex-1 pr-4">
                                                            <span className="text-gray-400 mr-1.5">
                                                                {qi + 1}.
                                                            </span>
                                                            {q.title || "Untitled question"}
                                                            {q.required && (
                                                                <span className="text-red-500 ml-1">*</span>
                                                            )}
                                                        </p>
                                                        {/* Hover actions */}
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    openEditModal(q, activePage.page_id);
                                                                }}
                                                                className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                                            >
                                                                <Pencil className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setDeleteQ({
                                                                        pageId: activePage.page_id,
                                                                        questionId: q.question_id,
                                                                    });
                                                                }}
                                                                className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Type badge */}
                                                    <span className="inline-block text-[10px] font-medium text-gray-400 bg-gray-50 dark:bg-[#222] border border-gray-100 dark:border-[#333] px-2 py-0.5 rounded mb-3">
                                                        {qt?.label || q.question_type}
                                                        {qt?.sublabel && ` · ${qt.sublabel}`}
                                                    </span>

                                                    {/* Options preview */}
                                                    {isChoice &&
                                                        q.question_type !== "image_selection" &&
                                                        q.options?.length > 0 && (
                                                            <div className="space-y-1.5 mt-1">
                                                                {q.options.slice(0, 4).map((opt, oi) => (
                                                                    <div
                                                                        key={oi}
                                                                        className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-400"
                                                                    >
                                                                        {isMany ? (
                                                                            <div className="w-4 h-4 rounded border border-gray-400 bg-transparent shrink-0"></div>
                                                                        ) : (
                                                                            <div className="w-4 h-4 rounded-full border border-gray-400 bg-transparent shrink-0"></div>
                                                                        )}
                                                                        <span>{opt.label}</span>
                                                                    </div>
                                                                ))}
                                                                {q.options.length > 4 && (
                                                                    <p className="text-xs text-gray-400 pl-6">
                                                                        +{q.options.length - 4} more
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}

                                                    {/* Image selection preview */}
                                                    {q.question_type === "image_selection" &&
                                                        q.options?.length > 0 && (
                                                            <div 
                                                                className="mt-3 w-full overflow-x-scroll pb-2 overscroll-x-contain"
                                                                style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'thin', touchAction: 'pan-x' }}
                                                            >
                                                                <div className="flex gap-3 w-max px-1 touch-pan-x">
                                                                    {q.options.slice(0, 4).map((opt, oi) => (
                                                                        <div
                                                                            key={oi}
                                                                            className="flex-shrink-0 w-[100px] sm:w-[120px] flex flex-col items-center pointer-events-none"
                                                                        >
                                                                            {/* Card box */}
                                                                            <div className="w-full border border-gray-300 dark:border-[#444] bg-white dark:bg-[#1a1a1a] flex flex-col rounded-sm overflow-hidden">
                                                                                {/* Image area */}
                                                                                <div className="relative w-full h-[100px] sm:h-[120px] bg-gray-50 dark:bg-[#222] flex items-center justify-center overflow-hidden">
                                                                                    {opt.image_url ? (
                                                                                        <img
                                                                                            src={opt.image_url}
                                                                                            alt={opt.image_label || opt.label}
                                                                                            className="w-full h-full object-cover"
                                                                                        />
                                                                                    ) : (
                                                                                        <span className="text-xl sm:text-2xl text-gray-300 dark:text-gray-600">
                                                                                            🖼
                                                                                        </span>
                                                                                    )}

                                                                                    {/* Magnifying glass triangle top-right */}
                                                                                    <div
                                                                                        className="absolute top-0 right-0 w-6 sm:w-8 h-6 sm:h-8 bg-black/50 overflow-hidden"
                                                                                        style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }}
                                                                                    >
                                                                                        <ZoomIn className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-2.5 sm:w-3 h-2.5 sm:h-3 text-white" />
                                                                                    </div>
                                                                                </div>

                                                                                {/* Radio button area inside card */}
                                                                                <div className="border-t border-gray-300 dark:border-[#444] p-1.5 sm:p-2 flex justify-center bg-white dark:bg-[#1a1a1a]">
                                                                                    <div className="w-3.5 sm:w-4 h-3.5 sm:h-4 rounded-full border border-gray-400 bg-transparent"></div>
                                                                                </div>
                                                                            </div>

                                                                            {/* Label text outside card */}
                                                                            <span className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-center text-gray-800 dark:text-gray-200 line-clamp-2 px-0.5 w-full">
                                                                                {opt.image_label || opt.label}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                    {q.options.length > 4 && (
                                                                        <div className="flex items-center justify-center w-16 sm:w-20 flex-shrink-0 text-[10px] sm:text-xs text-gray-400">
                                                                            +{q.options.length - 4} more
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                    {/* Boolean preview */}
                                                    {q.question_type === "boolean" && (
                                                        <div className="flex gap-3 mt-1">
                                                            {[
                                                                q.boolean?.true_label || "Yes",
                                                                q.boolean?.false_label || "No",
                                                            ].map((v) => (
                                                                <div
                                                                    key={v}
                                                                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                                                                >
                                                                    <div className="w-4 h-4 rounded-full border border-gray-400 bg-transparent shrink-0"></div>
                                                                    <span>{v}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Star rating preview */}
                                                    {q.question_type === "star_rating" && (
                                                        <div className="flex gap-1 mt-1">
                                                            {Array.from({
                                                                length: q.star_rating?.max_stars || 5,
                                                            }).map((_, i) => (
                                                                <span
                                                                    key={i}
                                                                    className="text-gray-200 dark:text-[#444] text-lg"
                                                                >
                                                                    ★
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Slider preview */}
                                                    {q.question_type === "slider" && (
                                                        <div className="mt-3 px-2">
                                                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                                <span>
                                                                    {q.slider?.min_label ||
                                                                        q.slider?.min_value ||
                                                                        "0"}
                                                                </span>
                                                                <span>
                                                                    {q.slider?.max_label ||
                                                                        q.slider?.max_value ||
                                                                        "100"}
                                                                </span>
                                                            </div>
                                                            <div className="h-1.5 w-full bg-gray-200 dark:bg-[#333] rounded-full relative">
                                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white dark:bg-gray-800 rounded-full border-2 border-gray-400 dark:border-gray-500 shadow-sm"></div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Rating Scale preview */}
                                                    {q.question_type === "rating_scale" && (
                                                        <div className="mt-3">
                                                            <div className="flex flex-wrap gap-2 sm:gap-3">
                                                                {Array.from({
                                                                    length: Math.min(
                                                                        11,
                                                                        ((q.rating_scale?.max_value || 10) -
                                                                            (q.rating_scale?.min_value || 1) +
                                                                            1) || 10
                                                                    ),
                                                                }).map((_, i) => {
                                                                    let val = (q.rating_scale?.min_value || 1) + i;
                                                                    return (
                                                                        <div
                                                                            key={i}
                                                                            className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded border border-gray-300 dark:border-[#444] flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-[#222]"
                                                                        >
                                                                            {val}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                            <div className="flex justify-between text-xs text-gray-500 mt-2 max-w-[calc(100%-1rem)]">
                                                                <span>{q.rating_scale?.min_label || ""}</span>
                                                                <span>{q.rating_scale?.max_label || ""}</span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Text preview */}
                                                    {q.question_type === "text" && (
                                                        <div className="mt-3">
                                                            {q.text?.multiline !== false ? (
                                                                <div className="border border-gray-200 dark:border-[#333] rounded-md px-3 py-2.5 bg-gray-50 dark:bg-[#1a1a1a] min-h-[72px]">
                                                                    <span className="text-xs text-gray-400 dark:text-[#8e8ea0]">
                                                                        {q.text?.placeholder || "Your answer..."}
                                                                    </span>
                                                                    {q.text?.max_length && (
                                                                        <span className="block text-[10px] text-gray-400 mt-1">
                                                                            max {q.text.max_length} chars
                                                                        </span>
                                                                    )}
                                                                    {q.text?.input_type && q.text.input_type !== "text" && (
                                                                        <span className="block text-[10px] text-gray-400 mt-0.5">
                                                                            {q.text.input_type === "email" ? "Email" : q.text.input_type === "tel" ? "Phone" : q.text.input_type === "number" ? "Number" : ""}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <input
                                                                    type={q.text?.input_type || "text"}
                                                                    readOnly
                                                                    placeholder={q.text?.placeholder || "Your answer..."}
                                                                    className="w-full border border-gray-200 dark:border-[#333] rounded-md px-3 py-2 text-sm bg-gray-50 dark:bg-[#1a1a1a] text-gray-400"
                                                                />
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Ranking preview */}
                                                    {q.question_type === "ranking" && q.options?.length > 0 && (
                                                        <div className="mt-3 space-y-2">
                                                            {q.options.slice(0, 5).map((opt, oi) => (
                                                                <div
                                                                    key={oi}
                                                                    className="flex items-center gap-3 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] p-2.5 rounded-md shadow-sm"
                                                                >
                                                                    <div className="flex flex-col gap-0.5 text-gray-300 dark:text-[#555]">
                                                                        <span className="w-1 h-1 bg-current rounded-full" />
                                                                        <span className="w-1 h-1 bg-current rounded-full" />
                                                                        <span className="w-1 h-1 bg-current rounded-full" />
                                                                    </div>
                                                                    <span className="w-6 h-6 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold rounded text-xs px-2 flex-shrink-0">
                                                                        {oi + 1}
                                                                    </span>
                                                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                                                        {opt.label}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                            {q.options.length > 5 && (
                                                                <p className="text-xs text-gray-400 pl-8 pt-1">
                                                                    +{q.options.length - 5} more items
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Add question prompt */}
                            <button
                                onClick={() => openAddModal(QUESTION_TYPES[0].id)}
                                className="w-full py-3 text-sm text-gray-400 border border-dashed border-gray-300 dark:border-[#333] rounded hover:border-gray-400 dark:hover:border-[#555] hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Add Question
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Right panel: Pages ── */}
                <div className="w-20 flex-shrink-0 bg-white dark:bg-[#1a1a1a] border-l border-gray-200 dark:border-[#333] flex flex-col items-center py-4 gap-2 overflow-y-auto">
                    <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
                        PAGE ({pages.length})
                    </p>
                    {pages.map((page, pi) => (
                        <div key={page.page_id} className="relative group">
                            <button
                                onClick={() => setActivePageId(page.page_id)}
                                className={`w-11 h-11 rounded-md flex items-center justify-center text-xs font-bold transition-all ${activePageId === page.page_id
                                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                                    : "bg-gray-100 dark:bg-[#2a2a2a] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#333]"
                                    }`}
                            >
                                P{pi + 1}
                            </button>
                            {pages.length > 1 && (
                                <button
                                    onClick={() => setDeleteP(page.page_id)}
                                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hidden group-hover:flex"
                                >
                                    <X className="w-2.5 h-2.5" />
                                </button>
                            )}
                        </div>
                    ))}
                    <button
                        onClick={addPage}
                        className="w-11 h-11 rounded-md border border-dashed border-gray-300 dark:border-[#444] flex items-center justify-center text-gray-400 hover:border-gray-500 dark:hover:border-[#666] hover:text-gray-600 dark:hover:text-gray-300 transition-colors mt-1"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* ── Question Editor Modal ── */}
            {modal && (
                <QuestionModal
                    typeId={modal.typeId}
                    existing={modal.existing}
                    onSave={handleModalSave}
                    onClose={() => setModal(null)}
                    saving={saving}
                />
            )}

            {/* ── Delete Question Confirm ── */}
            {deleteQ && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-black/40"
                        onClick={() => setDeleteQ(null)}
                    />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-xl shadow-xl p-6 max-w-sm w-full">
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                                Delete Question
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                                Are you sure you want to delete this question?
                            </p>
                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={() => setDeleteQ(null)}
                                    className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-[#333] rounded-md hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={deleteQuestion}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ── Delete Page Confirm ── */}
            {deleteP && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-black/40"
                        onClick={() => setDeleteP(null)}
                    />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-xl shadow-xl p-6 max-w-sm w-full">
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                                Delete Page
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                                This will delete the page and all its questions. Are you sure?
                            </p>
                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={() => setDeleteP(null)}
                                    className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-[#333] rounded-md hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => deletePage(deleteP)}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                                >
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
