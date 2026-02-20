# Quick Start: Photo Organization Application

**Date**: 2026-02-20  
**Feature**: 001-photo-organization

## Prerequisites

- Node.js 18+
- npm or yarn

## Installation

```bash
# Clone or navigate to the project directory
cd photo-org-app

# Install dependencies
npm install
```

## Development

```bash
# Start development server
npm run dev

# Open browser at http://localhost:5173
```

## Building for Production

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Usage Guide

### 1. Import Photos

1. Click "Import Photos" button
2. Select one or more photo files from your computer
3. Photos are automatically organized into date-based albums

### 2. View Albums

- Albums are displayed in the sidebar
- Date-based albums show the date
- Custom albums show your chosen name
- Click an album to view its photos

### 3. Drag and Drop

1. Click and hold a photo tile
2. Drag it to another album in the sidebar
3. Release to move the photo
4. The photo will appear in the new album

### 4. Create Custom Albums

1. Click "New Album" button
2. Enter a name for your album
3. Click "Create"
4. Drag photos into your new custom album

### 5. Delete Photos or Albums

- To delete a photo: Right-click → Delete Photo
- To delete an album: Right-click album → Delete Album
- Confirm deletion when prompted

## Project Structure

```
photo-org-app/
├── src/
│   ├── index.html          # Main HTML file
│   ├── css/
│   │   └── main.css       # Styles
│   ├── js/
│   │   ├── app.js         # Main app logic
│   │   ├── db.js          # Database operations
│   │   ├── album.js       # Album management
│   │   ├── photo.js       # Photo management
│   │   ├── drag-drop.js   # Drag and drop
│   │   └── ui.js          # UI components
│   └── assets/
├── tests/
│   ├── unit/
│   └── integration/
├── data/
│   └── photos.db          # SQLite database
├── vite.config.js
└── package.json
```

## Configuration

No additional configuration needed for basic usage.

## Troubleshooting

### Photos won't import

- Ensure photo files are in a supported format (JPG, PNG, etc.)
- Check that you have read permissions for the files
- Try importing fewer photos at once

### Drag and drop not working

- Make sure you're dragging from the photo grid to the album sidebar
- Try refreshing the page
- Check browser console for errors

### Database issues

- Delete `data/photos.db` to reset (this will lose all organization)
- The app will create a new database on next startup

## Next Steps

- Check the [README](../README.md) for more details
- Review the [data model](./data-model.md) for database schema
- See [research](./research.md) for technical decisions
