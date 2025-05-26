import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { auth, db } from "@/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import MainLayout from "@/components/MainLayout";

export default function EditProfile() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setProfile(data);
        setSelectedImage(data.profileImage || "");
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user || !selectedImage) return;

    setSaving(true);
    try {
      await updateProfile(user, {
        photoURL: selectedImage,
      });

      await updateDoc(doc(db, "users", user.uid), {
        profileImage: selectedImage,
      });

      alert("Profile image updated.");
      router.push(`/profile/${user.uid}`);
    } catch (err: any) {
      alert("Failed to update profile: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto py-10 px-4">
        <h1 className="text-2xl font-bold mb-4">Edit Profile Image</h1>

        {profile?.profileImages?.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            {profile.profileImages.map((url: string, idx: number) => (
              <img
                key={idx}
                src={url}
                alt={`profile option ${idx + 1}`}
                onClick={() => setSelectedImage(url)}
                className={`cursor-pointer rounded-lg border-4 ${
                  selectedImage === url ? "border-yellow-500" : "border-transparent"
                }`}
              />
            ))}
          </div>
        ) : (
          <p>No uploaded profile images found.</p>
        )}

        <button
          onClick={handleSave}
          disabled={saving || !selectedImage}
          className="bg-yellow-500 text-white px-6 py-2 rounded hover:bg-yellow-600"
        >
          {saving ? "Saving..." : "Save as Profile Photo"}
        </button>
      </div>
    </MainLayout>
  );
}