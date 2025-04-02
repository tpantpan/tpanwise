import { Highlight, EmailSettings, EmailFrequency } from '@/types/highlight';
import { supabase } from '@/integrations/supabase/client';

// Local storage keys (for fallback)
const HIGHLIGHTS_KEY = 'sparkler_highlights';
const EMAIL_SETTINGS_KEY = 'sparkler_email_settings';

// Initial sample data
const initialHighlights: Highlight[] = [
  {
    id: '1',
    text: "The person who reads too much and uses their brain too little will fall into lazy habits of thinking.",
    source: "Thinking, Fast and Slow",
    author: "Daniel Kahneman",
    category: "Psychology",
    dateAdded: new Date(2023, 5, 12),
    favorite: true
  },
  {
    id: '2',
    text: "Be fearful when others are greedy and greedy when others are fearful.",
    source: "Letter to Shareholders",
    author: "Warren Buffett",
    category: "Finance",
    dateAdded: new Date(2023, 7, 25),
    favorite: false
  },
  {
    id: '3',
    text: "It's not that I'm so smart, it's just that I stay with problems longer.",
    source: "Einstein: His Life and Universe",
    author: "Albert Einstein",
    category: "Science",
    dateAdded: new Date(2023, 8, 5),
    favorite: true
  }
];

// Load highlights from Supabase or fall back to local storage
export const loadHighlights = async (): Promise<Highlight[]> => {
  try {
    // Attempt to fetch from Supabase
    const { data, error } = await supabase
      .from('highlights')
      .select('*')
      .order('date_added', { ascending: false });
    
    if (error) {
      console.error('Error fetching highlights from Supabase:', error);
      // Fall back to local storage
      return loadHighlightsFromLocalStorage();
    }
    
    if (data && data.length > 0) {
      return data.map((highlight) => ({
        id: highlight.id,
        text: highlight.text,
        source: highlight.source,
        author: highlight.author,
        category: highlight.category,
        dateAdded: new Date(highlight.date_added),
        favorite: highlight.favorite ?? false
      }));
    }
    
    // If no data in Supabase, initialize with sample data
    const initialData = loadHighlightsFromLocalStorage();
    for (const highlight of initialData) {
      await addHighlight({
        text: highlight.text,
        source: highlight.source,
        author: highlight.author,
        category: highlight.category,
        favorite: highlight.favorite
      });
    }
    
    return initialData;
  } catch (error) {
    console.error('Failed to load highlights:', error);
    return loadHighlightsFromLocalStorage();
  }
};

// Fallback: Load highlights from local storage
const loadHighlightsFromLocalStorage = (): Highlight[] => {
  const stored = localStorage.getItem(HIGHLIGHTS_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    return parsed.map((highlight: any) => ({
      ...highlight,
      dateAdded: new Date(highlight.dateAdded)
    }));
  }
  
  // Use initial data if nothing is stored
  localStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify(initialHighlights));
  return initialHighlights;
};

// Save highlights to both Supabase and local storage
export const saveHighlights = async (highlights: Highlight[]): Promise<void> => {
  localStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify(highlights));
  // Note: We don't bulk save to Supabase, as individual operations handle that
};

// Add a new highlight
export const addHighlight = async (highlight: Omit<Highlight, 'id' | 'dateAdded'>): Promise<Highlight | null> => {
  try {
    const newHighlight = {
      text: highlight.text,
      source: highlight.source || null,
      author: highlight.author || null,
      category: highlight.category || null,
      favorite: highlight.favorite || false,
    };
    
    const { data, error } = await supabase
      .from('highlights')
      .insert(newHighlight)
      .select()
      .single();
    
    if (error) {
      console.error('Error adding highlight to Supabase:', error);
      // Fall back to local storage
      const highlights = loadHighlightsFromLocalStorage();
      const localHighlight: Highlight = {
        ...highlight,
        id: Date.now().toString(),
        dateAdded: new Date(),
      };
      
      saveHighlights([localHighlight, ...highlights]);
      return localHighlight;
    }
    
    if (data) {
      return {
        id: data.id,
        text: data.text,
        source: data.source,
        author: data.author,
        category: data.category,
        dateAdded: new Date(data.date_added),
        favorite: data.favorite
      };
    }
    
    return null;
  } catch (error) {
    console.error('Failed to add highlight:', error);
    return null;
  }
};

