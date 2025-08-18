import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  password: string;
  plan?: string;
  isActive?: boolean;
  createdAt?: string;
  stripeCustomerId?: string;
  subscriptionId?: string;
  subscriptionStatus?: string;
}

// Path to the JSON file for persistent storage
const USERS_FILE_PATH = path.join(process.cwd(), 'data', 'users.json');

// Ensure the data directory exists
function ensureDataDirectory() {
  const dataDir = path.dirname(USERS_FILE_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Load users from JSON file
function loadUsers(): User[] {
  try {
    ensureDataDirectory();
    if (fs.existsSync(USERS_FILE_PATH)) {
      const data = fs.readFileSync(USERS_FILE_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading users:', error);
  }
  
  // Return default users if file doesn't exist or is corrupted
  return [
    {
      id: "1",
      email: "test@example.com",
      password: "password", // In a real app, this should be a hashed password
      firstName: "Test",
      plan: "Free",
      isActive: true,
      createdAt: "2024-01-01",
    },
    {
      id: "2",
      email: "admin@ai-doctor.info",
      password: "admin123", // In a real app, this should be a hashed password
      firstName: "Admin",
      plan: "Premium",
      isActive: true,
      createdAt: "2024-01-01",
    },
  ];
}

// Save users to JSON file
function saveUsers(users: User[]) {
  try {
    ensureDataDirectory();
    fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error saving users:', error);
  }
}

// Initialize users array
let users: User[] = loadUsers();

// Export functions to manage users
export function getUsers(): User[] {
  return users;
}

export function addUser(user: User) {
  users.push(user);
  saveUsers(users);
}

export function updateUser(email: string, updates: Partial<User>) {
  const userIndex = users.findIndex(u => u.email === email);
  if (userIndex !== -1) {
    users[userIndex] = { ...users[userIndex], ...updates };
    saveUsers(users);
    return users[userIndex];
  }
  return null;
}

export function deleteUser(email: string) {
  const userIndex = users.findIndex(u => u.email === email);
  if (userIndex !== -1) {
    users.splice(userIndex, 1);
    saveUsers(users);
    return true;
  }
  return false;
}

export function findUserByEmail(email: string): User | undefined {
  return users.find(u => u.email === email);
}

export function findUserById(id: string): User | undefined {
  return users.find(u => u.id === id);
}

// Export the users array for backward compatibility
export { users };
