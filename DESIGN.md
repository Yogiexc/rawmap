# RawMap High-Craft Design System (`DESIGN.md`)

## 1. Visual Direction & Philosophy
- **Aesthetic:** Ultra-refined Silicon Valley AI Studio (Linear, Raycast, Vercel & Supabase Studio inspired).
- **Core Principle:** Maximum craft, high depth & elevation, razor-sharp 1px glass borders, ambient lighting, and high-contrast typography.

## 2. Color Palette & Ambient Atmosphere
- **Canvas Base:** `#08080B` with multi-layered ambient radial gradients:
  - Top Ambient Glow: `radial-gradient(ellipse 90% 60% at 50% -10%, rgba(16, 185, 129, 0.08), transparent 70%)`
  - Subtle Indigo Accent: `radial-gradient(ellipse 60% 40% at 90% 100%, rgba(99, 102, 241, 0.06), transparent 70%)`
- **Surface Elevation:**
  - Sidebar & Panels: `#0D0D11` with `rgba(255, 255, 255, 0.06)` border.
  - Node Cards: `rgba(22, 22, 28, 0.88)` with `backdrop-blur-xl` and `shadow-2xl shadow-black/60`.
- **Primary Brand Gradient:** Emerald to Cyan neon (`from-emerald-400 via-teal-400 to-cyan-500`) with subtle drop shadow `0 0 25px rgba(16, 185, 129, 0.3)`.

## 3. Data Type Badges
- `PK` (Primary Key): Amber `#F59E0B` on `rgba(245, 158, 11, 0.12)` + border `rgba(245, 158, 11, 0.25)`
- `FK` (Foreign Key): Indigo `#818CF8` on `rgba(99, 102, 241, 0.14)` + border `rgba(99, 102, 241, 0.3)`
- `string` / `varchar`: Emerald `#34D399` on `rgba(16, 185, 129, 0.1)`
- `number` / `int` / `decimal`: Cyan `#22D3EE` on `rgba(6, 182, 212, 0.1)`
- `boolean`: Purple `#C084FC` on `rgba(168, 85, 247, 0.1)`
- `array` / `object`: Pink `#F472B6` on `rgba(236, 72, 153, 0.1)`

## 4. Typography
- **Headings & UI Controls:** `Inter`, letter-spacing `-0.02em` (`tracking-tight`), weights `500` to `700`.
- **Code & Schemas:** `JetBrains Mono`, tight height, `text-[11px]` - `text-[12px]` for compact information density.
