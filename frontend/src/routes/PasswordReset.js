// src/routes/PasswordReset.js
import React, { useState } from 'react';
import axios from 'axios';
import './PasswordReset.css';  // Import the CSS file for styling

function PasswordReset() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8000/api/password-reset/', { email });
      setMessage(response.data.detail);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred. Please try again.');
      setMessage('');
    }
  };

  return (
    <div className="password-reset-container">
      <div className="password-reset-box">
        <h2>Reset Password</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="reset-button">Send Reset Link</button>
        </form>
        {message && <p className="message success">{message}</p>}
        {error && <p className="message error">{error}</p>}
      </div>
    </div>
  );
}

export default PasswordReset;