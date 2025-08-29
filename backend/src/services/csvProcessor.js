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

      // Create processing log entry
      const logResult = await pool.query(
        'INSERT INTO csv_processing_logs (shuttle_id, file_path, status) VALUES ($1, $2, $3) RETURNING *',
        [shuttleId, filePath, 'processing']
      );
      
      logEntry = logResult.rows[0];

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

        // Insert new schedules
        const scheduleInserts = csvRows.map((row, index) => {
          return pool.query(
            `INSERT INTO shuttle_schedules 
             (shuttle_id, time_slot, route_description, sort_order, is_break, is_active, route_type, direction, departure_time) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              shuttleId,
              row.time_slot,
              row.route_description,
              row.sort_order,
              row.is_break,
              !row.is_break, // is_active is opposite of is_break
              this.determineRouteType(row.route_description),
              this.determineDirection(row.route_description),
              this.extractDepartureTime(row.time_slot)
            ]
          );
        });

        await Promise.all(scheduleInserts);

        // Update shuttle with CSV info
        await pool.query(
          `UPDATE shuttles 
           SET csv_file_path = $1, csv_uploaded_at = CURRENT_TIMESTAMP, csv_status = 'success' 
           WHERE id = $2`,
          [filePath, shuttleId]
        );

        // Update processing log with success
        await pool.query(
          `UPDATE csv_processing_logs 
           SET status = 'success', processed_records = $1, processed_at = CURRENT_TIMESTAMP 
           WHERE id = $2`,
          [csvRows.length, logEntry.id]
        );

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
      
      // Update processing log with error
      if (logEntry) {
        await pool.query(
          `UPDATE csv_processing_logs 
           SET status = 'error', error_message = $1, processed_at = CURRENT_TIMESTAMP 
           WHERE id = $2`,
          [error.message, logEntry.id]
        );

        // Update shuttle status
        await pool.query(
          `UPDATE shuttles SET csv_status = 'error' WHERE id = $1`,
          [shuttleId]
        );
      }

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