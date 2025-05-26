"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { db, storage, auth } from "@/firebase";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";

export default function CreateTrip() {
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [content, setContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Ensure user is logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        alert("Please login to share your trip.");
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, []);

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const isVideo = files.some((f) => f.type.includes("video"));
    if (isVideo && files.length > 1) {
      alert("Only one video is allowed.");
      return;
    }
    if (!isVideo && files.length > 10) {
      alert("Max 10 images allowed.");
      return;
    }
    setMediaFiles(files);
  };

  const handleSubmit = async () => {
    const user = auth.currentUser;
    console.log("Step 1: Current user =", user);

    if (!user) {
      alert("User not logged in.");
      return;
    }

    if (loading) return;

    if (!title || !destination || !content || mediaFiles.length === 0) {
      alert("Please complete all fields and upload media.");
      return;
    }

    setLoading(true);
    console.log("Step 2: Starting upload...");

    try {
      const urls: string[] = [];
      const mediaType = mediaFiles[0].type.includes("video") ? "video" : "image";

      for (const file of mediaFiles) {
        console.log("Step 3: Uploading file =", file.name);
        const fileRef = ref(storage, `user_uploads/${user.uid}/${Date.now()}_${file.name}`);
        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);
        urls.push(url);
        console.log("Step 4: Uploaded URL =", url);
      }

      console.log("Step 5: Saving to Firestore...");
      await addDoc(collection(db, "tripPosts"), {
        userId: user.uid,
        title,
        destination,
        content,
        mediaUrls: urls,
        mediaType,
        timestamp: Timestamp.now(),
      });

      console.log("Step 6: Saved. Redirecting...");
      setLoading(false);
      router.push(`/profile/${user.uid}`);
    } catch (error) {
      console.error("❌ Error posting trip:", error);
      alert("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Share a Trip</h1>
      <input
        type="text"
        placeholder="Trip Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full p-2 border rounded"
      />
      <input
        type="text"
        placeholder="Destination"
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
        className="w-full p-2 border rounded"
      />
      <textarea
        rows={4}
        placeholder="Trip Description"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full p-2 border rounded"
      />
      <input
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={handleMediaChange}
        className="w-full"
      />
      <button
        onClick={handleSubmit}
        className="bg-yellow-500 text-white px-4 py-2 rounded"
        disabled={loading}
      >
        {loading ? "Posting..." : "Post Trip"}
      </button>
    </div>
  );
}
