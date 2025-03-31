
interface UsageSession {
  startTime: number;
  endTime: number | null;
  duration: number;
}

export interface DailyStats {
  date: string;
  totalDuration: number;
  sessions: UsageSession[];
}

export type StatsData = Record<string, DailyStats>;

const STATS_STORAGE_KEY = 'metronome-stats';

// Get today's date in YYYY-MM-DD format
export const getTodayDateString = (): string => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// Format milliseconds to readable time (HH:MM:SS)
export const formatDuration = (ms: number): string => {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

// Get all stored stats
export const getStoredStats = (): StatsData => {
  try {
    const storedStats = localStorage.getItem(STATS_STORAGE_KEY);
    return storedStats ? JSON.parse(storedStats) : {};
  } catch (error) {
    console.error('Error loading stats from localStorage:', error);
    return {};
  }
};

// Start a new usage session
export const startSession = (): void => {
  const today = getTodayDateString();
  const stats = getStoredStats();
  
  if (!stats[today]) {
    stats[today] = {
      date: today,
      totalDuration: 0,
      sessions: []
    };
  }
  
  // End any previous active session
  endCurrentSession();
  
  // Start new session
  stats[today].sessions.push({
    startTime: Date.now(),
    endTime: null,
    duration: 0
  });
  
  localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
};

// End the current session and update total duration
export const endCurrentSession = (): void => {
  const today = getTodayDateString();
  const stats = getStoredStats();
  
  if (stats[today] && stats[today].sessions.length > 0) {
    const sessions = stats[today].sessions;
    const currentSession = sessions[sessions.length - 1];
    
    if (currentSession && currentSession.endTime === null) {
      const now = Date.now();
      const sessionDuration = now - currentSession.startTime;
      
      currentSession.endTime = now;
      currentSession.duration = sessionDuration;
      
      // Update total duration
      stats[today].totalDuration += sessionDuration;
      
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
    }
  }
};

// Export stats data as a URL-safe string
export const exportStatsToUrl = (): string => {
  const stats = getStoredStats();
  const statsString = JSON.stringify(stats);
  const encodedStats = btoa(encodeURIComponent(statsString));
  return encodedStats;
};

// Import stats from a URL-safe string
export const importStatsFromString = (encodedStats: string): boolean => {
  try {
    const statsString = decodeURIComponent(atob(encodedStats));
    const stats = JSON.parse(statsString);
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
    return true;
  } catch (error) {
    console.error('Error importing stats:', error);
    return false;
  }
};

// Merge imported stats with existing stats
export const mergeStats = (encodedStats: string): boolean => {
  try {
    const statsString = decodeURIComponent(atob(encodedStats));
    const importedStats = JSON.parse(statsString) as StatsData;
    const currentStats = getStoredStats();
    
    // Merge imported stats with current stats
    const mergedStats: StatsData = { ...currentStats };
    
    for (const date in importedStats) {
      if (mergedStats[date]) {
        // Combine sessions for the same date
        mergedStats[date].sessions = [
          ...mergedStats[date].sessions,
          ...importedStats[date].sessions
        ];
        
        // Recalculate total duration
        mergedStats[date].totalDuration = mergedStats[date].sessions.reduce(
          (total, session) => total + session.duration, 
          0
        );
      } else {
        mergedStats[date] = importedStats[date];
      }
    }
    
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(mergedStats));
    return true;
  } catch (error) {
    console.error('Error merging stats:', error);
    return false;
  }
};
