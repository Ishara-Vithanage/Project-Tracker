"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./page.module.css";
import "@/app/globals.css";
import { useRouter } from "next/navigation";
import { loginUser } from "@/services/auth";
import { useUser } from "@/app/context/userProvider";
import { useToast } from "../../components/toast/page";
import logo from "/public/mainScreenLogo.png";

export default function Login() {
  const [userID, setUserID] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { setUsername, setUser } = useUser();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);


  const validateInputs = () => {
    if (!userID.trim() || !password.trim()) {
      setError("Both username and password are required.");
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    setError("");
    if (!validateInputs()) return;

    setLoading(true); // Start loading
    try {
      const response = await loginUser({ userId: userID, password });
      const authenticatedUser = response.data.user;
      const user = {
        ...authenticatedUser,
        userID: authenticatedUser.userId,
      };

      setUser(user);
      setUsername(user.userID);
      sessionStorage.setItem("userData", JSON.stringify(user));
      showToast(response.data.message, "success");
      router.push("/main/home");
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className={styles.mainContainer}>
      <div className={styles.login_container}>
        {/* Top section */}
        <div className={styles.top_section}>
          <Image
            src={logo}
            alt="Seylan Logo"
            width={200}
            height={100}
            className={styles.logo}
          />
        </div>

        {/* Middle section */}
        <form
          className={styles.middle_section}
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
        >
          {/* Get userID */}
          <label className={styles.label}>USERNAME</label>
          <input
            id="userID"
            type="text"
            value={userID}
            onChange={(e) => setUserID(e.target.value)}
            className={styles.input_field}
          />
          {/* Get password */}
          <label className={styles.label}>PASSWORD</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input_field}
          />

          {error && <p className={styles.error_message}>{error}</p>}

          <div className={styles.btSection}>
            <button type="submit" className={styles.submit_button}>
              LOGIN
            </button>
          </div>
        </form>

        {/* Bottom section */}
        <div className={styles.bottom_section}>
          <p className={styles.footer}>Copyright @ ARAHSI 2026</p>
        </div>
      </div>
      {/* Loading overlay */}
      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>Logging in...</p>
        </div>
      )}
    </div>
  );
}