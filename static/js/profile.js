// profile.js

function loadProfile() {
    fetch('/api/profile', { method: 'GET', credentials: 'include' })
        .then(response => {
            if (!response.ok) {
                throw new Error('Unauthorized');
            }
            return response.json();
        })
        .then(data => {
            // Set username
            const usernameSpan = document.getElementById('profile-username');
            if (usernameSpan) {
                usernameSpan.textContent = data.username;
            }

            // Render My Posts
            const myPostsContainer = document.getElementById('my-posts-container');
            if (myPostsContainer) {
                myPostsContainer.innerHTML = '';
                if (data.myPosts && data.myPosts.length > 0) {
                    data.myPosts.forEach(post => {
                        const postCard = createPostCard(post);
                        myPostsContainer.appendChild(postCard);
                    });
                } else {
                    myPostsContainer.innerHTML = '<p>No posts created by you.</p>';
                }
            }

            // Render Liked Posts
            const likedPostsContainer = document.getElementById('liked-posts-container');
            if (likedPostsContainer) {
                likedPostsContainer.innerHTML = '';
                if (data.likedPosts && data.likedPosts.length > 0) {
                    data.likedPosts.forEach(post => {
                        const postCard = createPostCard(post);
                        likedPostsContainer.appendChild(postCard);
                    });
                } else {
                    likedPostsContainer.innerHTML = '<p>No posts liked by you.</p>';
                }
            }
        })
        .catch(error => {
            console.error('Error loading profile:', error);
            alert('Failed to load profile.');
            // Redirect to login
            window.history.replaceState({}, '', '/login');
            showView('login-view');
        });
}
