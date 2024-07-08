const socket = io();
const messagesContainer = document.getElementById('messages');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const fileInput = document.getElementById('file-input');
const typingNotification = document.getElementById('typing-notification');
const usernamePrompt = document.getElementById('username-prompt');
const saveUsernameBtn = document.getElementById('save-username');
const usernameInput = document.getElementById('username');

let username = localStorage.getItem('username');

if (username) {
  usernamePrompt.style.display = 'none';
  document.getElementById('chat-container').style.display = 'block';
  loadMessages();
} else {
  usernamePrompt.style.display = 'block';
}

saveUsernameBtn.addEventListener('click', () => {
  username = usernameInput.value;
  if (username) {
    localStorage.setItem('username', username);
    usernamePrompt.style.display = 'none';
    document.getElementById('chat-container').style.display = 'block';
    loadMessages();
  }
});

messageForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = messageInput.value;

  if (text) {
    const data = { username, text, replyTo: null };

    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      const formData = new FormData();
      formData.append('file', file);

      fetch('/upload', {
        method: 'POST',
        body: formData
      })
        .then(response => response.json())
        .then(result => {
          data.multimedia = result.filename;
          socket.emit('newMessage', data);
          messageInput.value = '';
          fileInput.value = '';
        });
    } else {
      socket.emit('newMessage', data);
      messageInput.value = '';
    }
  }
});

messageInput.addEventListener('input', () => {
  socket.emit('typing', { username });
});

socket.on('message', (data) => {
  displayMessage(data);
});

socket.on('typing', (data) => {
  typingNotification.textContent = data.username ? `${data.username} is typing...` : '';
});

function displayMessage(data) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message');

  messageElement.innerHTML = `
    <span class="username">${data.username}</span>
    <span class="timestamp">${new Date(data.timestamp).toLocaleTimeString()}</span>
    <p>${data.text}</p>
    ${data.multimedia ? `<img src="/uploads/${data.multimedia}" alt="Multimedia" style="max-width: 100%;">` : ''}
  `;

  if (data.username === username) {
    messageElement.classList.add('own');
  } else {
    messageElement.classList.add('other');
  }

  messagesContainer.appendChild(messageElement);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function loadMessages() {
  fetch('/messages')
    .then(response => response.json())
    .then(messages => {
      messages.forEach(displayMessage);
    });
}

window.addEventListener('load', () => {
  if (username) {
    loadMessages();
  }
});