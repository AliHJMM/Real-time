
function initAuth() {
   
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const username = document.getElementById('login-username').value.trim();
            const password = document.getElementById('login-password').value.trim();

            // Frontend Validation
            const errorMessage = document.getElementById('login-error-message');
            errorMessage.textContent = ''; // Clear previous errors

            if (username.length > 30) {
                errorMessage.textContent = 'Username or Email cannot exceed 30 characters.';
                return;
            }

            if (password.length > 20) {
                errorMessage.textContent = 'Password cannot exceed 20 characters.';
                return;
            }

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
                        return response.text().then(text => {
                            errorMessage.textContent = 'Invalid Username or Password.';
                        });
                    }
                })
                .catch(error => {
                    console.error('Error during login:', error);
                    errorMessage.textContent = 'An unexpected error occurred. Please try again later.';
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

   
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const firstName = document.getElementById('register-first-name').value.trim();
            const lastName = document.getElementById('register-last-name').value.trim();
            const age = parseInt(document.getElementById('register-age').value.trim());
            const gender = document.getElementById('register-gender').value;
            const nickname = document.getElementById('register-nickname').value.trim();
            const email = document.getElementById('register-email').value.trim();
            const password = document.getElementById('register-password').value.trim();

            // Frontend Validation
            const errorMessage = document.getElementById('register-error-message');
            errorMessage.textContent = ''; // Clear previous errors

            if (firstName.length > 20) {
                errorMessage.textContent = 'First Name cannot exceed 20 characters.';
                return;
            }

            if (lastName.length > 20) {
                errorMessage.textContent = 'Last Name cannot exceed 20 characters.';
                return;
            }

            if (isNaN(age) || age <= 0 || age > 999) {
                errorMessage.textContent = 'Age must be a positive number up to 999.';
                return;
            }

            if (!['Male', 'Female'].includes(gender)) {
                errorMessage.textContent = 'Please select a valid gender.';
                return;
            }

            if (nickname.length > 20) {
                errorMessage.textContent = 'Nickname cannot exceed 20 characters.';
                return;
            }

            if (email.length > 30) {
                errorMessage.textContent = 'Email cannot exceed 30 characters.';
                return;
            }

            if (password.length > 20) {
                errorMessage.textContent = 'Password cannot exceed 20 characters.';
                return;
            }

            fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({   
                     username: nickname,
                    email: email,
                    password: password,
                    first_name: firstName,
                    last_name: lastName,
                    age: age,
                    gender: gender,
                }),
            })
                .then(response => {
                    if (response.status === 201) {
                        // Successfully registered
                        registerForm.reset();
                        window.history.replaceState({}, '', '/login');
                        handleRoute();
                    } else {
                        return response.text().then(text => {
                            errorMessage.textContent = text || 'Failed to register. Please try again.';
                        });
                    }
                })
                .catch(error => {
                    console.error('Error during registration:', error);
                    errorMessage.textContent = 'An unexpected error occurred. Please try again later.';
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
