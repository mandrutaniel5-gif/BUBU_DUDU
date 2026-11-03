// Publica adresa tunelului in repository (fisierul server-url.txt), ca jocul sa o gaseasca singur.
// Folosire: node server/publish-url.mjs https://xxx.trycloudflare.com
// Tokenul GitHub se citeste din ~/.bubu_token (fine-grained, doar repo-ul BUBU_DUDU, Contents: Read and write).
import fs from 'fs';
import os from 'os';
import path from 'path';
const url = process.argv[2];
const REPO = process.env.BUBU_REPO || 'mandrutaniel5-gif/BUBU_DUDU';
const tokFile = path.join(os.homedir(), '.bubu_token');
if (!url) { console.error('lipseste adresa'); process.exit(1); }
if (!fs.existsSync(tokFile)) { console.log(' (fara ~/.bubu_token: adresa nu se publica automat pe GitHub)'); process.exit(0); }
const token = fs.readFileSync(tokFile, 'utf8').trim();
const api = `https://api.github.com/repos/${REPO}/contents/server-url.txt`;
const H = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'bubu-dudu-s10' };
try {
  let sha;
  const cur = await fetch(api, { headers: H });
  if (cur.ok) sha = (await cur.json()).sha;
  const body = { message: 'S10: adresa serverului', content: Buffer.from(JSON.stringify({ url, ts: Date.now() }) + '\n').toString('base64'), ...(sha ? { sha } : {}) };
  const r = await fetch(api, { method: 'PUT', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  console.log(r.ok ? ' ✅ Adresa a fost publicată pe GitHub: jocul se conectează singur' : ` ❌ GitHub a refuzat (${r.status}): verifică tokenul din ~/.bubu_token`);
} catch (e) { console.log(' ❌ Nu am putut publica adresa: ' + e.message); }
