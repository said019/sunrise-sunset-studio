# Logo Placeholder Notice

These are **placeholder** SVG assets created for development. Replace them with the official Sunrise Sunset logo files before going live.

## Files to replace with official assets

| File | Purpose | Currently |
|---|---|---|
| `logo.svg` | Square icon mark (32–64px) used in Navbar, Layouts, Footer | Placeholder: coral bg + cream sun-over-horizon SVG |
| `logo-wordmark.svg` | Wide wordmark for auth pages / large placements | Placeholder: coral bg + "SUNRISE / SUNSET" serif SVG |
| `favicon.svg` | Browser tab / bookmark icon | Placeholder: same as logo.svg |

## Where these files are referenced

- `index.html` — `<link rel="icon">`, `<link rel="apple-touch-icon">`, `og:image`, `twitter:image`
- `src/components/Navbar.tsx` — navbar logo (desktop + mobile)
- `src/components/Footer.tsx` — footer brand logo
- `src/components/layout/AdminLayout.tsx` — admin sidebar (desktop + mobile)
- `src/components/layout/CoachLayout.tsx` — coach header (desktop + mobile)
- `src/components/layout/ClientLayout.tsx` — client app header
- `src/pages/auth/Login.tsx` — login card logo
- `src/pages/auth/Register.tsx` — register card logo

## Notes

- Login/Register pages use `/logo-wordmark.svg` (wider, better suited for card headers).
- All other placements use `/logo.svg`.
- The square mark is designed to read well at 32px and up.
- Official brand palette: coral `#E36F4C`, cream `#EFE7D9`, amber `#F8B069`, chocolate `#6E4528`.
