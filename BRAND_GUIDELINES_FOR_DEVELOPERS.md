# KUMPLIO Brand Guidelines for Developers

## Quick Start Guide

This document serves as a developer-focused brand guide to ensure consistency when adding new features or pages to KUMPLIO.

---

## Color Palette

### Primary Colors (Use These!)
```css
--primary: #B1D374 (Lime Green) - Main accent, CTAs
--secondary: #7496A0 (Blue-Gray) - Secondary accent
--background: #010101 (Pure Black) - Main background
--foreground: #FFFFFF (White) - Main text color
--card: #181E2A (Dark Navy) - Card backgrounds
```

### CSS Implementation
```css
/* In globals.css - Always use these tokens! */
--primary: 177 211 116;              /* Lime */
--primary-foreground: 1 1 1;         /* Almost black */
--secondary: 116 150 160;            /* Blue-gray */
--muted-foreground: 153 153 153;     /* Gray text */
```

### Tailwind Classes
```html
<!-- Use these Tailwind classes -->
bg-primary       <!-- Lime background -->
text-primary     <!-- Lime text (use sparingly) -->
bg-background    <!-- Black background -->
text-foreground  <!-- White text -->
text-muted-foreground  <!-- Gray text -->
```

---

## Typography

### Font Stack
```css
font-family: "Montserrat", sans-serif;
```

### Heading Hierarchy
```html
<!-- H1: Page titles, hero headlines -->
<h1 className="text-4xl md:text-5xl font-bold">
  Un sistema integral de IA
</h1>

<!-- H2: Section titles -->
<h2 className="text-3xl md:text-4xl font-semibold">
  Sección Principal
</h2>

<!-- H3: Subsections -->
<h3 className="text-2xl font-semibold">
  Subtítulo
</h3>

<!-- H4: Card titles -->
<h4 className="text-lg font-semibold">
  Card Title
</h4>

<!-- Body text -->
<p className="text-base leading-relaxed">
  Regular paragraph text
</p>

<!-- Caption/Small text -->
<p className="text-sm text-muted-foreground">
  Supporting text
</p>
```

---

## Buttons

### Primary Button (Call-to-Action)
```tsx
<Button size="lg" className="bg-black text-white hover:bg-black/80 group/btn font-semibold">
  Empezar Ahora
  <ArrowRight className="ml-3 w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
</Button>
```

**Color:** Black background, white text
**Hover:** Scale 0.8x opacity, slide arrow right
**Animation:** 300ms transition

### Secondary Button (Alternative Action)
```tsx
<Button size="lg" className="border-2 border-black text-primary-foreground bg-black/10 hover:bg-black hover:text-white group/btn font-semibold" variant="outline">
  Ver Sistema
</Button>
```

**Color:** Lime outline, white text on transparent bg
**Hover:** Fill with black, white text
**Animation:** 300ms transition

### Button DO's and DON'Ts
```
✅ DO: Use black for primary CTAs
✅ DO: Use white text on black buttons
✅ DO: Add arrow icons to action buttons
✅ DO: Include 300ms smooth transitions
❌ DON'T: Use lime text on white background
❌ DON'T: Mix button styles on same section
❌ DON'T: Use text-black on lime backgrounds
```

---

## Layout Patterns

### Container & Sections
```tsx
export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background border-b border-border">
        {/* Navigation */}
      </header>

      {/* Main content sections */}
      <section className="py-24 px-6 bg-background">
        <div className="container mx-auto max-w-6xl">
          {/* Section content */}
        </div>
      </section>

      {/* CTA Section with Lime Background */}
      <section className="py-24 px-6 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-2xl text-center space-y-8">
          <h2>Call to Action</h2>
          <Button>Primary CTA</Button>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}
```

### Spacing Rules
```
Sections: py-12 (48px), py-24 (96px)
Containers: px-6 (24px) on sides
Grid gaps: gap-4, gap-6, gap-8
Card padding: p-6, p-8
Button padding: px-8, py-3 (lg size)
```

---

## Footer Usage

### Always Use the Footer Component
```tsx
import { Footer } from '@/components/footer'

export default function Page() {
  return (
    <div>
      {/* Page content */}
      <Footer />
    </div>
  )
}
```

**DO NOT** create custom footer HTML. Use the unified Footer component for consistency.

---

## Accessibility Requirements

