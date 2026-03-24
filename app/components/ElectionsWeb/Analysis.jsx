import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams, useParams } from "@remix-run/react";
import {
  ArrowLeft,
  CalendarDays,
  Loader2,
  RefreshCcw,
  ChevronDown,
  MessageCircle,
  CheckCheck,
  CheckCircle2,
  Send,
  Reply,
  MousePointer,
  AlertTriangle,
  Copy,
  File,
  Download,
  Hexagon,
  Users,
  Phone
} from "lucide-react";
import { getCampaignAnalyticsDetailed, getCampaignLogs, getCampaignById } from "~/api";
import Segento from "~/components/ElectionsWeb/Segento";
import jsPDF from "jspdf";
import { message } from "antd";

export default function CampaignAnalysis() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const campaignId = searchParams.get("campaignId");

  const [period, setPeriod] = useState("day");
  const [activeTab, setActiveTab] = useState("channel");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const pickerRef = useRef(null);
  const [showLogsDatePicker, setShowLogsDatePicker] = useState(false);
  const logsPickerRef = useRef(null);
  const today = useMemo(() => new Date(), []);
  const getDateString = (date) => date.toISOString().slice(0, 10);
  const [dateRange, setDateRange] = useState(() => {
    const end = today;
    const start = new Date(end);
    start.setDate(start.getDate() - 29);
    return {
      from: getDateString(start),
      to: getDateString(end),
      label: "Last 30 days"
    };
  });
  const [pendingRange, setPendingRange] = useState(() => ({
    from: dateRange.from,
    to: dateRange.to,
    label: dateRange.label
  }));
  const [activePreset, setActivePreset] = useState("custom");
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState(null);
  const [logsData, setLogsData] = useState({
    logs: [],
    total: 0,
    page: 1,
    pageSize: 50
  });
  const [logsPage, setLogsPage] = useState(1);
  const [logsPageSize, setLogsPageSize] = useState(10);
  const [logsStatus, setLogsStatus] = useState("");
  const [logsDateRange, setLogsDateRange] = useState(() => {
    const end = today;
    const start = new Date(end);
    start.setDate(start.getDate() - 29);
    return {
      from: getDateString(start),
      to: getDateString(end),
      label: "Last 30 days"
    };
  });
  const [logsPendingRange, setLogsPendingRange] = useState(() => ({
    from: logsDateRange.from,
    to: logsDateRange.to,
    label: logsDateRange.label
  }));
  const [logsActivePreset, setLogsActivePreset] = useState("custom");
  const [exportingPdf, setExportingPdf] = useState(false);
  const [campaignDetails, setCampaignDetails] = useState(null);

  const renderTabButtons = (className = "") => {
    const baseWrapper =
      "inline-flex items-center rounded-full px-1 py-1 bg-gray-100 dark:bg-[#111111] border border-gray-200 dark:border-[#3d3d3d]";

    const baseTab =
      "px-4 py-1.5 text-sm font-medium rounded-full transition-colors whitespace-nowrap";

    const activeTabClasses = "bg-white text-black shadow-sm dark:bg-[#3a3a3a] dark:text-white";
    const inactiveTabClasses =
      "bg-transparent text-gray-600 dark:text-[#a0a0a0] hover:bg-white/60 hover:text-black dark:hover:bg-[#2a2a2a] dark:hover:text-white";

    return (
      <div className={`${baseWrapper} ${className}`}>
        <button
          onClick={() => setActiveTab("channel")}
          className={`${baseTab} ${activeTab === "channel" ? activeTabClasses : inactiveTabClasses
            }`}
        >
          Channel Analytics
        </button>
        <button
          onClick={() => setActiveTab("user")}
          className={`${baseTab} ${activeTab === "user" ? activeTabClasses : inactiveTabClasses}`}
        >
          User Analytics
        </button>
        <button
          onClick={() => setActiveTab("contacts")}
          className={`${baseTab} ${activeTab === "contacts" ? activeTabClasses : inactiveTabClasses
            }`}
        >
          All Contacts
        </button>
      </div>
    );
  };

  const fetchAnalytics = async () => {
    if (!campaignId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getCampaignAnalyticsDetailed(campaignId, {
        period,
        fromDate: dateRange.from,
        toDate: dateRange.to
      });
      if (response?.success) {
        setAnalytics(response.data || {});

      } else {
        setError("Unable to fetch analytics for this campaign.");
      }
    } catch (err) {
      console.error("Failed to load campaign analytics:", err);
      const message =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load campaign analytics.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [campaignId, period, dateRange.from, dateRange.to]);

  useEffect(() => {
    if (!showDatePicker) return;
    const handleOutsideClick = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [showDatePicker]);

  useEffect(() => {
    if (!showLogsDatePicker) return;
    const handleOutsideClick = (event) => {
      if (logsPickerRef.current && !logsPickerRef.current.contains(event.target)) {
        setShowLogsDatePicker(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [showLogsDatePicker]);

  const totals = useMemo(() => analytics?.totals ?? {}, [analytics]);
  const statusCounts = totals?.total_status_counts ?? {};
  const formatRangeLabel = (range = dateRange) => {
    const formatDate = (value) => {
      if (!value) return "";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return value;
      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "2-digit"
      });
    };
    return `${formatDate(range.from)} - ${formatDate(range.to)}`;
  };

  const formatOrdinal = (day) => {
    const remainder = day % 10;
    const remainderHundred = day % 100;
    if (remainder === 1 && remainderHundred !== 11) return `${day}st`;
    if (remainder === 2 && remainderHundred !== 12) return `${day}nd`;
    if (remainder === 3 && remainderHundred !== 13) return `${day}rd`;
    return `${day}th`;
  };

  const formatFancyRange = (range = dateRange) => {
    const parse = (value) => {
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? null : d;
    };
    const fromDate = parse(range.from);
    const toDate = parse(range.to);
    if (!fromDate || !toDate) return formatRangeLabel(range);
    const format = (d) => {
      return `${formatOrdinal(d.getDate())} ${d.toLocaleDateString("en-IN", {
        month: "short",
        year: "2-digit"
      })}`;
    };
    return `${format(fromDate)} - ${format(toDate)}`;
  };

  const calculatePreset = (preset) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const startOfMonth = new Date(year, month, 1);

    if (preset === "this_month") {
      return {
        from: getDateString(startOfMonth),
        to: getDateString(now),
        label: "This Month"
      };
    }

    if (preset === "last_month") {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      return {
        from: getDateString(start),
        to: getDateString(end),
        label: "Last Month"
      };
    }

    if (preset === "this_quarter") {
      const quarter = Math.floor(month / 3);
      const start = new Date(year, quarter * 3, 1);
      return {
        from: getDateString(start),
        to: getDateString(now),
        label: "This Quarter to Date"
      };
    }

    if (preset === "last_quarter") {
      const quarter = Math.floor(month / 3) - 1;
      const quarterYear = quarter < 0 ? year - 1 : year;
      const quarterMonth = quarter < 0 ? (quarter + 4) * 3 : quarter * 3;
      const start = new Date(quarterYear, quarterMonth, 1);
      const end = new Date(quarterYear, quarterMonth + 3, 0);
      return {
        from: getDateString(start),
        to: getDateString(end),
        label: "Last Quarter"
      };
    }

    return { ...pendingRange };
  };

  const calculateLogsPreset = (preset) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const startOfMonth = new Date(year, month, 1);

    if (preset === "this_month") {
      return {
        from: getDateString(startOfMonth),
        to: getDateString(now),
        label: "This Month"
      };
    }

    if (preset === "last_month") {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      return {
        from: getDateString(start),
        to: getDateString(end),
        label: "Last Month"
      };
    }

    if (preset === "this_quarter") {
      const quarter = Math.floor(month / 3);
      const start = new Date(year, quarter * 3, 1);
      return {
        from: getDateString(start),
        to: getDateString(now),
        label: "This Quarter to Date"
      };
    }

    if (preset === "last_quarter") {
      const quarter = Math.floor(month / 3) - 1;
      const quarterYear = quarter < 0 ? year - 1 : year;
      const quarterMonth = quarter < 0 ? (quarter + 4) * 3 : quarter * 3;
      const start = new Date(quarterYear, quarterMonth, 1);
      const end = new Date(quarterYear, quarterMonth + 3, 0);
      return {
        from: getDateString(start),
        to: getDateString(end),
        label: "Last Quarter"
      };
    }

    return { ...logsPendingRange };
  };

  const summaryItems = useMemo(() => {
    return [
      {
        label: "Total",
        value: totals?.total_sent ?? 0,
        percentage: null,
        icon: MessageCircle,
        color: "text-emerald-600",
        bg: "bg-emerald-50"
      },
      {
        label: "Read",
        value: totals?.total_read ?? 0,
        percentage: analytics?.read_rate_percentage ?? 0,
        icon: CheckCheck,
        color: "text-blue-600",
        bg: "bg-blue-50"
      },
      {
        label: "Delivered",
        value: totals?.total_delivered ?? 0,
        percentage: analytics?.delivery_rate_percentage ?? 0,
        icon: CheckCircle2,
        color: "text-green-600",
        bg: "bg-green-50"
      },
      {
        label: "Sent",
        value: statusCounts?.sent ?? 0,
        percentage: totals?.total_sent
          ? ((statusCounts?.sent ?? 0) / totals.total_sent) * 100
          : 0,
        icon: Send,
        color: "text-orange-600",
        bg: "bg-orange-50"
      },
      {
        label: "Replied",
        value: analytics?.totals?.total_status_counts?.replied ?? 0,
        percentage: totals?.total_sent
          ? ((analytics?.totals?.total_status_counts?.replied ?? 0) /
            (totals?.total_sent ?? 1)) *
          100
          : 0,
        icon: Reply,
        color: "text-cyan-600",
        bg: "bg-cyan-50"
      },
      {
        label: "Failed",
        value: statusCounts?.failed ?? 0,
        percentage: analytics?.failure_rate_percentage ?? 0,
        icon: AlertTriangle,
        color: "text-red-600",
        bg: "bg-red-50"
      },
      {
        label: "Clicked",
        value: 0,
        percentage: 0,
        icon: MousePointer,
        color: "text-teal-600",
        bg: "bg-teal-50"
      },
      {
        label: "Duplicate",
        value: totals?.total_duplicates ?? 0,
        percentage: null,
        icon: Copy,
        color: "text-gray-600",
        bg: "bg-gray-100"
      },
      {
        label: "Cost (₹)",
        value: totals?.total_cost_inr ?? 0,
        percentage: null,
        icon: Hexagon,
        color: "text-purple-600",
        bg: "bg-purple-50",
        displayValue:
          totals?.total_cost_inr != null
            ? `₹ ${(Number(totals.total_cost_inr) || 0).toFixed(2)}`
            : "—"
      }
    ];
  }, [totals, analytics, statusCounts]);

  const fetchLogs = async () => {
    if (!campaignId) return;
    setLogsLoading(true);
    setLogsError(null);
    try {
      const response = await getCampaignLogs(campaignId, {
        page: logsPage,
        pageSize: logsPageSize,
        status: logsStatus || undefined,
        fromDate: logsDateRange.from || undefined,
        toDate: logsDateRange.to || undefined
      });
      if (response) {
        setLogsData({
          logs: response.logs || [],
          total: response.total || 0,
          page: response.page || logsPage,
          pageSize: response.page_size || logsPageSize
        });
      } else {
        setLogsData({
          logs: [] || [],
          total: 0 || 0,
          page: logsPage || 1,
          pageSize: logsPageSize || 50
        });
      }
    } catch (err) {
      console.error("Failed to load campaign logs:", err);
      const message =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load campaign logs.";
      setLogsError(message);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "user" && campaignId) {
      fetchLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, campaignId, logsPage, logsPageSize, logsStatus, logsDateRange.from, logsDateRange.to]);

  useEffect(() => {
    const fetchCampaignDetails = async () => {
      if (campaignId) {
        try {
          const details = await getCampaignById(campaignId);
          setCampaignDetails(details || {});
        } catch (err) {
          console.error("Failed to fetch campaign details:", err);
        }
      }
    };
    fetchCampaignDetails();
  }, [campaignId]);

  const handleExportLogs = async () => {
    if (!analytics || !campaignDetails) {
      message.warning("Analytics data not available. Please wait for data to load.");
      return;
    }

    setExportingPdf(true);
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Helper function to add a new page if needed
      const checkNewPage = (requiredHeight) => {
        if (yPosition + requiredHeight > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }
      };

      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text("Campaign Analytics Report", pageWidth / 2, yPosition, { align: "center" });

      const textWidth = pdf.getTextWidth("Campaign Analytics Report");
      const textX = (pageWidth - textWidth) / 2;
      pdf.line(textX, yPosition + 1, textX + textWidth, yPosition + 1);

      yPosition += 10;

      // Campaign Name (left) with Date Range (right)
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text(`Campaign: ${campaignDetails?.campaign_name || "N/A"}`, 20, yPosition);

      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      const dateRangeText = `Date Range: ${formatRangeLabel()}`;
      pdf.text(dateRangeText, pageWidth - 20, yPosition, { align: "right" });
      yPosition += 7;

      // Campaign ID/Slug right below the name
      if (campaignDetails?.campaign_slug) {
        pdf.text(`Campaign Slug: ${campaignDetails.campaign_slug}`, 20, yPosition);
        yPosition += 8;
      }
      yPosition += 6;

      // Summary Section
      checkNewPage(30);
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("Summary Statistics", 20, yPosition);
      yPosition += 8;

      // Summary Items Table
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");

      // Table dimensions
      const tableStartX = 20;
      const tableWidth = pageWidth - 40;
      const tableStartY = yPosition;
      const rowHeight = 12; // Increased from 8 to 12 for more vertical spacing
      const col1X = 25; // Metric column - increased padding from 22
      const col2X = 110; // Value column - increased padding and width for better spacing
      const col3X = 160; // Percentage column - increased padding from 150
      const verticalPadding = 2; // Additional vertical padding

      // Draw outer table border for header
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.5);
      pdf.rect(tableStartX, tableStartY - 5, tableWidth, rowHeight, "S");

      // Table Header
      pdf.setFillColor(240, 240, 240);
      pdf.rect(tableStartX, tableStartY - 5, tableWidth, rowHeight, "F");

      // Draw vertical lines for header
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.5);
      pdf.line(col2X - 8, tableStartY - 5, col2X - 8, tableStartY + rowHeight - 5); // Between Metric and Value
      pdf.line(col3X - 8, tableStartY - 5, col3X - 8, tableStartY + rowHeight - 5); // Between Value and Percentage

      // Center text vertically in header
      const headerTextY = tableStartY + verticalPadding;
      pdf.text("Metric", col1X, headerTextY);
      pdf.text("Value", col2X, headerTextY);
      pdf.text("Percentage", col3X, headerTextY);

      // Draw line below header
      pdf.line(tableStartX, tableStartY + rowHeight - 5, tableStartX + tableWidth, tableStartY + rowHeight - 5);

      yPosition = tableStartY + rowHeight;

      pdf.setFont("helvetica", "normal");

      const pdfSummaryItems = summaryItems.filter((item) => item.label !== "Cost (₹)");
      pdfSummaryItems.forEach((item) => {
        checkNewPage(rowHeight + 2);
        const value = item.displayValue ?? (typeof item.value === "number" ? item.value.toLocaleString() : item.value);
        const percentage = item.percentage !== null && !Number.isNaN(item.percentage)
          ? `${item.percentage.toFixed(1)}%`
          : "—";

        // Draw vertical lines for columns
        pdf.setDrawColor(0, 0, 0);
        pdf.setLineWidth(0.5);
        pdf.line(col2X - 8, yPosition - 5, col2X - 8, yPosition + rowHeight - 5); // Between Metric and Value
        pdf.line(col3X - 8, yPosition - 5, col3X - 8, yPosition + rowHeight - 5); // Between Value and Percentage

        // Draw horizontal line below row
        pdf.line(tableStartX, yPosition + rowHeight - 5, tableStartX + tableWidth, yPosition + rowHeight - 5);

        // Draw left and right borders for this row
        pdf.line(tableStartX, yPosition - 5, tableStartX, yPosition + rowHeight - 5); // Left border
        pdf.line(tableStartX + tableWidth, yPosition - 5, tableStartX + tableWidth, yPosition + rowHeight - 5); // Right border

        // Center text vertically in row with padding
        const rowTextY = yPosition + verticalPadding;
        pdf.text(item.label, col1X, rowTextY);

        // Ensure value text doesn't wrap - convert to string and handle properly
        const valueText = String(value);
        // Use splitTextToSize to prevent unwanted wrapping, but keep it on one line
        const maxWidth = col3X - col2X - 15; // Available width for value column with extra padding
        const splitText = pdf.splitTextToSize(valueText, maxWidth);
        // Only use first line to prevent wrapping
        pdf.text(splitText[0] || valueText, col2X, rowTextY);

        pdf.text(percentage, col3X, rowTextY);

        yPosition += rowHeight;
      });

      // Total Campaign Revenue card beneath the table
      const totalAmountValue = totals?.total_cost_inr ?? 0;
      const revenueCardHeight = 32;
      checkNewPage(revenueCardHeight + 12);
      yPosition += 10;
      const cardX = 20;
      const cardWidth = pageWidth - 40;
      pdf.setFillColor(34, 197, 94);
      pdf.setDrawColor(34, 197, 94);
      pdf.rect(cardX, yPosition, cardWidth, revenueCardHeight, "F");
      pdf.setTextColor(255, 255, 255);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text("Total Campaign Revenue", cardX + cardWidth / 2, yPosition + 12, { align: "center" });

      pdf.setFontSize(18);
      const formattedAmount = `${(Number(totalAmountValue) || 0).toFixed(4)}`;
      pdf.text(formattedAmount, cardX + cardWidth / 2, yPosition + 22, { align: "center" });

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.text("Total Amount (INR)", cardX + cardWidth / 2, yPosition + 28, { align: "center" });

      pdf.setTextColor(0, 0, 0);
      yPosition += revenueCardHeight + 10;

      // Footer
      const totalPages = pdf.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "italic");
        pdf.text(
          `Generated on ${new Date().toLocaleString("en-IN")} | Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
      }

      // Save PDF
      const fileName = `Campaign_Analytics_${campaignDetails?.campaign_name || campaignId}_${dateRange.from}_${dateRange.to}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error("Failed to export PDF:", err);
      message.error("Failed to export PDF: " + (err?.message || "Unknown error"));
    } finally {
      setExportingPdf(false);
    }
  };

  const formatDateTime = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };

  const statusPillStyles = {
    sent: "bg-blue-100 text-blue-700",
    delivered: "bg-green-100 text-green-700",
    read: "bg-emerald-100 text-emerald-700",
    failed: "bg-red-100 text-red-700",
    pending: "bg-yellow-100 text-yellow-700"
  };

  if (!campaignId) {
    return (
      <div className="w-full p-6 bg-white dark:bg-[#262626] min-h-screen">
        <div className="p-4 bg-amber-50 border border-amber-200 rounded text-sm text-amber-700">
          Select a campaign from the list to view analytics.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-6 space-y-6 bg-white dark:bg-[#262626] min-h-screen text-gray-900 dark:text-[#ececf1]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-[#3d3d3d] rounded-lg text-sm font-medium text-gray-700 dark:text-[#d1d5db] hover:bg-gray-100 dark:hover:bg-[#353535]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

        </div>
        <div className="flex items-center gap-3">
          {activeTab === "channel" && (
            <>

              <button
                onClick={fetchAnalytics}
                className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-[#3d3d3d] rounded-lg text-sm font-medium text-gray-700 dark:text-[#d1d5db] hover:bg-gray-100 dark:hover:bg-[#353535]"
              >
                <RefreshCcw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={handleExportLogs}
                disabled={exportingPdf || !analytics || !campaignDetails}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium disabled:opacity-50 transition-colors bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 shadow-sm"
              >
                {exportingPdf ? (
                  <>
                    <Loader2 className="w-10 h-10 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <File className="w-4 h-4" />
                    Export Logs
                  </>
                )}
              </button>
              <div className="relative" ref={pickerRef}>
                <button
                  onClick={() => setShowDatePicker((prev) => !prev)}
                  className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-[#3d3d3d] rounded-lg text-sm font-medium text-gray-700 dark:text-[#d1d5db] hover:bg-gray-100 dark:hover:bg-[#353535]"
                >
                  <CalendarDays className="w-4 h-4" />
                  <span className="hidden sm:block">{formatFancyRange()}</span>
                  <span className="sm:hidden">{formatRangeLabel()}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showDatePicker && (
                  <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-sm shadow-[0_8px_30px_rgb(0,0,0,0.12)] z-20 overflow-hidden">
                    <div className="grid grid-cols-[140px_1fr]">
                      <div className="border-r border-gray-200 dark:border-[#333] bg-gray-50/50 dark:bg-[#111]">
                        {[
                          { key: "this_month", label: "This Month" },
                          { key: "last_month", label: "Last Month" },
                          { key: "this_quarter", label: "This Quarter to Date" },
                          { key: "last_quarter", label: "Last Quarter" }
                        ].map((option) => (
                          <button
                            key={option.key}
                            className={`w-full text-left px-4 py-2 text-sm ${activePreset === option.key
                              ? "bg-white dark:bg-[#2d2d2d] text-blue-600 font-semibold"
                              : "text-gray-600 dark:text-[#8e8ea0] hover:bg-white dark:hover:bg-[#353535]"
                              }`}
                            onClick={() => {
                              const computed = calculatePreset(option.key);
                              setPendingRange(computed);
                              setActivePreset(option.key);
                            }}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                      <div className="p-4 space-y-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-[#8e8ea0] uppercase mb-1">
                            From
                          </label>
                          <input
                            type="date"
                            value={pendingRange.from}
                            onChange={(e) => {
                              setPendingRange((prev) => ({
                                ...prev,
                                from: e.target.value
                              }));
                              setActivePreset("custom");
                            }}
                            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                            To
                          </label>
                          <input
                            type="date"
                            value={pendingRange.to}
                            onChange={(e) => {
                              setPendingRange((prev) => ({
                                ...prev,
                                to: e.target.value
                              }));
                              setActivePreset("custom");
                            }}
                            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-2">
                          <button
                            onClick={() => {
                              setPendingRange({
                                from: dateRange.from,
                                to: dateRange.to,
                                label: dateRange.label
                              });
                              setShowDatePicker(false);
                            }}
                            className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 rounded-md"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              if (!pendingRange.from || !pendingRange.to) {
                                message.warning("Please select both From and To dates.");
                                return;
                              }
                              const fromDate = new Date(pendingRange.from);
                              const toDate = new Date(pendingRange.to);
                              if (fromDate > toDate) {
                                message.warning("From date cannot be after To date.");
                                return;
                              }
                              const appliedLabel =
                                activePreset === "custom"
                                  ? `${pendingRange.from} - ${pendingRange.to}`
                                  : pendingRange.label;
                              setDateRange({
                                from: pendingRange.from,
                                to: pendingRange.to,
                                label: appliedLabel
                              });
                              setPendingRange((prev) => ({
                                ...prev,
                                label: appliedLabel
                              }));
                              setShowDatePicker(false);
                            }}
                            className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          {activeTab === "user" && (
            <div className="flex items-center gap-3">
              <div className="relative" ref={logsPickerRef}>
                <button
                  onClick={() => setShowLogsDatePicker((prev) => !prev)}
                  className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  <CalendarDays className="w-4 h-4" />
                  <span className="hidden sm:block">{formatFancyRange(logsDateRange)}</span>
                  <span className="sm:hidden">{formatRangeLabel(logsDateRange)}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showLogsDatePicker && (
                  <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-sm shadow-[0_8px_30px_rgb(0,0,0,0.12)] z-20 overflow-hidden">
                    <div className="grid grid-cols-[140px_1fr]">
                      <div className="border-r border-gray-200 dark:border-[#333] bg-gray-50/50 dark:bg-[#111]">
                        {[
                          { key: "this_month", label: "This Month" },
                          { key: "last_month", label: "Last Month" },
                          { key: "this_quarter", label: "This Quarter to Date" },
                          { key: "last_quarter", label: "Last Quarter" }
                        ].map((option) => (
                          <button
                            key={option.key}
                            className={`w-full text-left px-4 py-2 text-sm ${logsActivePreset === option.key
                              ? "bg-white text-blue-600 font-semibold"
                              : "text-gray-600 hover:bg-white"
                              }`}
                            onClick={() => {
                              const computed = calculateLogsPreset(option.key);
                              setLogsPendingRange(computed);
                              setLogsActivePreset(option.key);
                            }}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                      <div className="p-4 space-y-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                            From
                          </label>
                          <input
                            type="date"
                            value={logsPendingRange.from}
                            onChange={(e) => {
                              setLogsPendingRange((prev) => ({
                                ...prev,
                                from: e.target.value
                              }));
                              setLogsActivePreset("custom");
                            }}
                            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                            To
                          </label>
                          <input
                            type="date"
                            value={logsPendingRange.to}
                            onChange={(e) => {
                              setLogsPendingRange((prev) => ({
                                ...prev,
                                to: e.target.value
                              }));
                              setLogsActivePreset("custom");
                            }}
                            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-2">
                          <button
                            onClick={() => {
                              setLogsPendingRange({
                                from: logsDateRange.from,
                                to: logsDateRange.to,
                                label: logsDateRange.label
                              });
                              setShowLogsDatePicker(false);
                            }}
                            className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 rounded-md"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              if (!logsPendingRange.from || !logsPendingRange.to) {
                                message.warning("Please select both From and To dates.");
                                return;
                              }
                              const fromDate = new Date(logsPendingRange.from);
                              const toDate = new Date(logsPendingRange.to);
                              if (fromDate > toDate) {
                                message.warning("From date cannot be after To date.");
                                return;
                              }
                              const appliedLabel =
                                logsActivePreset === "custom"
                                  ? `${logsPendingRange.from} - ${logsPendingRange.to}`
                                  : logsPendingRange.label;
                              setLogsDateRange({
                                from: logsPendingRange.from,
                                to: logsPendingRange.to,
                                label: appliedLabel
                              });
                              setLogsPendingRange((prev) => ({
                                ...prev,
                                label: appliedLabel
                              }));
                              setShowLogsDatePicker(false);
                              setLogsPage(1);
                            }}
                            className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {activeTab === "channel" ? (
        <>
          <div>{renderTabButtons("flex items-center gap-2")}</div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-10 h-10 animate-spin text-[#2162B0]" />
            </div>
          ) : analytics ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {summaryItems.map((item) => {
                  const Icon = item.icon;
                  const percentage =
                    item.percentage === null || Number.isNaN(item.percentage)
                      ? null
                      : item.percentage;
                  return (
                    <div
                      key={item.label}
                      className="rounded-sm border border-gray-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a] p-4 shadow-sm hover:border-gray-300 dark:hover:border-[#444] hover:shadow-[0_2px_10px_rgb(0,0,0,0.06)] transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-[#8e8ea0]">
                          {item.label}
                        </span>
                        <span className={`inline-flex items-center justify-center w-9 h-9 rounded-full ${item.bg}`}>
                          <Icon className={`w-4 h-4 ${item.color}`} />
                        </span>
                      </div>
                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-900 dark:text-[#ececf1]">
                          {item.displayValue ??
                            (typeof item.value === "number"
                              ? item.value.toLocaleString()
                              : item.value)}
                        </span>
                        {percentage !== null && (
                          <span className="text-sm font-medium text-gray-500 dark:text-[#8e8ea0]">
                            {percentage.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </>
          ) : (
            <div className="p-6 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-sm text-sm text-gray-600 dark:text-gray-400">
              No analytics data available.
            </div>
          )}
        </>
      ) : activeTab === "user" ? (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {renderTabButtons("flex items-center gap-2")}
            <div className="flex flex-wrap gap-3">
              <select
                value={logsStatus}
                onChange={(e) => {
                  setLogsStatus(e.target.value);
                  setLogsPage(1);
                }}
                className="px-3 py-2 border border-gray-300 dark:border-[#3d3d3d] rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-[#ececf1]"
              >
                <option value="">All Statuses</option>
                <option value="sent">Sent</option>
                <option value="delivered">Delivered</option>
                <option value="read">Read</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
              </select>
              <select
                value={logsPageSize}
                onChange={(e) => {
                  setLogsPageSize(Number(e.target.value));
                  setLogsPage(1);
                }}
                className="px-3 py-2 border border-gray-300 dark:border-[#3d3d3d] rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-[#ececf1]"
              >
                {[10, 25, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size} per page
                  </option>
                ))}
              </select>
            </div>
          </div>

          {logsError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {logsError}
            </div>
          )}

          <div className="rounded-sm border border-gray-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a] shadow-[0_2px_10px_rgb(0,0,0,0.06)]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#2a2a2a]">
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-[#ececf1]">Delivery Logs</h3>
                <p className="text-xs text-gray-500 dark:text-[#8e8ea0]">
                  Showing {logsData.logs.length} of {logsData.total} logs
                </p>
              </div>
              <button
                onClick={fetchLogs}
                className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-[#3d3d3d] rounded-lg text-sm font-medium text-gray-700 dark:text-[#d1d5db] hover:bg-gray-100 dark:hover:bg-[#353535]"
              >
                <RefreshCcw className="w-4 h-4" />
                Refresh
              </button>
            </div>
            {logsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-10 h-10 animate-spin text-[#2162B0]" />
              </div>
            ) : logsData.logs.length === 0 ? (
              <div className="p-6 text-sm text-gray-500 dark:text-[#8e8ea0]">No logs found for this campaign.</div>
            ) : (
              <div className="overflow-x-auto overflow-y-auto max-h-[50vh] sm:max-h-[60vh] md:max-h-[calc(100vh-350px)]">
                <table className="min-w-full divide-y divide-gray-100 dark:divide-[#2a2a2a] text-sm border-collapse">
                  <thead className="bg-gray-50/50 dark:bg-[#222] sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-[#8e8ea0] uppercase tracking-wider">
                        Recipient
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-[#8e8ea0] uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-[#8e8ea0] uppercase tracking-wider">
                        Sent At
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-[#8e8ea0] uppercase tracking-wider">
                        Delivered / Read
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-[#8e8ea0] uppercase tracking-wider">
                        Failed At
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-[#8e8ea0] uppercase tracking-wider">
                        Cost (₹)
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-[#8e8ea0] uppercase tracking-wider">
                        Error Message
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-[#8e8ea0] uppercase tracking-wider">
                        Request ID
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-[#1a1a1a] divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                    {logsData.logs.map((log) => (
                      <tr key={log.log_id}>
                        <td className="px-6 py-3 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900 dark:text-[#ececf1]">{log.recipient}</span>
                            <span className="text-xs text-gray-500 dark:text-[#8e8ea0]">
                              {log.recipient_name || "—"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${statusPillStyles[log.status] || "bg-gray-100 text-gray-600"
                              }`}
                          >
                            {log.status?.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          {formatDateTime(log.sent_at)}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-gray-500 dark:text-[#8e8ea0]">
                              Delivered: {formatDateTime(log.delivered_at)}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-[#8e8ea0]">
                              Read: {formatDateTime(log.read_at)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          {formatDateTime(log.failed_at)}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          {log.cost_inr != null ? `₹ ${Number(log.cost_inr).toFixed(4)}` : "—"}
                        </td>
                        <td className="px-6 py-3 max-w-xs">
                          <div className="max-h-16 overflow-y-auto overflow-x-hidden">
                            <span className="text-xs text-gray-600 dark:text-[#d1d5db] break-words">
                              {log.error_message || "—"}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-3 whitespace-nowrap">
                          <span className="text-xs text-gray-500 dark:text-[#8e8ea0] break-all">
                            {log.msg91_request_id || "—"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 dark:border-[#2a2a2a] text-sm text-gray-600 dark:text-[#8e8ea0]">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700 dark:text-[#d1d5db]">
                  Showing {(logsPage - 1) * logsPageSize + 1} to {Math.min(logsPage * logsPageSize, logsData.total)} of {logsData.total} logs
                </span>
                <span className="text-xs text-gray-500 dark:text-[#8e8ea0]">
                  Page {logsPage} of {Math.max(1, Math.ceil(logsData.total / logsPageSize))}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLogsPage((prev) => Math.max(1, prev - 1))}
                  disabled={logsPage <= 1 || logsLoading}
                  className="px-3 py-1.5 border border-gray-300 dark:border-[#3d3d3d] rounded-lg disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-[#353535] text-sm font-medium text-gray-700 dark:text-[#d1d5db]"
                >
                  Previous
                </button>
                <span className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-[#d1d5db]">
                  {logsPage}
                </span>
                <button
                  onClick={() =>
                    setLogsPage((prev) =>
                      prev >= Math.ceil(logsData.total / logsPageSize) ? prev : prev + 1
                    )
                  }
                  disabled={
                    logsPage >= Math.ceil(logsData.total / logsPageSize) || logsLoading
                  }
                  className="px-3 py-1.5 border border-gray-300 dark:border-[#3d3d3d] rounded-lg disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-[#353535] text-sm font-medium text-gray-700 dark:text-[#d1d5db]"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div>{renderTabButtons("flex items-center gap-2")}</div>
          {/* All Contacts view using Segento (campaignId from search params) */}
          <Segento />
        </div>
      )}
    </div>
  );
}