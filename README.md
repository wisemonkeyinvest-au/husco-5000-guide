# Husco 5000 Valve Service Guide

Mobile-first workshop guide for servicing and complete seal replacement on a **Husco 5000** sectional hydraulic control valve (manual: **SSL-2000 Rev 12/07 / VA-5000**).

**Live:** [wisemonkeyinvest-au.github.io/husco-5000-guide](https://wisemonkeyinvest-au.github.io/husco-5000-guide/)

**Official manual (PDF):** [VA-5000 Husco Valve Service Manual](https://irp.cdn-website.com/8e9b3e0f/files/uploaded/VA-5000%20Husco%20Valve%20Service%20Manual.pdf)

This app is a bench aid, not a substitute for the official manual. Every torque and procedure in the guide is taken from that manual and cited by section and printed page. Where the manual is silent, the app says so. No torque values were invented.


## GitHub Pages

The deploy workflow is in `.github/workflows/pages.yml`. The first run could not enable Pages automatically (`Resource not accessible by integration`). One-time fix:

1. Open [Settings → Pages](https://github.com/wisemonkeyinvest-au/husco-5000-guide/settings/pages)
2. Under **Build and deployment → Source**, choose **GitHub Actions**
3. Re-run the **Deploy Pages** workflow from the Actions tab (or push a commit)

After that, the site should be at the live URL above.

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
