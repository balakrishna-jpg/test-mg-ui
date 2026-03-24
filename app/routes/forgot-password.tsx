// app/routes/forgot-password.tsx
import { useState } from "react";
import { Link } from "@remix-run/react";
import { forgotPassword } from "~/api";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";

const labelCls =
  "block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wide";
const inputCls =
  "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/40 transition-all text-sm";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (!email.trim()) {
      setError("Please enter your email address.");
      setSubmitting(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      setSubmitting(false);
      return;
    }

    try {
      const response = await forgotPassword({ email });

      if (response.success) {
        setSuccess(true);
      } else {
        setError(response.message || "Failed to send reset link.");
      }
    } catch {
      setSuccess(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-950 font-sans">
      <div className="flex-1 flex flex-col items-center justify-center relative px-6 py-12 lg:px-12">
        {/* Back link */}
        <div className="absolute top-6 left-6 lg:top-10 lg:left-10 z-20">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 p-2.5 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all text-sm w-fit"
          >
            <ArrowLeft size={15} />
            Back to login
          </Link>
        </div>

        {/* Gradient backdrops - match Login */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-violet-700/10 to-gray-950 pointer-events-none" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-violet-600/10 rounded-full blur-3xl translate-x-1/4 translate-y-1/4 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-white mb-1.5">
              Forgot password
            </h1>
            <p className="text-sm text-white/60">
              Enter your email and we'll send you a link to reset your password.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
              <span className="text-red-400 text-base mt-0.5">⚠</span>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className={labelCls}>
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className={inputCls}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <svg
                      className="animate-spin w-4 h-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Sending...</span>
                  </>
                ) : (
                  <span>Send reset link</span>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="p-3.5 bg-green-500/10 border border-green-500/30 rounded-xl flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-green-300 text-sm font-semibold mb-1">
                    Check your email
                  </p>
                  <p className="text-green-300/90 text-sm">
                    We've sent a password reset link to{" "}
                    <span className="text-white font-medium">{email}</span>. If
                    you don't see it, check spam or try again.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSuccess(false);
                    setEmail("");
                    setError(null);
                  }}
                  className="text-sm text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                >
                  Try again with another email
                </button>
                <Link
                  to="/login"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-blue-500/20"
                >
                  Back to login
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
