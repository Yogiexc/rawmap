# RawMap Cyberpunk Cinematic Design System (`DESIGN.md`)

## 1. Visual Direction & Cinematic Cyberpunk Identity
- **Aesthetic:** Million-Dollar High-Craft DevTool / Cyberpunk Terminal (inspired by Ghost in the Shell, Linear 2.0, Raycast, and futuristic IDE consoles).
- **Canvas Base:** Obsidian Abyss `#020205` overlaid with custom cyber-grid CSS and dynamic multi-point ambient neon flares:
  - Neon Emerald Glow: `radial-gradient(circle at 15% 10%, rgba(16, 185, 129, 0.12), transparent 45%)`
  - Cyber Indigo Glow: `radial-gradient(circle at 85% 90%, rgba(99, 102, 241, 0.14), transparent 50%)`
  - Deep Purple Ambient Core: `radial-gradient(circle at 50% 50%, rgba(147, 51, 234, 0.05), transparent 70%)`

## 2. Surfaces, Glassmorphism & Neon Borders
- **Floating Cards & Panels:** `rgba(8, 8, 12, 0.92)` with `backdrop-blur-2xl` and layered depth shadows `shadow-[0_0_50px_rgba(0,0,0,0.9)]`.
- **Dynamic Laser Borders:** Razor-sharp 1px border transitions from `border-zinc-800/80` to animated neon cyber emerald `border-emerald-500/60` with electric glow `0 0 25px rgba(16, 185, 129, 0.35)`.
- **Accent Lighting:** Laser top edge highlights (`h-[2px] bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-500`).

## 3. High-Contrast Cyber Badges
- `PK` (Primary Key): Golden Amber `#F59E0B` text + `rgba(245, 158, 11, 0.15)` bg + `border-amber-500/40` + amber glow `0 0 10px rgba(245, 158, 11, 0.25)`.
- `FK` (Foreign Key): Electric Indigo `#818CF8` text + `rgba(99, 102, 241, 0.18)` bg + `border-indigo-500/40` + purple-indigo laser glow.
- `VARCHAR` / `TEXT` / `STRING`: Neon Emerald `#10B981` on `rgba(16, 185, 129, 0.12)` + `border-emerald-500/30`.
- `INT` / `DECIMAL` / `NUMBER`: Cyber Cyan `#06B6D4` on `rgba(6, 182, 212, 0.12)` + `border-cyan-500/30`.
- `BOOLEAN`: Cyber Violet `#A855F7` on `rgba(168, 85, 247, 0.12)` + `border-purple-500/30`.

## 4. Typography & Telemetry
- **UI Navigation & Branding:** `Inter` ultra-tight tracking (`tracking-tight`), uppercase subheadings (`tracking-widest text-[10px] uppercase font-mono`).
- **Code, Schema Keys, Data Badges & Counters:** `JetBrains Mono` with precision line heights and high-contrast rendering.
