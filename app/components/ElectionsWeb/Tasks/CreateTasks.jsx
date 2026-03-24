import { useState, useEffect } from "react";
import { useOutletContext } from "@remix-run/react";
import { message } from "antd";
import { createTask, listTasks, getOrganizationAgents, updateTask } from "~/api";
import { Plus, X, Loader2, Pencil } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

const PRIORITIES = ["low", "medium", "high", "urgent"];
const STATUS_LABELS = { todo: "To do", in_progress: "In progress", review: "Review", done: "Done", cancelled: "Cancelled" };

const STATUS_COLORS = {
  todo: "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200",
  in_progress: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  review: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
  done: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  cancelled: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
};

const inputClass =
  "w-full border border-gray-200 dark:border-[#333] rounded-md px-3 py-2 text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-[#111] placeholder-gray-400 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors";
const labelClass = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5";

// ─── Create Task Modal ─────────────────────────────────────────────────────────
function CreateTaskModal({ onClose, onSuccess, orgId }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    due_date: "",
    assigned_to_user_id: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [agents, setAgents] = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    setAgentsLoading(true);
    getOrganizationAgents(orgId)
      .then((res) => {
        const list = res?.data?.agents;
        setAgents(Array.isArray(list) ? list : []);
      })
      .catch(() => setAgents([]))
      .finally(() => setAgentsLoading(false));
  }, [orgId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      if (!orgId) {
        setError("Organization not found. You must belong to an organization.");
        setSubmitting(false);
        return;
      }
      const payload = {
        organization_id: orgId,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        priority: form.priority,
        due_date: form.due_date ? new Date(form.due_date).toISOString() : undefined,
        assigned_to_user_id: form.assigned_to_user_id?.trim() || undefined,
      };
      const res = await createTask(payload);
      if (res?.success && res?.data) {
        message.success(res.message || "Task created successfully");
        setForm({ title: "", description: "", priority: "medium", due_date: "", assigned_to_user_id: "" });
        onSuccess?.();
        onClose();
      } else {
        setError(res?.message || "Task created but no data returned.");
      }
    } catch (err) {
      const detail = err?.response?.data?.detail || err?.message || "Failed to create task.";
      setError(Array.isArray(detail) ? detail.map((d) => d.msg || d).join(", ") : detail);
      message.error("Failed to create task");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/50" onClick={onClose} />
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
        <div
          className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-sm shadow-xl w-full max-w-lg max-h-[88vh] flex flex-col overflow-hidden"
          style={{ animation: "fadeUp 0.18s ease-out" }}
          onClick={(e) => e.stopPropagation()}
        >
          <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>

          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#2a2a2a]">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Create Task</h2>
              <p className="text-xs text-gray-400 mt-0.5">Add a new task for your organization</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            <div>
              <label className={labelClass}>Title <span className="text-red-500">*</span></label>
              <input
                required
                maxLength={200}
                className={inputClass}
                placeholder="Task title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelClass}>Description <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea
                className={inputClass + " min-h-[80px] resize-y"}
                placeholder="Optional description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelClass}>Priority</label>
              <select
                className={inputClass}
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Due date <span className="text-gray-400 font-normal">(optional)</span></label>
              <input
                type="datetime-local"
                className={inputClass}
                value={form.due_date}
                onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelClass}>Assign to <span className="text-gray-400 font-normal">(optional)</span></label>
              <Select
                value={form.assigned_to_user_id || "__unassigned__"}
                onValueChange={(v) => setForm((f) => ({ ...f, assigned_to_user_id: v === "__unassigned__" ? "" : v }))}
                disabled={agentsLoading}
              >
                <SelectTrigger
                  className="w-full border border-gray-200 dark:border-[#333] rounded-md px-3 py-2 text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-[#111] focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 h-auto min-h-[2.25rem]"
                >
                  <SelectValue placeholder={agentsLoading ? "Loading…" : "Unassigned"} />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] shadow-lg z-[200]">
                  <SelectItem value="__unassigned__" className="text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] focus:bg-gray-100 dark:focus:bg-[#2a2a2a]">
                    <span className="text-sm">Unassigned</span>
                  </SelectItem>
                  {agents.map((agent) => (
                    <SelectItem
                      key={agent.user_id}
                      value={agent.user_id}
                      className="text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] focus:bg-gray-100 dark:focus:bg-[#2a2a2a]"
                    >
                      <span className="block">
                        <span className="font-medium text-gray-900 dark:text-white">{agent.name || "Unknown"}</span>
                        {agent.email && (
                          <span className="block text-xs text-gray-500 dark:text-gray-400 font-normal mt-0.5">{agent.email}</span>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-md hover:bg-gray-700 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {submitting ? "Creating…" : "Create Task"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

// ─── Edit Task Modal ─────────────────────────────────────────────────────────
function EditTaskModal({ task, onClose, onSuccess, orgId }) {
  const formatDateForInput = (isoDate) => {
    if (!isoDate) return "";
    const d = new Date(isoDate);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [form, setForm] = useState({
    title: task?.title || "",
    description: task?.description || "",
    priority: task?.priority || "medium",
    due_date: formatDateForInput(task?.due_date),
    status: task?.status || "todo",
    assigned_to_user_id: task?.assigned_to_user_id || "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [agents, setAgents] = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    setAgentsLoading(true);
    getOrganizationAgents(orgId)
      .then((res) => {
        const list = res?.data?.agents;
        setAgents(Array.isArray(list) ? list : []);
      })
      .catch(() => setAgents([]))
      .finally(() => setAgentsLoading(false));
  }, [orgId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        priority: form.priority,
        due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
        status: form.status,
        assigned_to_user_id: form.assigned_to_user_id?.trim() || null,
      };
      const res = await updateTask(task.task_id, payload);
      if (res?.success) {
        message.success(res.message || "Task updated successfully");
        onSuccess?.();
        onClose();
      } else {
        setError(res?.message || "Failed to update task.");
      }
    } catch (err) {
      const detail = err?.response?.data?.detail || err?.message || "Failed to update task.";
      setError(Array.isArray(detail) ? detail.map((d) => d.msg || d).join(", ") : detail);
      message.error("Failed to update task");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/50" onClick={onClose} />
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
        <div
          className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-sm shadow-xl w-full max-w-lg max-h-[88vh] flex flex-col overflow-hidden"
          style={{ animation: "fadeUp 0.18s ease-out" }}
          onClick={(e) => e.stopPropagation()}
        >
          <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>

          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#2a2a2a]">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Edit Task</h2>
              <p className="text-xs text-gray-400 mt-0.5">Update task details</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            <div>
              <label className={labelClass}>Title <span className="text-red-500">*</span></label>
              <input
                required
                maxLength={200}
                className={inputClass}
                placeholder="Task title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelClass}>Description <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea
                className={inputClass + " min-h-[80px] resize-y"}
                placeholder="Optional description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Priority</label>
                <select
                  className={inputClass}
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Status</label>
                <select
                  className={inputClass}
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                >
                  {Object.entries(STATUS_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Due date <span className="text-gray-400 font-normal">(optional)</span></label>
              <input
                type="datetime-local"
                className={inputClass}
                value={form.due_date}
                onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelClass}>Assign to <span className="text-gray-400 font-normal">(optional)</span></label>
              <Select
                value={form.assigned_to_user_id || "__unassigned__"}
                onValueChange={(v) => setForm((f) => ({ ...f, assigned_to_user_id: v === "__unassigned__" ? "" : v }))}
                disabled={agentsLoading}
              >
                <SelectTrigger
                  className="w-full border border-gray-200 dark:border-[#333] rounded-md px-3 py-2 text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-[#111] focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 h-auto min-h-[2.25rem]"
                >
                  <SelectValue placeholder={agentsLoading ? "Loading…" : "Unassigned"} />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] shadow-lg z-[200]">
                  <SelectItem value="__unassigned__" className="text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] focus:bg-gray-100 dark:focus:bg-[#2a2a2a]">
                    <span className="text-sm">Unassigned</span>
                  </SelectItem>
                  {agents.map((agent) => (
                    <SelectItem
                      key={agent.user_id}
                      value={agent.user_id}
                      className="text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] focus:bg-gray-100 dark:focus:bg-[#2a2a2a]"
                    >
                      <span className="block">
                        <span className="font-medium text-gray-900 dark:text-white">{agent.name || "Unknown"}</span>
                        {agent.email && (
                          <span className="block text-xs text-gray-500 dark:text-gray-400 font-normal mt-0.5">{agent.email}</span>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-md hover:bg-gray-700 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default function CreateTasks() {
  const context = typeof useOutletContext === "function" ? useOutletContext() : {};
  const darkMode = context?.darkMode ?? false;

  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const userData = typeof localStorage !== "undefined" ? JSON.parse(localStorage.getItem("user_info") || "{}") : {};
  const orgId = userData?.organization_id || userData?.org_id;
  const currentUserId = userData?.user_id;

  const fetchTasks = async () => {
    if (!orgId) {
      setError("Organization not found.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await listTasks({
        organization_id: orgId,
        created_by_user_id: currentUserId,
        status: statusFilter || undefined,
        limit: 100,
        offset: 0,
      });
      const data = res?.data;
      setTasks(Array.isArray(data?.tasks) ? data.tasks : []);
      setTotal(data?.total ?? 0);
    } catch (err) {
      const detail = err?.response?.data?.detail || err?.message || "Failed to load tasks.";
      setError(Array.isArray(detail) ? detail.join(", ") : detail);
      setTasks([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [orgId, statusFilter, currentUserId]);

  return (
    <div className="h-[calc(100vh-49px)] flex flex-col bg-white dark:bg-[#111]">
      {/* Top bar */}
      <div className="flex-shrink-0 bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-[#333] px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold text-gray-900 dark:text-white">Create Tasks</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Tasks created by you</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-md hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex-shrink-0 px-4 py-3 flex items-center gap-3 border-b border-gray-100 dark:border-[#2a2a2a]">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Filter by status</span>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 dark:border-[#333] rounded-md px-3 py-2 text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-[#111] focus:outline-none focus:border-gray-400 dark:focus:border-gray-500"
        >
          <option value="">All</option>
          {Object.entries(STATUS_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <span className="text-xs text-gray-400">{total} tasks</span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {error && (
          <div className="mx-4 mt-3 p-3 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center min-h-[280px]">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[280px] text-center px-6">
            <p className="text-sm text-gray-400 max-w-sm mb-4">No tasks created by you yet. Click "Create Task" to add one.</p>
          </div>
        ) : (
          <div className="px-4 py-4">
            <div className="border border-gray-200 dark:border-[#333] rounded-md overflow-hidden bg-white dark:bg-[#1a1a1a]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-[#333] bg-gray-50 dark:bg-[#222]">
                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">Title</th>
                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">Priority</th>
                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">Due date</th>
                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">Created</th>
                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-[#333]">
                  {tasks.map((t) => (
                    <tr key={t.task_id} className="hover:bg-gray-50 dark:hover:bg-[#222] transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{t.title}</div>
                        {t.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{t.description}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${STATUS_COLORS[t.status] || "bg-gray-100 dark:bg-[#333] text-gray-700 dark:text-gray-300"}`}>
                          {STATUS_LABELS[t.status] ?? t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 capitalize">{t.priority || "medium"}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {t.due_date ? new Date(t.due_date).toLocaleDateString(undefined, { dateStyle: "short" }) : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                        {t.created_at ? new Date(t.created_at).toLocaleDateString(undefined, { dateStyle: "short" }) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setEditingTask(t)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#333] transition-colors"
                          title="Edit task"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <CreateTaskModal
          onClose={() => setShowModal(false)}
          onSuccess={() => fetchTasks()}
          orgId={orgId}
        />
      )}

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSuccess={() => fetchTasks()}
          orgId={orgId}
        />
      )}
    </div>
  );
}
