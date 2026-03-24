// app/routes/public.grievance.$token.tsx

import { useState, useEffect, useRef } from "react";
import { useParams } from "@remix-run/react";
import {
  Send,
  Paperclip,
  Loader2,
  User,
  Headphones,
  Globe,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  MessageSquare,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  getPublicTicketThread,
  addPublicTicketReply,
} from "~/api";
import { message } from "antd";
import dayjs from "dayjs";

const STATUS_COLORS = {
  open: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  in_progress: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  resolved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  closed: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
};

const STATUS_ICONS = {
  open: AlertCircle,
  in_progress: Clock,
  resolved: CheckCircle,
  closed: XCircle,
};

export default function PublicGrievanceView() {
  const { token } = useParams();
  const [ticket, setTicket] = useState(null);
  const [thread, setThread] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [userName, setUserName] = useState("");
  const messagesEndRef = useRef(null);

  const fetchThread = async () => {
    setLoading(true);
    try {
      const response = await getPublicTicketThread(token);
      if (response?.success) {
        setTicket(response.data);
        setThread(response.data?.thread || []);
      }
    } catch (error) {
      console.error("Error fetching thread:", error);
      message.error("Failed to load ticket. Invalid or expired link.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchThread();
    }
  }, [token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread]);

  const handleReply = async () => {
    if (!replyText.trim()) {
      message.warning("Please enter a message");
      return;
    }

    setReplying(true);
    try {
      await addPublicTicketReply(token, {
        name: userName.trim() || undefined,
        description: replyText.trim(),
        attachments: [],
      });

      message.success("Reply sent successfully");
      setReplyText("");
      setUserName("");
      fetchThread(); // Refresh thread
    } catch (error) {
      console.error("Error sending reply:", error);
      message.error("Failed to send reply");
    } finally {
      setReplying(false);
    }
  };

  const getAuthorDisplay = (message) => {
    if (message.author_type === "user") {
      return { name: "User", icon: User, color: "bg-blue-500" };
    } else if (message.author_type === "support") {
      return { name: "Support Team", icon: Headphones, color: "bg-green-500" };
    } else if (message.author_type === "public_user") {
      return {
        name: message.name || "Anonymous",
        icon: Globe,
        color: "bg-purple-500",
      };
    }
    return { name: "Unknown", icon: User, color: "bg-gray-500" };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#111111]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0EA5E9] dark:text-[#F2700D]" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-[#111111] px-4">
        <MessageSquare className="w-16 h-16 text-gray-400 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-[#ececf1] mb-2">
          Ticket Not Found
        </h1>
        <p className="text-gray-600 dark:text-[#8e8ea0] text-center max-w-md">
          The ticket you're looking for doesn't exist or the link has expired.
        </p>
      </div>
    );
  }

  const StatusIcon = STATUS_ICONS[ticket.status] || AlertCircle;

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#111111]">
      {/* Header */}
      <div className="border-b border-[#e5e5e6] dark:border-[#3d3d3d] bg-white dark:bg-[#111111] px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-6 h-6 text-[#0EA5E9] dark:text-[#F2700D]" />
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-[#ececf1]">
              Public Support Ticket
            </h1>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-sm text-gray-600 dark:text-[#8e8ea0]">
              Ticket #{ticket.ticket_id?.slice(-8)}
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-sm text-gray-600 dark:text-[#8e8ea0]">
              {ticket.ticket_type?.replace("_", " ")}
            </span>
            <span className="text-gray-400">•</span>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[ticket.status] || STATUS_COLORS.open}`}
            >
              <StatusIcon className="w-3 h-3" />
              {ticket.status?.replace("_", " ") || "open"}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {thread.map((message, index) => {
            const author = getAuthorDisplay(message);
            const AuthorIcon = author.icon;
            const isSupport = message.author_type === "support";

            return (
              <div
                key={message.message_id || index}
                className={`flex gap-3 ${isSupport ? "justify-start" : "justify-end"}`}
              >
                {!isSupport && (
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${author.color} flex-shrink-0`}
                  >
                    <AuthorIcon className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-3 ${isSupport
                      ? "bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-300"
                      : "bg-gray-100 dark:bg-[#1f1f1f] text-gray-900 dark:text-[#ececf1]"
                    }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium">{author.name}</span>
                    {message.is_initial && (
                      <span className="text-xs opacity-70">(Initial)</span>
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.description}
                  </p>
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {message.attachments.map((att, idx) => (
                        <a
                          key={idx}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs underline opacity-90 hover:opacity-100"
                        >
                          <Paperclip className="w-3 h-3" />
                          {att.filename}
                        </a>
                      ))}
                    </div>
                  )}
                  <div className="text-xs opacity-70 mt-2">
                    {message.created_at
                      ? dayjs(message.created_at).format("MMM DD, YYYY hh:mm A")
                      : "-"}
                  </div>
                </div>
                {isSupport && (
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${author.color} flex-shrink-0`}
                  >
                    <AuthorIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Reply Input */}
      {ticket.status !== "closed" && (
        <div className="border-t border-[#e5e5e6] dark:border-[#3d3d3d] bg-white dark:bg-[#111111] px-6 py-6">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-name" className="text-gray-900 dark:text-[#ececf1]">
                Your Name (Optional)
              </Label>
              <Input
                id="user-name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
                className="max-w-xs"
              />
            </div>
            <div className="flex gap-3">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply..."
                className="flex-1 min-h-[100px]"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    handleReply();
                  }
                }}
              />
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleReply}
                  disabled={replying || !replyText.trim()}
                  className="h-[100px]"
                >
                  {replying ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-[#8e8ea0]">
              Press Cmd/Ctrl + Enter to send
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
