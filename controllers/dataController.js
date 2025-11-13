// controllers/dataController.js
const pool = require('../db');

//
// === POST DATA (Panel + Beban) ===
//
const postData = async (req, res) => {
  const { panel, beban } = req.body;
  if (!panel || !beban) {
    return res.status(400).json({ message: "Data tidak lengkap" });
  }

  try {
    await pool.query(`INSERT INTO panel (voltage, current, power) VALUES ($1, $2, $3)`,
      [panel.voltage, panel.current, panel.power]);

    await pool.query(`INSERT INTO beban (voltage, current, power) VALUES ($1, $2, $3)`,
      [beban.voltage, beban.current, beban.power]);

    res.json({ message: "Data panel & beban berhasil disimpan" });
  } catch (err) {
    console.error("❌ Gagal simpan data:", err);
    res.status(500).json({ message: "Gagal simpan data" });
  }
};

//
// === GET DATA TERBARU ===
//
const getLatestData = async (req, res) => {
  const query = `
    SELECT 
      p.voltage AS panel_voltage,
      p.current AS panel_current,
      p.power AS panel_power,
      b.voltage AS beban_voltage,
      b.current AS beban_current,
      b.power AS beban_power
    FROM panel p
    JOIN beban b ON b.id = (SELECT MAX(id) FROM beban)
    ORDER BY p.id DESC
    LIMIT 1;
  `;

  try {
    const { rows } = await pool.query(query);
    if (rows.length === 0) return res.status(404).json({ message: "Belum ada data" });

    res.json({
      panel: {
        voltage: rows[0].panel_voltage,
        current: rows[0].panel_current,
        power: rows[0].panel_power
      },
      beban: {
        voltage: rows[0].beban_voltage,
        current: rows[0].beban_current,
        power: rows[0].beban_power
      }
    });
  } catch (err) {
    console.error("❌ Gagal ambil data:", err);
    res.status(500).json({ message: "Gagal ambil data" });
  }
};

//
// === GET HISTORY ENERGI ===
//
const getDailyEnergy = async (req, res) => {
  const query = `
    SELECT DATE(created_at) AS date, 
           ROUND(SUM(power)/1000, 2) AS energy_kWh
    FROM panel
    GROUP BY DATE(created_at)
    ORDER BY date DESC
    LIMIT 7;
  `;

  try {
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error("❌ Gagal ambil data energi:", err);
    res.status(500).json({ message: "Gagal ambil data energi" });
  }
};

//
// === DASHBOARD METRICS ===
//
const getDashboardMetrics = async (req, res) => {
  const query = `
    SELECT 
      p.power AS power_produce,
      b.power AS power_load,
      (
        SELECT ROUND(SUM(power)/1000, 2) 
        FROM panel 
        WHERE DATE(created_at) = CURRENT_DATE
      ) AS energy_today,
      ROUND(MAX(p.power), 2) AS peak_power,
      ROUND(AVG(b.power), 2) AS avg_load,
      ROUND(
        (
          (SELECT SUM(power) FROM panel WHERE DATE(created_at)=CURRENT_DATE) -
          (SELECT SUM(power) FROM beban WHERE DATE(created_at)=CURRENT_DATE)
        ) / 1000, 2
      ) AS net_energy,
      80 AS battery_health
    FROM panel p
    JOIN beban b ON b.id = (SELECT MAX(id) FROM beban)
    ORDER BY p.id DESC
    LIMIT 1;
  `;

  try {
    const { rows } = await pool.query(query);
    res.json(rows[0] || {});
  } catch (err) {
    console.error("❌ Gagal ambil metrik:", err);
    res.status(500).json({ message: "Gagal ambil metrik" });
  }
};

//
// === USER AUTH ===
//
const register = async (req, res) => {
  const { username, password, role } = req.body;
  try {
    await pool.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)',
      [username, password, role]
    );
    res.status(201).json({ message: "Akun berhasil dibuat" });
  } catch (err) {
    console.error("❌ Registrasi gagal:", err);
    res.status(500).json({ message: "Username sudah dipakai" });
  }
};

const login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND password = $2',
      [username, password]
    );
    if (rows.length > 0) {
      req.session.loggedIn = true;
      req.session.username = username;
      req.session.role = rows[0].role;
      res.json({ success: true });
    } else {
      res.status(401).json({ message: "Username atau password salah" });
    }
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const logout = (req, res) => {
  req.session.destroy(() => res.redirect('/login.html'));
};

module.exports = {
  postData,
  getLatestData,
  getDailyEnergy,
  getDashboardMetrics,
  register,
  login,
  logout
};
