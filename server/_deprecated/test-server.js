const express = require('express');
const app = express();
const PORT = 5000;

app.get('/', (req, res) => {
  res.send('Hello from minimal server!');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server running' });
});

app.listen(PORT, () => {
  console.log(`Minimal server running on port ${PORT}`);
});