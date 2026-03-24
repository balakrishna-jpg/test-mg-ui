// app/routes/survey.$id.tsx
// Public survey page: https://results.aadhan.in/survey/:id
// Renders survey questions and options (Zoho-style) for anonymous voting.

import { useState, useEffect, useRef } from "react";
import { useParams } from "@remix-run/react";
import { Loader2, CheckCircle, AlertCircle, ZoomIn, Check, ChevronDown, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { getPublicMargadarshSurvey, submitMargadarshSurveyResponse } from "~/api";
import margdarshLogo from "~/assets/Margadarsh-12.png";

type AnswerValue = string | string[] | number | boolean;

function PublicSurveyPage() {
  const { id: surveyId } = useParams<{ id: string }>();
  const [survey, setSurvey] = useState<{
    survey_name?: string;
    survey_id?: string;
    status?: string;
    editor?: { pages?: Page[] };
    pages?: Page[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const pages: Page[] = survey?.editor?.pages || survey?.pages || [];

  useEffect(() => {
    if (!surveyId) return;
    setLoading(true);
    setError(null);
    getPublicMargadarshSurvey(surveyId)
      .then((res: any) => {
        if (res?.success && res?.data) {
          setSurvey(res.data);
        } else {
          setError("Survey not found.");
        }
      })
      .catch((err: any) => {
        console.error("Error fetching survey:", err);
        const status = err?.response?.status;
        const detail = err?.response?.data?.detail || err?.message;
        if (status === 403) {
          setError("This survey is not currently accepting responses.");
        } else if (status === 404) {
          setError("Survey not found.");
        } else {
          setError(detail || "Failed to load survey.");
        }
      })
      .finally(() => setLoading(false));
  }, [surveyId]);

  const handleChange = (
    questionId: string,
    value: AnswerValue,
    multiple = false
  ) => {
    setAnswers((prev) => {
      if (multiple) {
        const arr = (prev[questionId] as string[] | undefined) || [];
        const set = new Set(arr);
        const str = String(value);
        if (set.has(str)) set.delete(str);
        else set.add(str);
        return { ...prev, [questionId]: Array.from(set) };
      }
      return { ...prev, [questionId]: value };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!surveyId || submitting || submitted) return;

    const requiredMissing = pages.some((page) =>
      (page.questions || []).some(
        (q) =>
          q.required &&
          (answers[q.question_id] === undefined ||
            answers[q.question_id] === "" ||
            (Array.isArray(answers[q.question_id]) &&
              (answers[q.question_id] as string[]).length === 0))
      )
    );
    if (requiredMissing) {
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitMargadarshSurveyResponse(surveyId, {
        answers,
      });
      if (res?.success !== false) {
        setSubmitted(true);
      } else {
        setError(res?.message || "Failed to submit response.");
      }
    } catch (err: any) {
      console.error("Error submitting survey:", err);
      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to submit. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fb] dark:bg-[#111111]">
        <Loader2 className="w-10 h-10 animate-spin text-[#0EA5E9] dark:text-[#F2700D]" />
      </div>
    );
  }

  if (error && !survey) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f9fb] dark:bg-[#111111] px-4">
        <AlertCircle className="w-16 h-16 text-amber-500 mb-4" />
        <h1 className="text-xl font-semibold text-gray-900 dark:text-[#ececf1] mb-2">
          Survey not available
        </h1>
        <p className="text-gray-600 dark:text-[#8e8ea0] text-center max-w-md">
          {error}
        </p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f9fb] dark:bg-[#111111] px-4">
        <CheckCircle className="w-16 h-16 text-emerald-500 mb-4" />
        <h1 className="text-xl font-semibold text-gray-900 dark:text-[#ececf1] mb-2">
          Thank you!
        </h1>
        <p className="text-gray-600 dark:text-[#8e8ea0] text-center max-w-md">
          Your response has been submitted successfully.
        </p>
      </div>
    );
  }

  const totalQuestions = pages.reduce(
    (acc, p) => acc + (p.questions?.length || 0),
    0
  );
  if (totalQuestions === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f9fb] dark:bg-[#111111] px-4">
        <AlertCircle className="w-16 h-16 text-amber-500 mb-4" />
        <h1 className="text-xl font-semibold text-gray-900 dark:text-[#ececf1] mb-2">
          No questions yet
        </h1>
        <p className="text-gray-600 dark:text-[#8e8ea0] text-center max-w-md">
          This survey has no questions to display.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f5f5] dark:bg-[#111111] py-4 sm:py-8 px-2 sm:px-4 flex flex-col items-center">
      <div className="w-full max-w-3xl flex-1 flex flex-col">
        <div className="flex flex-col flex-1">
          <div className="flex-1 overflow-y-auto">
            {/* White Header (Main width full) */}
            <div className="bg-white px-6 py-4 flex items-center shadow-sm z-10 border-b border-gray-100">
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="flex items-center gap-3 mb-2">
                  <img src={margdarshLogo} alt="Margadarsh Logo" className="h-12 sm:h-16 object-contain" />
                </div>
                <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                  {survey?.survey_name || "Survey"}
                </h2>
              </div>
            </div>

            {/* Complete White Page under header containing questions */}
            <div className="bg-white dark:bg-[#1a1a1a] shadow-sm border-x border-b border-gray-200 dark:border-[#3d3d3d] min-h-full px-2 sm:px-6 md:px-10 py-4 sm:py-8">
              {error && (
                <p className="text-sm text-amber-600 dark:text-amber-400 mb-6">
                  {error}
                </p>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                {pages.map((page, pageIdx) => (
                  <div key={page.page_id || pageIdx}>
                    {page.description && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {page.description}
                        </p>
                      </div>
                    )}
                    <div className="space-y-6">
                      {(page.questions || []).map((q, qIdx) => (
                        <div
                          key={q.question_id || qIdx}
                          className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] shadow-sm px-3 sm:px-6 py-4 sm:py-6 overflow-visible"
                        >
                          <QuestionBlock
                            question={q}
                            value={answers[q.question_id]}
                            onChange={(value, multiple) =>
                              handleChange(q.question_id, value, multiple)
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="pt-4 flex flex-col items-center gap-4">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto min-w-[180px] bg-red-400 hover:bg-red-700 text-white"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Submitting...
                      </>
                    ) : (
                      "Submit"
                    )}
                  </Button>
                  <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                    Never share any password-related information in this survey.
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────
interface Option {
  option_id: string;
  label: string;
  value?: string;
  order?: number;
  image_url?: string;
  image_label?: string;
}

interface Question {
  question_id: string;
  question_type: string;
  title: string;
  description?: string;
  required?: boolean;
  options?: Option[];
  rating_scale?: {
    min_value?: number;
    max_value?: number;
    min_label?: string;
    max_label?: string;
  };
  star_rating?: { max_stars?: number };
  boolean?: { true_label?: string; false_label?: string };
  slider?: {
    min_value?: number;
    max_value?: number;
    step?: number;
    min_label?: string;
    max_label?: string;
  };
  text?: {
    placeholder?: string;
    input_type?: string;
    multiline?: boolean;
    max_length?: number;
  };
}

interface Page {
  page_id: string;
  title?: string;
  description?: string;
  questions?: Question[];
}

// ── Question renderer ─────────────────────────────────────────
function QuestionBlock({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue, multiple?: boolean) => void;
}) {
  const type = question.question_type || "multiple_choice_one";
  const options = question.options || [];
  const required = question.required;

  if (type === "multiple_choice_one") {
    return (
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {question.title || "Question"}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </legend>
        {question.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            {question.description}
          </p>
        )}
        <div className="space-y-2">
          {options.map((opt) => {
            const selected = String(value) === String(opt.value ?? opt.label);
            return (
              <label
                key={opt.option_id}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-[#3d3d3d] hover:bg-gray-50 dark:hover:bg-[#222] cursor-pointer group"
              >
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors flex-shrink-0 ${selected
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-gray-400 bg-transparent group-hover:border-gray-500"
                    }`}
                >
                  {selected && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                </div>
                <input
                  type="radio"
                  name={question.question_id}
                  value={opt.value ?? opt.label}
                  checked={selected}
                  onChange={() => onChange(opt.value ?? opt.label)}
                  className="sr-only"
                />
                <span className="text-sm text-gray-800 dark:text-gray-200">
                  {opt.label}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
    );
  }

  if (type === "multiple_choice_many") {
    const arr = (value as string[] | undefined) || [];
    return (
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {question.title || "Question"}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </legend>
        {question.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            {question.description}
          </p>
        )}
        <div className="space-y-2">
          {options.map((opt) => {
            const v = opt.value ?? opt.label;
            const checked = arr.includes(String(v));
            return (
              <label
                key={opt.option_id}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-[#3d3d3d] hover:bg-gray-50 dark:hover:bg-[#222] cursor-pointer group"
              >
                <div
                  className={`w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${checked
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-gray-400 bg-transparent group-hover:border-gray-500"
                    }`}
                >
                  {checked && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                </div>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onChange(v, true)}
                  className="sr-only"
                />
                <span className="text-sm text-gray-800 dark:text-gray-200">
                  {opt.label}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
    );
  }

  if (type === "dropdown_one") {
    return (
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {question.title || "Question"}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </legend>
        {question.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            {question.description}
          </p>
        )}
        <select
          value={(value as string | undefined) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-gray-200 dark:border-[#3d3d3d] bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
        >
          <option value="">Select...</option>
          {options.map((opt) => (
            <option key={opt.option_id} value={opt.value ?? opt.label}>
              {opt.label}
            </option>
          ))}
        </select>
      </fieldset>
    );
  }

  if (type === "dropdown_many") {
    const [isOpen, setIsOpen] = useState(false);
    const selectedArr = (value as string[] | undefined) || [];
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleOption = (optValue: string) => {
      onChange(optValue, true);
    };

    const removeOption = (optValue: string, e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(optValue, true);
    };

    const getSelectedLabels = () => {
      return selectedArr.map((v) => {
        const opt = options.find((o) => (o.value ?? o.label) === v);
        return opt?.label || v;
      });
    };

    return (
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {question.title || "Question"}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </legend>
        {question.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            {question.description}
          </p>
        )}
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full min-h-[42px] rounded-lg border border-gray-200 dark:border-[#3d3d3d] bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 px-3 py-2 text-sm text-left flex items-center justify-between gap-2"
          >
            <div className="flex-1 flex flex-wrap gap-1">
              {selectedArr.length === 0 ? (
                <span className="text-gray-400">Select options...</span>
              ) : (
                getSelectedLabels().map((label, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded text-xs"
                  >
                    {label}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-emerald-900 dark:hover:text-emerald-100"
                      onClick={(e) => removeOption(selectedArr[idx], e)}
                    />
                  </span>
                ))
              )}
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`} />
          </button>
          
          {isOpen && (
            <div 
              className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 dark:border-[#3d3d3d] bg-white dark:bg-[#1a1a1a] shadow-lg"
              style={{ maxHeight: "240px", overflowY: "auto" }}
            >
              {options.map((opt) => {
                const v = opt.value ?? opt.label;
                const isSelected = selectedArr.includes(String(v));
                return (
                  <div
                    key={opt.option_id}
                    onClick={() => toggleOption(String(v))}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-[#222] cursor-pointer"
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-gray-400 bg-transparent"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" strokeWidth={3} />}
                    </div>
                    <span className="text-sm text-gray-800 dark:text-gray-200">
                      {opt.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </fieldset>
    );
  }

  if (type === "boolean") {
    const boolOpts = question.boolean || {
      true_label: "Yes",
      false_label: "No",
    };
    return (
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {question.title || "Question"}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </legend>
        {question.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            {question.description}
          </p>
        )}
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer group">
            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors flex-shrink-0 ${value === true || value === "true"
                ? "border-emerald-500 bg-emerald-500 text-white"
                : "border-gray-400 bg-transparent group-hover:border-gray-500"
                }`}
            >
              {(value === true || value === "true") && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
            </div>
            <input
              type="radio"
              name={question.question_id}
              checked={value === true || value === "true"}
              onChange={() => onChange(true)}
              className="sr-only"
            />
            <span className="text-sm text-gray-800 dark:text-gray-200">
              {boolOpts.true_label}
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer group">
            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors flex-shrink-0 ${value === false || value === "false"
                ? "border-emerald-500 bg-emerald-500 text-white"
                : "border-gray-400 bg-transparent group-hover:border-gray-500"
                }`}
            >
              {(value === false || value === "false") && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
            </div>
            <input
              type="radio"
              name={question.question_id}
              checked={value === false || value === "false"}
              onChange={() => onChange(false)}
              className="sr-only"
            />
            <span className="text-sm text-gray-800 dark:text-gray-200">
              {boolOpts.false_label}
            </span>
          </label>
        </div>
      </fieldset>
    );
  }

  if (type === "rating_scale") {
    const rs = question.rating_scale || { min_value: 1, max_value: 10 };
    const min = rs.min_value ?? 1;
    const max = rs.max_value ?? 10;
    const num =
      typeof value === "number"
        ? value
        : value !== undefined
          ? Number(value)
          : undefined;
    return (
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {question.title || "Question"}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </legend>
        {question.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            {question.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {rs.min_label && (
            <span className="text-xs text-gray-500">{rs.min_label}</span>
          )}
          {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((n) => {
            const selected = num === n;
            return (
              <label key={n} className="flex items-center gap-1 cursor-pointer group">
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors flex-shrink-0 ${selected
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-gray-400 bg-transparent group-hover:border-gray-500"
                    }`}
                >
                  {selected && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                </div>
                <input
                  type="radio"
                  name={question.question_id}
                  checked={selected}
                  onChange={() => onChange(n)}
                  className="sr-only"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {n}
                </span>
              </label>
            );
          })}
          {rs.max_label && (
            <span className="text-xs text-gray-500">{rs.max_label}</span>
          )}
        </div>
      </fieldset>
    );
  }

  if (type === "star_rating") {
    const maxStars = question.star_rating?.max_stars ?? 5;
    const num =
      typeof value === "number"
        ? value
        : value !== undefined
          ? Number(value)
          : 0;
    return (
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {question.title || "Question"}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </legend>
        {question.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            {question.description}
          </p>
        )}
        <div className="flex gap-1">
          {Array.from({ length: maxStars }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className="text-2xl text-gray-300 hover:text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 rounded p-0.5"
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
            >
              {n <= num ? "★" : "☆"}
            </button>
          ))}
        </div>
      </fieldset>
    );
  }

  if (type === "image_selection" && options.length > 0) {
    return (
      <fieldset className="space-y-4 min-w-0 overflow-hidden">
        <legend className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {question.title || "Question"}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </legend>
        {question.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            {question.description}
          </p>
        )}
        <div 
          className="w-full overflow-x-auto overflow-y-hidden pb-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
          style={{ 
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'thin',
            overscrollBehaviorX: 'contain',
            overscrollBehaviorY: 'none'
          }}
        >
          <div className="flex gap-3 sm:gap-4 w-max px-1"
            style={{ paddingRight: '16px' }}
          >
            {options.map((opt) => {
              const v = opt.value ?? opt.label;
              const selected = String(value) === String(v);
              return (
                <label
                  key={opt.option_id}
                  className="flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px] flex flex-col items-center cursor-pointer group"
                >
                  {/* Card box */}
                  <div className="w-full border border-gray-300 dark:border-[#444] bg-white dark:bg-[#1a1a1a] flex flex-col rounded-sm overflow-hidden">
                    {/* Image area */}
                    <div className="relative w-full h-[140px] sm:h-[160px] md:h-[180px] bg-gray-50 dark:bg-[#222] flex items-center justify-center overflow-hidden">
                      {opt.image_url ? (
                        <img
                          src={opt.image_url}
                          alt={opt.image_label || opt.label}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl sm:text-3xl text-gray-300 dark:text-gray-600">
                          🖼
                        </span>
                      )}

                      {/* Magnifying glass triangle top-right */}
                      <div
                        className="absolute top-0 right-0 w-8 sm:w-10 h-8 sm:h-10 bg-black/50 overflow-hidden"
                        style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }}
                      >
                        <ZoomIn className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-3 sm:w-3.5 h-3 sm:h-3.5 text-white" />
                      </div>
                    </div>

                    {/* Radio button area inside card */}
                    <div className="border-t border-gray-300 dark:border-[#444] p-2 sm:p-3 flex justify-center bg-white dark:bg-[#1a1a1a]">
                      <div
                        className={`w-4 sm:w-5 h-4 sm:h-5 rounded-full border flex items-center justify-center transition-colors ${selected
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-gray-400 bg-transparent group-hover:border-gray-500"
                          }`}
                      >
                        {selected && <Check className="w-3 sm:w-3.5 h-3 sm:h-3.5" strokeWidth={3} />}
                      </div>
                      <input
                        type="radio"
                        name={question.question_id}
                        value={v}
                        checked={selected}
                        onChange={() => onChange(v)}
                        className="sr-only"
                        tabIndex={-1}
                      />
                    </div>
                  </div>

                  {/* Label text outside card */}
                  <span className="mt-2 sm:mt-3 text-xs sm:text-sm text-center text-gray-800 dark:text-gray-200 break-words line-clamp-2 px-1 w-full">
                    {opt.image_label || opt.label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      </fieldset>
    );
  }

  if (type === "ranking" && options.length > 0) {
    const rankValue = (value as string[] | undefined) || [];
    return (
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {question.title || "Question"}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </legend>
        {question.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            {question.description}
          </p>
        )}
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          Select in order of preference (first selected = rank 1).
        </p>
        <div className="space-y-2">
          {options.map((opt) => {
            const v = opt.value ?? opt.label;
            const idx = rankValue.indexOf(String(v));
            const position = idx >= 0 ? idx + 1 : null;
            return (
              <div
                key={opt.option_id}
                className="flex items-center gap-3 p-2 rounded border border-gray-200 dark:border-[#3d3d3d]"
              >
                <span className="text-sm font-medium text-gray-500 w-6">
                  {position != null ? `#${position}` : "—"}
                </span>
                <span className="flex-1 text-sm text-gray-800 dark:text-gray-200">
                  {opt.label}
                </span>
                <select
                  value={position ?? ""}
                  onChange={(e) => {
                    const pos = e.target.value ? Number(e.target.value) : null;
                    const next = rankValue.filter((x) => x !== String(v));
                    if (pos != null && pos >= 1 && pos <= options.length) {
                      next.splice(pos - 1, 0, String(v));
                    }
                    onChange(next, false);
                  }}
                  className="rounded border border-gray-200 dark:border-[#3d3d3d] bg-white dark:bg-[#1a1a1a] text-sm px-2 py-1"
                >
                  <option value="">—</option>
                  {options.map((_, i) => (
                    <option key={i} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      </fieldset>
    );
  }

  if (type === "slider") {
    const sl = question.slider || { min_value: 0, max_value: 100, step: 1 };
    const min = sl.min_value ?? 0;
    const max = sl.max_value ?? 100;
    const step = sl.step ?? 1;
    const numVal =
      typeof value === "number"
        ? value
        : value !== undefined
          ? Number(value)
          : Math.round((max + min) / 2);

    return (
      <fieldset className="space-y-4 pt-2">
        <legend className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {question.title || "Question"}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </legend>
        {question.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            {question.description}
          </p>
        )}
        <div className="px-1">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={numVal}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-red-600"
          />
          <div className="flex justify-between items-center text-xs text-gray-500 mt-3 font-medium">
            <span>{sl.min_label || min}</span>
            <span className="text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-[#3d3d3d] px-2.5 py-1 rounded shadow-sm border border-gray-200 dark:border-[#4d4d4d]">
              {value !== undefined ? numVal : "—"}
            </span>
            <span>{sl.max_label || max}</span>
          </div>
        </div>
      </fieldset>
    );
  }

  // Fallback: text or unsupported type
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-gray-900 dark:text-gray-100">
        {question.title || "Question"}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </legend>
      {question.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          {question.description}
        </p>
      )}
      {question.text?.multiline ? (
        <textarea
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.text?.placeholder || "Your answer"}
          maxLength={question.text?.max_length}
          rows={3}
          className="w-full rounded-lg border border-gray-200 dark:border-[#3d3d3d] bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:ring-2 focus:ring-red-400 outline-none"
        />
      ) : (
        <input
          type={question.text?.input_type || "text"}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.text?.placeholder || "Your answer"}
          maxLength={question.text?.max_length}
          className="w-full rounded-lg border border-gray-200 dark:border-[#3d3d3d] bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:ring-2 focus:ring-red-400 outline-none"
        />
      )}
      {question.text?.max_length && (
        <div className="flex justify-end">
          <span className="text-[10px] text-gray-400">
            {String(value || "").length} / {question.text.max_length}
          </span>
        </div>
      )}
    </fieldset>
  );
}

export default function SurveyIdRoute() {
  return <PublicSurveyPage />;
}
