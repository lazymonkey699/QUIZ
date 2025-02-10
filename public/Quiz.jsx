import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    const data = new URLSearchParams();
    data.append('grant_type', 'password');
    data.append('username', username);
    data.append('password', password);
    data.append('scope', '');
    data.append('client_id', 'your-client-id'); // Update with actual client ID
    data.append('client_secret', 'your-client-secret'); // Update with actual client secret

    axios
      .post('http://192.168.0.199:8080/api/token', data, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
      .then((response) => {
        console.log('API Response:', response.data); // Debugging

        const { access_token, role, faculty_id, user } = response.data;

        // Handle nested faculty_id (if applicable)
        const finalFacultyId = faculty_id || user?.faculty_id;

        if (!finalFacultyId) {
          throw new Error('faculty_id not found in response');
        }

        // Store necessary information in localStorage
        localStorage.setItem('accessToken', access_token);
        localStorage.setItem('username', username);
        localStorage.setItem('facultyId', finalFacultyId); // Store faculty_id
        localStorage.setItem('userRole', role);

        console.log('Stored facultyId in localStorage:', finalFacultyId); // Verify storage

        // Navigate based on role
        if (role === 'admin') {
          navigate('/dashboard');
        } else {
          navigate('/home');
        }
      })
      .catch((error) => {
        console.error('Login error:', error.response ? error.response.data : error.message);
        setError('Invalid credentials or server error.');
      });
  };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin} className="login-form">
        <h2>Login</h2>
        {error && <div className="error-message">{error}</div>}
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="login-btn">
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;
