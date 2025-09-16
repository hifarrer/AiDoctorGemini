// Admin system for Health Consultant AI app
import { getUsers, deleteUser as deleteUserFromDB } from "./server/users";
import { getSettings } from "./server/settings";

// Admin configuration - in production, this should be in a secure database
export const adminConfig = {
  username: "admin",
  password: "p@ssword333", // In production, this should be hashed
  email: "admin@medicalai.com", // Default admin email
  siteSettings: {
    siteName: "Health Consultant AI",
    contactEmail: "contact@medicalai.com",
    supportEmail: "support@medicalai.com",
    maxUsersPerDay: 1000,
    maintenanceMode: false,
  }
};

// Usage tracking - in production, this should be in a database
export const usageStats = {
  totalChats: 0,
  totalUsers: 0,
  totalImages: 0,
  totalPDFs: 0,
  dailyStats: {} as Record<string, {
    chats: number;
    users: Set<string>;
    images: number;
    pdfs: number;
  }>,
  monthlyStats: {} as Record<string, {
    chats: number;
    users: Set<string>;
    images: number;
    pdfs: number;
  }>
};

// Admin utility functions
export function validateAdmin(username: string, password: string): boolean {
  return username === adminConfig.username && password === adminConfig.password;
}

export function updateAdminPassword(newPassword: string): boolean {
  try {
    adminConfig.password = newPassword;
    return true;
  } catch (error) {
    return false;
  }
}

export function updateSiteSettings(settings: Partial<typeof adminConfig.siteSettings>): boolean {
  try {
    Object.assign(adminConfig.siteSettings, settings);
    return true;
  } catch (error) {
    return false;
  }
}

export function trackUsage(type: 'chat' | 'image' | 'pdf', userId?: string) {
  const today = new Date().toISOString().split('T')[0];
  const month = today.substring(0, 7);

  // Initialize daily stats if not exists
  if (!usageStats.dailyStats[today]) {
    usageStats.dailyStats[today] = {
      chats: 0,
      users: new Set(),
      images: 0,
      pdfs: 0
    };
  }

  // Initialize monthly stats if not exists
  if (!usageStats.monthlyStats[month]) {
    usageStats.monthlyStats[month] = {
      chats: 0,
      users: new Set(),
      images: 0,
      pdfs: 0
    };
  }

  // Update total stats
  if (type === 'chat') {
    usageStats.totalChats++;
    usageStats.dailyStats[today].chats++;
    usageStats.monthlyStats[month].chats++;
  } else if (type === 'image') {
    usageStats.totalImages++;
    usageStats.dailyStats[today].images++;
    usageStats.monthlyStats[month].images++;
  } else if (type === 'pdf') {
    usageStats.totalPDFs++;
    usageStats.dailyStats[today].pdfs++;
    usageStats.monthlyStats[month].pdfs++;
  }

  if (userId) {
    usageStats.dailyStats[today].users.add(userId);
    usageStats.monthlyStats[month].users.add(userId);
  }
}

export async function getUsageStats() {
  console.log("📊 [ADMIN_STATS] Getting usage stats...");
  try {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = today.substring(0, 7);
    
    // Get users from database
    const users = await getUsers();
    console.log("👥 [ADMIN_STATS] Found users:", users.length);

    return {
      total: {
        chats: usageStats.totalChats,
        users: users.length,
        images: usageStats.totalImages,
        pdfs: usageStats.totalPDFs
      },
      today: {
        chats: usageStats.dailyStats[today]?.chats || 0,
        users: usageStats.dailyStats[today]?.users.size || 0,
        images: usageStats.dailyStats[today]?.images || 0,
        pdfs: usageStats.dailyStats[today]?.pdfs || 0
      },
      thisMonth: {
        chats: usageStats.monthlyStats[thisMonth]?.chats || 0,
        users: usageStats.monthlyStats[thisMonth]?.users.size || 0,
        images: usageStats.monthlyStats[thisMonth]?.images || 0,
        pdfs: usageStats.monthlyStats[thisMonth]?.pdfs || 0
      },
      dailyHistory: Object.entries(usageStats.dailyStats)
        .slice(-30)
        .map(([date, stats]) => ({
          date,
          chats: stats.chats,
          users: stats.users.size,
          images: stats.images,
          pdfs: stats.pdfs
        }))
    };
  } catch (error) {
    console.error("❌ [ADMIN_STATS] Error getting usage stats:", error);
    // Return fallback data
    return {
      total: { chats: 0, users: 0, images: 0, pdfs: 0 },
      today: { chats: 0, users: 0, images: 0, pdfs: 0 },
      thisMonth: { chats: 0, users: 0, images: 0, pdfs: 0 },
      dailyHistory: []
    };
  }
}

export async function getAllUsers() {
  try {
    const users = await getUsers();
    return users.map(user => ({
      id: user.id,
      email: user.email,
      createdAt: user.createdAt || new Date().toISOString(),
    }));
  } catch (error) {
    console.error("❌ [ADMIN_USERS] Error getting all users:", error);
    return [];
  }
}

export async function deleteUser(userId: string): Promise<boolean> {
  try {
    // Find the user by ID first to get their email
    const users = await getUsers();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      console.log("❌ [ADMIN_DELETE_USER] User not found:", userId);
      return false;
    }
    
    // Delete the user using their email
    const deleted = await deleteUserFromDB(user.email);
    console.log("✅ [ADMIN_DELETE_USER] User deleted successfully:", user.email);
    return deleted;
  } catch (error) {
    console.error("❌ [ADMIN_DELETE_USER] Error deleting user:", error);
    return false;
  }
}