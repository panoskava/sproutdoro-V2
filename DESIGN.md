# Design System: The Nurtured Garden

## 1. Overview & Creative North Star
**Creative North Star: "The Digital Greenhouse"**

This design system rejects the clinical, high-pressure aesthetic of traditional productivity tools. Instead of a ticking clock, we are creating a living ecosystem. The goal is to move away from "efficiency" toward "cultivation." 

To break the "template" look, we utilize **Organic Asymmetry**. Layouts should feel like a garden path—intentional but not perfectly linear. We achieve this through generous white space, overlapping botanical-inspired elements, and a sophisticated typography scale that balances the warmth of a storybook with the clarity of a high-end editorial piece.

---

## 2. Colors: The Earth & Leaf Palette
Our palette is rooted in the soil and the sprout. We use tonal shifts rather than structural lines to define the user’s journey.

### The "No-Line" Rule
**Strict Prohibition:** Do not use 1px solid borders to section off content. 
Boundaries are created through color-blocking and background shifts. A `surface-container-low` section sitting on a `surface` background is our primary method of containment. This creates a soft, tactile feel reminiscent of layered paper or mulch.

### Surface Hierarchy & Nesting
Treat the UI as physical layers of organic material.
*   **Base Layer:** `surface` (#fdf9ef) – The fertile ground.
*   **Secondary Context:** `surface-container-low` (#f7f3e9) – Subtle recession.
*   **Actionable Depth:** `surface-container-highest` (#e6e2d8) – Significant elevation for focused tasks.

### The "Glass & Gradient" Rule
To add "soul," use **Frosted Sage Glassmorphism**. Floating elements (like a timer overlay) should use `primary_container` at 80% opacity with a `24px` backdrop blur. 
*   **Signature Gradient:** For main CTAs, use a linear gradient from `primary` (#516233) to `primary_container` (#697b49) at a 135-degree angle to mimic the way light hits a leaf.

---

## 3. Typography: The Friendly Editorial
We pair **Plus Jakarta Sans** (for structure and impact) with **Be Vietnam Pro** (for warmth and legibility).

*   **Display (Plus Jakarta Sans):** Oversized and soft. Used for the countdown timer and "Success" states. It should feel like a welcoming embrace.
*   **Headlines (Plus Jakarta Sans):** Set with tight letter-spacing (-0.02rem) to feel intentional and modern.
*   **Body (Be Vietnam Pro):** High x-height and open counters ensure that even long sessions of focus remain easy on the eyes.
*   **Labels (Plus Jakarta Sans):** All-caps for hierarchy, but always with increased letter-spacing (0.05rem) to maintain a "whimsical" rather than "authoritarian" tone.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are too "tech." We use light and opacity to define space.

*   **The Layering Principle:** Instead of shadows, stack containers. Place a `surface-container-lowest` card (pure white) onto a `surface-container-high` background to create a crisp, natural lift.
*   **Ambient Shadows:** If an element must float (like a "Plant Sprout" FAB), use a `8%` opacity shadow tinted with `secondary` (#934a29). 
    *   *Spec:* `0px 12px 32px rgba(147, 74, 41, 0.08)`
*   **The "Ghost Border" Fallback:** If accessibility requires a border, use `outline-variant` (#c6c8ba) at **15% opacity**. This creates a suggestion of a container without breaking the organic flow.

---

## 5. Components

### Buttons: The Seedlings
*   **Primary:** Rounded `full`. Gradient fill (`primary` to `primary_container`). White text.
*   **Secondary:** Rounded `xl` (3rem). `surface-container-highest` fill. No border.
*   **Tertiary:** No background. `primary` text with a `sm` (0.5rem) rounded focus state.

### Cards: The Garden Beds
*   **Style:** Forbid dividers. Use `DEFAULT` (1rem) or `lg` (2rem) corner radius. 
*   **Separation:** Use `1.5rem` of vertical padding (from our Spacing Scale) to separate list items rather than a line.

### Progress Indicators: The Sprout Growth
*   **Pomodoro Timer:** A circular track using `surface-variant`. The "progress" is a `primary` stroke that tapers at the end like a vine.
*   **Micro-Gamification:** As the timer progresses, a `secondary_fixed` (#ffdbce) dot moves along the track, acting as a "sun" nurturing the timer.

### Input Fields: Soft Soil
*   **Style:** `surface-container-lowest` background. `md` rounded corners.
*   **Focus State:** Instead of a heavy border, the background shifts to `surface-bright` and the label moves up in `secondary` color.

---

## 6. Do’s and Don’ts

### Do:
*   **Use Intentional Asymmetry:** Align text to the left but allow botanical illustrations or "sprouts" to break the grid on the right.
*   **Embrace "Breathing Room":** If you think there is enough margin, add `8px` more. The UI should feel like a wide-open field.
*   **Animate with Ease:** Use "Cubic Bezier (0.34, 1.56, 0.64, 1)" for transitions to give a "bouncy," organic growth feel to elements appearing on screen.

### Don't:
*   **No Hard 90-Degree Angles:** Every corner must have at least a `sm` radius. Sharpness kills the cottagecore aesthetic.
*   **No Pure Black:** Never use `#000000`. Use `on_surface` (#1c1c16) for high-contrast text to keep the heat of the design "warm."
*   **No Industrial Icons:** Avoid thin, sharp, wireframe icons. Use "Duotone" or "Rounded" icon sets that feel weighted and friendly.