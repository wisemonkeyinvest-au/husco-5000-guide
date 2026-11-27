#!/usr/bin/env python3
"""Box-only helper: bundle the static site into a single Pages _worker.js for API direct upload.
CI does not need this (it uses wrangler pages deploy on the static files)."""
import json, os
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
T = {".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"application/javascript; charset=utf-8",
     ".webmanifest":"application/manifest+json"}
files = ["index.html","styles.css","app.js","sw.js","manifest.webmanifest","figures.js"]
A = {}
for f in files:
    A["/"+f] = {"t": T[os.path.splitext(f)[1]], "b": open(os.path.join(root,f),encoding="utf-8").read()}
figs = sorted(os.listdir(os.path.join(root,"figures")))
worker = "const A = " + json.dumps(A) + ";\nconst FIGS = " + json.dumps(figs) + r""";
let F = null;
function fig(name) {
  if (!F) { const s = A['/figures.js'].b; F = JSON.parse(s.slice(s.indexOf('{'), s.lastIndexOf('}') + 1)); }
  const d = F[name]; if (!d) return null;
  const bin = atob(d.split(',')[1]); const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return u;
}
export default { async fetch(req) {
  const u = new URL(req.url); let p = u.pathname; if (p === '/' || p === '') p = '/index.html';
  const h = { 'x-content-type-options': 'nosniff' };
  if (p.startsWith('/figures/') && FIGS.includes(p.slice(9))) {
    const b = fig(p.slice(9));
    if (b) return new Response(b, { headers: { ...h, 'content-type': 'image/jpeg', 'cache-control': 'public, max-age=86400' } });
  }
  const a = A[p] || (p.endsWith('/') ? A[p + 'index.html'] : null);
  if (!a) return new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain' } });
  const nc = p === '/index.html' || p === '/sw.js';
  return new Response(a.b, { headers: { ...h, 'content-type': a.t, 'cache-control': nc ? 'no-cache' : 'public, max-age=300' } });
} };
"""
open(os.path.join(root,"deploy-cf","_worker.js"),"w").write(worker)
name = "husco-5000-guide"
ex = """async () => {
  const name = %s;
  let created = false;
  try { await cloudflare.request({ method: 'GET', path: `/accounts/${accountId}/pages/projects/${name}` }); }
  catch (e) { await cloudflare.request({ method: 'POST', path: `/accounts/${accountId}/pages/projects`, body: { name, production_branch: 'main' } }); created = true; }
  const worker = %s;
  const form = new FormData();
  form.append('manifest', '{}');
  form.append('branch', 'main');
  form.append('_worker.js', new Blob([worker], { type: 'application/javascript+module' }), '_worker.js');
  const d = await cloudflare.request({ method: 'POST', path: `/accounts/${accountId}/pages/projects/${name}/deployments`, body: form });
  const r = d.result || {};
  return { created, id: r.id, url: r.url, aliases: r.aliases, stage: r.latest_stage };
}""" % (json.dumps(name), json.dumps(worker))
open(os.path.join(root,"deploy-cf","execute.js"),"w").write(ex)
print(len(worker), len(ex))
