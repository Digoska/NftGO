# 🛠️ NftGO Website - Technical Specifications

## 📐 Detailed Layout Specifications

### Hero Section (Section 1)

**Dimensions:**
- Height: 100vh (full viewport)
- Width: 100vw
- Padding: 0 (full bleed)

**Layout:**
```
┌─────────────────────────────────────────┐
│  [Navigation Bar - Sticky]              │
│  ─────────────────────────────────────  │
│                                         │
│         [Animated Headline]             │
│      "Collect NFTs in the Real World"   │
│                                         │
│         [Subheadline]                   │
│    "Pokémon GO meets NFTs..."           │
│                                         │
│    [Phone Mockup]  [3D NFT Models]      │
│    (floating)      (rotating)           │
│                                         │
│    [Join Beta Button] [Watch Trailer]  │
│                                         │
│         [Scroll Indicator ↓]           │
└─────────────────────────────────────────┘
```

**Typography:**
- Headline: 72px (desktop), 48px (mobile), Bold, White
- Subheadline: 24px (desktop), 18px (mobile), Regular, Light Grey
- Buttons: 18px, Semi-bold

**Colors:**
- Background: Linear gradient from `#0A0A0F` to `#1a1a2e`
- Text: White (`#FFFFFF`)
- Primary Button: Purple gradient (`#7C3AED` to `#8B5CF6`)
- Secondary Button: Transparent with border

**Animations:**
- Headline: Fade in + slide up (0.8s ease-out)
- Subheadline: Fade in + slide up (1s ease-out, delay 0.2s)
- Phone: Float animation (3s infinite, ease-in-out)
- 3D NFTs: Rotate 360deg (20s infinite, linear)
- Buttons: Fade in (1.2s ease-out, delay 0.4s)
- Scroll indicator: Bounce animation (2s infinite)

**Interactive Elements:**
- Buttons: Hover glow, scale 1.05, cursor pointer
- Phone: Slight parallax on mouse move
- 3D NFTs: Click to view details (modal)

---

### Features Section (Section 2)

**Layout: Grid (3 columns desktop, 1 column mobile)**

```
┌─────────────────────────────────────────┐
│         "Key Features"                  │
│                                         │
│  ┌──────┐  ┌──────┐  ┌──────┐          │
│  │ Feat │  │ Feat │  │ Feat │          │
│  │  1   │  │  2   │  │  3   │          │
│  └──────┘  └──────┘  └──────┘          │
│                                         │
│  ┌──────┐  ┌──────┐  ┌──────┐          │
│  │ Feat │  │ Feat │  │ Feat │          │
│  │  4   │  │  5   │  │  6   │          │
│  └──────┘  └──────┘  └──────┘          │
└─────────────────────────────────────────┘
```

**Feature Card Specifications:**

**Dimensions:**
- Width: 350px (desktop), 100% (mobile)
- Height: 400px (desktop), auto (mobile)
- Padding: 32px
- Border radius: 16px
- Gap: 24px

**Content Structure:**
```
┌─────────────────────┐
│   [Icon/Visual]     │
│   (100x100px)       │
│                     │
│   [Title]           │
│   (24px, Bold)      │
│                     │
│   [Description]     │
│   (16px, Regular)   │
│   (3-4 lines)       │
│                     │
│   [Learn More →]    │
│   (Link, 14px)      │
└─────────────────────┘
```

**Hover States:**
- Transform: translateY(-8px)
- Box shadow: 0 20px 40px rgba(124, 58, 237, 0.3)
- Border: 2px solid `#7C3AED`
- Transition: 0.3s ease-out

**Scroll Animation:**
- Trigger: When card enters viewport (50% visible)
- Animation: Fade in (opacity 0 → 1) + slide up (20px)
- Stagger: 0.1s delay between cards
- Duration: 0.6s

---

### App Screenshots Section (Section 3)

**Layout: Horizontal Scroll Carousel**

