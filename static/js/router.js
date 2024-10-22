// static/js/router.js

function handleRoute() {
    console.log('Handling route:', window.location.pathname);
    const path = window.location.pathname;
    checkAuth().then(isAuthenticated => {
        console.log('User is authenticated:', isAuthenticated);
        if (!isAuthenticated && path !== '/login' && path !== '/register') {
            // Redirect to login page if not authenticated
            console.log('Redirecting to login view');
            window.history.replaceState({}, '', '/login');
            showView('login-view');
        } else if (isAuthenticated && (path === '/login' || path === '/register')) {
            // If already authenticated, redirect away from login/register
            console.log('Already authenticated, redirecting to home');
            window.history.replaceState({}, '', '/home');
            showView('home-view');
            loadHome();
        } else {
            if (path === '/login') {
                showView('login-view');
            } else if (path === '/register') {
                showView('register-view');
            } else if (path === '/' || path === '/home') {
                showView('home-view');
                loadHome();
            } else if (path.startsWith('/post-details')) {
                showView('post-details-view');
                const urlParams = new URLSearchParams(window.location.search);
                const postId = urlParams.get('post_id');
                if (postId) {
                    loadPostDetails(postId);
                } else {
                    alert('Invalid post ID');
                    window.history.pushState({}, '', '/home');
                    handleRoute();
                }
            } else if (path === '/profile') {
                showView('profile-view');
                loadProfile();
            } else if (path === '/new-post') {
                // Ensure the user is authenticated before accessing new-post view
                if (isAuthenticated) {
                    showView('new-post-view');
                    loadNewPostView();
                } else {
                    // Redirect to login if not authenticated
                    console.log('User not authenticated, redirecting to login view');
                    window.history.replaceState({}, '', '/login');
                    showView('login-view');
                }
            } else if (path === '/chat') {
                // Handle Chat View
                if (isAuthenticated) {
                    showView('chat-main-view');
                    loadChatView(); // Load the chat view from chat.js
                } else {
                    // Redirect to login if not authenticated
                    console.log('User not authenticated, redirecting to login view');
                    window.history.replaceState({}, '', '/login');
                    showView('login-view');
                }
            } else {
                // Default to home view
                window.history.replaceState({}, '', '/home');
                showView('home-view');
                loadHome();
            }
            showNavBar(); // Update navbar based on login status
        }
    });
}

function checkAuth() {
    return fetch('/api/profile', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store', // Ensure the request is not cached
    })
    .then(response => {
        console.log('checkAuth response:', response);
        return response.ok;
    })
    .catch((error) => {
        console.error('Error checking authentication:', error);
        return false;
    });
}
