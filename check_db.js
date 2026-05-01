const db = require('./db');
db.all("SELECT * FROM bills ORDER BY id DESC LIMIT 5", [], (err, rows) => {
  if (err) console.error(err);
  console.log(JSON.stringify(rows, null, 2));
  process.exit();
});
