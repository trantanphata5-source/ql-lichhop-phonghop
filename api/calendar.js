const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  try {
    const filePath = path.join(process.cwd(), 'public', 'debug_events.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).send(data);
  } catch (error) {
    res.status(500).json({ error: 'Không thể đọc dữ liệu lịch', details: error.message });
  }
};
