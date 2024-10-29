// posts.js

function loadHome() {
  const urlParams = new URLSearchParams(window.location.search);
  const category = urlParams.get("category");

  fetch("/api/posts", { method: "GET", credentials: "include" })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch posts");
      }
      return response.json();
    })
    .then((data) => {
      console.log("API Response:", data);
      renderPosts(data.posts, category);
    })
    .catch((error) => {
      console.error("Error loading posts:", error);
      const postsContainer = document.getElementById("posts-container");
      if (postsContainer) {
          postsContainer.innerHTML = '<p class="text-red-500">Error loading posts.</p>';
      }
  });
  
}

function renderPosts(posts, category = null) {
  const postsContainer = document.getElementById("posts-container");
  if (!postsContainer) {
    console.warn("Posts container not found.");
    return;
  }
  postsContainer.innerHTML = "";

  let filteredPosts = posts;

  if (category && category !== "All") {
    filteredPosts = posts.filter((post) => {
      return post.postCategories.some((cat) => cat.name === category);
    });
  }

  if (filteredPosts.length > 0) {
    filteredPosts.forEach((post) => {
      const postCard = createPostCard(post);

      // Add click event to open the post details view with comments
      postCard.addEventListener("click", function() {
        // Update the URL to the post details view with the specific post_id
        window.history.pushState({}, '', `/post-details?post_id=${post.id}`);
        handleRoute(); // Call handleRoute to load the post details and comments
      });

      postsContainer.appendChild(postCard);
    });
  } else {
    postsContainer.innerHTML =
      "<p>No posts available for the selected category.</p>";
  }
}


function createPostCard(post) {
  const card = document.createElement("div");
  card.className = "bg-white shadow-md p-6 rounded-md card";
  card.setAttribute("data-post-id", post.id);

  const header = document.createElement("div");
  header.className = "flex items-center space-x-4 mb-2";
  header.innerHTML = `
   <img src="https://via.placeholder.com/40" alt="User Avatar" class="rounded-full h-10 w-10">
    <div>
        <h3 class="font-semibold text-lg text-sky-800"> ${post.title} </h3>
        <!-- Updated Paragraph with Username -->
        <p class="text-sky-600 text-sm">by <span class="font-semibold">${post.username}</span> • ${new Date(
            post.createdAt
          ).toLocaleString()}</p>
    </div>
    `;
    card.appendChild(header);


      // Post Info
  const postContent = document.createElement("p");
  postContent.className = "text-gray-600 mb-4";
  postContent.innerHTML = post.content;
  card.appendChild(postContent);

































 

  // Post Categories
  const categoriesDiv = document.createElement("div");
  categoriesDiv.className = "flex flex-wrap gap-2 mb-4";
  if (post.postCategories && post.postCategories.length > 0) {
    post.postCategories.forEach((category) => {
      const categoryLabel = document.createElement("span");
      categoryLabel.className =
        "bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs";
      categoryLabel.textContent = category.name;
      categoriesDiv.appendChild(categoryLabel);
    });
  } else {
    const noCategory = document.createElement("span");
    noCategory.className = "text-gray-500 text-xs";
    noCategory.textContent = "No Categories";
    categoriesDiv.appendChild(noCategory);
  }
  card.appendChild(categoriesDiv);

  // Post Reactions
  const reactionsDiv = document.createElement("div");
  reactionsDiv.className = "flex items-center space-x-4";
  let likeColor = post.reaction === 1 ? "text-blue-600" : "text-gray-600";
  let dislikeColor = post.reaction === 0 ? "text-red-600" : "text-gray-600";
  // Like Button
  const likeButton = document.createElement("button");
  likeButton.id = `like-button-${post.id}`; // Assign unique ID
  likeButton.className = `flex items-center space-x-1 ${likeColor} hover:text-blue-800`;
  likeButton.innerHTML = `<i class="fas fa-thumbs-up"></i><span id="like-count-${post.id}">${post.likeCount}</span>`;
  reactionsDiv.appendChild(likeButton);

  // Dislike Button
  const dislikeButton = document.createElement("button");
  dislikeButton.id = `dislike-button-${post.id}`; // Assign unique ID
  dislikeButton.className = `flex items-center space-x-1 ${dislikeColor} hover:text-red-800`;
  dislikeButton.innerHTML = `<i class="fas fa-thumbs-down"></i><span id="dislike-count-${post.id}">${post.dislikeCount}</span>`;
  reactionsDiv.appendChild(dislikeButton);

  // Add event listeners
  likeButton.addEventListener("click", function (event) {
    event.preventDefault();
    event.stopPropagation();
    handleLikeDislike(post.id, "like", "post");
    likeButton.classList.remove("text-blue-600");
    likeButton.classList.add("text-gray-600");
  });

  dislikeButton.addEventListener("click", function (event) {
    event.preventDefault();
    event.stopPropagation();
    handleLikeDislike(post.id, "dislike", "post");
    dislikeButton.classList.remove("text-red-600");
    dislikeButton.classList.add("text-gray-600");
  });

  card.appendChild(reactionsDiv);

  return card;
}

function handleLikeDislike(postId, action, type) {
  console.log(postId, "  ", action, "  ", type);
  const likeButton = document.getElementById(`like-button-${postId}`);
  const dislikeButton = document.getElementById(`dislike-button-${postId}`);
  const likeCount = document.getElementById(`like-count-${postId}`);
  const dislikeCount = document.getElementById(`dislike-count-${postId}`);

  // Check if buttons exist
  if (!likeButton || !dislikeButton || !likeCount || !dislikeCount) {
    console.error(`Buttons or count elements not found for post ID ${postId}`);
    return;
  }

  // Disable both buttons temporarily
  likeButton.disabled = true;
  dislikeButton.disabled = true;

  // Make the request to the server
  fetch(`/api/like_dislike`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials:"include",
    body: JSON.stringify({
      postId: parseInt(postId),
      action: action,
      type: type,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      // Re-enable buttons after response
      likeButton.disabled = false;
      dislikeButton.disabled = false;

      // Update counts based on the response
      likeCount.textContent = data.likeCount;
      dislikeCount.textContent = data.dislikeCount;

      // Reset styles for both buttons first
      likeButton.classList.remove("text-blue-500");
      dislikeButton.classList.remove("text-red-500");

      // Apply new styles based on the reaction
      if (data.action === "like") {
        likeButton.classList.add("text-blue-500"); // Highlight like button
        dislikeButton.classList.remove("text-red-500"); // Remove highlight from dislike button
      } else if (data.action === "dislike") {
        dislikeButton.classList.add("text-red-500"); // Highlight dislike button
        likeButton.classList.remove("text-blue-500"); // Remove highlight from like button
      } else if (data.action === "Delete") {
        likeButton.classList.remove("text-blue-500");
        dislikeButton.classList.remove("text-red-500");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      // Re-enable buttons if an error occurs
      likeButton.disabled = false;
      dislikeButton.disabled = false;
    });
}
