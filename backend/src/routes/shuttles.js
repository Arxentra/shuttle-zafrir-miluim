import express from 'express';
import { pool } from '../db/connection.js';

const router = express.Router();

// Get all shuttles
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, c.name as company_name 
      FROM shuttles s
      JOIN companies c ON s.company_id = c.id
      ORDER BY s.name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching shuttles:', error);
    res.status(500).json({ error: 'Failed to fetch shuttles' });
  }
});

// Get shuttle by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, c.name as company_name 
      FROM shuttles s
      JOIN companies c ON s.company_id = c.id
      WHERE s.id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shuttle not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching shuttle:', error);
    res.status(500).json({ error: 'Failed to fetch shuttle' });
  }
});

// Create new shuttle
router.post('/', async (req, res) => {
  try {
    const { name, company_id, capacity, status } = req.body;
    
    const result = await pool.query(
      'INSERT INTO shuttles (name, company_id, capacity, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, company_id, capacity || 50, status || 'active']
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating shuttle:', error);
    res.status(500).json({ error: 'Failed to create shuttle' });
  }
});

// Update shuttle
router.put('/:id', async (req, res) => {
  try {
    const { name, capacity, status } = req.body;
    
    const result = await pool.query(
      `UPDATE shuttles 
       SET name = COALESCE($1, name),
           capacity = COALESCE($2, capacity),
           status = COALESCE($3, status)
       WHERE id = $4
       RETURNING *`,
      [name, capacity, status, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shuttle not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating shuttle:', error);
    res.status(500).json({ error: 'Failed to update shuttle' });
  }
});

// Delete shuttle
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM shuttles WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shuttle not found' });
    }
    
    res.json({ message: 'Shuttle deleted successfully' });
  } catch (error) {
    console.error('Error deleting shuttle:', error);
    res.status(500).json({ error: 'Failed to delete shuttle' });
  }
});

export default router;