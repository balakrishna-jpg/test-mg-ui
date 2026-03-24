import { useState, useEffect } from "react";
import { useNavigate } from "@remix-run/react";
import { message } from "antd";
import {
  inviteAgent,
  getAssemblyConstituencies,
  listInvites,
  getStateAndConstituencyWiseBooths,
  getAgents,
  getAgentScope,
  updateAgentScope,
  promoteAgentToAdmin,
  getAdminByOrganizationwise
} from "~/api";
import { getSubscriptionProductsDetails } from "~/utils/subscriptions";
import { hasAccessToProduct } from "~/utils/session";
import {
  Clock,
  Mail,
  Send,
  X,
  Users,
  Check,
  ChevronDown,
  ChevronUp,
  Trash2,
  Search,
  Shield,
  Loader2,
  Edit3,
  ArrowUp,
} from "lucide-react";

export default function AdminPanel() {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [emails, setEmails] = useState("");
  const [assignedConstituencies, setAssignedConstituencies] = useState([]);
  const [boothsByConstituency, setBoothsByConstituency] = useState({});
  const [selectedBoothsByConstituency, setSelectedBoothsByConstituency] = useState(
    {}
  );
  const [boothLoadingByConstituency, setBoothLoadingByConstituency] = useState(
    {}
  );
  const [assignedProductSkus, setAssignedProductSkus] = useState([]);
  const [productPermissions, setProductPermissions] = useState({}); // { [skuCode]: { view, edit, add, delete } }
  const [availableProductsForInvite, setAvailableProductsForInvite] = useState([]);
  const [loadingProductsForInvite, setLoadingProductsForInvite] = useState(false);
  const [selectAllConstituencies, setSelectAllConstituencies] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    constituencies: true,
    permissions: true,
    products: true,
    invites: true,
    agents: true,
    admins: true,
  });
  const [constituencies, setConstituencies] = useState([]);
  const [filteredConstituencies, setFilteredConstituencies] = useState([]);
  const [constituencySearch, setConstituencySearch] = useState("");
  const [invites, setInvites] = useState([]);
  const [inviteSummary, setInviteSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [inviteMessage, setInviteMessage] = useState(null);
  const [userStateId, setUserStateId] = useState(null);
  const [agents, setAgents] = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [agentsError, setAgentsError] = useState(null);
  const [showEditAgentModal, setShowEditAgentModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [editAssignedConstituencies, setEditAssignedConstituencies] = useState([]);
  const [editBoothsByConstituency, setEditBoothsByConstituency] = useState({});
  const [editSelectedBoothsByConstituency, setEditSelectedBoothsByConstituency] =
    useState({});
  const [editBoothLoadingByConstituency, setEditBoothLoadingByConstituency] = useState(
    {}
  );
  const [editAssignedProductSkus, setEditAssignedProductSkus] = useState([]);
  const [editProductPermissions, setEditProductPermissions] = useState({}); // { [skuCode]: { view, edit, add, delete } }
  const [availableProductsForEdit, setAvailableProductsForEdit] = useState([]);
  const [loadingProductsForEdit, setLoadingProductsForEdit] = useState(false);
  const [editAgentLoading, setEditAgentLoading] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [promotingAgent, setPromotingAgent] = useState(null);
  const [promotingLoading, setPromotingLoading] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [adminsError, setAdminsError] = useState(null);
  const [activeTab, setActiveTab] = useState("invites");

  const navigate = useNavigate();

  // Elections product SKU — constituencies section is shown only when user selects Elections to assign
  const ELECTIONS_PRODUCT_SKU = "SKU005";
  const showConstituenciesSection = assignedProductSkus.includes(ELECTIONS_PRODUCT_SKU);
  const showEditConstituenciesSection = editAssignedProductSkus.includes(ELECTIONS_PRODUCT_SKU);

  // Helpers
  const parseEmails = (emailString) =>
    emailString
      .trim()
      .split(/[,\s\n]+/)
      .map((email) => email.trim())
      .filter((email) => email.length > 0);

  const validEmailCount = parseEmails(emails).filter((email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ).length;

  // Fetch invites (+ summary)
  const fetchInvites = async () => {
    try {
      const data = await listInvites();
      setInvites(data?.invites || []);
      setInviteSummary(
        data?.summary || {
          invites: { pending: 0, used: 0, revoked: 0 },
          agents_count: 0,
          admins_count: 0,
        }
      );
    } catch (err) {
      console.error("Fetch invites error:", err?.response?.data || err?.message);
      setError("");
      setInviteSummary({
        invites: { pending: 0, used: 0, revoked: 0 },
        agents_count: 0,
        admins_count: 0,
      });
    }
  };

  // Fetch admins for this organization
  const fetchAdmins = async () => {
    setAdminsLoading(true);
    setAdminsError(null);
    try {
      const data = await getAdminByOrganizationwise();
      setAdmins(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch admins error:", err);
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load admins.";
      setAdminsError(msg);
    } finally {
      setAdminsLoading(false);
    }
  };

  // Fetch agents for this admin's organization
  const fetchAgents = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setAgentsError("You must be logged in as an admin to view agents.");
      setAgents([]);
      return;
    }

    setAgentsLoading(true);
    setAgentsError(null);
    try {
      const data = await getAgents(token);
      setAgents(data?.agents || []);
    } catch (err) {
      console.error("Fetch agents error:", err);
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load agents.";
      setAgentsError(msg);
    } finally {
      setAgentsLoading(false);
    }
  };

  // Restrict access to admins and agents only
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user_info") || "{}");
    const roleLower = (userData.role || "").toLowerCase();
    if (roleLower !== "admin" && roleLower !== "agent") {
      setError("Access denied: Only admins and agents can access this panel.");
      navigate("/login");
    } else {
      if (userData.state_id) {
        setUserStateId(Number(userData.state_id));
      }
      fetchInvites();
      fetchAgents();
      fetchAdmins();
    }
  }, [navigate]);

  // Fetch constituencies
  useEffect(() => {
    const fetchConstituencies = async () => {
      try {
        const response = await getAssemblyConstituencies(21);
        if (response && Array.isArray(response.constituencies)) {
          const constituenciesData = response.constituencies.map((c) => ({
            ...c,
            assembly_constituency_no: Number(c.assembly_constituency_no),
          }));
          setConstituencies(constituenciesData);
          setFilteredConstituencies(constituenciesData);
        } else {
          setError("Constituencies data is not in the expected format.");
        }
      } catch (err) {
        console.error(
          "Fetch constituencies error:",
          err?.response?.data || err?.message
        );
        setError("");
      }
    };
    fetchConstituencies();
  }, []);

  // Load available products for invite when modal opens (org's subscribed products)
  useEffect(() => {
    if (!showInviteModal) return;
    const userData = JSON.parse(localStorage.getItem("user_info") || "{}");
    let cancelled = false;
    setLoadingProductsForInvite(true);
    getSubscriptionProductsDetails()
      .then((res) => {
        if (cancelled) return;
        const products = res?.products || [];
        const available = products.filter((p) => p?.skuCode && hasAccessToProduct(userData, p.skuCode));
        setAvailableProductsForInvite(available.map((p) => ({ skuCode: p.skuCode, name: p.name || p.skuCode })));
      })
      .catch(() => {
        if (!cancelled) setAvailableProductsForInvite([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingProductsForInvite(false);
      });
    return () => { cancelled = true; };
  }, [showInviteModal]);

  // Load available products when Edit Agent modal opens (same as invite: org's subscribed products admin has access to)
  useEffect(() => {
    if (!showEditAgentModal) return;
    const userData = JSON.parse(localStorage.getItem("user_info") || "{}");
    let cancelled = false;
    setLoadingProductsForEdit(true);
    getSubscriptionProductsDetails()
      .then((res) => {
        if (cancelled) return;
        const products = res?.products || [];
        const available = products.filter((p) => p?.skuCode && hasAccessToProduct(userData, p.skuCode));
        setAvailableProductsForEdit(available.map((p) => ({ skuCode: p.skuCode, name: p.name || p.skuCode })));
      })
      .catch(() => {
        if (!cancelled) setAvailableProductsForEdit([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingProductsForEdit(false);
      });
    return () => { cancelled = true; };
  }, [showEditAgentModal]);

  // Filter constituencies based on search
  useEffect(() => {
    if (constituencySearch.trim() === "") {
      setFilteredConstituencies(constituencies);
    } else {
      const filtered = constituencies.filter(
        (constituency) =>
          constituency.assembly_constituency_name
            .toLowerCase()
            .includes(constituencySearch.toLowerCase()) ||
          constituency.assembly_constituency_no
            .toString()
            .includes(constituencySearch)
      );
      setFilteredConstituencies(filtered);
    }
  }, [constituencySearch, constituencies]);

  // Select all constituencies toggle effect
  useEffect(() => {
    if (selectAllConstituencies) {
      setAssignedConstituencies(
        filteredConstituencies.map((c) => c.assembly_constituency_no)
      );
    } else {
      setAssignedConstituencies([]);
    }
  }, [selectAllConstituencies, filteredConstituencies]);

  const handleConstituencyToggle = async (constituencyNo) => {
    setAssignedConstituencies((prev) => {
      const newSelection = prev.includes(constituencyNo)
        ? prev.filter((id) => id !== constituencyNo)
        : [...prev, constituencyNo];

      setSelectAllConstituencies(newSelection.length === filteredConstituencies.length);
      return newSelection;
    });

    // When constituency is selected, fetch booths for that constituency
    const isSelecting = !assignedConstituencies.includes(constituencyNo);
    if (isSelecting && userStateId) {
      // Avoid refetch if already loaded
      if (boothsByConstituency[constituencyNo]) {
        return;
      }

      try {
        setBoothLoadingByConstituency((prev) => ({
          ...prev,
          [constituencyNo]: true,
        }));
        const booths = await getStateAndConstituencyWiseBooths(
          userStateId,
          constituencyNo
        );
        setBoothsByConstituency((prev) => ({
          ...prev,
          [constituencyNo]: Array.isArray(booths) ? booths : [],
        }));
      } catch (err) {
        console.error("Fetch booths error:", err?.response?.data || err?.message);
        message.error("Failed to load booths for this constituency");
        setBoothsByConstituency((prev) => ({
          ...prev,
          [constituencyNo]: [],
        }));
      } finally {
        setBoothLoadingByConstituency((prev) => ({
          ...prev,
          [constituencyNo]: false,
        }));
      }
    } else {
      // If unselecting constituency, clear any selected booths for it
      setSelectedBoothsByConstituency((prev) => {
        const updated = { ...prev };
        delete updated[constituencyNo];
        return updated;
      });
    }
  };

  const handleBoothSelectionChange = (constituencyNo, pollingStationNo) => {
    setSelectedBoothsByConstituency((prev) => {
      const existing = prev[constituencyNo] || [];
      const isAlreadySelected = existing.includes(pollingStationNo);
      const updated = isAlreadySelected
        ? existing.filter((id) => id !== pollingStationNo)
        : [...existing, pollingStationNo];
      return {
        ...prev,
        [constituencyNo]: updated,
      };
    });
  };

  const handleEditBoothSelectionChange = (constituencyNo, pollingStationNo) => {
    setEditSelectedBoothsByConstituency((prev) => {
      const existing = prev[constituencyNo] || [];
      const isAlreadySelected = existing.includes(pollingStationNo);
      const updated = isAlreadySelected
        ? existing.filter((id) => id !== pollingStationNo)
        : [...existing, pollingStationNo];
      return {
        ...prev,
        [constituencyNo]: updated,
      };
    });
  };

  const ensureEditBoothsLoaded = async (constituencyNo) => {
    if (!userStateId) return;
    if (editBoothsByConstituency[constituencyNo]) return;

    try {
      setEditBoothLoadingByConstituency((prev) => ({
        ...prev,
        [constituencyNo]: true,
      }));
      const booths = await getStateAndConstituencyWiseBooths(userStateId, constituencyNo);
      setEditBoothsByConstituency((prev) => ({
        ...prev,
        [constituencyNo]: Array.isArray(booths) ? booths : [],
      }));
    } catch (err) {
      console.error("Fetch booths (edit) error:", err?.response?.data || err?.message);
      message.error("Failed to load booths for this constituency");
      setEditBoothsByConstituency((prev) => ({
        ...prev,
        [constituencyNo]: [],
      }));
    } finally {
      setEditBoothLoadingByConstituency((prev) => ({
        ...prev,
        [constituencyNo]: false,
      }));
    }
  };

  const handleEditConstituencyToggle = async (constituencyNo) => {
    setEditAssignedConstituencies((prev) => {
      const newSelection = prev.includes(constituencyNo)
        ? prev.filter((id) => id !== constituencyNo)
        : [...prev, constituencyNo];
      return newSelection;
    });

    const isSelecting = !editAssignedConstituencies.includes(constituencyNo);
    if (isSelecting) {
      await ensureEditBoothsLoaded(constituencyNo);
    } else {
      setEditSelectedBoothsByConstituency((prev) => {
        const updated = { ...prev };
        delete updated[constituencyNo];
        return updated;
      });
    }
  };

  const openEditAgentModal = async (agent) => {
    setEditingAgent(agent);
    // Prefer scope from GET /agents/:id/scope so product selection is correct; fall back to list agent
    let scopeAgent = { ...agent };
    const token = localStorage.getItem("token");
    if (token && agent?.user_id) {
      try {
        const scope = await getAgentScope(token, agent.user_id);
        if (scope && typeof scope === "object") {
          scopeAgent = { ...agent, ...scope };
        }
      } catch (_) {
        // No GET scope endpoint or error — use agent from list (ensure list returns assigned_product_skus)
      }
    }

    // Products: same shape as invite — support snake_case, camelCase, and array-of-objects from API
    const rawSkus = scopeAgent.assigned_product_skus ?? scopeAgent.assignedProductSkus;
    let skus = [];
    if (Array.isArray(rawSkus)) {
      skus = rawSkus.map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") return item.skuCode ?? item.sku_code ?? "";
        return "";
      }).filter(Boolean);
    }
    setEditAssignedProductSkus(skus);
    const prodPerms = scopeAgent.product_permissions ?? scopeAgent.productPermissions ?? {};
    const initialEditProductPerms = {};
    skus.forEach((sku) => {
      const p = prodPerms[sku];
      initialEditProductPerms[sku] = {
        view: p?.view !== false,
        edit: !!p?.edit,
        add: !!p?.add,
        delete: !!p?.delete,
      };
    });
    setEditProductPermissions(initialEditProductPerms);

    const acs = Array.isArray(scopeAgent.assigned_constituencies)
      ? scopeAgent.assigned_constituencies.map((x) => Number(x)).filter((x) => !Number.isNaN(x))
      : [];
    setEditAssignedConstituencies(acs);

    const boothsMap = {};
    if (Array.isArray(scopeAgent.assigned_booths)) {
      scopeAgent.assigned_booths.forEach((b) => {
        if (!b) return;
        const acNo = Number(
          b.assembly_constituency_no ??
          b.ac_no ??
          b.ac ??
          b.constituency_no
        );
        const boothNo = Number(
          b.polling_station_no ??
          b.booth_no ??
          b.booth
        );
        if (!Number.isNaN(acNo) && !Number.isNaN(boothNo)) {
          if (!boothsMap[acNo]) boothsMap[acNo] = [];
          if (!boothsMap[acNo].includes(boothNo)) {
            boothsMap[acNo].push(boothNo);
          }
        }
      });
    }
    setEditSelectedBoothsByConstituency(boothsMap);

    // Booths are loaded lazily when the user expands a constituency in the edit modal.
    // Do NOT preload here — that would trigger one API call per assigned constituency on every Edit click.

    setShowEditAgentModal(true);
  };

  const resetEditAgentModal = () => {
    setShowEditAgentModal(false);
    setEditingAgent(null);
    setEditAssignedConstituencies([]);
    setEditBoothsByConstituency({});
    setEditSelectedBoothsByConstituency({});
    setEditBoothLoadingByConstituency({});
    setEditAssignedProductSkus([]);
    setEditProductPermissions({});
    setEditAgentLoading(false);
  };

  const openPromoteModal = (agent) => {
    setPromotingAgent(agent);
    setShowPromoteModal(true);
  };

  const resetPromoteModal = () => {
    setShowPromoteModal(false);
    setPromotingAgent(null);
    setPromotingLoading(false);
  };

  const handlePromoteAgent = async () => {
    if (!promotingAgent) return;

    setPromotingLoading(true);
    try {
      const result = await promoteAgentToAdmin(promotingAgent.user_id);

      if (result.success) {
        const newCount = result.data?.constituencies?.new_count;
        const msgSuffix = newCount !== undefined ? ` and granted access to all ${newCount} constituencies in their state` : "";
        message.success(
          `Agent ${promotingAgent.full_name || promotingAgent.email} promoted to admin successfully${msgSuffix}`
        );
        await fetchAgents();
        await fetchInvites(); // Refresh to update admin count
        resetPromoteModal();
      } else {
        const errorMsg = result.error?.message || "Failed to promote agent to admin";
        message.error(errorMsg);
      }
    } catch (err) {
      console.error("Promote agent error:", err);
      message.error(
        "Failed to promote agent: " +
        (err?.response?.data?.detail || err?.message || "Unknown error")
      );
    } finally {
      setPromotingLoading(false);
    }
  };

  const handleEditAgentSubmit = async (e) => {
    e.preventDefault();
    if (!editingAgent) return;

    const token = localStorage.getItem("token");
    if (!token) {
      message.error("You must be logged in as an admin to update agents.");
      return;
    }

    if (showEditConstituenciesSection && editAssignedConstituencies.length === 0) {
      message.error("Please select at least one constituency when Elections is assigned.");
      return;
    }

    const assignedBoothsPayload = [];
    if (userStateId && showEditConstituenciesSection) {
      editAssignedConstituencies.forEach((constituencyNo) => {
        const selectedBooths =
          editSelectedBoothsByConstituency[constituencyNo] || [];
        selectedBooths.forEach((pollingStationNo) => {
          assignedBoothsPayload.push({
            state_id: userStateId,
            assembly_constituency_no: constituencyNo,
            polling_station_no: pollingStationNo,
          });
        });
      });
    }

    const payload = {
      assigned_product_skus: editAssignedProductSkus,
      ...(Object.keys(editProductPermissions).length > 0 && { product_permissions: editProductPermissions }),
      assigned_constituencies: showEditConstituenciesSection ? editAssignedConstituencies : [],
      assigned_booths: showEditConstituenciesSection ? assignedBoothsPayload : [],
    };

    setEditAgentLoading(true);
    try {
      await updateAgentScope(token, editingAgent.user_id, payload);
      message.success("Agent scope updated");
      await fetchAgents();
      resetEditAgentModal();
    } catch (err) {
      console.error("Update agent scope (full) error:", err);
      message.error(
        "Failed to update agent: " +
        (err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.message ||
          "Unknown error")
      );
    } finally {
      setEditAgentLoading(false);
    }
  };

  // Invite submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInviteMessage(null);

    const emailList = parseEmails(emails);
    const validEmails = emailList.filter((email) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    );

    if (validEmails.length === 0) {
      setError("Please enter at least one valid email address.");
      setLoading(false);
      return;
    }

    if (showConstituenciesSection && assignedConstituencies.length === 0) {
      setError("Please select at least one constituency.");
      setLoading(false);
      return;
    }

    // Build assigned_booths payload from selected booths
    const assignedBooths = [];
    if (userStateId) {
      assignedConstituencies.forEach((constituencyNo) => {
        const selectedBooths = selectedBoothsByConstituency[constituencyNo] || [];
        selectedBooths.forEach((pollingStationNo) => {
          assignedBooths.push({
            state_id: userStateId,
            assembly_constituency_no: constituencyNo,
            polling_station_no: pollingStationNo,
          });
        });
      });
    }

    // Build product_permissions: only for assigned SKUs, keys view/edit/add/delete
    const product_permissions = {};
    assignedProductSkus.forEach((sku) => {
      const perms = productPermissions[sku] || { view: true, edit: false, add: false, delete: false };
      product_permissions[sku] = {
        view: !!perms.view,
        edit: !!perms.edit,
        add: !!perms.add,
        delete: !!perms.delete,
      };
    });

    try {
      const promises = validEmails.map((email) =>
        inviteAgent({
          email,
          assigned_constituencies: assignedConstituencies,
          ...(assignedBooths.length > 0 && { assigned_booths: assignedBooths }),
          assigned_product_skus: assignedProductSkus,
          ...(Object.keys(product_permissions).length > 0 && { product_permissions }),
        })
      );

      const results = await Promise.allSettled(promises);
      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failedEmails = [];
      const otherErrors = [];

      // Analyze failed results
      results.forEach((result, index) => {
        if (result.status === "rejected") {
          const errorDetail = result.reason?.detail

          if (errorDetail === "User with this email already exists") {
            failedEmails.push(validEmails[index]);
          } else {
            otherErrors.push(result.reason);
          }
        }
      });

      // Show success message for successful invitations
      if (successful > 0) {
        message.success(`Successfully sent ${successful} invitations.`);
      }

      // Show warning for existing users
      if (failedEmails.length > 0) {
        message.warning(`User already exist with this : ${failedEmails.join(", ")}`);
      }

      // Handle other errors
      if (otherErrors.length > 0) {
        setError(
          `Failed to send ${otherErrors.length} invitation(s): ${otherErrors
            .map((err) => err?.response?.data?.detail || err?.message)
            .join(", ")}`
        );
      }

      await fetchInvites();
      setEmails("");
      setAssignedConstituencies([]);
      setBoothsByConstituency({});
      setSelectedBoothsByConstituency({});
      setBoothLoadingByConstituency({});
      setAssignedProductSkus([]);
      setProductPermissions({});
      setSelectAllConstituencies(false);
      setShowInviteModal(false);
    } catch (err) {
      console.error(
        "Invite agent error:",
        err?.response?.data || err?.message
      );
      setError(
        "Failed to send invitations: " +
        (err?.response?.data?.detail || err?.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const pendingCount = inviteSummary?.invites?.pending ?? 0;
  const usedCount = inviteSummary?.invites?.used ?? 0;
  const revokedCount = inviteSummary?.invites?.revoked ?? 0;
  const agentsCount = inviteSummary?.agents_count ?? 0;
  const adminsCount = inviteSummary?.admins_count ?? 0;

  const resetModal = () => {
    setShowInviteModal(false);
    setEmails("");
    setAssignedConstituencies([]);
    setBoothsByConstituency({});
    setSelectedBoothsByConstituency({});
    setBoothLoadingByConstituency({});
    setAssignedProductSkus([]);
    setProductPermissions({});
    setSelectAllConstituencies(false);
    setConstituencySearch("");
    setError(null);
    setInviteMessage(null);
  };

  const defaultProductPerms = () => ({ view: true, edit: false, add: false, delete: false });

  const handleProductSkuToggle = (skuCode) => {
    setAssignedProductSkus((prev) => {
      const next = prev.includes(skuCode) ? prev.filter((s) => s !== skuCode) : [...prev, skuCode];
      return next;
    });
    setProductPermissions((prev) => {
      const next = { ...prev };
      if (next[skuCode]) {
        delete next[skuCode];
      } else {
        next[skuCode] = defaultProductPerms();
      }
      return next;
    });
  };

  const handleProductPermissionToggle = (skuCode, permKey) => {
    setProductPermissions((prev) => {
      const current = prev[skuCode] || defaultProductPerms();
      return {
        ...prev,
        [skuCode]: { ...current, [permKey]: !current[permKey] },
      };
    });
  };

  const handleEditProductSkuToggle = (skuCode) => {
    setEditAssignedProductSkus((prev) => {
      const next = prev.includes(skuCode) ? prev.filter((s) => s !== skuCode) : [...prev, skuCode];
      return next;
    });
    setEditProductPermissions((prev) => {
      const next = { ...prev };
      if (next[skuCode]) {
        delete next[skuCode];
      } else {
        next[skuCode] = defaultProductPerms();
      }
      return next;
    });
  };

  const handleEditProductPermissionToggle = (skuCode, permKey) => {
    setEditProductPermissions((prev) => {
      const current = prev[skuCode] || defaultProductPerms();
      return {
        ...prev,
        [skuCode]: { ...current, [permKey]: !current[permKey] },
      };
    });
  };

  return (
    <div className="p-4 w-full min-h-screen bg-white dark:bg-[#262626] text-gray-900 dark:text-[#ececf1]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Admin Panel</h1>
        <button
          onClick={() => setShowInviteModal(true)}
          className="w-full sm:w-auto bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-[0_4px_14px_0_rgba(0,0,0,0.15)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.2)] px-4 py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm font-semibold"
        >
          <Users className="h-4 w-4" />
          Invite Users
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-[#3b0f0f] border border-red-200 dark:border-red-500 text-red-700 dark:text-red-200 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      {/* Top metrics row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white dark:bg-[#1a1a1a] p-5 rounded-xl border border-gray-200 dark:border-[#333] shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <Users className="h-6 w-6 text-blue-500 flex-shrink-0" />
            <div className="ml-3 min-w-0">
              <span className="text-xs font-medium text-gray-500 block">
                Total Agents
              </span>
              <span className="text-xl font-bold ">{agentsCount}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a1a1a] p-5 rounded-xl border border-gray-200 dark:border-[#333] shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <Shield className="h-6 w-6 text-amber-500 flex-shrink-0" />
            <div className="ml-3 min-w-0">
              <span className="text-xs font-medium text-gray-500 block">Admins</span>
              <span className="text-xl font-bold">{adminsCount}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a1a1a] p-5 rounded-xl border border-gray-200 dark:border-[#333] shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <Clock className="h-6 w-6 text-orange-500 flex-shrink-0" />
            <div className="ml-3 min-w-0">
              <span className="text-xs font-medium text-gray-500 block">
                Pending Invites
              </span>
              <span className="text-xl font-bold">{pendingCount}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a1a1a] p-5 rounded-xl border border-gray-200 dark:border-[#333] shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <Check className="h-6 w-6 text-green-500 flex-shrink-0" />
            <div className="ml-3 min-w-0">
              <span className="text-xs font-medium text-gray-500 block">
                Used Invites
              </span>
              <span className="text-xl font-bold">{usedCount}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a1a1a] p-5 rounded-xl border border-gray-200 dark:border-[#333] shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <Trash2 className="h-6 w-6 text-red-500 flex-shrink-0" />
            <div className="ml-3 min-w-0">
              <span className="text-xs font-medium text-gray-500 block">
                Revoked Invites
              </span>
              <span className="text-xl font-bold">{revokedCount}</span>
            </div>
          </div>
        </div>
      </div>




      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-2xl shadow-2xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button
              onClick={resetModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-lg font-semibold mb-4">Invite Users</h2>

            <div className="pt-4">
              {inviteMessage && (
                <div className="bg-green-50 dark:bg-[#064e3b] border border-green-200 dark:border-green-500 text-green-700 dark:text-green-200 px-4 py-3 rounded-md mb-4">
                  {inviteMessage}
                </div>
              )}

              {error && (
                <div className="bg-red-50 dark:bg-[#3b0f0f] border border-red-200 dark:border-red-500 text-red-700 dark:text-red-200 px-4 py-3 rounded-md mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Email Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-[#ececf1] mb-2">
                    Email Addresses
                  </label>
                  <textarea
                    value={emails}
                    onChange={(e) => setEmails(e.target.value)}
                    placeholder="Enter email addresses"
                    rows={2}
                    className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 dark:border-[#3d3d3d] bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-[#ececf1]"
                  />
                  {/* <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500 dark:text-[#8e8ea0]">
                      Separate emails with comma, space, or Enter
                    </span>
                    <span className="text-xs font-medium text-gray-700 dark:text-[#d1d5db]">
                      {validEmailCount}/20 invites
                    </span>
                  </div> */}
                </div>

                {/* Permissions Section */}
                {/* <div className="mb-4">
                  <div
                    className="flex items-center justify-between cursor-pointer mb-2"
                    onClick={() => toggleSection("permissions")}
                  >
                    <span className="font-medium text-gray-900 dark:text-[#ececf1]">Permissionsx</span>
                    {expandedSections.permissions ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>

                  {expandedSections.permissions && (
                    <div className="space-y-2 bg-gray-50 dark:bg-[#1f1f1f] p-3 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Eye className="h-4 w-4 text-blue-500 mr-2" />
                          <span className="text-sm text-gray-800 dark:text-[#ececf1]">View</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={permissions.view}
                            onChange={() => handlePermissionToggle("view")}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 dark:bg-[#3d3d3d] rounded-full peer-checked:bg-blue-600 transition-colors">
                            <div
                              className={`w-5 h-5 bg-white dark:bg-[#ececf1] rounded-full shadow transform transition-transform ${permissions.view ? "translate-x-5" : "translate-x-0"
                                }`}
                            ></div>
                          </div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Edit className="h-4 w-4 text-green-500 mr-2" />
                          <span className="text-sm text-gray-800 dark:text-[#ececf1]">Edit</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={permissions.edit}
                            onChange={() => handlePermissionToggle("edit")}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 dark:bg-[#3d3d3d] rounded-full peer-checked:bg-blue-600 transition-colors">
                            <div
                              className={`w-5 h-5 bg-white dark:bg-[#ececf1] rounded-full shadow transform transition-transform ${permissions.edit ? "translate-x-5" : "translate-x-0"
                                }`}
                            ></div>
                          </div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Plus className="h-4 w-4 text-purple-500 mr-2" />
                          <span className="text-sm text-gray-800 dark:text-[#ececf1]">Add</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={permissions.add}
                            onChange={() => handlePermissionToggle("add")}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 dark:bg-[#3d3d3d] rounded-full peer-checked:bg-blue-600 transition-colors">
                            <div
                              className={`w-5 h-5 bg-white dark:bg-[#ececf1] rounded-full shadow transform transition-transform ${permissions.add ? "translate-x-5" : "translate-x-0"
                                }`}
                            ></div>
                          </div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Trash2 className="h-4 w-4 text-red-500 mr-2" />
                          <span className="text-sm text-gray-800 dark:text-[#ececf1]">Delete</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={permissions.delete}
                            onChange={() => handlePermissionToggle("delete")}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 dark:bg-[#3d3d3d] rounded-full peer-checked:bg-blue-600 transition-colors">
                            <div
                              className={`w-5 h-5 bg-white dark:bg-[#ececf1] rounded-full shadow transform transition-transform ${permissions.delete ? "translate-x-5" : "translate-x-0"
                                }`}
                            ></div>
                          </div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Edit3 className="h-4 w-4 text-yellow-500 mr-2" />
                          <span className="text-sm text-gray-800 dark:text-[#ececf1]">Edit Survey</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={permissions.edit_survey}
                            onChange={() => handlePermissionToggle("edit_survey")}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 dark:bg-[#3d3d3d] rounded-full peer-checked:bg-blue-600 transition-colors">
                            <div
                              className={`w-5 h-5 bg-white dark:bg-[#ececf1] rounded-full shadow transform transition-transform ${permissions.edit_survey ? "translate-x-5" : "translate-x-0"
                                }`}
                            ></div>
                          </div>
                        </label>
                      </div>
                    </div>


                  )}
                </div> */}

                {/* Products Section — assign org's subscribed products to the agent */}
                <div className="mb-4">
                  <div
                    className="flex items-center justify-between cursor-pointer mb-2"
                    onClick={() => toggleSection("products")}
                  >
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900 dark:text-[#ececf1]">Products</span>
                      <span className="ml-2 text-xs text-gray-500 dark:text-[#8e8ea0]">
                        {assignedProductSkus.length} selected
                      </span>
                    </div>
                    {expandedSections.products ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                  {expandedSections.products && (
                    <div className="space-y-2 bg-gray-50 dark:bg-[#1f1f1f] p-3 rounded-xl">
                      {loadingProductsForInvite ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-[#8e8ea0]">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading products…
                        </div>
                      ) : availableProductsForInvite.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-[#8e8ea0]">
                          No subscribed products available to assign.
                        </p>
                      ) : (
                        <div className="max-h-64 overflow-y-auto space-y-3">
                          {availableProductsForInvite.map((p) => {
                            const isAssigned = assignedProductSkus.includes(p.skuCode);
                            const perms = productPermissions[p.skuCode] || defaultProductPerms();
                            return (
                              <div
                                key={p.skuCode}
                                className={`border rounded-lg overflow-hidden border-gray-200 dark:border-[#3d3d3d] ${isAssigned ? "bg-white dark:bg-[#262626]" : "bg-gray-50/50 dark:bg-[#1a1a1a]"}`}
                              >
                                <label className="flex items-center justify-between cursor-pointer hover:bg-gray-100 dark:hover:bg-[#353535] px-3 py-2">
                                  <span className="text-sm font-medium text-gray-800 dark:text-[#ececf1]">{p.name}</span>
                                  <input
                                    type="checkbox"
                                    checked={isAssigned}
                                    onChange={() => handleProductSkuToggle(p.skuCode)}
                                    className="rounded border-gray-300 dark:border-[#3d3d3d]"
                                  />
                                </label>
                                {isAssigned && (
                                  <div className="px-3 pb-3 pt-1 border-t border-gray-100 dark:border-[#333] grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {["view", "edit", "add", "delete"].map((key) => (
                                      <label key={key} className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={!!perms[key]}
                                          onChange={() => handleProductPermissionToggle(p.skuCode, key)}
                                          className="rounded border-gray-300 dark:border-[#3d3d3d]"
                                        />
                                        <span className="text-xs capitalize text-gray-700 dark:text-[#d1d5db]">{key}</span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Constituencies Section — only when Elections product is available or assigned */}
                {showConstituenciesSection && (
                <div className="mb-4">
                  <div
                    className="flex items-center justify-between cursor-pointer mb-2"
                    onClick={() => toggleSection("constituencies")}
                  >
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900 dark:text-[#ececf1]">Constituencies</span>
                      <span className="ml-2 text-xs text-gray-500 dark:text-[#8e8ea0]">
                        {assignedConstituencies.length} selected
                      </span>
                    </div>
                    {expandedSections.constituencies ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>

                  {expandedSections.constituencies && (
                    <div className="space-y-3">
                      {/* Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-[#8e8ea0]" />
                        <input
                          type="text"
                          placeholder="Search constituencies..."
                          value={constituencySearch}
                          onChange={(e) => setConstituencySearch(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 dark:border-[#3d3d3d] bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-[#ececf1]"
                        />
                      </div>

                      {/* Select All */}
                      <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-[#1f1f1f] rounded">
                        <span className="text-sm font-medium text-gray-900 dark:text-[#ececf1]">Select All</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectAllConstituencies}
                            onChange={(e) => {
                              setSelectAllConstituencies(e.target.checked);
                              setAssignedConstituencies(
                                e.target.checked
                                  ? filteredConstituencies.map((c) => c.assembly_constituency_no)
                                  : []
                              );
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 dark:bg-[#3d3d3d] rounded-full peer-checked:bg-blue-600 transition-colors">
                            <div
                              className={`w-5 h-5 bg-white dark:bg-[#ececf1] rounded-full shadow transform transition-transform ${selectAllConstituencies ? "translate-x-5" : "translate-x-0"
                                }`}
                            ></div>
                          </div>
                        </label>
                      </div>

                      {/* Constituencies List */}
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {filteredConstituencies.map((constituency) => (
                          <div
                            key={constituency.assembly_constituency_no}
                            className="p-2 border rounded hover:bg-gray-50 dark:hover:bg-[#353535] space-y-2 border-gray-200 dark:border-[#3d3d3d]"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium truncate">
                                  {constituency.assembly_constituency_name}
                                </span>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={assignedConstituencies.includes(
                                    constituency.assembly_constituency_no
                                  )}
                                  onChange={() =>
                                    handleConstituencyToggle(
                                      constituency.assembly_constituency_no
                                    )
                                  }
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 dark:bg-[#3d3d3d] rounded-full peer-checked:bg-blue-600 transition-colors">
                                  <div
                                    className={`w-5 h-5 bg-white dark:bg-[#ececf1] rounded-full shadow transform transition-transform ${assignedConstituencies.includes(
                                      constituency.assembly_constituency_no
                                    )
                                      ? "translate-x-5"
                                      : "translate-x-0"
                                      }`}
                                  ></div>
                                </div>
                              </label>
                            </div>

                            {/* Booths dropdown for selected constituency */}
                            {assignedConstituencies.includes(
                              constituency.assembly_constituency_no
                            ) && (
                                <div className="mt-1 space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-gray-600">
                                      Polling booths access
                                    </span>
                                    {boothLoadingByConstituency[
                                      constituency.assembly_constituency_no
                                    ] && (
                                        <span className="text-xs text-gray-500">
                                          Loading...
                                        </span>
                                      )}
                                  </div>

                                  {Array.isArray(
                                    boothsByConstituency[
                                    constituency.assembly_constituency_no
                                    ]
                                  ) &&
                                    boothsByConstituency[
                                      constituency.assembly_constituency_no
                                    ].length > 0 && (
                                      <div className="max-h-32 overflow-y-auto border rounded-md p-1 space-y-1 bg-white dark:bg-[#1f1f1f] dark:border-[#3d3d3d]">
                                        {boothsByConstituency[
                                          constituency.assembly_constituency_no
                                        ].map((booth) => (
                                          <label
                                            key={booth.polling_station_no}
                                            className="flex items-start space-x-2 text-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-[#353535] rounded px-1 py-0.5"
                                          >
                                            <input
                                              type="checkbox"
                                              className="mt-0.5"
                                              checked={(
                                                selectedBoothsByConstituency[
                                                constituency.assembly_constituency_no
                                                ] || []
                                              ).includes(booth.polling_station_no)}
                                              onChange={() =>
                                                handleBoothSelectionChange(
                                                  constituency.assembly_constituency_no,
                                                  booth.polling_station_no
                                                )
                                              }
                                            />
                                            <span className="flex-1">
                                              <span className="font-semibold">
                                                Booth {booth.polling_station_no}
                                              </span>
                                              {booth.polling_areas && (
                                                <span className="block text-[10px] text-gray-500 truncate">
                                                  {booth.polling_areas}
                                                </span>
                                              )}
                                            </span>
                                          </label>
                                        ))}
                                      </div>
                                    )}

                                  {Array.isArray(
                                    boothsByConstituency[
                                    constituency.assembly_constituency_no
                                    ]
                                  ) &&
                                    boothsByConstituency[
                                      constituency.assembly_constituency_no
                                    ].length === 0 &&
                                    !boothLoadingByConstituency[
                                    constituency.assembly_constituency_no
                                    ] && (
                                      <span className="text-xs text-gray-400">
                                        No booths found for this constituency.
                                      </span>
                                    )}
                                </div>
                              )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                )}

                <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={resetModal}
                    className="px-4 py-2 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={validEmailCount === 0 || (showConstituenciesSection && assignedConstituencies.length === 0) || loading}
                    className={`px-4 py-2 rounded-xl flex items-center justify-center gap-2 ${validEmailCount === 0 || (showConstituenciesSection && assignedConstituencies.length === 0) || loading
                      ? "bg-[#0EA5E9] cursor-not-allowed"
                      : "bg-[#0EA5E9] hover:bg-[#0EA5E9]"
                      } text-white`}
                  >
                    {loading ? (
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        viewBox="0 0 24 24"
                      >
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
                      <Send className="h-4 w-4" />
                    )}
                    Send Invitation
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Promote Agent Modal */}
      {showPromoteModal && promotingAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            <button
              onClick={resetPromoteModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-100 rounded-full">
                  <Shield className="h-6 w-6 text-amber-600" />
                </div>
                <h2 className="text-lg font-semibold">Promote Agent to Admin</h2>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Are you sure you want to promote this agent to admin?
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2">
              <div>
                <span className="text-xs font-medium text-gray-500">Name:</span>
                <p className="text-sm text-gray-900">
                  {promotingAgent.full_name || promotingAgent.name || "—"}
                </p>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500">Email:</span>
                <p className="text-sm text-gray-900 break-all">{promotingAgent.email}</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> Promoting this agent will:
              </p>
              <ul className="text-xs text-blue-700 mt-2 space-y-1 list-disc list-inside">
                <li>Grant full admin permissions (view, edit, add, delete)</li>
                <li>Assign access to all constituencies in their state</li>
                <li>Remove booth-level restrictions</li>
                <li>Move them from agents to admins in your organization</li>
              </ul>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={resetPromoteModal}
                disabled={promotingLoading}
                className="px-4 py-2 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePromoteAgent}
                disabled={promotingLoading}
                className={`px-4 py-2 rounded-xl flex items-center justify-center gap-2 ${promotingLoading
                  ? "bg-amber-400 cursor-not-allowed"
                  : "bg-amber-600 hover:bg-amber-700"
                  } text-white disabled:opacity-50`}
              >
                {promotingLoading ? (
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    viewBox="0 0 24 24"
                  >
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
                  <>
                    <ArrowUp className="h-4 w-4" />
                    Promote to Admin
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Agent Modal */}
      {showEditAgentModal && editingAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-2xl shadow-2xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button
              onClick={resetEditAgentModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-lg font-semibold mb-1">Edit agent access</h2>
            <p className="text-xs text-gray-500 mb-4 break-all">
              {editingAgent.email}
            </p>

            <form onSubmit={handleEditAgentSubmit}>
              {/* Products Section — same as Invite User modal */}
              <div className="mb-4">
                <div
                  className="flex items-center justify-between cursor-pointer mb-2"
                  onClick={() => toggleSection("products")}
                >
                  <div className="flex items-center">
                    <span className="font-medium text-gray-900 dark:text-[#ececf1]">Products</span>
                    <span className="ml-2 text-xs text-gray-500 dark:text-[#8e8ea0]">
                      {editAssignedProductSkus.length} selected
                    </span>
                  </div>
                  {expandedSections.products ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
                {expandedSections.products && (
                  <div className="space-y-2 bg-gray-50 dark:bg-[#1f1f1f] p-3 rounded-xl">
                    {loadingProductsForEdit ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-[#8e8ea0]">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading products…
                      </div>
                    ) : availableProductsForEdit.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-[#8e8ea0]">
                        No subscribed products available to assign.
                      </p>
                    ) : (
                      <div className="max-h-64 overflow-y-auto space-y-3">
                        {availableProductsForEdit.map((p) => {
                          const isAssigned = editAssignedProductSkus.includes(p.skuCode);
                          const perms = editProductPermissions[p.skuCode] || defaultProductPerms();
                          return (
                            <div
                              key={p.skuCode}
                              className={`border rounded-lg overflow-hidden border-gray-200 dark:border-[#3d3d3d] ${isAssigned ? "bg-white dark:bg-[#262626]" : "bg-gray-50/50 dark:bg-[#1a1a1a]"}`}
                            >
                              <label className="flex items-center justify-between cursor-pointer hover:bg-gray-100 dark:hover:bg-[#353535] px-3 py-2">
                                <span className="text-sm font-medium text-gray-800 dark:text-[#ececf1]">{p.name}</span>
                                <input
                                  type="checkbox"
                                  checked={isAssigned}
                                  onChange={() => handleEditProductSkuToggle(p.skuCode)}
                                  className="rounded border-gray-300 dark:border-[#3d3d3d]"
                                />
                              </label>
                              {isAssigned && (
                                <div className="px-3 pb-3 pt-1 border-t border-gray-100 dark:border-[#333] grid grid-cols-2 sm:grid-cols-4 gap-2">
                                  {["view", "edit", "add", "delete"].map((key) => (
                                    <label key={key} className="flex items-center gap-1.5 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={!!perms[key]}
                                        onChange={() => handleEditProductPermissionToggle(p.skuCode, key)}
                                        className="rounded border-gray-300 dark:border-[#3d3d3d]"
                                      />
                                      <span className="text-xs capitalize text-gray-700 dark:text-[#d1d5db]">{key}</span>
                                    </label>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Permissions Section */}
              {/* <div className="mb-4">
                <div
                  className="flex items-center justify-between cursor-pointer mb-2"
                  onClick={() => toggleSection("permissions")}
                >
                  <span className="font-medium">Permissions</span>
                  {expandedSections.permissions ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>

                {expandedSections.permissions && (
                  <div className="space-y-2 bg-gray-50 p-3 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Eye className="h-4 w-4 text-blue-500 mr-2" />
                        <span className="text-sm">View</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editPermissions.view}
                          onChange={() => handleEditPermissionToggle("view")}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-[#3d3d3d] rounded-full peer-checked:bg-blue-600 transition-colors">
                          <div
                            className={`w-5 h-5 bg-white dark:bg-[#ececf1] rounded-full shadow transform transition-transform ${editPermissions.view ? "translate-x-5" : "translate-x-0"
                              }`}
                          ></div>
                        </div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Edit className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm">Edit</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editPermissions.edit}
                          onChange={() => handleEditPermissionToggle("edit")}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-[#3d3d3d] rounded-full peer-checked:bg-blue-600 transition-colors">
                          <div
                            className={`w-5 h-5 bg-white dark:bg-[#ececf1] rounded-full shadow transform transition-transform ${editPermissions.edit ? "translate-x-5" : "translate-x-0"
                              }`}
                          ></div>
                        </div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Plus className="h-4 w-4 text-purple-500 mr-2" />
                        <span className="text-sm">Add</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editPermissions.add}
                          onChange={() => handleEditPermissionToggle("add")}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-[#3d3d3d] rounded-full peer-checked:bg-blue-600 transition-colors">
                          <div
                            className={`w-5 h-5 bg-white dark:bg-[#ececf1] rounded-full shadow transform transition-transform ${editPermissions.add ? "translate-x-5" : "translate-x-0"
                              }`}
                          ></div>
                        </div>
                      </label>
                    </div> */}
                    {/* <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Trash2 className="h-4 w-4 text-red-500 mr-2" />
                        <span className="text-sm">Delete</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editPermissions.delete}
                          onChange={() => handleEditPermissionToggle("delete")}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-[#3d3d3d] rounded-full peer-checked:bg-blue-600 transition-colors">
                          <div
                            className={`w-5 h-5 bg-white dark:bg-[#ececf1] rounded-full shadow transform transition-transform ${editPermissions.delete ? "translate-x-5" : "translate-x-0"
                              }`}
                          ></div>
                        </div>
                      </label>
                    </div> */}

                    {/* <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Edit3 className="h-4 w-4 text-yellow-500 mr-2" />
                        <span className="text-sm text-gray-800 dark:text-[#ececf1]">Edit Survey</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editPermissions.edit_survey}
                          onChange={() => handleEditPermissionToggle("edit_survey")}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-[#3d3d3d] rounded-full peer-checked:bg-blue-600 transition-colors">
                          <div
                            className={`w-5 h-5 bg-white dark:bg-[#ececf1] rounded-full shadow transform transition-transform ${editPermissions.edit_survey ? "translate-x-5" : "translate-x-0"
                              }`}
                          ></div>
                        </div>
                      </label>
                    </div>
                  </div>
                )}
              </div> */}

              {/* Constituencies Section — only when Elections product is assigned (same as Invite modal) */}
              {showEditConstituenciesSection && (
              <div className="mb-4">
                <div
                  className="flex items-center justify-between cursor-pointer mb-2"
                  onClick={() => toggleSection("constituencies")}
                >
                  <div className="flex items-center">
                    <span className="font-medium text-gray-900 dark:text-[#ececf1]">Constituencies</span>
                    <span className="ml-2 text-xs text-gray-500 dark:text-[#8e8ea0]">
                      {editAssignedConstituencies.length} selected
                    </span>
                  </div>
                  {expandedSections.constituencies ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>

                {expandedSections.constituencies && (
                  <div className="space-y-3">
                    {/* Search (reuse same search state) */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-[#8e8ea0]" />
                      <input
                        type="text"
                        placeholder="Search constituencies..."
                        value={constituencySearch}
                        onChange={(e) => setConstituencySearch(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 dark:border-[#3d3d3d] bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-[#ececf1]"
                      />
                    </div>

                    {/* Constituencies List */}
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {filteredConstituencies.map((constituency) => (
                        <div
                          key={constituency.assembly_constituency_no}
                          className="p-2 border rounded hover:bg-gray-50 dark:hover:bg-[#353535] space-y-2 border-gray-200 dark:border-[#3d3d3d]"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium truncate text-gray-900 dark:text-[#ececf1]">
                                {constituency.assembly_constituency_name}
                              </span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editAssignedConstituencies.includes(
                                  constituency.assembly_constituency_no
                                )}
                                onChange={() =>
                                  handleEditConstituencyToggle(
                                    constituency.assembly_constituency_no
                                  )
                                }
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 dark:bg-[#3d3d3d] rounded-full peer-checked:bg-blue-600 transition-colors">
                                <div
                                  className={`w-5 h-5 bg-white dark:bg-[#ececf1] rounded-full shadow transform transition-transform ${editAssignedConstituencies.includes(
                                    constituency.assembly_constituency_no
                                  )
                                    ? "translate-x-5"
                                    : "translate-x-0"
                                    }`}
                                ></div>
                              </div>
                            </label>
                          </div>

                          {/* Booths dropdown for selected constituency */}
                          {editAssignedConstituencies.includes(
                            constituency.assembly_constituency_no
                          ) && (
                              <div className="mt-1 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium text-gray-600 dark:text-[#d1d5db]">
                                    Polling booths access
                                  </span>
                                  {editBoothLoadingByConstituency[
                                    constituency.assembly_constituency_no
                                  ] && (
                                      <span className="text-xs text-gray-500 dark:text-[#8e8ea0]">
                                        Loading...
                                      </span>
                                    )}
                                </div>

                                {Array.isArray(
                                  editBoothsByConstituency[
                                  constituency.assembly_constituency_no
                                  ]
                                ) &&
                                  editBoothsByConstituency[
                                    constituency.assembly_constituency_no
                                  ].length > 0 && (
                                    <div className="max-h-32 overflow-y-auto border rounded-md p-1 space-y-1 bg-white dark:bg-[#1f1f1f] dark:border-[#3d3d3d]">
                                      {editBoothsByConstituency[
                                        constituency.assembly_constituency_no
                                      ].map((booth) => (
                                        <label
                                          key={booth.polling_station_no}
                                          className="flex items-start space-x-2 text-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-[#353535] rounded px-1 py-0.5"
                                        >
                                          <input
                                            type="checkbox"
                                            className="mt-0.5"
                                            checked={(
                                              editSelectedBoothsByConstituency[
                                              constituency.assembly_constituency_no
                                              ] || []
                                            ).includes(booth.polling_station_no)}
                                            onChange={() =>
                                              handleEditBoothSelectionChange(
                                                constituency.assembly_constituency_no,
                                                booth.polling_station_no
                                              )
                                            }
                                          />
                                          <span className="flex-1">
                                            <span className="font-semibold">
                                              Booth {booth.polling_station_no}
                                            </span>
                                            {booth.polling_areas && (
                                              <span className="block text-[10px] text-gray-500 truncate">
                                                {booth.polling_areas}
                                              </span>
                                            )}
                                          </span>
                                        </label>
                                      ))}
                                    </div>
                                  )}

                                {Array.isArray(
                                  editBoothsByConstituency[
                                  constituency.assembly_constituency_no
                                  ]
                                ) &&
                                  editBoothsByConstituency[
                                    constituency.assembly_constituency_no
                                  ].length === 0 &&
                                  !editBoothLoadingByConstituency[
                                  constituency.assembly_constituency_no
                                  ] && (
                                    <span className="text-xs text-gray-400">
                                      No booths found for this constituency.
                                    </span>
                                  )}
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={resetEditAgentModal}
                  className="px-4 py-2 border border-gray-300 dark:border-[#3d3d3d] rounded-xl text-gray-600 dark:text-[#d1d5db] hover:bg-gray-100 dark:hover:bg-[#353535]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={(showEditConstituenciesSection && editAssignedConstituencies.length === 0) || editAgentLoading}
                  className={`px-4 py-2 rounded-xl flex items-center justify-center gap-2 ${(showEditConstituenciesSection && editAssignedConstituencies.length === 0) || editAgentLoading
                    ? "bg-[#0EA5E9] cursor-not-allowed opacity-70"
                    : "bg-[#0EA5E9] hover:bg-[#0EA5E9]"
                    } text-white`}
                >
                  {editAgentLoading ? (
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      viewBox="0 0 24 24"
                    >
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
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabs: Invitations, Agents, Admins */}
      <div className="mt-6">
        {/* Segmented control tabs: Invitations / Agents / Admins */}
        <div
          className="inline-flex rounded-full bg-gray-100/80 dark:bg-[#111111] border border-gray-200/50 dark:border-[#3d3d3d] p-1 gap-1 shadow-inner"
        >
          {[
            { key: "invites", label: "Invitations" },
            { key: "agents", label: "Agents" },
            { key: "admins", label: "Admins" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === tab.key
                ? "bg-white text-gray-900 shadow-sm dark:bg-[#3a3a3a] dark:text-white font-bold"
                : "bg-transparent text-gray-500 hover:text-gray-900 dark:text-[#a0a0a0] dark:hover:text-white"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="rounded-xl border bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#333] shadow-sm mt-4 overflow-hidden">
          {activeTab === "invites" && (
            <>
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b" />
              {invites.length === 0 ? (
                <div className="px-4 sm:px-6 py-8 text-center text-gray-500">
                  <Mail className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <span className="text-sm">No invitations found.</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50/50 dark:bg-[#161616] border-b border-gray-100 dark:border-[#222]">
                      <tr className="border-0">
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-[#2d2d2d] divide-y divide-gray-200 dark:divide-[#3d3d3d]">
                      {invites.map((invite) => (
                        <tr
                          key={invite.jti}
                          className="border-b border-gray-50 dark:border-[#1a1a1a] hover:bg-gray-50/80 dark:hover:bg-[#1f1f1f] transition-colors"
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-md font-medium text-gray-900 dark:text-[#ececf1] break-all">
                              {invite.email}
                            </span>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center justify-center 
      w-24 px-2 py-1 rounded-2xl text-md font-medium
      ${invite.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-600 dark:text-white"
                                  : invite.status === "used"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                                }`}
                            >
                              {invite.status}
                            </span>
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {activeTab === "agents" && (
            <>
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b" />

              {agentsError && (
                <div className="px-4 sm:px-6 py-3 bg-red-50 border-b border-red-200 text-sm text-red-700">
                  {agentsError}
                </div>
              )}

              {agentsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : agents.length === 0 ? (
                <div className="px-4 sm:px-6 py-8 text-center text-gray-500">
                  <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <span className="text-sm">No agents found.</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50/50 dark:bg-[#161616] border-b border-gray-100 dark:border-[#222]">
                      <tr className="border-0">
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-[#2d2d2d] divide-y divide-gray-200 dark:divide-[#3d3d3d]">
                      {agents.map((agent) => (
                        <tr
                          key={agent.user_id}
                          className="border-b border-gray-50 dark:border-[#1a1a1a] hover:bg-gray-50/80 dark:hover:bg-[#1f1f1f] transition-colors"
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900 dark:text-[#ececf1]">
                              {agent.full_name || agent.name || "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-md text-gray-900 dark:text-[#ececf1] break-all">
                              {agent.email}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => openEditAgentModal(agent)}
                                className="px-3 py-1 text-xs font-medium rounded border border-[#0EA5E9] text-[#0EA5E9] hover:bg-gray-100 dark:hover:bg-[#1f2937] flex items-center gap-1"
                              >
                                <Edit3 className="h-3 w-3" />
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => openPromoteModal(agent)}
                                className="px-3 py-1 text-xs font-medium rounded border border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-[#452a03] flex items-center gap-1"
                              >
                                <ArrowUp className="h-3 w-3" />
                                Promote
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {activeTab === "admins" && (
            <>
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b" />

              {adminsError && (
                <div className="px-4 sm:px-6 py-3 bg-red-50 border-b border-red-200 text-sm text-red-700">
                  {adminsError}
                </div>
              )}

              {adminsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : admins.length === 0 ? (
                <div className="px-4 sm:px-6 py-8 text-center text-gray-500">
                  <Shield className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <span className="text-sm">No admins found.</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50/50 dark:bg-[#161616] border-b border-gray-100 dark:border-[#222]">
                      <tr className="border-0">
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                          Role
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-[#2d2d2d] divide-y divide-gray-200 dark:divide-[#3d3d3d]">
                      {admins.map((admin) => (
                        <tr
                          key={admin.user_id}
                          className="border-b border-gray-50 dark:border-[#1a1a1a] hover:bg-gray-50/80 dark:hover:bg-[#1f1f1f] transition-colors"
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900 dark:text-[#ececf1]">
                              {admin.name || "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-md text-gray-900 dark:text-[#ececf1] break-all">
                              {admin.email}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-md px-2 py-1 rounded-2xl bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100">
                              {admin.role}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}