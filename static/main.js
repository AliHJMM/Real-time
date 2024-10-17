document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('register-form');
  const loginForm = document.getElementById('login-form');
  const authContainer = document.getElementById('auth-container');
  const forumContainer = document.getElementById('forum-container');
  const logoutButton = document.getElementById('logout-button');

  // Handle Registration
  registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nickname = document.getElementById('nickname').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const firstName = document.getElementById('first-name').value;
      const lastName = document.getElementById('last-name').value;
      const gender = document.getElementById('gender').value;
      const age = document.getElementById('age').value;

      const data = { nickname, email, password, firstName, lastName, gender, age };

      try {
          const response = await fetch('/api/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
          });

          const result = await response.json();
          if (response.ok) {
              alert('Registration successful! Please log in.');
              registerForm.reset();
          } else {
              alert(`Registration failed: ${result.error}`);
          }
      } catch (error) {
          console.error('Error:', error);
          alert('An error occurred during registration.');
      }
  });

  // Handle Login
  loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const identifier = document.getElementById('login-identifier').value;
      const password = document.getElementById('login-password').value;

      const data = { identifier, password };

      try {
          const response = await fetch('/api/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
          });

          const result = await response.json();
          if (response.ok) {
              authContainer.style.display = 'none';
              forumContainer.style.display = 'block';
              // Initialize WebSocket or other forum functionalities here
          } else {
              alert(`Login failed: ${result.error}`);
          }
      } catch (error) {
          console.error('Error:', error);
          alert('An error occurred during login.');
      }
  });

  // Handle Logout
  logoutButton.addEventListener('click', async () => {
      try {
          const response = await fetch('/api/logout', {
              method: 'POST'
          });

          if (response.ok) {
              forumContainer.style.display = 'none';
              authContainer.style.display = 'block';
              alert('Logged out successfully.');
          } else {
              alert('Logout failed.');
          }
      } catch (error) {
          console.error('Error:', error);
          alert('An error occurred during logout.');
      }
  });
});
