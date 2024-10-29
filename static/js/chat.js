// static/js/chat.js

function loadChatView() {
    let users = [];
    let currentUserID = null;
    let filteredUsers = [];
    let selectedUser = null;
    let chatMessages = [];
    let ws = null;
    let limit = 10;
    let offset = 0;
    let loadingMessages = false;
    let allMessagesLoaded = false;

    // DOM Elements
    const usersList = document.getElementById('chat-users-list');
    const searchInput = document.getElementById('chat-search-input');
    const searchButton = document.getElementById('chat-search-button');
    const onlineCount = document.getElementById('chat-online-count');
    const onlineText = document.getElementById('chat-online-text');
    const userListView = document.getElementById('chat-user-list-view');
    const chatView = document.getElementById('chat-conversation-view');
    const cardTitle = document.getElementById('chat-card-title');
    const backButton = document.getElementById('chat-back-button');
    const chatMessagesContainer = document.getElementById('chat-messages');
    const newMessageInput = document.getElementById('chat-new-message-input');
    const sendButton = document.getElementById('chat-send-button');

    // Fetch Current User ID and Users
    fetchCurrentUserID().then(() => {
        fetchUsers();
        setupWebSocket();
    });

    // Fetch users periodically to update online status
    setInterval(fetchUsers, 5000); // Fetch users every 5 seconds

    function fetchCurrentUserID() {
        return fetch('/api/profile', { method: 'GET', credentials: 'include', cache: 'no-store' })
            .then(response => response.json())
            .then(data => {
                currentUserID = data.userID;
            })
            .catch(error => {
                console.error('Error fetching current user ID:', error);
            });
    }

    function fetchUsers() {
        fetch('/api/online_users', {
            method: 'GET',
            credentials: 'include',
        })
            .then(response => response.json())
            .then(data => {
                users = data.users;
                renderUsers();
                // Update selectedUser's online status
                if (selectedUser) {
                    const updatedUser = users.find(user => user.id === selectedUser.id);
                    if (updatedUser) {
                        selectedUser.online = updatedUser.online;
                    } else {
                        selectedUser.online = false;
                    }
                    updateChatInterface();
                }
            })
            .catch(error => {
                console.error('Error fetching users:', error);
            });
    }

    function setupWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

        ws.onopen = function () {
            console.log('WebSocket connection established');
        };

        ws.onmessage = function (event) {
            console.log('WebSocket message received:', event.data);
            const message = JSON.parse(event.data);
            console.log('Parsed message:', message);

            if (message.sender_id === 0) {
                // System message (error or notification)
                alert(message.content);
                return;
            }

            // Determine who the other user is
            const otherUserID = message.sender_id === currentUserID ? message.receiver_id : message.sender_id;
            console.log('Current User ID:', currentUserID);
            console.log('Message Sender ID:', message.sender_id);
            console.log('Message Receiver ID:', message.receiver_id);
            console.log('Other User ID:', otherUserID);

            // Attempt to find the user in the users array
            const userToUpdate = users.find(user => user.id === otherUserID);
            console.log('User to Update:', userToUpdate);

            if (!userToUpdate) {
                // If the user is not in the list, fetch the users again
                console.log('User not found in users array. Fetching users again.');
                fetchUsers();
                return;
            }

          // Update the lastMessageTime for the user
const timestamp = message.created_at * 1000; // Convert to milliseconds
if (isNaN(timestamp)) {
    console.error('Invalid date format in message.created_at:', message.created_at);
} else {
    userToUpdate.lastMessageTime = timestamp / 1000; // Keep in seconds
    console.log('Updated lastMessageTime:', userToUpdate.lastMessageTime);
}


            // Optionally, update the user's online status
            userToUpdate.online = true;

            // Re-sort and re-render the users list to reflect the new order
            renderUsers();

            // Update chat messages if the conversation is open
            if (selectedUser && (message.sender_id === selectedUser.id || message.receiver_id === selectedUser.id)) {
                chatMessages.push(message);
                renderChatMessages(true);
            }
        };

        ws.onclose = function (event) {
            console.log('WebSocket connection closed:', event);
            console.log('WebSocket connection closed, retrying in 5 seconds...');
            setTimeout(setupWebSocket, 5000);
        };

        ws.onerror = function (error) {
            console.error('WebSocket error:', error);
        };
    }

    /**
     * Render the list of users
     */
    function renderUsers() {
        usersList.innerHTML = '';
        const searchTerm = searchInput.value.toLowerCase();
        filteredUsers = users.filter(user =>
            user.id !== currentUserID &&
            user.username.toLowerCase().includes(searchTerm)
        );

        // Console log before sorting
        console.log('Users before sorting:', filteredUsers.map(u => ({
            id: u.id,
            username: u.username,
            lastMessageTime: u.lastMessageTime
        })));

      // Sort users by last message timestamp or alphabetically
// Sort users by online status, then last message timestamp, then alphabetically
filteredUsers.sort((a, b) => {
    // Online users come first
    if (a.online && !b.online) return -1;
    if (!a.online && b.online) return 1;

    // Both users are either online or offline
    const aLastMsg = a.lastMessageTime || 0;
    const bLastMsg = b.lastMessageTime || 0;

    if (aLastMsg !== bLastMsg) {
        return bLastMsg - aLastMsg; // Descending order
    }

    // If lastMessageTime is the same (or zero), sort alphabetically
    return a.username.localeCompare(b.username);
});


        // Console log after sorting
        console.log('Users after sorting:', filteredUsers.map(u => ({
            id: u.id,
            username: u.username,
            lastMessageTime: u.lastMessageTime
        })));

        filteredUsers.forEach(user => {
            const li = document.createElement('li');
            li.className = `flex items-center space-x-4 p-3 bg-white rounded-lg shadow-sm transition-all duration-200 ${
                user.online ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'
            }`;

            if (user.online) {
                li.addEventListener('click', () => handleUserClick(user));
            }

            // Avatar
            const avatarDiv = document.createElement('div');
            avatarDiv.className = 'h-12 w-12 relative';
            const avatarImg = document.createElement('img');
            avatarImg.src = 'https://via.placeholder.com/80'; // Replace with user avatar if available
            avatarImg.alt = user.username;
            avatarImg.className = 'h-12 w-12 rounded-full';
            avatarDiv.appendChild(avatarImg);

            // User Info
            const userInfo = document.createElement('div');
            userInfo.className = 'flex-grow';
            const nameP = document.createElement('p');
            nameP.className = 'font-semibold text-sky-800';
            nameP.textContent = user.username;
            const statusP = document.createElement('p');
            statusP.className = 'text-sm text-gray-500';
            statusP.textContent = user.online ? 'Active now' : 'Offline';
            userInfo.appendChild(nameP);
            userInfo.appendChild(statusP);

            // Badge
            const badge = document.createElement('span');
            badge.className = `ml-auto px-2 py-1 text-xs font-medium rounded-full ${
                user.online ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`;
            badge.textContent = user.online ? 'Online' : 'Offline';

            li.appendChild(avatarDiv);
            li.appendChild(userInfo);
            li.appendChild(badge);
            usersList.appendChild(li);
        });

        // Update Online Count
        const onlineUsersCount = users.filter(user => user.online && user.id !== currentUserID).length;
        if (onlineCount) {
            onlineCount.textContent = onlineUsersCount;
        }
        if (onlineText) {
            onlineText.textContent = onlineUsersCount !== 1 ? 's' : '';
        }
    }

    /**
     * Handle Search Functionality
     */
    function handleSearch() {
        renderUsers();
    }

    /**
     * Handle User Click to Open Chat
     */
    function handleUserClick(user) {
        if (!user.online) {
            alert(`${user.username} is offline and cannot be messaged.`);
            return;
        }
        selectedUser = user;
        cardTitle.textContent = `Chat with ${user.username}`;
        userListView.classList.add('hidden');
        chatView.classList.remove('hidden');
        chatMessages = [];
        offset = 0;
        allMessagesLoaded = false;
        loadChatHistory();
    }

    /**
     * Load Chat History
     */
    function loadChatHistory() {
        if (loadingMessages || allMessagesLoaded) return;
        loadingMessages = true;

        fetch(`/api/chat_history?user_id=${selectedUser.id}&limit=${limit}&offset=${offset}`, {
            method: 'GET',
            credentials: 'include',
        })
            .then(response => response.json())
            .then(messages => {
                if (messages.length < limit) {
                    allMessagesLoaded = true;
                }
                chatMessages = messages.concat(chatMessages);
                offset += limit;
                renderChatMessages();
                loadingMessages = false;

                if (offset === limit) {
                    // Scroll to bottom on initial load
                    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
                }
            })
            .catch(error => {
                console.error('Error loading chat history:', error);
                loadingMessages = false;
            });
    }

    /**
     * Render Chat Messages
     */
    function renderChatMessages(scrollToBottom = false) {
        chatMessagesContainer.innerHTML = '';
        chatMessages.forEach(message => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `flex ${
                message.sender_id === currentUserID ? 'justify-end' : 'justify-start'
            } mb-4`;

            const messageBubble = document.createElement('div');
            messageBubble.className = `max-w-[70%] p-3 rounded-lg ${
                message.sender_id === currentUserID ? 'bg-sky-500 text-white' : 'bg-gray-200'
            }`;

            const senderP = document.createElement('p');
            senderP.className = 'text-sm font-semibold mb-1';
            senderP.textContent = message.sender_id === currentUserID ? 'You' : selectedUser.username;

            const contentP = document.createElement('p');
            contentP.textContent = message.content;

            const timeP = document.createElement('p');
            timeP.className = 'text-xs text-right mt-1 opacity-70';
            const date = new Date(message.created_at);
            timeP.textContent = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
            })}`;

            messageBubble.appendChild(senderP);
            messageBubble.appendChild(contentP);
            messageBubble.appendChild(timeP);
            messageDiv.appendChild(messageBubble);
            chatMessagesContainer.appendChild(messageDiv);
        });

        if (scrollToBottom) {
            // Scroll to bottom
            chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
        }
    }

    /**
     * Handle Sending a New Message
     */
    function handleSendMessage() {
        const messageContent = newMessageInput.value.trim();
        if (messageContent && ws && ws.readyState === WebSocket.OPEN) {
            if (!selectedUser.online) {
                alert('Cannot send message. The user is offline.');
                return;
            }
            const messageObj = {
                content: messageContent,
                receiver_id: selectedUser.id,
            };
            ws.send(JSON.stringify(messageObj));
            // Clear the input field
            newMessageInput.value = '';
        }
    }

    /**
     * Handle Back Button to Return to User List
     */
    function handleBack() {
        selectedUser = null;
        cardTitle.textContent = 'User Online Status';
        chatView.classList.add('hidden');
        userListView.classList.remove('hidden');
    }

    /**
     * Handle Infinite Scrolling
     */
    function handleScroll() {
        if (chatMessagesContainer.scrollTop === 0 && !loadingMessages) {
            loadChatHistory();
        }
    }

    /**
     * Update Chat Interface Based on User's Online Status
     */
    function updateChatInterface() {
        const offlineMessage = document.getElementById('chat-offline-message');
        if (!selectedUser.online) {
            newMessageInput.disabled = true;
            sendButton.disabled = true;
            sendButton.classList.add('opacity-50', 'cursor-not-allowed');
            offlineMessage.classList.remove('hidden');
        } else {
            newMessageInput.disabled = false;
            sendButton.disabled = false;
            sendButton.classList.remove('opacity-50', 'cursor-not-allowed');
            offlineMessage.classList.add('hidden');
        }
    }

    // Event Listeners
    searchButton.addEventListener('click', handleSearch);
    searchInput.addEventListener('input', handleSearch);
    backButton.addEventListener('click', handleBack);
    sendButton.addEventListener('click', handleSendMessage);
    newMessageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    });
    chatMessagesContainer.addEventListener('scroll', debounce(handleScroll, 300));

    // Initial Render
    renderUsers();
}

/**
 * Debounce Function
 */
function debounce(func, wait) {
    let timeout;
    return function () {
        const context = this,
            args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}
