import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";

const MainPage = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        navigate("/");
      } else {
        setUser(currentUser);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <main className="w-full h-screen flex flex-col justify-center items-center bg-gray-50 text-gray-800">
      <div className="w-96 bg-white shadow-2xl rounded-2xl p-6 border border-gray-200 space-y-6 text-center">
        <h1 className="text-3xl font-bold text-green-700">Welcome to Timely ⏰</h1>

        {user ? (
          <>
            <p className="text-lg text-gray-700">
              You are logged in as{" "}
              <span className="font-semibold text-green-600">{user.email}</span>
            </p>
            <p className="text-gray-500">
              Manage your time efficiently and stay productive!
            </p>

            <button
              onClick={handleLogout}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-xl font-medium transition-all duration-300"
            >
              Log Out
            </button>
          </>
        ) : (
          <p className="text-gray-500">Loading user information...</p>
        )}
      </div>
    </main>
  );
};

export default MainPage;
