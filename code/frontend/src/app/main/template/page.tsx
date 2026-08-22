'use client';

import React, { useEffect, useState } from "react";
import styles from "./page.module.css";
import Link from 'next/link';
import Image from "next/image";
import leftPanelLogo from "/public/mainScreenLogo.png";
import userImg from "/public/user.png";
import logoutIcon from "/public/logout.png";
import { usePathname } from 'next/navigation';
import { useUser } from "@/app/context/userProvider";
import AlertBox from "@/components/alert-box/page";
import { useRouter } from "next/navigation";
import auditLog from "@/services/audit_log";
import getSriLankaTimeISO from "@/services/getSLTime";

export default function MainScreen({ children, }: Readonly<{ children: React.ReactNode; }>) {

    const { user } = useUser();
    const [loading, setLoading] = useState(true);
    const [showAlert, setShowAlert] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!user?.userID) return;
        setLoading(true);
        console.log("Last login time:", user?.lastLogin);
    }, [user]);
    const pathname = usePathname();

    const handleLogout = async () => {
        sessionStorage.clear();

        const auditEntry = {
            user: user.userID,
            action: "Logout",
            keyValue: user.name,
            tableName: "USER_LOG",
            updateField: "",
            newValue: "",
            oldValue: "",
            LMD: getSriLankaTimeISO(),
        };

        // Log audit entry before redirecting
        try {
            await auditLog(auditEntry);
        } catch (error) {
            console.error("Failed to log audit entry:", error);
        }

        // Redirect to login after audit
        router.push('/login');
    };

    // Format last login date
    const lastLogin = user?.lastLogin ? new Date(user.lastLogin) : null;
    const formattedLogin = lastLogin
        ? `${lastLogin.getFullYear()}-${String(lastLogin.getMonth() + 1).padStart(2, '0')}-${String(lastLogin.getDate()).padStart(2, '0')} ${String(lastLogin.getHours()).padStart(2, '0')}:${String(lastLogin.getMinutes()).padStart(2, '0')}`
        : 'N/A';


    return (
        <div className={styles.main_container}>
            {/*Left Navigation Bar*/}
            <div className={styles.left_panel}>
                {/*Left top section*/}
                <div className={styles.left_top_section}>
                    <Image src={leftPanelLogo} alt="Seylan Logo"
                        width={200}
                        height={100} className={styles.logo} />
                </div>

                {/*Left middle section*/}
                <div className={styles.left_middle_section}>
                    <ul className={styles.navList}>
                        <Link href="/main/home">
                            <li className={`${styles.navLine} ${pathname === '/main/home/' ? styles.active : ''}`}>
                                HOME
                            </li>
                        </Link>

                        {user?.role !== 'DEV' && (
                            <Link href="/main/create-project">
                                <li className={`${styles.navLine} ${pathname === '/main/create-project/' ? styles.active : ''}`}>
                                    CREATE NEW
                                </li>
                            </Link>
                        )}
                        <Link href="/main/view-project">
                            <li className={`${styles.navLine} ${pathname === '/main/view-project/' ? styles.active : ''}`}>
                                VIEW PROJECTS
                            </li>
                        </Link>
                        {user?.role === 'HEAD' && (
                            <Link href="/main/manage-users">
                                <li className={`${styles.navLine} ${pathname === '/main/manage-users/' ? styles.active : ''}`}>
                                    MANAGE USERS
                                </li>
                            </Link>
                        )}
                        <>
                            {user?.role === 'HEAD' && (
                                <Link href="/main/inquiry">
                                    <li className={`${styles.navLine} ${pathname === '/main/inquiry/' ? styles.active : ''}`}>
                                        INQUIRY
                                    </li>
                                </Link>
                            )}
                            <li
                                className={`${styles.navLineLogout} ${showAlert ? styles.active : ''}`}
                                onClick={() => setShowAlert(true)}
                            >
                                <Image src={logoutIcon} alt="Logout Icon" className={styles.logoutIcon} />
                                LOG OUT
                            </li>

                            {showAlert && (
                                <AlertBox
                                    show={showAlert}
                                    param="want to log out"
                                    onConfirm={handleLogout}
                                    onCancel={() => setShowAlert(false)}
                                />
                            )}
                        </>
                    </ul>
                </div>

                {/*Left bottom section*/}
                <div className={styles.left_bottom_section}>
                    <Image src={userImg} alt="Seylan Logo" className={styles.userImg} />
                    <ul className={styles.userInfo}>
                        <li className={styles.userName}>{user?.name.toUpperCase()}</li>
                        <li className={styles.lastLogin}>LAST LOGIN</li>
                        <li className={styles.loginTime}>{formattedLogin}</li>
                    </ul>
                </div>
            </div>

            {/*Right Panel*/}
            <div className={styles.right_panel}>
                {/*Top content box*/}
                <div className={styles.content_box}>
                    {children}
                </div>

                {/*Footer section*/}
                <div className={styles.footer_section}>
                    <p>Copyright @ Seylan ITC-SE 2025</p>
                </div>
            </div>
        </div>
    );
}