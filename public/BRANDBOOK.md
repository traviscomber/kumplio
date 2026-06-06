# KUMPLIO Brand Book

## Table of Contents
1. Brand Overview
2. Color System
3. Typography
4. Visual Grid & Layout
5. Component Specifications
6. Imagery & Illustrations
7. Photography Guidelines
8. Voice & Tone
9. Application Examples

---

## 1. Brand Overview

### Mission
Transformar cómo las empresas chilenas entienden y gestionan las obligaciones de cumplimiento en documentos complejos.

### Brand Promise
**Claridad a través de Inteligencia** — Convierte la complejidad abrumadora en información accionable.

### Brand Positioning
KUMPLIO es la plataforma premium de inteligencia documental para cumplimiento empresarial, confiada por líderes legales, operativos y comerciales en Chile.

### Core Values
- **Clarity**: Información clara y estructurada sobre datos abrumadores
- **Trust**: Seguridad empresarial y confiabilidad
- **Intelligence**: Insights potenciados por IA que respetan la experiencia humana
- **Precision**: Exact, auditable information for high-stakes decisions
- **Respect**: Serious tools for serious work

### Target Audience
- Legal departments and in-house counsel
- Compliance officers
- Procurement executives
- Commercial teams managing contracts
- Enterprise operations leaders

---

## 2. Color System

### Primary Brand Color
**KUMPLIO Blue** — The color of trust, intelligence, and forward-thinking enterprise.

- **Primary**: `#3B66FF` (RGB: 59, 102, 255)
- **Light**: `#EFF0FF` (RGB: 239, 240, 255) — For backgrounds
- **Dark**: `#1F3DB8` (RGB: 31, 61, 184) — For hover/active states

### Secondary Color
**Precision Cyan** — Accent color for actions and positive states.

- **Cyan**: `#06D6D6` (RGB: 6, 214, 214)
- **Light Cyan**: `#E0FEFE` (RGB: 224, 254, 254)

### Neutral Palette

#### Grays (7-step system for hierarchy)
- **Gray 900** (Darkest): `#0F1419` — Primary text
- **Gray 800**: `#1A1F2E` — Secondary text
- **Gray 700**: `#2D3142` — Tertiary text, borders
- **Gray 600**: `#464F63` — Placeholder text
- **Gray 400**: `#9AA2B5` — Disabled, secondary elements
- **Gray 200**: `#E4E8F0` — Light backgrounds, borders
- **Gray 50** (Lightest): `#F8F9FC` — Pure white backgrounds

#### True Black Background
- **Black**: `#000000` — For premium dark mode
- **Gray 950**: `#0A0D14` — Alternative dark background

### Semantic Colors

#### Status Colors
- **Success Green**: `#10B981` (RGB: 16, 185, 129)
- **Warning Amber**: `#F59E0B` (RGB: 245, 158, 11)
- **Error Red**: `#EF4444` (RGB: 239, 68, 68)
- **Info Blue**: `#3B82F6` (RGB: 59, 130, 246)

#### Risk Levels
- **Critical Risk**: `#DC2626` (RGB: 220, 38, 38)
- **High Risk**: `#F97316` (RGB: 249, 115, 22)
- **Medium Risk**: `#EAB308` (RGB: 234, 179, 8)
- **Low Risk**: `#84CC16` (RGB: 132, 204, 22)

### Color Usage Guidelines

**UI Layer Hierarchy**:
1. Background: Gray 50 (light mode) / Black (dark mode)
2. Cards/Containers: White / Gray 950
3. Surfaces: Gray 100 / Gray 900
4. Text: Gray 900 / Gray 50
5. Borders: Gray 200 / Gray 700
6. Interactive: Primary Blue for CTAs

**Dark Mode is Primary** — The platform is designed for dark mode first, with light mode as secondary support.

---

## 3. Typography

### Font Stack
- **Heading Font**: "Inter" or system fonts: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Body Font**: "Inter" or system fonts (same stack)
- **Monospace**: `'Fira Code', 'Courier New', monospace` — For code snippets and technical content

### Type Scale

