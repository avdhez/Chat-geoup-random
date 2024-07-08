const socket = io();
const messagesContainer = document.getElementById('messages');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const fileInput = document.getElementById('file-input');
const typingNotification = document.getElementById('typing-notification');
const usernamePrompt = document.getElementById('username-prompt');
const saveUsernameBtn = document.getElementById('save-username');
const usernameInput = document.getElementById('username');
const onlineUsersContainer = document.getElementById('online-users');

let username = localStorage.getItem('username');
let replyTo = null;

if (username) {
  usernamePrompt.style.display = 'none';
  document.getElementById('chat-container').style.display = 'block';
  socket.emit('userConnected', username);
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
    socket.emit('userConnected', username);
    loadMessages();
  }
});

messageForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = messageInput.value;

  if (text) {
    const data = { username, text, replyTo, multimedia: null };

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
          replyTo = null;
        });
    } else {
      socket.emit('newMessage', data);
      messageInput.value = '';
      replyTo = null;
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

socket.on('onlineUsers', (users) => {
  onlineUsersContainer.innerHTML = `Online: ${users.length} (${users.join(', ')})`;
});

socket.on('replyNotification', (data) => {
  alert(`${data.from} replied: ${data.text}`);
});

function displayMessage(data) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message');

  if (data.replyTo) {
    messageElement.classList.add('reply');
  }

  messageElement.innerHTML = `
    <span class="username">${data.username}</span>
    <span class="timestamp">${new Date(data.timestamp).toLocaleTimeString()}</span>
    <p>${data.text}</p>
    ${data.multimedia ? `<img src="/uploads/${data.multimedia}" alt="Multimedia" style="max-width: 100%;">` : ''}
    <button class="reply-btn">Reply</button>
  `;

  if (data.username === username) {
    messageElement.classList.add('own');
  } else {
    messageElement.classList.add('other');
  }

  messageElement.querySelector('.reply-btn').addEventListener('click', () => {
    replyTo = data._id;
    messageInput.focus();
  });

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