import { useState, useEffect, useCallback } from "react";
import {
  getTrendingVideos,
  getEditorBreakingTwitter,
  getEditorBreakingTwitterChannels,
  getEditorBreakingInstagram,
  getEditorBreakingInstagramProfiles,
  addTwitterChannelToTrending,
  addInstagramProfileToTrending,
} from "~/api";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Modal, Select, Spin, Button, Input, message } from "antd";
import { PlayCircle, X, Youtube, Twitter, Instagram, ExternalLink, Plus } from "lucide-react";

dayjs.extend(relativeTime);

const PAGE_SIZE_YT = 12;
const PAGE_SIZE_SOCIAL = 50;

const SORT_OPTIONS = [
  { value: "smart", label: "Most Watched Recently" },
  { value: "highest_hourly_views", label: "Most Watched Today" },
  { value: "recent", label: "Most Recent" },
];

const LANGUAGE_OPTIONS = [
  { value: null, label: "All languages" },
  { value: 2, label: "Telugu" },
  { value: 3, label: "Hindi" },
  { value: 4, label: "Tamil" },
];

function ThreadsIcon({ size = 18, className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 50 50"
      className={className}
      fill="currentColor"
    >
      <path d="M46,9v32c0,2.757-2.243,5-5,5H9c-2.757,0-5-2.243-5-5V9c0-2.757,2.243-5,5-5h32C43.757,4,46,6.243,46,9z M33.544,35.913	c2.711-2.708,2.635-6.093,1.746-8.17c-0.54-1.255-1.508-2.33-2.798-3.108l-0.223-0.138c-0.33-0.208-0.609-0.375-1.046-0.542	c-0.008-0.278-0.025-0.556-0.058-0.807c-0.59-4.561-3.551-5.535-5.938-5.55c-2.154,0-3.946,0.92-5.044,2.592l1.672,1.098	c0.736-1.121,1.871-1.689,3.366-1.689c2.367,0.015,3.625,1.223,3.96,3.801c-1.141-0.231-2.426-0.314-3.807-0.233	c-3.924,0.226-5.561,2.591-5.442,4.836c0.134,2.486,2.278,4.222,5.216,4.222c0.13,0,0.259-0.003,0.384-0.011	c2.297-0.126,5.105-1.29,5.61-6.063c0.021,0.013,0.041,0.026,0.062,0.039l0.253,0.157c0.932,0.562,1.621,1.317,1.994,2.185	c0.643,1.501,0.682,3.964-1.322,5.966c-1.732,1.73-3.812,2.479-6.936,2.502c-3.47-0.026-6.099-1.145-7.812-3.325	c-1.596-2.028-2.42-4.953-2.451-8.677c0.031-3.728,0.855-6.646,2.451-8.673c1.714-2.181,4.349-3.299,7.814-3.325	c3.492,0.026,6.165,1.149,7.944,3.338c0.864,1.063,1.525,2.409,1.965,3.998l1.928-0.532c-0.514-1.858-1.301-3.449-2.341-4.728	c-2.174-2.674-5.363-4.045-9.496-4.076c-4.12,0.031-7.278,1.406-9.387,4.089c-1.875,2.383-2.844,5.712-2.879,9.91	c0.035,4.193,1.004,7.529,2.879,9.913c2.109,2.682,5.262,4.058,9.385,4.088C28.857,38.973,31.433,38.021,33.544,35.913z M28.993,25.405c0.07,0.016,0.138,0.031,0.202,0.046c-0.005,0.078-0.01,0.146-0.015,0.198c-0.314,3.928-2.295,4.489-3.761,4.569	c-0.091,0.005-0.181,0.008-0.271,0.008c-1.851,0-3.144-0.936-3.218-2.329c-0.065-1.218,0.836-2.576,3.561-2.732	c0.297-0.018,0.589-0.027,0.875-0.027C27.325,25.137,28.209,25.227,28.993,25.405z" />
    </svg>
  );
}

