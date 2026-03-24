import { useNavigate, useParams, useOutletContext } from "@remix-run/react";
import { LayoutTemplate, Phone, Send } from "lucide-react";
import { useEffect, useState } from "react";

interface CommunicationLandingProps {
  view?: "default" | "whatsapp" | "ivr";
}

export default function CommunicationLanding({ view = "default" }: CommunicationLandingProps) {
  const navigate = useNavigate();
  const context = useOutletContext() as { darkMode?: boolean } | undefined;
  const darkMode = context?.darkMode || false;
  const [isDark, setIsDark] = useState(darkMode);

  useEffect(() => {
    setIsDark(darkMode);
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    return () => observer.disconnect();
  }, [darkMode]);

  // WhatsApp cards (Template and Campaign)
  const whatsappCards = [
    {
      id: "templates",
      title: "Templates",
      description: "Create and manage WhatsApp message templates",
      icon: LayoutTemplate,
      href: `/elections/templates`,
      comingSoon: false,
    },
    {
      id: "campaign",
      title: "Campaign",
      description: "Create and manage WhatsApp campaigns with templates and messaging",
      icon: Send,
      href: `/elections/campaign`,
      comingSoon: false,
    },
  ];

  // IVR card
  const ivrCard = {
    id: "ivr",
    title: "IVR",
    description: "Set up interactive voice response campaigns",
    icon: Phone,
    href: null,
    comingSoon: true,
  };

  const renderCard = (card: typeof whatsappCards[0] | typeof ivrCard) => {
    const Icon = card.icon;
    return (
      <button
        key={card.id}
        onClick={() => !card.comingSoon && card.href && navigate(card.href)}
        disabled={card.comingSoon}
        className={`group relative rounded-xl p-6 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:ring-offset-2 bg-[#DDDADA] dark:bg-[#2d2d2d] dark:text-[#ececf1] ${
          card.comingSoon 
            ? 'opacity-60 cursor-not-allowed' 
            : 'hover:bg-[#9B9492] hover:shadow-lg cursor-pointer'
        }`}
      >
        {/* Icon - Yellow square with rounded corners */}
        <div className="w-10 h-10 flex items-center justify-center mb-4 rounded-lg bg-[#f59e0b]">
          <Icon className="w-5 h-5 text-black" />
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold mb-2 dark:text-[#ececf1] text-black">
          {card.title}
        </h3>

        {/* Description */}
        <p className="text-sm leading-relaxed mb-4 dark:text-[#d1d5db] text-black">
          {card.description}
        </p>

        {/* Coming Soon Badge or Label */}
        {card.comingSoon ? (
          <div className="text-xs font-medium mt-auto dark:text-[#f59e0b] text-black">
            Coming Soon
          </div>
        ) : (
          <div className="text-xs font-medium mt-auto dark:text-[#8e8ea0] text-black">
            {card.id === "templates" ? "Template" : "Campaign"}
          </div>
        )}
      </button>
    );
  };

  return (
    <div className={`w-full h-full min-h-screen ${isDark ? 'bg-[#1f1f1f]' : 'bg-gray-100'}`}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {view === "whatsapp" ? (
          <div>
            <p className={`text-sm mb-8 ${isDark ? 'text-[#d1d5db]' : 'text-[#565869]'}`}>
              Choose a WhatsApp option to get started
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
              {whatsappCards.map((card) => renderCard(card))}
            </div>
          </div>
        ) : view === "ivr" ? (
          <div>
            <p className={`text-sm mb-8 ${isDark ? 'text-[#d1d5db]' : 'text-[#565869]'}`}>
              IVR Campaign Management
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
              {renderCard(ivrCard)}
            </div>
          </div>
        ) : (
          <div>
            <p className={`text-sm mb-8 ${isDark ? 'text-[#d1d5db]' : 'text-[#565869]'}`}>
              Choose a communication option from the sidebar to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

