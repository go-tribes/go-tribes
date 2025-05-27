import { useEffect, useState, useCallback, useRef } from "react";
import { db, auth, storage } from "@/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  addDoc,
  serverTimestamp,
  limit,
  startAfter,
  where,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/router";
import { Autocomplete } from "@react-google-maps/api";
import MainLayout from "@/components/MainLayout";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { BsShare, BsWhatsapp, BsWechat, BsLink45Deg } from "react-icons/bs";

const PAGE_SIZE = 6;

export default function HomeFeed() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [visibility, setVisibility] = useState("public");
  const [autocomplete, setAutocomplete] = useState<any>(null);
  const [destination, setDestination] = useState("");
  const [showGallery, setShowGallery] = useState(false);
  const [galleryMedia, setGalleryMedia] = useState<string[]>([]);
  const [galleryType, setGalleryType] = useState<string>("");
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [commentsPost, setCommentsPost] = useState<any>(null);
  const [commentInput, setCommentInput] = useState("");
  const [trendingTags, setTrendingTags] = useState<string[]>([]);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [editContent, setEditContent] = useState("");
  const [editVisibility, setEditVisibility] = useState("public");
  const [editDestination, setEditDestination] = useState("");
  const [profileMap, setProfileMap] = useState<{ [uid: string]: any }>({});
  const [likePopupPost, setLikePopupPost] = useState<any>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [feedCarousels, setFeedCarousels] = useState<{ [postId: string]: number }>({});
  const swipeStartX = useRef<{ [postId: string]: number }>({});
  const [showShareDropdown, setShowShareDropdown] = useState<{ [postId: string]: boolean }>({});
  const router = useRouter();
  const feedRef = useRef<HTMLDivElement>(null);

  // Safe avatar loader, supports Firestore "profileImage"
  const getSafeAvatar = (userProfile: any, post: any) => {
    const url =
      userProfile?.profileImage ||
      userProfile?.profilePhoto ||
      userProfile?.avatar ||
      post.userAvatar ||
      "/default-avatar.png";
    if (!url || typeof url !== "string" || url.trim() === "" || url === "null") {
      return "/default-avatar.png";
    }
    return url;
  };

  // Fetch user profile for each unique userId in posts
  useEffect(() => {
    if (posts.length === 0) return;
    const uniqueUserIds = Array.from(
      new Set(posts.map((p) => p.userId).filter(Boolean))
    );
    let ignore = false;
    const fetchProfiles = async () => {
      const newProfileMap: { [uid: string]: any } = {};
      await Promise.all(
        uniqueUserIds.map(async (uid) => {
          if (!uid) return;
          try {
            const snap = await getDoc(doc(db, "users", uid));
            if (snap.exists()) {
              newProfileMap[uid] = snap.data();
            }
          } catch (e) {}
        })
      );
      if (!ignore) setProfileMap(newProfileMap);
    };
    fetchProfiles();
    return () => {
      ignore = true;
    };
  }, [posts]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUserId(user.uid);
        loadTrendingTags();
        loadInitialPosts(user.uid);
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
    // eslint-disable-next-line
  }, [filter, tagFilter]);

  useEffect(() => {
    const handleScroll = () => {
      if (loadingMore || !hasMore) return;
      const threshold = 600;
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - threshold
      ) {
        loadMorePosts();
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
    // eslint-disable-next-line
  }, [loadingMore, hasMore, lastDoc, filter, tagFilter]);

  const loadTrendingTags = async () => {
    const snapshot = await getDocs(query(collection(db, "tripPosts")));
    const allTags: string[] = [];
    snapshot.docs.forEach((doc) => {
      (doc.data().tags || []).forEach((tag: string) => {
        if (tag && !allTags.includes(tag)) allTags.push(tag);
      });
    });
    setTrendingTags(allTags.slice(0, 8));
  };

  const loadInitialPosts = async (uid: string) => {
    setLoading(true);
    let q = query(collection(db, "tripPosts"), orderBy("timestamp", "desc"), limit(PAGE_SIZE));
    if (tagFilter) q = query(collection(db, "tripPosts"), where("tags", "array-contains", tagFilter), orderBy("timestamp", "desc"), limit(PAGE_SIZE));
    const snapshot = await getDocs(q);
    setPosts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
    setHasMore(snapshot.docs.length === PAGE_SIZE);
    setLoading(false);
  };

  const loadMorePosts = async () => {
    if (!lastDoc || loadingMore || !hasMore) return;
    setLoadingMore(true);
    let q = query(collection(db, "tripPosts"), orderBy("timestamp", "desc"), startAfter(lastDoc), limit(PAGE_SIZE));
    if (tagFilter) q = query(collection(db, "tripPosts"), where("tags", "array-contains", tagFilter), orderBy("timestamp", "desc"), startAfter(lastDoc), limit(PAGE_SIZE));
    const snapshot = await getDocs(q);
    const morePosts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setPosts((prev) => [...prev, ...morePosts]);
    setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
    setHasMore(snapshot.docs.length === PAGE_SIZE);
    setLoadingMore(false);
  };

  const toggleLike = async (postId: string, liked: boolean) => {
    if (!currentUserId) return;
    const postRef = doc(db, "tripPosts", postId);
    await updateDoc(postRef, {
      likes: liked ? arrayRemove(currentUserId) : arrayUnion(currentUserId),
    });
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              likes: liked
                ? (p.likes || []).filter((id: string) => id !== currentUserId)
                : [...(p.likes || []), currentUserId],
            }
          : p
      )
    );
  };

  const openComments = (post: any) => {
    setCommentsPost(post);
    setShowComments(true);
    setCommentInput("");
  };
  const closeComments = () => setShowComments(false);
  const handleAddComment = async () => {
    if (!commentInput.trim() || !commentsPost) return;
    const commentObj = {
      userId: currentUserId,
      text: commentInput,
      timestamp: new Date(),
    };
    const postRef = doc(db, "tripPosts", commentsPost.id);
    await updateDoc(postRef, {
      comments: arrayUnion(commentObj),
    });
    setPosts((prev) =>
      prev.map((p) =>
        p.id === commentsPost.id
          ? { ...p, comments: [...(p.comments || []), commentObj] }
          : p
      )
    );
    setCommentInput("");
  };

  const handlePlaceLoad = (auto: any) => setAutocomplete(auto);
  const handlePlaceChange = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      setDestination(place.formatted_address || place.name);
    }
  };

  const handleSharePost = async () => {
    if (!currentUserId || !newPostContent.trim() || !destination) return;
    const userDoc = await getDoc(doc(db, "users", currentUserId));
    const userData = userDoc.data() || {};
    const mediaUrls: string[] = [];
    let mediaType = "";
    for (const file of mediaFiles) {
      if (file.type.startsWith("video") && file.size > 60 * 1024 * 1024) {
        alert("Each video must be under 60 seconds (~60MB max assumed)");
        return;
      }
      const fileRef = ref(storage, `posts/${currentUserId}/${file.name}-${Date.now()}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      mediaUrls.push(url);
      mediaType = file.type.startsWith("video") ? "video" : "image";
    }
    const newPost = {
      userId: currentUserId,
      userName: userData.nickname || userData.email || userData.name || "User",
      userAvatar: userData.profileImage || userData.profilePhoto || userData.avatar || "/default-avatar.png",
      title: destination,
      content: newPostContent,
      destination,
      mediaUrls,
      mediaType,
      likes: [],
      comments: [],
      visibility,
      timestamp: serverTimestamp(),
    };
    await addDoc(collection(db, "tripPosts"), newPost);
    setNewPostContent("");
    setMediaFiles([]);
    setDestination("");
    setVisibility("public");
    loadInitialPosts(currentUserId);
    loadTrendingTags();
  };

  // Carousel logic for each post
  const handleCarouselTouchStart = (postId: string, e: React.TouchEvent<HTMLDivElement>) => {
    swipeStartX.current[postId] = e.touches[0].clientX;
  };
  const handleCarouselTouchEnd = (postId: string, e: React.TouchEvent<HTMLDivElement>, mediaList: string[]) => {
    const endX = e.changedTouches[0].clientX;
    const startX = swipeStartX.current[postId] || 0;
    const diff = endX - startX;
    if (Math.abs(diff) > 40) {
      setFeedCarousels((prev) => {
        const oldIdx = prev[postId] || 0;
        const newIdx =
          diff < 0
            ? (oldIdx + 1) % mediaList.length
            : (oldIdx - 1 + mediaList.length) % mediaList.length;
        return { ...prev, [postId]: newIdx };
      });
    }
  };

  // Toast for delete/edit success
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2000);
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Delete this post?")) return;
    await deleteDoc(doc(db, "tripPosts", postId));
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    showToast("Post deleted");
  };
  const handleEditPost = (post: any) => {
    setEditingPost(post);
    setEditContent(post.content);
    setEditVisibility(post.visibility || "public");
    setEditDestination(post.destination || "");
  };
  const saveEditPost = async () => {
    if (!editingPost) return;
    const postRef = doc(db, "tripPosts", editingPost.id);
    await updateDoc(postRef, {
      content: editContent,
      destination: editDestination,
      visibility: editVisibility,
    });
    setPosts((prev) =>
      prev.map((p) =>
        p.id === editingPost.id
          ? { ...p, content: editContent, destination: editDestination, visibility: editVisibility }
          : p
      )
    );
    setEditingPost(null);
    showToast("Post updated");
  };

  const handleTagClick = (tag: string) => {
    setTagFilter(tag);
    setLoading(true);
    setHasMore(true);
    setLastDoc(null);
    setPosts([]);
    setTimeout(() => loadInitialPosts(currentUserId || ""), 300);
  };

  // Social Share Dropdown handlers
  const handleShareDropdown = (postId: string) => {
    setShowShareDropdown((prev) => ({
      ...Object.keys(prev).reduce((obj, key) => ({ ...obj, [key]: false }), {}),
      [postId]: !prev[postId],
    }));
  };
  const handleCopyLink = (postId: string) => {
    const url = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(url);
    setToastMsg("Link copied!");
    setShowShareDropdown({});
  };
  const handleShareWhatsApp = (postId: string, displayName: string, content: string) => {
    const url = `${window.location.origin}/post/${postId}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(
        `[Go-Tribes]\n${displayName}:\n${content}\n${url}`
      )}`,
      "_blank"
    );
    setShowShareDropdown({});
  };
  const handleShareWeChat = (postId: string, displayName: string, content: string) => {
    const url = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(
      `[Go-Tribes]\n${displayName}:\n${content}\n${url}`
    );
    setToastMsg("Text copied for WeChat!");
    setShowShareDropdown({});
  };

  // --- UI START ---
  return (
    <MainLayout>
      <div className="flex w-full max-w-6xl mx-auto">
        {/* Trending Tags Sidebar */}
        <div className="hidden md:block w-1/5 pr-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow p-4 mb-4">
            <div className="font-bold mb-2 text-yellow-700 dark:text-yellow-400">Trending Tags</div>
            <div className="flex flex-wrap gap-2">
              {trendingTags.map((tag) => (
                <span
                  key={tag}
                  className={`px-2 py-1 rounded-full text-xs cursor-pointer ${tagFilter === tag ? "bg-yellow-400 text-white" : "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 hover:bg-yellow-300 dark:hover:bg-yellow-700"}`}
                  onClick={() => handleTagClick(tag)}
                >
                  #{tag}
                </span>
              ))}
            </div>
            {tagFilter && (
              <button onClick={() => handleTagClick("")} className="mt-4 text-xs text-blue-500 dark:text-yellow-200">Clear Tag Filter</button>
            )}
          </div>
        </div>
        {/* Main Feed Column */}
        <div className="w-full md:w-3/5 space-y-6" ref={feedRef}>
          {/* Toast */}
          <AnimatePresence>
            {toastMsg && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed top-6 left-1/2 z-50 -translate-x-1/2 bg-yellow-500 text-white px-6 py-2 rounded-xl shadow-xl"
              >
                {toastMsg}
              </motion.div>
            )}
          </AnimatePresence>
          {/* Share Post Form */}
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow space-y-2">
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full p-2 border rounded resize-none dark:bg-zinc-800 dark:text-yellow-100"
              maxLength={300}
              aria-label="Post content"
            ></textarea>
            <Autocomplete onLoad={handlePlaceLoad} onPlaceChanged={handlePlaceChange}>
              <input
                type="text"
                placeholder="Enter trip location"
                className="w-full p-2 border rounded dark:bg-zinc-800 dark:text-yellow-100"
                aria-label="Trip location"
              />
            </Autocomplete>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="w-full p-2 border rounded dark:bg-zinc-800 dark:text-yellow-100"
              aria-label="Post visibility"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setMediaFiles(files);
              }}
              aria-label="Media upload"
              className="dark:bg-zinc-800 dark:text-yellow-100"
            />
            <button
              onClick={handleSharePost}
              className="bg-[#D9A531] text-white px-4 py-2 rounded hover:bg-yellow-600"
              disabled={!newPostContent.trim() || !destination}
              aria-label="Share Post"
            >
              Share Post
            </button>
          </div>
          {/* Posts List */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse bg-white dark:bg-zinc-900 p-6 rounded-xl shadow h-40"></div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <p className="text-gray-500 dark:text-yellow-100">No posts to show.</p>
          ) : (
            posts.map((post) => {
              const liked = post.likes?.includes(currentUserId);
              const isVideo = post.mediaType === "video";
              const latestProfile = post.userId ? profileMap[post.userId] : null;
              const displayName =
                latestProfile?.nickname ||
                latestProfile?.email ||
                latestProfile?.displayName ||
                latestProfile?.name ||
                latestProfile?.userName ||
                post.userName ||
                "User";
              const avatarSrc = getSafeAvatar(latestProfile, post);
              const isVerified = latestProfile?.verified === true;
              const postMediaIdx = feedCarousels[post.id] || 0;
              const totalMedia = post.mediaUrls?.length || 0;
              const currentMediaUrl = post.mediaUrls?.[postMediaIdx] || "";

              return (
                <div key={post.id} className="bg-white dark:bg-zinc-900 border rounded-xl shadow-sm overflow-hidden relative group">
                  {/* Post Header */}
                  <div className="flex items-center p-3 border-b dark:border-zinc-800">
                    <img
                      src={avatarSrc}
                      loading="lazy"
                      className="w-10 h-10 rounded-full object-cover border cursor-pointer"
                      alt={displayName}
                      onClick={() => router.push(`/profile/${post.userId}`)}
                      onError={e => {
                        const target = e.target as HTMLImageElement;
                        if (!target.src.endsWith("/default-avatar.png")) {
                          target.src = "/default-avatar.png";
                        }
                      }}
                      aria-label={`View profile of ${displayName}`}
                    />
                    <div className="flex flex-col flex-1 ml-3">
                      <span className="font-bold flex items-center gap-2 dark:text-yellow-100">
                        {displayName}
                        {isVerified && (
                          <span
                            className="ml-1 px-1.5 py-0.5 bg-blue-400 text-white text-[10px] rounded font-bold"
                            title="Verified"
                          >
                            ✔
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-gray-400">
                        {post.timestamp?.seconds
                          ? formatDistanceToNow(new Date(post.timestamp.seconds * 1000), { addSuffix: true })
                          : ""}
                        {post.visibility === "public" && " 🌐"}
                        {post.visibility === "private" && " 🔒"}
                      </span>
                    </div>
                    <div className="ml-2 flex gap-1 items-center">
                      <div className="relative">
                        <button
                          onClick={() => handleShareDropdown(post.id)}
                          className="text-xl px-2 py-1 hover:text-yellow-500"
                          aria-label="Share Post"
                        >
                          <BsShare />
                        </button>
                        {showShareDropdown[post.id] && (
                          <div className="absolute top-8 right-0 bg-white dark:bg-zinc-900 border shadow-lg rounded-lg z-50 w-40">
                            <button
                              className="flex items-center w-full gap-2 p-2 text-sm hover:bg-yellow-100 dark:hover:bg-zinc-800"
                              onClick={() => handleShareWhatsApp(post.id, displayName, post.content)}
                            >
                              <BsWhatsapp className="text-green-500" /> WhatsApp
                            </button>
                            <button
                              className="flex items-center w-full gap-2 p-2 text-sm hover:bg-yellow-100 dark:hover:bg-zinc-800"
                              onClick={() => handleShareWeChat(post.id, displayName, post.content)}
                            >
                              <BsWechat className="text-green-700" /> Copy for WeChat
                            </button>
                            <button
                              className="flex items-center w-full gap-2 p-2 text-sm hover:bg-yellow-100 dark:hover:bg-zinc-800"
                              onClick={() => handleCopyLink(post.id)}
                            >
                              <BsLink45Deg /> Copy Link
                            </button>
                          </div>
                        )}
                      </div>
                      {currentUserId === post.userId && (
                        <>
                          <button
                            className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900 rounded hover:bg-yellow-200 dark:hover:bg-yellow-700 mr-1"
                            onClick={() => handleEditPost(post)}
                            aria-label="Edit Post"
                          >
                            Edit
                          </button>
                          <button
                            className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900 text-red-600 rounded hover:bg-red-200 dark:hover:bg-red-700"
                            onClick={() => handleDeletePost(post.id)}
                            aria-label="Delete Post"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {/* Post Body */}
                  <div className="p-4 space-y-2">
                    <p className="text-sm text-gray-700 dark:text-yellow-100">{post.content}</p>
                    <p className="text-sm text-gray-500 truncate">
                      📍 <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(post.destination)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-yellow-700 dark:text-yellow-300"
                        aria-label={`See ${post.destination} on Google Maps`}
                      >
                        {post.destination}
                      </a>
                    </p>
                    {/* Carousel Media Preview with swipe */}
                    {post.mediaUrls?.length > 0 && (
                      <div
                        className="relative mt-2 w-full flex items-center group/carousel select-none"
                        onTouchStart={e => handleCarouselTouchStart(post.id, e)}
                        onTouchEnd={e => handleCarouselTouchEnd(post.id, e, post.mediaUrls)}
                      >
                        <button
                          className="absolute left-0 top-1/2 -translate-y-1/2 bg-white bg-opacity-70 hover:bg-yellow-100 rounded-full p-2 z-10"
                          onClick={() =>
                            setFeedCarousels(prev => ({
                              ...prev,
                              [post.id]:
                                (postMediaIdx - 1 + totalMedia) % totalMedia,
                            }))
                          }
                          style={{ left: "4px" }}
                          aria-label="Previous image"
                          tabIndex={0}
                        >
                          ◀
                        </button>
                        <div className="w-full grid grid-cols-1 overflow-x-auto rounded-xl">
                          <div className="flex justify-center items-center">
                            {isVideo ? (
                              <video
                                src={currentMediaUrl}
                                className="max-h-72 rounded-lg object-contain"
                                muted
                                controls
                                onClick={() => {
                                  setShowGallery(true);
                                  setGalleryMedia(post.mediaUrls);
                                  setGalleryType(post.mediaType);
                                  setGalleryIndex(postMediaIdx);
                                }}
                              />
                            ) : (
                              <img
                                src={currentMediaUrl}
                                loading="lazy"
                                className="max-h-72 rounded-lg object-contain"
                                alt="media"
                                onClick={() => {
                                  setShowGallery(true);
                                  setGalleryMedia(post.mediaUrls);
                                  setGalleryType(post.mediaType);
                                  setGalleryIndex(postMediaIdx);
                                }}
                              />
                            )}
                            {post.mediaUrls.length > 1 && (
                              <span className="absolute bottom-2 right-2 bg-gray-900 bg-opacity-60 text-white text-xs rounded px-2 py-1">
                                {postMediaIdx + 1} / {post.mediaUrls.length}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          className="absolute right-0 top-1/2 -translate-y-1/2 bg-white bg-opacity-70 hover:bg-yellow-100 rounded-full p-2 z-10"
                          onClick={() =>
                            setFeedCarousels(prev => ({
                              ...prev,
                              [post.id]: (postMediaIdx + 1) % totalMedia,
                            }))
                          }
                          style={{ right: "4px" }}
                          aria-label="Next image"
                          tabIndex={0}
                        >
                          ▶
                        </button>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-xs text-gray-500 pt-2">
                      <button
                        onClick={() => toggleLike(post.id, liked)}
                        className={`hover:text-red-500 transition ${liked ? "text-red-500 font-bold" : ""}`}
                        aria-label={liked ? "Unlike post" : "Like post"}
                        onMouseEnter={() => setLikePopupPost(post)}
                        onMouseLeave={() => setLikePopupPost(null)}
                        onFocus={() => setLikePopupPost(post)}
                        onBlur={() => setLikePopupPost(null)}
                        tabIndex={0}
                      >
                        ❤️ {post.likes?.length || 0}
                        {/* Likes Popup */}
                        {likePopupPost?.id === post.id && post.likes?.length > 0 && (
                          <div className="absolute bg-white dark:bg-zinc-900 border shadow rounded px-4 py-2 left-1/2 -translate-x-1/2 mt-2 z-30">
                            <div className="font-bold text-xs mb-1 text-yellow-700 dark:text-yellow-400">Liked by</div>
                            <ul>
                              {post.likes.slice(0, 10).map((uid: string, idx: number) => {
                                const user = profileMap[uid];
                                return (
                                  <li key={uid} className="flex items-center gap-2 text-xs mb-1">
                                    <img src={getSafeAvatar(user, {})} className="w-5 h-5 rounded-full" alt="" />
                                    {user?.nickname || user?.email || "User"}
                                    {user?.verified && <span className="ml-1 text-blue-400 font-bold">✔</span>}
                                    {idx === 9 && post.likes.length > 10 && <span>and more...</span>}
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}
                      </button>
                      <button
                        onClick={() => openComments(post)}
                        className="hover:text-blue-500"
                        aria-label="View comments"
                      >
                        💬 {post.comments?.length || 0}
                      </button>
                      <button
                        onClick={() => alert("Bookmark feature coming soon!")}
                        className="hover:text-blue-500"
                        aria-label="Bookmark post"
                      >
                        🔖 Save
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          {loadingMore && (
            <div className="text-center py-4 text-gray-400 dark:text-yellow-100">Loading more...</div>
          )}
          {/* Gallery Modal with framer-motion */}
          <AnimatePresence>
            {showGallery && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center p-4"
                onTouchStart={e => {
                  swipeStartX.current.gallery = e.touches[0].clientX;
                }}
                onTouchEnd={e => {
                  const endX = e.changedTouches[0].clientX;
                  const startX = swipeStartX.current.gallery || 0;
                  const diff = endX - startX;
                  if (Math.abs(diff) > 40) {
                    if (diff < 0) setGalleryIndex((prev) => (prev + 1) % galleryMedia.length);
                    else setGalleryIndex((prev) => (prev - 1 + galleryMedia.length) % galleryMedia.length);
                  }
                }}
              >
                <button
                  onClick={() => setShowGallery(false)}
                  className="text-white text-sm self-end mb-2 px-4 py-1 bg-gray-700 rounded"
                  aria-label="Close gallery"
                >
                  Close ✕
                </button>
                <div className="w-full max-w-2xl flex flex-col items-center">
                  <div className="flex items-center w-full justify-center mb-2">
                    <button
                      className="text-white bg-black bg-opacity-40 p-2 rounded-full"
                      onClick={() => setGalleryIndex((prev) => (prev - 1 + galleryMedia.length) % galleryMedia.length)}
                      aria-label="Previous media"
                    >
                      ◀
                    </button>
                    {galleryType === "video" ? (
                      <video
                        src={galleryMedia[galleryIndex]}
                        controls
                        className="w-full max-h-96 rounded object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <img
                        src={galleryMedia[galleryIndex]}
                        className="w-full max-h-96 rounded object-contain"
                        loading="lazy"
                        alt="gallery item"
                      />
                    )}
                    <button
                      className="text-white bg-black bg-opacity-40 p-2 rounded-full"
                      onClick={() => setGalleryIndex((prev) => (prev + 1) % galleryMedia.length)}
                      aria-label="Next media"
                    >
                      ▶
                    </button>
                  </div>
                  <div className="text-white text-center mt-2 text-sm">
                    {galleryIndex + 1} / {galleryMedia.length}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Comments Modal */}
          <AnimatePresence>
            {showComments && commentsPost && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 40 }}
                className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center"
              >
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow w-full max-w-lg">
                  <h2 className="font-bold text-lg mb-2 dark:text-yellow-100">
                    Comments
                  </h2>
                  <div className="max-h-64 overflow-y-auto space-y-2 mb-2">
                    {commentsPost.comments && commentsPost.comments.length > 0 ? (
                      commentsPost.comments.map((c: any, idx: number) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <span className="font-semibold text-yellow-800 dark:text-yellow-400">
                            {c.userId === currentUserId
                              ? "You"
                              : (profileMap[c.userId]?.nickname ||
                                profileMap[c.userId]?.email ||
                                c.userId)}
                          </span>
                          <span className="text-sm">{c.text}</span>
                          <span className="text-xs text-gray-400 ml-auto">
                            {c.timestamp
                              ? typeof c.timestamp === "object" && c.timestamp.seconds
                                ? formatDistanceToNow(
                                    new Date(c.timestamp.seconds * 1000),
                                    { addSuffix: true }
                                  )
                                : ""
                              : ""}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-500 dark:text-yellow-200 text-sm">
                        No comments yet.
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      className="flex-1 border p-2 rounded dark:bg-zinc-800 dark:text-yellow-100"
                      placeholder="Add a comment"
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleAddComment()}
                      aria-label="Add a comment"
                    />
                    <button
                      className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                      onClick={handleAddComment}
                      aria-label="Post comment"
                    >
                      Post
                    </button>
                    <button
                      className="ml-2 text-gray-500 hover:text-gray-900"
                      onClick={closeComments}
                      aria-label="Close comments"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Edit Modal */}
          <AnimatePresence>
            {editingPost && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 40 }}
                className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center"
              >
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow w-full max-w-lg">
                  <h2 className="font-bold text-lg mb-2 dark:text-yellow-100">Edit Post</h2>
                  <textarea
                    className="w-full border p-2 rounded mb-2 dark:bg-zinc-800 dark:text-yellow-100"
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    placeholder="What's on your mind?"
                    aria-label="Edit content"
                  />
                  <input
                    className="w-full border p-2 rounded mb-2 dark:bg-zinc-800 dark:text-yellow-100"
                    value={editDestination}
                    onChange={e => setEditDestination(e.target.value)}
                    placeholder="Enter trip location"
                    aria-label="Edit trip location"
                  />
                  <select
                    className="w-full border p-2 rounded mb-4 dark:bg-zinc-800 dark:text-yellow-100"
                    value={editVisibility}
                    onChange={e => setEditVisibility(e.target.value)}
                    aria-label="Edit visibility"
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                  <div className="flex gap-2 justify-end">
                    <button
                      className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                      onClick={saveEditPost}
                      aria-label="Save changes"
                    >
                      Save
                    </button>
                    <button
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                      onClick={() => setEditingPost(null)}
                      aria-label="Cancel edit"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </MainLayout>
  );
}
