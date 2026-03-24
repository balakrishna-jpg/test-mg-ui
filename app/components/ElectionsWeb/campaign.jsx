// app/components/ElectionsWeb/CampaignManager.jsx
import { useState, useEffect, useRef } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Plus,
  X,
  Upload,
  Send,
  Loader2,
  ChevronRight as ChevronRightIcon,
  MoreVertical,
  ChevronDown,
  Rocket,
  BarChart3,
  FlaskConical,
  Check,
  Video,
  Phone,
  CreditCard,
  MoreVertical as MoreVerticalIcon,
  ArrowLeft,
  LayoutTemplate
} from "lucide-react";
import { useNavigate, useParams } from "@remix-run/react";
import { message } from "antd";
import {
  getWhatsAppTemplates,
  createCampaign,
  selectCampaignTemplate,
  uploadCampaignAudience,
  uploadCampaignAudienceGroup,
  getCampaignById,
  getCampaigns,
  deleteCampaign,
  launchCampaign,
  testCampaign,
  getGroupContacts,
  getContactGroups,
  uploadCampaignMedia,
  getOrganizationBill,
  getBalanceUsageHistory
} from "~/api";
import Razorpay from "./razorpay";

const STATUS_COLORS = {
  DRAFT: "bg-gray-100 text-gray-700",
  READY: "bg-green-100 text-green-700",
  RUNNING: "bg-blue-100 text-blue-700",
  SCHEDULED: "bg-yellow-100 text-yellow-700",
  PAUSED: "bg-orange-100 text-orange-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-red-100 text-red-700"
};

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-[#2d2d2d] rounded-lg shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#3d3d3d]">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-[#ececf1]">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-[#ececf1]">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 text-gray-900 dark:text-[#ececf1]">{children}</div>
      </div>
    </div>
  );
};

