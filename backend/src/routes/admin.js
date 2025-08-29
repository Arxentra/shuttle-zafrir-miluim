import express from 'express';
import multer from 'multer';
import { parse } from 'csv-parse';
import { pool } from '../db/connection.js';
import jwt from 'jsonwebtoken';
import fs from 'fs';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Middleware to verify admin token
const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    if (decoded.role !== 'admin' && decoded.role !== 'super_admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Get dashboard statistics
router.get('/dashboard', verifyAdmin, async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM companies) as total_companies,
        (SELECT COUNT(*) FROM shuttles WHERE status = 'active') as active_shuttles,
        (SELECT COUNT(*) FROM shuttle_schedules WHERE is_active = true) as active_schedules,
        (SELECT COUNT(*) FROM shuttle_registrations WHERE status = 'confirmed' AND registration_date >= CURRENT_DATE) as upcoming_registrations
    `);
    
    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// CSV upload for bulk schedule creation
router.post('/upload-schedules', verifyAdmin, upload.single('file'), async (req, res) => {
  const file = req.file;
  
  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  try {
    const schedules = [];
    
    // Parse CSV file
    const parser = fs.createReadStream(file.path)
      .pipe(parse({
        columns: true,
        skip_empty_lines: true
      }));
    
    for await (const row of parser) {
      schedules.push({
        shuttle_id: row.shuttle_id,
        route_type: row.route_type,
        direction: row.direction,
        departure_time: row.departure_time,
        arrival_time: row.arrival_time,
        days_of_week: row.days_of_week ? row.days_of_week.split(',').map(Number) : [1,2,3,4,5]
      });
    }
    
    // Bulk insert schedules
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      for (const schedule of schedules) {
        await client.query(
          `INSERT INTO shuttle_schedules 
           (shuttle_id, route_type, direction, departure_time, arrival_time, days_of_week)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            schedule.shuttle_id,
            schedule.route_type,
            schedule.direction,
            schedule.departure_time,
            schedule.arrival_time,
            schedule.days_of_week
          ]
        );
      }
      
      await client.query('COMMIT');
      res.json({ message: `Successfully imported ${schedules.length} schedules` });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error processing CSV:', error);
    res.status(500).json({ error: 'Failed to process CSV file' });
  } finally {
    // Clean up uploaded file
    fs.unlinkSync(file.path);
  }
});

// Bulk update schedules
router.put('/bulk-update-schedules', verifyAdmin, async (req, res) => {
  try {
    const { schedule_ids, updates } = req.body;
    
    if (!schedule_ids || !Array.isArray(schedule_ids) || schedule_ids.length === 0) {
      return res.status(400).json({ error: 'Invalid schedule IDs' });
    }
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      for (const id of schedule_ids) {
        await client.query(
          `UPDATE shuttle_schedules 
           SET departure_time = COALESCE($1, departure_time),
               arrival_time = COALESCE($2, arrival_time),
               is_active = COALESCE($3, is_active)
           WHERE id = $4`,
          [updates.departure_time, updates.arrival_time, updates.is_active, id]
        );
      }
      
      await client.query('COMMIT');
      res.json({ message: `Successfully updated ${schedule_ids.length} schedules` });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error bulk updating schedules:', error);
    res.status(500).json({ error: 'Failed to update schedules' });
  }
});

// Export registrations to CSV
router.get('/export-registrations', verifyAdmin, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let query = `
      SELECT 
        sr.passenger_name,
        sr.passenger_phone,
        sr.passenger_email,
        sr.registration_date,
        ss.departure_time,
        ss.route_type,
        ss.direction,
        s.name as shuttle_name,
        c.name as company_name
      FROM shuttle_registrations sr
      JOIN shuttle_schedules ss ON sr.schedule_id = ss.id
      JOIN shuttles s ON ss.shuttle_id = s.id
      JOIN companies c ON s.company_id = c.id
      WHERE sr.status = 'confirmed'
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (start_date) {
      paramCount++;
      query += ` AND sr.registration_date >= $${paramCount}`;
      params.push(start_date);
    }
    
    if (end_date) {
      paramCount++;
      query += ` AND sr.registration_date <= $${paramCount}`;
      params.push(end_date);
    }
    
    query += ' ORDER BY sr.registration_date, ss.departure_time';
    
    const result = await pool.query(query, params);
    
    // Convert to CSV format
    const csv = [
      'Passenger Name,Phone,Email,Date,Time,Route,Direction,Shuttle,Company',
      ...result.rows.map(row => 
        `"${row.passenger_name}","${row.passenger_phone}","${row.passenger_email || ''}","${row.registration_date}","${row.departure_time}","${row.route_type}","${row.direction}","${row.shuttle_name}","${row.company_name}"`
      )
    ].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=registrations.csv');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting registrations:', error);
    res.status(500).json({ error: 'Failed to export registrations' });
  }
});

export default router;