

function loadNewPostView() {
    // Ensure the user is authenticated before fetching categories
    checkAuth().then(isAuthenticated => {
        if (isAuthenticated) {
            fetch('/api/categories', { method: 'GET', credentials: 'include' })
                .then(response => {
                    if (response.status === 401) {
                        // User is not authenticated
                        window.history.replaceState({}, '', '/login');
                        showView('login-view');
                        throw new Error('Unauthorized');
                    }
                    if (!response.ok) {
                        throw new Error('Failed to fetch categories');
                    }
                    return response.json();
                })
                .then(categories => {
                    renderNewPostCategories(categories);
                })
                .catch(error => {
                    console.error('Error loading categories:', error);
                    const categoriesDiv = document.getElementById('new-post-categories');
                    if (categoriesDiv) {
                        categoriesDiv.innerHTML = '<p class="text-red-500">Error loading categories.</p>';
                    }
                });
        } else {
            window.history.replaceState({}, '', '/login');
            showView('login-view');
        }
    });

    // Set up event listener for create new post form
    const createNewPostForm = document.getElementById('create-new-post-form');
    if (createNewPostForm) {
        createNewPostForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const title = document.getElementById('new-post-title').value.trim();
            const content = document.getElementById('new-post-content').value.trim();
            const selectedCategories = Array.from(document.querySelectorAll('#new-post-categories input[type="checkbox"]:checked'))
                .map(checkbox => checkbox.value);

            if (!title || !content || selectedCategories.length === 0) {
                document.getElementById('create-new-post-error').textContent = 'All fields are required and at least one category must be selected.';
                return;
            }

            fetch('/api/post', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    title: title,
                    content: content,
                    categories: selectedCategories
                }),
            })
                .then(response => {
                    if (response.status === 401) {
                        // User is not authenticated
                        window.history.replaceState({}, '', '/login');
                        showView('login-view');
                        throw new Error('Unauthorized');
                    }
                    if (response.status === 201) {
                        // Successfully created post
                        createNewPostForm.reset();
                        window.history.pushState({}, '', '/home');
                        handleRoute();
                    } else {
                        response.text().then(text => {
                            document.getElementById('create-new-post-error').textContent = 'Failed to create post: ' + text;
                        });
                    }
                })
                .catch(error => {
                    console.error('Error creating post:', error);
                    document.getElementById('create-new-post-error').textContent = 'An error occurred while creating the post.';
                });
        });
    }

    // Handle Back to Home Button in New Post View
    const backToHomeFromNewPostBtn = document.getElementById('back-to-home-from-new-post');
    if (backToHomeFromNewPostBtn) {
        backToHomeFromNewPostBtn.addEventListener('click', function (event) {
            event.preventDefault();
            window.history.pushState({}, '', '/home');
            handleRoute();
        });
    }
}

function renderNewPostCategories(categories) {
    const categoriesDiv = document.getElementById('new-post-categories');
    if (!categoriesDiv) {
        console.warn('New post categories container not found.');
        return;
    }
    categoriesDiv.innerHTML = '';

    categories.forEach(category => {
        const label = document.createElement('label');
        label.className = 'flex items-center space-x-1';
        label.innerHTML = `
            <input type="checkbox" value="${category.id}" class="form-checkbox h-4 w-4 text-blue-600">
            <span>${category.name}</span>
        `;
        categoriesDiv.appendChild(label);
    });
}
