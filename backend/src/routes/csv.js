import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { CSVProcessor } from '../services/csvProcessor.js';
import { authenticateToken } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const csvProcessor = new CSVProcessor();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `shuttle-${req.body.shuttle_id || 'unknown'}-${uniqueSuffix}.csv`);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only CSV files
  if (file.mimetype === 'text/csv' || 
      file.originalname.toLowerCase().endsWith('.csv')) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Upload CSV file
router.post('/upload', authenticateToken, upload.single('csvFile'), async (req, res) => {
  try {
    const { shuttle_id } = req.body;
    
    if (!shuttle_id) {
      return res.status(400).json({ error: 'shuttle_id is required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('File uploaded:', req.file.filename);

    res.json({
      message: 'File uploaded successfully',
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Process CSV file
router.post('/process', authenticateToken, async (req, res) => {
  try {
    const { shuttle_id, file_path } = req.body;

    if (!shuttle_id || !file_path) {
      return res.status(400).json({ error: 'shuttle_id and file_path are required' });
    }

    const result = await csvProcessor.processCSV(shuttle_id, file_path);
    
    res.json(result);
  } catch (error) {
    console.error('CSV processing error:', error);
    res.status(500).json({ 
      error: 'CSV processing failed', 
      details: error.message 
    });
  }
});

// Upload and process in one step
router.post('/upload-and-process', authenticateToken, upload.single('csvFile'), async (req, res) => {
  try {
    const { shuttle_id } = req.body;
    
    if (!shuttle_id) {
      return res.status(400).json({ error: 'shuttle_id is required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('File uploaded, starting processing:', req.file.filename);

    // Process the uploaded file
    const result = await csvProcessor.processCSV(shuttle_id, req.file.filename);
    
    // Optionally delete the file after processing
    // csvProcessor.deleteFile(req.file.filename);
    
    res.json({
      ...result,
      filename: req.file.filename,
      originalName: req.file.originalname
    });
  } catch (error) {
    console.error('Upload and process error:', error);
    res.status(500).json({ 
      error: 'Upload and processing failed', 
      details: error.message 
    });
  }
});

// Get processing logs for a shuttle
router.get('/logs/:shuttleId', authenticateToken, async (req, res) => {
  try {
    const { shuttleId } = req.params;
    const logs = await csvProcessor.getProcessingLogs(shuttleId);
    res.json(logs);
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete uploaded file
router.delete('/file/:filename', authenticateToken, async (req, res) => {
  try {
    const { filename } = req.params;
    csvProcessor.deleteFile(filename);
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;