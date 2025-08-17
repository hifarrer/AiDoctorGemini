import fs from 'fs';
import path from 'path';

export interface UsageRecord {
  id: string;
  userId: string;
  userEmail: string;
  date: string; // YYYY-MM-DD format
  interactions: number;
  prompts: number;
}

const USAGE_FILE_PATH = path.join(process.cwd(), 'data', 'usage.json');

function ensureDataDirectory() {
  const dataDir = path.dirname(USAGE_FILE_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function loadUsage(): UsageRecord[] {
  try {
    ensureDataDirectory();
    if (fs.existsSync(USAGE_FILE_PATH)) {
      const data = fs.readFileSync(USAGE_FILE_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading usage data:', error);
  }
  return [];
}

function saveUsage(usage: UsageRecord[]) {
  try {
    ensureDataDirectory();
    fs.writeFileSync(USAGE_FILE_PATH, JSON.stringify(usage, null, 2));
  } catch (error) {
    console.error('Error saving usage data:', error);
  }
}

let usageRecords: UsageRecord[] = loadUsage();

export function getUsageRecords(): UsageRecord[] {
  return usageRecords;
}

export function getUserUsage(userEmail: string, startDate?: string, endDate?: string): UsageRecord[] {
  let filtered = usageRecords.filter(record => record.userEmail === userEmail);
  
  if (startDate) {
    filtered = filtered.filter(record => record.date >= startDate);
  }
  
  if (endDate) {
    filtered = filtered.filter(record => record.date <= endDate);
  }
  
  return filtered;
}

export function recordInteraction(userId: string, userEmail: string, prompts: number = 1): void {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  // Find existing record for today
  const existingIndex = usageRecords.findIndex(
    record => record.userEmail === userEmail && record.date === today
  );
  
  if (existingIndex !== -1) {
    // Update existing record
    usageRecords[existingIndex].interactions += 1;
    usageRecords[existingIndex].prompts += prompts;
  } else {
    // Create new record
    const newRecord: UsageRecord = {
      id: Date.now().toString(),
      userId,
      userEmail,
      date: today,
      interactions: 1,
      prompts,
    };
    usageRecords.push(newRecord);
  }
  
  saveUsage(usageRecords);
}

export function getUsageStats(startDate?: string, endDate?: string) {
  let filtered = usageRecords;
  
  if (startDate) {
    filtered = filtered.filter(record => record.date >= startDate);
  }
  
  if (endDate) {
    filtered = filtered.filter(record => record.date <= endDate);
  }
  
  const totalInteractions = filtered.reduce((sum, record) => sum + record.interactions, 0);
  const totalPrompts = filtered.reduce((sum, record) => sum + record.prompts, 0);
  const uniqueUsers = new Set(filtered.map(record => record.userEmail)).size;
  
  // Group by date for chart data
  const dailyStats = filtered.reduce((acc, record) => {
    if (!acc[record.date]) {
      acc[record.date] = { interactions: 0, prompts: 0, users: new Set() };
    }
    acc[record.date].interactions += record.interactions;
    acc[record.date].prompts += record.prompts;
    acc[record.date].users.add(record.userEmail);
    return acc;
  }, {} as Record<string, { interactions: number; prompts: number; users: Set<string> }>);
  
  // Convert to chart-friendly format
  const chartData = Object.entries(dailyStats).map(([date, stats]) => ({
    date,
    interactions: stats.interactions,
    prompts: stats.prompts,
    uniqueUsers: stats.users.size,
  })).sort((a, b) => a.date.localeCompare(b.date));
  
  return {
    totalInteractions,
    totalPrompts,
    uniqueUsers,
    chartData,
  };
}
