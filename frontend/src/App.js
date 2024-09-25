// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './routes/Login';
import Register from './routes/Register';
import PasswordReset from './routes/PasswordReset';
import PasswordResetConfirm from './routes/PasswordResetConfirm';
import { AuthProvider } from './AuthContext';
import Home from './routes/Home';
import NavBar from './components/NavBar';
import Footer from './components/Footer';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <NavBar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/password-reset" element={<PasswordReset />} />
            <Route path="/password-reset-confirm/:userId/:token" element={<PasswordResetConfirm />} />
            {/* Add more routes as needed */}
          </Routes>
          <Footer />
          </div>
      </Router>
    </AuthProvider>
  );
}

export default App;