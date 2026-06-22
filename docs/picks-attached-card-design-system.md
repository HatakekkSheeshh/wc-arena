  # Picks Attached-Card Design System

This document captures the layout rules from `src/Picks.tsx` so other app pages can match its attached-card style.

## Page shell

- Use `AppShell` for shared header navigation and CDN background.
- The page content wrapper should not set `bg-page`; let the AppShell background remain visible.
- Use this page wrapper pattern:

```tsx
<div className="relative z-10 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 min-h-0">
```

## Title card

- Keep the title separate from the main content card.
- Use a compact white card with a heavy border and strong shadow:

```tsx
<div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col w-full xl:w-1/2 shadow-[8px_8px_0_0_var(--color-shadow)]">
```

## Main content card

- Use one large white card to contain the page body.
- The card provides the only outer border and outer shadow for the attached content area.
- Do not add a second full-width `border-4` wrapper immediately inside this card.

```tsx
<div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col gap-4 lg:gap-6 shadow-[8px_8px_0_0_var(--color-shadow)] rounded-sm">
```

## Attached sections inside the main card

- Sections inside the main card should touch each other directly.
- Use borders between sections, not extra margins or separate card shadows.
- Avoid `gap-*`, `shadow-*`, and full outer `border-4` on inner section groups unless the section intentionally stands alone.

## Stats row

- Stats sit directly at the top of the main content flow.
- The stats grid does not need its own outer border because the main content card already has the outer border.
- Separate stats from the next section with `border-b-4 border-main` on the stats grid.
- Use internal `border-r-4` and responsive `border-b-4` on cells.

Pattern:

```tsx
<div className="grid grid-cols-1 sm:grid-cols-3 border-b-4 border-main">
  <div className="flex items-center gap-4 sm:border-r-4 border-b-4 sm:border-b-0 border-main p-4 lg:p-5 bg-c1 text-main">
    ...
  </div>
</div>
```

## Main split layout

- The primary content and right rail attach directly under the stats row.
- Use one flex row with no gap.
- Separate columns with `xl:border-r-4 border-main` on the left column.

```tsx
<div className="flex flex-col xl:flex-row flex-1">
  <div className="flex-1 border-r-0 xl:border-r-4 border-main flex flex-col bg-muted">
    ...
  </div>
  <div className="w-full xl:w-[420px] bg-card flex flex-col">
    ...
  </div>
</div>
```

## Left column sections

- The left column is a vertical attached stack.
- Section headers, filters, rows, and action strips use `border-b-4 border-main` to attach.
- The left column can use `bg-muted` to contrast against white rows/cards.
- Rows use `bg-card` and `border-b-4 border-main`.

## Right rail sections

- The right rail is also a vertical attached stack.
- Each rail block should use `border-b-4 border-main` between blocks.
- Rail block titles use `bg-main text-inv font-black uppercase`.
- Small inner list rows can use lighter `border-line` borders to avoid over-heavy nested borders.

## Bottom strip

- A bottom instruction/status strip can attach to the main card with `border-t-4 border-main`.
- It should be a direct child of the main content card so it reads as part of the same system.

## What to avoid

- Do not wrap the attached content in an additional full `border-4` and `shadow-*` block inside the main white card.
- Do not use `gap-*` between stats, main split, and bottom strip if the goal is attached sections.
- Do not add `bg-page` to the page wrapper because it hides the AppShell CDN background.
- Do not restore macframe or old standalone nav wrappers.
