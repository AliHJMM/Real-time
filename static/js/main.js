// main.js

document.addEventListener('DOMContentLoaded', function () {
    handleRoute();
    initAuth();

    window.addEventListener('popstate', handleRoute);

    // Logout Handler
    document.addEventListener('click', function (event) {
        if (event.target.closest('a[href="/logout"]')) {
            event.preventDefault();
            handleLogout();
            event.stopPropagation(); // Prevent the event from reaching other handlers
        }
    });

    // Navigation Handler
    document.body.addEventListener('click', function (e) {
        const target = e.target;
        if (
            target.tagName === 'A' &&
            target.getAttribute('href').startsWith('/') &&
            target.getAttribute('href') !== '/logout' // Exclude the logout link
        ) {
            e.preventDefault();
            const href = target.getAttribute('href');
            window.history.pushState({}, '', href);
            handleRoute();
        }
    });
});

function handleLogout() {
    fetch('/api/logout', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
    })
        .then(response => {
            console.log('Logout response:', response);
            if (response.ok) {
                console.log('Logout successful');
                window.history.replaceState({}, '', '/login');
                setTimeout(handleRoute, 100);
            } else {
                console.error('Logout failed.');
            }
        })
        .catch(error => {
            console.error('Error during logout:', error);
        });
}
