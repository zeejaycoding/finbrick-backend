const Note = require('../models/noteModel');
const expressHandler = require('express-async-handler');

const getNotes = expressHandler(async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Unauthorized: No user ID in token' });
    }

    const notes = await Note.find({ userId: req.user.userId });
    res.status(200).json(notes);
  } catch (err) {
    console.error('Get notes error:', err.stack);
    res.status(500).json({ error: 'Failed to fetch notes: ' + err.message });
  }
});

const saveNote = expressHandler(async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Unauthorized: No user ID in token' });
    }

    const { category, content } = req.body;
    let note = await Note.findOne({ userId: req.user.userId, category });
    if (!note) {
      note = new Note({
        userId: req.user.userId,
        category,
        content,
      });
    } else {
      note.content = content;
      note.updatedAt = Date.now();
    }
    await note.save();
    res.status(200).json({ message: 'Note saved', note });
  } catch (err) {
    console.error('Save note error:', err.stack);
    res.status(500).json({ error: 'Failed to save note: ' + err.message });
  }
});

module.exports = { getNotes, saveNote };