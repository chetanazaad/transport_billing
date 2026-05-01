const express = require('express');
const path = require('path');
const fs = require('fs');
const { generateCopies } = require('./data/mapper');
const generatePDF = require('./pdf/generate');
const db = require('./db');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));
app.use('/output', express.static(path.join(__dirname, 'output')));

// Helper: Get setting
const getSetting = (key) => new Promise((resolve) => {
  db.get("SELECT value FROM settings WHERE key = ?", [key], (err, row) => {
    resolve(row ? row.value : null);
  });
});

// Endpoint: Get next LR No
app.get('/api/next-lr', async (req, res) => {
  const prefix = await getSetting('lr_prefix') || 'VR';
  const nextVal = await getSetting('lr_next_val') || '1001';
  res.json({ lr_no: `${prefix}-${nextVal}` });
});

// Endpoint: Login (Simple)
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') {
    res.json({ success: true, token: 'mock-token-123' });
  } else {
    res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
});

// Endpoint: Bill History
app.get('/api/bills', (req, res) => {
  db.all("SELECT * FROM bills ORDER BY created_at DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/generate', async (req, res) => {
  try {
    const data = req.body;
    const requestedCopies = data.requestedCopies || []; // Array of labels
    
    const templatePath = path.join(__dirname, 'template/lr_template.html');
    const template = fs.readFileSync(templatePath, 'utf8');

    // 1. Generate the PDF for the user's download (specific copies)
    const downloadHTML = generateCopies(template, data, requestedCopies);
    const downloadFilePath = await generatePDF(downloadHTML);

    // 2. Check if this bill is already in DB (to avoid duplicate master saves/increments)
    const existingBill = await new Promise((resolve) => {
      db.get("SELECT id FROM bills WHERE lr_no = ?", [data.lr_no], (err, row) => {
        if (err) {
          console.error('DB Error checking existing bill:', err);
          resolve(null);
        } else {
          resolve(row);
        }
      });
    });

    if (!existingBill) {
      console.log(`Archiving new master copy for LR: ${data.lr_no}`);
      // First time generating this LR: Generate and save a MASTER copy (no labels) for history
      const masterHTML = generateCopies(template, data, []); 
      const masterFilePath = await generatePDF(masterHTML);

      db.run(
        `INSERT INTO bills (lr_no, consignee, consignor, total_amount, file_path) VALUES (?, ?, ?, ?, ?)`,
        [data.lr_no || 'N/A', data.consignee || 'N/A', data.consignor || 'N/A', data.grand_total || '0', masterFilePath],
        async function(err) {
          if (err) {
            console.error('Error inserting bill record:', err);
          } else {
            // Increment LR number sequence only on successful master archival
            const prefix = await getSetting('lr_prefix');
            const nextVal = await getSetting('lr_next_val');
            if (data.lr_no === `${prefix}-${nextVal}`) {
              db.run("UPDATE settings SET value = ? WHERE key = 'lr_next_val'", [parseInt(nextVal) + 1]);
            }
          }
        }
      );
    } else {
      console.log(`LR ${data.lr_no} already exists in history. Skipping archival.`);
    }

    // 3. Send the requested copy to user
    res.download(downloadFilePath, `LR_${data.lr_no || 'bill'}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Error generating PDF', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
