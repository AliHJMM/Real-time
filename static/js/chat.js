// static/js/chat.js

/**
 * Function to initialize and handle the chat view.
 * Ensures users can view chat histories with both online and offline users,
 * while restricting message sending to online users only.
 */
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

    // Initialize the chat by fetching current user ID and users list
    fetchCurrentUserID().then(() => {
        fetchUsers();
        setupWebSocket();
    });

    // Periodically fetch users to update their online status every 5 seconds
    setInterval(fetchUsers, 5000);

    /**
     * Fetch the current user's ID from the profile API.
     */
    function fetchCurrentUserID() {
        return fetch('/api/profile', { method: 'GET', credentials: 'include', cache: 'no-store' })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch profile');
                }
                return response.json();
            })
            .then(data => {
                currentUserID = data.userID;
                console.log('Current User ID:', currentUserID);
            })
            .catch(error => {
                console.error('Error fetching current user ID:', error);
                // Optionally, redirect to login if fetching profile fails
                window.history.replaceState({}, '', '/login');
                showView('login-view');
            });
    }
    
    

    /**
     * Fetch the list of online users from the server.
     */
    function fetchUsers() {
        fetch('/api/online_users', {
            method: 'GET',
            credentials: 'include',
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch online users');
                }
                return response.json();
            })
            .then(data => {
                users = data.users;
                renderUsers();
                // Update selectedUser's online status if a chat is open
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

    /**
     * Setup the WebSocket connection for real-time chat.
     */
    function setupWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    
        ws.onopen = function () {
            console.log('WebSocket connection established');
        };
    
        ws.onmessage = function (event) {
            console.log("WebSocket message received:", event.data);
            const message = JSON.parse(event.data);
            
            // If message is for the currently selected user, display it
            if (selectedUser && message.sender_id === selectedUser.id) {
                chatMessages.push(message);
                renderChatMessages(true);  // true to scroll to bottom on new message
            }
        };
        
    
        ws.onclose = function (event) {
            console.log('WebSocket connection closed:', event);
            console.log('Attempting to reconnect in 5 seconds...');
            setTimeout(setupWebSocket, 5000); // Retry after 5 seconds
        };
    
        ws.onerror = function (error) {
            console.error('WebSocket error:', error);
        };
    }
    

    /**
     * Render the list of users in the chat interface.
     */
    function renderUsers() {
        usersList.innerHTML = '';
        const searchTerm = searchInput.value.toLowerCase();
        filteredUsers = users.filter(user =>
            user.id !== currentUserID &&
            user.username.toLowerCase().includes(searchTerm)
        );
    
        // Sort users: Online users first, then by last message time, then alphabetically
        filteredUsers.sort((a, b) => {
            if (a.online && !b.online) return -1;
            if (!a.online && b.online) return 1;
    
            const aLastMsg = a.lastMessageTime || 0;
            const bLastMsg = b.lastMessageTime || 0;
    
            if (aLastMsg !== bLastMsg) {
                return bLastMsg - aLastMsg;
            }
    
            return a.username.localeCompare(b.username);
        });
    
        filteredUsers.forEach(user => {
            const li = document.createElement('li');
            li.className = `flex items-center space-x-4 p-3 bg-white rounded-lg shadow-sm transition-all duration-200 cursor-pointer ${
                user.online ? '' : 'opacity-50'
            }`;
            
            // Allow clicking on offline users to view chat history
            li.addEventListener('click', () => handleUserClick(user));
    
            // Avatar
            const avatarDiv = document.createElement('div');
            avatarDiv.className = 'h-12 w-12 relative';
            const avatarImg = document.createElement('img');
            avatarImg.src = 'https://via.placeholder.com/80';
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
            if (user.online) {
                statusP.textContent = 'Active now';
            } else if (user.lastMessageTime) {
                const lastActiveDate = new Date(user.lastMessageTime * 1000);
                statusP.textContent = `Last active on ${lastActiveDate.toLocaleDateString()} at ${lastActiveDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
            } else {
                statusP.textContent = 'Offline';
            }
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
    
        const onlineUsersCount = users.filter(user => user.online && user.id !== currentUserID).length;
        if (onlineCount) {
            onlineCount.textContent = onlineUsersCount;
        }
        if (onlineText) {
            onlineText.textContent = onlineUsersCount !== 1 ? 's' : '';
        }
    }
    

    /**
     * Handle search functionality to filter users.
     */
    function handleSearch() {
        renderUsers();
    }

    /**
     * Handle user selection to open the chat with that user.
     * @param {Object} user - The user object that was clicked.
     */
    function handleUserClick(user) {
        selectedUser = user;
        cardTitle.textContent = `Chat with ${user.username}`;
        userListView.classList.add('hidden');
        chatView.classList.remove('hidden');
        chatMessages = [];
        offset = 0;
        allMessagesLoaded = false;
        loadChatHistory();
    
        // Update the chat interface based on the user's online status
        updateChatInterface();
    }
    
    /**
     * Load chat history with the selected user.
     */
    function loadChatHistory() {
        if (!selectedUser) {
            return;
        }
    
        if (loadingMessages || allMessagesLoaded) return;
        loadingMessages = true;
    
        fetch(`/api/chat_history?user_id=${selectedUser.id}&limit=${limit}&offset=${offset}`, {
            method: 'GET',
            credentials: 'include',
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Failed to fetch chat history");
                }
                return response.json();
            })
            .then(messages => {
                if (messages.length < limit) {
                    allMessagesLoaded = true;
                }
                chatMessages = messages.concat(chatMessages);
                chatMessages.sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
                offset += limit;
                renderChatMessages();
    
                if (offset === limit) {
                    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
                }
    
                loadingMessages = false;
            })
            .catch(error => {
                console.error("Error loading chat history:", error);
                loadingMessages = false;
            });
    }
    
    


    /**
     * Render chat messages in the chat container.
     * @param {boolean} scrollToBottom - Whether to scroll to the bottom after rendering.
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
     * Handle sending a new message.
     */
    function handleSendMessage() {
        if (!selectedUser) {
            console.error("No user selected for chat. selectedUser is:", selectedUser);
            return;
        }
    
        const messageContent = newMessageInput.value.trim();
        if (messageContent && ws && ws.readyState === WebSocket.OPEN) {
            if (!selectedUser.online) {
                displaySystemMessage("Cannot send message. The user is offline.");
                return;
            }
    
            const messageObj = {
                content: messageContent,
                receiver_id: selectedUser.id,
                sender_id: currentUserID,
                created_at: new Date().toISOString()
            };
    
            ws.send(JSON.stringify(messageObj));
            chatMessages.push(messageObj);
            renderChatMessages(true);
    
            newMessageInput.value = '';
        }
    }
    
    
    

    /**
     * Handle the back button to return to the user list view.
     */
    function handleBack() {
        selectedUser = null;
        cardTitle.textContent = 'User Online Status';
        chatView.classList.add('hidden');
        userListView.classList.remove('hidden');
    }

    /**
     * Handle infinite scrolling by loading more messages when scrolled to the top.
     */
    function handleScroll() {
        if (!selectedUser) {
            return;
        }
    
        if (chatMessagesContainer.scrollTop === 0 && !loadingMessages) {
            loadChatHistory();
        }
    }

    /**
     * Update the chat interface based on the selected user's online status.
     * Disables the message input and send button if the user is offline.
     */
    // static/js/chat.js

function updateChatInterface() {
    const offlineMessage = document.getElementById('chat-offline-message');
    if (selectedUser && !selectedUser.online) {
        newMessageInput.disabled = true;
        sendButton.disabled = true;
        sendButton.classList.add('opacity-50', 'cursor-not-allowed');
        offlineMessage.classList.remove('hidden');
    } else {
        newMessageInput.disabled = false;
        sendButton.disabled = false;
        sendButton.classList.remove('opacity-50', 'cursor-not-allowed');
        if (offlineMessage) {
            offlineMessage.classList.add('hidden');
        }
    }
}


    /**
 * Display system messages within the chat interface.
 * @param {string} content - The system message content to display.
 */
// static/js/chat.js

function displaySystemMessage(content) {
    const systemMessageDiv = document.createElement('div');
    systemMessageDiv.className = 'flex justify-center mb-4';
    systemMessageDiv.innerHTML = `
        <span class="text-sm text-red-500 italic">${content}</span>
    `;
    chatMessagesContainer.appendChild(systemMessageDiv);
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
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
 * Debounce function to limit the rate at which a function can fire.
 * Useful for optimizing performance on events like scrolling or resizing.
 * @param {Function} func - The function to debounce.
 * @param {number} wait - The delay in milliseconds.
 * @returns {Function} - The debounced function.
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

// Initialize the chat view when the chat page is loaded
document.addEventListener('DOMContentLoaded', function () {
    // Check if the current view is the chat view before initializing
    if (document.getElementById('chat-main-view')) {
        loadChatView();
    }
});
