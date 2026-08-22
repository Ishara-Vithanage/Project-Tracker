'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';
import { useUser } from '@/app/context/userProvider';
import { getUsers, addUser, updateUser } from '@/services/systemUsers';
import { getUserDetails } from '@/services/auth';
import { useToast } from '@/components/toast/page';
import AlertBox from '@/components/alert-box/page';
import auditLog from "@/services/audit_log";
import getSriLankaTimeISO from "@/services/getSLTime";

interface User {
  userID: string;
  name: string;
  email: string;
  department: string;
  role: string;
  status: string;
  lastLogin: Date | string;
}

export default function ManageUser() {
  const [users, setUsers] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newUser, setNewUser] = useState<User>({
    userID: '',
    name: '',
    email: '',
    department: '',
    role: '',
    status: 'Active',
    lastLogin: new Date().toISOString(),
  });
  const [userExists, setUserExists] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [deUser, setDelUser] = useState('');
  const [error, setError] = useState('');
  const { user } = useUser();
  const { showToast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const handleInputChange = (e: any, isNew = false) => {
    const { name, value } = e.target;
    if (isNew) {
      setNewUser(prev => ({ ...prev, [name]: value }));
    } else {
      setEditingUser((prev: User) => ({ ...prev, [name]: value }));
    }
  };

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return styles.statusActive;
      case 'blocked':
        return styles.statusBlocked;
      default:
        return '';
    }
  };

  const handleSearchUser = async () => {
    try {
      const result = await getUserDetails(newUser.userID);
      if (result) {
        setNewUser(prev => ({
          ...prev,
          name: result.username,
          department: result.department,
          email: result.workEmail,
          lastLogin: new Date().toISOString(),
          status: 'Active'
        }));
        setUserExists(true);
        setError('');
      } else {
        setUserExists(false);
        setError('User not found.');
      }
    } catch (err) {
      console.error(err);
        setUserExists(false);
        setError('User not found.');
    }
  };

  const handleAddUser = async () => {
    try {
      await addUser(newUser);
      showToast('User added successfully', 'success');
      fetchUsers();
      setNewUser({
        userID: '',
        name: '',
        email: '',
        department: '',
        role: '',
        status: 'Active',
        lastLogin: getSriLankaTimeISO(),
      });
      setUserExists(false);
      
      // Audit log entry
      const auditEntry = {
        user: user.userID,
        action: "New User added",
        keyValue: newUser.userID,
        tableName: "MANAGE_USERS",
        updateField: "",
        newValue: "",
        oldValue: "",
        LMD: getSriLankaTimeISO(),
      };
      await auditLog(auditEntry);

    } catch (err) {
      console.error('Failed to add user:', err);
    }
  };

  const handleEditClick = (user: any) => {
    setEditingUser({ ...user });
  };

  const handleSaveEdit = async () => {
    try {
      console.log('Saving edited user:', editingUser);
      await updateUser(editingUser.userID, editingUser);
      showToast('User updated successfully', 'success');
      fetchUsers();
      setEditingUser(null);

      // Audit log entry
      const auditEntry = {
        user: user.userID,
        action: "User updated",
        keyValue: editingUser.userID,
        tableName: "MANAGE_USERS",
        updateField: "",
        newValue: "",
        oldValue: "",
        LMD: getSriLankaTimeISO(),
      };
      await auditLog(auditEntry);

    } catch (err) {
      console.error('Failed to update user:', err);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>MANAGE USERS</h1>

      <h2 className={styles.subHeading}>USER LIST</h2>

      <div className={styles.searchSection}>
        <input
          type="text"
          placeholder="Search by name or userID..."
          className={styles.searchBar}
          onChange={(e) => {
            const query = e.target.value.toLowerCase();
            setSearchAttempted(true);
            const filtered = users.filter(
              (u) =>
                u.name.toLowerCase().includes(query) ||
                u.userID.toLowerCase().includes(query)
            );
            setFilteredUsers(filtered);
          }}
        />
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>NAME</th>
              <th>UserID</th>
              <th>DEPARTMENT</th>
              <th>ROLE</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {searchAttempted
              ? filteredUsers.length > 0
                ? filteredUsers.map(u => (
                  <tr key={u.userID}>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{u.name.toUpperCase()}</td>
                    <td style={{ color: '#475569' }}>{u.userID}</td>
                    <td>{u.department}</td>
                    <td>{u.role}</td>
                    <td>
                      <div className={`${styles.statusLabel} ${getStatusClass(u.status)}`}>
                        {u.status.toUpperCase()}
                      </div>
                    </td>
                    <td className={styles.actionBtnList}>
                      <button className={styles.actionBtn} onClick={() => handleEditClick(u)}>EDIT {'>>'}</button>
                    </td>
                  </tr>
                ))
                : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'gray', padding: '1rem' }}>
                      No user found.
                    </td>
                  </tr>
                )
              : users.map(u => (
                <tr key={u.userID}>
                  <td style={{ fontWeight: 600, color: '#0f172a' }}>{u.name.toUpperCase()}</td>
                  <td style={{ color: '#475569' }}>{u.userID}</td>
                  <td>{u.department}</td>
                  <td>{u.role}</td>
                  <td>
                    <div className={`${styles.statusLabel} ${getStatusClass(u.status)}`}>
                      {u.status.toUpperCase()}
                    </div>
                  </td>
                  <td className={styles.actionBtnList}>
                    <button className={styles.actionBtn} onClick={() => handleEditClick(u)}>EDIT {'>>'}</button>
                  </td>
                </tr>
              )
              )}
          </tbody>
        </table>
      </div>

      {editingUser && (
        <div className={styles.editForm}>
          <h3>EDIT USER</h3>
          <input
            name="name"
            value={editingUser.name}
            onChange={handleInputChange}
            className={styles.input}
          />
          <select
            name="role"
            value={editingUser.role}
            onChange={handleInputChange}
            className={styles.input}
          >
            <option value="HEAD">HEAD</option>
            <option value="DEV">DEV</option>
            <option value="MGR">MGR</option>
          </select>

          <label>
            STATUS:
            <select
              name="status"
              value={editingUser.status}
              onChange={handleInputChange}
              className={styles.input}
            >
              <option value="Active">Active</option>
              <option value="Blocked">Block</option>
            </select>
          </label>
          <button onClick={handleSaveEdit}>SAVE</button>
        </div>
      )}

      <h2 className={styles.subHeading}>ADD USER</h2>
      <div className={styles.editForm}>
        <input
          name="userID"
          value={newUser.userID}
          placeholder="Enter User ID"
          onChange={(e) => handleInputChange(e, true)}
          className={styles.input}
        />
        <div className={styles.btnSection}>
          <button onClick={handleSearchUser} >SEARCH</button>
        </div>
        <input
          name="name"
          value={newUser.name}
          placeholder="Full Name"
          className={styles.input}
          disabled
        />
        <input
          name="email"
          value={newUser.email ?? ''}
          placeholder="Work Email"
          className={styles.input}
          disabled
        />
        <input
          name="department"
          value={newUser.department ?? ''}
          placeholder="Department"
          className={styles.input}
          disabled
        />
        <select
          name="role"
          value={newUser.role}
          onChange={(e) => handleInputChange(e, true)}
          className={styles.input}
        >
          <option value="">Select Role</option>
          <option value="MGR">Manager (MGR)</option>
          <option value="DEV">Developer (DEV)</option>
          <option value="HEAD">Head (HEAD)</option>
        </select>

        {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}
        <div className={styles.btnSection}>
          <button
            onClick={handleAddUser}
            disabled={!userExists || !newUser.role}
          >
            ADD USER
          </button>
        </div>
      </div>
      <AlertBox
        show={showAlert}
        param={`want to delete ${deUser}`}
        onConfirm={() => {
          setShowAlert(false);
        }}
        onCancel={() => setShowAlert(false)}
      />
    </div>
  );
}
