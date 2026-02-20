# Research: Photo Organization Application

**Date**: 2026-02-20  
**Feature**: 001-photo-organization

## Technology Decisions

### Decision 1: Vite as Build Tool

**Decision**: Vite with vanilla JavaScript

**Rationale**:
- Fast development server with HMR (Hot Module Replacement)
- Minimal configuration required
- Excellent support for vanilla JS projects
- Optimized production builds
- Low learning curve

**Alternatives considered**:
- Webpack - More complex configuration, overkill for simple project
- Parcel - Good alternative, but Vite has better performance
- No build tool - Would miss out on modern features and optimization

---

### Decision 2: Vanilla HTML, CSS, JavaScript

**Decision**: Vanilla web technologies (no framework)

**Rationale**:
- Follows "minimal dependencies" requirement
- No framework lock-in
- Better performance (smaller bundle size)
- Easier to maintain long-term
- Perfect for this scope of project

**Alternatives considered**:
- React - Overkill for this project, adds unnecessary complexity
- Vue - Similar concerns as React
- Svelte - Good alternative, but vanilla JS is even simpler

---

### Decision 3: SQLite for Metadata Storage

**Decision**: SQLite database via sql.js (WebAssembly)

**Rationale**:
- File-based, no server required
- ACID compliance for data integrity
- Good query performance
- Works entirely in browser via sql.js
- Can export/import database file

**Alternatives considered**:
- IndexedDB - Built-in browser storage, but more complex querying
- LocalStorage - Not suitable for structured data
- PostgreSQL/MySQL - Requires server, overkill

---

### Decision 4: Photo File Handling

**Decision**: Read-only access to original photo files

**Rationale**:
- Prevents accidental data loss
- No risk of corrupting original photos
- User maintains full control over their files
- Metadata stored separately in SQLite

**Alternatives considered**:
- Copy photos to app directory - Uses more disk space
- Modify original files - High risk of data corruption

---

## Best Practices Research

### Photo Tile Grid Layout

**Recommendation**: CSS Grid with responsive breakpoints

**Key points**:
- Use `display: grid` for tile layout
- `grid-template-columns: repeat(auto-fill, minmax(150px, 1fr))`
- `gap` for spacing between tiles
- `aspect-ratio: 1` for square tiles
- `object-fit: cover` for photo cropping

### Drag and Drop Implementation

**Recommendation**: Native HTML5 Drag and Drop API

**Key points**:
- `draggable="true"` on photo elements
- `dragstart`, `dragend`, `dragover`, `drop` events
- `dataTransfer` for carrying photo data
- Visual feedback during drag operations
- Touch support via touch events as fallback

### EXIF Data Extraction

**Recommendation**: exifr library (lightweight, 20KB)

**Key points**:
- Extract date taken from photo EXIF metadata
- Fallback to file modification date if no EXIF
- Works entirely in browser
- No server-side processing needed

---

## Security Considerations

### File Access Security

**Measures**:
- File System Access API with user explicit permission
- Read-only access to photo files
- No execution of photo content as code
- Sanitization of all file metadata

### Data Protection

**Measures**:
- SQLite database stored locally only
- No automatic data transmission
- User-controlled export/import
- No analytics or telemetry (unless explicitly opted-in)

---

## Performance Optimization

### Photo Thumbnail Generation

**Strategy**:
- Generate and cache thumbnail images
- Use `canvas` for resizing
- Store thumbnails in IndexedDB
- Lazy loading for offscreen photos

### Virtual Scrolling

**Strategy**:
- Only render visible photos
- Implement virtual list for large albums
- Reuse DOM elements during scroll
- Keep memory usage constant regardless of album size

---

## Accessibility Considerations

**Key requirements**:
- Keyboard navigation support
- Screen reader compatibility
- Semantic HTML elements
- ARIA labels where needed
- Sufficient color contrast
- Focus indicators for interactive elements
