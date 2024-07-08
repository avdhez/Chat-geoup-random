const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MessageSchema = new Schema({
  username: String,
  text: String,
  timestamp: Date,
  replyTo: { type: Schema.Types.ObjectId, ref: 'Message' },
  multimedia: String,
});

module.exports = mongoose.model('Message', MessageSchema);