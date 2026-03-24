// app/components/ElectionsWeb/Survey/SurveyResponses.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "@remix-run/react";
import {
  ArrowLeft,
  Loader2,
  Inbox,
  X,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  listMargadarshSurveyResponses,
  getMargadarshSurveyResponse,
  deleteMargadarshSurveyResponse,
  getMargadarshSurveySummary,
  updateMargadarshSurvey,
} from "~/api";
import { message } from "antd";
import { Pencil } from "lucide-react";
import dayjs from "dayjs";

const STATUS_COLORS = {
  completed: "bg-green-100 text-green-700",
  partial: "bg-yellow-100 text-yellow-700",
  disqualified: "bg-red-100 text-red-700",
  spam: "bg-gray-100 text-gray-600",
  deleted: "bg-gray-100 text-gray-400",
};

const SUB_TABS = [
  { label: "Summary", section: "survey-summary" },
  { label: "Builder", section: "survey-builder" },
  { label: "Responses", section: "survey-responses" },
  { label: "Audit Logs", section: "survey-audit" },
  { label: "Launch", section: "survey-launch" },
  { label: "Reports", section: "survey-reports" },
];

export default function SurveyResponses() {
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const surveyId = searchParams.get("surveyId");

  const [surveyName, setSurveyName] = useState("");
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total_responses: 0,
    page_size: 50,
    page_number: 1,
    page_count: 1,
    range_label: "0-0",
    has_next: false,
    has_prev: false,
  });
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeView, setActiveView] = useState(null);

  // Detail drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerData, setDrawerData] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");

  const handleNameSave = async () => {
    if (!editNameValue.trim() || editNameValue.trim() === surveyName) {
      setIsEditingName(false);
      return;
    }
    try {
      await updateMargadarshSurvey(surveyId, { survey_name: editNameValue.trim() });
      setIsEditingName(false);
      setSurveyName(editNameValue.trim());
      message.success("Survey name updated");
    } catch {
      message.error("Failed to update survey name");
    }
  };

  const fetchResponses = useCallback(async () => {
    if (!surveyId) return;
    setLoading(true);
    try {
      const params = {
        page,
        page_size: pageSize,
        ...(statusFilter !== "all" && { response_status: statusFilter }),
      };
      const res = await listMargadarshSurveyResponses(surveyId, params);
      if (res?.success) {
        const data = res.data || {};
        setColumns(data.columns || []);
        setRows(data.rows || data.responses || []);
        const pag = data.pagination || {
          total_responses: 0,
          page_size: pageSize,
          page_number: page,
          page_count: 1,
          range_label: "0-0",
          has_next: false,
          has_prev: false,
        };
        setPagination(pag);
        if (pag.page_number != null) setPage(pag.page_number);
        if (data.active_view) setActiveView(data.active_view);
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to load responses");
    } finally {
      setLoading(false);
    }
  }, [surveyId, page, statusFilter]);

  useEffect(() => {
    fetchResponses();
  }, [fetchResponses]);

  useEffect(() => {
    if (!surveyId) return;
    getMargadarshSurveySummary(surveyId)
      .then((res) => {
        if (res?.success) setSurveyName(res.data?.survey_name || "");
      })
      .catch(() => { });
  }, [surveyId]);

  const openDrawer = async (row) => {
    setDrawerOpen(true);
    setDrawerLoading(true);
    try {
      const res = await getMargadarshSurveyResponse(
        surveyId,
        row.response_id || row.id
      );
      if (res?.success) setDrawerData(res.data);
    } catch (err) {
      message.error("Failed to load response detail");
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteMargadarshSurveyResponse(
        surveyId,
        deleteTarget.response_id || deleteTarget.id
      );
      message.success("Response deleted");
      setDeleteTarget(null);
      fetchResponses();
    } catch (err) {
      message.error("Failed to delete response");
    } finally {
      setDeleting(false);
    }
  };

  // Columns from API: use visible_columns order if present, else all non-hidden
  const visibleColumnIds =
    activeView?.visible_columns ||
    columns.filter((c) => !c.hidden).map((c) => c.column_id);
  const tableColumns = visibleColumnIds?.length
    ? visibleColumnIds
      .map((id) => columns.find((c) => c.column_id === id))
      .filter(Boolean)
    : columns.length > 0
      ? columns.filter((c) => !c.hidden)
      : [
        {
          column_id: "response_id",
          title: "Response ID",
          column_type: "system",
        },
        {
          column_id: "response_status",
          title: "Status",
          column_type: "system",
        },
        {
          column_id: "submitted_at",
          title: "Submitted At",
          column_type: "system",
        },
      ];

  const getCellValue = (row, col) => {
    const id = col.column_id;
    if (col.column_type === "question") {
      const ans = row.answers?.[id];
      if (ans == null) return "—";
      if (typeof ans === "object" && !Array.isArray(ans)) {
        return ans.image_label || ans.label || ans.value || String(ans);
      }
      if (Array.isArray(ans)) {
        return ans
          .map((a) =>
            typeof a === "object"
              ? a.image_label || a.label || a.value || String(a)
              : String(a)
          )
          .join(", ");
      }
      return String(ans);
    }
    const val = row[id];
    if (val == null) return "—";
    return val;
  };

  const totalResponses = pagination.total_responses ?? 0;

  return (
    <div className="min-h-[calc(100vh-49px)] flex flex-col bg-white dark:bg-[#111111]">
      {/* Top nav */}
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
                  setEditNameValue(surveyName || "");
                }
              }}
              className="text-sm font-medium text-gray-900 dark:text-white bg-transparent border-b border-gray-400 focus:outline-none focus:border-blue-500 w-full"
            />
          </div>
        ) : (
          <div
            className="flex items-center gap-2 mr-auto cursor-pointer group"
            onClick={() => {
              setEditNameValue(surveyName || "");
              setIsEditingName(true);
            }}
          >
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-xs">
              {surveyName || "Survey"}
            </span>
            <Pencil className="w-3.5 h-3.5 text-gray-400 transition-opacity" />
          </div>
        )}

        {/* Sub-nav tabs */}
        <div className="flex items-center h-full">
          {SUB_TABS.map((tab) => {
            const isActive = tab.section === "survey-responses";
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

      {/* Filters bar */}
      <div className="bg-white dark:bg-[#1a1a1a] border-b border-gray-100 dark:border-[#2a2a2a] px-6 py-3 flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Default View
        </span>
        <div className="flex-1" />
        <Filter className="w-4 h-4 text-gray-400" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-[#1a1a1a]">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="disqualified">Disqualified</SelectItem>
            <SelectItem value="spam">Spam</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#111111]">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Inbox className="w-12 h-12 mb-4 opacity-40" />
            <p className="text-base font-medium">No responses yet</p>
            <p className="text-sm mt-1">
              Publish your survey to start collecting responses
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-gray-100 dark:border-[#2a2a2a]">
                <TableHead className="text-gray-600 dark:text-gray-400 text-xs w-10">
                  #
                </TableHead>
                {tableColumns.map((col) => (
                  <TableHead
                    key={col.column_id}
                    className="text-gray-600 dark:text-gray-400 text-xs whitespace-nowrap max-w-[220px] truncate"
                    title={col.title}
                  >
                    {col.title}
                  </TableHead>
                ))}
                <TableHead className="text-gray-600 dark:text-gray-400 text-xs w-24">
                  Notes
                </TableHead>
                <TableHead className="text-right text-gray-600 dark:text-gray-400 text-xs w-16">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, idx) => (
                <TableRow
                  key={row.response_id || row.id || idx}
                  className="border-gray-50 dark:border-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] cursor-pointer"
                  onClick={() => openDrawer(row)}
                >
                  <TableCell className="text-gray-500 dark:text-gray-400 text-xs font-medium">
                    {idx + 1}
                  </TableCell>
                  {tableColumns.map((col) => {
                    const val = getCellValue(row, col);
                    const rawVal =
                      col.column_type === "question"
                        ? row.answers?.[col.column_id] ?? row[col.column_id]
                        : row[col.column_id];
                    if (col.column_id === "response_status") {
                      return (
                        <TableCell key={col.column_id}>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[rawVal] || STATUS_COLORS.partial
                              }`}
                          >
                            {rawVal || "—"}
                          </span>
                        </TableCell>
                      );
                    }
                    if (col.column_id === "submitted_at") {
                      return (
                        <TableCell
                          key={col.column_id}
                          className="text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap"
                        >
                          {rawVal
                            ? dayjs(rawVal).format("MMM DD, YYYY HH:mm:ss")
                            : "—"}
                        </TableCell>
                      );
                    }
                    if (col.column_id === "response_id") {
                      const shortId =
                        rawVal && typeof rawVal === "string"
                          ? rawVal.slice(-8)
                          : rawVal;
                      return (
                        <TableCell
                          key={col.column_id}
                          className="text-gray-700 dark:text-gray-300 text-xs font-mono"
                        >
                          {shortId ?? "—"}
                        </TableCell>
                      );
                    }
                    if (col.column_type === "question" && rawVal != null) {
                      const isObj =
                        typeof rawVal === "object" &&
                        !Array.isArray(rawVal) &&
                        rawVal.image_url;
                      const isArrObj =
                        Array.isArray(rawVal) &&
                        rawVal.length > 0 &&
                        typeof rawVal[0] === "object" &&
                        rawVal[0].image_url;

                      if (isObj || isArrObj) {
                        const items = isArrObj ? rawVal : [rawVal];
                        return (
                          <TableCell
                            key={col.column_id}
                            className="text-gray-700 dark:text-gray-300 text-sm max-w-[250px]"
                          >
                            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                              {items.map((item, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-1.5 shrink-0 bg-gray-50 dark:bg-[#222] rounded pr-2 border border-gray-100 dark:border-[#333]"
                                >
                                  {item.image_url && (
                                    <img
                                      src={item.image_url}
                                      alt={
                                        item.image_label ||
                                        item.label ||
                                        item.value ||
                                        "Selection"
                                      }
                                      className="w-6 h-6 rounded-l object-cover border-r border-gray-100 dark:border-[#333]"
                                    />
                                  )}
                                  <span className="text-xs truncate max-w-[100px]">
                                    {item.image_label ||
                                      item.label ||
                                      item.value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                        );
                      }
                    }

                    return (
                      <TableCell
                        key={col.column_id}
                        className="text-gray-700 dark:text-gray-300 text-sm max-w-[200px] truncate"
                        title={typeof val === "string" ? val : undefined}
                      >
                        {val}
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-gray-500 dark:text-gray-400 text-sm max-w-[120px] truncate">
                    {row.notes ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(row);
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {!loading && rows.length > 0 && (
        <div className="border-t border-gray-200 dark:border-[#3d3d3d] px-6 py-3 flex items-center justify-between bg-white dark:bg-[#1a1a1a]">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Total Responses: {totalResponses}
          </span>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {pagination.page_size ?? pageSize} Responses Per Page
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setPage(1)}
                disabled={!pagination.has_prev}
              >
                <ChevronsLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!pagination.has_prev}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs text-gray-600 dark:text-gray-300 px-2 min-w-[3rem] text-center">
                {pagination.range_label ||
                  `${(page - 1) * (pagination.page_size || pageSize) + 1
                  }-${Math.min(
                    page * (pagination.page_size || pageSize),
                    totalResponses
                  )}`}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setPage((p) => p + 1)}
                disabled={!pagination.has_next}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setPage(pagination.page_count || 1)}
                disabled={!pagination.has_next}
              >
                <ChevronsRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setDrawerOpen(false)}
          />
          <div
            className="fixed right-0 top-0 z-50 h-full w-full max-w-lg bg-white dark:bg-[#1a1a1a] shadow-2xl flex flex-col"
            style={{ animation: "slideInRight 0.2s ease-out" }}
          >
            <style>{`@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-[#3d3d3d]">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                Response Detail
              </h3>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {drawerLoading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : drawerData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 dark:bg-[#2a2a2a] rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-1">Respondent</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">
                        {drawerData.respondent_name || "Anonymous"}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-[#2a2a2a] rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-1">Status</p>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[drawerData.response_status] ||
                          STATUS_COLORS.partial
                          }`}
                      >
                        {drawerData.response_status || "partial"}
                      </span>
                    </div>
                    <div className="bg-gray-50 dark:bg-[#2a2a2a] rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-1">Started</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {drawerData.started_at
                          ? dayjs(drawerData.started_at).format("MMM DD, HH:mm")
                          : "—"}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-[#2a2a2a] rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-1">Submitted</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {drawerData.submitted_at
                          ? dayjs(drawerData.submitted_at).format(
                            "MMM DD, HH:mm"
                          )
                          : "—"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                      Answers
                    </p>
                    <div className="space-y-3">
                      {Object.entries(drawerData.answers || {}).map(
                        ([qId, answer]) => {
                          const qCol = columns.find((c) => c.column_id === qId);
                          const qTitle = qCol
                            ? qCol.title
                            : `Question ${qId.slice(-6)}`;

                          // If answer is an enriched image_selection object:
                          const isObj =
                            answer &&
                            typeof answer === "object" &&
                            !Array.isArray(answer);
                          const imgUrl = isObj ? answer.image_url : null;
                          const answerText = isObj
                            ? answer.image_label || answer.label || answer.value
                            : Array.isArray(answer)
                              ? answer.join(", ")
                              : String(answer);

                          return (
                            <div
                              key={qId}
                              className="bg-gray-50 dark:bg-[#2a2a2a] rounded-lg p-3"
                            >
                              <p className="text-xs text-gray-400 mb-2">
                                {qTitle}
                              </p>
                              <div className="flex items-center gap-3">
                                {imgUrl && (
                                  <img
                                    src={imgUrl}
                                    alt="Selection"
                                    className="w-12 h-12 rounded object-cover border border-gray-200 dark:border-[#444]"
                                  />
                                )}
                                <p className="text-sm text-gray-800 dark:text-gray-200 font-medium whitespace-pre-wrap leading-relaxed">
                                  {answerText}
                                </p>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-sm text-center mt-10">
                  No data available
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Delete Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Response</DialogTitle>
            <DialogDescription>
              This will permanently delete this response. Are you sure?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
