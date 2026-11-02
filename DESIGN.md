# RawMap Design System (`DESIGN.md`)

## 1. Visual Direction & Philosophy
- **Aesthetic:** Ultra-clean Developer Dark Mode (inspired by Linear, Raycast, and Supabase Studio).
- **Core Principle:** High density, zero visual clutter, razor-sharp 1px borders, and high-contrast data type badges.

## 2. Color Palette (Dark Matrix Default)
- **Canvas Background:** `#09090B` (Zinc 950) with `#27272A` dot grid pattern.
- **Panel / Sidebar Surface:** `#121215` (Elevated dark surface).
- **Node Card Surface:** `#18181B` with `backdrop-blur-md` and `#27272A` border (1px solid).
- **Active / Selected Node Border:** `#10B981` (Emerald 500) with subtle glow `0 0 15px rgba(16, 185, 129, 0.2)`.
- **Text Hierarchy:**
  - Primary Text: `#FAFAFA`
  - Secondary / Key Label: `#A1A1AA`
  - Muted / Metadata: `#52525B`

## 3. Data Type Badge Colors (Inside Nodes)
- `PK` (Primary Key): Amber `#F59E0B` text on `rgba(245, 158, 11, 0.12)` bg
- `FK` (Foreign Key): Indigo `#6366F1` text on `rgba(99, 102, 241, 0.12)` bg
- `string` / `varchar`: Emerald `#10B981`
- `number` / `int`: Cyan `#06B6D4`
- `boolean`: Purple `#A855F7`
- `array` / `object`: Pink `#EC4899`

## 4. Typography
- **UI & Headers:** `Inter` or system sans-serif (`font-sans`), tight tracking (`tracking-tight`).
- **Code Editor, Node Keys & Data Types:** `JetBrains Mono` or `Fira Code` (`font-mono`), `text-xs` (12px) for node rows to maximize screen real estate.
