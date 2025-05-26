import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { db, storage } from "../../firebase";
import {
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import MainLayout from "@/components/MainLayout";

export default function EditPostPage() {
  const router = useRouter();
  const { id } = router.query;

  const [post, setPost] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [content, setContent] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [mediaType, setMediaType] = useState("image");
  const [newMedia, setNewMedia] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchPost = async () => {
      try {
        const ref = doc(db, "tripPosts", String(id));
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setPost(data);
          setTitle(data.title);
          setDestination(data.destination);
          setContent(data.content);
          setMediaUrls(data.mediaUrls || []);
          setMediaType(data.mediaType);
        }
      } catch (err) {
        alert("Error loading post");
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  const handleRemoveMedia = (url: string) => {
    setMediaUrls((prev) => prev.filter((item) => item !== url));
  };

  const handleNewMedia = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setNewMedia(files);
    if (files.length > 0) {
      setMediaType(files[0].type.includes("video") ? "video" : "image");
    }
  };

  const handleUpdate = async () => {
    if (!title || !destination || !content) {
      alert("All fields required");
      return;
    }

    let updatedUrls = [...mediaUrls];

    if (newMedia.length > 0) {
      const uploads = await Promise.all(
        newMedia.map(async (file) => {
          const fileRef = ref(storage, `user_uploads/${post.userId}/${Date.now()}_${file.name}`);
          await uploadBytes(fileRef, file);
          return await getDownloadURL(fileRef);
        })
      );
      updatedUrls = [...updatedUrls, ...uploads];
    }

    try {
      const ref = doc(db, "tripPosts", String(id));
      await updateDoc(ref, {
        title,
        destination,
        content,
        mediaUrls: updatedUrls,
        mediaType,
      });
      alert("Post updated successfully");
      router.push(`/profile/${post.userId}`);
    } catch (err) {
      alert("Failed to update post");
    }
  };

  if (loading) return <MainLayout><div className="p-6">Loading post...</div></MainLayout>;
  if (!post) return <MainLayout><div className="p-6 text-red-500">Post not found.</div></MainLayout>;

  return (
    <MainLayout>
      <div className="max-w-xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold">Edit Trip Post</h1>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Trip Title"
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Destination"
          className="w-full p-2 border rounded"
        />
        <textarea
          rows={5}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Trip Description"
          className="w-full p-2 border rounded"
        />

        <div>
          <p className="font-semibold mb-2">Existing Media</p>
          <div className="grid grid-cols-2 gap-2">
            {mediaUrls.map((url, index) => (
              <div key={index} className="relative">
                {mediaType === "image" ? (
                  <img src={url} className="w-full h-32 object-cover rounded" />
                ) : (
                  <video src={url} controls className="w-full h-32 rounded" />
                )}
                <button
                  onClick={() => handleRemoveMedia(url)}
                  className="absolute top-1 right-1 bg-black text-white text-xs px-2 py-1 rounded"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block font-semibold mb-1">Add New Media</label>
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleNewMedia}
          />
        </div>

        <button
          onClick={handleUpdate}
          className="bg-yellow-500 text-white px-4 py-2 rounded"
        >
          Update Post
        </button>
      </div>
    </MainLayout>
  );
}
