import { parse, format } from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';

import { Highlight, EmailFrequency, EmailSettings, RandomHighlightReturn } from '@/types/highlight';
import { supabase } from '@/integrations/supabase/client';

// Get next scheduled date based on frequency
export const getNextScheduledDate = (settings: EmailSettings): Date | null => {
  if (!settings.enabled || !settings.email) {
    return null;
  }
  
  const now = new Date();
  const pacificTimezone = 'America/Los_Angeles';
  const nowInPacificTime = utcToZonedTime(now, pacificTimezone);
  const lastSent = settings.lastSent ? utcToZonedTime(settings.lastSent, pacificTimezone) : nowInPacificTime;
  
  const nextDate = new Date(lastSent);
  
  switch (settings.frequency) {
    case "daily":
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case "weekly":
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case "biweekly":
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case "monthly":
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
  }
  
  // If a delivery time is specified, set the hours and minutes
  if (settings.deliveryTime) {
    const [hours, minutes] = settings.deliveryTime.split(':').map(Number);
    nextDate.setHours(hours, minutes, 0, 0);
  }
  
  // Convert back to UTC for storage and function calls
  const nextDateInUtc = zonedTimeToUtc(nextDate, pacificTimezone);
  
  return nextDateInUtc;
};

// Local storage keys
const HIGHLIGHTS_STORAGE_KEY = 'sparkler_highlights';
const EMAIL_SETTINGS_STORAGE_KEY = 'sparkler_email_settings';

// Helper to generate unique IDs
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Load highlights from local storage
export const loadHighlights = async (): Promise<Highlight[]> => {
  try {
    const storedHighlights = localStorage.getItem(HIGHLIGHTS_STORAGE_KEY);
    if (!storedHighlights) return [];
    
    const parsedHighlights = JSON.parse(storedHighlights);
    
    // Ensure dates are properly parsed
    return parsedHighlights.map((highlight: any) => ({
      ...highlight,
      dateAdded: new Date(highlight.dateAdded)
    }));
  } catch (error) {
    console.error('Error loading highlights:', error);
    return [];
  }
};

// Save a new highlight
export const addHighlight = async (highlightData: Omit<Highlight, 'id' | 'dateAdded'>): Promise<Highlight> => {
  try {
    const highlights = await loadHighlights();
    
    const newHighlight: Highlight = {
      id: generateId(),
      dateAdded: new Date(),
      ...highlightData
    };
    
    const updatedHighlights = [...highlights, newHighlight];
    localStorage.setItem(HIGHLIGHTS_STORAGE_KEY, JSON.stringify(updatedHighlights));
    
    return newHighlight;
  } catch (error) {
    console.error('Error adding highlight:', error);
    throw new Error('Failed to add highlight');
  }
};

// Update an existing highlight
export const updateHighlight = async (highlight: Highlight): Promise<Highlight> => {
  try {
    const highlights = await loadHighlights();
    const index = highlights.findIndex(h => h.id === highlight.id);
    
    if (index === -1) {
      throw new Error('Highlight not found');
    }
    
    highlights[index] = highlight;
    localStorage.setItem(HIGHLIGHTS_STORAGE_KEY, JSON.stringify(highlights));
    
    return highlight;
  } catch (error) {
    console.error('Error updating highlight:', error);
    throw new Error('Failed to update highlight');
  }
};

// Delete a highlight
export const deleteHighlight = async (id: string): Promise<boolean> => {
  try {
    const highlights = await loadHighlights();
    const updatedHighlights = highlights.filter(h => h.id !== id);
    
    localStorage.setItem(HIGHLIGHTS_STORAGE_KEY, JSON.stringify(updatedHighlights));
    return true;
  } catch (error) {
    console.error('Error deleting highlight:', error);
    return false;
  }
};

// Delete all highlights with a specific source
export const deleteHighlightsBySource = async (source: string): Promise<boolean> => {
  try {
    const highlights = await loadHighlights();
    const updatedHighlights = highlights.filter(h => h.source !== source);
    
    localStorage.setItem(HIGHLIGHTS_STORAGE_KEY, JSON.stringify(updatedHighlights));
    return true;
  } catch (error) {
    console.error('Error deleting highlights by source:', error);
    return false;
  }
};

// Get all unique sources
export const getAllSources = async (): Promise<string[]> => {
  try {
    const highlights = await loadHighlights();
    return [...new Set(highlights.map(h => h.source).filter(Boolean))];
  } catch (error) {
    console.error('Error getting sources:', error);
    return [];
  }
};

// Toggle favorite status
export const toggleFavorite = async (id: string): Promise<boolean> => {
  try {
    const highlights = await loadHighlights();
    const index = highlights.findIndex(h => h.id === id);
    
    if (index === -1) {
      return false;
    }
    
    highlights[index].favorite = !highlights[index].favorite;
    localStorage.setItem(HIGHLIGHTS_STORAGE_KEY, JSON.stringify(highlights));
    
    return true;
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return false;
  }
};

