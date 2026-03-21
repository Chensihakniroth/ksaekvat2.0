import { Router } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
const config = require('../../config/config.js');
const { env } = require('../../utils/env.js');
const database = require('../../services/DatabaseService');

const router = Router();

// Redirect to Discord OAuth
router.get('/discord', (req, res) => {
  const url = `https://discord.com/api/oauth2/authorize?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&response_type=code&scope=identify`;
  res.redirect(url);
});

// Callback from Discord
router.get('/discord/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.redirect('/login?error=NoCode');

  try {
    const params = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: 'authorization_code',
      code: code as string,
      redirect_uri: config.redirectUri,
    });

    const tokenRes = await axios.post('https://discord.com/api/oauth2/token', params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const { access_token } = tokenRes.data;

    const userRes = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const userData = userRes.data;

    // Ensure user exists in our DB
    const dbUser = await database.getUser(userData.id, userData.username);

    // Create JWT
    const token = jwt.sign({ id: userData.id, username: userData.username, avatar: userData.avatar }, env.JWT_SECRET || 'ksaekvat-super-secret-jwt-key-change-me-in-prod-pls', { expiresIn: '7d' });

    // Set HTTP-Only Cookie
    res.cookie('ksaekvat_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.redirect('/'); // Go back to dashboard
  } catch (error: any) {
    console.error('Discord Auth Error:', error?.response?.data || error.message);
    res.redirect('/login?error=AuthFailed');
  }
});

// Get current user
router.get('/me', async (req: any, res) => {
  const token = req.cookies?.ksaekvat_session;
  if (!token) return res.status(401).json({ success: false, error: 'Unauthorized' });

  try {
    const decoded: any = jwt.verify(token, env.JWT_SECRET || 'ksaekvat-super-secret-jwt-key-change-me-in-prod-pls');
    const user = await database.getUser(decoded.id);

    res.json({
      success: true,
      user: {
        id: decoded.id,
        username: decoded.username,
        avatar: decoded.avatar,
        balance: user.balance || 0,
        level: user.level || 1,
      }
    });
  } catch (err) {
    res.clearCookie('ksaekvat_session', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    });
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('ksaekvat_session', {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  });
  res.json({ success: true });
});

module.exports = router;
