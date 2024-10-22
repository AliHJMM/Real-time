// static/js/chat.js

document.addEventListener('DOMContentLoaded', function () {
    // Initialize Chat View if the current view is Chat
    const currentView = document.querySelector('.view[style="display: block;"]');
    if (currentView && currentView.id === 'chat-main-view') {
        loadChatView();
    }
});

function loadChatView() {
    /**
     * Sample Users Data
     * In a real application, this data should be fetched from the server via an API.
     */
    const users = [
        { id: 1, name: "Alice Johnson", avatar: "https://via.placeholder.com/80", online: true, lastSeen: "Just now" },
        { id: 2, name: "Bob Smith", avatar: "https://via.placeholder.com/80", online: false, lastSeen: "5 minutes ago" },
        { id: 3, name: "Charlie Brown", avatar: "https://via.placeholder.com/80", online: true, lastSeen: "Just now" },
        { id: 4, name: "Diana Prince", avatar: "https://via.placeholder.com/80", online: false, lastSeen: "1 hour ago" },
        { id: 5, name: "Ethan Hunt", avatar: "https://via.placeholder.com/80", online: true, lastSeen: "Just now" },
        { id: 6, name: "Fiona Gallagher", avatar: "https://via.placeholder.com/80", online: false, lastSeen: "2 days ago" },
        { id: 7, name: "George Lucas", avatar: "https://via.placeholder.com/80", online: true, lastSeen: "Just now" },
        { id: 8, name: "Hannah Montana", avatar: "https://via.placeholder.com/80", online: false, lastSeen: "1 week ago" },
    ];

    let filteredUsers = [...users];
    let selectedUser = null;
    let chatMessages = [];

    // DOM Elements (IDs prefixed with 'chat-')
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

    /**
     * Render the list of users
     */
    function renderUsers() {
        usersList.innerHTML = '';
        filteredUsers.forEach(user => {
            const li = document.createElement('li');
            li.className = `flex items-center space-x-4 p-3 bg-white rounded-lg shadow-sm transition-all duration-200 hover:shadow-md ${user.online ? 'cursor-pointer' : ''}`;
            if (user.online) {
                li.addEventListener('click', () => handleUserClick(user));
            }

            // Avatar
            const avatarDiv = document.createElement('div');
            avatarDiv.className = 'h-12 w-12 relative';
            const avatarImg = document.createElement('img');
            avatarImg.src = user.avatar;
            avatarImg.alt = user.name;
            avatarImg.className = 'h-12 w-12 rounded-full';
            avatarDiv.appendChild(avatarImg);

            // User Info
            const userInfo = document.createElement('div');
            userInfo.className = 'flex-grow';
            const nameP = document.createElement('p');
            nameP.className = 'font-semibold text-sky-800';
            nameP.textContent = user.name;
            const statusP = document.createElement('p');
            statusP.className = 'text-sm text-gray-500';
            statusP.textContent = user.online ? 'Active now' : `Last seen: ${user.lastSeen}`;
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
        const onlineUsers = filteredUsers.filter(user => user.online).length;
        onlineCount.textContent = onlineUsers;
        onlineText.textContent = onlineUsers !== 1 ? 's' : '';
    }

    /**
     * Handle Search Functionality
     */
    function handleSearch() {
        const term = searchInput.value.toLowerCase();
        filteredUsers = users.filter(user => user.name.toLowerCase().includes(term));
        renderUsers();
    }

    /**
     * Handle User Click to Open Chat
     */
    function handleUserClick(user) {
        if (user.online) {
            selectedUser = user;
            cardTitle.textContent = `Chat with ${user.name}`;
            userListView.classList.add('hidden');
            chatView.classList.remove('hidden');
            // Initialize Chat Messages (In real app, fetch from server)
            chatMessages = [
                { id: 1, sender: user.name, content: "Hey there!", time: "2:30 PM" },
                { id: 2, sender: "You", content: "Hi! How are you?", time: "2:31 PM" },
                { id: 3, sender: user.name, content: "I'm good, thanks! How about you?", time: "2:32 PM" },
            ];
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
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
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
