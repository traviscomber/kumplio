# BrightScope Component Library

## Table of Contents
1. Button Component Variants
2. Card Component
3. Badge & Status Indicators
4. Form Inputs
5. Tables
6. Alerts & Messages
7. Loading States
8. Modal & Dialog
9. Navigation
10. Data Visualization

---

## 1. Button Component Variants

### Primary Button
**Usage**: Main CTAs, form submissions
```
Color: BrightScope Blue (#3B66FF)
Padding: 12px 24px
Font: 16px, 600 weight
Border Radius: 8px
State: Hover (dark blue #1F3DB8), Active (darker), Disabled (gray)
```

### Secondary Button
**Usage**: Alternative actions, navigation
```
Background: Gray 900 border: 1px Gray 700
Color: Gray 50 text
Padding: 12px 24px
Font: 16px, 600 weight
Border Radius: 8px
```

### Tertiary Button (Text)
**Usage**: Low-priority actions, links
```
Background: Transparent
Color: BrightScope Blue
Padding: 8px 12px
No border
Hover: Light blue background
```

### Icon Button
**Usage**: Minimal actions, toolbar items
```
Size: 40px × 40px
Icon: 24px
Padding: 8px
Border Radius: 8px
Hover: Gray 800 background
```

### Button Sizes
- **sm**: 8px 16px, 14px font
- **md**: 12px 24px, 16px font
- **lg**: 16px 32px, 16px font
- **xl**: 20px 40px, 18px font

---

## 2. Card Component

### Standard Card
```
Background: Gray 950
Border: 1px Gray 700
Border Radius: 12px
Padding: 24px
Shadow: 0 1px 3px rgba(0,0,0,0.08)
Hover: Shadow increases to 0 4px 12px rgba(0,0,0,0.12)
```

### Card with Header
```
Header Row:
- Padding: 24px 24px 16px
- Font: 32px, 600 weight
- Border Bottom: 1px Gray 700

Content Area:
- Padding: 24px
- Font: 16px, 400 weight
```

### Card with Actions
```
Footer Row:
- Padding: 16px 24px 24px
- Display: Flex, gap-3
- Buttons: Primary + Secondary
- Border Top: 1px Gray 700
```

### Elevated Card (Secondary Emphasis)
```
Background: Gray 900
Border: 1px Gray 800
Shadow: 0 4px 12px rgba(0,0,0,0.16)
Hover: Shadow 0 8px 24px rgba(0,0,0,0.20)
```

---

## 3. Badge & Status Indicators

### Status Badge
```
Success: Green (#10B981), white text, 8px 12px padding
Warning: Amber (#F59E0B), white text, 8px 12px padding
Error: Red (#EF4444), white text, 8px 12px padding
Info: Blue (#3B82F6), white text, 8px 12px padding
Border Radius: 6px
Font: 12px, 600 weight
```

### Risk Severity Badge
```
Critical: Red (#DC2626)
High: Orange (#F97316)
Medium: Amber (#EAB308)
Low: Green (#84CC16)

Display: Icon + Text, 10px 14px padding
Border Radius: 6px
Font: 14px, 600 weight
```

### Dot Indicator
```
Size: 8px
Colors: Success (green), Warning (amber), Error (red), Info (blue), Pending (gray)
Background: Solid color
Use with text label for status
```

---

## 4. Form Inputs

### Text Input
```
Background: Gray 900
Border: 1px Gray 700
Border Radius: 8px
Padding: 12px 16px
Font: 16px, 400 weight
Focus: Border becomes Blue, shadow 0 0 0 3px rgba(59,102,255,0.1)
Placeholder: Gray 600 text, 50% opacity
Disabled: Gray 700 background, Gray 500 text
```

### Textarea
```
Same as text input, but:
Padding: 12px 16px (with more vertical space)
Min Height: 120px
Resize: Vertical only
Line Height: 1.5
```

### Select/Dropdown
```
Same styling as text input
Icon: Chevron down on right side
Hover: Border becomes Blue
```

### Checkbox
```
Size: 20px × 20px
Border: 2px Blue
Border Radius: 4px
Checked: Blue background, white checkmark
Disabled: Gray border, gray background
Label: 14px regular, 8px gap from checkbox
```

### Radio Button
```
Size: 20px diameter
Border: 2px Blue outline
Selected: Blue dot center (8px)
Disabled: Gray colors
Label: 14px regular, 8px gap
```

### Toggle Switch
```
Size: 48px × 28px
Border Radius: 14px
Background: Gray 700 (off), Blue (on)
Circle: 24px diameter, white
Padding: 2px
Transition: Smooth 150ms
```

### Form Label
```
Font: 14px, 600 weight
Color: Gray 50
Margin Bottom: 8px
Required indicator: Red asterisk
```

---

## 5. Tables

### Table Header Row
```
Background: Gray 900
Font: 14px, 600 weight, Gray 200
Padding: 12px 16px
Border Bottom: 1px Gray 700
Sticky: Top positioning for scrolling
```

### Table Data Row
```
Font: 16px, 400 weight
Color: Gray 50
Padding: 12px 16px
Height: 48px
Border Bottom: 1px Gray 800
Hover: Background Gray 850
Striped: Alternate rows with Gray 900 / Gray 850
```

### Table Cell Types
```
Text: Left-aligned
Number: Right-aligned
Status: Center with badge
Action: Right-aligned with icon buttons
Date: 14px regular, formatted consistently
```

### Table Column Width
```
Auto-size columns to content
Minimum 80px
Maximum 300px for text
Use horizontal scroll on mobile
Set widths as percentages for responsive
```

---

## 6. Alerts & Messages

