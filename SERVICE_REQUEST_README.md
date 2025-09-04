# Punjab Flood Relief - Service Request Module

## Overview

A lightweight, public-facing service request module for the Punjab Flood Relief application. Users can submit relief requests without authentication, with full support for Punjabi (default), Hindi, and English languages.

## Features

### 🌐 Multi-Language Support
- **Punjabi** (ਪੰਜਾਬੀ) - Default language
- **Hindi** (हिन्दी)
- **English** - Fallback language
- Seamless language switching without page reload

### 📍 Location Services
- **GPS Integration**: Automatic location detection with accuracy tracking
- **Village Search**: Fuzzy search with type-ahead functionality
- **Hierarchical Selection**: District → Tehsil → Village dropdowns
- **GPS-Assisted Selection**: Find nearest villages based on coordinates

### 🏥 Service Categories
- **Food** (ਖਾਣਾ) - With people count, type, and duration
- **Rescue** (ਬਚਾਅ) - With stranded count, water level, access notes
- **Animal Fodder** (ਪਸ਼ੂ ਚਾਰਾ) - With animal count, type, urgency
- **Medical Emergency** (ਤਬੀ ਐਮਰਜੈਂਸੀ) - With symptoms, patient count, critical flag
- **Boat** (ਨੌਕਾ) - With people count, pickup location, water flow
- **Shelter** (ਆਸ਼ਰੇ) - With people count, special needs, duration

### 📸 Media Support
- **Photo Upload**: Client-side compression (< 200KB)
- **Audio Recording**: Voice messages for additional context
- **Offline Support**: Queue requests when offline

### 📱 Responsive Design
- Mobile-first approach
- Optimized for low-bandwidth connections
- Touch-friendly interface
- Progressive enhancement

## Technical Implementation

### Architecture
```
src/
├── app/
│   ├── service-request/
│   │   ├── page.tsx                    # Main form
│   │   └── confirmation/
│   │       └── page.tsx               # Success page
│   └── api/
│       └── public/
│           └── locations/
│               └── route.ts           # Public location API
├── components/
│   └── service-request/               # All UI components
├── i18n/                             # Internationalization
│   ├── locales/                      # Translation files
│   └── request.ts                    # i18n configuration
└── middleware.ts                     # Route localization
```

### Key Components

#### Core Components
- `TopBar` - Navigation with language switcher and helpline
- `SystemStatusStrip` - GPS and network status indicators
- `LocationConsent` - GPS permission and location fetching
- `UserDetailsForm` - Name, phone, callback preferences
- `LocationFinder` - Village search and hierarchical selection
- `ServiceSelectionGrid` - Service category toggles
- `ServiceSubforms` - Expandable detailed forms per service
- `OptionalNotePhoto` - Additional notes, photos, and audio
- `ConsentSubmit` - Final consent and submission

#### API Endpoints
- `GET /api/public/locations` - Get all locations hierarchically
- `GET /api/public/locations?action=search&q={query}` - Search villages
- `GET /api/public/locations?action=nearest&lat={}&lng={}` - Find nearest villages

### Performance Optimizations
- **Bundle Size**: < 80KB gzipped target
- **Lazy Loading**: Components load on demand
- **Image Compression**: Client-side photo optimization
- **CSS Optimization**: Minimal custom styles
- **Responsive Grid**: Auto-fitting service selection grid

### Accessibility
- Screen reader support
- Keyboard navigation
- High contrast focus indicators
- Semantic HTML structure
- ARIA labels where needed

## Data Flow

1. **Location Consent** → GPS permission request
2. **User Details** → Name, phone, callback preferences
3. **Location Selection** → Village search/assisted selection
4. **Service Selection** → Multi-select service categories
5. **Service Details** → Expandable sub-forms for selected services
6. **Optional Media** → Notes, photos, audio messages
7. **Consent & Submit** → Final validation and submission

## Validation Rules

### Required Fields
- Name (text, non-empty)
- Mobile (E.164 format, Indian numbers)
- Village selection
- At least one service selected
- Consent checkbox checked

### Field Limits
- Note: 120 characters
- Photo: < 200KB after compression
- Audio: WebM format, reasonable duration

## Browser Support

- Modern browsers with GPS support
- Progressive enhancement for older browsers
- Fallback for geolocation API unavailable
- Graceful degradation for media APIs

## Deployment Notes

1. Ensure location data is populated in database
2. Configure SMS/WhatsApp sharing URLs
3. Set up monitoring for request submissions
4. Test on various network conditions
5. Validate translations with native speakers

## Future Enhancements

- [ ] Offline request queue with background sync
- [ ] Push notifications for status updates
- [ ] Integration with emergency services APIs
- [ ] Voice-to-text for accessibility
- [ ] QR code generation for easy sharing

---

**Built with Next.js 15, React 19, Tailwind CSS, and next-intl**
