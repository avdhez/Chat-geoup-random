const express = require('express');
const multer = require('multer');
const Message = require('../models/message');

const router = express.Router();

// Fetch messages
router.get('/messages', async (req, res) => {
  const messages = await Message.find().populate('replyTo').sort({ timestamp: 1 });
  res.json(messages);
});

// Handle file uploads
const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

router.post('/upload', upload.single('file'), (req, res) => {
  res.json({ filename: req.file.filename });
});

module.exports = router;