### Error Alert
```
Background: Red (#EF4444) at 10% opacity
Border: 1px Red (#EF4444) at 50% opacity
Icon: Error icon (red)
Text: Red 400, 14px
Padding: 12px 16px
Border Radius: 8px
```

### Warning Alert
```
Background: Amber (#F59E0B) at 10% opacity
Border: 1px Amber at 50% opacity
Icon: Warning icon (amber)
Text: Amber text
Padding: 12px 16px
Border Radius: 8px
```

### Success Alert
```
Background: Green (#10B981) at 10% opacity
Border: 1px Green at 50% opacity
Icon: Checkmark (green)
Text: Green 400, 14px
Padding: 12px 16px
Border Radius: 8px
```

### Info Alert
```
Background: Blue (#3B82F6) at 10% opacity
Border: 1px Blue at 50% opacity
Icon: Info icon (blue)
Text: Blue 400, 14px
Padding: 12px 16px
Border Radius: 8px
Dismissible: Optional close button
```

---

## 7. Loading States

### Spinner
```
Size: 24px diameter
Color: BrightScope Blue (#3B66FF)
Animation: Rotating 360° over 1s, infinite
Stroke Width: 2px
```

### Skeleton Loader
```
Background: Gray 900
Shimmer: Gray 800 animation
Border Radius: Matches component
Height: 16px (text), 40px (button), 200px (card)
Gap: 8px between skeleton rows
Duration: 1.5s shimmer animation
```

### Progress Bar
```
Background: Gray 800
Foreground: Blue (#3B66FF)
Height: 4px
Border Radius: 2px
Width: Based on percentage
Animation: Smooth transitions
```

### Loading Indicator with Text
```
Spinner: 24px (left-aligned)
Text: "Loading...", 14px regular
Gap: 12px
```

---

## 8. Modal & Dialog

### Modal Overlay
```
Background: Black at 50% opacity
Z-index: 1000
Animation: Fade in 150ms
```

### Modal Container
```
Background: Gray 950
Border: 1px Gray 700
Border Radius: 12px
Shadow: 0 20px 40px rgba(0,0,0,0.20)
Max Width: 500px (default)
Padding: 24px
Animation: Scale up + fade in 200ms
```

### Modal Header
```
Font: 32px, 600 weight
Margin Bottom: 16px
Border Bottom: 1px Gray 700
Padding Bottom: 16px
Close Button: Top right, 40px × 40px
```

### Modal Body
```
Font: 16px, 400 weight
Line Height: 1.5
Max Height: 60vh (scrollable)
Padding: 16px 0
```

### Modal Footer
```
Padding Top: 16px
Border Top: 1px Gray 700
Display: Flex, justify-end
Gap: 12px
Buttons: Secondary + Primary
```

---

## 9. Navigation

### Top Navigation Bar
```
Height: 64px
Background: Gray 950 with 50% opacity backdrop blur
Border Bottom: 1px Gray 700
Padding: 16px 24px
Position: Sticky top, z-index 50
```

### Navigation Logo
```
Size: 32px × 32px
Logo Text: 16px, 600 weight
Gap: 12px
Left-aligned
```

### Navigation Links
```
Font: 14px, 500 weight
Color: Gray 400
Hover: Gray 50
Active: Blue (#3B66FF)
Padding: 8px 12px
Border Radius: 6px
Gap: 24px between items
```

### Navigation User Menu
```
Icon: User avatar or initials
Size: 40px × 40px
Border Radius: 8px
Dropdown: Modal-style with items
```

### Breadcrumb
```
Font: 14px, 400 weight
Color: Gray 400
Separator: "/" in Gray 600
Active: Gray 50
Hover: Blue for interactive items
```

---

## 10. Data Visualization

### Chart Container
```
Background: Gray 950
Border: 1px Gray 700
Border Radius: 12px
Padding: 24px
Legend: Below chart, 14px
Title: 20px, 600 weight above
```

### Color Palette for Charts
```
Primary Series: Blue (#3B66FF)
Secondary: Cyan (#06D6D6)
Tertiary: Green (#10B981)
Quaternary: Amber (#F59E0B)
Max 4 colors per chart
Use semantic colors for status/risk
```

### Tooltip
```
Background: Gray 900
Border: 1px Gray 700
Padding: 8px 12px
Font: 12px, 400 weight
Border Radius: 6px
Shadow: 0 4px 12px rgba(0,0,0,0.16)
Arrow pointer to data point
```

---

## Component Color Reference

| Component | Color | Usage |
|-----------|-------|-------|
| Primary Button | Blue (#3B66FF) | Main actions |
| Secondary Button | Gray 700 border | Alternative actions |
| Success State | Green (#10B981) | Positive outcomes |
| Warning State | Amber (#F59E0B) | Caution/attention |
| Error State | Red (#EF4444) | Errors/failures |
| Disabled State | Gray 600 | Non-interactive |
| Link/Active | Blue (#3B66FF) | Interactive elements |
| Borders | Gray 700 | UI separation |
| Text Primary | Gray 50 | Main content |
| Text Secondary | Gray 400 | Helper content |

---

## Implementation Checklist

- [ ] Buttons follow size/color specifications
- [ ] All cards have consistent border/shadow
- [ ] Status badges use semantic colors
- [ ] Form inputs have proper focus states
- [ ] Tables have proper header/data row styling
- [ ] Alerts use appropriate color coding
- [ ] Loading states are clear and consistent
- [ ] Modals have proper accessibility
- [ ] Navigation is clear and sticky
- [ ] Charts use brand color palette
- [ ] All components work in dark mode
- [ ] Hover/active states are visible
- [ ] Spacing follows 4px grid
- [ ] Typography matches specifications
- [ ] Radius values are consistent

---

*Last Updated: June 2026*  
*Component Library Version: 1.0*
