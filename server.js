// === Import Library Utama ===
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config(); // <-- penting untuk Railway
const dataRoutes = require('./routes/dataRoutes');

// === Inisialisasi Express & Server HTTP ===
const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.set('io', io);

const PORT = process.env.PORT || 3000;

// === Middleware ===
app.use(cors());
app.use(bodyParser.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'plts_secret_key',
  resave: false,
  saveUninitialized: false
}));

// === Proteksi Halaman Admin ===
app.use((req, res, next) => {
  if (
    req.path === '/pengaturan.html' &&
    (!req.session.loggedIn || req.session.role !== 'admin')
  ) {
    return res.redirect('/login.html');
  }
  next();
});

// === File Statis Frontend ===
app.use(express.static(path.join(__dirname, '../frontend')));

// === Routing API (data panel, beban, login, dll) ===
app.use('/api', dataRoutes);

// === Middleware Auth ===
function isAuthenticated(req, res, next) {
  if (req.session.loggedIn) return next();
  res.redirect('/login.html');
}

// === Proteksi Halaman ===
app.get('/index.html', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/analitik.html', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/analitik.html'));
});

app.get('/solartracker.html', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/solartracker.html'));
});

// ==========================================================
// === PENYIMPANAN DATA DARI ESP32 ===========================
// ==========================================================
let latestServoData = {
  servoX: 0,
  servoY: 0,
  ldr1: 0,
  ldr2: 0,
  ldr3: 0,
  ldr4: 0,
  waktu: new Date().toLocaleTimeString()
};

// === Endpoint untuk menerima data dari ESP32 ===
app.post('/updateServo', (req, res) => {
  latestServoData = {
    servoX: req.body.servoX || 0,
    servoY: req.body.servoY || 0,
    ldr1: req.body.ldr1 || 0,
    ldr2: req.body.ldr2 || 0,
    ldr3: req.body.ldr3 || 0,
    ldr4: req.body.ldr4 || 0,
    waktu: new Date().toLocaleTimeString()
  };

  console.log('📡 Data dari ESP32 diterima:', latestServoData);

  io.emit('servoData', latestServoData);
  res.sendStatus(200);
});

// === Endpoint untuk client web ambil data awal ===
app.get('/api/servo', (req, res) => {
  res.json(latestServoData);
});

// ==========================================================
// === SOCKET.IO (REAL-TIME) ================================
// ==========================================================
io.on('connection', (socket) => {
  console.log('🔌 Client web terhubung ke Socket.IO');

  socket.emit('servoData', latestServoData);

  socket.on('disconnect', () => {
    console.log('❌ Client web terputus');
  });
});

// === Root Route (cek server aktif) ===
app.get('/', (req, res) => {
  res.send('🌞 API Monitoring & Solar Tracker aktif dan siap menerima data dari ESP32!');
});

// === Jalankan Server ===
server.listen(PORT, () => {
  console.log(`✅ Server berjalan di: http://localhost:${PORT}`);
});
