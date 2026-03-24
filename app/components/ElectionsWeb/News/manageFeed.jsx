import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Trash2, Twitter, Instagram, Loader2, ChevronRight, X, ExternalLink, Heart, MessageCircle, Repeat2, Bookmark, Play } from "lucide-react";
import { createNewsTopic, getNewsTopics, getNewsTopic, deleteNewsTopic, getElectionStates, loadMoreNewsPosts } from "~/api";

export default function ManageFeed() {
  // ─── State ──────────────────────────────────────────────────────────
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [selectedTopicData, setSelectedTopicData] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingTopic, setIsLoadingTopic] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Create form state
  const [states, setStates] = useState([]);
  const [selectedState, setSelectedState] = useState("");
  const [selectedSources, setSelectedSources] = useState(["twitter"]);
  const [keywords, setKeywords] = useState("");
  
  // Posts state for combined view
  const [posts, setPosts] = useState([]);
  const [activeSources, setActiveSources] = useState([]);
  const [topicIds, setTopicIds] = useState({ twitter: null, instagram: null });

  // ─── Load topics on mount ───────────────────────────────────────────
  const loadTopics = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getNewsTopics();
      setTopics(data.topics || []);
    } catch (err) {
      console.error("Failed to load topics:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTopics();
  }, [loadTopics]);

  // ─── Load states for dropdown ───────────────────────────────────────
  useEffect(() => {
    const loadStates = async () => {
      try {
        const response = await getElectionStates();
        const statesData = response?.states || response?.data || response || [];
        setStates(Array.isArray(statesData) ? statesData : []);
      } catch (err) {
        console.error("Failed to load states:", err);
        setStates([]);
      }
    };
    loadStates();
  }, []);

  // ─── Toggle source selection ────────────────────────────────────────
  const toggleSource = (src) => {
    setSelectedSources(prev => {
      if (prev.includes(src)) {
        if (prev.length === 1) return prev;
        return prev.filter(s => s !== src);
      }
      return [...prev, src];
    });
  };

  // ─── Create topic & search ──────────────────────────────────────────
  const handleSearch = async () => {
    if (!keywords.trim() || selectedSources.length === 0) return;
    try {
      setIsSearching(true);
      const stateName = states.find(s => String(s.state_id) === selectedState)?.state_name || "";
      
      const allPosts = [];
      
      // Generate a shared topic_id for combined searches
      const sharedTopicId = selectedSources.length > 1 
        ? crypto.randomUUID() 
        : null;
      
      const searchPromises = selectedSources.map(async (src) => {
        const result = await createNewsTopic({
          source: src,
          keywords: keywords.trim(),
          state: stateName || null,
          max_results: 10,
          topic_id: sharedTopicId, // Same ID for both sources
        });
        return {
          source: src,
          posts: (result.posts || []).map(p => ({ ...p, _source: src })),
          topicData: result,
          topicId: result.topic_id,
        };
      });

      const results = await Promise.all(searchPromises);
      
      // Get the topic_id (same for all sources in combined search)
      const finalTopicId = results[0]?.topicId;
      const newTopicIds = { twitter: null, instagram: null };
      
      results.forEach(r => {
        allPosts.push(...r.posts);
        newTopicIds[r.source] = finalTopicId; // Same ID for both
      });

      setPosts(allPosts);
      setActiveSources([...selectedSources]);
      setTopicIds(newTopicIds);
      setSelectedTopicData({
        title: keywords.trim(),
        state: stateName || null,
        sources: selectedSources,
        post_count: allPosts.length,
      });
      setSelectedTopic(finalTopicId);
      setShowCreateForm(false);
      setKeywords("");
      setSelectedState("");
      
      // Reload topics list - backend now groups combined topics as one entry
      await loadTopics();
    } catch (err) {
      console.error("Search failed:", err);
      alert(err?.detail || "Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  // ─── Load More Posts ────────────────────────────────────────────────
  const handleLoadMore = async () => {
    if (!selectedTopicData || activeSources.length === 0) return;
    try {
      setIsLoadingMore(true);
      
      const allNewPosts = [];
      // For combined: 5 from each source, for single: 10 from that source
      const countPerSource = activeSources.length > 1 ? 5 : 10;
      
      const loadPromises = activeSources.map(async (src) => {
        const srcTopicId = topicIds[src];
        if (!srcTopicId) return { source: src, posts: [] };
        
        const result = await loadMoreNewsPosts(srcTopicId, src, countPerSource);
        return {
          source: src,
          posts: (result.new_posts || []).map(p => ({ ...p, _source: src })),
        };
      });

      const results = await Promise.all(loadPromises);
      
      results.forEach(r => {
        allNewPosts.push(...r.posts);
      });

      setPosts(prev => [...prev, ...allNewPosts]);
      setSelectedTopicData(prev => ({
        ...prev,
        post_count: (prev?.post_count || 0) + allNewPosts.length,
      }));
    } catch (err) {
      console.error("Load more failed:", err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // ─── Load a saved topic ─────────────────────────────────────────────
  const handleSelectTopic = async (topic) => {
    try {
      setIsLoadingTopic(true);
      setSelectedTopic(topic.topic_id);
      setShowCreateForm(false);
      
      const sources = topic.sources || [topic.source];
      const isCombined = sources.length > 1;
      
      // For combined topics, don't pass source to get all posts
      // For single source, pass the source
      const data = await getNewsTopic(topic.topic_id, isCombined ? null : sources[0]);
      
      setSelectedTopicData(data);
      setPosts(data.posts || []);
      setActiveSources(data.sources || sources);
      
      // Set topic IDs for each source
      const newTopicIds = { twitter: null, instagram: null };
      (data.sources || sources).forEach(src => {
        newTopicIds[src] = topic.topic_id;
      });
      setTopicIds(newTopicIds);
    } catch (err) {
      console.error("Failed to load topic:", err);
    } finally {
      setIsLoadingTopic(false);
    }
  };

  // ─── Delete a topic ─────────────────────────────────────────────────
  const handleDeleteTopic = async (e, topic) => {
    e.stopPropagation();
    if (!confirm("Delete this topic? This cannot be undone.")) return;
    try {
      const sources = topic.sources || [topic.source];
      // Delete from all sources for combined topics
      await Promise.all(
        sources.map(src => deleteNewsTopic(topic.topic_id, src).catch(() => {}))
      );
      if (selectedTopic === topic.topic_id) {
        setSelectedTopic(null);
        setSelectedTopicData(null);
      }
      await loadTopics();
    } catch (err) {
      console.error("Failed to delete topic:", err);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-64px)] bg-white text-gray-900 dark:bg-gray-900 dark:text-white overflow-hidden">

      {/* ── Left Sidebar ──────────────────────────────────────────── */}
      <div className="w-[300px] min-w-[300px] border-r border-black/10 dark:border-white/10 flex flex-col bg-black/[0.02] dark:bg-gray-900/60">

        {/* Header + Create Button */}
        <div className="p-4 border-b border-black/10 dark:border-white/10">
          <button
            onClick={() => {
              setShowCreateForm(true);
              setSelectedTopic(null);
              setSelectedTopicData(null);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg shadow-blue-500/20"
          >
            <Plus size={18} />
            Create Topic
          </button>
        </div>

        {/* Topics List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="animate-spin text-gray-500 dark:text-white/40" />
            </div>
          ) : topics.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-white/30 text-sm">
              No topics yet. Create one!
            </div>
          ) : (
            topics.map((topic) => {
              const sources = topic.sources || [topic.source];
              const isCombined = sources.length > 1;
              
              return (
                <button
                  key={topic.topic_id}
                  onClick={() => handleSelectTopic(topic)}
                  className={`w-full text-left p-3 rounded-xl transition-all duration-200 group relative ${selectedTopic === topic.topic_id
                      ? "bg-gradient-to-r from-blue-600/20 to-violet-600/10 border border-blue-500/30"
                      : "hover:bg-black/5 dark:hover:bg-white/5 border border-transparent"
                    }`}
                >
                  <div className="flex items-start gap-2.5">
                    {isCombined ? (
                      <div className="mt-0.5 flex -space-x-1">
                        <div className="p-1 rounded-lg bg-sky-500/20 text-sky-400 border border-gray-950">
                          <Twitter size={12} />
                        </div>
                        <div className="p-1 rounded-lg bg-pink-500/20 text-pink-400 border border-gray-950">
                          <Instagram size={12} />
                        </div>
                      </div>
                    ) : (
                      <div className={`mt-0.5 p-1.5 rounded-lg ${sources[0] === "twitter"
                          ? "bg-sky-500/20 text-sky-400"
                          : "bg-pink-500/20 text-pink-400"
                        }`}>
                        {sources[0] === "twitter" ? <Twitter size={14} /> : <Instagram size={14} />}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white/90 truncate">{topic.title}</p>
                      <p className="text-xs text-gray-500 dark:text-white/40 mt-0.5">
                        {topic.post_count} posts {isCombined && "· Combined"}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteTopic(e, topic)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded-lg transition-all"
                    >
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Main Panel ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Create Form */}
        {showCreateForm && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-full max-w-lg space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 text-transparent bg-clip-text">
                  Create News Topic
                </h2>
                <p className="text-gray-600 dark:text-white/40 text-sm mt-2">Search tweets or Instagram posts by keywords</p>
              </div>

              {/* State Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white/60 mb-2">State</label>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
                >
                  <option value="" className="bg-white dark:bg-gray-900">All States</option>
                  {states.map((s) => (
                    <option key={s.state_id} value={s.state_id} className="bg-white dark:bg-gray-900">
                      {s.state_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Source Selection (Multi-select) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white/60 mb-2">Sources (select one or both)</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => toggleSource("twitter")}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all duration-200 ${selectedSources.includes("twitter")
                        ? "bg-sky-500/20 border-sky-500/50 text-sky-400"
                        : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-gray-600 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/10"
                      }`}
                  >
                    <Twitter size={18} />
                    Twitter / X
                    {selectedSources.includes("twitter") && (
                      <span className="ml-1 w-2 h-2 rounded-full bg-sky-400"></span>
                    )}
                  </button>
                  <button
                    onClick={() => toggleSource("instagram")}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all duration-200 ${selectedSources.includes("instagram")
                        ? "bg-pink-500/20 border-pink-500/50 text-pink-400"
                        : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-gray-600 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/10"
                      }`}
                  >
                    <Instagram size={18} />
                    Instagram
                    {selectedSources.includes("instagram") && (
                      <span className="ml-1 w-2 h-2 rounded-full bg-pink-400"></span>
                    )}
                  </button>
                </div>
              </div>

              {/* Keywords Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white/60 mb-2">Keywords</label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="e.g. Elections, BJP rally, Modi speech..."
                  className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-gray-900 dark:text-white text-sm placeholder:text-gray-500 dark:placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
                />
              </div>

              {/* Search Button */}
              <button
                onClick={handleSearch}
                disabled={isSearching || !keywords.trim() || selectedSources.length === 0}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg shadow-blue-500/20"
              >
                {isSearching ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Searching {selectedSources.length === 2 ? "both sources" : selectedSources[0]}...
                  </>
                ) : (
                  <>
                    <Search size={18} />
                    Search & Save {selectedSources.length === 2 ? "(Both)" : ""}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Topic Results */}
        {!showCreateForm && selectedTopicData && (
          <div className="flex-1 overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/90 dark:bg-gray-900/80 backdrop-blur-lg border-b border-black/10 dark:border-white/10 px-6 py-4">
              <div className="flex items-center gap-3">
                {activeSources.length === 2 ? (
                  <div className="flex -space-x-2">
                    <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400 border-2 border-gray-950">
                      <Twitter size={16} />
                    </div>
                    <div className="p-2 rounded-lg bg-pink-500/20 text-pink-400 border-2 border-gray-950">
                      <Instagram size={16} />
                    </div>
                  </div>
                ) : (
                  <div className={`p-2 rounded-lg ${activeSources[0] === "twitter"
                      ? "bg-sky-500/20 text-sky-400"
                      : "bg-pink-500/20 text-pink-400"
                    }`}>
                    {activeSources[0] === "twitter" ? <Twitter size={20} /> : <Instagram size={20} />}
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">{selectedTopicData.title}</h2>
                  <p className="text-xs text-gray-600 dark:text-white/40">
                    {posts.length} posts · {activeSources.join(" + ")}
                    {selectedTopicData.state ? ` · ${selectedTopicData.state}` : ""}
                  </p>
                </div>
              </div>
            </div>

            {/* Posts */}
            <div className="p-6 space-y-4">
              {isLoadingTopic ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 size={24} className="animate-spin text-gray-500 dark:text-white/40" />
                </div>
              ) : (
                <>
                  {posts.map((post, idx) => (
                    <PostCard
                      key={post.id || idx}
                      post={post}
                      source={post._source || activeSources[0]}
                      showSourceBadge={activeSources.length > 1}
                    />
                  ))}
                  
                  {/* Load More Button */}
                  {posts.length > 0 && (
                    <div className="pt-4 pb-8">
                      <button
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 rounded-xl text-sm font-medium text-gray-700 dark:text-white/70 hover:text-gray-900 dark:hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoadingMore ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <Plus size={16} />
                            Load More
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!showCreateForm && !selectedTopicData && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center">
                <Search size={28} className="text-blue-400/60" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/60">Select or create a topic</h3>
              <p className="text-sm text-gray-500 dark:text-white/30 mt-1">Search social media and save the results</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


// ─── Post Card Component ──────────────────────────────────────────────

function PostCard({ post, source, showSourceBadge = false }) {
  if (source === "twitter") return <TweetCard post={post} showSourceBadge={showSourceBadge} />;
  return <InstaCard post={post} showSourceBadge={showSourceBadge} />;
}

function TweetCard({ post, showSourceBadge = false }) {
  return (
    <div className="bg-black/5 dark:bg-white/[0.03] border border-black/10 dark:border-white/[0.06] rounded-2xl p-5 hover:bg-black/10 dark:hover:bg-white/[0.05] transition-all duration-200">
      {/* Source Label */}
      {showSourceBadge && (
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-black/10 dark:border-white/[0.06]">
          <Twitter size={16} className="text-sky-400" />
          <span className="text-sm font-semibold text-sky-400">Twitter</span>
        </div>
      )}
      
      {/* Author row */}
      <div className="flex items-center gap-3 mb-3">
        {post.author_profile_pic && (
          <img
            src={post.author_profile_pic}
            alt=""
            className="w-10 h-10 rounded-full object-cover border border-black/10 dark:border-white/10"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{post.author_name || "Unknown"}</span>
            {post.is_verified && (
              <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
              </svg>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-white/40">@{post.author_username}</p>
        </div>
        {post.url && !showSourceBadge && (
          <a href={post.url} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors">
            <ExternalLink size={14} className="text-gray-500 dark:text-white/40" />
          </a>
        )}
      </div>

      {/* Tweet text */}
      <p className="text-sm text-gray-800 dark:text-white/80 leading-relaxed mb-3 whitespace-pre-wrap">{post.text}</p>

      {/* Media */}
      {post.media_urls && post.media_urls.length > 0 && (
        <div className={`grid gap-2 mb-3 rounded-xl overflow-hidden ${post.media_urls.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
          {post.media_urls.map((url, i) => {
            const isVideo = url.includes(".mp4") || url.includes("video");
            return isVideo ? (
              <video key={i} src={url} controls className="w-full rounded-xl max-h-80 object-cover bg-black" />
            ) : (
              <img key={i} src={url} alt="" className="w-full rounded-xl max-h-80 object-cover" loading="lazy" />
            );
          })}
        </div>
      )}

      {/* Metrics */}
      <div className="flex items-center gap-5 text-xs text-gray-500 dark:text-white/40 pt-2 border-t border-black/10 dark:border-white/[0.06]">
        <span className="flex items-center gap-1"><Heart size={14} /> {post.like_count || 0}</span>
        <span className="flex items-center gap-1"><Repeat2 size={14} /> {post.retweet_count || 0}</span>
        <span className="flex items-center gap-1"><MessageCircle size={14} /> {post.reply_count || 0}</span>
        <span className="flex items-center gap-1"><Bookmark size={14} /> {post.bookmark_count || 0}</span>
      </div>
    </div>
  );
}

function InstaCard({ post, showSourceBadge = false }) {
  return (
    <div className="bg-black/5 dark:bg-white/[0.03] border border-black/10 dark:border-white/[0.06] rounded-2xl p-5 hover:bg-black/10 dark:hover:bg-white/[0.05] transition-all duration-200">
      {/* Source Label */}
      {showSourceBadge && (
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-black/10 dark:border-white/[0.06]">
          <Instagram size={16} className="text-pink-400" />
          <span className="text-sm font-semibold text-pink-400">Insta</span>
        </div>
      )}
      
      {/* Author row */}
      <div className="flex items-center gap-3 mb-3">
        {post.owner_profile_pic && (
          <img
            src={post.owner_profile_pic}
            alt=""
            className="w-10 h-10 rounded-full object-cover border border-black/10 dark:border-white/10"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{post.owner_full_name || post.owner_username || "Unknown"}</span>
            {post.is_verified && (
              <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
              </svg>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-white/40">@{post.owner_username}</p>
        </div>
        {post.url && !showSourceBadge && (
          <a href={post.url} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors">
            <ExternalLink size={14} className="text-gray-500 dark:text-white/40" />
          </a>
        )}
      </div>

      {/* Caption */}
      {post.caption && (
        <p className="text-sm text-gray-800 dark:text-white/80 leading-relaxed mb-3 whitespace-pre-wrap line-clamp-4">{post.caption}</p>
      )}

      {/* Media */}
      {post.is_video && post.video_url ? (
        <div className="rounded-xl overflow-hidden mb-3 bg-black">
          <video src={post.video_url} controls className="w-full max-h-96 object-contain" />
        </div>
      ) : post.image_url ? (
        <div className="rounded-xl overflow-hidden mb-3">
          <img src={post.image_url} alt="" className="w-full max-h-96 object-cover" loading="lazy" />
        </div>
      ) : null}

      {/* Metrics */}
      <div className="flex items-center gap-5 text-xs text-gray-500 dark:text-white/40 pt-2 border-t border-black/10 dark:border-white/[0.06]">
        <span className="flex items-center gap-1"><Heart size={14} /> {post.like_count || 0}</span>
        <span className="flex items-center gap-1"><MessageCircle size={14} /> {post.comment_count || 0}</span>
      </div>
    </div>
  );
}