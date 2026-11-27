# Husco 5000 Valve Service Guide

Mobile-first workshop guide for servicing and complete seal replacement on a **Husco 5000** sectional hydraulic control valve (manual: **SSL-2000 Rev 12/07 / VA-5000**).

**Live:** [husco-5000-guide.pages.dev](https://husco-5000-guide.pages.dev/)

**Official manual (PDF):** [VA-5000 Husco Valve Service Manual](https://irp.cdn-website.com/8e9b3e0f/files/uploaded/VA-5000%20Husco%20Valve%20Service%20Manual.pdf)

This app is a bench aid, not a substitute for the official manual. Every torque and procedure in the guide is taken from that manual and cited by section and printed page. Where the manual is silent, the app says so. No torque values were invented.


## Deploy (Cloudflare Pages)

`.github/workflows/cloudflare-pages.yml` deploys the static files to the Cloudflare Pages project `husco-5000-guide` on every push to `main`. It needs the `CLOUDFLARE_API_TOKEN` repo secret; without it the workflow skips cleanly.

`deploy-cf/build_worker.py` is a fallback that bundles the site into one `_worker.js` for a direct API upload.

## Use it

- Open the live URL on a phone (large tap targets, checklists, torque table).
- Checked steps are saved in the browser (`localStorage`) and can be reset.
- After the first visit the app can work offline (service worker).
- Print / save PDF from the Overview stage.

## Local preview

```bash
cd husco-5000-guide
python3 -m http.server 8765
```

Then open `http://127.0.0.1:8765/`.

## What’s in the repo

Vanilla HTML, CSS and JavaScript — no build step. Figures are cropped excerpts from the official manual and are captioned with section and page.

## Disclaimer

Husco and related marks belong to their owners. Figures and procedures come from the Husco *5000 Valve Series Service Manual*. Follow the official manual if anything conflicts. Follow the machine service manual for removal, depressurising, and system pressure checks.