const TRENDING_SOURCES = [
  { id: "youtube", label: "YouTube", icon: Youtube },
  { id: "x", label: "Twitter/X", icon: Twitter },
  { id: "instagram", label: "Instagram", icon: Instagram },
  { id: "threads", label: "Threads", icon: null, customIcon: ThreadsIcon },
];

function formatViewCount(count) {
  if (count >= 1_000_000) return (count / 1_000_000).toFixed(1) + "M";
  if (count >= 1_000) return (count / 1_000).toFixed(1) + "K";
  return String(count ?? 0);
}

function getVideoThumbnail(videoId) {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

function parseConfigError(err, fallback) {
  const detail =
    err?.response?.data?.detail ??
    err?.response?.data?.message ??
    (typeof err?.response?.data === "string" ? err.response.data : null);
  const isNotConfigured =
    detail &&
    (String(detail).toLowerCase().includes("not configured") ||
      String(detail).toLowerCase().includes("cms_database"));
  if (isNotConfigured) {
    return "Set CMS_DATABASE_NAME (and optionally CMS_MONGO_URI) in the elections backend.";
  }
  return detail || fallback;
}

function extractApiError(err, fallback = "Something went wrong.") {
  return (
    err?.response?.data?.detail ||
    err?.response?.data?.message ||
    (typeof err?.response?.data === "string" ? err.response.data : null) ||
    err?.detail ||
    err?.message ||
    fallback
  );
}

function YouTubeTrendingContent({ onOpenVideo, videoModalOpen, selectedVideoId, onCloseVideoModal }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [channelOptions, setChannelOptions] = useState([]);
  const [sortBy, setSortBy] = useState("smart");
  const [currentPage, setCurrentPage] = useState(1);
  const [configError, setConfigError] = useState(null);

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      setConfigError(null);
      const res = await getTrendingVideos({
        languageId: null,
        channelName: selectedChannel || null,
        sortBy,
        page: 1,
        pageSize: 200,
      });
      const data = res?.data ?? res ?? [];
      setVideos(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0) {
        const channels = [...new Set(data.map((v) => v.channel_name).filter(Boolean))];
        setChannelOptions((prev) => {
          if (selectedChannel && channels.length <= 1) return prev.length ? prev : channels;
          return channels;
        });
      }
    } catch (err) {
      console.error("Error fetching trending videos:", err);
      setVideos([]);
      setConfigError(parseConfigError(err, "Failed to load trending videos."));
    } finally {
      setLoading(false);
    }
  }, [selectedChannel, sortBy]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const paginatedVideos = videos.slice(0, currentPage * PAGE_SIZE_YT);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 pb-0">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white/90">Trending Videos</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={sortBy}
            onChange={(v) => {
              setSortBy(v);
              setCurrentPage(1);
            }}
            options={SORT_OPTIONS}
            className="w-[180px]"
            getPopupContainer={() => document.body}
            destroyPopupOnHide
          />
          <Select
            placeholder="Select Channel"
            allowClear
            value={selectedChannel || undefined}
            onChange={(v) => {
              setSelectedChannel(v ?? null);
              setCurrentPage(1);
            }}
            options={channelOptions.map((ch) => ({ value: ch, label: ch }))}
            className="min-w-[200px]"
            getPopupContainer={() => document.body}
            destroyPopupOnHide
          />
        </div>
      </div>
      {configError && (
        <div className="mx-4 mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-amber-200 text-sm">
          {configError}
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-4 pt-4">
        <Spin spinning={loading}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {paginatedVideos.map((video, index) => (
              <div
                key={video.video_id ?? index}
                className="rounded-lg overflow-hidden bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 transition-all flex flex-col"
              >
                <div
                  className="relative aspect-video bg-black/30 group cursor-pointer"
                  onClick={() => onOpenVideo(video.video_id)}
                >
                  <img
                    src={getVideoThumbnail(video.video_id)}
                    alt={video.title}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlayCircle className="w-14 h-14 text-white drop-shadow-lg" />
                  </div>
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <div
                    className="text-sm font-medium text-gray-900 dark:text-white/90 line-clamp-3 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 mb-2"
                    onClick={() => onOpenVideo(video.video_id)}
                  >
                    {video.title}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-white/60 mb-1">{video.channel_name}</div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-white/50 mb-2">
                    <span>{formatViewCount(video.current_view_count)} views</span>
                    <span>•</span>
                    <span>{video.timestamp ? dayjs.unix(video.timestamp).fromNow() : ""}</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-white/50">
                    First published: {video.upload_date ? dayjs(video.upload_date, "YYYYMMDD").format("D MMM, YYYY") : "—"}
                    <br />
                    <strong>Hourly views: {Math.round(video.hourly_view_rate ?? 0)}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {videos.length > paginatedVideos.length && (
            <div className="text-center mt-6">
              <Button onClick={() => setCurrentPage((p) => p + 1)}>Load More</Button>
            </div>
          )}
        </Spin>
      </div>
      <Modal
        open={videoModalOpen}
        onCancel={onCloseVideoModal}
        destroyOnClose
        footer={null}
        width="80%"
        centered
        styles={{ body: { padding: 0, backgroundColor: "#000" } }}
        closeIcon={<X className="w-5 h-5 text-white" />}
      >
        {selectedVideoId && (
          <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
            <iframe
              title="YouTube"
              src={`https://www.youtube.com/embed/${selectedVideoId}?autoplay=1&rel=0`}
              className="absolute top-0 left-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}
      </Modal>
    </div>
  );
}

/** X or Threads — same CMS collection, different `source` */
function TwitterThreadsPanel({ apiSource, title }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [channel, setChannel] = useState(null);
  const [channelOptions, setChannelOptions] = useState([]);
  const [languageId, setLanguageId] = useState(null);
  const [configError, setConfigError] = useState(null);
  const [mediaModal, setMediaModal] = useState(null);

  // Add Channel Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newChannelInput, setNewChannelInput] = useState("");
  const [addingChannel, setAddingChannel] = useState(false);
  const [addChannelError, setAddChannelError] = useState("");

  const handleAddChannel = async () => {
    if (!newChannelInput.trim()) return;
    try {
      setAddChannelError("");
      setAddingChannel(true);
      await addTwitterChannelToTrending(newChannelInput.trim(), apiSource);
      message.success(`Fetched latest posts for ${newChannelInput.trim()}`);
      setAddModalOpen(false);
      setChannel(newChannelInput.trim());
      setNewChannelInput("");
      loadChannels();
    } catch (err) {
      console.error(err);
      setAddChannelError(extractApiError(err, "Invalid channel or no posts found."));
    } finally {
      setAddingChannel(false);
    }
  };

  const handleSelectChannel = async (v) => {
    if (v) {
      try {
        setLoading(true);
        message.loading({ content: `Fetching latest posts for ${v}...`, key: "select_channel" });
        await addTwitterChannelToTrending(v, apiSource);
        message.success({ content: `Updated posts for ${v}`, key: "select_channel" });
      } catch (err) {
        console.error(err);
        message.error({
          content: extractApiError(err, `Failed to fetch new posts for ${v}`),
          key: "select_channel",
        });
      } finally {
        setLoading(false);
      }
    }
    setChannel(v ?? null);
  };

  const loadChannels = useCallback(async () => {
    try {
      const res = await getEditorBreakingTwitterChannels(apiSource);
      setChannelOptions(res?.channels ?? []);
    } catch (e) {
      console.error(e);
    }
  }, [apiSource]);

  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  const fetchPage = useCallback(
    async (pageNum, append) => {
      try {
        if (append) setLoadingMore(true);
        else setLoading(true);
        setConfigError(null);
        const res = await getEditorBreakingTwitter({
          source: apiSource,
          channel: channel || null,
          languageId: languageId != null ? languageId : null,
          page: pageNum,
          pageSize: PAGE_SIZE_SOCIAL,
          sortBy: "recent",
        });
        const data = res?.data ?? [];
        if (append) setItems((prev) => [...prev, ...data]);
        else setItems(data);
        setHasMore(data.length === PAGE_SIZE_SOCIAL);
        setPage(pageNum);
      } catch (err) {
        console.error(err);
        if (!append) setItems([]);
        setConfigError(parseConfigError(err, "Failed to load content."));
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [apiSource, channel, languageId]
  );

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchPage(1, false);
  }, [apiSource, channel, languageId]);

  const thumb = (item) => item.image_url || item.thumbnail_url || null;
  const hasPlayableVideo = (item) => !!item?.video_url;
  const isVideo = (item) =>
    hasPlayableVideo(item) ||
    (item.image_url && String(item.image_url).match(/\.(mp4|webm)/i));

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 pb-3 border-b border-black/10 dark:border-white/10">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white/90">{title}</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Select
            placeholder="Language"
            value={languageId}
            onChange={(v) => setLanguageId(v)}
            options={LANGUAGE_OPTIONS}
            className="w-[150px]"
            getPopupContainer={() => document.body}
            destroyPopupOnHide
          />
          <Select
            placeholder="Channel"
            allowClear
            showSearch
            value={channel || undefined}
            onChange={handleSelectChannel}
            options={channelOptions.map((c) => ({ value: c, label: c }))}
            className="min-w-[180px]"
            getPopupContainer={() => document.body}
            destroyPopupOnHide
          />
          <button
            onClick={() => {
              setAddChannelError("");
              setNewChannelInput("");
              setAddModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium transition-colors border border-blue-500/20"
          >
            <Plus size={16} /> Add channel
          </button>
        </div>
      </div>
      {configError && (
        <div className="mx-4 mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-amber-200 text-sm">
          {configError}
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-4">
        <Spin spinning={loading}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <div
                key={item._id}
                className="rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 overflow-hidden flex flex-col"
              >
                {(thumb(item) || hasPlayableVideo(item)) && (
                  <div
                    className="relative aspect-video bg-black/40 cursor-pointer"
                    onClick={() => {
                      if (hasPlayableVideo(item)) setMediaModal({ type: "video", url: item.video_url });
                      else if (thumb(item)) setMediaModal({ type: "image", url: thumb(item) });
                      else if (item.url) window.open(item.url, "_blank", "noopener,noreferrer");
                    }}
                  >
                    {thumb(item) && !isVideo(item) ? (
                      <img src={thumb(item)} alt="" className="w-full h-full object-cover" />
                    ) : item.video_url ? (
                      <video src={item.video_url} className="w-full h-full object-cover" muted playsInline />
                    ) : null}
                    {hasPlayableVideo(item) && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <PlayCircle className="w-12 h-12 text-white/90 drop-shadow" />
                      </div>
                    )}
                  </div>
                )}
                <div className="p-3 flex-1 flex flex-col gap-2">
                  <p className="text-sm text-gray-900 dark:text-white/90 line-clamp-4 whitespace-pre-wrap">{item.text || "—"}</p>
                  <div className="flex items-center justify-between gap-2 mt-auto text-xs text-gray-500 dark:text-white/50">
                    <span>{item.channel || apiSource}</span>
                    <span>{item.datetime ? dayjs(item.datetime).fromNow() : ""}</span>
                  </div>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink size={12} /> Open post
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
          {hasMore && items.length > 0 && (
            <div className="text-center mt-6">
              <Button loading={loadingMore} onClick={() => fetchPage(page + 1, true)}>
                Load More
              </Button>
            </div>
          )}
          {!loading && items.length === 0 && !configError && (
            <p className="text-center py-12 text-gray-500 dark:text-white/40 text-sm">No posts found.</p>
          )}
        </Spin>
      </div>
      <Modal
        open={!!mediaModal}
        onCancel={() => setMediaModal(null)}
        destroyOnClose
        footer={null}
        width="auto"
        centered
        styles={{ body: { padding: 0, background: "#000" } }}
        closeIcon={<X className="w-5 h-5 text-white" />}
      >
        {mediaModal?.type === "image" && (
          <img src={mediaModal.url} alt="" className="max-h-[80vh] max-w-[90vw] object-contain" />
        )}
        {mediaModal?.type === "video" && (
          <video src={mediaModal.url} controls autoPlay className="max-h-[80vh] max-w-[90vw]" />
        )}
      </Modal>

      <Modal
        title={`Add ${apiSource} Channel`}
        open={addModalOpen}
        onCancel={() => !addingChannel && setAddModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setAddModalOpen(false)} disabled={addingChannel}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleAddChannel}
            loading={addingChannel}
            className="bg-blue-600"
          >
            Add channel
          </Button>,
        ]}
      >
        <div className="py-4">
          {addChannelError && (
            <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-300">
              {addChannelError}
            </div>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Type a {apiSource} username to instantly fetch their latest posts and add them to this trending feed.
          </p>
          <Input
            placeholder="e.g. narendramodi"
            value={newChannelInput}
            onChange={(e) => setNewChannelInput(e.target.value)}
            onPressEnter={handleAddChannel}
            prefix={<span className="text-gray-400">@</span>}
            disabled={addingChannel}
            size="large"
          />
        </div>
      </Modal>
    </div>
  );
}

function InstagramTrendingPanel() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [profile, setProfile] = useState(null);
  const [profileOptions, setProfileOptions] = useState([]);
  const [languageId, setLanguageId] = useState(null);
  const [configError, setConfigError] = useState(null);
  const [mediaModal, setMediaModal] = useState(null);

  // Add Profile Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newProfileInput, setNewProfileInput] = useState("");
  const [addingProfile, setAddingProfile] = useState(false);
  const [addProfileError, setAddProfileError] = useState("");

  const handleAddProfile = async () => {
    if (!newProfileInput.trim()) return;
    try {
      setAddProfileError("");
      setAddingProfile(true);
      await addInstagramProfileToTrending(newProfileInput.trim());
      message.success(`Fetched latest posts for ${newProfileInput.trim()}`);
      setAddModalOpen(false);
      setProfile(newProfileInput.trim());
      setNewProfileInput("");
      loadProfiles();
    } catch (err) {
      console.error(err);
      setAddProfileError(extractApiError(err, "Invalid profile or no posts found."));
    } finally {
      setAddingProfile(false);
    }
  };

  const handleSelectProfile = async (v) => {
    if (v) {
      try {
        setLoading(true);
        message.loading({ content: `Fetching latest posts for ${v}...`, key: "select_profile" });
        await addInstagramProfileToTrending(v);
        message.success({ content: `Updated posts for ${v}`, key: "select_profile" });
      } catch (err) {
        console.error(err);
        message.error({
          content: extractApiError(err, `Failed to fetch new posts for ${v}`),
          key: "select_profile",
        });
      } finally {
        setLoading(false);
      }
    }
    setProfile(v ?? null);
  };

  const loadProfiles = useCallback(async () => {
    try {
      const res = await getEditorBreakingInstagramProfiles();
      setProfileOptions(res?.profiles ?? []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const fetchPage = useCallback(
    async (pageNum, append) => {
      try {
        if (append) setLoadingMore(true);
        else setLoading(true);
        setConfigError(null);
        const res = await getEditorBreakingInstagram({
          profile: profile || null,
          languageId: languageId != null ? languageId : null,
          page: pageNum,
          pageSize: PAGE_SIZE_SOCIAL,
          sortBy: "recent",
        });
        const data = res?.data ?? [];
        if (append) setItems((prev) => [...prev, ...data]);
        else setItems(data);
        setHasMore(data.length === PAGE_SIZE_SOCIAL);
        setPage(pageNum);
      } catch (err) {
        console.error(err);
        if (!append) setItems([]);
        setConfigError(parseConfigError(err, "Failed to load Instagram."));
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [profile, languageId]
  );

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchPage(1, false);
  }, [profile, languageId]);

  const isVideo = (item) =>
    (item.media_url &&
      (item.type === "video" ||
        item.type === "reel" ||
        String(item.media_url).match(/\.(mp4|webm)/i)));

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 pb-3 border-b border-black/10 dark:border-white/10">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white/90">Instagram</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Select
            placeholder="Language"
            value={languageId}
            onChange={(v) => setLanguageId(v)}
            options={LANGUAGE_OPTIONS}
            className="w-[150px]"
            getPopupContainer={() => document.body}
            destroyPopupOnHide
          />
          <Select
            placeholder="Profile"
            allowClear
            showSearch
            value={profile || undefined}
            onChange={handleSelectProfile}
            options={profileOptions.map((p) => ({ value: p, label: p }))}
            className="min-w-[180px]"
            getPopupContainer={() => document.body}
            destroyPopupOnHide
          />
          <button
            onClick={() => {
              setAddProfileError("");
              setNewProfileInput("");
              setAddModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 dark:text-pink-400 rounded-lg text-sm font-medium transition-colors border border-pink-500/20"
          >
            <Plus size={16} /> Add channel
          </button>
        </div>
      </div>
      {configError && (
        <div className="mx-4 mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-amber-200 text-sm">
          {configError}
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-4">
        <Spin spinning={loading}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <div
                key={item._id}
                className="rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 overflow-hidden flex flex-col"
              >
                {item.media_url && (
                  <div
                    className="relative aspect-square bg-black/40 cursor-pointer"
                    onClick={() => {
                      setMediaModal({
                        type: isVideo(item) ? "video" : "image",
                        url: item.media_url,
                      });
                    }}
                  >
                    {isVideo(item) ? (
                      <video src={item.media_url} className="w-full h-full object-cover" muted playsInline />
                    ) : (
                      <img src={item.media_url} alt="" className="w-full h-full object-cover" />
                    )}
                    {isVideo(item) && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <PlayCircle className="w-12 h-12 text-white/90 drop-shadow" />
                      </div>
                    )}
                  </div>
                )}
                <div className="p-3 flex-1 flex flex-col gap-2">
                  <p className="text-sm text-gray-900 dark:text-white/90 line-clamp-3">{item.caption || "—"}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-white/50 mt-auto">
                    <span>@{item.profile}</span>
                    <span>{item.posted_at ? dayjs(item.posted_at).fromNow() : ""}</span>
                  </div>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-pink-400 hover:text-pink-300"
                    >
                      <ExternalLink size={12} /> Open on Instagram
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
          {hasMore && items.length > 0 && (
            <div className="text-center mt-6">
              <Button loading={loadingMore} onClick={() => fetchPage(page + 1, true)}>
                Load More
              </Button>
            </div>
          )}
          {!loading && items.length === 0 && !configError && (
            <p className="text-center py-12 text-gray-500 dark:text-white/40 text-sm">No posts found.</p>
          )}
        </Spin>
      </div>
      <Modal
        open={!!mediaModal}
        onCancel={() => setMediaModal(null)}
        destroyOnClose
        footer={null}
        centered
        styles={{ body: { padding: 0, background: "#000" } }}
        closeIcon={<X className="w-5 h-5 text-white" />}
      >
        {mediaModal?.type === "image" && (
          <img src={mediaModal.url} alt="" className="max-h-[85vh] max-w-[90vw] object-contain mx-auto block" />
        )}
        {mediaModal?.type === "video" && (
          <video src={mediaModal.url} controls autoPlay className="max-h-[85vh] max-w-[90vw] mx-auto block" />
        )}
      </Modal>

      <Modal
        title="Add Instagram Profile"
        open={addModalOpen}
        onCancel={() => !addingProfile && setAddModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setAddModalOpen(false)} disabled={addingProfile}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleAddProfile}
            loading={addingProfile}
            className="bg-pink-600"
          >
            Add channel
          </Button>,
        ]}
      >
        <div className="py-4">
          {addProfileError && (
            <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-300">
              {addProfileError}
            </div>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Type an Instagram username to instantly fetch their latest posts and add them to this trending feed.
          </p>
          <Input
            placeholder="e.g. indiatoday"
            value={newProfileInput}
            onChange={(e) => setNewProfileInput(e.target.value)}
            onPressEnter={handleAddProfile}
            prefix={<span className="text-gray-400">@</span>}
            disabled={addingProfile}
            size="large"
          />
        </div>
      </Modal>
    </div>
  );
}

export default function MonitorTrending() {
  const [selectedSource, setSelectedSource] = useState("youtube");
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  // Avoid leftover AntD popup layers when switching tabs
  useEffect(() => {
    const active = document.activeElement;
    if (active && typeof active.blur === "function") active.blur();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
  }, [selectedSource]);

  const tabTheme = (id) => {
    switch (id) {
      case "youtube":
        return {
          active:
            "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-sm shadow-red-600/20 border border-red-500/30",
          inactive:
            "text-red-700 dark:text-red-300 hover:bg-red-500/10 dark:hover:bg-red-500/15",
          iconActive: "text-white",
          iconInactive: "text-red-600 dark:text-red-300",
        };
      case "x":
        return {
          active:
            "bg-gradient-to-r from-slate-900 to-slate-700 text-white shadow-sm shadow-black/20 border border-black/15 dark:border-white/10",
          inactive:
            "text-slate-800 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10",
          iconActive: "text-white",
          iconInactive: "text-slate-800 dark:text-slate-200",
        };
      case "instagram":
        return {
          active:
            "bg-gradient-to-r from-fuchsia-600 via-pink-600 to-amber-500 text-white shadow-sm shadow-pink-600/20 border border-pink-500/30",
          inactive:
            "text-pink-700 dark:text-pink-300 hover:bg-pink-500/10 dark:hover:bg-pink-500/15",
          iconActive: "text-white",
          iconInactive: "text-pink-600 dark:text-pink-300",
        };
      case "threads":
        return {
          active:
            "bg-gradient-to-r from-neutral-900 to-neutral-700 text-white shadow-sm shadow-black/20 border border-black/15 dark:border-white/10",
          inactive:
            "text-neutral-800 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/10",
          iconActive: "text-white",
          iconInactive: "text-neutral-800 dark:text-neutral-200",
        };
      default:
        return {
          active:
            "bg-white dark:bg-gray-950 border border-black/10 dark:border-white/10 shadow-sm",
          inactive:
            "text-gray-600 dark:text-white/60 hover:bg-white/60 dark:hover:bg-white/10",
          iconActive: "text-gray-900 dark:text-white",
          iconInactive: "text-gray-500 dark:text-white/60",
        };
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white text-gray-900 dark:bg-gray-900 dark:text-white overflow-hidden">
      {/* Force-remount panels on tab switch to avoid leftover UI layers */}
      <div key={selectedSource} className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top source tabs */} 
        <div className="px-4 pt-4">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-gray-900/60 p-1 shadow-sm dark:shadow-black/20">
            {TRENDING_SOURCES.map((source) => {
              const isActive = selectedSource === source.id;
              const Custom = source.customIcon;
              const theme = tabTheme(source.id);
              return (
                <button
                  key={source.id}
                  onClick={() => {
                    setVideoModalOpen(false);
                    setSelectedVideoId(null);
                    setSelectedSource(source.id);
                  }}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive ? theme.active : theme.inactive
                  }`}
                >
                  {Custom ? (
                    <Custom size={16} className={isActive ? theme.iconActive : theme.iconInactive} />
                  ) : (
                    <source.icon size={16} className={isActive ? theme.iconActive : theme.iconInactive} />
                  )}
                  <span>{source.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {selectedSource === "youtube" && (
          <YouTubeTrendingContent
            onOpenVideo={(id) => {
              setSelectedVideoId(id);
              setVideoModalOpen(true);
            }}
            videoModalOpen={videoModalOpen}
            selectedVideoId={selectedVideoId}
            onCloseVideoModal={() => {
              setVideoModalOpen(false);
              setSelectedVideoId(null);
            }}
          />
        )}
        {selectedSource === "x" && <TwitterThreadsPanel apiSource="Twitter" title="X (Twitter)" />}
        {selectedSource === "threads" && <TwitterThreadsPanel apiSource="Threads" title="Threads" />}
        {selectedSource === "instagram" && <InstagramTrendingPanel />}
      </div>
    </div>
  );
}
