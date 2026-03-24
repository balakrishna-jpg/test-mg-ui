import * as React from "react";
import { useSearchParams, useNavigate } from "@remix-run/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { CheckCircle2 } from "lucide-react";
import { acceptInvite } from "~/api";

// Safely decode email from JWT payload (client-side only, for display)
function decodeEmailFromToken(jwt: string | null): string | null {
  try {
    if (!jwt) return null;
    if (typeof window === "undefined" || typeof atob === "undefined") return null;

    const payload = jwt.split(".")[1];
    if (!payload) return null;

    // base64url decode
    const json = JSON.parse(
      decodeURIComponent(
        atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      )
    );

    return (json && json.sub) || null; // invited email lives in `sub`
  } catch {
    return null;
  }
}

const AcceptInvitePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Add hydration state to prevent SSR/client mismatch
  const [isHydrated, setIsHydrated] = React.useState(false);

  const token = searchParams.get("token") || "";
  const invitedEmail = React.useMemo(
    () => (isHydrated ? decodeEmailFromToken(token) : null),
    [token, isHydrated]
  );

  const [name, setName] = React.useState("");
  const [age, setAge] = React.useState<string>("");
  const [gender, setGender] = React.useState("male");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [toast, setToast] = React.useState({ visible: false, message: "", type: "" });

  // Handle hydration
  React.useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Toast auto-hide
  React.useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        setToast({ visible: false, message: "", type: "" });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setToast({
        visible: true,
        message: "Missing invite token. Please open the link from your email.",
        type: "error",
      });
      return;
    }
    if (!name || !age || !gender || !password) {
      setToast({ visible: true, message: "Please fill all required fields.", type: "error" });
      return;
    }
    if (password !== confirm) {
      setToast({ visible: true, message: "Passwords do not match.", type: "error" });
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name,
        age: Number(age),
        gender,
        password,
        token,
      };
      const resp = await acceptInvite(payload);
      setToast({
        visible: true,
        message: resp?.msg || "Account created. You can now log in.",
        type: "success",
      });
      navigate("/login");
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.msg ||
        err?.message ||
        "Failed to accept invite";
      setToast({ visible: true, message: detail, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading state during hydration to prevent layout shift
  if (!isHydrated) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-8"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-6 accept-invite-bg">
      <style>{`
        .accept-invite-bg {
          background: linear-gradient(135deg, #002b5b 0%, #e0e7ff 100%);
          background: linear-gradient(135deg, #002b5b 0%, #e0e7ff 100%);
        }
      `}</style>
      {/* Toast Notification */}
      {toast.visible && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 ${
            toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {toast.type === "success" ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-6">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold normal text-green-600 ">MARGADARSH</h1>
          <h1 className="text-xl font-semibold mb-1">Accept Invitation</h1>
          {invitedEmail ? (
            <span className="text-sm text-gray-500">
              You're creating an account for <strong>{invitedEmail}</strong>
            </span>
          ) : (
            <span className="text-sm text-gray-500">
              Complete your details to create your account.
            </span>
          )}
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <span className="block mb-1 text-sm font-medium text-gray-700">Full Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
            />
          </div>

          <div>
            <span className="block mb-1 text-sm font-medium text-gray-700">Age</span>
            <input
              type="number"
              min={18}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Age"
              required
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
            />
          </div>

          <div>
            <span className="block mb-1 text-sm font-medium text-gray-700">Gender</span>
            <div className="relative">
              <Select
                value={gender}
                onValueChange={setGender}
              >
                <SelectTrigger className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-300">
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">▼</span>
            </div>
          </div>

          <div>
            <span className="block mb-1 text-sm font-medium text-gray-700">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              required
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
            />
          </div>

          <div>
            <span className="block mb-1 text-sm font-medium text-gray-700">Confirm Password</span>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter password"
              required
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`w-full px-4 py-2 rounded-lg flex items-center justify-center gap-2 ${
              submitting ? "bg-black cursor-not-allowed" : "bg-black hover:bg-black-700"
            } text-white`}
          >
            {submitting ? (
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                ></path>
              </svg>
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Create Account
          </button>

          {!token && (
            <div className="mt-3 text-center">
              <span className="text-sm text-red-600">
                No token found in URL. Open this page from the invite email link.
              </span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AcceptInvitePage;