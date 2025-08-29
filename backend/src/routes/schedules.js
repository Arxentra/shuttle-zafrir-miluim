import express from 'express';
import { pool } from '../db/connection.js';

const router = express.Router();

// Get all schedules
router.get('/', async (req, res) => {
  try {
    const { route_type, direction, date } = req.query;
    
    let query = `
      SELECT 
        ss.*,
        s.name as shuttle_name,
        s.capacity,
        c.name as company_name,
        COUNT(sr.id) as registered_count
      FROM shuttle_schedules ss
      JOIN shuttles s ON ss.shuttle_id = s.id
      JOIN companies c ON s.company_id = c.id
      LEFT JOIN shuttle_registrations sr ON ss.id = sr.schedule_id
        AND sr.registration_date = COALESCE($1, CURRENT_DATE)
        AND sr.status = 'confirmed'
      WHERE ss.is_active = true
    `;
    
    const params = [date || null];
    let paramCount = 1;
    
    if (route_type) {
      paramCount++;
      query += ` AND ss.route_type = $${paramCount}`;
      params.push(route_type);
    }
    
    if (direction) {
      paramCount++;
      query += ` AND ss.direction = $${paramCount}`;
      params.push(direction);
    }
    
    query += ` GROUP BY ss.id, s.id, c.id ORDER BY ss.departure_time`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
});

// Get schedule by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        ss.*,
        s.name as shuttle_name,
        s.capacity,
        c.name as company_name
      FROM shuttle_schedules ss
      JOIN shuttles s ON ss.shuttle_id = s.id
      JOIN companies c ON s.company_id = c.id
      WHERE ss.id = $1`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
});

// Create new schedule
router.post('/', async (req, res) => {
  try {
    const {
      shuttle_id,
      route_type,
      direction,
      departure_time,
      arrival_time,
      days_of_week
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO shuttle_schedules 
      (shuttle_id, route_type, direction, departure_time, arrival_time, days_of_week)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [shuttle_id, route_type, direction, departure_time, arrival_time, days_of_week || [1,2,3,4,5]]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({ error: 'Failed to create schedule' });
  }
});

// Update schedule
router.put('/:id', async (req, res) => {
  try {
    const {
      departure_time,
      arrival_time,
      days_of_week,
      is_active
    } = req.body;
    
    const result = await pool.query(
      `UPDATE shuttle_schedules 
      SET departure_time = COALESCE($1, departure_time),
          arrival_time = COALESCE($2, arrival_time),
          days_of_week = COALESCE($3, days_of_week),
          is_active = COALESCE($4, is_active)
      WHERE id = $5
      RETURNING *`,
      [departure_time, arrival_time, days_of_week, is_active, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({ error: 'Failed to update schedule' });
  }
});

// Delete schedule
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM shuttle_schedules WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ error: 'Failed to delete schedule' });
  }
});

// Get schedules organized by route and direction for frontend display
router.get('/organized/display', async (req, res) => {
  try {
    const { date } = req.query;
    
    const query = `
      SELECT 
        ss.route_type,
        ss.direction,
        ss.departure_time,
        ss.arrival_time,
        s.name as shuttle_name,
        s.capacity,
        c.name as company_name,
        COUNT(sr.id) as registered_count
      FROM shuttle_schedules ss
      JOIN shuttles s ON ss.shuttle_id = s.id
      LEFT JOIN companies c ON s.company_id = c.id
      LEFT JOIN shuttle_registrations sr ON ss.id = sr.schedule_id
        AND sr.registration_date = COALESCE($1, CURRENT_DATE)
        AND sr.status = 'confirmed'
      WHERE ss.is_active = true
      GROUP BY ss.id, ss.route_type, ss.direction, ss.departure_time, ss.arrival_time, s.name, s.capacity, c.name
      ORDER BY ss.route_type, ss.direction, ss.departure_time
    `;
    
    const result = await pool.query(query, [date || null]);
    
    // Organize data by route type and direction
    const organized = {
      savidor_to_tzafrir: {
        outbound: [],
        return: []
      },
      kiryat_aryeh_to_tzafrir: {
        outbound: [],
        return: []
      }
    };
    
    result.rows.forEach(row => {
      // Format time for display (remove seconds)
      const displayTime = row.departure_time.substring(0, 5);
      
      const scheduleEntry = {
        time: displayTime,
        fullTime: row.departure_time,
        arrivalTime: row.arrival_time ? row.arrival_time.substring(0, 5) : null,
        shuttleName: row.shuttle_name,
        capacity: row.capacity,
        companyName: row.company_name,
        registeredCount: parseInt(row.registered_count) || 0
      };
      
      if (organized[row.route_type] && organized[row.route_type][row.direction]) {
        organized[row.route_type][row.direction].push(scheduleEntry);
      }
    });
    
    res.json(organized);
  } catch (error) {
    console.error('Error fetching organized schedules:', error);
    res.status(500).json({ error: 'Failed to fetch organized schedules' });
  }
});

export default router;