import React from 'react';
import './Footer.css'; // Import the CSS file for styling
import { FaFacebook, FaTwitter, FaInstagram, FaDiscord } from 'react-icons/fa';

function Footer() {
    return (
        <footer className="footer">
            <div className="footer-socials">
                <a href="https://facebook.com" className="social-icon"><FaFacebook /></a>
                <a href="https://twitter.com" className="social-icon"><FaTwitter /></a>
                <a href="https://instagram.com" className="social-icon"><FaInstagram /></a>
                <a href="https://Discord.com" className="social-icon"><FaDiscord /></a>
            </div>
            <div className="footer-links">
                <a href="#about" className="footer-link">About Us</a>
                <a href="#services" className="footer-link">Services</a>
                <a href="#contact" className="footer-link">Contact</a>
                <a href="#privacy" className="footer-link">Privacy Policy</a>
            </div>
            <div className="footer-bottom">
                <p>© {new Date().getFullYear()} Abroor. All rights reserved.</p>
            </div>
        </footer>
    );
}

export default Footer;