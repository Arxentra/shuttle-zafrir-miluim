import { pool } from '../db/connection.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class CSVProcessor {
  /**
   * Process CSV file and update shuttle schedules
   * @param {string} shuttleId - UUID of the shuttle
   * @param {string} filePath - Path to the uploaded CSV file
   * @returns {Object} Processing result
   */
  async processCSV(shuttleId, filePath) {
    let logEntry = null;
    
    try {
      console.log(`Processing CSV for shuttle ${shuttleId}, file: ${filePath}`);

      // Validate inputs
      if (!shuttleId || !filePath) {
        throw new Error('Missing shuttle_id or file_path');
      }

      // Log processing start
      console.log(`Starting CSV processing for shuttle ${shuttleId}`);

      // Read CSV file
      const fullPath = path.join(__dirname, '../../uploads', filePath);
      
      if (!fs.existsSync(fullPath)) {
        throw new Error(`CSV file not found: ${fullPath}`);
      }

      const csvText = fs.readFileSync(fullPath, 'utf-8');
      console.log('CSV file read successfully, size:', csvText.length);

      // Parse CSV data
      const csvRows = this.parseCSV(csvText);
      
      if (csvRows.length === 0) {
        throw new Error('No valid data found in CSV file');
      }

      console.log(`Parsed ${csvRows.length} valid rows from CSV`);

      // Database transaction to update schedules
      await pool.query('BEGIN');

      try {
        // Delete existing schedules for this shuttle
        await pool.query(
          'DELETE FROM shuttle_schedules WHERE shuttle_id = $1',
          [shuttleId]
        );

        // Insert new schedules - handle both old and new format
        const scheduleInserts = csvRows.map((row, index) => {
          // Check if this is the new Hebrew schedule format
          if (row.route_type && row.direction && row.departure_time) {
            return pool.query(
              `INSERT INTO shuttle_schedules 
               (shuttle_id, route_type, direction, departure_time, arrival_time, days_of_week, is_active) 
               VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [
                shuttleId,
                row.route_type,
                row.direction, 
                row.departure_time,
                row.arrival_time,
                [1,2,3,4,5], // Monday to Friday
                true
              ]
            );
          } else {
            // Legacy format
            return pool.query(
              `INSERT INTO shuttle_schedules 
               (shuttle_id, route_type, direction, departure_time, days_of_week, is_active) 
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [
                shuttleId,
                this.determineRouteType(row.route_description || row.time_slot),
                this.determineDirection(row.route_description || row.time_slot),
                this.extractDepartureTime(row.time_slot),
                [1,2,3,4,5], // Monday to Friday
                !row.is_break
              ]
            );
          }
        });

        await Promise.all(scheduleInserts);

        // Update shuttle status - only if the columns exist 
        try {
          await pool.query(
            `UPDATE shuttles 
             SET status = 'active', updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [shuttleId]
          );
        } catch (updateError) {
          console.warn('Could not update shuttle status:', updateError.message);
        }

        // Log success
        console.log(`Successfully processed ${csvRows.length} schedule entries`);

        await pool.query('COMMIT');

        console.log('CSV processing completed successfully');

        return {
          success: true,
          processed_records: csvRows.length,
          message: `Successfully processed ${csvRows.length} schedule entries`
        };

      } catch (dbError) {
        await pool.query('ROLLBACK');
        throw dbError;
      }

    } catch (error) {
      console.error('Error processing CSV:', error);
      throw error;
    }
  }

  /**
   * Parse CSV text into structured data
   * @param {string} csvText - Raw CSV content
   * @returns {Array} Parsed CSV rows
   */
  parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    console.log(`Processing ${lines.length} lines from CSV`);
    
    // Check if this is the Hebrew shuttle schedule format
    if (lines[0].includes('סבידור מרכז') && lines[0].includes('צפריר')) {
      return this.parseHebrewShuttleSchedule(csvText);
    }

    // Default parsing for other formats
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    console.log('CSV headers:', headers);

    const csvRows = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      
      if (values.length >= 2) {
        const row = {
          time_slot: values[0] || '',
          route_description: values[1] || '',
          sort_order: parseInt(values[2]) || i,
          is_break: (values[3] && values[3].toLowerCase()) === 'true' || false
        };
        
        if (row.time_slot) {
          csvRows.push(row);
        }
      }
    }

    return csvRows;
  }

  /**
   * Parse Hebrew shuttle schedule CSV format
   * @param {string} csvText - Raw CSV content 
   * @returns {Array} Parsed schedule entries
   */
  parseHebrewShuttleSchedule(csvText) {
    const lines = csvText.trim().split('\n');
    const scheduleEntries = [];
    
    console.log('Parsing Hebrew shuttle schedule...');
    
    // Parse each line and extract all time entries
    for (let i = 0; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      // Lines 4-12 contain Savidor <--> Tzafrir routes
      if (i >= 3 && i <= 11) {
        // Column 0: Departure from Savidor (outbound)
        if (values[0] && values[0].match(/^\d{1,2}:\d{2}$/)) {
          scheduleEntries.push({
            route_type: 'savidor_to_tzafrir',
            direction: 'outbound',
            departure_time: this.parseTimeToSQL(values[0]),
            arrival_time: values[2] && values[2].match(/^\d{1,2}:\d{2}$/) ? this.parseTimeToSQL(values[2]) : null,
            description: `יציאה מסבידור ${values[0]}`,
            sort_order: scheduleEntries.length + 1
          });
        }
        
        // Column 3: Departure from Tzafrir (return)
        if (values[3] && values[3].match(/^\d{1,2}:\d{2}$/)) {
          scheduleEntries.push({
            route_type: 'savidor_to_tzafrir',
            direction: 'return',
            departure_time: this.parseTimeToSQL(values[3]),
            arrival_time: values[4] && values[4].match(/^\d{1,2}:\d{2}$/) ? this.parseTimeToSQL(values[4]) : null,
            description: `יציאה מצפריר ${values[3]}`,
            sort_order: scheduleEntries.length + 1
          });
        }
      }
      
      // Lines 16+ contain Kiryat Aryeh <--> Tzafrir routes
      if (i >= 15) {
        // Skip header and break lines
        if (values[0] && (
            values[0].includes('קרית אריה') || 
            values[0].includes('יציאה') ||
            values[0].includes('כללי') ||
            values[0].includes('אין נסיעות') ||
            values[0].includes('אופציה') ||
            values[0].includes('הזמנות') ||
            values[0].includes('שאטל') ||
            values[0].includes('הפסקה')
        )) {
          continue;
        }
        
        // Column 0: Departure from Kiryat Aryeh (outbound)
        if (values[0] && values[0].match(/^\d{1,2}:\d{2}$/)) {
          scheduleEntries.push({
            route_type: 'kiryat_aryeh_to_tzafrir',
            direction: 'outbound',
            departure_time: this.parseTimeToSQL(values[0]),
            arrival_time: null,
            description: `יציאה מקרית אריה ${values[0]}`,
            sort_order: scheduleEntries.length + 1
          });
        }
        
        // Column 1: Departure from Tzafrir (return)
        if (values[1] && values[1].match(/^\d{1,2}:\d{2}$/)) {
          scheduleEntries.push({
            route_type: 'kiryat_aryeh_to_tzafrir',
            direction: 'return',
            departure_time: this.parseTimeToSQL(values[1]),
            arrival_time: null,
            description: `יציאה מצפריר ${values[1]}`,
            sort_order: scheduleEntries.length + 1
          });
        }
        
        // Check columns 7 and 8 for additional times in later sections
        if (values[7] && values[7].match(/^\d{1,2}:\d{2}$/)) {
          scheduleEntries.push({
            route_type: 'kiryat_aryeh_to_tzafrir',
            direction: 'return', 
            departure_time: this.parseTimeToSQL(values[7]),
            arrival_time: null,
            description: `יציאה מצפריר ${values[7]}`,
            sort_order: scheduleEntries.length + 1
          });
        }
      }
    }
    
    // Remove duplicates
    const uniqueEntries = scheduleEntries.filter((entry, index, self) => 
      index === self.findIndex(e => 
        e.route_type === entry.route_type && 
        e.direction === entry.direction && 
        e.departure_time === entry.departure_time
      )
    );
    
    console.log(`Parsed ${uniqueEntries.length} unique schedule entries from Hebrew CSV`);
    return uniqueEntries;
  }

  /**
   * Parse time string to SQL TIME format
   * @param {string} timeStr - Time string like "7:00" or "19:30"
   * @returns {string} Time in HH:MM:SS format
   */
  parseTimeToSQL(timeStr) {
    if (!timeStr || !timeStr.includes(':')) {
      return '08:00:00'; // Default fallback
    }
    
    const [hours, minutes] = timeStr.split(':');
    const paddedHours = hours.padStart(2, '0');
    const paddedMinutes = (minutes || '00').padStart(2, '0');
    
    return `${paddedHours}:${paddedMinutes}:00`;
  }

  /**
   * Determine route type from description
   * @param {string} description - Route description
   * @returns {string} Route type
   */
  determineRouteType(description) {
    if (description.includes('קרית אריה') || description.includes('kiryat')) {
      return 'kiryat_aryeh_to_tzafrir';
    }
    return 'savidor_to_tzafrir';
  }

  /**
   * Determine direction from description
   * @param {string} description - Route description
   * @returns {string} Direction
   */
  determineDirection(description) {
    if (description.includes('לסבידור') || 
        description.includes('לקרית') || 
        description.includes('ממחנה') ||
        description.toLowerCase().includes('return')) {
      return 'return';
    }
    return 'outbound';
  }

  /**
   * Extract departure time from time slot
   * @param {string} timeSlot - Time slot like "7:00-8:00"
   * @returns {string} Departure time in HH:MM:SS format
   */
  extractDepartureTime(timeSlot) {
    const timePart = timeSlot.split('-')[0].trim();
    // Ensure it has seconds
    return timePart.includes(':') && timePart.split(':').length === 2 
      ? `${timePart}:00` 
      : '08:00:00';
  }

  /**
   * Get processing logs for a shuttle
   * @param {string} shuttleId - UUID of the shuttle
   * @returns {Array} Processing logs
   */
  async getProcessingLogs(shuttleId) {
    const result = await pool.query(
      `SELECT * FROM csv_processing_logs 
       WHERE shuttle_id = $1 
       ORDER BY processed_at DESC`,
      [shuttleId]
    );
    
    return result.rows;
  }

  /**
   * Delete uploaded file
   * @param {string} filePath - Path to file
   */
  deleteFile(filePath) {
    try {
      const fullPath = path.join(__dirname, '../../uploads', filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log(`Deleted file: ${fullPath}`);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }
}