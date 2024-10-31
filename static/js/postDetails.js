
function loadPostDetails(postId) {
    fetch(`/api/post?post_id=${postId}`, { method: 'GET', credentials: 'include' })
        .then(response => {
            if (response.status === 401) {
                // User is not authenticated
                window.history.replaceState({}, '', '/login');
                showView('login-view');
                throw new Error('Unauthorized');
            }
            if (!response.ok) {
                throw new Error('Failed to fetch post details');
            }
            return response.json();
        })
        .then(data => {
            // Set post details
            const title = document.getElementById('post-details-title');
            const info = document.getElementById('post-details-info');
            const content = document.getElementById('post-details-content');
            const categoriesDiv = document.getElementById('post-details-categories');

            if (title) title.textContent = data.post.title;
            if (info) info.textContent = `By ${data.username} on ${new Date(data.post.created_at).toLocaleString()}`;
            if (content) content.textContent = data.post.content;

            // Render Comments
            const commentsContainer = document.getElementById('comments-container');
            if (commentsContainer) {
                commentsContainer.innerHTML = '';
                if (data.comments && data.comments.length > 0) {
                    data.comments.forEach(comment => {
                        const commentDiv = document.createElement('div');
                        commentDiv.className = 'bg-gray-100 p-4 rounded';
                        commentDiv.innerHTML = `
                            <p class="font-semibold">${comment.username} <span class="text-gray-600 text-sm">on ${new Date(comment.createdAt).toLocaleString()}</span></p>
                            <p class="post-content">${comment.content}</p>
                        `;
                        commentsContainer.appendChild(commentDiv);
                    });
                } else {
                    commentsContainer.innerHTML = '<p>No comments yet.</p>';
                }
            }

            // Handle Add Comment Form Submission
            const addCommentForm = document.getElementById('add-comment-form');
            if (addCommentForm) {
                addCommentForm.onsubmit = function (e) {
                    e.preventDefault();
                    const contentInput = document.getElementById('comment-content');
                    const errorMessage = document.getElementById('add-comment-error');
                    const content = contentInput.value.trim();

                    if (content === '') {
                        errorMessage.textContent = 'Comment cannot be empty.';
                        return;
                    }

                    fetch('/api/add_comment', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ content: content, post_id: parseInt(postId) }),
                    })
                        .then(response => {
                            if (response.status === 401) {
                                // User is not authenticated
                                window.history.replaceState({}, '', '/login');
                                showView('login-view');
                                throw new Error('Unauthorized');
                            }
                            if (response.ok) {
                                // Reload post details to show the new comment
                                loadPostDetails(postId);
                                // Clear the comment form
                                addCommentForm.reset();
                                errorMessage.textContent = '';
                            } else {
                                response.text().then(text => {
                                    errorMessage.textContent = 'Failed to add comment: ' + text;
                                });
                            }
                        })
                        .catch(error => {
                            console.error('Error adding comment:', error);
                            errorMessage.textContent = 'An error occurred while adding the comment.';
                        });
                };
            }

            // Handle Back to Home Button in Post Details View
            const backToHomeFromPostDetailsBtn = document.getElementById('back-to-home-from-post-details');
            if (backToHomeFromPostDetailsBtn) {
                backToHomeFromPostDetailsBtn.addEventListener('click', function (event) {
                    event.preventDefault();
                    window.history.pushState({}, '', '/home');
                    handleRoute();
                });
            }
        })
        .catch(error => {
            console.error('Error loading post details:', error);
            window.history.pushState({}, '', '/error');
            handleRoute();
        });
}
