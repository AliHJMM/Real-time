// static/js/views.js

function showView(viewId) {
    // Hide all views
    document.querySelectorAll('.view').forEach(function (view) {
        view.style.display = 'none';
    });
    // Show the selected view
    const selectedView = document.getElementById(viewId);
    if (selectedView) {
        selectedView.style.display = 'block';
    } else {
        console.error(`View "${viewId}" not found.`);
    }
}

function showNavBar() {
    const navbarLinks = document.getElementById('navbar-links');
    navbarLinks.innerHTML = '';

    navbarLinks.innerHTML = `
        <a href="/profile" class="text-gray-700 hover:text-blue-600">Profile</a>
        <a href="/new-post" class="text-gray-700 hover:text-blue-600">New Post</a>
        <a href="/chat" class="text-gray-700 hover:text-blue-600">Chat</a> <!-- New Chat Link -->
        <a href="/logout" class="text-gray-700 hover:text-blue-600">Logout</a>
    `;
}
