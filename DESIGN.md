# Sunrise Sunset Design System

## Design Direction

Premium coastal wellness, inspired by Los Cabos golden hour, natural materials, soft studio light, sculptural movement, and warm minimalism. The interface should feel curated and breathable while still motivating clients to reserve.

## Palette

Use warm neutrals and sunset accents from the provided references:

- Coral: `#E36F4C`, primary action and brand heat.
- Amber: `#F8B069`, highlights and luminous accents.
- Wine: `#7B0000`, deep contrast used sparingly.
- Chocolate: `#6E4528`, grounding copy and footer surfaces.
- Rose: `#C67E6F`, quiet support tone.
- Cream: `#EFE7D9`, base background.
- Blush: `#FEF3F4`, soft panels and form surfaces.

Prefer OKLCH or calibrated HSL tokens in CSS. Avoid pure black and pure white in large surfaces.

## Typography

Use a high-contrast display serif for expressive headlines and a clean sans-serif for product copy. Existing project tokens use Fraunces and Inter; keep them for continuity unless the brand later provides final fonts.

## Layout

Use asymmetric editorial composition, generous whitespace, large imagery, and stable responsive grids. Avoid repeated equal-card rows. On mobile, keep touch targets comfortable and collapse complex editorial layouts into a clean single column.

## Motion

Motion should support confidence, not spectacle. Use:

- Entrance reveals for marketing sections.
- Subtle button press feedback.
- Transform and opacity only.
- Custom ease-out curves for UI actions.
- No bounce-heavy motion and no keyboard-triggered delays.

## Components

Buttons should feel physical and responsive with clear hover, focus, and active states. Forms should feel calm, tactile, and trustworthy. Auth pages should look like a continuation of the studio brand, not a default admin login.

## Imagery

Use existing studio imagery where available. Blend it with warm overlays, grain, cropped movement details, and golden-hour color fields inspired by the provided palette references.
