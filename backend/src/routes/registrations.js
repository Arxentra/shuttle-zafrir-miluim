import express from 'express';
import { pool } from '../db/connection.js';

const router = express.Router();

// Get registrations
router.get('/', async (req, res) => {
  try {
    const { schedule_id, date, status } = req.query;
    
    let query = `
      SELECT 
        sr.*,
        ss.departure_time,
        ss.route_type,
        ss.direction,
        s.name as shuttle_name,
        c.name as company_name
      FROM shuttle_registrations sr
      JOIN shuttle_schedules ss ON sr.schedule_id = ss.id
      JOIN shuttles s ON ss.shuttle_id = s.id
      JOIN companies c ON s.company_id = c.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (schedule_id) {
      paramCount++;
      query += ` AND sr.schedule_id = $${paramCount}`;
      params.push(schedule_id);
    }
    
    if (date) {
      paramCount++;
      query += ` AND sr.registration_date = $${paramCount}`;
      params.push(date);
    }
    
    if (status) {
      paramCount++;
      query += ` AND sr.status = $${paramCount}`;
      params.push(status);
    }
    
    query += ' ORDER BY sr.registration_date, ss.departure_time';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
});

// Create new registration
router.post('/', async (req, res) => {
  try {
    let {
      schedule_id,
      passenger_name,
      passenger_phone,
      passenger_email,
      registration_date,
      // Frontend format fields
      time_slot,
      route_type,
      direction,
      user_name,
      phone_number
    } = req.body;
    
    // Handle frontend format - find schedule_id if not provided
    if (!schedule_id && time_slot && route_type && direction) {
      const scheduleQuery = `
        SELECT id FROM shuttle_schedules 
        WHERE departure_time = $1 AND route_type = $2 AND direction = $3
        LIMIT 1
      `;
      const scheduleResult = await pool.query(scheduleQuery, [time_slot + ':00', route_type, direction]);
      
      if (scheduleResult.rows.length === 0) {
        return res.status(400).json({ error: 'Schedule not found for the specified time and route' });
      }
      
      schedule_id = scheduleResult.rows[0].id;
    }
    
    // Map frontend fields to backend fields
    if (!passenger_name && user_name) {
      passenger_name = user_name;
    }
    if (!passenger_phone && phone_number) {
      passenger_phone = phone_number;
    }
    
    // Default phone if none provided
    if (!passenger_phone) {
      passenger_phone = '0000000000';
    }
    
    // Check if registration already exists
    const existing = await pool.query(
      `SELECT id FROM shuttle_registrations 
       WHERE schedule_id = $1 AND passenger_phone = $2 AND registration_date = $3 AND status = 'confirmed'`,
      [schedule_id, passenger_phone, registration_date]
    );
    
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Registration already exists for this schedule' });
    }
    
    // Check capacity
    const capacityCheck = await pool.query(
      `SELECT 
        s.capacity,
        COUNT(sr.id) as registered_count
       FROM shuttle_schedules ss
       JOIN shuttles s ON ss.shuttle_id = s.id
       LEFT JOIN shuttle_registrations sr ON ss.id = sr.schedule_id
         AND sr.registration_date = $2
         AND sr.status = 'confirmed'
       WHERE ss.id = $1
       GROUP BY s.capacity`,
      [schedule_id, registration_date]
    );
    
    if (capacityCheck.rows.length > 0) {
      const { capacity, registered_count } = capacityCheck.rows[0];
      if (registered_count >= capacity) {
        return res.status(400).json({ error: 'Shuttle is full' });
      }
    }
    
    // Create registration
    const result = await pool.query(
      `INSERT INTO shuttle_registrations 
       (schedule_id, passenger_name, passenger_phone, passenger_email, registration_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [schedule_id, passenger_name, passenger_phone, passenger_email, registration_date]
    );
    
    // TODO: Broadcast update via WebSocket
    // const message = JSON.stringify({
    //   type: 'registration_created',
    //   data: result.rows[0]
    // });
    
    // wss.clients.forEach(client => {
    //   if (client.readyState === 1) {
    //     client.send(message);
    //   }
    // });
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating registration:', error);
    res.status(500).json({ error: 'Failed to create registration' });
  }
});

// Cancel registration
router.put('/:id/cancel', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE shuttle_registrations 
       SET status = 'cancelled'
       WHERE id = $1 AND status = 'confirmed'
       RETURNING *`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Registration not found or already cancelled' });
    }
    
    // TODO: Broadcast update via WebSocket
    // const message = JSON.stringify({
    //   type: 'registration_cancelled',
    //   data: result.rows[0]
    // });
    
    // wss.clients.forEach(client => {
    //   if (client.readyState === 1) {
    //     client.send(message);
    //   }
    // });
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error cancelling registration:', error);
    res.status(500).json({ error: 'Failed to cancel registration' });
  }
});

// Delete registration (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM shuttle_registrations WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Registration not found' });
    }
    
    res.json({ message: 'Registration deleted successfully' });
  } catch (error) {
    console.error('Error deleting registration:', error);
    res.status(500).json({ error: 'Failed to delete registration' });
  }
});

export default router;