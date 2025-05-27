import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "../../firebase"; // ← two dots if firebase is in /src

export default function Profile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    nickname: "",
    dob: "",
    gender: "",
    origin: "",
    email: "",
    phone: "",
    emergencyName: "",
    emergencyPhone: "",
    emergencyRelation: "",
    profileIntro: "",
    profileImage: ""
  });

  // ----------- TYPING ADDED -----------
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchProfile = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      setProfile((prev) => ({
        ...prev,
        ...docSnap.data(),
        email: user.email || ""
      }));
    } else {
      setProfile((prev) => ({
        ...prev,
        email: user.email || ""
      }));
    }
    setLoading(false);
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchProfile();
      } else {
        setLoading(false);
        router.push("/login"); // optional: redirect unauthenticated users
      }
    });
    return () => unsubscribe();
  }, [router]);

  // ----------- TYPING ADDED -----------
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  // ----------- TYPING ADDED -----------
  const handlePhotoUpload = async (file: File) => {
    if (!file || !auth.currentUser) return;
    const fileRef = ref(storage, `profiles/${auth.currentUser.uid}.jpg`);
    await uploadBytes(fileRef, file);
    const photoURL = await getDownloadURL(fileRef);
    setProfile((prev) => ({ ...prev, profileImage: photoURL }));
  };

  const saveProfile = async () => {
    const user = auth.currentUser;
    if (!user) return;
    await setDoc(doc(db, "users", user.uid), profile, { merge: true });
    alert("Profile updated.");
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>

      <label className="block mb-2 font-medium">Profile Photo</label>
      {profile.profileImage && (
        <img
          src={profile.profileImage}
          alt="Profile"
          className="w-32 h-32 rounded-full object-cover mb-2"
        />
      )}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handlePhotoUpload(e.target.files[0]);
          }
        }}
        className="mb-4"
      />

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block font-medium">Nickname / Username</label>
          <input
            type="text"
            name="nickname"
            value={profile.nickname}
            onChange={handleChange}
            className="w-full border p-2 rounded mb-4"
          />

          <label className="block font-medium">Date of Birth</label>
          <input
            type="date"
            name="dob"
            value={profile.dob}
            onChange={handleChange}
            className="w-full border p-2 rounded mb-4"
          />

          <label className="block font-medium">Gender</label>
          <select
            name="gender"
            value={profile.gender}
            onChange={handleChange}
            className="w-full border p-2 rounded mb-4"
          >
            <option value="">Select...</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>

          <label className="block font-medium">City / Country of Origin</label>
          <input
            type="text"
            name="origin"
            value={profile.origin}
            onChange={handleChange}
            className="w-full border p-2 rounded mb-4"
          />
        </div>

        <div>
          <label className="block font-medium">Email</label>
          <input
            type="email"
            name="email"
            value={profile.email}
            disabled
            className="w-full border p-2 rounded mb-4 bg-gray-100"
          />

          <label className="block font-medium">Contact Number</label>
          <input
            type="text"
            name="phone"
            value={profile.phone}
            onChange={handleChange}
            className="w-full border p-2 rounded mb-4"
          />

          <label className="block font-medium">Emergency Contact Name</label>
          <input
            type="text"
            name="emergencyName"
            value={profile.emergencyName}
            onChange={handleChange}
            className="w-full border p-2 rounded mb-4"
          />

          <label className="block font-medium">Emergency Contact Number</label>
          <input
            type="text"
            name="emergencyPhone"
            value={profile.emergencyPhone}
            onChange={handleChange}
            className="w-full border p-2 rounded mb-4"
          />

          <label className="block font-medium">Relationship</label>
          <input
            type="text"
            name="emergencyRelation"
            value={profile.emergencyRelation}
            onChange={handleChange}
            className="w-full border p-2 rounded mb-4"
          />
        </div>
      </div>

      <label className="block font-medium">What do you enjoy when you travel?</label>
      <textarea
        rows={4}
        name="profileIntro"
        value={profile.profileIntro}
        onChange={handleChange}
        className="w-full border p-3 rounded mb-4"
        placeholder="e.g. I enjoy hiking, coffee shops, beaches and cultural experiences."
      />

      <button
        onClick={saveProfile}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
      >
        Save Profile
      </button>
    </div>
  );
}