```
┌─────────────────────────────────────────┐
│  "See NftGO in Action"                  │
│                                         │
│  [←]  ┌────┐ ┌────┐ ┌────┐ ┌────┐  [→] │
│       │ SS │ │ SS │ │ SS │ │ SS │      │
│       │ 1  │ │ 2  │ │ 3  │ │ 4  │      │
│       └────┘ └────┘ └────┘ └────┘      │
│                                         │
│  [Dots Indicator]                       │
└─────────────────────────────────────────┘
```

**Screenshot Card:**
- Width: 300px
- Height: 600px (iPhone mockup)
- Border radius: 24px
- Box shadow: 0 10px 30px rgba(0, 0, 0, 0.3)
- Device frame: iPhone 14 Pro mockup

**Carousel Controls:**
- Navigation arrows: 48x48px, semi-transparent background
- Dots indicator: 8px circles, active state: 12px
- Smooth scroll: 300ms ease-out
- Snap points: Each screenshot

**Lightbox Modal:**
- Full screen overlay
- Background: rgba(0, 0, 0, 0.95)
- Image: Max width 90vw, max height 90vh
- Close button: Top right, 48x48px
- Animation: Scale 0.8 → 1.0, fade in

---

### Beta Signup Section (Section 4)

**Layout: Centered, Full Width**

```
┌─────────────────────────────────────────┐
│                                         │
│      "Join the Beta"                    │
│      (48px, Bold, White)                │
│                                         │
│  "Be among the first to experience..."  │
│  (20px, Regular, Light Grey)           │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  [Email Input Field]             │   │
│  │  [Join Beta Button]              │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ✓ Early access to new features         │
│  ✓ Exclusive beta tester badge         │
│  ✓ Help shape the future               │
│                                         │
└─────────────────────────────────────────┘
```

**Form Specifications:**

**Email Input:**
- Width: 100%, max-width: 400px
- Height: 56px
- Padding: 16px 24px
- Border: 2px solid rgba(255, 255, 255, 0.2)
- Border radius: 12px
- Background: rgba(255, 255, 255, 0.1)
- Font: 16px, White
- Placeholder: "Enter your email"

**Focus State:**
- Border: 2px solid `#7C3AED`
- Box shadow: 0 0 0 4px rgba(124, 58, 237, 0.2)
- Background: rgba(255, 255, 255, 0.15)

**Submit Button:**
- Width: 100%, max-width: 400px
- Height: 56px
- Background: Linear gradient (`#7C3AED` to `#8B5CF6`)
- Border radius: 12px
- Font: 18px, Bold, White
- Box shadow: 0 4px 20px rgba(124, 58, 237, 0.4)

**Hover State:**
- Transform: scale(1.02)
- Box shadow: 0 6px 30px rgba(124, 58, 237, 0.5)
- Transition: 0.2s ease-out

**Loading State:**
- Spinner: 20px, White
- Button text: "Joining..."
- Disabled: opacity 0.7, cursor not-allowed

**Success State:**
- Confetti animation (CSS or library)
- Checkmark icon: 64px, Green
- Message: "You're in! Check your email."
- Social links appear below

---

## 🎬 Animation Specifications

### Scroll-Triggered Animations

**Fade In + Slide Up:**
```css
Initial State:
  opacity: 0
  transform: translateY(30px)

Final State:
  opacity: 1
  transform: translateY(0)

Duration: 0.6s
Easing: cubic-bezier(0.4, 0, 0.2, 1)
Trigger: Element 50% visible in viewport
```

**Staggered Animation:**
```javascript
// For multiple elements
delay = index * 0.1s
// Example: Card 1: 0s, Card 2: 0.1s, Card 3: 0.2s
```

**Parallax Effect:**
```javascript
// Background moves slower than foreground
backgroundSpeed = 0.5
foregroundSpeed = 1.0

// On scroll
backgroundY = scrollY * backgroundSpeed
foregroundY = scrollY * foregroundSpeed
```

### Hover Animations

**Button Hover:**
```css
Default:
  transform: scale(1)
  box-shadow: 0 4px 20px rgba(124, 58, 237, 0.4)

Hover:
  transform: scale(1.05)
  box-shadow: 0 6px 30px rgba(124, 58, 237, 0.6)
  transition: 0.2s ease-out
```

