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
  let typingTimeout = null;
  let isTyping = false;

  const usersList = document.getElementById("chat-users-list");
  const searchInput = document.getElementById("chat-search-input");
  const searchButton = document.getElementById("chat-search-button");
  const onlineCount = document.getElementById("chat-online-count");
  const onlineText = document.getElementById("chat-online-text");
  const userListView = document.getElementById("chat-user-list-view");
  const chatView = document.getElementById("chat-conversation-view");
  const cardTitle = document.getElementById("chat-card-title");
  const backButton = document.getElementById("chat-back-button");
  const chatMessagesContainer = document.getElementById("chat-messages");
  const newMessageInput = document.getElementById("chat-new-message-input");
  const sendButton = document.getElementById("chat-send-button");
  const charCount = document.getElementById("chat-char-count");
  let typingIndicatorElement = null; // Will be created dynamically

  // Initialize the chat by fetching current user ID and users list
  fetchCurrentUserID().then(() => {
    fetchUsers();
    setupWebSocket();
  });

  // Periodically fetch users to update their online status every 5 seconds
  setInterval(fetchUsers, 5000);

  function fetchCurrentUserID() {
    return fetch("/api/profile", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }
        return response.json();
      })
      .then((data) => {
        currentUserID = data.userID;
        console.log("Current User ID:", currentUserID);
      })
      .catch((error) => {
        console.error("Error fetching current user ID:", error);
        // Optionally, redirect to login if fetching profile fails
        window.history.replaceState({}, "", "/login");
        showView("login-view");
      });
  }

  /**
   * Fetch the list of online users from the server.
   */
  function fetchUsers() {
    fetch("/api/online_users", {
      method: "GET",
      credentials: "include",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch online users");
        }
        return response.json();
      })
      .then((data) => {
        users = data.users;
        renderUsers();
        // Update selectedUser's online status if a chat is open
        if (selectedUser) {
          const updatedUser = users.find((user) => user.id === selectedUser.id);
          if (updatedUser) {
            selectedUser.online = updatedUser.online;
          } else {
            selectedUser.online = false;
          }
          updateChatInterface();
        }
      })
      .catch((error) => {
        console.error("Error fetching users:", error);
      });
  }

  /**
   * Setup the WebSocket connection for real-time chat.
   */
  function setupWebSocket() {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onopen = function () {
      console.log("WebSocket connection established");
    };

    ws.onmessage = function (event) {
      console.log("WebSocket message received:", event.data);
      const message = JSON.parse(event.data);

      if (message.type === "typing" || message.type === "stop_typing") {
        handleTypingNotification(message);
        return;
      }

      // If message is for the currently selected user, display it
      if (
        selectedUser &&
        (message.sender_id === selectedUser.id ||
          message.receiver_id === selectedUser.id)
      ) {
        chatMessages.push(message);

        // **Hide typing indicator when a new message is received from the selected user**
        if (message.sender_id === selectedUser.id) {
          hideTypingIndicator();
        }

        renderChatMessages(true); // true to scroll to bottom on new message
      } else {
        // Show notification for messages from other users
        if (message.receiver_id == currentUserID) {
          showNotification(message);
        }
      }
    };

    ws.onclose = function (event) {
      console.log("WebSocket connection closed:", event);
      console.log("Attempting to reconnect in 5 seconds...");
      setTimeout(setupWebSocket, 5000); // Retry after 5 seconds
    };

    ws.onerror = function (error) {
      console.error("WebSocket error:", error);
    };
  }

  /**
   * Handles typing notifications received from the server.
   * @param {Object} message - The typing message object.
   */
  function handleTypingNotification(message) {
    if (!selectedUser || message.sender_id !== selectedUser.id) {
      return;
    }

    if (message.type === "typing") {
      showTypingIndicator(selectedUser.username || "User");
    } else if (message.type === "stop_typing") {
      hideTypingIndicator();
    }
  }

  /**
   * Displays the typing indicator.
   * @param {string} username - The name of the user who is typing.
   */
  function showTypingIndicator(username) {
    if (!typingIndicatorElement) {
      typingIndicatorElement = document.createElement("div");
      typingIndicatorElement.className =
        "flex items-center mb-4 typing-indicator";
      typingIndicatorElement.innerHTML = `
               <div class="typing-indicator max-w-[70%] p-3 rounded-lg bg-gray-200">
                     <div class="flex items-center space-x-2">
                      <p class="text-sm text-gray-500 italic">${username} is typing...</p>
                        <div class="dot-container flex space-x-1">
                          <span class="dot bg-gray-500"></span>
                        <span class="dot bg-gray-500"></span>
                       <span class="dot bg-gray-500"></span>
                    </div>
                  </div>
            </div>
            `;
      chatMessagesContainer.appendChild(typingIndicatorElement);
      chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    }
  }

  /**
   * Hides the typing indicator.
   */
  function hideTypingIndicator() {
    if (typingIndicatorElement) {
      chatMessagesContainer.removeChild(typingIndicatorElement);
      typingIndicatorElement = null;
    }
  }

  /**
   * Displays a desktop notification for a new message.
   * @param {Object} message - The message object containing details about the new message.
   */
  function showNotification(message) {
    // Check if notifications are permitted
    if (Notification.permission === "granted") {
      // Optional: Check if the page is visible
      if (document.hidden) {
        const notification = new Notification(
          `New message from ${message.sender_name || "Someone"}`,
          {
            body: message.content || "You have a new message.",
            // Optional: Add an icon
            icon: "/static/images/notification-icon.png", // Replace with your icon path
            // Optional: Add a click handler to focus the window
          }
        );

        notification.onclick = function () {
          window.focus();
          this.close();
        };
      }
    }
  }

  /**
   * Render the list of users in the chat interface.
   */
  function renderUsers() {
    usersList.innerHTML = "";
    const searchTerm = searchInput.value.toLowerCase();
    filteredUsers = users.filter(
      (user) =>
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

    filteredUsers.forEach((user) => {
      const li = document.createElement("li");
      li.className = `flex items-center space-x-4 p-3 bg-white rounded-lg shadow-sm transition-all duration-200 cursor-pointer ${
        user.online ? "" : "opacity-50"
      }`;

      // Allow clicking on offline users to view chat history
      li.addEventListener("click", () => handleUserClick(user));

      // Avatar
      const avatarDiv = document.createElement("div");
      avatarDiv.className = "h-12 w-12 relative";
      const avatarImg = document.createElement("img");
      avatarImg.src = "https://via.placeholder.com/80";
      avatarImg.alt = user.username;
      avatarImg.className = "h-12 w-12 rounded-full";
      avatarDiv.appendChild(avatarImg);

      // User Info
      const userInfo = document.createElement("div");
      userInfo.className = "flex-grow";
      const nameP = document.createElement("p");
      nameP.className = "font-semibold text-sky-800";
      nameP.textContent = user.username;
      const statusP = document.createElement("p");
      statusP.className = "text-sm text-gray-500";
      if (user.online) {
        statusP.textContent = "Active now";
      } else if (user.lastMessageTime) {
        const lastActiveDate = new Date(user.lastMessageTime * 1000);
        statusP.textContent = `Last active on ${lastActiveDate.toLocaleDateString()} at ${lastActiveDate.toLocaleTimeString(
          [],
          { hour: "2-digit", minute: "2-digit" }
        )}`;
      } else {
        statusP.textContent = "Offline";
      }
      userInfo.appendChild(nameP);
      userInfo.appendChild(statusP);

      // Badge
      const badge = document.createElement("span");
      badge.className = `ml-auto px-2 py-1 text-xs font-medium rounded-full ${
        user.online
          ? "bg-green-100 text-green-800"
          : "bg-gray-100 text-gray-800"
      }`;
      badge.textContent = user.online ? "Online" : "Offline";

      li.appendChild(avatarDiv);
      li.appendChild(userInfo);
      li.appendChild(badge);
      usersList.appendChild(li);
    });

    const onlineUsersCount = users.filter(
      (user) => user.online && user.id !== currentUserID
    ).length;
    if (onlineCount) {
      onlineCount.textContent = onlineUsersCount;
    }
    if (onlineText) {
      onlineText.textContent = onlineUsersCount !== 1 ? "s" : "";
    }
  }

  /**
   * Handle search functionality to filter users.
   */
  function handleSearch() {
    renderUsers();
  }

  function handleUserClick(user) {
    selectedUser = user;
    cardTitle.textContent = `Chat with ${user.username}`;
    userListView.classList.add("hidden");
    chatView.classList.remove("hidden");
    chatMessages = [];
    chatMessagesContainer.innerHTML = "";
    offset = 0;
    allMessagesLoaded = false;
    loadChatHistory();

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

    fetch(
      `/api/chat_history?user_id=${selectedUser.id}&limit=${limit}&offset=${offset}`,
      {
        method: "GET",
        credentials: "include",
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch chat history");
        }
        return response.json();
      })
      .then((messages) => {
        if (messages.length < limit) {
          allMessagesLoaded = true;
        }
        chatMessages = messages.concat(chatMessages);
        chatMessages.sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );
        offset += limit;
        renderChatMessages();

        if (offset === limit) {
          chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
        }

        loadingMessages = false;
      })
      .catch((error) => {
        console.error("Error loading chat history:", error);
        loadingMessages = false;
      });
  }

  function insertLineBreaks(text, maxChars) {
    const regex = new RegExp(`.{1,${maxChars}}`, "g");
    return text.match(regex).join("<br>");
  }

  function renderChatMessages(scrollToBottom = false) {
    chatMessagesContainer.innerHTML = "";
    chatMessages.forEach((message) => {
      const messageDiv = document.createElement("div");
      messageDiv.className = `flex ${
        message.sender_id === currentUserID ? "justify-end" : "justify-start"
      } mb-4`;

      const messageBubble = document.createElement("div");
      messageBubble.className = `max-w-[70%] p-3 rounded-lg ${
        message.sender_id === currentUserID
          ? "bg-sky-500 text-white"
          : "bg-gray-200"
      } message-content`; // Added 'message-content' class

      const senderP = document.createElement("p");
      senderP.className = "text-sm font-semibold mb-1";
      senderP.textContent =
        message.sender_id === currentUserID ? "You" : selectedUser.username;

      const contentP = document.createElement("p");
      contentP.className = "message-text";
      contentP.innerHTML = insertLineBreaks(message.content, 15);

      const timeP = document.createElement("p");
      timeP.className = "text-xs text-right mt-1 opacity-70";
      const date = new Date(message.created_at);
      timeP.textContent = `${date.toLocaleDateString()} ${date.toLocaleTimeString(
        [],
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      )}`;

      messageBubble.appendChild(senderP);
      messageBubble.appendChild(contentP);
      messageBubble.appendChild(timeP);
      messageDiv.appendChild(messageBubble);
      chatMessagesContainer.appendChild(messageDiv);
    });

    // If typing indicator is active, re-add it at the end
    if (typingIndicatorElement) {
      chatMessagesContainer.appendChild(typingIndicatorElement);
    }

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
      console.error("No user selected for chat.");
      return;
    }

    const messageContent = newMessageInput.value.trim();
    if (messageContent.length === 0) {
      displaySystemMessage("Cannot send an empty message.");
      return;
    }

    if (messageContent.length > 50) {
      displaySystemMessage("Message cannot exceed 50 characters.");
      return;
    }

    if (messageContent && ws && ws.readyState === WebSocket.OPEN) {
      if (!selectedUser.online) {
        displaySystemMessage("Cannot send message. The user is offline.");
        return;
      }

      const messageObj = {
        type: "message",
        content: messageContent,
        receiver_id: selectedUser.id,
        sender_id: currentUserID,
        created_at: new Date().toISOString(),
      };

      // Send the message to the server
      
      ws.send(JSON.stringify(messageObj));

      // Clear the input and stop "typing" status
      newMessageInput.value = "";
      stopTyping();
    }
  }

  /**
   * Handle the back button to return to the user list view.
   */
  function handleBack() {
    selectedUser = null;
    newMessageInput.value = "";
    cardTitle.textContent = "User Online Status";
    chatView.classList.add("hidden");
    userListView.classList.remove("hidden");
    hideTypingIndicator();
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
  function updateChatInterface() {
    const offlineMessage = document.getElementById("chat-offline-message");
    if (selectedUser && !selectedUser.online) {
      newMessageInput.disabled = true;
      sendButton.disabled = true;
      sendButton.classList.add("opacity-50", "cursor-not-allowed");
      offlineMessage.classList.remove("hidden");
    } else {
      newMessageInput.disabled = false;
      sendButton.disabled = false;
      sendButton.classList.remove("opacity-50", "cursor-not-allowed");
      if (offlineMessage) {
        offlineMessage.classList.add("hidden");
      }
    }
  }

  /**
   * Display a system message in the chat.
   * @param {string} content - The content of the system message.
   */
  function displaySystemMessage(content) {
    const systemMessageDiv = document.createElement("div");
    systemMessageDiv.className = "flex justify-center mb-4";
    systemMessageDiv.innerHTML = `
            <span class="text-sm text-red-500 italic">${content}</span>
        `;
    chatMessagesContainer.appendChild(systemMessageDiv);
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
  }

  /**
   * Send typing notification to the server.
   */
  function sendTypingNotification() {
    if (ws && ws.readyState === WebSocket.OPEN && selectedUser && !isTyping) {
      const typingMessage = {
        type: "typing",
        receiver_id: selectedUser.id,
        sender_id: currentUserID,
      };
      ws.send(JSON.stringify(typingMessage));
      isTyping = true;
    }
  }

  /**
   * Send stop typing notification to the server.
   */
  function stopTyping() {
    if (ws && ws.readyState === WebSocket.OPEN && selectedUser && isTyping) {
      const stopTypingMessage = {
        type: "stop_typing",
        receiver_id: selectedUser.id,
        sender_id: currentUserID,
      };
      ws.send(JSON.stringify(stopTypingMessage));
      isTyping = false;
    }
  }

  /**
   * Handle typing events to send typing notifications.
   */
  function handleTyping() {
    sendTypingNotification();

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      stopTyping();
    }, 500); 
  }

  // Event Listeners
  searchButton.addEventListener("click", handleSearch);
  searchInput.addEventListener("input", handleSearch);
  backButton.addEventListener("click", handleBack);
  sendButton.addEventListener("click", handleSendMessage);
  newMessageInput.addEventListener("keypress", (e) => {


  });
  newMessageInput.addEventListener("input", function () {
    handleTyping();
    const remaining = 50 - newMessageInput.value.length;
    charCount.textContent = `${remaining} character${
      remaining !== 1 ? "s" : ""
    } remaining`;
  });
  chatMessagesContainer.addEventListener("scroll", debounce(handleScroll, 300));

  // Initial Render
  renderUsers();
}

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
document.addEventListener("DOMContentLoaded", function () {
  // Check if the current view is the chat view before initializing
  if (document.getElementById("chat-main-view")) {
    loadChatView();
  }
});
