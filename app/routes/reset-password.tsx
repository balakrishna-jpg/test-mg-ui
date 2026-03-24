// app/routes/reset-password.tsx
import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "@remix-run/react";
import { resetPassword } from "~/api";
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";

const labelCls =
  "block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wide";
const inputCls = (hasError: boolean) =>
  `w-full bg-white/5 border ${hasError ? "border-red-500" : "border-white/10"} rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/40 transition-all text-sm`;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError(
        "Invalid or missing reset token. Please request a new password reset link."
      );
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Invalid reset token");
      return;
    }

    if (!newPassword.trim()) {
      setError("Please enter a new password");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setSubmitting(true);
      const response = await resetPassword({
        token,
        new_password: newPassword,
      });

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        setError(response.message || "Failed to reset password");
      }
    } catch (err: any) {
      console.error("Reset password error:", err);
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          err.message ||
          "Failed to reset password. The link may have expired or already been used."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const sharedLayout = (
    <>
      <div className="absolute top-6 left-6 lg:top-10 lg:left-10 z-20">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 p-2.5 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all text-sm w-fit"
        >
          <ArrowLeft size={15} />
          Back to login
        </Link>
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-violet-700/10 to-gray-950 pointer-events-none" />
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-violet-600/10 rounded-full blur-3xl translate-x-1/4 translate-y-1/4 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
    </>
  );

  if (success) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-950 font-sans">
        <div className="flex-1 flex flex-col items-center justify-center relative px-6 py-12 lg:px-12">
          {sharedLayout}
          <div className="w-full max-w-md relative z-10">
            <div className="p-3.5 bg-green-500/10 border border-green-500/30 rounded-xl flex items-start gap-3 mb-5">
              <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-green-300 text-sm font-semibold mb-1">
                  Password reset successful
                </p>
                <p className="text-green-300/90 text-sm">
                  You can now log in with your new password. Redirecting to login…
                </p>
              </div>
            </div>
            <Link
              to="/login"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-blue-500/20"
            >
              Go to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-950 font-sans">
      <div className="flex-1 flex flex-col items-center justify-center relative px-6 py-12 lg:px-12">
        {sharedLayout}
        <div className="w-full max-w-md relative z-10">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-white mb-1.5">
              Reset password
            </h1>
            <p className="text-sm text-white/60">
              Enter your new password below.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
              <span className="text-red-400 text-base mt-0.5">⚠</span>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {!token ? (
            <div className="space-y-5">
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <p className="text-amber-300 text-sm">
                  Invalid or missing reset token. Request a new link from the
                  forgot password page.
                </p>
              </div>
              <Link
                to="/forgot-password"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-blue-500/20"
              >
                Request new reset link
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="newPassword" className={labelCls}>
                  New password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 characters)"
                    required
                    minLength={6}
                    className={`${inputCls(false)} pl-10 pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className={labelCls}>
                  Confirm new password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    minLength={6}
                    className={`${inputCls(false)} pl-10 pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
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
                    <span>Resetting password…</span>
                  </>
                ) : (
                  <span>Reset password</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
