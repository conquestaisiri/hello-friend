

## Plan: Hero Image Revert + CTA Section Fix

### What I Understand

1. **Hero Section**: Revert the background image to the original `hero_background.png` (from `attached_assets/generated_images/`). Replace the blue/purple gradient overlay with a simple **dark black overlay** so the text stands out cleanly without colored distraction.

2. **CTA Section ("Start getting things done today")**: The current purple gradient background (`from-[hsl(222,80%,25%)] via-[hsl(250,60%,35%)] to-[hsl(270,60%,30%)]`) looks off. Replace it with a cleaner, more professional gradient. Also:
   - Remove the green `Sparkles` icon (or change its color)
   - Change the "Post a Task" button from green (`bg-accent`) to blue (`bg-primary`)

### Changes (1 file + 1 asset copy)

**1. Copy `attached_assets/generated_images/hero_background.png` → `client/public/images/hero-background.png`**

**2. Edit `client/src/pages/home.tsx`:**

- **Hero overlay (line 131)**: Change from blue/purple gradient to a dark overlay:
  ```
  bg-gradient-to-b from-black/75 via-black/60 to-black/80
  ```
- **Hero image (line 130)**: Point `src` to `/images/hero-background.png`
- **CTA section (lines 547-577)**:
  - Background gradient: Replace purple tones with a deep blue-to-dark gradient (e.g., `from-[hsl(222,80%,18%)] via-[hsl(222,70%,12%)] to-[hsl(222,60%,8%)]`)
  - `Sparkles` icon: Change from `text-accent` (green) to `text-primary` (blue)
  - "Post a Task" button: Change from `bg-accent` to `bg-primary`, update shadow from `shadow-accent/30` to `shadow-primary/30`