**Card Hover:**
```css
Default:
  transform: translateY(0)
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1)

Hover:
  transform: translateY(-8px)
  box-shadow: 0 20px 40px rgba(124, 58, 237, 0.3)
  border: 2px solid #7C3AED
  transition: 0.3s ease-out
```

### Continuous Animations

**Floating Animation (Phone):**
```css
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}

animation: float 3s ease-in-out infinite;
```

**Rotating Animation (3D NFTs):**
```css
@keyframes rotate {
  from { transform: rotateY(0deg); }
  to { transform: rotateY(360deg); }
}

animation: rotate 20s linear infinite;
```

**Pulse Animation (CTA Button):**
```css
@keyframes pulse {
  0%, 100% { box-shadow: 0 4px 20px rgba(124, 58, 237, 0.4); }
  50% { box-shadow: 0 4px 30px rgba(124, 58, 237, 0.6); }
}

animation: pulse 2s ease-in-out infinite;
```

---

## 🎨 Color Palette (Detailed)

### Primary Colors
```css
--primary-purple: #7C3AED;
--primary-purple-dark: #6D28D9;
--primary-purple-light: #8B5CF6;
--primary-gradient: linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%);
```

### Background Colors
```css
--bg-dark: #0A0A0F;
--bg-dark-secondary: #1a1a2e;
--bg-card: rgba(255, 255, 255, 0.05);
--bg-card-hover: rgba(255, 255, 255, 0.1);
```

### Text Colors
```css
--text-primary: #FFFFFF;
--text-secondary: #9CA3AF;
--text-muted: #6B7280;
```

### Accent Colors
```css
--accent-gold: #F59E0B;      /* Legendary */
--accent-green: #10b981;     /* Success */
--accent-red: #EF4444;       /* Error */
--accent-blue: #3B82F6;      /* Rare */
```

### Rarity Colors
```css
--rarity-common: #9CA3AF;    /* Grey */
--rarity-rare: #7C3AED;       /* Purple */
--rarity-epic: #8B5CF6;       /* Light Purple */
--rarity-legendary: #F59E0B;  /* Gold */
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 767px) {
  /* Single column layouts */
  /* Smaller fonts */
  /* Stacked elements */
  /* Touch-friendly buttons (min 44px) */
}

/* Tablet */
@media (min-width: 768px) and (max-width: 1023px) {
  /* 2-column layouts */
  /* Medium fonts */
  /* Optimized spacing */
}

/* Desktop */
@media (min-width: 1024px) {
  /* Multi-column layouts */
  /* Full font sizes */
  /* Hover effects */
}

/* Large Desktop */
@media (min-width: 1440px) {
  /* Max-width containers */
  /* Extra spacing */
  /* Larger images */
}
```

---

## 🖼️ Image Specifications

### App Screenshots
- Format: PNG or WebP
- Dimensions: 1170x2532px (iPhone 14 Pro resolution)
- Device frame: Included in mockup
- Compression: Optimized (80-90% quality)
- Lazy loading: Enabled

### NFT Images
- Format: PNG or WebP
- Dimensions: 512x512px (square)
- Background: Transparent (PNG) or solid color
- Compression: Optimized
- Lazy loading: Enabled

### Background Images
- Format: WebP or JPG
- Dimensions: 1920x1080px (desktop), 768x1024px (mobile)
- Compression: 70-80% quality
- Lazy loading: Enabled

### Icons
- Format: SVG (preferred) or PNG
- Dimensions: 24x24px, 32x32px, 48x48px, 64x64px
- Color: Current color (for SVG)
- Optimized: Minified SVG

---

## 🔧 Performance Optimizations

### Image Optimization
```javascript
// Next.js Image component
<Image
  src="/screenshot.png"
  width={1170}
  height={2532}
  alt="App screenshot"
  loading="lazy"
  placeholder="blur"
  quality={85}
/>
```

