// auth.js

function initAuth() {
    /**
     * Handle Login Form Submission
     */
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const username = document.getElementById('login-username').value.trim();
            const password = document.getElementById('login-password').value.trim();

            fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ username: username, password: password }),
            })
                .then(response => {
                    if (response.ok) {
                        window.history.replaceState({}, '', '/home');
                        handleRoute();
                    } else {
                        response.text().then(text => {
                            document.getElementById('login-error-message').textContent = 'Invalid Username or Password';
                        });
                    }
                })
                .catch(error => {
                    console.error('Error during login:', error);
                    document.getElementById('login-error-message').textContent = 'An error occurred during login.';
                });
        });

        // Toggle password visibility for login
        const loginShowPassword = document.getElementById('login-show-password');
        const loginPasswordInput = document.getElementById('login-password');
        loginShowPassword.addEventListener('change', function () {
            loginPasswordInput.type = loginShowPassword.checked ? 'text' : 'password';
        });

        // Link to Register Page
        const registerLink = document.getElementById('register-link');
        if (registerLink) {
            registerLink.addEventListener('click', function (event) {
                event.preventDefault();
                window.history.pushState({}, '', '/register');
                handleRoute();
            });
        }
    }

    /**
     * Handle Register Form Submission
     */
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const username = document.getElementById('register-username').value.trim();
            const email = document.getElementById('register-email').value.trim();
            const password = document.getElementById('register-password').value.trim();

            fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ username: username, email: email, password: password }),
            })
                .then(response => {
                    if (response.status === 201) {
                        // Successfully registered
                        window.history.replaceState({}, '', '/login');
                        handleRoute();
                    } else {
                        response.text().then(text => {
                            document.getElementById('register-error-message').textContent = text;
                        });
                    }
                })
                .catch(error => {
                    console.error('Error during registration:', error);
                    document.getElementById('register-error-message').textContent = 'An error occurred during registration.';
                });
        });

        // Toggle password visibility for registration
        const registerShowPassword = document.getElementById('register-show-password');
        const registerPasswordInput = document.getElementById('register-password');
        registerShowPassword.addEventListener('change', function () {
            registerPasswordInput.type = registerShowPassword.checked ? 'text' : 'password';
        });

        // Link to Login Page
        const loginLink = document.getElementById('login-link');
        if (loginLink) {
            loginLink.addEventListener('click', function (event) {
                event.preventDefault();
                window.history.pushState({}, '', '/login');
                handleRoute();
            });
        }
    }
}
