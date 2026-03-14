import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { data, error } = await supabase
    .from('waitlist')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ ok: false, error: error.message });

  // ── CSV export ──
  if (req.query.format === 'csv') {
    const csv = [
      'ID,Email,Name,Joined At',
      ...data.map(r => `${r.id},"${r.email}","${r.name || ''}","${r.created_at}"`)
    ].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="lightshield-waitlist.csv"');
    return res.status(200).send(csv);
  }

  // ── HTML view ──
  const html = `<!DOCTYPE html><html><head>
<title>LightShield · Waitlist</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#010a03;color:#c8ffd4;font-family:'Courier New',monospace;padding:2rem}
  h1{color:#00ff41;font-size:1.3rem;margin-bottom:1.5rem;letter-spacing:.1em}
  .meta{color:#3a6644;font-size:.8rem;margin-bottom:1.5rem;display:flex;gap:2rem;align-items:center}
  a.export{background:#00ff41;color:#010a03;padding:.3rem .9rem;font-size:.75rem;text-decoration:none;font-weight:700;letter-spacing:.05em}
  table{width:100%;border-collapse:collapse}
  th{text-align:left;padding:.6rem 1rem;font-size:.72rem;color:#00ff41;border-bottom:1px solid rgba(0,255,65,0.2);letter-spacing:.08em}
  td{padding:.6rem 1rem;font-size:.8rem;border-bottom:1px solid rgba(0,255,65,0.07)}
  tr:hover td{background:rgba(0,255,65,0.04)}
  .badge{background:rgba(0,255,65,0.1);border:1px solid rgba(0,255,65,0.3);color:#00ff41;padding:.1rem .5rem;font-size:.68rem}
  .empty{color:#3a6644;text-align:center;padding:3rem;font-size:.9rem}
</style></head><body>
<h1>⛨ LIGHTSHIELD · WAITLIST ADMIN</h1>
<div class="meta">
  <span>TOTAL: <strong style="color:#00ff41">${data.length}</strong> SIGNUPS</span>
  <a class="export" href="/api/list?format=csv">⬇ EXPORT CSV</a>
</div>
${data.length === 0
  ? '<div class="empty">NO SIGNUPS YET — SHARE THE LINK!</div>'
  : `<table>
      <tr><th>#</th><th>EMAIL</th><th>NAME</th><th>JOINED AT</th><th>STATUS</th></tr>
      ${data.map((r, i) => `<tr>
        <td>${i + 1}</td>
        <td>${r.email}</td>
        <td>${r.name || '—'}</td>
        <td>${new Date(r.created_at).toLocaleString('en-EG')}</td>
        <td><span class="badge">ACTIVE</span></td>
      </tr>`).join('')}
    </table>`}
</body></html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(html);
}