export default function CampaignManager() {
  // === LIST STATE ===
  const [campaigns, setCampaigns] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [total, setTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);

  // === MODAL & FORM STATE ===
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showAudienceModal, setShowAudienceModal] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [showUsageHistoryModal, setShowUsageHistoryModal] = useState(false);

  const [currentCampaign, setCurrentCampaign] = useState(null);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedTemplatePreview, setSelectedTemplatePreview] = useState(null);
  const [templateDropdownOpen, setTemplateDropdownOpen] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvColumns, setCsvColumns] = useState([]);
  const [selectedMobileColumn, setSelectedMobileColumn] = useState("");
  const [previewData, setPreviewData] = useState([]);
  const [uploadedPhoneNumbers, setUploadedPhoneNumbers] = useState([]);
  const [campaignName, setCampaignName] = useState("");
  const [description, setDescription] = useState("");
  const integratedNumber = "917997993374";

  // === DELETE CONFIRMATION MODAL STATE ===
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState(null);

  // === ACTION MENU STATE ===
  const [openMenuCampaignId, setOpenMenuCampaignId] = useState(null);

  const navigate = useNavigate();
  const party = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user_info") || "{}")?.party_id : undefined;

  

  // Track if we've already checked for auto-open modal
  const hasCheckedAutoOpen = useRef(false);

  // === LAUNCH MODAL STATE ===
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [launchModalLoading, setLaunchModalLoading] = useState(false);
  const [launchCampaignDetails, setLaunchCampaignDetails] = useState(null);
  const [launchRequirements, setLaunchRequirements] = useState(null);
  const [launchBodyValues, setLaunchBodyValues] = useState({});
  const [audienceCsvFile, setAudienceCsvFile] = useState(null);
  const [audienceCsvColumns, setAudienceCsvColumns] = useState([]);
  const [audienceSelectedColumn, setAudienceSelectedColumn] = useState("");
  const [audiencePreviewData, setAudiencePreviewData] = useState([]);
  const [audienceUploading, setAudienceUploading] = useState(false);
  const [audienceUploaded, setAudienceUploaded] = useState(false);
  const [launchingCampaign, setLaunchingCampaign] = useState(false);

  // === GROUP CONTACTS STATE ===
  const [contactGroups, setContactGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedGroupContacts, setSelectedGroupContacts] = useState([]);
  const [loadingGroupContacts, setLoadingGroupContacts] = useState(false);
  const [audienceSource, setAudienceSource] = useState("csv"); // "csv" or "group"

  // For launch modal
  const [launchAudienceSource, setLaunchAudienceSource] = useState("csv");
  const [launchSelectedGroupId, setLaunchSelectedGroupId] = useState("");
  const [launchSelectedGroupContacts, setLaunchSelectedGroupContacts] = useState([]);
  const [loadingLaunchGroupContacts, setLoadingLaunchGroupContacts] = useState(false);
  const [tempName, setTempName] = useState("");


  // === TEST MODAL STATE ===
  const [showTestModal, setShowTestModal] = useState(false);
  const [testRequirements, setTestRequirements] = useState(null);
  const [testBodyValues, setTestBodyValues] = useState({});
  const [testPhoneNumber, setTestPhoneNumber] = useState("");
  const [testingCampaign, setTestingCampaign] = useState(false);
  const [testRequirementsLoading, setTestRequirementsLoading] = useState(false);

  // === ORGANIZATION BILL STATE ===
  const [organizationBill, setOrganizationBill] = useState(null);
  const [loadingOrganizationBill, setLoadingOrganizationBill] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loadingPaymentHistory, setLoadingPaymentHistory] = useState(false);
  const [rechargeTab, setRechargeTab] = useState("add"); // "add" | "recharges"

  const [balanceUsageHistory, setBalanceUsageHistory] = useState([]);
  const [usedBalance, setUsedBalance] = useState(0);
  const [loadingBalanceUsageHistory, setLoadingBalanceUsageHistory] = useState(false);





  const fetchBalanceUsageHistory = async () => {
    setLoadingBalanceUsageHistory(true);
    try {
      const res = await getBalanceUsageHistory();
      setBalanceUsageHistory(res.usage_history || []);

      setUsedBalance(res.total_used || 0);
    } catch (err) {
      console.error("Failed to load balance usage history", err);
    } finally {
      setLoadingBalanceUsageHistory(false);
    }
  };



  const fetchOrganizationBill = async () => {
    setLoadingOrganizationBill(true);
    try {
      const res = await getOrganizationBill();
      setPaymentHistory(res.payment_history || []);
      setOrganizationBill(res.total_amount || 0);


    } catch (err) {
      console.error("Failed to load organization bill", err);
    } finally {
      setLoadingOrganizationBill(false);
    }
  };


  // === FETCH CAMPAIGNS ===
  const fetchCampaigns = async () => {
    setLoadingList(true);
    try {
      const res = await getCampaigns({
        page,
        page_size: pageSize,
        search: search || undefined
      });
      const fetchedCampaigns = res.campaigns || [];
      setCampaigns(fetchedCampaigns);
      setTotal(res.total || 0);
      setHasNext(res.has_next || false);
      setHasPrev(res.has_prev || false);
      setTempName(fetchedCampaigns[0]?.whatsapp_template?.template_name || "");

      // Auto-open create modal if no campaigns exist (only on initial load, first page, no search)
      if (fetchedCampaigns.length === 0 && page === 1 && !search && !hasCheckedAutoOpen.current) {
        hasCheckedAutoOpen.current = true;
        // Small delay to ensure UI is ready
        setTimeout(() => {
          setShowChannelModal(true);
          loadTemplates(); // Pre-load templates for the modal
        }, 300);
      }
    } catch (err) {
      console.error("Failed to load campaigns", err);
    } finally {
      setLoadingList(false);
    }
  };

  // === FETCH CONTACT GROUPS ===
  const fetchContactGroups = async () => {
    setLoadingGroups(true);
    try {
      const groups = await getContactGroups();
      setContactGroups(Array.isArray(groups) ? groups : []);
    } catch (err) {
      console.error("Failed to load contact groups:", err);
      message.error("Failed to load contact groups");
      setContactGroups([]);
    } finally {
      setLoadingGroups(false);
    }
  };

  // === FETCH GROUP CONTACTS ===
  const fetchGroupContacts = async (groupId, isLaunch = false) => {
    if (!groupId) return;

    if (isLaunch) {
      setLoadingLaunchGroupContacts(true);
    } else {
      setLoadingGroupContacts(true);
    }

    try {
      const response = await getGroupContacts({
        groupId: groupId,
        page: 1,
        page_size: 50 // Get all contacts for preview
      });

      const contacts = response?.contacts || [];

      if (isLaunch) {
        setLaunchSelectedGroupContacts(contacts);
      } else {
        setSelectedGroupContacts(contacts);
      }
    } catch (err) {
      console.error("Failed to load group contacts:", err);
      message.error("Failed to load group contacts");
      if (isLaunch) {
        setLaunchSelectedGroupContacts([]);
      } else {
        setSelectedGroupContacts([]);
      }
    } finally {
      if (isLaunch) {
        setLoadingLaunchGroupContacts(false);
      } else {
        setLoadingGroupContacts(false);
      }
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [page, search]);


  useEffect(() => {
    fetchOrganizationBill();
    fetchBalanceUsageHistory();
  }, [campaigns]);

  // === LOAD TEMPLATES FROM API ===
  const buildTemplatePreview = (components = []) => {
    const preview = {};
    components.forEach((comp) => {
      if (comp.type === "HEADER" && comp.text) {
        preview.header = comp.text.replace(/\{\{\d+\}\}/g, (match) => `[${match}]`);
      }
      if (comp.type === "BODY" && comp.text) {
        preview.body = comp.text.replace(/\{\{\d+\}\}/g, (match) => `[${match}]`);
      }
      if (comp.type === "FOOTER" && comp.text) {
        preview.footer = comp.text;
      }
      if (comp.type === "BUTTONS" && Array.isArray(comp.buttons)) {
        preview.buttons = comp.buttons.map((btn) => btn.text).filter(Boolean);
      }
    });
    return preview;
  };

  const loadTemplates = async () => {
    setLoading(true);
    try {

      const res = await getWhatsAppTemplates({
        integrated_number: integratedNumber,
        skip: 0,
        limit: 100
      });

      // The API returns: { success: true, data: { status: "success", hasError: false, data: [...] } }
      const rawTemplates = res?.data?.data || [];

      if (!Array.isArray(rawTemplates) || rawTemplates.length === 0) {
        setTemplates([]);
        setTemplatesLoaded(true);
        return;
      }

      // Extract variables from body text
      const extractVariables = (bodyText) => {
        if (!bodyText) return [];
        const matches = bodyText.match(/\{\{(\d+)\}\}/g);
        if (!matches) return [];
        const maxVar = Math.max(...matches.map(m => parseInt(m.match(/\d+/)[0])));
        return Array.from({ length: maxVar }, (_, i) => i + 1);
      };

      // Flatten templates - each language becomes a separate template entry
      const formatted = [];
      rawTemplates.forEach(template => {
        if (template.languages && Array.isArray(template.languages)) {
          template.languages.forEach(lang => {
            // Only include APPROVED templates
            if (lang.status === 'APPROVED') {
              // Find body component
              const bodyComponent = lang.code?.find(c => c.type === "BODY");
              const bodyText = bodyComponent?.text || "";
              const variables = extractVariables(bodyText);

              // Use variable_type from API (backend now provides it)
              const variableType = lang.variable_type || {};

              const templateObj = {
                id: lang.id, // template_id from language object
                name: template.name,
                language: lang.language,
                category: template.category,
                variables: variables,
                variable_type: variableType,
                body: bodyText,
                hasButtons: !!lang.code?.find(c => c.type === "BUTTONS"),
                status: lang.status,
                components: lang.code || []
              };

              formatted.push(templateObj);
            }
          });
        }
      });

      setTemplates(formatted);
      setTemplatesLoaded(true);

      return formatted; // Return the formatted templates
    } catch (err) {
      console.error("API ERROR:", err);
      console.error("Error details:", err?.response?.data || err?.message);
      message.error("Failed to load templates: " + (err?.response?.data?.detail || err?.message || "Unknown error"));
      return []; // Return empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Extract requirements from template's variable_type
  const getRequirementsFromTemplate = (template) => {
    if (!template) {
      return {
        required_body_params: 0,
        required_header_params: 0,
        header_type: null,
        body_params: {},
        header_params: {},
        example_request: {}
      };
    }

    if (!template.variable_type || Object.keys(template.variable_type).length === 0) {
      return {
        required_body_params: 0,
        required_header_params: 0,
        header_type: null,
        body_params: {},
        header_params: {},
        example_request: {}
      };
    }

    const variableType = template.variable_type;
    const bodyParams = {};
    const headerParams = {};
    const exampleRequest = {};
    let bodyCount = 0;
    let headerCount = 0;
    let headerType = null;

    // Parse variable_type to count body and header params
    Object.keys(variableType).forEach(key => {
      const varInfo = variableType[key];

      if (key.startsWith('body_')) {
        bodyCount++;
        bodyParams[key] = varInfo.type;
        exampleRequest[key] = "";
      } else if (key.startsWith('header_')) {
        headerCount++;
        headerType = varInfo.type;
        headerParams[key] = varInfo.type;
        exampleRequest[key] = "";
      }
    });

    return {
      required_body_params: bodyCount,
      required_header_params: headerCount,
      header_type: headerType,
      body_params: bodyParams,
      header_params: headerParams,
      example_request: exampleRequest
    };
  };

  const buildBodyValuesObject = (count, example = {}) => {
    const values = {};
    for (let i = 1; i <= count; i++) {
      const key = `body_${i}`;
      values[key] = example?.[key] || "";
    }
    return values;
  };

  // File validation helper
  const validateMediaFile = (file, headerType) => {
    if (!file) return { valid: false, error: "No file selected" };

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const fileSizeMB = file.size / (1024 * 1024); // Convert bytes to MB

    const headerTypeLower = headerType?.toLowerCase();

    // Validate file type
    if (headerTypeLower === 'image') {
      const allowedExts = ['jpg', 'jpeg', 'png'];
      if (!allowedExts.includes(fileExt)) {
        return {
          valid: false,
          error: `Invalid image format. Allowed: JPG, JPEG, PNG. Got: ${fileExt?.toUpperCase() || 'unknown'}`
        };
      }
      if (fileSizeMB > 5) {
        return { valid: false, error: `Image size exceeds 5MB limit. Current size: ${fileSizeMB.toFixed(2)}MB` };
      }
    } else if (headerTypeLower === 'video') {
      const allowedExts = ['mp4', '3gp', '3gpp'];
      if (!allowedExts.includes(fileExt)) {
        return {
          valid: false,
          error: `Invalid video format. Allowed: MP4, 3GP, 3GPP. Got: ${fileExt?.toUpperCase() || 'unknown'}`
        };
      }
      if (fileSizeMB > 16) {
        return { valid: false, error: `Video size exceeds 16MB limit. Current size: ${fileSizeMB.toFixed(2)}MB` };
      }
    } else if (headerTypeLower === 'document') {
      const allowedExts = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'];
      if (!allowedExts.includes(fileExt)) {
        return {
          valid: false,
          error: `Invalid document format. Allowed: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX. Got: ${fileExt?.toUpperCase() || 'unknown'}`
        };
      }
      if (fileSizeMB > 100) {
        return { valid: false, error: `Document size exceeds 100MB limit. Current size: ${fileSizeMB.toFixed(2)}MB` };
      }
    }

    return { valid: true };
  };

  const resetLaunchModalState = () => {
    setLaunchModalLoading(false);
    setLaunchCampaignDetails(null);
    setLaunchRequirements(null);
    setLaunchBodyValues({});
    setAudienceCsvFile(null);
    setAudienceCsvColumns([]);
    setAudienceSelectedColumn("");
    setAudiencePreviewData([]);
    setAudienceUploading(false);
    setAudienceUploaded(false);
    setLaunchingCampaign(false);
    setShowTestModal(false);
    setTestRequirements(null);
    setTestBodyValues({});
    setTestPhoneNumber("");
    setTestingCampaign(false);
    setTestRequirementsLoading(false);
    setLaunchAudienceSource("csv");
    setLaunchSelectedGroupId("");
    setLaunchSelectedGroupContacts([]);
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const waitForAudienceReady = async (
    campaignId,
    { attempts = 8, delayMs = 1200 } = {}
  ) => {
    if (!campaignId) return null;
    for (let attempt = 0; attempt < attempts; attempt++) {
      try {
        const latestDetails = await getCampaignById(campaignId || "");
        setTempName(latestDetails?.whatsapp_template?.template_name || "");
        // Check both estimated_count and Campaign_contacts
        // Campaign_contacts updates faster than estimated_count for group uploads
        const estimatedCount = latestDetails?.contact_selection?.estimated_count;
        const campaignContacts = latestDetails?.Campaign_contacts;

        // If either has contacts > 0, consider it ready
        if ((estimatedCount > 0) || (campaignContacts > 0)) {
          return latestDetails;
        }
      } catch (err) {
        console.error("Failed while polling campaign audience:", err);
        break;
      }

      if (attempt < attempts - 1) {
        await sleep(delayMs);
      }
    }

    return null;
  };

  const handleLaunchFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAudienceCsvFile(file);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const lines = text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .slice(0, 5);

      if (lines.length === 0) {
        setAudienceCsvColumns([]);
        setAudiencePreviewData([]);
        return;
      }

      const headers = lines[0]
        .split(",")
        .map((h) => h.trim().replace(/"/g, "").replace(/\r/g, ""));

      setAudienceCsvColumns(headers);
      if (headers.length > 0) {
        setAudienceSelectedColumn(headers[0]);
      }

      const preview = lines.slice(1, 4).map((line) => {
        const values = line
          .split(",")
          .map((v) => v.trim().replace(/"/g, "").replace(/\r/g, ""));
        return Object.fromEntries(headers.map((h, i) => [h, values[i] || ""]));
      });
      setAudiencePreviewData(preview);
    };
    reader.readAsText(file);
    setAudienceUploaded(false);
  };

  const handleOpenLaunchModal = async (camp, shouldShowModal = true, preserveAudienceUploaded = false) => {
    const campaignId = camp?.campaign_id || camp?._id;
    if (!campaignId) {
      message.error("Campaign ID not found");
      return;
    }

    const wasAudienceUploaded = preserveAudienceUploaded && audienceUploaded;
    resetLaunchModalState();
    if (preserveAudienceUploaded && wasAudienceUploaded) {
      setAudienceUploaded(true);
    }
    if (shouldShowModal) {
      setShowLaunchModal(true);
    }
    setLaunchModalLoading(true);

    try {
      // Ensure templates are loaded before matching
      let availableTemplates = templates;
      if (templates.length === 0 && !templatesLoaded) {
        availableTemplates = await loadTemplates();
      }

      const [campaignDetails] = await Promise.all([
        getCampaignById(campaignId),
        fetchContactGroups() // Load groups when modal opens
      ]);

      setLaunchCampaignDetails(campaignDetails);

      // Find the template from the loaded templates using campaign's template info
      const campaignTemplateName = campaignDetails?.template?.template_name
        || campaignDetails?.whatsapp_template?.template_name
        || campaignDetails?.template_name;

      const campaignTemplateId = campaignDetails?.template?.template_id
        || campaignDetails?.whatsapp_template?.template_id
        || campaignDetails?.template_id;

      let matchedTemplate = null;

      // Try to match by ID or name from campaign details
      if (campaignTemplateId) {
        matchedTemplate = availableTemplates.find(t => t.id === campaignTemplateId);
      } else if (campaignTemplateName) {
        matchedTemplate = availableTemplates.find(t => t.name === campaignTemplateName);
      }

      // Fallback: Use selectedTemplate if no match found and we just created campaign
      if (!matchedTemplate && selectedTemplate) {
        matchedTemplate = selectedTemplate;
      }

      if (matchedTemplate) {
        const requirementsRes = getRequirementsFromTemplate(matchedTemplate);
        setLaunchRequirements(requirementsRes);
        const requiredCount = requirementsRes?.required_body_params || 0;
        if (requiredCount > 0) {
          setLaunchBodyValues(buildBodyValuesObject(requiredCount, requirementsRes?.example_request));
        }
      }

      // Don't auto-set audienceUploaded - buttons will only show after CSV upload
    } catch (err) {
      console.error("Failed to prepare launch modal:", err);
      message.error(
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to fetch launch information"
      );
      if (shouldShowModal) {
        setShowLaunchModal(false);
      }
    } finally {
      setLaunchModalLoading(false);
    }
  };

  const handleUploadAudienceForLaunch = async () => {
    const campaignId = launchCampaignDetails?._id || launchCampaignDetails?.campaign_id;
    if (!campaignId) {
      message.error("Campaign details missing");
      return;
    }

    if (launchAudienceSource === "csv" && (!audienceCsvFile || !audienceSelectedColumn)) {
      message.warning("Select a CSV file and mobile number column");
      return;
    }

    if (launchAudienceSource === "group" && !launchSelectedGroupId) {
      message.warning("Select a contact group");
      return;
    }

    setAudienceUploading(true);
    try {
      if (launchAudienceSource === "group") {
        // Upload group contacts
        await uploadCampaignAudienceGroup(campaignId, launchSelectedGroupId);

        // Get group contacts for display
        const groupPhoneNumbers = launchSelectedGroupContacts
          .map(contact => contact.mobile_number)
          .filter(phone => phone && phone.trim().length > 0)
          .slice(0, 10);
        setUploadedPhoneNumbers(groupPhoneNumbers);
      } else {
        // Upload CSV
        await uploadCampaignAudience(campaignId, audienceCsvFile, audienceSelectedColumn);
      }

      const processedDetails = await waitForAudienceReady(campaignId);

      // Check both fields - Campaign_contacts updates faster than estimated_count
      const estimatedCount = processedDetails?.contact_selection?.estimated_count;
      const campaignContacts = processedDetails?.Campaign_contacts;

      if (!estimatedCount && !campaignContacts) {
        message.error(
          "Audience upload received, but no contacts are available yet. Please wait for processing or verify and try again."
        );
        return;
      }

      setLaunchCampaignDetails(processedDetails);
      setAudienceUploaded(true);

      // Ensure requirements are set after audience upload
      if (!launchRequirements || Object.keys(launchRequirements).length === 0) {
        // Ensure templates are loaded
        let availableTemplates = templates;
        if (templates.length === 0 && !templatesLoaded) {
          availableTemplates = await loadTemplates();
        }

        const campaignTemplateName = processedDetails?.template?.template_name
          || processedDetails?.whatsapp_template?.template_name
          || processedDetails?.template_name;

        const campaignTemplateId = processedDetails?.template?.template_id
          || processedDetails?.whatsapp_template?.template_id
          || processedDetails?.template_id;

        let matchedTemplate = null;
        if (campaignTemplateId) {
          matchedTemplate = availableTemplates.find(t => t.id === campaignTemplateId);
        } else if (campaignTemplateName) {
          matchedTemplate = availableTemplates.find(t => t.name === campaignTemplateName);
        }

        // Fallback: Use selectedTemplate from state
        if (!matchedTemplate && selectedTemplate) {
          matchedTemplate = selectedTemplate;
        }

        if (matchedTemplate) {
          const requirementsRes = getRequirementsFromTemplate(matchedTemplate);
          setLaunchRequirements(requirementsRes);
          const requiredCount = requirementsRes?.required_body_params || 0;
          if (requiredCount > 0) {
            setLaunchBodyValues(buildBodyValuesObject(requiredCount, requirementsRes?.example_request));
          }
        }
      }

      // Reset form fields
      if (launchAudienceSource === "csv") {
        setAudienceCsvFile(null);
        setAudienceCsvColumns([]);
        setAudienceSelectedColumn("");
        setAudiencePreviewData([]);
      } else {
        // Clear group selection after successful upload
        setLaunchSelectedGroupId("");
        setLaunchSelectedGroupContacts([]);
      }

      message.success("Audience uploaded successfully");
      fetchCampaigns();
    } catch (err) {
      console.error("Failed to upload audience:", err);
      const errorMessage =
        err?.detail || // When API throws response.data directly
        err?.response?.data?.detail || // When it's an axios error
        err?.response?.data?.message ||
        err?.message ||
        "Failed to upload audience";
      message.error(errorMessage);
    } finally {
      setAudienceUploading(false);
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

    if (!audienceUploaded) {
      message.warning("Please upload the audience CSV file before launching the campaign");
      return;
    }

    const payload = {};

    // Add header parameters if required
    const requiredHeaderCount = launchRequirements?.required_header_params || 0;
    if (requiredHeaderCount > 0) {
      const headerType = launchRequirements?.header_type;
      const headerValue = launchBodyValues['header_1'];

      if (!headerValue || !headerValue.trim()) {
        message.warning(`Please upload ${headerType} for header`);
        return;
      }

      payload.header_type = headerType;
      payload.header_value = headerValue.trim();

      // Add filename if it's a document
      if (headerType === 'document' && launchBodyValues['header_filename']) {
        payload.header_filename = launchBodyValues['header_filename'];
      }
    }

    // Add body parameters
    const requiredCount = launchRequirements?.required_body_params || 0;
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
      await launchCampaign(campaignId, payload);
      message.success("Campaign launch initiated successfully");
      setShowLaunchModal(false);
      resetLaunchModalState();
      fetchCampaigns();
    } catch (err) {
      console.error("Failed to launch campaign:", err);
      message.error(
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to launch campaign"
      );
    } finally {
      setLaunchingCampaign(false);
    }
  };

  const handleOpenTestModal = async () => {
    if (!launchCampaignDetails) return;
    const campaignId = launchCampaignDetails?._id || launchCampaignDetails?.campaign_id;
    if (!campaignId) {
      message.error("Campaign details missing");
      return;
    }

    setShowTestModal(true);
    setTestRequirementsLoading(true);
    setTestBodyValues({});
    setTestPhoneNumber("");
    setTestRequirements(null);

    try {
      // Find the template from the loaded templates using campaign's template info
      const campaignTemplateName = launchCampaignDetails?.template?.template_name
        || launchCampaignDetails?.whatsapp_template?.template_name
        || launchCampaignDetails?.template_name;

      const campaignTemplateId = launchCampaignDetails?.template?.template_id
        || launchCampaignDetails?.whatsapp_template?.template_id
        || launchCampaignDetails?.template_id;

      let matchedTemplate = null;
      if (campaignTemplateId) {
        matchedTemplate = templates.find(t => t.id === campaignTemplateId);
      } else if (campaignTemplateName) {
        matchedTemplate = templates.find(t => t.name === campaignTemplateName);
      }

      // Fallback: Use selectedTemplate from state
      if (!matchedTemplate && selectedTemplate) {
        matchedTemplate = selectedTemplate;
      }

      if (matchedTemplate) {
        const requirementsRes = getRequirementsFromTemplate(matchedTemplate);
        setTestRequirements(requirementsRes);
        const requiredCount = requirementsRes?.required_body_params || 0;
        if (requiredCount > 0) {
          setTestBodyValues(buildBodyValuesObject(requiredCount, requirementsRes?.example_request));
        }
      }
    } catch (err) {
      console.error("Failed to load test requirements:", err);
      message.error(
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load test requirements"
      );
      setShowTestModal(false);
    } finally {
      setTestRequirementsLoading(false);
    }
  };

  const handleTestBodyValueChange = (key, value) => {
    setTestBodyValues((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSendTestMessage = async () => {
    const campaignId = launchCampaignDetails?._id || launchCampaignDetails?.campaign_id;
    if (!campaignId) {
      message.error("Campaign details missing");
      return;
    }

    if (!testPhoneNumber.trim()) {
      message.warning("Enter a test phone number with country code");
      return;
    }

    const payload = {
      test_phone_number: testPhoneNumber.trim()
    };

    // Add header parameters if required
    const requiredHeaderCount = testRequirements?.required_header_params || 0;
    if (requiredHeaderCount > 0) {
      const headerType = testRequirements?.header_type;
      const headerValue = testBodyValues['header_1'];

      if (!headerValue || !headerValue.trim()) {
        message.warning(`Please upload ${headerType} for header`);
        return;
      }

      payload.header_type = headerType;
      payload.header_value = headerValue.trim();

      // Add filename if it's a document
      if (headerType === 'document' && testBodyValues['header_filename']) {
        payload.header_filename = testBodyValues['header_filename'];
      }
    }

    // Add body parameters
    const requiredCount = testRequirements?.required_body_params || 0;
    for (let i = 1; i <= requiredCount; i++) {
      const key = `body_${i}`;
      const value = (testBodyValues[key] || "").trim();
      if (!value) {
        message.warning(`Please provide a value for ${key}`);
        return;
      }
      payload[key] = value;
    }

    setTestingCampaign(true);
    try {
      await testCampaign(campaignId, payload);
      message.success("Test message sent successfully");
      setShowTestModal(false);
    } catch (err) {
      console.error("Failed to send test message:", err);
      message.error(
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to send test message"
      );
    } finally {
      setTestingCampaign(false);
    }
  };

  const closeTestModal = () => {
    setShowTestModal(false);
    setTestRequirementsLoading(false);
    setTestingCampaign(false);
    setTestRequirements(null);
    setTestBodyValues({});
    setTestPhoneNumber("");
  };

  // === SELECT TEMPLATE ===
  const handleSelectTemplate = async (template) => {
    setSelectedTemplate(template);
    setSelectedTemplatePreview(buildTemplatePreview(template?.components || []));
    setTemplateDropdownOpen(false);
  };

  useEffect(() => {
    if (!selectedTemplate) {
      setSelectedTemplatePreview(null);
    }
  }, [selectedTemplate]);

  // === CREATE CAMPAIGN ===
  const handleCreateCampaign = async () => {
    if (!campaignName.trim()) {
      message.warning("Campaign name is required");
      return;
    }
    if (!selectedTemplate) {
      message.warning("Please select a template");
      return;
    }

    setLoading(true);
    try {
      // Step 1: Create campaign
      const data = await createCampaign({
        campaign_name: campaignName,
        description,
        integrated_number: integratedNumber
      });



      // Step 2: Select template using the campaign ID
      const campaignId = data?._id || data?.campaign_id || data?.id;

      if (!campaignId) {
        throw new Error("Campaign ID not found in response");
      }

      const config = {
        whatsapp_template: {
          template_id: selectedTemplate.id,
          template_name: selectedTemplate.name,
          integrated_number: integratedNumber,
          expected_variables: selectedTemplate.variables.length,
          template_language: selectedTemplate.language,
          template_category: selectedTemplate.category,
          has_buttons: selectedTemplate.hasButtons
        }
      };

      const updated = await selectCampaignTemplate(campaignId, config);


      setCurrentCampaign(updated);
      setShowCampaignModal(false);

      // Set requirements immediately for new campaign using selectedTemplate
      const requirementsRes = getRequirementsFromTemplate(selectedTemplate);
      setLaunchRequirements(requirementsRes);
      const requiredCount = requirementsRes?.required_body_params || 0;
      if (requiredCount > 0) {
        setLaunchBodyValues(buildBodyValuesObject(requiredCount, requirementsRes?.example_request));
      }

      setLaunchCampaignDetails(updated);

      // Show Launch modal directly, not audience modal
      setShowLaunchModal(true);
      await fetchContactGroups();

      fetchCampaigns();
    } catch (err) {
      console.error("Failed:", err);
      message.error("Failed: " + (err?.response?.data?.detail || err?.message));
    } finally {
      setLoading(false);
    }
  };

  // === UPLOAD CSV ===
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvFile(file);
    setAudienceUploaded(false); // Reset when new file is selected

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const lines = text.split('\n').slice(0, 5);
      if (lines.length > 0) {
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        setCsvColumns(headers);
        if (headers.length > 0) setSelectedMobileColumn(headers[0]);
      }
      const preview = lines.slice(1, 4).map(line => {
        const vals = line.split(',').map(v => v.trim().replace(/"/g, ''));
        return Object.fromEntries(headers.map((h, i) => [h, vals[i] || ""]));
      });
      setPreviewData(preview);
    };
    reader.readAsText(file);
  };

  const handleUploadAudience = async () => {
    if (audienceSource === "csv" && (!csvFile || !selectedMobileColumn)) {
      message.warning("Select file and mobile column");
      return;
    }
    if (audienceSource === "group" && !selectedGroupId) {
      message.warning("Select a contact group");
      return;
    }

    setLoading(true);
    try {
      const campaignId = currentCampaign?._id || currentCampaign?.campaign_id;
      if (!campaignId) {
        throw new Error("Campaign ID not found");
      }

      if (audienceSource === "group") {
        // Upload group contacts to campaign
        await uploadCampaignAudienceGroup(campaignId, selectedGroupId);

        // Get group contacts for preview
        const groupPhoneNumbers = selectedGroupContacts
          .map(contact => contact.mobile_number)
          .filter(phone => phone && phone.trim().length > 0)
          .slice(0, 10); // Preview first 10
        setUploadedPhoneNumbers(groupPhoneNumbers);

        // Wait for audience to be ready
        const processedDetails = await waitForAudienceReady(campaignId);

        // Check both fields - Campaign_contacts updates faster than estimated_count
        const estimatedCount = processedDetails?.contact_selection?.estimated_count;
        const campaignContacts = processedDetails?.Campaign_contacts;

        if (!estimatedCount && !campaignContacts) {
          message.error(
            "Group contacts uploaded, but no contacts are available yet. Please wait for processing or verify the group and try again."
          );
          return;
        }

        setCurrentCampaign(processedDetails);
        setLaunchCampaignDetails(processedDetails);
        setAudienceUploaded(true);
        // Clear group selection preview after successful upload
        setSelectedGroupId("");
        setSelectedGroupContacts([]);
        message.success("Group contacts uploaded successfully");
        fetchCampaigns();
        return;
      }

      // Extract phone numbers from CSV file synchronously
      const extractPhoneNumbers = () => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => {
            const text = ev.target.result;
            const lines = text.split('\n').filter(line => line.trim().length > 0);
            if (lines.length > 0) {
              const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
              const mobileColumnIndex = headers.indexOf(selectedMobileColumn);

              if (mobileColumnIndex >= 0) {
                const phoneNumbers = lines.slice(1)
                  .map(line => {
                    const values = line.split(',').map(v => v.trim().replace(/"/g, '').replace(/\r/g, ''));
                    return values[mobileColumnIndex];
                  })
                  .filter(phone => phone && phone.trim().length > 0)
                  .slice(0, 10); // Get at least 4, but show up to 10

                resolve(phoneNumbers);
              } else {
                resolve([]);
              }
            } else {
              resolve([]);
            }
          };
          reader.readAsText(csvFile);
        });
      };

      const phoneNumbers = await extractPhoneNumbers();
      setUploadedPhoneNumbers(phoneNumbers);


      await uploadCampaignAudience(campaignId, csvFile, selectedMobileColumn);

      const processedDetails = await waitForAudienceReady(campaignId);

      // Check both fields - Campaign_contacts updates faster than estimated_count
      const estimatedCount = processedDetails?.contact_selection?.estimated_count;
      const campaignContacts = processedDetails?.Campaign_contacts;

      if (!estimatedCount && !campaignContacts) {
        message.error(
          "Audience upload received, but no contacts are available yet. Please wait for processing or verify the CSV and try again."
        );
        return;
      }

      setCurrentCampaign(processedDetails);
      setLaunchCampaignDetails(processedDetails);
      setAudienceUploaded(true);
      setCsvFile(null);
      setCsvColumns([]);
      setSelectedMobileColumn("");
      setPreviewData([]);
      message.success("Audience uploaded successfully");
      fetchCampaigns();
    } catch (err) {
      console.error("Failed to upload audience:", err);
      console.error("Error details:", err?.response?.data || err?.message);
      const errorMessage =
        err?.detail || // When API throws response.data directly
        err?.response?.data?.detail || // When it's an axios error
        err?.response?.data?.message ||
        err?.message ||
        "Unknown error";
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCampaign = async () => {
    if (!campaignToDelete) return;

    setLoading(true);
    try {
      await deleteCampaign(campaignToDelete);
      setShowDeleteConfirmation(false);
      setCampaignToDelete(null);
      fetchCampaigns();
    } catch (err) {
      console.error("Failed to delete campaign:", err);
      console.error("Error details:", err?.response?.data || err?.message);
      message.error("Failed to delete campaign: " + (err?.response?.data?.detail || err?.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "today";
    if (days === 1) return "yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="w-full px-4 py-6 sm:px-6 space-y-6 bg-white dark:bg-[#262626] min-h-screen text-gray-900 dark:text-[#ececf1]">
      {/* Back Button */}
      {/* <div className="mb-4">
        <button
          onClick={() => navigate(`/elections/communication`)}
          className="flex items-center gap-2 text-sm transition-colors text-gray-600 dark:text-[#d1d5db] hover:text-gray-900 dark:hover:text-[#ececf1]"
        >
          <ArrowLeft size={16} />
          <span>Back to Communication</span>
        </button>
      </div> */}

      {/* Top Bar */}
      <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
        <div className="w-full md:w-2/3 lg:w-1/2 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-[#8e8ea0] w-5 h-5" />
          <input
            type="text"
            placeholder="Search by Campaign Name"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-[#3d3d3d] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-[#ececf1]"
          />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            onClick={() => {
              fetchBalanceUsageHistory();
              setShowUsageHistoryModal(true);
            }}
            className="flex items-center gap-2 whitespace-nowrap flex-nowrap h-10 px-4 rounded-md bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-gray-700 dark:text-gray-200 font-medium leading-none shadow-[0_2px_10px_rgb(0,0,0,0.04)] hover:shadow-[0_4px_15px_rgb(0,0,0,0.08)] hover:-translate-y-[1px] transition-all w-full justify-center sm:w-auto sm:justify-normal"
          >
            Used Balance ₹{usedBalance}
          </button>

          <button
            onClick={() => setShowRechargeModal(true)}
            className="flex items-center gap-2 whitespace-nowrap flex-nowrap h-10 px-4 rounded-md bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-gray-900 dark:text-white font-medium leading-none shadow-[0_2px_10px_rgb(0,0,0,0.04)] hover:shadow-[0_4px_15px_rgb(0,0,0,0.08)] hover:border-emerald-500/30 hover:-translate-y-[1px] transition-all w-full justify-center sm:w-auto sm:justify-normal group"
          >
            <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
            Add Funds ₹{organizationBill}
          </button>

          <button
            onClick={() => navigate(`/elections/templates`)}
            className="flex items-center gap-2 whitespace-nowrap flex-nowrap h-10 px-4 rounded-md bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-gray-900 dark:text-white font-medium leading-none shadow-[0_2px_10px_rgb(0,0,0,0.04)] hover:shadow-[0_4px_15px_rgb(0,0,0,0.08)] hover:-translate-y-[1px] transition-all w-full justify-center sm:w-auto sm:justify-normal"
          >
            <LayoutTemplate className="w-5 h-5 shrink-0" />
            Templates
          </button>

          <button
            onClick={() => setShowChannelModal(true)}
            className="flex items-center gap-2 whitespace-nowrap flex-nowrap h-10 px-4 rounded-md bg-gray-900 text-white font-medium leading-none shadow-[0_4px_14px_0_rgba(0,0,0,0.15)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.2)] hover:bg-black hover:-translate-y-[1px] transition-all w-full justify-center sm:w-auto sm:justify-normal dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
          >
            <Plus className="w-5 h-5 shrink-0" />
            New Campaign
          </button>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-4">
        {loadingList ? (
          <div className="flex items-center justify-center rounded-2xl border border-dashed border-gray-300 dark:border-[#3d3d3d] bg-white dark:bg-[#2d2d2d] py-12">
            <Loader2 className="h-10 w-10 animate-spin text-[#2162B0]" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 dark:border-[#3d3d3d] bg-white dark:bg-[#2d2d2d] p-6 text-center text-sm text-gray-500 dark:text-[#8e8ea0]">
            No campaigns found
          </div>
        ) : (
          campaigns.map((camp) => {
            const campaignRowId = camp.campaign_id || camp._id;
            return (
              <div
                key={campaignRowId || `camp-${Math.random()}`}
                className="rounded-2xl border border-gray-200 dark:border-[#3d3d3d] bg-white dark:bg-[#2d2d2d] p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-gray-900 dark:text-[#ececf1]">
                      {camp.campaign_name || "Untitled Campaign"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-[#8e8ea0]">{camp.campaign_slug || "—"}</p>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() =>
                        setOpenMenuCampaignId(
                          openMenuCampaignId === (camp.campaign_id || camp._id)
                            ? null
                            : (camp.campaign_id || camp._id)
                        )
                      }
                      className="rounded-full p-2 text-gray-400 transition hover:text-gray-600 dark:hover:text-[#ececf1]"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>
                    {openMenuCampaignId === (camp.campaign_id || camp._id) && (
                      <div className="absolute right-0 top-9 z-20 w-40 rounded-lg border border-gray-200 dark:border-[#3d3d3d] bg-white dark:bg-[#2d2d2d] shadow-lg">
                        <button
                          onClick={() => {
                            setCampaignToDelete(camp.campaign_id || camp._id);
                            setShowDeleteConfirmation(true);
                            setOpenMenuCampaignId(null);
                          }}
                          className="w-full rounded-lg px-4 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-[#3a2a2a]"
                        >
                          Delete Campaign
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-[#d1d5db]">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="h-4 w-4">
                    <rect width="640" height="640" rx="115" fill="#25D366" />
                    <path d="M 320 520 C 209.543 520 120 430.457 120 320 C 120 209.543 209.543 120 320 120 C 430.457 120 520 209.543 520 320 C 520 430.457 430.457 520 320 520 Z M 320 160 C 231.634 160 160 231.634 160 320 C 160 408.366 231.634 480 320 480 C 408.366 480 480 408.366 480 320 C 480 231.634 408.366 160 320 160 Z" fill="white" />
                    <path d="M 279.463 252.222 C 276.111 245.185 272.593 245.037 269.407 244.907 C 266.889 244.796 263.926 244.815 260.963 244.815 C 258 244.815 253.296 245.889 249.259 250.074 C 245.222 254.259 234.815 264.074 234.815 284.185 C 234.815 304.296 249.63 323.704 251.556 326.667 C 253.481 329.63 281.963 373.037 325.185 390.519 C 361.667 405.185 368.407 402.667 375.519 402 C 382.63 401.333 399.852 391.926 403.333 382.148 C 406.815 372.37 406.815 363.852 405.778 362.074 C 404.741 360.296 401.778 359.222 397.333 357.037 C 392.889 354.852 372.815 344.889 368.778 343.444 C 364.741 342 361.778 341.259 358.815 345.778 C 355.852 350.296 347.704 359.222 345.111 362.074 C 342.519 364.926 339.926 365.333 335.481 363.148 C 331.037 360.963 316.519 356.148 299.259 340.519 C 285.63 328.222 276.148 313.037 273.556 308.519 C 270.963 304 273.259 301.556 275.444 299.407 C 277.407 297.481 279.889 294.259 282.074 291.667 C 284.259 289.074 285 287.333 286.444 284.481 C 287.889 281.63 287.185 279.037 286.148 276.852 C 285.111 274.667 276.037 254.519 279.463 252.222 Z" fill="white" />
                  </svg>
                  <span>WhatsApp</span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs uppercase text-gray-500">Contacts</p>
                    <p className="text-base font-semibold text-gray-900">
                      {camp.contact_selection?.estimated_count?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500">Last launched</p>
                    <p className="text-sm font-medium text-gray-900">
                      {camp.launched_at ? formatDate(camp.launched_at) : "—"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleOpenLaunchModal(camp)}
                    className="flex-1 min-w-[140px] rounded-lg px-3 py-2 text-sm font-semibold shadow-sm transition bg-black text-white dark:bg-white dark:text-black"
                  >
                    Launch
                  </button>
                  <button
                    onClick={() => {
                      if (!campaignRowId) {
                        message.error("Campaign ID not found");
                        return;
                      }
                      const partyId =
                        party || JSON.parse(localStorage.getItem("user_info") || "{}")?.party_id;
                      if (!partyId) {
                        message.error("Party information missing");
                        return;
                      }
                      navigate(`/elections/analysis?campaignId=${campaignRowId}`);
                    }}
                    className="flex-1 min-w-[140px] rounded-lg border px-3 py-2 text-sm font-semibold transition bg-black text-white dark:bg-white dark:text-black"
                  >
                    Analytics
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Campaign Table */}
      <div className="hidden lg:block">
        <div className="overflow-hidden rounded-lg bg-white dark:bg-[#2d2d2d] border border-gray-200 dark:border-[#3d3d3d] shadow">
          <div className="overflow-x-auto">
            <table className="min-w-[960px] w-full">
              <thead className="border-b border-gray-200 dark:border-[#3d3d3d] bg-gray-50 dark:bg-[#1f1f1f]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-700 dark:text-[#8e8ea0]">Campaign</th>
                  {/* <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-700">ID/Slug</th> */}
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-700 dark:text-[#8e8ea0]">Template</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-700 dark:text-[#8e8ea0]">Channels</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-700 dark:text-[#8e8ea0]">Total Contacts</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-700 dark:text-[#8e8ea0]">Last Launched</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-700 dark:text-[#8e8ea0]">Actions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-[#8e8ea0]" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-[#3d3d3d] bg-white dark:bg-[#2d2d2d]">
                {loadingList ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <Loader2 className="mx-auto h-10 w-10 animate-spin dark:text-white dark:text-black" />
                    </td>
                  </tr>
                ) : campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-500 dark:text-[#8e8ea0]">
                      No campaigns found
                    </td>
                  </tr>
                ) : (
                  campaigns.map((camp) => {
                    const campaignRowId = camp.campaign_id || camp._id;
                    return (
                      <tr
                        key={campaignRowId || `camp-${Math.random()}`}
                        className="hover:bg-gray-50 dark:hover:bg-[#353535]"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {/* <span className="h-3 w-3 rounded-full bg-green-600" /> */}
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-[#ececf1]">
                                {camp.campaign_name || "Untitled Campaign"}
                              </div>
                            </div>
                          </div>
                        </td>
                        {/* <td className="px-6 py-4 text-sm text-gray-500">
                          {camp.campaign_slug || "—"}
                        </td> */}
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-[#8e8ea0]">
                          {tempName || "—"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            {/* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="h-5 w-5">
                              <rect width="640" height="640" rx="115" fill="#25D366"/>
                              <path d="M 320 520 C 209.543 520 120 430.457 120 320 C 120 209.543 209.543 120 320 120 C 430.457 120 520 209.543 520 320 C 520 430.457 430.457 520 320 520 Z M 320 160 C 231.634 160 160 231.634 160 320 C 160 408.366 231.634 480 320 480 C 408.366 480 480 408.366 480 320 C 480 231.634 408.366 160 320 160 Z" fill="white"/>
                              <path d="M 279.463 252.222 C 276.111 245.185 272.593 245.037 269.407 244.907 C 266.889 244.796 263.926 244.815 260.963 244.815 C 258 244.815 253.296 245.889 249.259 250.074 C 245.222 254.259 234.815 264.074 234.815 284.185 C 234.815 304.296 249.63 323.704 251.556 326.667 C 253.481 329.63 281.963 373.037 325.185 390.519 C 361.667 405.185 368.407 402.667 375.519 402 C 382.63 401.333 399.852 391.926 403.333 382.148 C 406.815 372.37 406.815 363.852 405.778 362.074 C 404.741 360.296 401.778 359.222 397.333 357.037 C 392.889 354.852 372.815 344.889 368.778 343.444 C 364.741 342 361.778 341.259 358.815 345.778 C 355.852 350.296 347.704 359.222 345.111 362.074 C 342.519 364.926 339.926 365.333 335.481 363.148 C 331.037 360.963 316.519 356.148 299.259 340.519 C 285.63 328.222 276.148 313.037 273.556 308.519 C 270.963 304 273.259 301.556 275.444 299.407 C 277.407 297.481 279.889 294.259 282.074 291.667 C 284.259 289.074 285 287.333 286.444 284.481 C 287.889 281.63 287.185 279.037 286.148 276.852 C 285.111 274.667 276.037 254.519 279.463 252.222 Z" fill="white"/>
                            </svg> */}
                            <span className="text-sm font-medium">WhatsApp</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-center">
                          {camp.Campaign_contacts?.toLocaleString() || 0}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-[#8e8ea0]">
                          {camp.launched_at ? formatDate(camp.launched_at) : "—"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenLaunchModal(camp);
                              }}
                              className="inline-flex items-center gap-1 rounded-3xl px-3 py-1.5 text-sm font-medium transition bg-green-500 text-white dark:bg-white dark:text-black"
                            >
                              <Rocket className="h-4 w-4" />
                              Launch
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!campaignRowId) {
                                  message.error("Campaign ID not found");
                                  return;
                                }
                                const partyId =
                                  party || JSON.parse(localStorage.getItem("user_info") || "{}")?.party_id;
                                if (!partyId) {
                                  message.error("Party information missing");
                                  return;
                                }
                                navigate(`/elections/analysis?campaignId=${campaignRowId}`);
                              }}
                              className="inline-flex items-center gap-1 rounded-3xl border px-3 py-1.5 text-sm font-medium transition  dark:bg-[#535250] dark:border-white dark:text-white "
                            >
                              <BarChart3 className="h-4 w-4" />
                              Analytics
                            </button>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuCampaignId(
                                  openMenuCampaignId === (camp.campaign_id || camp._id)
                                    ? null
                                    : (camp.campaign_id || camp._id)
                                );
                              }}
                              className="p-2 text-gray-400 transition hover:text-gray-600 dark:hover:text-[#ececf1]"
                            >
                              <MoreVertical className="h-5 w-5" />
                            </button>
                            {openMenuCampaignId === (camp.campaign_id || camp._id) && (
                              <div className="absolute right-0 bottom-full z-20 mb-2 w-48 rounded-lg border border-gray-200 dark:border-[#3d3d3d] bg-white dark:bg-[#2d2d2d] shadow-lg">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCampaignToDelete(camp.campaign_id || camp._id);
                                    setShowDeleteConfirmation(true);
                                    setOpenMenuCampaignId(null);
                                  }}
                                  className="w-full rounded-lg px-4 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-[#3a2a2a]"
                                >
                                  Delete Campaign
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t px-6 py-3 text-sm text-gray-700">
            <div>
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={!hasPrev || loadingList}
                className="rounded border px-3 py-2 disabled:opacity-50"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="px-3 py-1 text-sm">Page {page}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasNext || loadingList}
                className="rounded border px-3 py-2 disabled:opacity-50"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* === USED BALANCE HISTORY MODAL === */}
      <Modal
        isOpen={showUsageHistoryModal}
        onClose={() => setShowUsageHistoryModal(false)}
        title="Used Balance History"
      >
        {loadingBalanceUsageHistory ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-10 w-10 animate-spin text-[#2162B0]" />
          </div>
        ) : balanceUsageHistory.length === 0 ? (
          <p className="text-md text-gray-700 text-center">No usage history found.</p>
        ) : (
          <div className="space-y-3 overflow-y-auto max-h-80">
            {balanceUsageHistory.map((item, idx) => (
              <div
                key={idx}
                className="border rounded-md p-3 flex items-start justify-between gap-3"
              >
                <div className="scroll-y">
                  <p className="text-sm font-medium text-gray-800">
                    {item.description || "Usage entry"}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {new Date(item.created_at).toLocaleString()}{" "}
                    {item.message_count != null && (
                      <span className="ml-1">
                        • {item.message_count} message
                        {item.message_count === 1 ? "" : "s"}
                      </span>
                    )}
                  </p>
                  {item.campaign_name && (
                    <p className="mt-1 text-xs text-gray-500">
                      Campaign: {item.campaign_name}
                    </p>
                  )}
                </div>
                <div
                  className={`text-sm font-semibold whitespace-nowrap ${item.amount < 0 ? "text-red-600" : "text-green-600"
                    }`}
                >
                  ₹{Math.abs(item.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* === RECHARGE MODAL (Razorpay) === */}
      <Modal
        isOpen={showRechargeModal}
        onClose={() => setShowRechargeModal(false)}
        title="Billing & Recharges"
      >
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex border-b mb-2">
            <button
              className={`px-4 py-2 text-md font-medium ${rechargeTab === "add"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500"
                }`}
              onClick={() => setRechargeTab("add")}
            >
              Add Bill
            </button>
            <button
              className={`px-4 py-2 text-md font-medium ${rechargeTab === "recharges"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500"
                }`}
              onClick={() => setRechargeTab("recharges")}
            >
              Recharges
            </button>
          </div>

          {/* Tab content */}
          {rechargeTab === "add" ? (
            <Razorpay fetchOrganizationBill={fetchOrganizationBill} />
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {loadingOrganizationBill && paymentHistory.length === 0 ? (
                <div className="flex items-center justify-center py-4 text-sm text-gray-500 dark:text-[#8e8ea0]">
                  Loading recharges...
                </div>
              ) : paymentHistory.length === 0 ? (
                <p className="text-md text-gray-700 dark:text-[#8e8ea0] text-center">No recharges found.</p>
              ) : (
                paymentHistory.map((pmt) => (
                  <div
                    key={pmt.payment_id}
                    className="border border-gray-200 dark:border-[#3d3d3d] rounded-md p-3 flex items-center justify-between gap-3 bg-white dark:bg-[#2d2d2d]"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-[#ececf1]">
                        ₹{pmt.amount}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-[#8e8ea0]">
                        {new Date(pmt.created_at).toLocaleString()}
                      </p>
                      <p className="mt-1 text-[11px] text-gray-400 dark:text-[#8e8ea0] break-all">
                        Payment ID: {pmt.payment_id}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* === MODAL 1: Channel Selection === */}
      <Modal isOpen={showChannelModal} onClose={() => setShowChannelModal(false)} title="Launch Campaign">
        <div className="space-y-6">




          <div>
            {/* <h3 className="text-lg font-medium mb-4 text-center">Create Single Channel Campaign</h3> */}
            <div className=" flex justify-center">

              <button
                onClick={() => {
                  setShowChannelModal(false);
                  setShowCampaignModal(true);
                  // Load templates when user selects WhatsApp Campaign
                  loadTemplates();
                }}
                className="p-6 border border-gray-200 dark:border-[#3d3d3d] rounded-lg bg-white dark:bg-[#2d2d2d] shadow-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="w-18 h-18 mx-auto mb-2">
                  <rect width="640" height="640" rx="115" fill="#25D366" />
                  <path d="M 320 520 C 209.543 520 120 430.457 120 320 C 120 209.543 209.543 120 320 120 C 430.457 120 520 209.543 520 320 C 520 430.457 430.457 520 320 520 Z M 320 160 C 231.634 160 160 231.634 160 320 C 160 408.366 231.634 480 320 480 C 408.366 480 480 408.366 480 320 C 480 231.634 408.366 160 320 160 Z" fill="white" />
                  <path d="M 279.463 252.222 C 276.111 245.185 272.593 245.037 269.407 244.907 C 266.889 244.796 263.926 244.815 260.963 244.815 C 258 244.815 253.296 245.889 249.259 250.074 C 245.222 254.259 234.815 264.074 234.815 284.185 C 234.815 304.296 249.63 323.704 251.556 326.667 C 253.481 329.63 281.963 373.037 325.185 390.519 C 361.667 405.185 368.407 402.667 375.519 402 C 382.63 401.333 399.852 391.926 403.333 382.148 C 406.815 372.37 406.815 363.852 405.778 362.074 C 404.741 360.296 401.778 359.222 397.333 357.037 C 392.889 354.852 372.815 344.889 368.778 343.444 C 364.741 342 361.778 341.259 358.815 345.778 C 355.852 350.296 347.704 359.222 345.111 362.074 C 342.519 364.926 339.926 365.333 335.481 363.148 C 331.037 360.963 316.519 356.148 299.259 340.519 C 285.63 328.222 276.148 313.037 273.556 308.519 C 270.963 304 273.259 301.556 275.444 299.407 C 277.407 297.481 279.889 294.259 282.074 291.667 C 284.259 289.074 285 287.333 286.444 284.481 C 287.889 281.63 287.185 279.037 286.148 276.852 C 285.111 274.667 276.037 254.519 279.463 252.222 Z" fill="white" />
                </svg>
                <p className="font-medium text-gray-700 dark:text-[#d1d5db]">WhatsApp Campaign</p>
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* === MODAL 2: Campaign Info === */}
      <Modal isOpen={showCampaignModal} onClose={() => setShowCampaignModal(false)} title="Launch Campaign">
        <div className="space-y-5">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-red-600 mb-1">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={e => setCampaignName(e.target.value)}
                  className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter campaign name"
                />
                {!campaignName && <p className="text-xs text-red-600 mt-1">Name is required.</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Select Number *</label>
                <div className="flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-[#3d3d3d] rounded-lg bg-gray-50 dark:bg-[#1f1f1f]">
                  <span className="text-gray-900 dark:text-[#ececf1]">{integratedNumber}</span>
                  <X className="w-4 h-4 text-gray-400 dark:text-[#8e8ea0]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Select WhatsApp Template *</label>
                <div className="relative">
                  <button
                    onClick={() => setTemplateDropdownOpen(!templateDropdownOpen)}
                    disabled={loading || templates.length === 0}
                    className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-[#3d3d3d] rounded-lg hover:border-blue-500 text-left disabled:opacity-50 bg-white dark:bg-[#1f1f1f]"
                  >
                    <span className={selectedTemplate ? "text-gray-900 dark:text-[#ececf1]" : "text-gray-500 dark:text-[#8e8ea0]"}>
                      {loading ? "Loading templates..." : selectedTemplate ? selectedTemplate.name : "Choose Template"}
                    </span>
                    {loading ? <Loader2 className="w-5 h-5 animate-spin " /> : <ChevronDown className="w-5 h-5 text-[#2162B0]" />}
                  </button>

                  {/* ONLY SHOW DROPDOWN IF OPEN AND NOT LOADING */}
                  {templateDropdownOpen && !loading && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-[#2d2d2d] border border-gray-200 dark:border-[#3d3d3d] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      <div className="border-b border-gray-200 dark:border-[#3d3d3d]">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setTemplateDropdownOpen(false);
                            setShowCampaignModal(false);
                            const partyId =
                              party || JSON.parse(localStorage.getItem("user_info") || "{}")?.party_id;
                            if (partyId) {
                              navigate(`/elections/templates?create=1`);
                            } else {
                              navigate(`/templates?create=1`);
                            }
                          }}
                          className="w-full text-left px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-[#1f2a33]"
                        >
                          + Create Template
                        </button>
                      </div>
                      {templates.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500 dark:text-[#8e8ea0]">No approved templates</div>
                      ) : (
                        templates.map((template) => (
                          <button
                            key={template.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTemplate(template);
                              handleSelectTemplate(template);
                              setTemplateDropdownOpen(false); // Close after select
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-[#353535] text-sm border-b border-gray-200 dark:border-[#3d3d3d] last:border-b-0"
                          >
                            <div className="font-medium text-gray-900 dark:text-[#ececf1]">{template.name}</div>
                            <div className="text-xs text-gray-500 dark:text-[#8e8ea0]">
                              {template.language.toUpperCase()} • {template.category}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>


            <div className="bg-[#f6f0e9] rounded-xl p-0 h-fit space-y-3">

              <div className="bg-white border border-gray-200 rounded-lg">
                {/* Top bar - full width with no side gap */}
                <div className="bg-[#128C7E]
 text-white py-2 flex items-center gap-3 w-full px-4 sm:px-5">
                  <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-semibold">
                    WA
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{integratedNumber}</div>
                    <div className="text-xs text-white/80">WhatsApp</div>
                  </div>
                  <div className="flex items-center gap-2 text-white/80 text-lg">
                    <Video className="w-5 h-5" />
                    <Phone className="w-5 h-5" />
                    <MoreVertical className="w-5 h-5" />
                  </div>

                </div>
              </div>

              {/* Message body */}
              <div className="p-4 pt-3 space-y-4 text-sm flex flex-col items-start text-left bg-white m-4">
                {/* Header media placeholder (shown when template expects header media) */}
                {(() => {
                  const variableType = selectedTemplate?.variable_type || {};
                  const headerKey = Object.keys(variableType).find((k) => k.startsWith("header_"));
                  const headerType = headerKey ? variableType[headerKey]?.type : null;
                  const shouldShowMedia = headerType && ["image", "video", "document"].includes(headerType.toLowerCase());
                  if (!shouldShowMedia) return null;
                  return (
                    <div className="w-full rounded-lg border border-dashed border-gray-200 bg-gray-50">
                      <div className="aspect-video flex items-center justify-center text-gray-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="h-10 w-12 rounded-md border border-gray-300 bg-gray-100" />
                          <div className="text-xs text-gray-500 capitalize">
                            {headerType.toLowerCase()} preview
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Body text */}
                {selectedTemplatePreview?.body ? (
                  <p className="text-gray-900 text-[15px] leading-7 whitespace-pre-line w-full">
                    {selectedTemplatePreview.body}
                  </p>
                ) : (
                  <p className="text-gray-400 text-center py-6 text-sm w-full">
                    Select a WhatsApp template to preview it here.
                  </p>
                )}

                {/* Footer */}
                {selectedTemplatePreview?.footer && (
                  <p className="text-gray-600 text-sm italic border-t pt-3 w-full">
                    {selectedTemplatePreview.footer}
                  </p>
                )}

                {/* Buttons */}
                {selectedTemplatePreview?.buttons?.length > 0 && (
                  <div className="space-y-2 pt-2 w-full">
                    {selectedTemplatePreview.buttons.map((b, i) => (
                      <button
                        key={`${b}-${i}`}
                        className="flex w-full items-center justify-between bg-blue-50 text-blue-700 py-2 px-3 rounded border border-blue-200 text-sm"
                      >
                        <span>{b}</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => {
                setShowCampaignModal(false);
                setShowChannelModal(true);
              }}
              className="flex-1 border py-2 rounded-lg font-medium"
            >
              Back
            </button>
            <button
              onClick={handleCreateCampaign}
              disabled={loading || !campaignName.trim() || !selectedTemplate}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Next"}
            </button>
          </div>
        </div>
      </Modal>

      {/* === MODAL 3: Upload Audience === */}
      <Modal isOpen={showAudienceModal} onClose={() => setShowAudienceModal(false)} title="Upload Audience">
        <div className="space-y-6">
          {/* Audience Source Selection */}
          <div>
            <label className="block text-sm font-medium mb-3">Select Audience Source</label>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setAudienceSource("csv");
                  setSelectedGroupId("");
                  setSelectedGroupContacts([]);
                }}
                className={`flex-1 px-4 py-3 border-2 rounded-lg font-medium transition ${audienceSource === "csv"
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                  }`}
              >
                <Upload className="w-5 h-5 inline-block mr-2" />
                Upload CSV
              </button>
              <button
                onClick={() => {
                  setAudienceSource("group");
                  setCsvFile(null);
                  setCsvColumns([]);
                  setSelectedMobileColumn("");
                  setPreviewData([]);
                }}
                className={`flex-1 px-4 py-3 border-2 rounded-lg font-medium transition ${audienceSource === "group"
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                  }`}
              >
                <MessageCircle className="w-5 h-5 inline-block mr-2" />
                Select Community
              </button>
            </div>
          </div>

          {/* CSV Upload Section */}
          {audienceSource === "csv" && (
            <div>
              <label className="block text-sm font-medium mb-2">Upload CSV File</label>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500">
                    {csvFile ? csvFile.name : "Click to upload"}
                  </p>
                </div>
                <input type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
              </label>
            </div>
          )}

          {/* Group Selection Section */}
          {audienceSource === "group" && !audienceUploaded && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Contact Group</label>
                {loadingGroups ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-10 h-10 animate-spin text-[#2162B0]" />
                  </div>
                ) : contactGroups.length === 0 ? (
                  <div className="text-center py-8 text-sm text-gray-500 border border-dashed rounded-lg">
                    No contact groups available. Please create a group first.
                  </div>
                ) : (
                  <select
                    value={selectedGroupId}
                    onChange={(e) => {
                      const groupId = e.target.value;
                      setSelectedGroupId(groupId);
                      if (groupId) {
                        fetchGroupContacts(groupId, false);
                      } else {
                        setSelectedGroupContacts([]);
                      }
                    }}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a group...</option>
                    {contactGroups.map((group) => (
                      <option key={group.group_id || group.id} value={group.group_id || group.id}>
                        {group.group_name} ({group.contact_count || 0} contacts)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {loadingGroupContacts && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-10 h-10 animate-spin text-[#2162B0]" />
                  <span className="ml-2 text-sm text-gray-600">Loading contacts...</span>
                </div>
              )}

              {selectedGroupId && selectedGroupContacts.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">
                    Preview ({selectedGroupContacts.length} contacts)
                  </p>
                  <div className="overflow-x-auto text-xs border rounded-lg max-h-40 overflow-y-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Mobile Number</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Caste</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedGroupContacts.slice(0, 10).map((contact, index) => (
                          <tr key={contact.id || index} className="border-t">
                            <td className="px-3 py-2 text-gray-900">{contact.mobile_number || "-"}</td>
                            <td className="px-3 py-2 text-gray-600">{contact.caste || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {selectedGroupContacts.length > 10 && (
                      <div className="px-3 py-2 text-xs text-gray-500 text-center border-t">
                        Showing first 10 of {selectedGroupContacts.length} contacts
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {audienceSource === "csv" && csvColumns.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">Mobile Number Column *</label>
              <select
                value={selectedMobileColumn}
                onChange={e => setSelectedMobileColumn(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {csvColumns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>
          )}

          {audienceSource === "csv" && previewData.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Preview (first 3 rows)</p>
              <div className="overflow-x-auto text-xs">
                <table className="min-w-full border">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(previewData[0]).map(h => (
                        <th key={h} className="px-3 py-2 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, i) => (
                      <tr key={i} className="border-t">
                        {Object.values(row).map((v, j) => (
                          <td key={j} className="px-3 py-2">{v}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowAudienceModal(false);
                setShowCampaignModal(true);
              }}
              className="flex-1 border py-2 rounded-lg font-medium"
            >
              Back
            </button>
            <button
              onClick={handleUploadAudience}
              disabled={
                loading ||
                (audienceSource === "csv" && (!csvFile || !selectedMobileColumn)) ||
                (audienceSource === "group" && !selectedGroupId)
              }
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-10 h-10 animate-spin" /> : "Upload"}
            </button>
          </div>

          {currentCampaign &&
            launchCampaignDetails &&
            (launchCampaignDetails?._id || launchCampaignDetails?.campaign_id) ===
            (currentCampaign?._id || currentCampaign?.campaign_id) && audienceUploaded && (
              <div className="border-t border-gray-100 pt-6 mt-6 space-y-4">
                {uploadedPhoneNumbers.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-800">
                      Uploaded Phone Numbers
                    </h3>
                    <div className="overflow-x-auto text-xs border rounded-lg max-h-40 overflow-y-auto">
                      <table className="min-w-full">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium text-gray-700">Phone Number</th>
                          </tr>
                        </thead>
                        <tbody>
                          {uploadedPhoneNumbers.map((phone, index) => (
                            <tr key={index} className="border-t">
                              <td className="px-3 py-2 text-gray-900">{phone}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-800">
                    Template Body Parameters
                  </h3>
                  {launchRequirements?.required_body_params > 0 ? (
                    Array.from({ length: launchRequirements.required_body_params }).map((_, idx) => {
                      const key = `body_${idx + 1}`;
                      return (
                        <div key={key}>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            {`Body ${idx + 1}`}
                          </label>
                          <input
                            type="text"
                            value={launchBodyValues[key] ?? ""}
                            onChange={(e) => handleLaunchBodyValueChange(key, e.target.value)}
                            placeholder={launchRequirements?.example_request?.[key] || `Value ${idx + 1}`}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-gray-500">
                      This template does not require body parameters.
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap justify-end gap-3">
                  <button
                    onClick={handleOpenTestModal}
                    disabled={
                      testRequirementsLoading ||
                      testingCampaign ||
                      !launchCampaignDetails ||
                      !audienceUploaded
                    }
                    className="inline-flex items-center gap-2 px-4 py-2 border border-amber-500 text-amber-600 rounded-lg text-sm font-medium hover:bg-amber-50 disabled:opacity-50"
                  >
                    <FlaskConical className="w-4 h-4" />
                    Test Message
                  </button>
                  <button
                    onClick={() => {
                      setShowAudienceModal(false);
                      handleLaunchCampaign();
                    }}
                    disabled={!audienceUploaded || launchingCampaign}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50 bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100"
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
        </div>
      </Modal>

      {/* === MODAL 4: Launch Campaign === */}
      <Modal
        isOpen={showLaunchModal}
        onClose={() => {
          setShowLaunchModal(false);
          resetLaunchModalState();
        }}
        title={
          launchCampaignDetails
            ? `Launch: ${launchCampaignDetails?.campaign_name || "Campaign"}`
            : "Launch Campaign"
        }
      >
        {launchModalLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Audience Source Selection */}
            <div>
              <label className="block text-sm font-medium mb-3 text-gray-800 dark:text-[#ececf1]">
                Select Audience Source
              </label>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setLaunchAudienceSource("csv");
                    setLaunchSelectedGroupId("");
                    setLaunchSelectedGroupContacts([]);
                  }}
                  className={`flex-1 px-4 py-3 border-2 rounded-lg font-medium transition ${launchAudienceSource === "csv"
                    ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-[#111111] dark:text-[#60a5fa]"
                    : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 dark:border-[#3d3d3d] dark:bg-transparent dark:text-[#d1d5db] dark:hover:bg-[#353535]"
                    }`}
                >
                  <Upload className="w-5 h-5 inline-block mr-2" />
                  Upload CSV
                </button>
                <button
                  onClick={() => {
                    setLaunchAudienceSource("group");
                    setAudienceCsvFile(null);
                    setAudienceCsvColumns([]);
                    setAudienceSelectedColumn("");
                    setAudiencePreviewData([]);
                  }}
                  className={`flex-1 px-4 py-3 border-2 rounded-lg font-medium transition ${launchAudienceSource === "group"
                    ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-[#111111] dark:text-[#60a5fa]"
                    : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 dark:border-[#3d3d3d] dark:bg-transparent dark:text-[#d1d5db] dark:hover:bg-[#353535]"
                    }`}
                >
                  <MessageCircle className="w-5 h-5 inline-block mr-2" />
                  Select Community
                </button>
              </div>
            </div>

            {/* CSV Upload Section */}
            {launchAudienceSource === "csv" && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-800 dark:text-[#ececf1]">
                  Upload Audience CSV
                </label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 dark:bg-[#1f1f1f] dark:hover:bg-[#353535] dark:border-[#3d3d3d]">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-gray-400 dark:text-[#8e8ea0]" />
                    <p className="mb-2 text-sm text-gray-500 dark:text-[#8e8ea0]">
                      {audienceCsvFile ? audienceCsvFile.name : "Click to upload CSV"}
                    </p>
                  </div>
                  <input type="file" className="hidden" accept=".csv" onChange={handleLaunchFileChange} />
                </label>

                {audienceCsvColumns.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-800 dark:text-[#ececf1] mb-1">
                      Mobile Number Column
                    </label>
                    <select
                      value={audienceSelectedColumn}
                      onChange={(e) => setAudienceSelectedColumn(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm border-gray-300 dark:border-[#3d3d3d] bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-[#ececf1]"
                    >
                      {audienceCsvColumns.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {audiencePreviewData.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-[#d1d5db] mb-2">
                      Preview (first 3 rows)
                    </p>
                    <div className="overflow-x-auto text-xs border rounded-lg border-gray-200 dark:border-[#3d3d3d] bg-white dark:bg-[#2d2d2d]">
                      <table className="min-w-full">
                        <thead className="bg-gray-50 dark:bg-[#1f1f1f]">
                          <tr>
                            {audienceCsvColumns.map((header) => (
                              <th
                                key={header}
                                className="px-3 py-2 text-left font-medium text-gray-700 dark:text-[#d1d5db]"
                              >
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {audiencePreviewData.map((row, idx) => (
                            <tr key={idx} className="border-t border-gray-200 dark:border-[#3d3d3d]">
                              {audienceCsvColumns.map((header) => (
                                <td key={header} className="px-3 py-2 text-gray-900 dark:text-[#ececf1]">
                                  {row[header] || "—"}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleUploadAudienceForLaunch}
                    disabled={
                      audienceUploading ||
                      (launchAudienceSource === "csv" && (!audienceCsvFile || !audienceSelectedColumn)) ||
                      (launchAudienceSource === "group" && !launchSelectedGroupId)
                    }
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 hover:bg-blue-700 transition dark:bg-blue-500 dark:hover:bg-blue-400"
                  >
                    {audienceUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    Upload Audience
                  </button>
                  {launchCampaignDetails?.contact_selection?.estimated_count > 0 && (
                    <span className="text-xs text-gray-500 self-center">
                      Existing contacts: {launchCampaignDetails.contact_selection.estimated_count.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Group Selection Section for Launch Modal */}
            {launchAudienceSource === "group" && !audienceUploaded && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-800 dark:text-[#ececf1]">
                    Select Contact Group
                  </label>
                  {loadingGroups ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    </div>
                  ) : contactGroups.length === 0 ? (
                    <div className="text-center py-8 text-sm text-gray-500 dark:text-[#8e8ea0] border border-dashed rounded-lg dark:border-[#3d3d3d]">
                      No contact groups available. Please create a group first.
                    </div>
                  ) : (
                    <select
                      value={launchSelectedGroupId}
                      onChange={(e) => {
                        const groupId = e.target.value;
                        setLaunchSelectedGroupId(groupId);
                        if (groupId) {
                          fetchGroupContacts(groupId, true);
                        } else {
                          setLaunchSelectedGroupContacts([]);
                        }
                      }}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 dark:border-[#3d3d3d] bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-[#ececf1]"
                    >
                      <option value="">Select a group...</option>
                      {contactGroups.map((group) => (
                        <option key={group.group_id || group.id} value={group.group_id || group.id}>
                          {group.group_name} ({group.contact_count || 0} contacts)
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {loadingLaunchGroupContacts && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-10 h-10 animate-spin text-[#2162B0]" />
                    <span className="ml-2 text-sm text-gray-600">Loading contacts...</span>
                  </div>
                )}

                {launchSelectedGroupId && launchSelectedGroupContacts.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2 text-gray-800 dark:text-[#ececf1]">
                      Preview ({launchSelectedGroupContacts.length} contacts)
                    </p>
                    <div className="overflow-x-auto text-xs border rounded-lg max-h-40 overflow-y-auto border-gray-200 dark:border-[#3d3d3d] bg-white dark:bg-[#2d2d2d]">
                      <table className="min-w-full">
                        <thead className="bg-gray-50 dark:bg-[#1f1f1f] sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-[#d1d5db]">
                              Mobile Number
                            </th>
                            <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-[#d1d5db]">
                              Caste
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {launchSelectedGroupContacts.slice(0, 10).map((contact, index) => (
                            <tr key={contact.id || index} className="border-t border-gray-200 dark:border-[#3d3d3d]">
                              <td className="px-3 py-2 text-gray-900 dark:text-[#ececf1]">
                                {contact.mobile_number || "-"}
                              </td>
                              <td className="px-3 py-2 text-gray-600 dark:text-[#8e8ea0]">
                                {contact.caste || "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {launchSelectedGroupContacts.length > 10 && (
                        <div className="px-3 py-2 text-xs text-gray-500 dark:text-[#8e8ea0] text-center border-t border-gray-200 dark:border-[#3d3d3d]">
                          Showing first 10 of {launchSelectedGroupContacts.length} contacts
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleUploadAudienceForLaunch}
                    disabled={!launchSelectedGroupId || loadingLaunchGroupContacts || audienceUploading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 hover:bg-blue-700 transition dark:bg-blue-500 dark:hover:bg-blue-400"
                  >
                    {audienceUploading || loadingLaunchGroupContacts ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    Upload Group Contacts
                  </button>
                  {launchCampaignDetails?.contact_selection?.estimated_count > 0 && (
                    <span className="text-xs text-gray-500 self-center">
                      Existing contacts: {launchCampaignDetails.contact_selection.estimated_count.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            )}





            {/* Header Media Upload Section */}
            {launchRequirements?.required_header_params > 0 && (
              <div className="space-y-3 border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-[#ececf1]">
                  Upload {launchRequirements.header_type.charAt(0).toUpperCase() + launchRequirements.header_type.slice(1).toLowerCase()}
                </h3>
                <div>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 dark:bg-[#1f1f1f] dark:hover:bg-[#353535] dark:border-[#3d3d3d]">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-400 dark:text-[#8e8ea0]" />
                      <p className="mb-2 text-sm text-gray-500 dark:text-[#8e8ea0]">
                        <span className="font-semibold">Click to upload {launchRequirements.header_type.toLowerCase()}</span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-[#8e8ea0]">
                        {launchRequirements.header_type.toLowerCase() === 'image' ? 'JPG, JPEG, PNG (max 5MB)' :
                          launchRequirements.header_type.toLowerCase() === 'video' ? 'MP4, 3GP, 3GPP (max 16MB)' :
                            'PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX (max 100MB)'}
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept={
                        launchRequirements.header_type.toLowerCase() === 'image' ? '.jpg,.jpeg,.png' :
                          launchRequirements.header_type.toLowerCase() === 'video' ? '.mp4,.3gp,.3gpp' :
                            '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx'
                      }
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        // Validate file before upload
                        const validation = validateMediaFile(file, launchRequirements.header_type);
                        if (!validation.valid) {
                          message.error(validation.error);
                          e.target.value = ''; // Reset file input
                          return;
                        }

                        setAudienceUploading(true);
                        try {
                          const response = await uploadCampaignMedia(file, integratedNumber);

                          if (response.success && response.url) {
                            handleLaunchBodyValueChange('header_1', response.url);
                            // Store filename if provided (for videos and documents)
                            if (response.filename) {
                              handleLaunchBodyValueChange('header_filename', response.filename);
                            }
                            message.success(response.message || 'Media uploaded successfully!');
                          } else {
                            message.error('Failed to upload media');
                          }
                        } catch (error) {
                          console.error('Media upload error:', error);
                          message.error(error?.response?.data?.detail || 'Failed to upload media');
                        } finally {
                          setAudienceUploading(false);
                        }
                      }}
                    />
                  </label>
                  {launchBodyValues['header_1'] && (
                    <div className="mt-2 flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
                      <Check className="w-4 h-4" />
                      <span>Media uploaded successfully</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Body Parameters Section */}
            {(() => {
              const hasRequirements = !!launchRequirements;
              console.log('🔍 Body Parameters Render Check:', {
                hasRequirements,
                required_body_params: launchRequirements?.required_body_params,
                launchRequirements,
                willRender: hasRequirements
              });
              return hasRequirements;
            })() && (
                <div className="space-y-3 border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-[#ececf1]">
                    Template Body Parameters
                  </h3>
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
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm border-gray-300 dark:border-[#3d3d3d] bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-[#ececf1]"
                          />
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-[#8e8ea0]">
                      This template does not require body parameters.
                    </p>
                  )}
                </div>
              )}

            <div className="flex flex-wrap justify-end gap-3 pt-4">
              <button
                onClick={() => {
                  setShowLaunchModal(false);
                  resetLaunchModalState();
                }}
                className="px-4 py-2 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 border-gray-300 dark:border-[#3d3d3d] text-gray-700 dark:text-[#d1d5db] dark:hover:bg-[#353535]"
              >
                Cancel
              </button>

              {/* Only show Test and Launch buttons after audience is uploaded */}
              {audienceUploaded && (
                <>
                  <button
                    onClick={handleOpenTestModal}
                    disabled={testRequirementsLoading || testingCampaign || launchCampaignDetails == null}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-amber-500 text-amber-600 rounded-lg text-sm font-medium hover:bg-amber-50 disabled:opacity-50"
                  >
                    <FlaskConical className="w-4 h-4" />
                    Test Message
                  </button>
                  <button
                    onClick={handleLaunchCampaign}
                    disabled={launchingCampaign}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50 bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100"
                  >
                    {launchingCampaign ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Rocket className="w-4 h-4" />
                    )}
                    Launch Campaigncc
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* === MODAL 5: Test Campaign === */}
      <Modal
        isOpen={showTestModal}
        onClose={closeTestModal}
        title="Send Test Message"
      >
        {testRequirementsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="space-y-5">
            {testRequirements && (
              <div className="p-4 border rounded-lg bg-blue-50 text-sm text-gray-700">
                <p className="font-medium mb-1">Template requirements</p>
                <p className="text-xs text-gray-600">{testRequirements?.message}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Test Phone Number (with country code)
              </label>
              <input
                type="text"
                value={testPhoneNumber}
                onChange={(e) => setTestPhoneNumber(e.target.value)}
                placeholder="e.g., 919876543210"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* Header Media Upload Section for Test */}
            {testRequirements?.header_type && ['image', 'video', 'document'].includes(testRequirements.header_type.toLowerCase()) && (
              <div className="space-y-3 border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-800">
                  Upload {testRequirements.header_type.charAt(0).toUpperCase() + testRequirements.header_type.slice(1).toLowerCase()}
                </h3>
                <div>
                  <input
                    type="file"
                    accept={
                      testRequirements.header_type.toLowerCase() === 'image' ? '.jpg,.jpeg,.png' :
                        testRequirements.header_type.toLowerCase() === 'video' ? '.mp4,.3gp,.3gpp' :
                          '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx'
                    }
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      // Validate file before upload
                      const validation = validateMediaFile(file, testRequirements.header_type);
                      if (!validation.valid) {
                        message.error(validation.error);
                        e.target.value = ''; // Reset file input
                        return;
                      }

                      setTestingCampaign(true);

                      try {
                        const response = await uploadCampaignMedia(file, integratedNumber);

                        if (response.success && response.url) {
                          handleTestBodyValueChange('header_1', response.url);
                          // Store filename if provided (for videos and documents)
                          if (response.filename) {
                            handleTestBodyValueChange('header_filename', response.filename);
                          }
                          message.success(response.message || 'Media uploaded successfully!');
                        } else {
                          message.error('Failed to upload media');
                        }
                      } catch (error) {
                        console.error('Upload error:', error);
                        message.error(error?.response?.data?.detail || 'Failed to upload media');
                      } finally {
                        setTestingCampaign(false);
                      }
                    }}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  {testBodyValues['header_1'] && (
                    <div className="mt-2 flex items-center gap-2 text-green-600 text-sm">
                      <Check className="w-4 h-4" />
                      <span>Media uploaded successfully</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Body Parameters Section */}
            <div className="space-y-3 border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-800">Body Parameters</h3>
              {testRequirements?.required_body_params > 0 ? (
                Array.from({ length: testRequirements.required_body_params }).map((_, idx) => {
                  const key = `body_${idx + 1}`;
                  return (
                    <div key={key}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        {`Body ${idx + 1}`}
                      </label>
                      <input
                        type="text"
                        value={testBodyValues[key] ?? ""}
                        onChange={(e) => handleTestBodyValueChange(key, e.target.value)}
                        placeholder={testRequirements?.example_request?.[key] || `Value ${idx + 1}`}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-gray-500">
                  This template does not require body parameters.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={closeTestModal}
                className="px-4 py-2 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSendTestMessage}
                disabled={testingCampaign}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50"
              >
                {testingCampaign ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Send Test
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* === DELETE CONFIRMATION MODAL === */}
      <Modal
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        title="Confirm Deletion"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-800">
            Are you sure you want to delete this campaign? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowDeleteConfirmation(false)}
              className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteCampaign}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-10 h-10 mr-2 animate-spin" /> : "Delete"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}