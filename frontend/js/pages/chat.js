let __activeSwapId = null;
let __typingTimeout = null;

async function renderChat(app, params) {
  app.innerHTML = `
    <div class="chat-layout">
      <aside class="chat-list" id="chat-list"><div class="page-loader"><div class="spinner"></div></div></aside>
      <section class="chat-pane" id="chat-pane">
        <div class="empty-state"><h3>Select a conversation</h3><p>Pick a swap request to start chatting.</p></div>
      </section>
    </div>`;

  let swaps = [];
  try {
    const res = await api.getSwaps('');
    swaps = res.swaps.filter((s) => s.status !== 'rejected' && s.status !== 'cancelled');
  } catch (err) {
    document.getElementById('chat-list').innerHTML = `<p style="padding:16px;">${escapeHtml(err.message)}</p>`;
    return;
  }

  const listEl = document.getElementById('chat-list');
  listEl.innerHTML = swaps.length
    ? swaps.map((s) => chatListItemHtml(s)).join('')
    : `<div class="empty-state"><h3>No conversations</h3><p>Accepted swap requests appear here.</p></div>`;

  listEl.querySelectorAll('[data-swap-id]').forEach((item) => {
    item.addEventListener('click', () => {
      listEl.querySelectorAll('.chat-list-item').forEach((i) => i.classList.remove('active'));
      item.classList.add('active');
      openConversation(item.dataset.swapId, swaps.find((s) => s._id === item.dataset.swapId));
    });
  });

  const targetId = params.id;
  if (targetId) {
    const target = swaps.find((s) => s._id === targetId);
    if (target) {
      const el = listEl.querySelector(`[data-swap-id="${targetId}"]`);
      if (el) el.classList.add('active');
      openConversation(targetId, target);
    }
  }
}

function chatListItemHtml(s) {
  const isRecipient = s.recipient._id === state.user._id;
  const other = isRecipient ? s.requester : s.recipient;
  return `
    <div class="chat-list-item" data-swap-id="${s._id}">
      <img src="${other.avatar?.url || fallbackAvatar(other.name)}" alt=""/>
      <div>
        <b style="font-size:.88rem;">${escapeHtml(other.name)}</b>
        <div class="field-hint">${escapeHtml(s.requestedListing?.title || 'Listing')}</div>
        <span class="status-chip status-${s.status}" style="margin-top:4px; display:inline-block;">${s.status}</span>
      </div>
    </div>`;
}

async function openConversation(swapId, swap) {
  __activeSwapId = swapId;
  const pane = document.getElementById('chat-pane');
  const isRecipient = swap.recipient._id === state.user._id;
  const other = isRecipient ? swap.requester : swap.recipient;

  pane.innerHTML = `
    <div class="chat-head">
      <img src="${other.avatar?.url || fallbackAvatar(other.name)}" alt="" style="width:34px;height:34px;border-radius:50%;object-fit:cover;"/>
      <span>${escapeHtml(other.name)}</span>
      <span class="status-chip status-${swap.status}" style="margin-left:auto;">${swap.status}</span>
    </div>
    <div class="chat-messages" id="chat-messages"><div class="page-loader"><div class="spinner"></div></div></div>
    <div class="typing-indicator hidden" id="typing-indicator">${escapeHtml(other.name)} is typing...</div>
    <div class="chat-input-row">
      <label class="btn btn-ghost btn-sm" for="chat-image-input">📎</label>
      <input type="file" id="chat-image-input" accept="image/*" hidden/>
      <input type="text" id="chat-text-input" placeholder="Type a message..."/>
      <button class="btn btn-primary" id="chat-send-btn">Send</button>
    </div>`;

  if (state.socket) {
    state.socket.emit('joinSwap', swapId);
  }

  await loadMessages(swapId);

  const input = document.getElementById('chat-text-input');
  input.addEventListener('input', () => {
    if (!state.socket) return;
    state.socket.emit('typing', { swapId, name: state.user.name });
    clearTimeout(__typingTimeout);
    __typingTimeout = setTimeout(() => state.socket.emit('stopTyping', { swapId }), 1200);
  });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendChatMessage(swapId); });
  document.getElementById('chat-send-btn').addEventListener('click', () => sendChatMessage(swapId));
  document.getElementById('chat-image-input').addEventListener('change', (e) => {
    if (e.target.files[0]) sendChatMessage(swapId, e.target.files[0]);
  });

  if (state.socket) {
    state.socket.off('newMessage');
    state.socket.on('newMessage', (msg) => {
      if (msg.swap === swapId || msg.swap?._id === swapId) appendMessage(msg);
    });
    state.socket.off('typing');
    state.socket.on('typing', ({ swapId: sid }) => {
      if (sid === __activeSwapId) document.getElementById('typing-indicator')?.classList.remove('hidden');
    });
    state.socket.off('stopTyping');
    state.socket.on('stopTyping', ({ swapId: sid }) => {
      if (sid === __activeSwapId) document.getElementById('typing-indicator')?.classList.add('hidden');
    });
  }
}

async function loadMessages(swapId) {
  try {
    const { messages } = await api.getMessages(swapId);
    const container = document.getElementById('chat-messages');
    container.innerHTML = messages.map(messageBubbleHtml).join('') || '<p style="text-align:center;color:var(--color-ink-soft);">Say hello to start the conversation.</p>';
    container.scrollTop = container.scrollHeight;
  } catch (err) {
    toast(err.message, 'error');
  }
}

function messageBubbleHtml(msg) {
  const mine = msg.sender._id === state.user._id || msg.sender === state.user._id;
  return `
    <div class="msg-bubble ${mine ? 'msg-mine' : 'msg-theirs'}">
      ${msg.text ? escapeHtml(msg.text) : ''}
      ${msg.image?.url ? `<img src="${msg.image.url}" alt="shared image"/>` : ''}
      <div class="msg-time">${formatTime(msg.createdAt)}</div>
    </div>`;
}

function appendMessage(msg) {
  const container = document.getElementById('chat-messages');
  if (!container) return;
  const placeholder = container.querySelector('p');
  if (placeholder) placeholder.remove();
  container.insertAdjacentHTML('beforeend', messageBubbleHtml(msg));
  container.scrollTop = container.scrollHeight;
  document.getElementById('typing-indicator')?.classList.add('hidden');
}

async function sendChatMessage(swapId, imageFile) {
  const input = document.getElementById('chat-text-input');
  const text = input.value.trim();
  if (!text && !imageFile) return;

  const fd = new FormData();
  if (text) fd.append('text', text);
  if (imageFile) fd.append('image', imageFile);

  input.value = '';
  try {
    await api.sendMessage(swapId, fd);
  } catch (err) {
    toast(err.message, 'error');
  }
}
