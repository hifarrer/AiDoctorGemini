"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";

interface UserProfileData {
  email: string;
  firstName?: string;
}

export function UserProfile() {
  const { data: session, update } = useSession();
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState<UserProfileData>({
    email: "",
    firstName: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (session?.user) {
      setProfileData({
        email: session.user.email || "",
        firstName: (session.user as any).firstName || "",
      });
    }
  }, [session]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        toast.success("Profile updated successfully!");
        // Update the session with new data
        await update({
          ...session,
          user: {
            ...session?.user,
            ...profileData,
          },
        });
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to update profile");
      }
    } catch (error) {
      toast.error("An error occurred while updating profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/user/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (response.ok) {
        toast.success("Password changed successfully!");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to change password");
      }
    } catch (error) {
      toast.error("An error occurred while changing password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <div style={{
      background: 'linear-gradient(180deg, #12182c, #0f1325)',
      border: '1px solid #1e2541',
      borderRadius: '20px',
      padding: '32px',
      height: 'fit-content'
    }}>
      <style jsx>{`
        .profile-tabs {
          display: flex;
          border-bottom: 1px solid #1e2541;
          margin-bottom: 24px;
        }
        .profile-tab {
          padding: 12px 16px;
          background: none;
          border: none;
          color: #9aa4b2;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          border-bottom: 2px solid transparent;
        }
        .profile-tab.active {
          color: #e7ecf5;
          border-bottom-color: #8856ff;
        }
        .profile-tab:hover:not(.active) {
          color: #b7c1d6;
        }
        .form-group {
          margin-bottom: 24px;
        }
        .form-label {
          display: block;
          color: #e7ecf5;
          font-weight: 600;
          margin-bottom: 8px;
          font-size: 14px;
        }
        .form-input {
          width: 100%;
          padding: 16px;
          background: #0e142c;
          border: 1px solid #2a3261;
          border-radius: 12px;
          color: #dfe6ff;
          font-size: 16px;
          transition: all 0.2s ease;
        }
        .form-input:focus {
          outline: none;
          border-color: #8856ff;
          box-shadow: 0 0 0 3px rgba(136, 86, 255, 0.1);
        }
        .form-input::placeholder {
          color: #8ca0c5;
        }
        .btn-group {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 32px;
        }
        .btn {
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s ease;
          border: none;
          cursor: pointer;
        }
        .btn.primary {
          background: linear-gradient(90deg, #8856ff, #a854ff);
          color: white;
        }
        .btn.primary:hover:not(:disabled) {
          background: linear-gradient(90deg, #7a4bff, #9a44ff);
        }
        .btn.secondary {
          background: #161a2c;
          color: #e8edfb;
          border: 1px solid #2a2f44;
        }
        .btn.secondary:hover {
          background: #1e2541;
          border-color: #3a4161;
        }
        .btn.danger {
          background: linear-gradient(90deg, #ff6b6b, #ff8e8e);
          color: white;
        }
        .btn.danger:hover {
          background: linear-gradient(90deg, #ff5252, #ff7676);
        }
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .section-title {
          font-size: 18px;
          font-weight: 700;
          color: #e7ecf5;
          margin-bottom: 16px;
        }
      `}</style>

      <div className="profile-tabs">
        <button
          onClick={() => setActiveTab("profile")}
          className={`profile-tab ${activeTab === "profile" ? "active" : ""}`}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveTab("password")}
          className={`profile-tab ${activeTab === "password" ? "active" : ""}`}
        >
          Password
        </button>
      </div>

      {activeTab === "profile" && (
        <form onSubmit={handleProfileUpdate}>
          <h2 className="section-title">Profile Information</h2>
          
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={profileData.email}
              onChange={(e) =>
                setProfileData({ ...profileData, email: e.target.value })
              }
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="firstName">First Name</label>
            <input
              id="firstName"
              type="text"
              className="form-input"
              value={profileData.firstName}
              onChange={(e) =>
                setProfileData({ ...profileData, firstName: e.target.value })
              }
            />
          </div>

          <div className="btn-group">
            <button
              type="button"
              className="btn danger"
              onClick={handleLogout}
            >
              Logout
            </button>
            <button type="submit" className="btn primary" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      )}

      {activeTab === "password" && (
        <form onSubmit={handlePasswordChange}>
          <h2 className="section-title">Change Password</h2>
          
          <div className="form-group">
            <label className="form-label" htmlFor="currentPassword">Current Password</label>
            <input
              id="currentPassword"
              type="password"
              className="form-input"
              value={passwordData.currentPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  currentPassword: e.target.value,
                })
              }
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              className="form-input"
              value={passwordData.newPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  newPassword: e.target.value,
                })
              }
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">Confirm New Password</label>
            <input
              id="confirmPassword"
              type="password"
              className="form-input"
              value={passwordData.confirmPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  confirmPassword: e.target.value,
                })
              }
              required
            />
          </div>

          <div className="btn-group">
            <button type="submit" className="btn primary" disabled={isLoading}>
              {isLoading ? "Changing..." : "Change Password"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
