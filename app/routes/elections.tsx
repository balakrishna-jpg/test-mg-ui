import {
  Outlet,
  useParams,
  Link,
  useLocation,
  useNavigate,
} from "@remix-run/react";
import { message } from "antd";
import {
  LayoutDashboard,
  LineChart,
  ArrowLeftRight,
  Settings,
  Phone,
  MessageCircle,
  User as UserIcon,
  Users,
  Menu,
  Flag,
  MessageSquare,
  Sparkles,
  ClipboardList,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
  Plus,
  List,
  Camera,
  Pencil,
  Newspaper,
  Zap,
  TrendingUp,
  Radio,
  Vote,
  MessageSquareWarning,
  AlertCircle,
  Ticket,
  ExternalLink,
  CheckSquare
} from "lucide-react";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { updateUserProfile, updateUserProfilePicture, getUserProfilePicture } from "~/api"; // Update with correct path
import { hasAccessToProduct, getUserLandingRoute } from "~/utils/session";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import margadarshalabelwithicon from "~/assets/MargadarshNew.png";
import { jwtDecode } from "jwt-decode";





export default function ElectionsLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const [darkMode, setDarkMode] = useState(false);
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
  const [user, setUser] = useState<any>(null);
  const [userEmial, setUserEmial] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");
  const [organizationName, setOrganizationName] = useState<string>("");
  const [userStateName, setUserStateName] = useState<string>("");
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Feedback modal states
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [downloadCount, setDownloadCount] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [profileMenuPosition, setProfileMenuPosition] = useState({ top: 0, left: 0, width: 0 });

  // Profile edit modal states
  const [showProfileEditModal, setShowProfileEditModal] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    name: "",
    age: "",
    gender: "",
    profile_picture: "",
    organization_name: "",
  });
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string>("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Detect election-results page for full-bleed layout
  const isElectionResultsPage = location.pathname.includes("/elections/election-results");

  // Load user + theme + check for welcome modal flag
  useEffect(() => {
    let userData = null;
    let isTokenValid = false;

    try {
      const token = localStorage.getItem("token");
      const userDataStr = localStorage.getItem("user_info");

      if (token) {
        const decoded = jwtDecode(token) as { exp: number };
        if (decoded.exp * 1000 > Date.now()) {
          isTokenValid = true;
        }
      }

      if (userDataStr) {
        userData = JSON.parse(userDataStr);
      }
    } catch (error) {
      console.error("Token verification failed:", error);
    }

    const savedThemeMode = localStorage.getItem("themeMode");
    const shouldShowModal = localStorage.getItem("showWelcomeModal");

    if (isTokenValid && userData && userData.user_id) {
      setUser(userData);
      setUserEmial(userData?.email || "");
      setUserName(userData?.name || "");
      setUserRole(userData?.role || "");
      setOrganizationName(userData?.organization_name || "");
      setUserStateName(userData?.state_name || "");

      if (shouldShowModal === "true") {
        setShowWelcomeModal(true);
        localStorage.removeItem("showWelcomeModal");
      }
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("user_info");
      localStorage.removeItem("role");
      navigate("/login");
    }

    if (savedThemeMode && (savedThemeMode === 'light' || savedThemeMode === 'dark')) {
      setThemeMode(savedThemeMode);
      const isDark = savedThemeMode === 'dark';
      setDarkMode(isDark);
      document.documentElement.classList.toggle('dark', isDark);
    } else {
      setThemeMode('light');
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, [navigate]);

  // Persist theme and apply dark class to document
  useEffect(() => {
    localStorage.setItem("themeMode", themeMode);
    localStorage.setItem("darkMode", JSON.stringify(darkMode));

    document.documentElement.classList.toggle('dark', darkMode);
  }, [themeMode, darkMode]);

  const roleLower = (user?.role || "").toLowerCase();
  const isAdmin = roleLower === "admin";
  const isAgent = roleLower === "agent";

  // Block non-admin/non-agent direct access to /adminpanel
  useEffect(() => {
    if (!user) return;
    if (!isAdmin && !isAgent && location.pathname === `/elections/adminpanel`) {
      const route = getUserLandingRoute(user);
      if (route) navigate(route, { replace: true });
    }
  }, [user, isAdmin, isAgent, location.pathname, navigate]);

  const toggleDropdown = (itemId: string) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);

  const closeSidebarOnMobile = useCallback(() => {
    if (typeof window === "undefined") return;
    if (window.innerWidth < 1024) {
      closeSidebar();
    }
  }, [closeSidebar]);

  useEffect(() => {
    closeSidebar();
    setShowProfileMenu(false);
  }, [location.pathname, closeSidebar]);

  // Calculate profile menu position and close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showProfileMenu && !target.closest('.profile-menu-container') && !target.closest('.profile-dropdown')) {
        setShowProfileMenu(false);
      }
    };

    const updatePosition = () => {
      if (profileMenuRef.current) {
        const rect = profileMenuRef.current.getBoundingClientRect();
        setProfileMenuPosition({
          top: rect.top,
          left: rect.left,
          width: rect.width,
        });
      }
    };

    if (showProfileMenu) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showProfileMenu]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_info");
    localStorage.removeItem("role");
    navigate("/login");
  };

  const closeWelcomeModal = () => {
    setShowWelcomeModal(false);
  };

  const resetFeedbackForm = () => {
    setRating(0);
    setHoveredRating(0);
    setComment('');
  };

  const closeFeedbackModal = () => {
    setShowFeedbackModal(false);
    resetFeedbackForm();
  };

  const openProfileEditModal = () => {
    setShowProfileMenu(false);
    setProfileFormData({
      name: user?.name || "",
      age: user?.age?.toString() || "",
      gender: user?.gender || "",
      profile_picture: user?.profile_picture || "",
      organization_name: user?.organization_name || "",
    });
    setProfilePicturePreview(user?.profile_picture || "");
    setProfilePictureFile(null);
    setShowProfileEditModal(true);
  };

  const closeProfileEditModal = () => {
    setShowProfileEditModal(false);
    setProfileFormData({
      name: "",
      age: "",
      gender: "",
      profile_picture: "",
      organization_name: "",
    });
    setProfilePicturePreview("");
    setProfilePictureFile(null);
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePictureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle profile picture update using the dedicated API
  const handleProfilePictureUpdate = async (userId: string, imageFile: File) => {
    try {
      const result = await updateUserProfilePicture(userId, imageFile);
      console.log("Profile picture updated:", result);
      // result.data.profile_picture contains the new URL
      return result;
    } catch (error: any) {
      console.error("Failed to update profile picture:", error);
      throw error;
    }
  };

  const handleProfileUpdate = async () => {
    try {
      setIsUpdatingProfile(true);

      let profilePictureUrl = profileFormData.profile_picture;

      // If a new file is selected, upload it using the dedicated API
      const userId = user?.id || user?.user_id;
      if (profilePictureFile && userId) {
        try {
          const result = await handleProfilePictureUpdate(userId, profilePictureFile);
          // Update profile picture URL from the response
          if (result?.data?.profile_picture) {
            profilePictureUrl = result.data.profile_picture;
          } else if (result?.profile_picture) {
            profilePictureUrl = result.profile_picture;
          }
        } catch (error: any) {
          console.error("Error uploading profile picture:", error);
          message.error(error.response?.data?.message || "Failed to upload profile picture");
          return;
        }
      }

      const updateData: any = {
        name: profileFormData.name,
        age: profileFormData.age ? parseInt(profileFormData.age) : null,
        gender: profileFormData.gender || null,
        profile_picture: profilePictureUrl,
      };

      if (isAdmin) {
        updateData.organization_name = profileFormData.organization_name;
      }

      const updatedUser = await updateUserProfile(updateData);

      // Fetch the latest profile picture URL specifically from the CMS service
      let latestProfileUrl = profilePictureUrl;
      try {
        if (userId) {
          const picResponse = await getUserProfilePicture(userId);
          if (picResponse?.success && picResponse?.data?.profile_picture) {
            latestProfileUrl = picResponse.data.profile_picture;
          }
        }
      } catch (err) {
        console.error("Failed to fetch latest profile picture URL, falling back", err);
      }

      // Merge user state, ensuring profile picture URL takes precedence
      const updatedUserData = { ...user, ...updatedUser, profile_picture: latestProfileUrl };

      setUser(updatedUserData);
      setUserName(updatedUserData.name || userName);
      if (isAdmin && updatedUserData.organization_name) {
        setOrganizationName(updatedUserData.organization_name);
      }
      localStorage.setItem("user_info", JSON.stringify(updatedUserData));

      message.success("Profile updated successfully!");
      closeProfileEditModal();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      message.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const navigationItems = useMemo(() => {
    const items = [];

    // Elections Product (SKU005) - Voters & Reports
    if (hasAccessToProduct(user, "SKU005")) {
      items.push({
        id: "voters",
        label: "Voters",
        icon: Users,
        submenu: [
          {
            id: "list-voters",
            label: "List voters",
            icon: List,
            href: `/elections/votersdb`,
          },
          {
            id: "ai-search",
            label: "AI assistant",
            icon: Sparkles,
            href: `/elections/hybrid-search`,
          }

        ],
      });

      items.push({
        id: "reports",
        label: "Reports",
        icon: LineChart,
        submenu: [
          {
            id: "assembly-analysis",
            label: "Assembly analysis",
            icon: LineChart,
            href: `/elections/assembly-analysis`,
          },
          {
            id: "compare-elections",
            label: "Compare elections",
            icon: ArrowLeftRight,
            href: `/elections/compare-elections`,
          },
          {
            id: "election-results",
            label: "Election results",
            icon: Flag,
            href: `/elections/election-results`,
          },
        ],
      });
    }

    // Survey Product (SKU004)
    if (hasAccessToProduct(user, "SKU004")) {
      items.push({
        id: "surveys",
        label: "Surveys",
        icon: ClipboardList,
        href: `/elections/surveys`,
        submenu: [
          {
            id: "surveys-new",
            label: "Create Survey",
            icon: ClipboardList,
            href: `/elections/surveys-new`,
          },
          {
            id: "list-surveys",
            label: "Surveys List",
            icon: List,
            href: `/elections/surveys-list`,
          }
        ],
      });
    }

    // Grievance Product (SKU003)
    if (hasAccessToProduct(user, "SKU003")) {
      items.push({
        id: "grievances",
        label: "Grievances",
        icon: AlertCircle,
        href: `/elections/grievances`,
        submenu: [
          {
            id: "tickets",
            label: "Tickets",
            icon: Ticket,
            href: `/elections/tickets`,
          },

          {
            id: "public-portal",
            label: "Public Portal",
            icon: ExternalLink,
            href: user?.organization_id ? `/public_grievance/${user.organization_id}` : "#",
            target: "_blank",
          },
          {
            id: "team",
            label: "Custom Categories",
            icon: List,
            href: `/elections/team`,
          }
        ],
      });
    }

    // Communication Product (SKU002)
    if (hasAccessToProduct(user, "SKU002")) {
      items.push({
        id: "communication",
        label: "Communication",
        icon: MessageSquare,
        href: `/elections/communication`,
        submenu: [
          {
            id: "whatsapp",
            label: "WhatsApp",
            icon: MessageCircle,
            href: `/elections/whatsapp`,
          },
          {
            id: "ivr",
            label: "IVR",
            icon: Phone,
            href: `/elections/ivr`,
          },
        ],
      });
    }

    // // Settings (Admin Panel) - Admin only
    // if (isAdmin) {
    //   items.push({
    //     id: "adminpanel",
    //     label: "Settings",
    //     icon: Settings,
    //     href: `/elections/adminpanel`,
    //     submenu: [],
    //   });
    // }

    // Monitor Product (SKU001) – topics, breaking, trending, popular media
    if (hasAccessToProduct(user, "SKU001")) {
      items.push({
        id: "monitor",
        label: "Monitor",
        icon: Newspaper,
        href: `/elections/monitor`,
        submenu: [
          {
            id: "monitor-topics",
            label: "Topics",
            icon: List,
            href: `/elections/monitor-topics`,
          },
          {
            id: "monitor-breaking",
            label: "Breaking",
            icon: Zap,
            href: `/elections/monitor-breaking`,
          },
          {
            id: "monitor-trending",
            label: "Trending",
            icon: TrendingUp,
            href: `/elections/monitor-trending`,
          },
          {
            id: "monitor-popular-media",
            label: "Popular media",
            icon: Radio,
            href: `/elections/monitor-popular-media`,
          },
        ],
      });
    }

    // Task Management (organization tasks)
    items.push({
      id: "tasks",
      label: "Tasks",
      icon: CheckSquare,
      href: `/elections/create-tasks`,
      submenu: [
        {
          id: "create-tasks",
          label: "Create Tasks",
          icon: Plus,
          href: `/elections/create-tasks`,
        },
        {
          id: "my-tasks",
          label: "My Tasks",
          icon: List,
          href: `/elections/my-tasks`,
        },
      ],
    });

    // Settings (Admin Panel) - Admin and Agent
    if (isAdmin || isAgent) {
      items.push({
        id: "adminpanel",
        label: "Settings",
        icon: Settings,
        href: `/elections/adminpanel`,
        submenu: [],
      });
    }

    return items;
  }, [isAdmin, isAgent, user]);


  // Auto-open dropdowns when a submenu item is active
  useEffect(() => {
    if (isSidebarCollapsed) {
      setOpenDropdowns({});
      return;
    }

    const newOpenDropdowns: Record<string, boolean> = {};

    navigationItems.forEach((item) => {
      const hasSubmenu = Array.isArray(item.submenu) && item.submenu?.length > 0;
      if (hasSubmenu) {
        const isSubmenuActive = item.submenu?.some((subItem: any) => {
          const isDirectActive = location.pathname === subItem.href;
          const hasNestedSubmenu = Array.isArray(subItem.submenu) && subItem.submenu?.length > 0;
          const isNestedActive = hasNestedSubmenu && subItem.submenu?.some((nestedItem: any) => location.pathname === nestedItem.href);
          return isDirectActive || isNestedActive;
        });

        if (isSubmenuActive) {
          newOpenDropdowns[item.id] = true;

          item.submenu?.forEach((subItem: any) => {
            const hasNestedSubmenu = Array.isArray(subItem.submenu) && subItem.submenu?.length > 0;
            if (hasNestedSubmenu) {
              const isNestedActive = subItem.submenu?.some((nestedItem: any) => location.pathname === nestedItem.href);
              if (isNestedActive) {
                newOpenDropdowns[subItem.id] = true;
              }
            }
          });
        }
      }
    });

    setOpenDropdowns(newOpenDropdowns);
  }, [location.pathname, isSidebarCollapsed, navigationItems]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-white/10 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-white/40 font-medium tracking-wide">Loading...</p>
        </div>
      </div>
    );
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 transition-all duration-300">
        <ul className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const hasSubmenu = Array.isArray(item.submenu) && item.submenu.length > 0;
            const isSubmenuActive = hasSubmenu && item.submenu?.some((subItem: any) => location.pathname === subItem.href);
            const isActive = location.pathname === item.href || isSubmenuActive;
            const isDropdownOpen = !!openDropdowns[item.id];

            return (
              <li key={item.id}>
                <div className="flex items-center">
                  <Link
                    to={item.href ?? "#"}
                    onClick={(e) => {
                      if (hasSubmenu && !isSidebarCollapsed) {
                        e.preventDefault();
                        toggleDropdown(item.id);
                        return;
                      }
                      closeSidebarOnMobile();
                    }}
                    className={`
                      group flex items-center flex-1 ${isSidebarCollapsed ? "justify-center px-2" : "gap-3 px-3"} py-2.5 rounded-xl transition-all duration-200 text-sm font-semibold tracking-tight
                      ${isActive
                        ? "bg-gradient-to-r from-blue-600/30 to-violet-600/20 text-white border border-blue-500/30"
                        : "text-white/50 hover:bg-white/5 hover:text-white/90"
                      }
                    `}
                  >
                    <Icon
                      size={isActive ? 22 : 20}
                      strokeWidth={isActive ? 2.25 : 2}
                      className={`
                        flex-shrink-0 transition-all duration-200
                        ${isActive ? "text-blue-400" : "text-white/40 group-hover:text-white/80"}
                      `}
                    />
                    {!isSidebarCollapsed && (
                      <>
                        <span className="flex-1">{item.label}</span>
                        {hasSubmenu && (
                          <svg
                            className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-0' : '-rotate-90'}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        )}
                      </>
                    )}
                  </Link>
                </div>

                {hasSubmenu && isDropdownOpen && !isSidebarCollapsed && (
                  <ul className="ml-7 mt-1.5 space-y-0.5">
                    {item.submenu!.map((subItem: any, index: number) => {
                      const SubIcon = subItem.icon;
                      const hasNestedSubmenu = Array.isArray(subItem.submenu) && subItem.submenu.length > 0;
                      const isSubActive = location.pathname === subItem.href || (hasNestedSubmenu && subItem.submenu?.some((n: any) => location.pathname === n.href));

                      return (
                        <li key={subItem.id} style={{ animationDelay: `${index * 0.04}s` }}>
                          <div className="flex items-center">
                            <Link
                              to={subItem.href}
                              onClick={(e) => {
                                if (hasNestedSubmenu) {
                                  e.preventDefault();
                                  toggleDropdown(subItem.id);
                                  return;
                                }
                                closeSidebarOnMobile();
                              }}
                              className={`
                                group flex items-center flex-1 gap-3 px-3 py-2 rounded-lg text-xs font-semibold tracking-tight transition-all duration-200
                                ${isSubActive
                                  ? "bg-blue-500/20 text-blue-300 border-l-2 border-blue-500"
                                  : "text-white/40 hover:bg-white/5 hover:text-white/80"
                                }
                              `}
                              target={subItem.target}
                            >
                              <SubIcon
                                size={18}
                                className={`
                                  flex-shrink-0 transition-colors duration-200
                                  ${isSubActive ? "text-blue-400" : "text-white/40 group-hover:text-white/70"}
                                `}
                              />
                              <span className="flex-1">{subItem.label}</span>
                              {hasNestedSubmenu && (
                                <svg
                                  className={`w-3 h-3 transition-transform duration-200 ${openDropdowns[subItem.id] ? 'rotate-0' : '-rotate-90'}`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              )}
                            </Link>
                          </div>

                          {hasNestedSubmenu && openDropdowns[subItem.id] && (
                            <ul className="ml-7 mt-1 space-y-0.5">
                              {subItem.submenu!.map((nestedItem: any, nestedIndex: number) => {
                                const NestedIcon = nestedItem.icon;
                                const isNestedActive = location.pathname === nestedItem.href;

                                return (
                                  <li key={nestedItem.id} style={{ animationDelay: `${(index + nestedIndex + 1) * 0.04}s` }}>
                                    <Link
                                      to={nestedItem.href}
                                      onClick={closeSidebarOnMobile}
                                      className={`
                                        group flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold tracking-tight transition-all duration-200
                                        ${isNestedActive
                                          ? "bg-blue-500/20 text-blue-300 border-l-2 border-blue-500"
                                          : "text-white/40 hover:bg-white/5 hover:text-white/80"
                                        }
                                      `}
                                      target={nestedItem.target}
                                    >
                                      <NestedIcon
                                        size={18}
                                        className={`
                                          flex-shrink-0 transition-colors duration-200
                                          ${isNestedActive ? "text-blue-400" : "text-white/40 group-hover:text-white/70"}
                                        `}
                                      />
                                      <span>{nestedItem.label}</span>
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="hidden lg:flex border-t border-white/10 p-3 mt-auto">
        <Button
          variant="ghost"
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center px-2" : "gap-3 px-3"} py-2.5 rounded-lg transition-all duration-200 text-white/40 hover:bg-white/5 hover:text-white`}
          aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen size={20} className="flex-shrink-0" />
          ) : (
            <PanelLeftClose size={20} className="flex-shrink-0" />
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-gray-950">

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInFromLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeOut {
          from { opacity: 1; transform: scale(1); }
          to   { opacity: 0; transform: scale(0.95); }
        }
        .animate-slideDown { animation: slideDown 0.3s ease-out; }
        .animate-slideInLeft { animation: slideInFromLeft 0.3s ease-out; }
        .animate-fadeInUp { animation: fadeInUp 0.25s ease-out; }
        .animate-fadeOut { animation: fadeOut 0.2s ease-in; }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .sidebar-item-enter { animation: slideInFromLeft 0.3s ease-out; }
        .sidebar-item-fade-in { animation: fadeIn 0.3s ease-out; }
        .submenu-item-enter { animation: fadeInUp 0.25s ease-out; }
      `}</style>

      {/* Mobile top bar */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 lg:hidden border-b border-white/10 bg-gray-950/90 backdrop-blur-md h-[60px] text-white">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          className="rounded-lg text-white/70 hover:bg-white/10 hover:text-white"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </Button>
        <div className="flex-1 flex items-center justify-center gap-1 h-full">
          <div className="flex items-center h-full -ml-2">
            <img
              src={margadarshalabelwithicon}
              alt="Margadarsh Logo"
              className="h-full max-h-[54px] w-auto object-contain"
            />
          </div>
          <p className="text-sm font-semibold text-white/80">{organizationName || ""}</p>
        </div>
        <div className="relative profile-menu-container" ref={profileMenuRef}>
          <Button
            variant="ghost"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/10"
          >
            {user?.profile_picture ? (
              <img
                src={user.profile_picture}
                alt={userName}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-white font-semibold text-xs ">
                {userName
                  ? userName
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                  : "U"}
              </div>
            )}
          </Button>
        </div>
      </div>

      {/* Profile Dropdown Menu - Mobile */}
      {showProfileMenu && (
        <>
          <div
            className="fixed inset-0 z-[100] lg:hidden"
            onClick={() => setShowProfileMenu(false)}
          />
          <div
            className="fixed rounded-xl shadow-2xl overflow-hidden z-[101] profile-dropdown lg:hidden border border-white/10 bg-gray-950/95 backdrop-blur-xl"
            style={{
              top: '60px',
              right: '16px',
              width: '280px',
            }}
          >
            <div className="px-4 pt-4 pb-3">
              <div className="font-bold text-base mb-0.5 text-white">
                {userName || "User"}
              </div>
              <div className="text-sm text-white/40">
                {userEmial || ""}
              </div>
            </div>

            <div className="px-4 pb-3">
              <div className="rounded-xl p-1 flex items-center gap-1 bg-white/5">
                <Button
                  variant={themeMode === 'light' ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => { setThemeMode('light'); setDarkMode(false); }}
                  className={`flex-1 ${themeMode === 'light' ? 'bg-white/15' : ''}`}
                >
                  <Sun size={16} className="text-white" />
                </Button>
                <Button
                  variant={themeMode === 'dark' ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => { setThemeMode('dark'); setDarkMode(true); }}
                  className={`flex-1 ${themeMode === 'dark' ? 'bg-white/15' : ''}`}
                >
                  <Moon size={16} className="text-white" />
                </Button>
              </div>
            </div>

            <div className="border-t border-white/10"></div>

            <div className="py-2">
              <Button
                variant="ghost"
                onClick={openProfileEditModal}
                className="w-full justify-start px-4 py-2 text-sm text-white/60 hover:text-white hover:bg-white/10"
              >
                Your profile
              </Button>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start px-4 py-2 text-sm text-white/60 hover:text-white hover:bg-white/10"
              >
                Log out
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Profile Dropdown Menu - Desktop */}
      {showProfileMenu && (
        <>
          <div
            className="fixed inset-0 z-[100] hidden lg:block "
            onClick={() => setShowProfileMenu(false)}
          />
          <div
            className="fixed rounded-xl shadow-2xl overflow-hidden z-[101] profile-dropdown hidden lg:block border border-white/10 bg-gray-950/95 backdrop-blur-xl"
            style={{
              top: `${profileMenuPosition.top + 50}px`,
              right: '24px',
              width: '280px',
            }}
          >
            <div className="px-4 pt-4 pb-3">
              <div className="font-bold text-base mb-0.5 text-white">{userName || "User"}</div>
              <div className="text-sm text-white/40">{userEmial || ""}</div>
            </div>

            <div className="px-4 pb-3">
              <div className="rounded-xl p-1 flex items-center gap-1 bg-white/5">
                <Button variant={themeMode === 'light' ? "secondary" : "ghost"} size="sm"
                  onClick={() => { setThemeMode('light'); setDarkMode(false); }}
                  className={`flex-1 ${themeMode === 'light' ? 'bg-white/15' : ''}`}>
                  <Sun size={16} className="text-white" />
                </Button>
                <Button variant={themeMode === 'dark' ? "secondary" : "ghost"} size="sm"
                  onClick={() => { setThemeMode('dark'); setDarkMode(true); }}
                  className={`flex-1 ${themeMode === 'dark' ? 'bg-white/15' : ''}`}>
                  <Moon size={16} className="text-white" />
                </Button>
              </div>
            </div>

            <div className="border-t border-white/10"></div>

            <div className="py-2">
              <Button variant="ghost" onClick={openProfileEditModal}
                className="w-full justify-start px-4 py-2 text-sm text-white/60 hover:text-white hover:bg-white/10">
                Your profile
              </Button>
              <Button variant="ghost" onClick={handleLogout}
                className="w-full justify-start px-4 py-2 text-sm text-white/60 hover:text-white hover:bg-white/10">
                Log out
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Top Header Bar - Desktop */}
      <div className="hidden lg:flex items-center justify-between pl-3 pr-6 py-2 h-[49px] bg-gray-950/90 backdrop-blur-md border-b border-white/10">
        <img
          src={margadarshalabelwithicon}
          alt="Margadarsh Logo"
          className="h-12 md:h-16 lg:h-20 w-auto object-contain"
        />

        <div className="flex items-center gap-4 h-full">
          <div className="relative profile-menu-container" ref={profileMenuRef}>
            <Button
              variant="ghost"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10"
            >
              <div className="flex-shrink-0">
                {user?.profile_picture ? (
                  <img
                    src={user.profile_picture}
                    alt={userName}
                    className="w-8 h-8 rounded-full object-cover border-2 "
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 shadow-lg flex items-center justify-center text-white font-bold text-xs">
                    {userName
                      ? userName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
                      : "U"}
                  </div>
                )}
              </div>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[90] lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className={`fixed left-0 top-0 bottom-0 w-64 z-[91] lg:hidden bg-gray-950 border-r border-white/10 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300`}>
            <div className="h-full w-full overflow-hidden">
              {sidebarContent}
            </div>
          </div>
        </>
      )}

      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        {/* Desktop Sidebar */}
        <div className={`hidden ${isSidebarCollapsed ? "w-14" : "w-52"} flex-shrink-0 lg:flex lg:h-[calc(100vh-49px)] transition-all duration-300 bg-gray-950 border-r border-white/10`}>
          <div className="h-full w-full rounded-tr-lg overflow-hidden">
            {sidebarContent}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto h-[calc(100vh-49px)] bg-gray-950 border-l border-white/10">
          <div className="min-h-full w-full rounded-tl-lg">
            {isElectionResultsPage ? (
              <Outlet context={{ darkMode, user }} />
            ) : (
              <Outlet context={{ darkMode, user }} />
            )}
          </div>
        </div>
      </div>

      {/* Profile Edit Modal */}
      <Dialog open={showProfileEditModal} onOpenChange={setShowProfileEditModal}>
        <DialogContent className="bg-gray-950 border border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">
              Edit Profile
            </DialogTitle>
            <DialogDescription className="text-white/40">
              Update your profile information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Profile Picture */}
            <div className="space-y-2">
              <Label className="text-white">
                Profile Picture
              </Label>
              <div className="flex justify-center">
                <div className="relative group">
                  <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white/10 shadow-lg">
                    {profilePicturePreview ? (
                      <img
                        src={profilePicturePreview}
                        alt="Profile preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white/5">
                        <UserIcon className="w-16 h-16 text-white/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded-full">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <label
                    htmlFor="profile_picture"
                    className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 flex items-center justify-center cursor-pointer shadow-lg border-4 border-gray-950 transition-all duration-200 hover:scale-110"
                  >
                    <Pencil className="w-5 h-5 text-white" />
                    <input
                      id="profile_picture"
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
              <p className="text-xs text-center text-white/40">
                Click the edit icon to change your profile picture
              </p>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">
                Name
              </Label>
              <Input
                id="name"
                value={profileFormData.name}
                onChange={(e) => setProfileFormData({ ...profileFormData, name: e.target.value })}
                placeholder="Enter your name"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>

            {/* Age */}
            <div className="space-y-2">
              <Label htmlFor="age" className="text-white">
                Age
              </Label>
              <Input
                id="age"
                type="number"
                value={profileFormData.age}
                onChange={(e) => setProfileFormData({ ...profileFormData, age: e.target.value })}
                placeholder="Enter your age"
                min="1"
                max="120"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label htmlFor="gender" className="text-white">
                Gender
              </Label>
              <Select
                value={profileFormData.gender}
                onValueChange={(value) => setProfileFormData({ ...profileFormData, gender: value })}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent className="bg-gray-950 border-white/10">
                  <SelectItem value="male" className="text-white hover:bg-white/10">Male</SelectItem>
                  <SelectItem value="female" className="text-white hover:bg-white/10">Female</SelectItem>
                  <SelectItem value="other" className="text-white hover:bg-white/10">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Organization Name */}
            <div className="space-y-2">
              <Label htmlFor="organization_name" className="text-white">
                Organization
              </Label>
              <Input
                id="organization_name"
                value={profileFormData.organization_name}
                onChange={(e) => setProfileFormData({ ...profileFormData, organization_name: e.target.value })}
                placeholder="Enter organization name"
                disabled={!isAdmin}
                className={`bg-white/5 border-white/10 text-white placeholder:text-white/30 ${!isAdmin ? "opacity-60 cursor-not-allowed" : ""}`}
              />
              {!isAdmin && (
                <p className="text-xs text-white/40">
                  Only admins can edit organization name
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeProfileEditModal}
              disabled={isUpdatingProfile}
              className="border-white/10 text-black"
            >
              Cancel
            </Button>
            <Button
              onClick={handleProfileUpdate}
              disabled={isUpdatingProfile}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isUpdatingProfile ? "Updating..." : "Update Profile"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}