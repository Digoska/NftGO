# ⚡ NftGO Website - Quick Reference Guide

## 🎯 TL;DR - What to Build

**A stunning, interactive promotional website for NftGO with:**
- Smooth scroll animations
- 3D NFT model showcases
- App screenshot gallery
- Beta signup form
- Social media integration
- Mobile-responsive design

**Tech Stack:** Next.js + Framer Motion + Three.js + Tailwind CSS

---

## 📋 Essential Sections (In Order)

1. **Hero** - Big impact, clear CTA
2. **What is NftGO?** - Quick explanation
3. **Features** - 6 key features in grid
4. **Screenshots** - App preview carousel
5. **NFT Showcase** - Interactive gallery
6. **Stats** - Social proof numbers
7. **Beta Signup** - Email collection form
8. **Community** - Social links
9. **FAQ** - Common questions
10. **Footer** - Links and info

---

## 🎨 Key Design Elements

### Colors
- **Primary:** `#7C3AED` (Purple)
- **Background:** `#0A0A0F` (Dark)
- **Text:** `#FFFFFF` (White)
- **Accent:** `#F59E0B` (Gold for legendary)

### Typography
- **Headings:** Bold, 48-72px
- **Body:** Regular, 16-18px
- **Buttons:** Semi-bold, 18px

### Spacing
- **Section padding:** 80-120px vertical
- **Card gap:** 24px
- **Content max-width:** 1200px

---

## 🎬 Must-Have Animations

### On Scroll
- Fade in + slide up (all sections)
- Staggered delays (feature cards)
- Parallax (backgrounds)
- Count up (numbers)

### On Hover
- Scale up (buttons: 1.05x)
- Lift up (cards: -8px translateY)
- Glow effect (borders/shadows)
- Color transition (smooth)

### Continuous
- Float (phone mockup: 3s)
- Rotate (3D NFTs: 20s)
- Pulse (CTA buttons: 2s)

---

## 💻 Code Snippets

### Scroll Animation (Framer Motion)
```jsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 30 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-100px" }}
  transition={{ duration: 0.6, ease: "easeOut" }}
>
  Content here
</motion.div>
```

### Staggered Animation
```jsx
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

<motion.div variants={container} initial="hidden" whileInView="show">
  {items.map((item, i) => (
    <motion.div key={i} variants={item}>
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

### Count Up Animation
```jsx
import { useInView } from 'framer-motion';
import { useEffect, useState } from 'react';

function CountUp({ end, duration = 2 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    
    let startTime = null;
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isInView, end, duration]);

  return <span ref={ref}>{count}</span>;
}
```

### 3D Model Viewer (Three.js)
```jsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';

function Model({ url }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} scale={1} />;
}

<Canvas camera={{ position: [0, 0, 5] }}>
  <ambientLight intensity={0.5} />
  <directionalLight position={[5, 5, 5]} />
  <Model url="/nft-model.glb" />
  <OrbitControls enableZoom={false} autoRotate />
</Canvas>
```

### Beta Signup Form
```jsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';

function BetaSignup() {
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    const res = await fetch('/api/beta-signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) setSubmitted(true);
  };

  if (submitted) {
    return <div>✅ You're in! Check your email.</div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('email', { required: true, pattern: /^\S+@\S+$/i })}
        placeholder="Enter your email"
      />
      {errors.email && <span>Invalid email</span>}
      <button type="submit">Join Beta</button>
    </form>
  );
}
```

---

## 📱 Responsive Patterns

### Mobile Menu
```jsx
const [isOpen, setIsOpen] = useState(false);

<button onClick={() => setIsOpen(!isOpen)}>
  {isOpen ? '✕' : '☰'}
</button>

<nav className={isOpen ? 'open' : 'closed'}>
  {/* Menu items */}
</nav>
```

### Grid Layout
```css
/* Desktop: 3 columns */
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

/* Tablet: 2 columns */
@media (max-width: 1023px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Mobile: 1 column */
@media (max-width: 767px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
```

---

## 🎯 Key Interactions

### Smooth Scroll
```css
html {
  scroll-behavior: smooth;
}
```

### Button Hover
```css
.button {
  transition: all 0.2s ease-out;
}

.button:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 30px rgba(124, 58, 237, 0.5);
}
```

### Card Hover
```css
.card {
  transition: all 0.3s ease-out;
}

.card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(124, 58, 237, 0.3);
  border: 2px solid #7C3AED;
}
```

---

## 📦 Required Assets

### Images
- [ ] App screenshots (6-8 screens)
- [ ] NFT showcase images (10-20 NFTs)
- [ ] Logo (SVG)
- [ ] App icon
- [ ] Social media graphics
- [ ] Background patterns/textures

### Videos (Optional)
- [ ] Trailer video (30-60s)
- [ ] Feature demo videos

### 3D Models
- [ ] Sample NFT models (GLB/GLTF format)
- [ ] For Three.js viewer

---

## 🔗 Integrations Needed

### Email Service
- Mailchimp / ConvertKit / SendGrid
- API key for form submissions
- Webhook for success handling

### Analytics
- Google Analytics tracking code
- Event tracking setup

### Social Media
- Twitter/X link
- Discord invite link
- Instagram link
- Telegram link

---

## ⚡ Performance Tips

1. **Images:** Use Next.js Image component, WebP format
2. **Animations:** Use `transform` and `opacity` (GPU-accelerated)
3. **Lazy Loading:** Load below-fold content on scroll
4. **Code Splitting:** Lazy load heavy components (Three.js)
5. **Debounce:** Debounce scroll events (16ms = 60fps)

---

## 🐛 Common Issues & Solutions

### Animation Jank
**Problem:** Animations stutter  
**Solution:** Use `will-change: transform` and `transform: translateZ(0)`

### Slow Load Times
**Problem:** Large images slow down site  
**Solution:** Optimize images, use WebP, lazy load

### Form Not Working
**Problem:** Email not being sent  
**Solution:** Check API endpoint, verify email service credentials

### Mobile Layout Broken
**Problem:** Elements overflow on mobile  
**Solution:** Use `max-width: 100%`, test on real devices

---

## ✅ Launch Checklist

- [ ] All sections implemented
- [ ] Animations smooth (60fps)
- [ ] Responsive on all devices
- [ ] Form submission working
- [ ] Email service connected
- [ ] Analytics tracking
- [ ] SEO tags added
- [ ] Social links verified
- [ ] Cross-browser tested
- [ ] Performance optimized (Lighthouse score > 90)

---

## 📞 Quick Questions?

**Q: What if I don't have app screenshots yet?**  
A: Use mockups/placeholders, update later

**Q: Can I use a different animation library?**  
A: Yes, but Framer Motion is recommended for React

**Q: Do I need Three.js for 3D models?**  
A: Yes, for interactive 3D viewers. Static images work too.

**Q: What about the beta signup backend?**  
A: Use a service like Mailchimp or build a simple API endpoint

**Q: How long should this take?**  
A: 2-4 weeks for a polished site, 1 week for MVP

---

## 🎨 Design Inspiration

Check these sites for reference:
- **Apple.com** - Clean, premium feel
- **Stripe.com** - Smooth animations
- **Linear.app** - Modern interactions
- **Framer.com** - Interactive elements

---

**Remember:** The goal is to make visitors **excited** and **want to join the beta**. Every detail matters!




