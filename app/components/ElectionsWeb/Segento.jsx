import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useParams } from "@remix-run/react";
import {
  ArrowLeft,
  Loader2,
  Rocket,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import {
  getCampaignAudience,
  getCampaignById,
  getCampaignLaunchRequirements,
  sendSelectedCampaign,
  deleteCampaignAudience
} from "~/api";
import { message } from "antd";

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-[#2d2d2d] rounded-lg shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#3d3d3d]">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-[#ececf1]">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-[#ececf1]">
            <span className="text-2xl">&times;</span>
          </button>
        </div>
        <div className="p-6 text-gray-900 dark:text-[#ececf1]">{children}</div>
      </div>
    </div>
  );
};

export default function Segento() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const campaignId = searchParams.get("campaignId");

  const [audience, setAudience] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAudience, setSelectedAudience] = useState(new Set());
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const pageSize = 50;
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [deletingAudience, setDeletingAudience] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Launch modal state
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [launchModalLoading, setLaunchModalLoading] = useState(false);
  const [launchCampaignDetails, setLaunchCampaignDetails] = useState(null);
  const [launchRequirements, setLaunchRequirements] = useState(null);
  const [launchBodyValues, setLaunchBodyValues] = useState({});
  const [launchingCampaign, setLaunchingCampaign] = useState(false);

  const fetchAudience = async () => {
    if (!campaignId) return;
    setLoading(true);
    try {
      const res = await getCampaignAudience(campaignId, {
        page,
        pageSize,
        search: appliedSearch
      });
      setAudience(res.audience || []);
      setTotal(res.total || 0);
      setHasNext(res.has_next || false);
      setHasPrev(res.has_prev || false);
    } catch (err) {
      console.error("Failed to load audience:", err);
      message.error("Failed to load audience: " + (err?.response?.data?.detail || err?.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (campaignId) {
      fetchAudience();
    }
  }, [campaignId, page, appliedSearch]);

  const handleSelectAll = (checked) => {
    if (checked) {
      const allIds = new Set(audience.map((item) => item.mobile_number));
      setSelectedAudience(allIds);
    } else {
      setSelectedAudience(new Set());
    }
  };

  const handleSelectItem = (mobileNumber, checked) => {
    const newSelected = new Set(selectedAudience);
    if (checked) {
      newSelected.add(mobileNumber);
    } else {
      newSelected.delete(mobileNumber);
    }
    setSelectedAudience(newSelected);
  };

  const buildBodyValuesObject = (count, example = {}) => {
    const values = {};
    for (let i = 1; i <= count; i++) {
      const key = `body_${i}`;
      values[key] = example?.[key] || "";
    }
    return values;
  };

  const handleOpenLaunchModal = async () => {
    if (selectedAudience.size === 0) {
      message.warning("Please select at least one audience member");
      return;
    }

    if (!campaignId) {
      message.error("Campaign ID not found");
      return;
    }

    setShowLaunchModal(true);
    setLaunchModalLoading(true);

    try {
      const [requirementsRes, campaignDetails] = await Promise.all([
        getCampaignLaunchRequirements(campaignId),
        getCampaignById(campaignId)
      ]);

      if (requirementsRes) {
        setLaunchRequirements(requirementsRes);
        const requiredCount = requirementsRes?.required_body_params || 0;
        if (requiredCount > 0) {
          setLaunchBodyValues(buildBodyValuesObject(requiredCount, requirementsRes?.example_request));
        }
      }

      setLaunchCampaignDetails(campaignDetails);
    } catch (err) {
      console.error("Failed to prepare launch modal:", err);
      message.error(
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to fetch launch information"
      );
      setShowLaunchModal(false);
    } finally {
      setLaunchModalLoading(false);
    }
  };

  const handleLaunchBodyValueChange = (key, value) => {
    setLaunchBodyValues((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleLaunchCampaign = async () => {
    const campaignId = launchCampaignDetails?._id || launchCampaignDetails?.campaign_id;
    if (!campaignId) {
      message.error("Campaign details missing");
      return;
    }

    if (selectedAudience.size === 0) {
      message.warning("Please select at least one audience member");
      return;
    }

    const requiredCount = launchRequirements?.required_body_params || 0;
    const payload = {
      mobile_numbers: Array.from(selectedAudience)
    };

    // Add body parameters (body_1, body_2, etc.) only if they have values
    for (let i = 1; i <= requiredCount; i++) {
      const key = `body_${i}`;
      const value = (launchBodyValues[key] || "").trim();
      if (!value) {
        message.warning(`Please provide a value for ${key}`);
        return;
      }
      payload[key] = value;
    }

    setLaunchingCampaign(true);
    try {
      await sendSelectedCampaign(campaignId, payload);
      message.success("Campaign messages sent successfully");
      setShowLaunchModal(false);
      setSelectedAudience(new Set());
      fetchAudience();
    } catch (err) {
      console.error("Failed to send campaign:", err);
      const errorDetail = err?.response?.data?.detail;
      const errorMessage = typeof errorDetail === 'object'
        ? errorDetail?.message || JSON.stringify(errorDetail)
        : errorDetail || err?.response?.data?.message || err?.message || "Failed to send campaign";
      message.error(errorMessage);
    } finally {
      setLaunchingCampaign(false);
    }
  };

  const handleOpenDeleteModal = () => {
    if (selectedAudience.size === 0) {
      message.warning("Please select at least one audience member");
      return;
    }
    if (!campaignId) {
      message.error("Campaign ID not found");
      return;
    }
    setShowDeleteModal(true);
  };

  const handleDeleteSelected = async () => {
    setDeletingAudience(true);
    try {
      await deleteCampaignAudience(campaignId, Array.from(selectedAudience));
      message.success("Selected contacts deleted successfully");
      setSelectedAudience(new Set());
      fetchAudience();
      setShowDeleteModal(false);
    } catch (err) {
      console.error("Failed to delete selected audience:", err);
      const detail = err?.response?.data?.detail;
      const errorMessage =
        typeof detail === "object"
          ? detail?.message || JSON.stringify(detail)
          : detail || err?.response?.data?.message || err?.message || "Failed to delete contacts";
      message.error(errorMessage);
    } finally {
      setDeletingAudience(false);
    }
  };



  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return dateStr;

    const dayName = date.toLocaleDateString("en-IN", { weekday: "long" }); // 👈 Get weekday

    const formattedDate = date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    return `${dayName}, ${formattedDate}`; // 👈 Combine both
  };


  const allSelected = audience.length > 0 && audience.every((item) => selectedAudience.has(item.mobile_number));
  const someSelected = selectedAudience.size > 0 && !allSelected;

  if (!campaignId) {
    return (
      <div className="w-full p-6 bg-white dark:bg-[#262626]">
        {/* <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          Campaign ID not found. Please navigate from a campaign.
        </div> */}
        in progress
      </div>
    );
  }

  return (
    <div className="w-full p-6 space-y-6 bg-white dark:bg-[#262626] text-gray-900 dark:text-[#ececf1]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">

          {/* <h1 className="text-2xl font-bold text-gray-900 dark:text-[#ececf1]">Campaign Audience</h1> */}
        </div>
      </div>

      <div className="bg-white dark:bg-[#2d2d2d] border border-gray-200 dark:border-[#3d3d3d] rounded-sm shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-[#3d3d3d] flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="w-full md:w-auto">
            <h3 className="text-base font-semibold text-gray-900 dark:text-[#ececf1]">Contacts ({audience.length})</h3>
          </div>
          {selectedAudience.size > 0 && (
            <div className="flex flex-wrap gap-2 w-full md:w-auto">

              {/* <button
                onClick={handleOpenLaunchModal}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700"
              >
                <Rocket className="w-4 h-4" />
                Launch Campaign ({selectedAudience.size})
              </button> */}

              <button
                onClick={handleOpenDeleteModal}
                disabled={deletingAudience || loading}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-orange-500 text-orange-600 text-sm font-medium rounded-md hover:bg-orange-50 dark:hover:bg-[#3a2a2a] disabled:opacity-50"
              >
                Delete ({selectedAudience.size})
              </button>
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              setAppliedSearch(searchQuery.trim());
            }}
            className="flex w-full gap-2 md:w-auto"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by mobile number"
              className="flex-1 md:w-64 px-3 py-2 border border-gray-300 dark:border-[#3d3d3d] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-[#ececf1]"
            />
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-md hover:bg-gray-800"
            >
              Search
            </button>
            {appliedSearch && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setAppliedSearch("");
                  setPage(1);
                }}
                className="px-3 py-2 text-sm font-medium border border-gray-300 dark:border-[#3d3d3d] rounded-lg text-gray-700 dark:text-[#d1d5db] hover:bg-gray-100 dark:hover:bg-[#353535]"
              >
                Clear
              </button>
            )}
          </form>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-[#2162B0]" />
          </div>
        ) : audience.length === 0 ? (
          <div className="p-6 text-sm text-gray-500 dark:text-[#8e8ea0] text-center">No audience found for this campaign.</div>
        ) : (
          <>
            <div className="overflow-x-auto overflow-y-auto max-h-[50vh] sm:max-h-[60vh] md:max-h-[calc(100vh-350px)]">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-[#3d3d3d]">
                <thead className="bg-gray-50 dark:bg-[#1f1f1f] sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleSelectAll(!allSelected)}
                        className="flex items-center"
                      >
                        {allSelected ? (
                          <CheckSquare className="w-5 h-5 text-black-600" />
                        ) : someSelected ? (
                          <div className="w-5 h-5 border-2 border-black-600 bg-black-100 rounded" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400 dark:text-[#8e8ea0]" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-[#8e8ea0] uppercase tracking-wider">
                      Mobile Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-[#8e8ea0] uppercase tracking-wider">
                      Created At
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-[#2d2d2d] divide-y divide-gray-200 dark:divide-[#3d3d3d]">
                  {audience.map((item) => {
                    const isSelected = selectedAudience.has(item.mobile_number);
                    return (
                      <tr
                        key={item.mobile_number}
                        className={`hover:bg-gray-50 dark:hover:bg-[#353535] ${isSelected ? "bg-white dark:bg-[#2d2d2d]" : ""}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleSelectItem(item.mobile_number, !isSelected)}
                            className="flex items-center"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 text-black-600" />
                            ) : (
                              <Square className="w-5 h-5 text-gray-400 dark:text-[#8e8ea0]" />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-[#ececf1]">
                          {item.mobile_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-[#8e8ea0]">
                          {formatDate(item.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-white dark:bg-[#2d2d2d] px-6 py-3 flex items-center justify-between border-t border-gray-200 dark:border-[#3d3d3d]">
              <div className="text-sm text-gray-700 dark:text-[#d1d5db]">
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={!hasPrev || loading}
                  className="p-2 border border-gray-300 dark:border-[#3d3d3d] rounded disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-[#353535]"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="px-3 py-1 text-sm">Page {page}</span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!hasNext || loading}
                  className="p-2 border border-gray-300 dark:border-[#3d3d3d] rounded disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-[#353535]"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Launch Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
        }}
        title="Delete Selected Contacts"
      >
        <div className="space-y-6">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <p className="font-medium mb-1">This action cannot be undone.</p>
            <p className="text-xs text-red-600">
              {selectedAudience.size} contact{selectedAudience.size === 1 ? "" : "s"} will be removed from this
              campaign audience.
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-3 pt-4">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 border border-gray-300 dark:border-[#3d3d3d] rounded-lg text-sm font-medium text-gray-700 dark:text-[#d1d5db] hover:bg-gray-100 dark:hover:bg-[#353535]"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteSelected}
              disabled={deletingAudience}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {deletingAudience ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Launch Modal */}
      <Modal
        isOpen={showLaunchModal}
        onClose={() => {
          setShowLaunchModal(false);
          setLaunchModalLoading(false);
          setLaunchCampaignDetails(null);
          setLaunchRequirements(null);
          setLaunchBodyValues({});
          setLaunchingCampaign(false);
        }}
        title={
          launchCampaignDetails
            ? `Launch: ${launchCampaignDetails?.campaign_name || "Campaign"}`
            : "Launch Campaign"
        }
      >
        {launchModalLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 border border-blue-200 dark:bg-[#1f1f1f] dark:border-[#3d3d3d] rounded-lg text-sm text-blue-700 dark:text-[#d1d5db]">
              <p className="font-medium mb-1">Selected Audience: {selectedAudience.size} contacts</p>
              <p className="text-xs text-blue-600 dark:text-[#8e8ea0]">
                The campaign will be launched for the selected audience members.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-[#d1d5db]">Template Body Parameters</h3>
              {launchRequirements?.required_body_params > 0 ? (
                Array.from({ length: launchRequirements.required_body_params }).map((_, idx) => {
                  const key = `body_${idx + 1}`;
                  return (
                    <div key={key}>
                      <label className="block text-xs font-medium text-gray-600 dark:text-[#8e8ea0] mb-1">
                        {`Body ${idx + 1}`}
                      </label>
                      <input
                        type="text"
                        value={launchBodyValues[key] ?? ""}
                        onChange={(e) => handleLaunchBodyValueChange(key, e.target.value)}
                        placeholder={launchRequirements?.example_request?.[key] || `Value ${idx + 1}`}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-[#3d3d3d] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-[#ececf1]"
                      />
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-gray-500 dark:text-[#8e8ea0]">This template does not require body parameters.</p>
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-3 pt-4">
              <button
                onClick={() => {
                  setShowLaunchModal(false);
                  setLaunchModalLoading(false);
                  setLaunchCampaignDetails(null);
                  setLaunchRequirements(null);
                  setLaunchBodyValues({});
                  setLaunchingCampaign(false);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-[#3d3d3d] rounded-lg text-sm font-medium text-gray-700 dark:text-[#d1d5db] hover:bg-gray-100 dark:hover:bg-[#353535]"
              >
                Cancel
              </button>
              <button
                onClick={handleLaunchCampaign}
                disabled={launchingCampaign}
                className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white dark:bg-white dark:text-black text-sm font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50"
              >
                {launchingCampaign ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Rocket className="w-4 h-4" />
                )}
                Launch Campaign
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

