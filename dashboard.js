const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const Database = require('better-sqlite3');
const path = require('path');

function startDashboard() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server);

  const db = new Database('database.sqlite');

  db.exec(`
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author TEXT,
      reason TEXT,
      content TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Antify Bot Dashboard</title>
        <style>
          body { font-family: sans-serif; background: #f4f4f9; padding: 20px; }
          h1 { color: #333; }
          .log { background: #fff; border-left: 4px solid #e74c3c; padding: 10px; margin-bottom: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .log .author { font-weight: bold; color: #2c3e50; }
          .log .reason { color: #e74c3c; font-weight: bold; }
          .log .timestamp { font-size: 0.8em; color: #7f8c8d; }
        </style>
      </head>
      <body>
        <h1>Antify Bot Live Scams</h1>
        <div id="logs"></div>
        <script src="/socket.io/socket.io.js"></script>
        <script>
          const socket = io();
          const logsDiv = document.getElementById('logs');

          function escapeHTML(str) {
            if (!str) return '';
            return str.replace(/[&<>'"]/g,
              tag => ({
                  '&': '&amp;',
                  '<': '&lt;',
                  '>': '&gt;',
                  "'": '&#39;',
                  '"': '&quot;'
                }[tag] || tag)
            );
          }

          function createLogElement(log) {
            const div = document.createElement('div');
            div.className = 'log';
            const escapedContent = escapeHTML(log.content);
            const contentHTML = escapedContent ? \`<p>\${escapedContent}</p>\` : \`<p><em>No content / Image scan</em></p>\`;
            let timestampStr = log.timestamp;
            if (!timestampStr.endsWith('Z')) {
               timestampStr += 'Z';
            }
            div.innerHTML = \`
              <span class="author">\${escapeHTML(log.author)}</span>
              <span class="reason">[\${escapeHTML(log.reason)}]</span>
              \${contentHTML}
              <span class="timestamp">\${new Date(timestampStr).toLocaleString()}</span>
            \`;
            return div;
          }

          socket.on('initialLogs', (logs) => {
            logs.forEach(log => logsDiv.appendChild(createLogElement(log)));
          });

          socket.on('newLog', (log) => {
            logsDiv.insertBefore(createLogElement(log), logsDiv.firstChild);
          });
        </script>
      </body>
      </html>
    `);
  });

  io.on('connection', (socket) => {
    const logs = db.prepare('SELECT * FROM logs ORDER BY timestamp DESC LIMIT 50').all();
    socket.emit('initialLogs', logs);
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`🌐 Dashboard running at http://localhost:${PORT}`);
  });

  return {
    emitNewLog: (logData) => {
      io.emit('newLog', logData);
    }
  };
}

module.exports = startDashboard;
