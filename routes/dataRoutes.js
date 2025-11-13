// routes/dataRoutes.js
const express = require('express');
const router = express.Router();

const {
  postData,
  getLatestData,
  getDailyEnergy,
  getDashboardMetrics,
  register,
  login,
  logout
} = require('../controllers/dataController');

// === CEK SESSION LOGIN ===
router.get('/session', (req, res) => {
  res.json({
    loggedIn: req.session.loggedIn || false,
    username: req.session.username || null,
    role: req.session.role || null
  });
});

// === DATA (Panel & Beban) ===
router.post('/data', postData);
router.get('/data/latest', getLatestData);
router.get('/history', getDailyEnergy);

// === DASHBOARD ===
router.get('/dashboard/metrics', getDashboardMetrics);

// === AUTH ===
router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);

module.exports = router;