| Size | Weight | Line Height | Usage |
|------|--------|-------------|-------|
| **64px** | 700 (Bold) | 1.2 | Page hero titles |
| **56px** | 700 | 1.2 | Large section headers |
| **48px** | 700 | 1.2 | Medium section headers |
| **40px** | 600 (SemiBold) | 1.25 | Small section headers |
| **32px** | 600 | 1.3 | Card titles, dashboard headers |
| **24px** | 600 | 1.4 | Subsection titles |
| **20px** | 600 | 1.4 | Component headers, strong emphasis |
| **18px** | 500 (Medium) | 1.5 | Large body text, UI text |
| **16px** | 400 (Regular) | 1.5 | Standard body text, default UI |
| **14px** | 400 | 1.6 | Secondary text, labels, captions |
| **12px** | 400 | 1.6 | Tertiary text, metadata, tags |
| **11px** | 500 | 1.5 | Tiny labels, timestamps |

### Font Weights
- **700**: Bold — Headlines, emphasis
- **600**: SemiBold — Subheadings, strong emphasis
- **500**: Medium — Labels, important secondary text
- **400**: Regular — Body text, standard UI

### Text Styles

**Heading 1** (64px, 700) — Page hero titles  
**Heading 2** (48px, 700) — Section titles  
**Heading 3** (32px, 600) — Card titles, dashboard sections  
**Body Large** (18px, 400) — Prominent body text  
**Body** (16px, 400) — Default body text  
**Caption** (14px, 400) — Helper text, labels  
**Tiny** (12px, 400) — Metadata, timestamps  

### Letter Spacing
- Headlines: -0.5px (tighter for impact)
- Body text: 0px (default)
- Captions: 0.25px (subtle opening)

---

## 4. Visual Grid & Layout

### Grid System
- **4px base unit** — All spacing and sizing based on multiples of 4px
- **8px** — Minimum spacing between elements
- **16px** — Standard spacing
- **24px** — Section spacing
- **32px** — Large section spacing
- **48px** — Hero spacing
- **64px** — Page margins

### Responsive Breakpoints
- **Mobile**: 320px – 640px
- **Tablet**: 641px – 1024px
- **Desktop**: 1025px – 1440px
- **Wide**: 1441px+

### Container Widths
- **Mobile**: Full width - 16px margins
- **Tablet**: 600px
- **Desktop**: 1200px
- **Wide**: 1400px

### Spacing Scale (Tailwind-aligned)
- **xs**: 4px
- **sm**: 8px
- **md**: 16px
- **lg**: 24px
- **xl**: 32px
- **2xl**: 48px
- **3xl**: 64px

---

## 5. Component Specifications

### Buttons

