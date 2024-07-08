const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const upload = multer({ dest: 'public/uploads/' });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/chat-app', { useNewUrlParser: true, useUnifiedTopology: true });

// Define Message schema
const messageSchema = new mongoose.Schema({
  username: String,
  text: String,
  timestamp: Date,
  replyTo: mongoose.Schema.Types.ObjectId,
  multimedia: String
});

const Message = mongoose.model('Message', messageSchema);

// Routes
app.post('/upload', upload.single('file'), (req, res) => {
  res.json({ filename: req.file.filename });
});

app.get('/messages', async (req, res) => {
  const messages = await Message.find();
  res.json(messages);
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('newMessage', async (data) => {
    const message = new Message({
      username: data.username,
      text: data.text,
      timestamp: new Date(),
      replyTo: data.replyTo || null,
      multimedia: data.multimedia || null
    });

    await message.save();

    io.emit('message', message);
  });

  socket.on('typing', (data) => {
    socket.broadcast.emit('typing', data);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});