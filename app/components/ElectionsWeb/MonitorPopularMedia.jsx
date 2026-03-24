import { useState, useEffect, useCallback } from "react";
import { getSubscriptionNews, getSubscriptionNewsChannels } from "~/api";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Modal, Select, Spin, Button } from "antd";
import { Newspaper, X, ExternalLink } from "lucide-react";

dayjs.extend(relativeTime);

const PAGE_SIZE = 20;

// Add more sources here as they become available
const POPULAR_MEDIA_SOURCES = [
  { id: "subscription_news", label: "Subscription News", icon: Newspaper },
];

function SubscriptionNewsContent({
  articleModalOpen,
  selectedArticle,
  onOpenArticle,
  onCloseArticle,
}) {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [channelOptions, setChannelOptions] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [configError, setConfigError] = useState(null);

  const loadChannels = useCallback(async () => {
    try {
      const res = await getSubscriptionNewsChannels();
      setChannelOptions(res?.channels ?? []);
    } catch (err) {
      console.error("Failed to load subscription news channels:", err);
    }
  }, []);

  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  const fetchNews = useCallback(
    async (pageToFetch = 1, reset = false) => {
      try {
        if (reset) setLoading(true);
        setConfigError(null);
        const res = await getSubscriptionNews({
          channel: selectedChannel || null,
          page: pageToFetch,
          pageSize: PAGE_SIZE,
        });
        const news = res?.news ?? [];
        const totalCount = res?.total ?? 0;
        if (reset) {
          setNewsList(news);
        } else {
          setNewsList((prev) => [...prev, ...news]);
        }
        setTotal(totalCount);
        setHasMore(pageToFetch * PAGE_SIZE < totalCount);
        setPage(pageToFetch);
      } catch (err) {
        console.error("Error fetching subscription news:", err);
        setNewsList([]);
        const detail =
          err?.response?.data?.detail ??
          err?.response?.data?.message ??
          (typeof err?.response?.data === "string" ? err.response.data : null);
        const isNotConfigured =
          detail &&
          (String(detail).toLowerCase().includes("not configured") ||
            String(detail).toLowerCase().includes("cms_database"));
        if (isNotConfigured) {
          setConfigError(
            "Subscription news not configured on the server. Set CMS_DATABASE_NAME (and optionally CMS_MONGO_URI) in the elections backend environment."
          );
        } else if (detail) {
          setConfigError(detail);
        } else {
          setConfigError("Failed to load subscription news. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    },
    [selectedChannel]
  );

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setNewsList([]);
    fetchNews(1, true);
  }, [fetchNews]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !loading) {
      fetchNews(page + 1, false);
    }
  }, [hasMore, loading, page, fetchNews]);

  const formatDate = (raw) => {
    if (!raw) return "";
    // If it's already a Date-like or ISO string, let dayjs handle it
    // But handle common CMS strings used in editor dashboard
    try {
      const str = typeof raw === "string" ? raw : String(raw);
      if (str.includes("Originally published on")) {
        const m = str.match(/on\\s+([A-Za-z]+\\s+\\d{1,2},\\s*\\d{4})/);
        if (m && m[1]) {
          const parsed = dayjs(m[1], "MMM D, YYYY");
          if (parsed.isValid()) return parsed.format("D MMM YYYY, h:mm A");
          return m[1];
        }
        return str;
      }
      if (str.includes("IST")) {
        // Already human-readable with IST label; show as-is
        return str;
      }
      const d = dayjs(str);
      if (d.isValid()) return d.format("D MMM YYYY, h:mm A");
      const d2 = dayjs(Number(str));
      if (d2.isValid()) return d2.format("D MMM YYYY, h:mm A");
      return str;
    } catch {
      return typeof raw === "string" ? raw : String(raw);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 pb-3 border-b border-black/10 dark:border-white/10">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white/90">
          {selectedChannel ? `${selectedChannel} News` : "All Subscription News"}
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <Select
            placeholder="All Channels"
            allowClear
            value={selectedChannel || undefined}
            onChange={(v) => setSelectedChannel(v ?? null)}
            options={channelOptions.map((ch) => ({ value: ch, label: ch }))}
            className="min-w-[200px]"
            getPopupContainer={(n) => n?.parentElement ?? document.body}
          />
        </div>
      </div>

      {configError && (
        <div className="mx-4 mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-amber-200">
          <p className="font-medium">Configuration required</p>
          <p className="mt-1 text-sm text-gray-800/80 dark:text-white/80">{configError}</p>
        </div>
      )}

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <Spin spinning={loading}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {newsList.map((item, index) => (
              <div
                key={item.id ?? index}
                className="rounded-lg overflow-hidden bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 transition-all flex flex-col cursor-pointer group"
                onClick={() => onOpenArticle(item)}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-black/30 overflow-hidden">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Newspaper className="w-10 h-10 text-gray-400/60 dark:text-white/20" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-3 flex-1 flex flex-col">
                  <p className="text-sm font-medium text-gray-900 dark:text-white/90 line-clamp-3 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {item.title}
                  </p>
                  <div className="mt-auto space-y-1">
                    {item.channel_name && (
                      <p className="text-xs font-medium text-gray-600 dark:text-white/60">{item.channel_name}</p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-white/40">{formatDate(item.published_date || item.created_at)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!loading && newsList.length === 0 && !configError && (
            <div className="text-center py-16 text-gray-500 dark:text-white/30 text-sm">No news found.</div>
          )}

          {hasMore && newsList.length > 0 && (
            <div className="text-center mt-6">
              <Button onClick={handleLoadMore} loading={loading}>
                Load More
              </Button>
            </div>
          )}

          {!hasMore && newsList.length > 0 && (
            <p className="text-center mt-6 text-xs text-gray-500 dark:text-white/30">No more news to load</p>
          )}
        </Spin>
      </div>

      {/* Article Detail Modal */}
      <Modal
        open={articleModalOpen}
        onCancel={onCloseArticle}
        footer={null}
        width="70%"
        centered
        styles={{ body: { padding: 0, maxHeight: "85vh", overflowY: "auto" } }}
        closeIcon={<X className="w-5 h-5 text-white" />}
      >
        {selectedArticle && (
          <div className="p-6 bg-white text-gray-900 dark:bg-gray-900 dark:text-white">
            {/* Title */}
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{selectedArticle.title}</h2>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 mb-5 text-sm text-gray-600 dark:text-white/50">
              {selectedArticle.channel_name && (
                <span className="font-medium text-gray-800 dark:text-white/70">{selectedArticle.channel_name}</span>
              )}
              {(selectedArticle.published_date || selectedArticle.created_at) && (
                <span>{formatDate(selectedArticle.published_date || selectedArticle.created_at)}</span>
              )}
              {selectedArticle.url && (
                <a
                  href={selectedArticle.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink size={14} />
                  Read original
                </a>
              )}
            </div>

            {/* Image */}
            {selectedArticle.image_url && (
              <div className="mb-5 rounded-lg overflow-hidden">
                <img
                  src={selectedArticle.image_url}
                  alt={selectedArticle.title}
                  className="w-full max-h-72 object-cover"
                />
              </div>
            )}

            {/* Content */}
            {selectedArticle.content && (
              <p className="text-sm text-gray-800 dark:text-white/75 leading-relaxed whitespace-pre-wrap">
                {selectedArticle.content}
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function MonitorPopularMedia() {
  const [selectedSource, setSelectedSource] = useState("subscription_news");
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [articleModalOpen, setArticleModalOpen] = useState(false);

  const openArticle = (article) => {
    setSelectedArticle(article);
    setArticleModalOpen(true);
  };

  const closeArticle = () => {
    setArticleModalOpen(false);
    setSelectedArticle(null);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white text-gray-900 dark:bg-gray-900 dark:text-white overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top source tabs (match Trending) */}
        <div className="px-4 pt-4">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-gray-900/60 p-1 shadow-sm dark:shadow-black/20">
            {POPULAR_MEDIA_SOURCES.map((source) => {
              const Icon = source.icon;
              const isActive = selectedSource === source.id;
              return (
                <button
                  key={source.id}
                  onClick={() => setSelectedSource(source.id)}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-white dark:bg-gray-950 border border-black/10 dark:border-white/10 shadow-sm"
                      : "text-gray-600 dark:text-white/60 hover:bg-white/60 dark:hover:bg-white/10"
                  }`}
                >
                  <Icon size={16} className={isActive ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-white/60"} />
                  <span>{source.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {selectedSource === "subscription_news" && (
          <SubscriptionNewsContent
            articleModalOpen={articleModalOpen}
            selectedArticle={selectedArticle}
            onOpenArticle={openArticle}
            onCloseArticle={closeArticle}
          />
        )}
        {selectedSource !== "subscription_news" && (
          <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-white/50">
            <p>Coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
}
