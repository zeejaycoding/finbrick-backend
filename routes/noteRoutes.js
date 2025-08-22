const express = require('express');
const router = express.Router();
const { getNotes, saveNote } = require('../controllers/noteController');
const authenticateToken = require('../middleware/auth'); // Assuming you have this middleware

router.get('/getNotes', authenticateToken, getNotes);
router.post('/saveNotes', authenticateToken, saveNote);

module.exports = router;