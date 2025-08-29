import express from 'express';
import { pool } from '../db/connection.js';

const router = express.Router();

// Get all companies
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM companies ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

// Get company by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM companies WHERE id = $1', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ error: 'Failed to fetch company' });
  }
});

// Create new company
router.post('/', async (req, res) => {
  try {
    const { name, contact_email, contact_phone } = req.body;
    
    const result = await pool.query(
      'INSERT INTO companies (name, contact_email, contact_phone) VALUES ($1, $2, $3) RETURNING *',
      [name, contact_email, contact_phone]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({ error: 'Failed to create company' });
  }
});

// Update company
router.put('/:id', async (req, res) => {
  try {
    const { name, contact_email, contact_phone } = req.body;
    
    const result = await pool.query(
      `UPDATE companies 
       SET name = COALESCE($1, name),
           contact_email = COALESCE($2, contact_email),
           contact_phone = COALESCE($3, contact_phone)
       WHERE id = $4
       RETURNING *`,
      [name, contact_email, contact_phone, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({ error: 'Failed to update company' });
  }
});

// Delete company
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM companies WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({ error: 'Failed to delete company' });
  }
});

export default router;