import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import './NavBar.css';
import { FaNoteSticky } from "react-icons/fa6";

function Navbar() {
  const { isLoggedIn, setIsLoggedIn } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsLoggedIn(false);
    navigate('/login');
  };

  return (
    <div className="navbar">
      <Link to="/" className="navbar-logo">
        <FaNoteSticky size="40" />
        <span>Sticky Notes</span>
      </Link>
      <div className="navbar-buttons">
        {isLoggedIn ? (
          <button onClick={handleLogout} className="navbar-button">Logout</button>
        ) : (
          <>
            <Link to="/login" className="navbar-button">Login</Link>
            <Link to="/register" className="navbar-button">Register</Link>
          </>
        )}
      </div>
    </div>
  );
}

export default Navbar;