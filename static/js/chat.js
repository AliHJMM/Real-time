// static/js/chat.js

function loadChatView() {
    let users = [];
    let currentUserID = null;
    let filteredUsers = [];

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

    let selectedUser = null;
    let chatMessages = [];

    // Fetch Current User ID and Users
    fetchCurrentUserID().then(() => {
        fetchUsers();
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
            })
            .catch(error => {
                console.error('Error fetching users:', error);
            });
    }

    /**
     * Render the list of users
     */
    function renderUsers() {
        usersList.innerHTML = '';
        const searchTerm = searchInput.value.toLowerCase();
        filteredUsers = users.filter(user => user.id !== currentUserID && user.username.toLowerCase().includes(searchTerm));

        filteredUsers.forEach(user => {
            const li = document.createElement('li');
            li.className = `flex items-center space-x-4 p-3 bg-white rounded-lg shadow-sm transition-all duration-200 ${user.online ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`;

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
            badge.className = `ml-auto px-2 py-1 text-xs font-medium rounded-full ${user.online ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`;
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
        if (user.online) {
            selectedUser = user;
            cardTitle.textContent = `Chat with ${user.username}`;
            userListView.classList.add('hidden');
            chatView.classList.remove('hidden');
            // Initialize Chat Messages (In real app, fetch from server)
            chatMessages = [];
            renderChatMessages();
        }
    }

    /**
     * Render Chat Messages
     */
    function renderChatMessages() {
        chatMessagesContainer.innerHTML = '';
        chatMessages.forEach(message => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `flex ${message.sender === "You" ? "justify-end" : "justify-start"} mb-4`;

            const messageBubble = document.createElement('div');
            messageBubble.className = `max-w-[70%] p-3 rounded-lg ${message.sender === "You" ? "bg-sky-500 text-white" : "bg-gray-200"}`;

            const senderP = document.createElement('p');
            senderP.className = 'text-sm font-semibold mb-1';
            senderP.textContent = message.sender;

            const contentP = document.createElement('p');
            contentP.textContent = message.content;

            const timeP = document.createElement('p');
            timeP.className = 'text-xs text-right mt-1 opacity-70';
            timeP.textContent = message.time;

            messageBubble.appendChild(senderP);
            messageBubble.appendChild(contentP);
            messageBubble.appendChild(timeP);
            messageDiv.appendChild(messageBubble);
            chatMessagesContainer.appendChild(messageDiv);
        });

        // Scroll to bottom
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    }

    /**
     * Handle Sending a New Message
     */
    function handleSendMessage() {
        const message = newMessageInput.value.trim();
        if (message) {
            const newMsg = {
                id: chatMessages.length + 1,
                sender: "You",
                content: message,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            chatMessages.push(newMsg);
            renderChatMessages();
            newMessageInput.value = '';
        }
    }

    /**
     * Handle Back Button to Return to User List
     */
    function handleBack() {
        selectedUser = null;
        cardTitle.textContent = "User Online Status";
        chatView.classList.add('hidden');
        userListView.classList.remove('hidden');
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

    // Initial Render
    renderUsers();
}
