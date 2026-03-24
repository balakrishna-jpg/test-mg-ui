export const products = [
    {
        skuCode: "SKU001",
        name: "Monitor",
        description: "Topics, breaking news, trending, and popular media",
        icon: "icon_news",
        gradient: "from-blue-500 to-cyan-500",
        bgLight: "bg-blue-50",
        bgDark: "bg-blue-900/20",
        textColor: "text-blue-600",
        features: [
            "Live News Feed",
            "Category & Tag Filters",
            "Breaking News Alerts",
            "Bookmarking & Saved Articles",
            "Push Notifications",
            "Analytics & Readership Reports",
            "Export to PDF / Excel"
        ],
        plans: [
            { planId: "PLN_INR_MONTHLY", type: "monthly", price: 499, currency: "INR", region: "IN", durationDays: 30, description: "Monthly billing – India" },
            { planId: "PLN_INR_YEARLY", type: "yearly", price: 4999, currency: "INR", region: "IN", durationDays: 365, description: "Yearly billing – India (save ~17%)" },
            { planId: "PLN_USD_MONTHLY", type: "monthly", price: 6, currency: "USD", region: "INTL", durationDays: 30, description: "Monthly billing – International" },
            { planId: "PLN_USD_YEARLY", type: "yearly", price: 60, currency: "USD", region: "INTL", durationDays: 365, description: "Yearly billing – International (save ~17%)" }
        ],
        status: "active",
        subProducts: []
    },
    {
        skuCode: "SKU002",
        name: "Communication",
        description: "Multi-channel communication platform for broadcasts and alerts",
        icon: "icon_communication",
        gradient: "from-violet-500 to-purple-600",
        bgLight: "bg-violet-50",
        bgDark: "bg-violet-900/20",
        textColor: "text-violet-600",
        features: [
            "Multi-Channel Broadcast",
            "Template Management",
            "Audience Segmentation",
            "Delivery & Read Reports",
            "Scheduling & Automation",
            "API Integration Support"
        ],
        plans: [
            { planId: "PLN_INR_MONTHLY", type: "monthly", price: 999, currency: "INR", region: "IN", durationDays: 30, description: "Monthly billing – India" },
            { planId: "PLN_INR_YEARLY", type: "yearly", price: 9999, currency: "INR", region: "IN", durationDays: 365, description: "Yearly billing – India (save ~17%)" },
            { planId: "PLN_USD_MONTHLY", type: "monthly", price: 12, currency: "USD", region: "INTL", durationDays: 30, description: "Monthly billing – International" },
            { planId: "PLN_USD_YEARLY", type: "yearly", price: 120, currency: "USD", region: "INTL", durationDays: 365, description: "Yearly billing – International (save ~17%)" }
        ],
        status: "active",
        subProducts: [
            {
                skuCode: "SKU002-01",
                name: "IVR",
                description: "Interactive Voice Response – automated voice call system",
                icon: "icon_ivr",
                features: [
                    "Custom IVR Call Flows",
                    "Bulk Voice Broadcasting",
                    "DTMF Input Handling",
                    "Multi-Language Voice Support",
                    "Call Analytics & Reports",
                    "Missed Call Campaigns",
                    "API & Webhook Integration"
                ],
                plans: [
                    { planId: "PLN_INR_MONTHLY", type: "monthly", price: 599, currency: "INR", region: "IN", durationDays: 30, description: "Monthly billing – India" },
                    { planId: "PLN_INR_YEARLY", type: "yearly", price: 5999, currency: "INR", region: "IN", durationDays: 365, description: "Yearly billing – India (save ~17%)" },
                    { planId: "PLN_USD_MONTHLY", type: "monthly", price: 7, currency: "USD", region: "INTL", durationDays: 30, description: "Monthly billing – International" },
                    { planId: "PLN_USD_YEARLY", type: "yearly", price: 70, currency: "USD", region: "INTL", durationDays: 365, description: "Yearly billing – International (save ~17%)" }
                ],
                status: "active",
                parentSku: "SKU002"
            },
            {
                skuCode: "SKU002-02",
                name: "WhatsApp",
                description: "WhatsApp Business API messaging and campaign management",
                icon: "icon_whatsapp",
                features: [
                    "Bulk WhatsApp Messaging",
                    "Approved Template Messages",
                    "Media Sharing (image / video / document)",
                    "Two-way Messaging",
                    "Delivery & Read Receipts",
                    "WhatsApp Chatbot Support",
                    "Campaign Analytics"
                ],
                plans: [
                    { planId: "PLN_INR_MONTHLY", type: "monthly", price: 699, currency: "INR", region: "IN", durationDays: 30, description: "Monthly billing – India" },
                    { planId: "PLN_INR_YEARLY", type: "yearly", price: 6999, currency: "INR", region: "IN", durationDays: 365, description: "Yearly billing – India (save ~17%)" },
                    { planId: "PLN_USD_MONTHLY", type: "monthly", price: 9, currency: "USD", region: "INTL", durationDays: 30, description: "Monthly billing – International" },
                    { planId: "PLN_USD_YEARLY", type: "yearly", price: 90, currency: "USD", region: "INTL", durationDays: 365, description: "Yearly billing – International (save ~17%)" }
                ],
                status: "active",
                parentSku: "SKU002"
            }
        ]
    },
    {
        skuCode: "SKU003",
        name: "Grievance",
        description: "Citizen grievance submission, tracking and resolution portal",
        icon: "icon_grievance",
        gradient: "from-orange-500 to-amber-500",
        bgLight: "bg-orange-50",
        bgDark: "bg-orange-900/20",
        textColor: "text-orange-600",
        features: [
            "Online Grievance Submission",
            "Unique Ticket ID Per Complaint",
            "Department-Wise Auto Routing",
            "SLA & Deadline Tracking",
            "Status Notifications (SMS / WhatsApp)",
            "Escalation Management",
            "Resolution & Closure Reports"
        ],
        plans: [
            { planId: "PLN_INR_MONTHLY", type: "monthly", price: 399, currency: "INR", region: "IN", durationDays: 30, description: "Monthly billing – India" },
            { planId: "PLN_INR_YEARLY", type: "yearly", price: 3999, currency: "INR", region: "IN", durationDays: 365, description: "Yearly billing – India (save ~17%)" },
            { planId: "PLN_USD_MONTHLY", type: "monthly", price: 5, currency: "USD", region: "INTL", durationDays: 30, description: "Monthly billing – International" },
            { planId: "PLN_USD_YEARLY", type: "yearly", price: 50, currency: "USD", region: "INTL", durationDays: 365, description: "Yearly billing – International (save ~17%)" }
        ],
        status: "active",
        subProducts: []
    },
    {
        skuCode: "SKU004",
        name: "Survey",
        description: "Create, distribute and analyse surveys with real-time insights",
        icon: "icon_survey",
        gradient: "from-emerald-500 to-teal-500",
        bgLight: "bg-emerald-50",
        bgDark: "bg-emerald-900/20",
        textColor: "text-emerald-600",
        features: [
            "Unlimited Survey Creation",
            "Multiple Question Types (MCQ / rating / open-ended)",
            "Multi-Language Survey Support",
            "Publish Survey Link",
            "Real-Time Response Dashboard",
            "Geo-Tagged Responses",
            "Export Responses To Excel / PDF"
        ],
        plans: [
            { planId: "PLN_INR_MONTHLY", type: "monthly", price: 599, currency: "INR", region: "IN", durationDays: 30, description: "Monthly billing – India" },
            { planId: "PLN_INR_YEARLY", type: "yearly", price: 5999, currency: "INR", region: "IN", durationDays: 365, description: "Yearly billing – India (save ~17%)" },
            { planId: "PLN_USD_MONTHLY", type: "monthly", price: 7, currency: "USD", region: "INTL", durationDays: 30, description: "Monthly billing – International" },
            { planId: "PLN_USD_YEARLY", type: "yearly", price: 70, currency: "USD", region: "INTL", durationDays: 365, description: "Yearly billing – International (save ~17%)" }
        ],
        status: "active",
        subProducts: []
    },
    {
        skuCode: "SKU005",
        name: "Elections",
        description: "End-to-end election campaign management and analytics platform",
        icon: "icon_elections",
        gradient: "from-red-500 to-rose-600",
        bgLight: "bg-red-50",
        bgDark: "bg-red-900/20",
        textColor: "text-red-600",
        features: [
            "Voter Data Management",
            "Booth-level Analytics",
            "Elections Analytics",
            "Constituency Swing Analysis",
            "Download Constituency Wise Reports",
            "Visualisations & Reports"
        ],
        plans: [
            { planId: "PLN_INR_MONTHLY", type: "monthly", price: 1499, currency: "INR", region: "IN", durationDays: 30, description: "Monthly billing – India" },
            { planId: "PLN_INR_YEARLY", type: "yearly", price: 14999, currency: "INR", region: "IN", durationDays: 365, description: "Yearly billing – India (save ~17%)" },
            { planId: "PLN_USD_MONTHLY", type: "monthly", price: 18, currency: "USD", region: "INTL", durationDays: 30, description: "Monthly billing – International" },
            { planId: "PLN_USD_YEARLY", type: "yearly", price: 180, currency: "USD", region: "INTL", durationDays: 365, description: "Yearly billing – International (save ~17%)" }
        ],
        status: "active",
        subProducts: []
    }
];
