# Phase 3B: UI/UX Design Upgrade — Premium Intelligence Theme

## Objective

Transform the Monara Sentinel interface into a premium dark intelligence dashboard with professional investigation/SOC aesthetic, inspired by the visual language of sophisticated intelligence platforms while maintaining our defensive-only principles.

## Design Philosophy

**Core Principle: SHOW ME THE EVIDENCE**

The UI must reinforce this workflow:
```
COLLECT → ANALYZE → CORRELATE → VERIFY → SHOW THE EVIDENCE → PROTECT PEOPLE
```

The product should communicate:
- Trust
- Evidence-backed analysis
- Professional investigation
- Protection (not exploitation)

## Visual Language

### Color Semantics

| Category | Color | Use Cases |
|----------|-------|-----------|
| **PRIMARY** | Neon Green (#00ff88) | Primary buttons, active navigation, successful operations, verified states |
| **INTELLIGENCE** | Cyan/Blue (#00d4ff) | Network intelligence, DNS, IP, ASN, domains, infrastructure, technical observations |
| **IMAGE/DEVICE** | Purple (#9b59b6) | Images, EXIF, OCR, device observations, image matching |
| **WARNING** | Orange (#ff9500) | Suspicious indicators, investigation warnings, uncertain observations |
| **CRITICAL** | Red (#ff3b30) | Critical risk, security failures, blocked actions, severe indicators |
| **SURFACE** | Dark Charcoal (#1a1a1a) | Card backgrounds, panels |
| **BACKGROUND** | Deep Black (#0d0d0d) | Main application background |
| **BORDER** | Low-contrast (#2a2a2a) | Thin borders, separators |
| **TEXT PRIMARY** | Off-white (#f5f5f5) | Primary text content |
| **TEXT SECONDARY** | Muted gray (#888888) | Metadata, timestamps, secondary information |

### Typography

- **Primary**: Inter or system sans-serif for UI text
- **Technical**: Monospace (JetBrains Mono, Fira Code, or system monospace) for:
  - SHA-256 hashes
  - IP addresses
  - Domain names
  - ASN numbers
  - Evidence IDs
  - Case numbers
  - Timestamps

### Layout Philosophy

- Compact information density
- Clean spacing
- Restrained glow effects
- Professional card system
- Subtle grid background
- High contrast for readability

## Implementation Plan

### Phase 1: Design System Foundation

1. **Global Design Tokens**
   - CSS custom properties for all colors
   - Typography scale
   - Spacing system
   - Shadow utilities
   - Border radius constants

2. **Semantic Color System**
   - Create Tailwind extensions for semantic colors
   - Establish consistent usage patterns
   - Document color meaning

3. **Grid Background**
   - Subtle CSS grid pattern
   - Ensure content readability
   - Keep extremely subtle

### Phase 2: Application Shell

1. **Premium Sidebar**
   - MONARA SENTINEL branding
   - SCAMNET internal label
   - Navigation with semantic green accent for active state
   - SYSTEM section separator
   - Collapsible on mobile

2. **Header**
   - Case intelligence overview
   - Contextual actions
   - System status indicators

### Phase 3: Core Pages Redesign

1. **Dashboard**
   - Intelligence-focused layout
   - Stats cards with semantic indicators
   - Recent Intelligence Activity section
   - Professional empty states

2. **Cases UI**
   - Semantic severity colors (LOW, MODERATE, HIGH, CRITICAL)
   - Status badges with icons
   - Risk indicators
   - Updated timestamps

3. **Case Detail**
   - Investigation workstation layout
   - Tabbed interface (Overview, Evidence, Intelligence, Images, Entities, Relationships, Location, Device, Timeline, Risk)
   - Contextual actions
   - Evidence-backed displays

### Phase 4: Intelligence Components

1. **Intelligence Panel Cards**
   - Network Intelligence (DNS, IP, ASN, ISP, TLS, RDAP, Redirects)
   - Image Intelligence (EXIF, OCR, Hashes, pHash, Matches, Origin)
   - Location Intelligence (Observed Locations, Network Geography, GPS, Public Location Clues, Confidence)
   - Device Intelligence (Camera, Software, Browser, OS hints, User-Agent, File characteristics)

2. **"Show Me the Evidence" Interaction**
   - Prominent buttons/links for intelligence conclusions
   - Evidence panel with full provenance
   - Source, timestamp, evidence ID, hash, URL, metadata, confidence, reasoning

3. **Risk Visualization**
   - Clean risk cards with breakdown
   - Clickable indicators to evidence
   - Score calculation transparency
   - Never display scores without explanation

### Phase 5: Specialized Views

1. **Origin/Location View**
   - WHERE DOES THE EVIDENCE POINT? section
   - Location observations with evidence backing
   - Source, location, confidence, evidence
   - Approximate labeling when appropriate
   - Never fabricate precise locations

2. **Device Intelligence Card**
   - Device observations display
   - Camera, software, capture timestamp, GPS
   - Source and confidence
   - Important disclaimer about ownership/possession

3. **Image Investigation UI**
   - Strong visual presentation
   - Image preview with analysis cards
   - Purple as primary accent
   - Hashes, metadata, OCR, device, location, matches, origin

### Phase 6: Evidence & Relationships

1. **Evidence UI**
   - Authoritative presentation
   - Evidence ID, type, source, collected, observed, hash
   - Verification status, confidence
   - Associated entities
   - Clear provenance timeline
   - Visually obvious immutability

2. **Relationship Cards**
   - SOURCE ENTITY → RELATIONSHIP → TARGET ENTITY format
   - Evidence backing
   - Confidence scores
   - Preparation for Phase 4 graph visualization

### Phase 7: Component System

1. **Card System**
   - Dark surfaces with thin borders
   - Small radius
   - Subtle hover states
   - Clear headings
   - Small uppercase metadata labels
   - Strong primary values

2. **Button System**
   - Primary: bright green
   - Secondary: dark transparent/outlined
   - Danger: red (only when necessary)
   - Clear disabled/loading states

3. **Status System**
   - SUCCESS (green)
   - RUNNING (cyan/blue)
   - PENDING (gray)
   - WARNING (orange)
   - FAILED (red)
   - UNKNOWN (gray)
   - Consistent across all components

### Phase 8: Accessibility & Performance

1. **Accessibility**
   - Never rely only on color
   - Status includes icon + text + color
   - Keyboard navigation
   - Focus states
   - ARIA labels
   - Readable contrast
   - Screen-reader-friendly controls

2. **Performance**
   - No heavy animations
   - Subtle transitions only
   - Performance-first approach

### Phase 9: Professional States

1. **Empty States**
   - Contextual messages
   - Example: "NO INTELLIGENCE YET — Run an intelligence analysis to begin collecting evidence-backed technical observations."
   - Action buttons
   - Professional presentation

2. **Error States**
   - Clear, professional messaging
   - Action options (retry, view details)
   - Never expose stack traces or secrets

### Phase 10: Responsive Design

1. **Desktop** (Primary)
   - Full investigator experience
   - Multi-column layouts
   - Information density

2. **Tablet**
   - Collapsed sidebar
   - Stacked intelligence cards
   - Readable evidence

3. **Mobile**
   - Navigation conversion
   - Stacked layouts
   - No horizontal overflow
   - Maintain readability

## Important Constraints

### DO NOT IMPLEMENT
- Covert tracking
- Webcam capture
- Device surveillance
- Malicious tracking-link functionality
- Fake data in production
- Fabricated precise locations
- Automatic labeling of people as scammers
- Offensive scraping/hacking features

### DO IMPLEMENT
- Evidence-backed analysis
- Professional investigation workflow
- Trust-building UI
- Protection-focused messaging
- Defensive intelligence only
- Transparent risk scoring
- Clear provenance trails

## Technical Approach

### CSS Architecture
- Use CSS custom properties for design tokens
- Tailwind utility classes for layout
- Custom components for specialized UI
- Semantic naming conventions
- Maintain existing Tailwind setup

### Component Strategy
- Reusable card components
- Consistent status badge system
- Semantic color utilities
- Evidence panel components
- Intelligence card variants

### File Structure
```
apps/web/
├── app/
│   ├── layout.tsx (global theme, design tokens)
│   ├── globals.css (CSS custom properties, grid background)
│   ├── components/
│   │   ├── ui/ (reusable design system components)
│   │   ├── intelligence/ (intelligence-specific components)
│   │   ├── evidence/ (evidence display components)
│   │   └── cards/ (card variants)
```

## Success Criteria

- [ ] Design system implemented with semantic colors
- [ ] Premium sidebar with MONARA SENTINEL branding
- [ ] Dashboard redesigned with intelligence focus
- [ ] Cases UI with semantic severity colors
- [ ] Case detail as investigation workstation
- [ ] Intelligence panel cards for all categories
- [ ] "Show Me the Evidence" interaction implemented
- [ ] Risk visualization with clickable indicators
- [ ] Origin/Location view with evidence backing
- [ ] Device Intelligence card with disclaimers
- [ ] Image Investigation UI with purple accents
- [ ] Evidence UI with authoritative presentation
- [ ] Relationship cards prepared for Phase 4
- [ ] Status system standardized across all components
- [ ] Professional empty and error states
- [ ] Accessibility compliance verified
- [ ] Responsive design working across devices
- [ ] Typecheck and build passing
- [ ] Documentation updated

## Timeline Estimate

- Phase 1: Design System Foundation (2-3 hours)
- Phase 2: Application Shell (1-2 hours)
- Phase 3: Core Pages Redesign (3-4 hours)
- Phase 4: Intelligence Components (3-4 hours)
- Phase 5: Specialized Views (2-3 hours)
- Phase 6: Evidence & Relationships (2-3 hours)
- Phase 7: Component System (2-3 hours)
- Phase 8: Accessibility & Performance (1-2 hours)
- Phase 9: Professional States (1-2 hours)
- Phase 10: Responsive Design (2-3 hours)

**Total Estimated: 19-30 hours**

## Notes

- Use the provided screenshot as visual reference only
- Do not copy branding, product names, or functionality
- Focus on the aesthetic: dark intelligence dashboard, professional investigation feel
- Maintain existing application architecture
- No unnecessary UI frameworks
- Create reusable components
- Performance-first approach
- Build trust through evidence-backed presentation
