import { useState, useEffect } from "react";
import { useOutletContext } from "@remix-run/react";
import { message } from "antd";
import { getMyTasks, updateTaskStatus, updateTask, getOrganizationAgents } from "~/api";
import { List, Loader2, Pencil, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

const STATUSES = ["todo", "in_progress", "review", "done", "cancelled"];
const STATUS_LABELS = { todo: "To do", in_progress: "In progress", review: "Review", done: "Done", cancelled: "Cancelled" };
const PRIORITIES = ["low", "medium", "high", "urgent"];

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

export default function MyTasks() {
  const context = typeof useOutletContext === "function" ? useOutletContext() : {};
  const darkMode = context?.darkMode ?? false;

  const [tasks, setTasks] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [editingTask, setEditingTask] = useState(null);

  const userData = typeof localStorage !== "undefined" ? JSON.parse(localStorage.getItem("user_info") || "{}") : {};
  const orgId = userData?.organization_id || userData?.org_id;

  const fetchTasks = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getMyTasks({
        status: statusFilter || undefined,
        include_created_by_me: false,
        limit: 50,
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
  }, [statusFilter]);

  const handleStatusChange = async (taskId, newStatus) => {
    setUpdatingId(taskId);
    try {
      await updateTaskStatus(taskId, newStatus);
      message.success("Status updated");
      fetchTasks();
    } catch (err) {
      message.error(err?.response?.data?.detail || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="h-[calc(100vh-49px)] flex flex-col bg-white dark:bg-[#111]">
      {/* Top bar */}
      <div className="flex-shrink-0 bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-[#333] px-4 py-3">
        <h1 className="text-sm font-semibold text-gray-900 dark:text-white">My Tasks</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Tasks assigned to you by others
        </p>
      </div>

      {/* Filters */}
      <div className="flex-shrink-0 px-4 py-3 flex flex-wrap items-center gap-4 border-b border-gray-100 dark:border-[#2a2a2a]">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 dark:border-[#333] rounded-md px-3 py-2 text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-[#111] focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <span className="text-xs text-gray-400">{total} tasks</span>
      </div>

      {/* Content */}
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
            <List className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No tasks assigned to you.</p>
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
                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">Update status</th>
                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-[#333]">
                  {tasks.map((t) => (
                    <tr key={t.task_id} className="hover:bg-gray-50 dark:hover:bg-[#222] transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{t.title}</div>
                        {t.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{t.description}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${STATUS_COLORS[t.status] || "bg-gray-100 dark:bg-[#333] text-gray-700 dark:text-gray-300"}`}>
                          {STATUS_LABELS[t.status] ?? t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 capitalize">{t.priority || "medium"}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">
                        {t.due_date ? new Date(t.due_date).toLocaleDateString(undefined, { dateStyle: "short" }) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={t.status}
                          onChange={(e) => handleStatusChange(t.task_id, e.target.value)}
                          disabled={updatingId === t.task_id}
                          className="border border-gray-200 dark:border-[#333] rounded-md px-2 py-1.5 text-xs text-gray-800 dark:text-gray-200 bg-white dark:bg-[#111] focus:outline-none focus:border-gray-400 dark:focus:border-gray-500"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                          ))}
                        </select>
                        {updatingId === t.task_id && (
                          <Loader2 className="w-3 h-3 animate-spin inline-block ml-1 text-gray-400" />
                        )}
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
