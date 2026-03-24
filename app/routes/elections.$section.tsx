import { useParams, useNavigate } from "@remix-run/react";
import { useState, useEffect } from "react";
import News from "~/components/ElectionsWeb/News/manageFeed";
import VotersDB from "~/components/ElectionsWeb/VotersList/VotersDB";
// import Schemes from "~/components/ElectionsWeb/Schemes";
import Elections from "~/components/ElectionsWeb/Elections";
import AssemblyAnalysis from "~/components/ElectionsWeb/Assembly";
import CompareElections from "~/components/ElectionsWeb/Compare";
import Adminpanel from "~/components/ElectionsWeb/Adminpanel";
// import Whatsapp from "~/components/ElectionsWeb/whatsapp";
import Voice from "~/components/ElectionsWeb/voice";

import TemplateManager from "~/components/ElectionsWeb/Template";
import CampaignManager from "~/components/ElectionsWeb/campaign";
import CampaignAnalysis from "~/components/ElectionsWeb/Analysis";
import Segento from "~/components/ElectionsWeb/Segento";
import Contacts from "~/components/ElectionsWeb/contacts";
import AllContacts from "~/components/ElectionsWeb/newcontacts";
import Myvoters from "~/components/ElectionsWeb/Myvoters";
import IVRAI from "~/components/ElectionsWeb/ivrai";
import IVRConversation from "~/components/ElectionsWeb/ivrconversation";
import ElectionResults from "~/components/ElectionsResults/ResultsMobile";



import MargadarshSurveysList from "~/components/ElectionsWeb/Survey/MargadarshSurveysList";
import SurveyNew from "~/components/ElectionsWeb/Survey/SurveyNew";
import SurveyBuilder from "~/components/ElectionsWeb/Survey/SurveyBuilder";
import SurveySummary from "~/components/ElectionsWeb/Survey/SurveySummary";
import SurveyResponses from "~/components/ElectionsWeb/Survey/SurveyResponses";
import SurveyAuditLogs from "~/components/ElectionsWeb/Survey/SurveyAuditLogs";
import SurveyLaunch from "~/components/ElectionsWeb/Survey/SurveyLaunch";
import ManageReports from "~/components/ElectionsWeb/Survey/surveyReports/manageReports";
import CommunicationLanding from "~/components/ElectionsWeb/CommunicationLanding";
import HybridSearch from "~/components/ElectionsWeb/HybridSearch/search";
import GrievancesList from "~/components/ElectionsWeb/AdminGrievance/GrievancesList";
import GrievanceThread from "~/components/ElectionsWeb/AdminGrievance/GrievanceThread";
import CreateGrievance from "~/components/ElectionsWeb/AdminGrievance/CreateGrievance";
import ManageGrievance from "~/components/ElectionsWeb/AdminGrievance/manageGrievance";
import TicketsDashboard from "~/components/ElectionsWeb/AdminGrievance/TicketsDashboard";
import Team from "~/components/ElectionsWeb/AdminGrievance/Team";
import CreateTasks from "~/components/ElectionsWeb/Tasks/CreateTasks";
import MyTasks from "~/components/ElectionsWeb/Tasks/MyTasks";
import MonitorTrending from "~/components/ElectionsWeb/MonitorTrending";
import MonitorPopularMedia from "~/components/ElectionsWeb/MonitorPopularMedia";
// import Razorpay from "~/components/ElectionsWeb/razorpay";



export default function ElectionsSection() {
  const { section } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUserInfo = JSON.parse(localStorage.getItem("user_info") || "{}");
    setUser(storedUserInfo);
  }, []);

  // Redirect landing pages to their first submenu item
  useEffect(() => {
    if (!user || !section) return;

    if (section === "reports") {
      navigate(`/elections/assembly-analysis`, { replace: true });
    } else if (section === "voters") {
      navigate(`/elections/votersdb`, { replace: true });
    } else if (section === "surveys") {
      navigate(`/elections/surveys-list`, { replace: true });
    } else if (section === "communication") {
      navigate(`/elections/whatsapp`, { replace: true });
    } else if (section === "grievances") {
      navigate(`/elections/grievances-list`, { replace: true });
    } else if (section === "tasks") {
      navigate(`/elections/create-tasks`, { replace: true });
    } else if (section === "monitor") {
      navigate(`/elections/monitor-topics`, { replace: true });
    }
  }, [section, user, navigate]);

  if (!user) return <div>Loading...</div>;

  const roleLower = (user.role || "").toLowerCase();
  const isAdmin = roleLower === "admin";

  switch (section) {
    case "monitor-topics":
      return <News />;

    case "monitor-breaking":
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center text-white/70">
            <h2 className="text-xl font-semibold mb-2">Breaking</h2>
            <p>Coming soon.</p>
          </div>
        </div>
      );

    case "monitor-trending":
      return <MonitorTrending />;

    case "monitor-popular-media":
      return <MonitorPopularMedia />;

    case "communication":
      return <CommunicationLanding view="default" />;

    case "whatsapp":
      return <CampaignManager />;

    case "ivr":
      return <CommunicationLanding view="ivr" />;

    case "assembly-analysis":
      return <AssemblyAnalysis />;

    case "compare-elections":
      return <CompareElections />;
    case "myvoters":
      return <Myvoters />;

    case "votersdb":
      return roleLower === "agent" || isAdmin ? (
        <VotersDB />
      ) : (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">Access Denied</h1>
            <p className="text-white/50">You don't have permission to access this page.</p>
          </div>
        </div>
      );

    // case "razorpay":
    //   return <Razorpay />;


    case "hybrid-search":
      return <HybridSearch />;

    case "elections":
      return <Elections />;
    // case "whatsapp":
    //   return <Whatsapp />;
    case "voice":
      return <Voice />;

    case "templates":
      return <TemplateManager />;
    case "campaign":
      return <CampaignManager />;
    case "analysis":
      return <CampaignAnalysis />;
    case "segento":
      return <Segento />;
    case "contacts":
      return <Contacts />;
    case "newcontacts":
      return <AllContacts />;
    case "adminpanel":
      // ✅ Hard guard: admins and agents
      return isAdmin || roleLower === "agent" ? (
        <Adminpanel />
      ) : (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">Access Denied</h1>
            <p className="text-white/50">You don't have permission to access this page.</p>
          </div>
        </div>
      );

    case "election-results":
      return <ElectionResults />;

    case "voiceai":
      return <IVRAI />;
    case "voiceconversation":
      return <IVRConversation />;


    case "surveys-list":
      return <MargadarshSurveysList />;

    case "surveys-new":
      return <SurveyNew />;

    case "survey-builder":
      return <SurveyBuilder />;

    case "survey-summary":
      return <SurveySummary />;

    case "survey-responses":
      return <SurveyResponses />;

    case "survey-audit":
      return <SurveyAuditLogs />;

    case "survey-launch":
      return <SurveyLaunch />;

    case "survey-reports":
      return <ManageReports />;

    case "grievances-list":
      return <GrievancesList />;

    case "add-grievance":
      return <CreateGrievance />;

    case "manage-grievance":
      return <ManageGrievance />;

    case "tickets":
      return <TicketsDashboard />;

    case "team":
      return <Team />;

    case "create-tasks":
      return <CreateTasks />;

    case "my-tasks":
      return <MyTasks />;

    default:
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-2">Page Not Found</h1>
            <p className="text-white/50">The page you're looking for doesn't exist.</p>
          </div>
        </div>
      );
  }
}
