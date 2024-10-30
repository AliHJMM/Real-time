// static/js/main.js

document.addEventListener('DOMContentLoaded', function () {
    
    // Initialize the app
    handleRoute();

    // Initialize authentication handlers
    initAuth();

    // Set up event listeners
    window.addEventListener('popstate', handleRoute );

    // Use event delegation to capture clicks on dynamically added elements
    document.addEventListener('click', function (event) {
        if (event.target.closest('a[href="/logout"]')) {
            event.preventDefault();
            handleLogout();
        }
    });

    // Handle navigation clicks without reloading the page
    document.body.addEventListener('click', function (e) {
        if (e.target.tagName === 'A' && e.target.getAttribute('href').startsWith('/')) {
            e.preventDefault();
            const href = e.target.getAttribute('href');
            window.history.pushState({}, '', href);
            handleRoute();
        }
    });
   

});

/**
 * Function to handle logout
 */
function handleLogout() {
    console.log('Logout initiated');
    fetch('/api/logout', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store', // Ensure the request is not cached
    })
    .then(response => {
        console.log('Logout response:', response);
        if (response.ok) {
            console.log('Logout successful');
            window.history.replaceState({}, '', '/login');
            // Delay the authentication check slightly to ensure session invalidation
            setTimeout(handleRoute, 100);
        } else {
            console.error('Logout failed.');
        }
    })
    .catch(error => {
        console.error('Error during logout:', error);
    });
}
