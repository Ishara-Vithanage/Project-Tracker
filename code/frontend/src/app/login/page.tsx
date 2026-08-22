"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./page.module.css";
import "@/app/globals.css";
import { useRouter } from "next/navigation";
import { loginUser } from "@/services/auth";
import { getUsers } from "@/services/systemUsers";
import { useUser } from "@/app/context/userProvider";
import { useToast } from "../../components/toast/page";
import logo from "/public/mainScreenLogo.png";
import auditLog from "@/services/audit_log";
import { updateUser } from "@/services/systemUsers";
import getSriLankaTimeISO from "@/services/getSLTime";

export default function Login() {
  const [userID, setUserID] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { setUsername } = useUser();
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
      const users = await getUsers();
      const foundUser = users.find((user: any) => user.userID === userID);

      if (!foundUser) {
        setError("User not found.");
        setLoading(false);
        return;
      }

      if (foundUser.status === "Blocked") {
        setError("User blocked.");
        setLoading(false);
        return;
      }

      function cleanName(name: string): string {
        return name.replace(/\s*\([^)]*\)\s*/g, "").trim();
      }

      const cleanedUser = {
        ...foundUser,
        name: cleanName(foundUser.name),
      };

      setUsername(cleanedUser.userID);
      sessionStorage.setItem("userData", JSON.stringify(cleanedUser));

      const success = await loginUser({ userID, password });

      if (success) {
        showToast("Login successful", "success");

        const updatedUser = {
          ...cleanedUser,
          lastLogin: getSriLankaTimeISO(),
        };

        await updateUser(updatedUser.userID, updatedUser);
        setUsername(updatedUser.userID);
        sessionStorage.setItem("userData", JSON.stringify(updatedUser));

        const auditEntry = {
          user: updatedUser.userID,
          action: "Login",
          keyValue: updatedUser.name,
          tableName: "USER_LOG",
          updateField: "",
          newValue: "",
          oldValue: "",
          LMD: getSriLankaTimeISO(),
        };

        await auditLog(auditEntry);

        // Push to home after all is done
        router.push("/main/home");
      } else {
        setError("Invalid credentials.");
        setLoading(false);
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Login failed. Try again.");
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
          <p className={styles.footer}>Copyright @ Seylan ITC-SE 2025</p>
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