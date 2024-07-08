const socket = io();

const messagesContainer = document.getElementById('messages');
const messageForm = document.getElementById('message-form');
const usernameInput = document.getElementById('username');
const messageInput = document.getElementById('message');
const fileUpload = document.getElementById('file-upload');
const typingNotification = document.getElementById('typing-notification');

let typingTimeout;

// Fetch existing messages
fetch('/chat/messages')
  .then(response => response.json())
  .then(data => {
    data.forEach(displayMessage);
  });

// Display messages
function displayMessage(data) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message');
  messageElement.innerHTML = `
    <span class="username">${data.username}</span>
    <span class="timestamp">${new Date(data.timestamp).toLocaleTimeString()}</span>
    <p>${data.text}</p>
    ${data.multimedia ? `<img src="/uploads/${data.multimedia}" alt="Multimedia" style="max-width: 100%;">` : ''}
  `;
  messagesContainer.appendChild(messageElement);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Send message
messageForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const username = usernameInput.value.trim();
  const text = messageInput.value.trim();

  if (!username || !text) return;

  const data = {
    username,
    text,
    timestamp: new Date(),
  };

  if (fileUpload.files.length > 0) {
    const formData = new FormData();
    formData.append('file', fileUpload.files[0]);

    fetch('/chat/upload', {
      method: 'POST',
      body: formData,
    })
      .then(response => response.json())
      .then(fileData => {
        data.multimedia = fileData.filename;
        socket.emit('message', data);
        displayMessage(data);
        messageInput.value = '';
        fileUpload.value = '';
      });
  } else {
    socket.emit('message', data);
    displayMessage(data);
    messageInput.value = '';
  }
});

// Typing notification
messageInput.addEventListener('input', () => {
  socket.emit('typing', { username: usernameInput.value });

  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit('typing', { username: '' });
  }, 1000);
});

socket.on('message', displayMessage);

socket.on('typing', (data) => {
     if (data.username) {
       typingNotification.textContent = `${data.username} is typing...`;
     } else {
       typingNotification.textContent = '';
     }
   });