#### Primary Button
- **Background**: KUMPLIO Blue (#3B66FF)
- **Text**: White, 16px, 600 weight
- **Padding**: 12px 24px
- **Border Radius**: 8px
- **Hover**: Dark Blue (#1F3DB8), drop shadow
- **Disabled**: Gray 400, cursor not-allowed

#### Secondary Button
- **Background**: Gray 100 / Gray 900
- **Text**: Gray 900 / Gray 50
- **Border**: 1px Gray 200 / Gray 700
- **Padding**: 12px 24px
- **Border Radius**: 8px
- **Hover**: Gray 200 / Gray 800

#### Tertiary Button (Text)
- **Background**: Transparent
- **Text**: KUMPLIO Blue
- **Padding**: 8px 12px
- **No border**
- **Hover**: Light Blue background

### Cards
- **Background**: White / Gray 950
- **Border**: 1px Gray 200 / Gray 700
- **Border Radius**: 12px
- **Padding**: 24px
- **Shadow**: 0 1px 3px rgba(0,0,0,0.08)
- **Hover**: Shadow increases to 0 4px 12px rgba(0,0,0,0.12)

### Input Fields
- **Background**: Gray 50 / Gray 900
- **Border**: 1px Gray 200 / Gray 700
- **Border Radius**: 8px
- **Padding**: 12px 16px
- **Focus**: Border becomes KUMPLIO Blue, shadow 0 0 0 3px rgba(59,102,255,0.1)
- **Font**: 16px, Regular

### Status Badges
- **Success**: Green background (#10B981), white text, 8px 12px
- **Warning**: Amber background (#F59E0B), white text, 8px 12px
- **Error**: Red background (#EF4444), white text, 8px 12px
- **Info**: Blue background (#3B82F6), white text, 8px 12px
- **Border Radius**: 6px

### Tables
- **Header Row**: Gray 900 / Gray 100 background, 600 weight, 14px
- **Data Rows**: 16px Regular text
- **Row Height**: 48px
- **Border**: 1px Gray 200 / Gray 700 between rows
- **Hover Row**: Gray 100 / Gray 800 background

### Risk Level Indicators
- **Critical**: Red (#DC2626) with warning icon
- **High**: Orange (#F97316)
- **Medium**: Amber (#EAB308)
- **Low**: Green (#84CC16)

---

## 6. Imagery & Illustrations

### Illustration Style
- **Approach**: Minimalist, geometric, professional
- **Color Usage**: Limited palette using brand colors
- **Technique**: Flat design with subtle depth, no gradients
- **Consistency**: Uniform line weight (2px), consistent visual language

### Illustration Themes
1. **Document Intelligence** — Clean documents with data flows
2. **Compliance Success** — Checkmarks, structures, clarity
3. **Risk Management** — Warning states, severity levels
4. **Team Collaboration** — People in professional contexts
5. **Data Transformation** — Information flowing, becoming structured
6. **Security & Trust** — Locks, shields, protection concepts

### Photography
- **Style**: Corporate, authentic, professional
- **Color**: Desaturated with KUMPLIO Blue color accents
- **People**: Diverse, professional, in work contexts
- **Objects**: High-quality, clean, minimal backgrounds
- **Avoid**: Stock photo clichés, overly polished, artificial

---

## 7. Voice & Tone

### Brand Voice Characteristics
- **Professional but approachable**: Expert, not condescending
- **Clear and direct**: No corporate jargon or unnecessarily complex language
- **Confident**: Statements backed by expertise
- **Respectful**: Recognition of seriousness of user tasks

### Tone Examples

**For Errors**:
*"We couldn't process this file. Make sure it's a valid PDF or image under 50MB."*
— Not: "Error: Invalid file format"

**For Success**:
*"Document analyzed. 12 obligations identified."*
— Not: "Success!"

**For Guidance**:
*"Upload contracts to automatically extract obligations, risks, and key dates."*
— Not: "Click here to begin the uploading process"

---

## 8. Application Examples

### Dashboard Header
- Logo in top left (20px height)
- Navigation items (16px, Gray 600)
- User menu on right
- Divider line below (1px Gray 200 / Gray 700)

### Card Section
- Header (32px, 600 weight)
- Description (14px, Gray 600 / Gray 400)
- Content area with 16px padding
- Footer with action buttons (Primary + Secondary)

### Document Upload
- Large drag-and-drop zone (Gray 50 / Gray 900)
- Dashed border (2px Gray 300 / Gray 600)
- Icon (Cyan accent)
- Helper text below

### Compliance Matrix
- Header row with Gray background
- Data rows with alternating backgrounds
- Risk badge in one column
- Action buttons in last column
- 12px gaps between columns

---

## 9. Design Specifications

### Border Radius Scale
- **xs**: 4px — Small UI elements
- **sm**: 6px — Tags, badges
- **md**: 8px — Buttons, inputs
- **lg**: 12px — Cards, modals
- **xl**: 16px — Large containers

### Shadow System
- **None**: Flat elements
- **sm**: `0 1px 3px rgba(0,0,0,0.08)`
- **md**: `0 4px 12px rgba(0,0,0,0.12)`
- **lg**: `0 12px 24px rgba(0,0,0,0.16)`
- **xl**: `0 20px 40px rgba(0,0,0,0.20)`

### Opacity Levels
- **100%**: Primary content
- **87%**: Secondary content (Gray 700-800 on light)
- **71%**: Tertiary content (Gray 600 on light)
- **51%**: Disabled elements
- **12%**: Subtle backgrounds

---

## Design System Adoption

### Implementation
- CSS variables aligned to this specification
- Tailwind configuration extended with KUMPLIO tokens
- Component library with all specifications
- Figma file as single source of truth

### Guardrails
- Never mix more than 3 font sizes on one page
- Maximum 2 CTAs per section (Primary + Secondary)
- Respect 4px grid for all spacing
- Use semantic colors for status — never for random emphasis
- Dark mode first, light mode as secondary

---

*Last Updated: June 2026*  
*Version: 1.0 - Enterprise Edition*