### Code Splitting
```javascript
// Lazy load heavy components
const ThreeJSViewer = dynamic(() => import('./ThreeJSViewer'), {
  ssr: false,
  loading: () => <Skeleton />
});
```

### Animation Performance
```css
/* Use transform and opacity for animations */
/* These properties are GPU-accelerated */
.element {
  will-change: transform, opacity;
  transform: translateZ(0); /* Force GPU acceleration */
}
```

### Debounce Scroll Events
```javascript
// Debounce scroll handlers
const debouncedScroll = debounce(handleScroll, 16); // ~60fps
window.addEventListener('scroll', debouncedScroll);
```

---

## 📧 Email Integration

### API Endpoint Structure
```javascript
// POST /api/beta-signup
{
  email: "user@example.com",
  source: "website",
  timestamp: "2024-01-01T00:00:00Z"
}

// Response
{
  success: true,
  message: "Successfully signed up!"
}
```

### Validation
```javascript
// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Validation function
function validateEmail(email) {
  return emailRegex.test(email) && email.length <= 254;
}
```

### Error Handling
```javascript
// Error states
- Invalid email format
- Email already registered
- Server error
- Network error
```

---

## 🔍 SEO Specifications

### Meta Tags
```html
<title>NftGO - Collect NFTs in the Real World</title>
<meta name="description" content="Location-based NFT collection game. Explore, collect, and compete in NftGO.">
<meta name="keywords" content="NFT, location-based, AR, mobile game, collectibles">
```

### Open Graph Tags
```html
<meta property="og:title" content="NftGO - Collect NFTs in the Real World">
<meta property="og:description" content="Location-based NFT collection game...">
<meta property="og:image" content="https://nftgo.app/og-image.jpg">
<meta property="og:url" content="https://nftgo.app">
<meta property="og:type" content="website">
```

### Twitter Card Tags
```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="NftGO - Collect NFTs in the Real World">
<meta name="twitter:description" content="Location-based NFT collection game...">
<meta name="twitter:image" content="https://nftgo.app/twitter-image.jpg">
```

### Structured Data (JSON-LD)
```json
{
  "@context": "https://schema.org",
  "@type": "MobileApplication",
  "name": "NftGO",
  "description": "Location-based NFT collection game",
  "applicationCategory": "Game",
  "operatingSystem": "iOS, Android"
}
```

---

## ♿ Accessibility Requirements

### WCAG 2.1 AA Compliance
- Color contrast: 4.5:1 for text
- Keyboard navigation: All interactive elements
- Screen reader support: Proper ARIA labels
- Focus indicators: Visible focus states
- Alt text: All images

### Implementation
```html
<!-- Proper semantic HTML -->
<nav aria-label="Main navigation">
  <button aria-label="Close menu">×</button>
</nav>

<!-- ARIA labels -->
<button aria-label="Join beta waitlist">
  Join Beta
</button>

<!-- Focus indicators -->
button:focus {
  outline: 2px solid #7C3AED;
  outline-offset: 2px;
}
```

---

## 📊 Analytics Events

### Tracked Events
```javascript
// Button clicks
trackEvent('cta_click', {
  location: 'hero',
  button: 'join_beta'
});

// Form submissions
trackEvent('form_submit', {
  form: 'beta_signup',
  success: true
});

// Video plays
trackEvent('video_play', {
  video: 'trailer',
  location: 'hero'
});

// Scroll depth
trackEvent('scroll_depth', {
  depth: 75, // percentage
  section: 'features'
});
```

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All images optimized
- [ ] All animations tested
- [ ] Form submission working
- [ ] Email service integrated
- [ ] Analytics configured
- [ ] SEO tags added
- [ ] Cross-browser tested
- [ ] Mobile tested
- [ ] Performance tested (Lighthouse)
- [ ] Accessibility checked

### Post-Deployment
- [ ] Monitor error logs
- [ ] Track analytics
- [ ] Monitor form submissions
- [ ] Check email delivery
- [ ] Monitor performance
- [ ] Gather user feedback

---

**This document should be used alongside the main brief for complete specifications.**




