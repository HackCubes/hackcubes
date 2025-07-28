# HackCubes - Cybersecurity Learning Platform

A modern, production-ready Next.js landing page for HackCubes, a cybersecurity learning platform inspired by Hack The Box. Features cutting-edge animations, 3D graphics, and a cybersecurity-themed design.

## 🚀 Features

- **Modern Tech Stack**: Next.js 14, TypeScript, Tailwind CSS
- **3D Graphics**: Interactive rotating cubes using React Three Fiber
- **Smooth Animations**: Framer Motion for page transitions and micro-interactions
- **Cybersecurity Theme**: Dark mode with neon green (#00FF7F) and electric blue (#3BE8FF) accents
- **Responsive Design**: Mobile-first approach with tablet and desktop optimizations
- **SEO Optimized**: Comprehensive meta tags, Open Graph, and Twitter cards
- **Accessibility**: Semantic HTML, proper ARIA labels, and keyboard navigation

## 🏗️ Project Structure

```
hackcubes-landing/
├── public/                 # Static assets
├── src/
│   ├── components/         # React components
│   │   ├── icons/         # SVG icon components
│   │   ├── CubeBackground.tsx
│   │   ├── HeroSection.tsx
│   │   ├── FeaturesSection.tsx
│   │   ├── TestimonialsSection.tsx
│   │   ├── SignupSection.tsx
│   │   └── Footer.tsx
│   ├── pages/             # Next.js pages
│   │   ├── _app.tsx
│   │   └── index.tsx
│   ├── styles/            # Global styles
│   │   └── globals.css
│   └── utils/             # Utility functions
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── next.config.js
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager

### Quick Start

1. **Clone and navigate to the project:**
   ```bash
   cd hackcubes-landing
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

## 🎨 Design System

### Colors
- **Primary Background**: `#0D0F12` (dark-bg)
- **Secondary Background**: `#1A1D23` (dark-secondary)
- **Border Color**: `#2A2D35` (gray-border)
- **Neon Green**: `#00FF7F` (primary accent)
- **Electric Blue**: `#3BE8FF` (secondary accent)

### Typography
- **Font**: JetBrains Mono (monospace)
- **Weights**: 300, 400, 500, 600, 700

### Animations
- **Matrix Rain**: Falling binary characters background
- **3D Cubes**: Rotating wireframe cubes with React Three Fiber
- **Parallax Effects**: Layered background animations
- **Hover States**: Scale and glow effects on interactive elements

## 📱 Components Overview

### HeroSection
- Full-height viewport with animated logo
- Gradient text effects and CTA buttons
- Matrix-style falling characters animation
- Smooth scroll indicator

### FeaturesSection
- Six feature cards with custom icons
- Scroll-triggered animations
- Statistics section with hover effects

### TestimonialsSection
- Auto-rotating carousel with user testimonials
- Star ratings and trust badges
- Navigation controls and dot indicators

### SignupSection
- Animated form with validation
- Security feature highlights
- Privacy badges and compliance indicators

### Footer
- Company information and contact details
- Social media links with hover animations
- Quick navigation and legal links

## 🔧 Customization

### Adding New Sections
1. Create a new component in `src/components/`
2. Import and add to `src/pages/index.tsx`
3. Update navigation links in the Footer component

### Modifying Colors
Update the color palette in `tailwind.config.js`:
```javascript
colors: {
  'your-color': '#HEX_VALUE',
}
```

### Adding Animations
Use Framer Motion for consistent animations:
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6 }}
>
  Your content
</motion.div>
```

## 🚢 Deployment

### Vercel (Recommended)
1. Push code to GitHub/GitLab/Bitbucket
2. Connect repository to Vercel
3. Deploy automatically on commits

### Other Platforms
- **Netlify**: Connect Git repository for automatic deployments
- **AWS Amplify**: Use the AWS CLI or console
- **Docker**: Build container with `docker build -t hackcubes .`

## 🔒 Security Features

- **Input Validation**: Form validation with TypeScript
- **XSS Protection**: React's built-in escaping
- **HTTPS Ready**: Secure by default with modern hosting
- **Privacy Compliant**: GDPR and privacy policy ready

## 📊 Performance

- **Core Web Vitals Optimized**: Fast loading and smooth interactions
- **Image Optimization**: Next.js automatic image optimization
- **Code Splitting**: Automatic route-based code splitting
- **Tree Shaking**: Unused code elimination

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Email: hello@hackcubes.com
- Documentation: [docs.hackcubes.com](https://docs.hackcubes.com)
- Community: [discord.gg/hackcubes](https://discord.gg/hackcubes)

---

Made with ❤️ for the cybersecurity community by the HackCubes team.