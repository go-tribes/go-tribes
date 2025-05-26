import { useState } from "react";
import { useRouter } from "next/router";
import { auth, db, storage } from "@/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import MainLayout from "@/components/MainLayout";

export default function Register() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [origin, setOrigin] = useState("");
  const [gender, setGender] = useState("");
  const [intro, setIntro] = useState("");
  const [profileImages, setProfileImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (password !== confirmPassword) return alert("Passwords do not match");
    if (!fullName || !email || !password) return alert("Please fill in all required fields");

    setLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;
      const profileImageUrls: string[] = [];

      for (const file of profileImages) {
        const imgRef = ref(storage, `users/${uid}/profile_${Date.now()}_${file.name}`);
        await uploadBytes(imgRef, file);
        const url = await getDownloadURL(imgRef);
        profileImageUrls.push(url);
      }

      const defaultPhoto = profileImageUrls[0] || "";

      await updateProfile(userCred.user, {
        displayName: fullName,
        photoURL: defaultPhoto,
      });

      await setDoc(doc(db, "users", uid), {
        fullName,
        email,
        nickname,
        origin,
        gender,
        profileIntro: intro,
        profileImages: profileImageUrls,
        profileImage: defaultPhoto,
        createdAt: new Date(),
        friends: [],
        tags: [],
      });

      router.push("/home");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-lg mx-auto p-6 bg-white shadow-md rounded-xl space-y-4">
        <h1 className="text-2xl font-bold mb-2">Register</h1>

        <input type="text" placeholder="Full Name*" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full p-2 border rounded" />
        <input type="email" placeholder="Email*" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 border rounded" />
        <input type="password" placeholder="Password*" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 border rounded" />
        <input type="password" placeholder="Confirm Password*" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full p-2 border rounded" />

        <input type="text" placeholder="Nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} className="w-full p-2 border rounded" />
        <input type="text" placeholder="Origin (e.g., Kuala Lumpur)" value={origin} onChange={(e) => setOrigin(e.target.value)} className="w-full p-2 border rounded" />
        <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full p-2 border rounded">
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
        <textarea placeholder="Your Travel Intro..." value={intro} onChange={(e) => setIntro(e.target.value)} className="w-full p-2 border rounded" rows={3} />

        <input type="file" accept="image/*" multiple onChange={(e) => setProfileImages(Array.from(e.target.files || []))} className="w-full" />

        <button onClick={handleRegister} disabled={loading} className="bg-yellow-500 text-white w-full py-2 rounded hover:bg-yellow-600">
          {loading ? "Registering..." : "Register"}
        </button>
      </div>
    </MainLayout>
  );
}
