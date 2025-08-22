const express = require('express');
const router = express.Router();
const { getNotes, saveNote } = require('../controllers/noteController');
const auth = require('../middleware/auth.middleware'); 

router.get('/getNotes', auth, getNotes);
router.post('/saveNotes', auth, saveNote);

module.exports = router;