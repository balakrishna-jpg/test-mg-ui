// app/routes/public-grievance.$token.tsx
// This route handles: /public-grievance/:token

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
  Printer,
  FileText,
  Copy,
  Check,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Image as ImageIcon,
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
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const STATUS_COLORS = {
  open: "bg-blue-500 text-white",
  in_progress: "bg-yellow-500 text-white",
  resolved: "bg-green-500 text-white",
  closed: "bg-gray-500 text-white",
};

const STATUS_LABELS = {
  open: "Awaiting moderation!",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

const TICKET_TYPE_LABELS = {
  general: "General",
  technical: "Technical",
  election_data: "Election Data",
  other: "Other",
};

// Helper function to get initials from name
const getInitials = (name) => {
  if (!name) return "A";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Helper function to get avatar color
const getAvatarColor = (name) => {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-orange-500",
    "bg-indigo-500",
  ];
  if (!name) return colors[0];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

export default function PublicGrievanceView() {
  const { token } = useParams();
  const [ticket, setTicket] = useState(null);
  const [thread, setThread] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [userName, setUserName] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [copied, setCopied] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

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

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = files.map((file) => ({
      file,
      filename: file.name,
      size: file.size,
    }));
    setAttachments([...attachments, ...newAttachments]);
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleReply = async () => {
    if (!replyText.trim()) {
      message.warning("Please enter a message");
      return;
    }

    setReplying(true);
    try {
      // TODO: Upload attachments first if needed
      const attachmentData = attachments.map((att) => ({
        filename: att.filename,
        url: URL.createObjectURL(att.file), // In production, upload to storage first
        content_type: att.file.type,
      }));

      await addPublicTicketReply(token, {
        name: userName.trim() || undefined,
        description: replyText.trim(),
        attachments: attachmentData,
      });

      message.success("Reply sent successfully");
      setReplyText("");
      setUserName("");
      setAttachments([]);
      setShowReplyForm(false);
      fetchThread(); // Refresh thread
    } catch (error) {
      console.error("Error sending reply:", error);
      message.error("Failed to send reply");
    } finally {
      setReplying(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    message.success("Link copied to clipboard!");
  };

  const handlePrint = () => {
    window.print();
  };

  const getAuthorDisplay = (message) => {
    if (message.author_type === "user") {
      return { name: "User", icon: User, color: "bg-blue-500" };
    } else if (message.author_type === "support") {
      return { name: "Support Team", icon: Headphones, color: "bg-green-500" };
    } else if (message.author_type === "public_user") {
      const name = message.name || "Anonymous";
      return {
        name,
        icon: Globe,
        color: getAvatarColor(name),
        initials: getInitials(name),
      };
    }
    return { name: "Unknown", icon: User, color: "bg-gray-500", initials: "U" };
  };

  // Get initial ticket from thread
  const initialTicket = thread.find((msg) => msg.is_initial) || thread[0];
  const initialAuthor = initialTicket ? getAuthorDisplay(initialTicket) : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#111111]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0EA5E9] dark:text-[#F2700D]" />
      </div>
    );
  }

  if (!ticket || !initialTicket) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#111111] px-4">
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

  const replies = thread.filter((msg) => !msg.is_initial);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#111111] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Initial Ticket Card */}
        <div className="bg-white dark:bg-[#1f1f1f] rounded-lg shadow-sm border border-gray-200 dark:border-[#3d3d3d] mb-6">
          {/* Header with Title and Actions */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-[#3d3d3d] flex items-start justify-between">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-[#ececf1] flex-1 pr-4">
              {initialTicket.description?.substring(0, 100) || "Support Ticket"}
              {initialTicket.description?.length > 100 && "..."}
            </h1>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrint}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-[#ececf1] transition-colors"
                title="Print"
              >
                <Printer className="w-5 h-5" />
              </button>
              <button
                onClick={handleCopyLink}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-[#ececf1] transition-colors"
                title="Copy link"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <FileText className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Ticket Metadata */}
          <div className="px-6 py-4">
            <div className="flex items-start gap-4 mb-4">
              {/* Author Avatar */}
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-medium ${initialAuthor?.color || "bg-blue-500"}`}
              >
                {initialAuthor?.initials || "U"}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <span className="font-medium text-gray-900 dark:text-[#ececf1]">
                    {initialAuthor?.name || "User"}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-[#8e8ea0]">
                    {TICKET_TYPE_LABELS[ticket.ticket_type] || ticket.ticket_type}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-[#8e8ea0]">
                    {initialTicket.created_at
                      ? dayjs(initialTicket.created_at).fromNow()
                      : "just now"}
                  </span>
                </div>

                {/* Status Badge */}
                <div className="mb-4">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[ticket.status] || STATUS_COLORS.open}`}
                  >
                    {STATUS_LABELS[ticket.status] || "Open"}
                  </span>
                </div>
              </div>
            </div>

            {/* Ticket Description */}
            <div className="mb-4">
              <p className="text-gray-700 dark:text-[#d1d5db] leading-relaxed whitespace-pre-wrap">
                {initialTicket.description}
              </p>
            </div>

            {/* Attachments */}
            {initialTicket.attachments && initialTicket.attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                {initialTicket.attachments.map((att, idx) => (
                  <a
                    key={idx}
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <Paperclip className="w-4 h-4" />
                    {att.filename}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Replies Section */}
        {replies.length > 0 && (
          <div className="bg-white dark:bg-[#1f1f1f] rounded-lg shadow-sm border border-gray-200 dark:border-[#3d3d3d] mb-6">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-[#3d3d3d]">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-[#ececf1]">
                Replies ({replies.length})
              </h2>
            </div>
            <div className="px-6 py-4 space-y-6">
              {replies.map((message, index) => {
                const author = getAuthorDisplay(message);
                return (
                  <div key={message.message_id || index} className="flex gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0 ${author.color}`}
                    >
                      {author.initials || author.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 dark:text-[#ececf1]">
                          {author.name}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-[#8e8ea0]">
                          {message.created_at
                            ? dayjs(message.created_at).fromNow()
                            : "just now"}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-[#d1d5db] leading-relaxed whitespace-pre-wrap">
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
                              className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              <Paperclip className="w-3 h-3" />
                              {att.filename}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Reply Section */}
        {ticket.status !== "closed" && (
          <div className="bg-white dark:bg-[#1f1f1f] rounded-lg shadow-sm border border-gray-200 dark:border-[#3d3d3d]">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-[#3d3d3d] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium ${getAvatarColor(userName || "Anonymous")}`}
                >
                  {getInitials(userName || "Anonymous")}
                </div>
                <span className="text-sm text-gray-600 dark:text-[#8e8ea0]">
                  Reply to {initialAuthor?.name || "User"}
                </span>
              </div>
              {!showReplyForm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplyForm(true)}
                >
                  Reply
                </Button>
              )}
            </div>

            {showReplyForm && (
              <div className="px-6 py-4">
                {/* Simple Text Editor Toolbar */}
                <div className="flex items-center gap-1 p-2 border-b border-gray-200 dark:border-[#3d3d3d] mb-3 flex-wrap">
                  <button
                    type="button"
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#2d2d2d] rounded"
                    title="Bold"
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#2d2d2d] rounded"
                    title="Italic"
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#2d2d2d] rounded"
                    title="Underline"
                  >
                    <Underline className="w-4 h-4" />
                  </button>
                  <div className="w-px h-6 bg-gray-300 dark:bg-[#3d3d3d] mx-1" />
                  <button
                    type="button"
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#2d2d2d] rounded"
                    title="Align Left"
                  >
                    <AlignLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#2d2d2d] rounded"
                    title="Align Center"
                  >
                    <AlignCenter className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#2d2d2d] rounded"
                    title="Align Right"
                  >
                    <AlignRight className="w-4 h-4" />
                  </button>
                  <div className="w-px h-6 bg-gray-300 dark:bg-[#3d3d3d] mx-1" />
                  <button
                    type="button"
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#2d2d2d] rounded"
                    title="Bullet List"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#2d2d2d] rounded"
                    title="Numbered List"
                  >
                    <ListOrdered className="w-4 h-4" />
                  </button>
                  <div className="w-px h-6 bg-gray-300 dark:bg-[#3d3d3d] mx-1" />
                  <button
                    type="button"
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#2d2d2d] rounded"
                    title="Insert Image"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Reply Textarea */}
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply..."
                  className="min-h-[150px] mb-4 resize-none"
                />

                {/* Attachments */}
                {attachments.length > 0 && (
                  <div className="mb-4 space-y-2">
                    {attachments.map((att, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-gray-50 dark:bg-[#2d2d2d] rounded"
                      >
                        <div className="flex items-center gap-2">
                          <Paperclip className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700 dark:text-[#d1d5db]">
                            {att.filename}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-[#8e8ea0]">
                            ({(att.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(idx)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Attachment Button */}
                <div className="mb-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-[#8e8ea0] hover:text-gray-900 dark:hover:text-[#ececf1]"
                  >
                    <Paperclip className="w-4 h-4" />
                    Attach a file (Up to 20 MB)
                  </button>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={handleReply}
                    disabled={replying || !replyText.trim()}
                    className="bg-red-600 hover:bg-red-700 text-white px-6"
                  >
                    {replying ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "ADD COMMENT"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