// Get a random highlight
export const getRandomHighlight = async (count: number = 1): Promise<RandomHighlightReturn> => {
  try {
    const highlights = await loadHighlights();
    
    if (highlights.length === 0) {
      return null;
    }
    
    if (count === 1) {
      const randomIndex = Math.floor(Math.random() * highlights.length);
      return highlights[randomIndex];
    } else {
      // Get multiple random highlights
      const selectedHighlights: Highlight[] = [];
      const maxCount = Math.min(count, highlights.length);
      
      // Create a copy of the highlights array to avoid modifying the original
      const availableHighlights = [...highlights];
      
      for (let i = 0; i < maxCount; i++) {
        // Get a random index from the remaining highlights
        const randomIndex = Math.floor(Math.random() * availableHighlights.length);
        // Add the highlight to the selected array
        selectedHighlights.push(availableHighlights[randomIndex]);
        // Remove the selected highlight from the available array
        availableHighlights.splice(randomIndex, 1);
      }
      
      return selectedHighlights;
    }
  } catch (error) {
    console.error('Error getting random highlight:', error);
    return null;
  }
};

// Load email settings
export const loadEmailSettings = async (): Promise<EmailSettings> => {
  try {
    const storedSettings = localStorage.getItem(EMAIL_SETTINGS_STORAGE_KEY);
    const defaultSettings: EmailSettings = {
      email: '',
      frequency: 'daily',
      enabled: false,
      deliveryTime: '09:00',
    };
    
    if (!storedSettings) {
      return defaultSettings;
    }
    
    const parsedSettings = JSON.parse(storedSettings);
    
    // Ensure dates are properly parsed
    if (parsedSettings.lastSent) {
      parsedSettings.lastSent = new Date(parsedSettings.lastSent);
    }
    
    // Update the settings with the current date if the scheduled date is in the past
    const settings = {
      ...defaultSettings,
      ...parsedSettings
    };
    
    // Check if the next scheduled date is in the past
    const nextScheduledDate = getNextScheduledDate(settings);
    const now = new Date();
    
    if (nextScheduledDate && nextScheduledDate < now && settings.enabled) {
      console.log('Next scheduled date is in the past, updating last sent date');
      settings.lastSent = now; // Update the last sent date to today
      await saveEmailSettings(settings); // Save the updated settings
    }
    
    return settings;
  } catch (error) {
    console.error('Error loading email settings:', error);
    return {
      email: '',
      frequency: 'daily',
      enabled: false,
      deliveryTime: '09:00',
    };
  }
};

// Save email settings
export const saveEmailSettings = async (settings: EmailSettings): Promise<boolean> => {
  try {
    localStorage.setItem(EMAIL_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('Error saving email settings:', error);
    return false;
  }
};

// Check if email needs to be sent now
export const checkAndSendScheduledEmail = async (): Promise<boolean> => {
  try {
    const settings = await loadEmailSettings();
    
    if (!settings.enabled || !settings.email) {
      return false;
    }
    
    const nextScheduledDate = getNextScheduledDate(settings);
    const now = new Date();
    
    // If the next scheduled date is in the past, send the email
    if (nextScheduledDate && nextScheduledDate <= now) {
      console.log('Scheduled time has passed, sending email now');
      const sent = await sendHighlightByEmail(settings.email, settings.highlightCount || 1);
      
      if (sent) {
        // Update the last sent date to now
        settings.lastSent = now;
        await saveEmailSettings(settings);
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking and sending scheduled email:', error);
    return false;
  }
};

// Send a highlight by email using Supabase edge function
export const sendHighlightByEmail = async (email: string, highlightCount: number = 1): Promise<boolean> => {
  try {
    console.log(`Sending ${highlightCount} highlight(s) to: ${email}`);
    
    // Get random highlights based on the count
    const highlights = await getRandomHighlight(highlightCount);
    if (!highlights) {
      console.error('No highlights available to send');
      return false;
    }
    
    console.log('Selected highlights for email:', highlights);
    
    // Get the current delivery time setting
    const settings = await loadEmailSettings();
    
    // Call the Supabase edge function to send the email
    const { data, error } = await supabase.functions.invoke('send-highlight', {
      body: {
        email: email,
        highlight: highlights,
        deliveryTime: settings.deliveryTime,
        count: highlightCount,
        currentDate: new Date().toISOString() // Include current date for debugging
      }
    });
    
    if (error) {
      console.error('Error invoking send-highlight function:', error);
      return false;
    }
    
    console.log('Email function response:', data);
    
    // Update last sent time in settings
    settings.lastSent = new Date();
    await saveEmailSettings(settings);
    
    return true;
  } catch (error) {
    console.error('Error sending highlight by email:', error);
    return false;
  }
};

// Trigger the scheduled email manually (for testing)
export const triggerScheduledEmail = async (email: string): Promise<boolean> => {
  try {
    console.log(`Triggering scheduled email for: ${email}`);
    
    const { data, error } = await supabase.functions.invoke('scheduled-highlight', {
      body: {
        activeEmail: email,
        currentDate: new Date().toISOString() // Include current date for debugging
      }
    });
    
    if (error) {
      console.error('Error invoking scheduled-highlight function:', error);
      return false;
    }
    
    console.log('Scheduled email function response:', data);
    
    if (!data || data.error) {
      console.error('Error in scheduled-highlight function response:', data?.error || 'Unknown error');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error triggering scheduled email:', error);
    return false;
  }
};