### Color Contrast
```
✅ PASS: White (#FFF) on black (#000) = 21:1 (WCAG AAA)
✅ PASS: Lime (#B1D374) on black = 7:1 (WCAG AA)
✅ PASS: Gray (#999) on black = 4.5:1 (WCAG AA)
❌ FAIL: Lime text on white background
❌ FAIL: Black text on dark backgrounds
```

### Text Requirements
```
✅ DO: Use text-white on dark backgrounds
✅ DO: Use text-muted-foreground for secondary text
✅ DO: Ensure 16px+ for body text
✅ DO: Use line-height: 1.6 for body text
❌ DON'T: Use text smaller than 12px for readability
❌ DON'T: Use low-contrast colors
```

### Semantic HTML
```html
✅ DO: <main> for main content
✅ DO: <header>, <nav>, <section>, <footer> elements
✅ DO: <h1> only once per page
✅ DO: Proper heading hierarchy (h1→h2→h3)
✅ DO: <button> for interactive elements
❌ DON'T: <div> for semantic sections
```

---

## Component Examples

### Card Component
```tsx
<div className="bg-card p-6 rounded-md border border-border">
  <h3 className="text-lg font-semibold text-foreground mb-2">Card Title</h3>
  <p className="text-sm text-muted-foreground">Card description text</p>
</div>
```

### Stat Block
```tsx
<div className="text-center">
  <div className="text-4xl font-bold text-primary">95%</div>
  <p className="text-sm text-muted-foreground mt-2">Accuracy en análisis</p>
</div>
```

### Badge/Pill
```tsx
<Badge className="bg-primary/10 text-primary border border-primary">
  Feature Tag
</Badge>
```

---

## Do's and Don'ts for Brand Consistency

### Colors
```
✅ DO: Use lime (#B1D374) for primary actions
✅ DO: Use black (#010101) for backgrounds
✅ DO: Use white (#FFFFFF) for text on dark
✅ DO: Use gray (#999) for secondary text
❌ DON'T: Add new colors to the palette
❌ DON'T: Use lime text on light backgrounds
❌ DON'T: Use purple, orange, or other off-brand colors
```

### Typography
```
✅ DO: Use Montserrat font
✅ DO: Follow heading hierarchy (H1→H4)
✅ DO: Use proper font weights (normal, 600, 700)
❌ DON'T: Use other fonts
❌ DON'T: Skip heading levels (H1→H3)
❌ DON'T: Use decorative fonts for body text
```

### Layout
```
✅ DO: Use Flexbox for layouts
✅ DO: Use Tailwind spacing scale
✅ DO: Follow max-width containers
✅ DO: Use responsive breakpoints (md:, lg:)
❌ DON'T: Use absolute positioning for layouts
❌ DON'T: Use arbitrary pixel values
❌ DON'T: Create non-responsive designs
```

### Components
```
✅ DO: Reuse existing components
✅ DO: Use the Footer component
✅ DO: Follow button patterns
✅ DO: Maintain consistent spacing
❌ DON'T: Create custom components duplicating existing ones
❌ DON'T: Create custom footers
❌ DON'T: Vary button styles
```

---

## Quick Reference Checklist

Before launching a new page or feature:

- [ ] Color palette uses only approved colors (Lime, Blue-Gray, Navy, Black, White)
- [ ] Typography uses Montserrat with proper hierarchy
- [ ] Buttons follow the primary/secondary pattern
- [ ] Contrast ratios meet WCAG AA+ requirements
- [ ] Layout uses Flexbox and Tailwind spacing
- [ ] Footer component is imported and used
- [ ] Responsive design implemented (mobile-first)
- [ ] All links are keyboard accessible
- [ ] Semantic HTML used throughout
- [ ] No custom colors added to globals.css

---

## Files to Reference

- **Design System:** `/app/globals.css` (color tokens, typography)
- **Footer Component:** `/components/footer.tsx` (unified footer)
- **Button Examples:** `/components/ui/button.tsx` (button styles)
- **Layout Example:** `/app/page.tsx` (homepage structure)
- **Full Audit:** `/BRAND_AUDIT_REPORT_2026-06-07.md` (detailed analysis)

---

## Questions or Brand Inconsistencies?

1. Check this guide first
2. Review `/app/globals.css` for tokens
3. Reference existing pages for patterns
4. Run the brand audit tools

**Remember:** Consistency is key to a professional brand. When in doubt, follow the patterns in existing pages.

---

**Last Updated:** June 7, 2026
**Brand Version:** 2.0 (Post-Audit)
**Compliance:** 92.6% Consistent ✅