// Update a highlight
export const updateHighlight = async (highlight: Highlight): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('highlights')
      .update({
        text: highlight.text,
        source: highlight.source,
        author: highlight.author,
        category: highlight.category,
        favorite: highlight.favorite,
      })
      .eq('id', highlight.id);
    
    if (error) {
      console.error('Error updating highlight in Supabase:', error);
      // Fall back to local storage
      const highlights = loadHighlightsFromLocalStorage();
      const index = highlights.findIndex(h => h.id === highlight.id);
      
      if (index !== -1) {
        highlights[index] = highlight;
        saveHighlights(highlights);
      }
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to update highlight:', error);
    return false;
  }
};

// Delete a highlight
export const deleteHighlight = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('highlights')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting highlight from Supabase:', error);
      // Fall back to local storage
      const highlights = loadHighlightsFromLocalStorage();
      saveHighlights(highlights.filter(h => h.id !== id));
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to delete highlight:', error);
    return false;
  }
};

// Toggle favorite status
export const toggleFavorite = async (id: string): Promise<boolean> => {
  try {
    // First get the current highlight
    const { data: highlight, error: fetchError } = await supabase
      .from('highlights')
      .select('favorite')
      .eq('id', id)
      .single();
    
    if (fetchError || !highlight) {
      console.error('Error fetching highlight from Supabase:', fetchError);
      // Fall back to local storage
      const highlights = loadHighlightsFromLocalStorage();
      const highlight = highlights.find(h => h.id === id);
      
      if (highlight) {
        highlight.favorite = !highlight.favorite;
        saveHighlights(highlights);
      }
      return false;
    }
    
    // Toggle the favorite status
    const { error: updateError } = await supabase
      .from('highlights')
      .update({ favorite: !highlight.favorite })
      .eq('id', id);
    
    if (updateError) {
      console.error('Error updating highlight in Supabase:', updateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to toggle favorite:', error);
    return false;
  }
};

// Get a random highlight
export const getRandomHighlight = async (): Promise<Highlight | null> => {
  try {
    const { data, error } = await supabase
      .from('highlights')
      .select('*');
    
    if (error || !data || data.length === 0) {
      console.error('Error fetching highlights from Supabase:', error);
      // Fall back to local storage
      const highlights = loadHighlightsFromLocalStorage();
      if (highlights.length === 0) return null;
      
      const randomIndex = Math.floor(Math.random() * highlights.length);
      return highlights[randomIndex];
    }
    
    const randomIndex = Math.floor(Math.random() * data.length);
    const highlight = data[randomIndex];
    
    return {
      id: highlight.id,
      text: highlight.text,
      source: highlight.source,
      author: highlight.author,
      category: highlight.category,
      dateAdded: new Date(highlight.date_added),
      favorite: highlight.favorite
    };
  } catch (error) {
    console.error('Failed to get random highlight:', error);
    return null;
  }
};

// Email settings functions
export const getDefaultEmailSettings = (): EmailSettings => {
  return {
    email: '',
    frequency: 'daily',
    enabled: false,
    deliveryTime: '09:00' // Default to 9 AM
  };
};

export const loadEmailSettings = async (): Promise<EmailSettings> => {
  try {
    const { data, error } = await supabase
      .from('email_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error || !data || data.length === 0) {
      console.error('Error fetching email settings from Supabase:', error);
      // Fall back to local storage
      return loadEmailSettingsFromLocalStorage();
    }
    
    const settings = data[0];
    
    return {
      email: settings.email,
      frequency: settings.frequency as EmailFrequency,
      enabled: settings.enabled,
      lastSent: settings.last_sent ? new Date(settings.last_sent) : undefined,
      deliveryTime: settings.delivery_time || '09:00'
    };
  } catch (error) {
    console.error('Failed to load email settings:', error);
    return loadEmailSettingsFromLocalStorage();
  }
};

// Fallback: Load email settings from local storage
const loadEmailSettingsFromLocalStorage = (): EmailSettings => {
  const stored = localStorage.getItem(EMAIL_SETTINGS_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    return {
      ...parsed,
      lastSent: parsed.lastSent ? new Date(parsed.lastSent) : undefined
    };
  }
  return getDefaultEmailSettings();
};

export const saveEmailSettings = async (settings: EmailSettings): Promise<boolean> => {
  try {
    // Store in local storage as backup
    localStorage.setItem(EMAIL_SETTINGS_KEY, JSON.stringify(settings));
    
    // Calculate next scheduled date
    const nextScheduled = getNextScheduledDate(settings);
    
    // First check if we have an existing record
    const { data: existingData, error: fetchError } = await supabase
      .from('email_settings')
      .select('id')
      .limit(1);
    
    if (fetchError) {
      console.error('Error checking email settings in Supabase:', fetchError);
      return false;
    }
    
    if (existingData && existingData.length > 0) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('email_settings')
        .update({
          email: settings.email,
          frequency: settings.frequency,
          enabled: settings.enabled,
          last_sent: settings.lastSent ? settings.lastSent.toISOString() : null,
          next_scheduled: nextScheduled ? nextScheduled.toISOString() : null,
          delivery_time: settings.deliveryTime || '09:00',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingData[0].id);
      
      if (updateError) {
        console.error('Error updating email settings in Supabase:', updateError);
        return false;
      }
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from('email_settings')
        .insert({
          email: settings.email,
          frequency: settings.frequency,
          enabled: settings.enabled,
          last_sent: settings.lastSent ? settings.lastSent.toISOString() : null,
          next_scheduled: nextScheduled ? nextScheduled.toISOString() : null,
          delivery_time: settings.deliveryTime || '09:00'
        });
      
      if (insertError) {
        console.error('Error inserting email settings in Supabase:', insertError);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Failed to save email settings:', error);
    return false;
  }
};

// Function to send a highlight by email
export const sendHighlightByEmail = async (email?: string): Promise<boolean> => {
  try {
    const settings = await loadEmailSettings();
    
    // Use provided email or fall back to saved settings
    const recipientEmail = email || settings.email;
    
    if (!recipientEmail) {
      console.error('No email address provided');
      return false;
    }
    
    const highlight = await getRandomHighlight();
    if (!highlight) {
      console.error('No highlights available to send');
      return false;
    }
    
    console.log('Sending email to:', recipientEmail);
    console.log('Sending highlight:', highlight);
    
    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('send-highlight', {
      body: {
        email: recipientEmail,
        highlight: {
          text: highlight.text,
          author: highlight.author,
          source: highlight.source,
          category: highlight.category
        },
        deliveryTime: settings.deliveryTime
      }
    });
    
    if (error) {
      console.error('Error sending email:', error);
      return false;
    }
    
    console.log('Email function response:', data);
    
    // Update last sent date
    settings.lastSent = new Date();
    await saveEmailSettings(settings);
    
    return true;
  } catch (error) {
    console.error('Failed to send highlight by email:', error);
    return false;
  }
};

// Get next scheduled date based on frequency
export const getNextScheduledDate = (settings: EmailSettings): Date | null => {
  if (!settings.enabled || !settings.email) {
    return null;
  }
  
  const now = new Date();
  const lastSent = settings.lastSent || now;
  const nextDate = new Date(lastSent);
  
  switch (settings.frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'biweekly':
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
  }
  
  // If a delivery time is specified, set the hours and minutes
  if (settings.deliveryTime) {
    const [hours, minutes] = settings.deliveryTime.split(':').map(Number);
    if (!isNaN(hours) && !isNaN(minutes)) {
      nextDate.setHours(hours, minutes, 0, 0);
    }
  }
  
  return nextDate;
};
