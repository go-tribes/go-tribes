import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import Image from "next/image";
import MainLayout from "../../components/MainLayout";

export default function PostDetail() {
  const router = useRouter();
  const { postId } = router.query;
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      if (!postId || typeof postId !== "string") return;

      try {
        const docRef = doc(db, "posts", postId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setPost(docSnap.data());
        } else {
          console.log("No such post!");
        }
      } catch (error) {
        console.error("Error fetching post:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  if (loading) {
    return <MainLayout><div className="p-8 text-center text-lg">Loading post...</div></MainLayout>;
  }

  if (!post) {
    return <MainLayout><div className="p-8 text-center text-red-600">❌ Post not found.</div></MainLayout>;
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto p-6 bg-white shadow rounded-xl mt-6 space-y-4">
        <h1 className="text-2xl font-bold">{post.title || "Untitled Trip"}</h1>
        <p className="text-sm text-gray-500">{post.location || "Unknown Location"}</p>
        
        {post.imageUrl && (
          <div className="w-full h-64 relative rounded overflow-hidden">
            <Image
              src={post.imageUrl}
              alt="Post Image"
              layout="fill"
              objectFit="cover"
            />
          </div>
        )}

        <p className="text-gray-700">{post.description || "No description provided."}</p>

        <div className="text-sm text-gray-500">
          <p>❤️ {post.likes?.length || 0} Likes</p>
          <p>💬 {post.comments?.length || 0} Comments</p>
        </div>

        {post.authorName && (
          <p className="text-xs text-gray-400">Shared by: {post.authorName}</p>
        )}
      </div>
    </MainLayout>
  );
}
