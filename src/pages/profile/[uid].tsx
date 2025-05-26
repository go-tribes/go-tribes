import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { db, auth } from "../../firebase";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
} from "firebase/firestore";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { Dialog } from "@headlessui/react";
import MainLayout from "@/components/MainLayout";

export default function PublicProfile() {
  const router = useRouter();
  const { uid } = router.query;

  const [profile, setProfile] = useState<any>(null);
  const [sharedPosts, setSharedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxSlides, setLightboxSlides] = useState<{ src: string }[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUserId(user?.uid || null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!uid) return;

    const fetchData = async () => {
      try {
        const userRef = doc(db, "users", String(uid));
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setProfile(userSnap.data());
        }

        const sharedQuery = query(
          collection(db, "tripPosts"),
          where("userId", "==", String(uid)),
          orderBy("timestamp", "desc")
        );
        const sharedSnap = await getDocs(sharedQuery);
        const sharedList = sharedSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSharedPosts(sharedList);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [uid]);

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      await deleteDoc(doc(db, "tripPosts", postId));
      setSharedPosts((prev) => prev.filter((post) => post.id !== postId));
      setShowPostModal(false);
    } catch (error) {
      alert("Failed to delete post.");
    }
  };

  if (loading) return <MainLayout><div className="p-6">Loading public profile...</div></MainLayout>;
  if (!profile) return <MainLayout><div className="p-6 text-red-500">Profile not found.</div></MainLayout>;

  return (
    <MainLayout>
      <div className="w-full flex justify-center px-4">
        <div className="w-full max-w-2xl py-10 space-y-10">
          <div className="flex items-center space-x-4">
            {profile.profileImage && (
              <img
                src={profile.profileImage}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold">{profile.nickname || "Unnamed Triber"}</h1>
              <p className="text-sm text-gray-500 mt-1">
                Tribe Rank: <span className="font-semibold">Shared {sharedPosts.length} Trips</span>
              </p>
              {profile.origin && <p className="text-sm text-gray-500">From: {profile.origin}</p>}
              {profile.gender && <p className="text-sm text-gray-500">Gender: {profile.gender}</p>}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-3">Trip Stories</h2>
            {sharedPosts.length === 0 ? (
              <p className="text-gray-500">No stories posted yet.</p>
            ) : (
              <div className="space-y-6">
                {sharedPosts.map((post: any) => (
                  <div
                    key={post.id}
                    className="bg-white border rounded-xl shadow-sm overflow-hidden cursor-pointer"
                    onClick={() => {
                      setSelectedPost(post);
                      setShowPostModal(true);
                    }}
                  >
                    {post.mediaType === "image" ? (
                      <div className="grid grid-cols-2 gap-1">
                        {post.mediaUrls.slice(0, 3).map((url: string, index: number) => (
                          <img
                            key={index}
                            src={url}
                            alt={`photo ${index + 1}`}
                            className="h-40 w-full object-cover rounded-sm"
                          />
                        ))}
                        {post.mediaUrls.length > 3 && (
                          <div className="flex items-center justify-center h-40 bg-black text-white text-sm font-semibold rounded-sm">
                            +{post.mediaUrls.length - 3} more
                          </div>
                        )}
                      </div>
                    ) : (
                      <video
                        controls
                        src={post.mediaUrls[0]}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-4 space-y-1">
                      <h3 className="text-md font-semibold text-gray-800 truncate">{post.title}</h3>
                      <p className="text-sm text-gray-500 truncate">📍 {post.destination}</p>
                      <p className="text-sm text-gray-700 line-clamp-3">{post.content}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(post.timestamp?.seconds * 1000).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Dialog open={showPostModal} onClose={() => setShowPostModal(false)} className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <Dialog.Panel className="bg-white max-w-xl w-full mx-auto p-6 rounded-xl shadow-xl">
                {selectedPost && (
                  <>
                    {selectedPost.mediaType === "image" ? (
                      <div className="grid grid-cols-1 gap-2 mb-4">
                        {selectedPost.mediaUrls.map((url: string, idx: number) => (
                          <img
                            key={idx}
                            src={url}
                            alt={`full ${idx + 1}`}
                            className="w-full rounded-lg"
                          />
                        ))}
                      </div>
                    ) : (
                      <video
                        controls
                        src={selectedPost.mediaUrls[0]}
                        className="w-full mb-4 rounded-lg"
                      />
                    )}
                    <h2 className="text-xl font-semibold mb-1">{selectedPost.title}</h2>
                    <p className="text-sm text-gray-500 mb-1">📍 {selectedPost.destination}</p>
                    <p className="text-gray-700 whitespace-pre-line mb-2">{selectedPost.content}</p>
                    <p className="text-xs text-gray-400 mb-2">
                      {new Date(selectedPost.timestamp?.seconds * 1000).toLocaleString()}
                    </p>
                    {selectedPost.userId === currentUserId && (
                      <div className="flex justify-end space-x-4 mt-4">
                        <button
                          onClick={() => handleDeletePost(selectedPost.id)}
                          className="px-4 py-2 text-sm rounded bg-red-500 text-white"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => router.push(`/edit-post/${selectedPost.id}`)}
                          className="px-4 py-2 text-sm rounded bg-gray-200"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </>
                )}
              </Dialog.Panel>
            </div>
          </Dialog>

          <Lightbox
            open={lightboxOpen}
            close={() => setLightboxOpen(false)}
            slides={lightboxSlides}
            index={lightboxIndex}
          />
        </div>
      </div>
    </MainLayout>
  );
}
