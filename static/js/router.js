// static/js/router.js

function handleRoute() {
    console.log('Handling route:', window.location.pathname);
    const path = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('post_id');

    checkAuth().then(isAuthenticated => {
        console.log('User is authenticated:', isAuthenticated);

        if (!isAuthenticated && path !== '/login' && path !== '/register') {
            // Redirect to login if not authenticated
            console.log('Redirecting to login view');
            window.history.replaceState({}, '', '/login');
            showView('login-view');
        } else if (isAuthenticated && (path === '/login' || path === '/register')) {
            // Redirect authenticated users away from login/register
            console.log('Already authenticated, redirecting to home');
            window.history.replaceState({}, '', '/home');
            showView('home-view');
            loadHome();
        } else {
            // Handle different routes for authenticated users
            switch (path) {
                case '/login':
                    showView('login-view');
                    break;
                case '/register':
                    showView('register-view');
                    break;
                case '/':
                case '/home':
                    showView('home-view');
                    loadHome();
                    break;
                case '/post-details':
                    if (postId) {
                        showView('post-details-view');
                        loadPostDetails(postId); // Load details for specific post
                    } else {
                        console.warn('Invalid post ID');
                        window.history.replaceState({}, '', '/home');
                        handleRoute(); // Redirect to home on invalid post ID
                    }
                    break;
                case '/profile':
                    showView('profile-view');
                    loadProfile();
                    break;
                case '/new-post':
                    if (isAuthenticated) {
                        showView('new-post-view');
                        loadNewPostView();
                    } else {
                        console.warn('User not authenticated, redirecting to login');
                        window.history.replaceState({}, '', '/login');
                        showView('login-view');
                    }
                    break;
                case '/chat':
                    if (isAuthenticated) {
                        showView('chat-main-view');
                        loadChatView();
                    } else {
                        console.warn('User not authenticated, redirecting to login');
                        window.history.replaceState({}, '', '/login');
                        showView('login-view');
                    }
                    break;
                default:
                    // Redirect unknown routes to home
                    window.history.replaceState({}, '', '/home');
                    showView('home-view');
                    loadHome();
            }

            // Show navbar only after setting up the view
            showNavBar();
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
