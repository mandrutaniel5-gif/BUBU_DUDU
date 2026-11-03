// Server Bubu & Dudu — ruleaza pe Samsung S10 (Termux) sau pe orice PC cu Node.js 18+.
// - WebSocket pentru multiplayer in timp real (2 jucatori pe camera)
// - salveaza lumea pe disc (server/data/<camera>.json)
// - serveste si jocul compilat (folderul dist/) pe acelasi port
//   Pornire:  node server/server.mjs   (PORT=8787 implicit)
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const PORT = +(process.env.PORT || 8787);
const DATA = path.join(__dir, 'data');
const DIST = path.join(__dir, '..', 'dist');
fs.mkdirSync(DATA, { recursive: true });

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  if (req.url === '/health') { res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ ok: true, rooms: rooms.size })); }
  let p = decodeURIComponent((req.url || '/').split('?')[0]);
  if (p === '/') p = '/index.html';
  const f = path.join(DIST, path.normalize(p).replace(/^(\.\.[/\\])+/, ''));
  if (!f.startsWith(DIST) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('Bubu & Dudu server OK (jocul nu e compilat in dist/)'); }
  res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});

/** camera -> { bubu?: ws, dudu?: ws } */
const rooms = new Map();
const safe = (r) => String(r || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 48) || 'default';
const saveFile = (room) => path.join(DATA, safe(room) + '.json');

function readSave(room) { try { return JSON.parse(fs.readFileSync(saveFile(room), 'utf8')); } catch { return null; } }
function writeSave(room, data) {
  const cur = readSave(room);
  if (cur && cur.ts > data.ts) return; // pastram varianta mai noua
  fs.writeFileSync(saveFile(room) + '.tmp', JSON.stringify(data));
  fs.renameSync(saveFile(room) + '.tmp', saveFile(room));
}

const wss = new WebSocketServer({ server, maxPayload: 2 * 1024 * 1024 });
wss.on('connection', (ws, req) => {
  let room = null, who = null;
  const other = () => rooms.get(room)?.[who === 'bubu' ? 'dudu' : 'bubu'];
  const send = (s, o) => { if (s && s.readyState === 1) s.send(JSON.stringify(o)); };
  ws.isAlive = true; ws.on('pong', () => (ws.isAlive = true));
  ws.on('message', (raw) => {
    let d; try { d = JSON.parse(raw); } catch { return; }
    if (d.t === 'join') {
      room = safe(d.room); who = d.who === 'dudu' ? 'dudu' : 'bubu';
      const r = rooms.get(room) || {}; 
      if (r[who] && r[who] !== ws) try { r[who].close(4000, 'înlocuit'); } catch {}
      r[who] = ws; rooms.set(room, r);
      console.log(new Date().toISOString(), `${who} a intrat în camera ${room} (${req.socket.remoteAddress})`);
      send(other(), { t: 'presence', who, online: true });
      if (other()) send(ws, { t: 'presence', who: who === 'bubu' ? 'dudu' : 'bubu', online: true });
      return;
    }
    if (!room) return;
    switch (d.t) {
      case 'state': case 'ev': send(other(), d); break;
      case 'save': if (d.data && typeof d.data.ts === 'number') writeSave(room, d.data); break;
      case 'load': send(ws, { t: 'save', data: readSave(room) }); break;
    }
  });
  ws.on('close', () => {
    if (!room) return;
    const r = rooms.get(room);
    if (r && r[who] === ws) { delete r[who]; send(other(), { t: 'presence', who, online: false }); }
    if (r && !r.bubu && !r.dudu) rooms.delete(room);
    console.log(new Date().toISOString(), `${who} a ieșit din ${room}`);
  });
});
// detectare conexiuni moarte (telefon blocat, retea pierduta)
setInterval(() => wss.clients.forEach(ws => { if (!ws.isAlive) return ws.terminate(); ws.isAlive = false; ws.ping(); }), 15000);

server.listen(PORT, '0.0.0.0', () => console.log(`🐼🐻 Server Bubu & Dudu pornit pe portul ${PORT}`));
