import { calendarService } from './calendarService';

export interface SeedCalendarEvent {
  date: string;
  month: string;
  year: number;
  title: string;
  type: 'Fast' | 'Festival';
}

// Initial calendar events data
export const initialCalendarEvents: SeedCalendarEvent[] = [
  { date: "15", month: "DEC", year: 2025, title: "Ekadashi", type: "Fast" },
  { date: "17", month: "DEC", year: 2025, title: "Pradosha Puja", type: "Festival" },
  { date: "19", month: "DEC", year: 2025, title: "Amavasya", type: "Festival" },
  { date: "30", month: "DEC", year: 2025, title: "Ekadashi", type: "Fast" },
  { date: "31", month: "DEC", year: 2025, title: "82nd Anniversary of Pratistha Mahotsava of Sri Vishwanatha Mandir at Sivananda Ashram", type: "Festival" },
  { date: "1", month: "JAN", year: 2026, title: "Pradosha Puja", type: "Festival" },
  { date: "2", month: "JAN", year: 2026, title: "Purnima", type: "Festival" },
  { date: "3", month: "JAN", year: 2026, title: "Purnima", type: "Festival" },
  { date: "7", month: "JAN", year: 2026, title: "26th Anniversary of Punyatithi Aradhana of H. H. Sri Swami Devanandaji Maharaj", type: "Festival" },
  { date: "14", month: "JAN", year: 2026, title: "Ekadashi; Makar Sankranti (Uttarayana Punyakala 09.38 p.m.)", type: "Fast" },
  { date: "16", month: "JAN", year: 2026, title: "Pradosha Puja", type: "Festival" },
  { date: "18", month: "JAN", year: 2026, title: "Mouni Amavasya", type: "Festival" },
  { date: "23", month: "JAN", year: 2026, title: "Vasanta Panchami", type: "Festival" },
  { date: "25", month: "JAN", year: 2026, title: "Ratha Saptami", type: "Festival" },
  { date: "26", month: "JAN", year: 2026, title: "Republic Day; Bhishma Ashtami", type: "Festival" },
  { date: "29", month: "JAN", year: 2026, title: "Ekadashi", type: "Fast" },
  { date: "30", month: "JAN", year: 2026, title: "Pradosha Puja", type: "Festival" },
  { date: "1", month: "FEB", year: 2026, title: "Purnima", type: "Festival" },
  { date: "4", month: "FEB", year: 2026, title: "24th Anniversary of Punyatithi Aradhana of H. H. Sri Swami Dayanandaji Maharaj", type: "Festival" },
  { date: "5", month: "FEB", year: 2026, title: "22nd Anniversary of Punyatithi Aradhana of H. H. Sri Swami Premanandaji Maharaj", type: "Festival" },
  { date: "13", month: "FEB", year: 2026, title: "Ekadashi", type: "Fast" },
  { date: "14", month: "FEB", year: 2026, title: "Pradosha Puja", type: "Festival" },
  { date: "15", month: "FEB", year: 2026, title: "Sri Mahasivaratri", type: "Festival" },
  { date: "17", month: "FEB", year: 2026, title: "Amavasya", type: "Festival" },
  { date: "27", month: "FEB", year: 2026, title: "Ekadashi", type: "Fast" },
  { date: "1", month: "MAR", year: 2026, title: "Pradosha Puja", type: "Festival" },
  { date: "3", month: "MAR", year: 2026, title: "Purnima; Sri Chaitanya Mahaprabhu Jayanti; Lunar Eclipse (6.02 p.m. – 6.47 p.m.); 21st Anniversary of Punyatithi Aradhana of H. H. Sri Swami Madhavanandaji Maharaj", type: "Festival" },
  { date: "4", month: "MAR", year: 2026, title: "Holi", type: "Festival" },
  { date: "15", month: "MAR", year: 2026, title: "Ekadashi", type: "Fast" },
  { date: "16", month: "MAR", year: 2026, title: "Pradosha Puja", type: "Festival" },
  { date: "19", month: "MAR", year: 2026, title: "Amavasya", type: "Festival" },
];

/**
 * Helper function to convert month abbreviation to month number
 */
function monthAbbrToNumber(monthAbbr: string): number {
  const months: { [key: string]: number } = {
    'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MAY': 4, 'JUN': 5,
    'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11
  };
  return months[monthAbbr.toUpperCase()] ?? 0;
}

/**
 * Convert seed event format to full date string (YYYY-MM-DD) for sorting
 */
export function formatDateForStorage(date: string, month: string, year: number): string {
  const monthNum = monthAbbrToNumber(month);
  const day = parseInt(date, 10);
  const dateObj = new Date(year, monthNum, day);
  return dateObj.toISOString().split('T')[0];
}

/**
 * Seed initial calendar events to Firebase
 */
export async function seedCalendarEvents(): Promise<{ success: boolean; message: string; count: number }> {
  try {
    // Check if events already exist with new format (have month and year)
    const existingEvents = await calendarService.getEvents({ limit: 1000 });
    
    // Filter events that have the new format (month and year)
    const existingNewFormatEvents = existingEvents.success && existingEvents.data 
      ? existingEvents.data.filter(e => e.month && e.year && e.type)
      : [];

    if (existingNewFormatEvents.length > 0) {
      // Check if all initial events already exist
      const existingTitles = new Set(existingNewFormatEvents.map(e => e.title?.toLowerCase().trim()));
      const initialTitles = new Set(initialCalendarEvents.map(e => e.title.toLowerCase().trim()));
      
      const missingEvents = initialCalendarEvents.filter(
        e => !existingTitles.has(e.title.toLowerCase().trim())
      );

      if (missingEvents.length === 0) {
        return {
          success: false,
          message: 'All initial calendar events already exist. If you want to add them again, please delete existing events first.',
          count: 0
        };
      }
    }

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    // Add all events (skip if duplicate title exists)
    for (const event of initialCalendarEvents) {
      // Check if event with same title already exists
      const existingWithSameTitle = existingEvents.success && existingEvents.data
        ? existingEvents.data.find(
            e => e.title?.toLowerCase().trim() === event.title.toLowerCase().trim() &&
                 e.month === event.month &&
                 e.year === event.year &&
                 e.date === event.date
          )
        : null;

      if (existingWithSameTitle) {
        skippedCount++;
        continue;
      }
      
      const result = await calendarService.createEvent({
        title: event.title,
        description: event.title, // Use title as description for now
        date: event.date,
        month: event.month,
        year: event.year,
        type: event.type,
        // Set default values for legacy fields (optional)
        status: 'scheduled',
        priority: event.type === 'Fast' ? 'medium' : 'high',
        category: 'event'
      });

      if (result.success) {
        successCount++;
      } else {
        errorCount++;
        console.error(`Failed to create event ${event.title}:`, result.error);
      }
    }

    let message = `Added ${successCount} events`;
    if (skippedCount > 0) message += `, ${skippedCount} already existed`;
    if (errorCount > 0) message += `, ${errorCount} failed`;

    return {
      success: successCount > 0 || skippedCount > 0,
      message: message + '.',
      count: successCount
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Error seeding events: ${error.message}`,
      count: 0
    };
  }
}

