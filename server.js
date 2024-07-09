const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const upload = multer({ dest: 'public/uploads/' });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB Atlas
mongoose.connect('<YOUR_MONGODB_ATLAS_URI>', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Define Message schema
const messageSchema = new mongoose.Schema({
  username: String,
  text: String,
  timestamp: { type: Date, default: Date.now },
  replyTo: mongoose.Schema.Types.ObjectId,
  multimedia: String,
  taggedUsers: [String]
});

const Message = mongoose.model('Message', messageSchema);

let onlineUsers = {};

app.post('/upload', upload.single('file'), (req, res) => {
  res.json({ filename: req.file.filename });
});

app.get('/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('userConnected', (username) => {
    onlineUsers[socket.id] = username;
    io.emit('onlineUsers', Object.values(onlineUsers));
  });

  socket.on('newMessage', async (data) => {
    const { username, text, replyTo, multimedia, taggedUsers } = data;

    const message = new Message({
      username,
      text,
      replyTo,
      multimedia,
      taggedUsers
    });

    try {
      await message.save();
      io.emit('message', {
        _id: message._id,
        username: message.username,
        text: message.text,
        timestamp: message.timestamp,
        replyTo: message.replyTo,
        multimedia: message.multimedia,
        taggedUsers: message.taggedUsers
      });

      taggedUsers.forEach(taggedUser => {
        const recipientSocketId = Object.keys(onlineUsers).find(key => onlineUsers[key] === taggedUser);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('tagNotification', {
            from: username,
            text
          });
        }
      });

      if (replyTo) {
        const originalMessage = await Message.findById(replyTo);
        const recipientSocketId = Object.keys(onlineUsers).find(key => onlineUsers[key] === originalMessage.username);

        if (recipientSocketId) {
          io.to(recipientSocketId).emit('replyNotification', {
            from: username,
            text
          });
        }
      }
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  socket.on('typing', (data) => {
    socket.broadcast.emit('typing', data);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
    delete onlineUsers[socket.id];
    io.emit('onlineUsers', Object.values(onlineUsers));
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});