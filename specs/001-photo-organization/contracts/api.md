# API Contracts: Photo Organization Application

**Date**: 2026-02-20  
**Feature**: 001-photo-organization

## Overview

This document defines the internal API contract for the Photo Organization Application. All operations happen entirely in the browser with no backend server.

---

## Photo API

### addPhoto

Add a new photo to the database.

**Input**:
```javascript
{
  filePath: string,      // Full path to photo file
  filename: string,         // Original filename
  fileSize?: number,    // File size in bytes
  width?: number,        // Image width in pixels
  height?: number,       // Image height in pixels
  dateTaken?: string    // ISO 8601 date
}
```

**Output**:
```javascript
{
  id: number,            // Photo ID
  filePath: string,
  filename: string,
  dateImported: string,  // ISO 8601 date
  createdAt: string,    // ISO 8601 date
  updatedAt: string    // ISO 8601 date
}
```

**Errors**:
- `ValidationError`: Invalid file path or filename
- `DuplicateError`: Photo already exists

---

### getPhoto

Get a photo by ID.

**Input**:
```javascript
{
  id: number
}
```

**Output**:
```javascript
{
  id: number,
  filePath: string,
  filename: string,
  fileSize?: number,
  width?: number,
  height?: number,
  dateTaken?: string,
  dateImported: string,
  thumbnailPath?: string,
  createdAt: string,
  updatedAt: string
}
```

**Errors**:
- `NotFoundError`: Photo not found

---

### getAllPhotos

Get all photos, optionally filtered.

**Input**:
```javascript
{
  albumId?: number,     // Filter by album
  limit?: number,       // Limit results
  offset?: number        // Offset for pagination
}
```

**Output**:
```javascript
{
  photos: [Photo[],
  total: number
}
```

---

### deletePhoto

Delete a photo from the database.

**Input**:
```javascript
{
  id: number
}
```

**Output**:
```javascript
{
  success: boolean
}
```

**Errors**:
- `NotFoundError`: Photo not found

---

## Album API

### createAlbum

Create a new album.

**Input**:
```javascript
{
  name: string,
  type: 'date' | 'custom',
  dateValue?: string    // Required for type 'date'
}
```

**Output**:
```javascript
{
  id: number,
  name: string,
  type: 'date' | 'custom',
  dateValue?: string,
  sortOrder: number,
  createdAt: string,
  updatedAt: string
}
```

**Errors**:
- `ValidationError`: Invalid name or type
- `DuplicateError`: Album already exists

---

### getAlbum

Get an album by ID.

**Input**:
```javascript
{
  id: number
}
```

**Output**:
```javascript
{
  id: number,
  name: string,
  type: 'date' | 'custom',
  dateValue?: string,
  sortOrder: number,
  createdAt: string,
  updatedAt: string,
  photoCount: number    // Number of photos in album
}
```

**Errors**:
- `NotFoundError`: Album not found

---

### getAllAlbums

Get all albums.

**Input**:
```javascript
{
  type?: 'date' | 'custom'    // Optional filter
}
```

**Output**:
```javascript
{
  albums: Album[]
}
```

---

### updateAlbum

Update an album.

**Input**:
```javascript
{
  id: number,
  name?: string,
  sortOrder?: number
}
```

**Output**:
```javascript
{
  id: number,
  name: string,
  sortOrder: number,
  updatedAt: string
}
```

**Errors**:
- `NotFoundError`: Album not found
- `ValidationError`: Invalid data
- `DuplicateError`: Name already exists

---

### deleteAlbum

Delete an album.

**Input**:
```javascript
{
  id: number
}
```

**Output**:
```javascript
{
  success: boolean
}
```

**Errors**:
- `NotFoundError`: Album not found

---

## Album-Photo API

### addPhotoToAlbum

Add a photo to an album.

**Input**:
```javascript
{
  albumId: number,
  photoId: number
}
```

**Output**:
```javascript
{
  id: number,
  albumId: number,
  photoId: number,
  sortOrder: number,
  addedAt: string
}
```

**Errors**:
- `NotFoundError`: Album or photo not found
- `DuplicateError`: Photo already in album

---

### removePhotoFromAlbum

Remove a photo from an album.

**Input**:
```javascript
{
  albumId: number,
  photoId: number
}
```

**Output**:
```javascript
{
  success: boolean
}
```

**Errors**:
- `NotFoundError`: Relationship not found

---

### getPhotosInAlbum

Get all photos in an album.

**Input**:
```javascript
{
  albumId: number,
  limit?: number,
  offset?: number
}
```

**Output**:
```javascript
{
  photos: Photo[],
  total: number
}
```

**Errors**:
- `NotFoundError`: Album not found

---

### updatePhotoSortOrder

Update a photo's sort order within an album.

**Input**:
```javascript
{
  albumId: number,
  photoId: number,
  sortOrder: number
}
```

**Output**:
```javascript
{
  id: number,
  albumId: number,
  photoId: number,
  sortOrder: number
}
```

**Errors**:
- `NotFoundError`: Relationship not found

---

## Error Types

### ValidationError
- Message: "Invalid data"
- Code: 400

### NotFoundError
- Message: "Not found"
- Code: 404

### DuplicateError
- Message: "Already exists"
- Code: 409

---

## Data Types

### Photo
```javascript
{
  id: number,
  filePath: string,
  filename: string,
  fileSize?: number,
  width?: number,
  height?: number,
  dateTaken?: string,
  dateImported: string,
  thumbnailPath?: string,
  createdAt: string,
  updatedAt: string
}
```

### Album
```javascript
{
  id: number,
  name: string,
  type: 'date' | 'custom',
  dateValue?: string,
  sortOrder: number,
  createdAt: string,
  updatedAt: string
}
```

### AlbumPhoto
```javascript
{
  id: number,
  albumId: number,
  photoId: number,
  sortOrder: number,
  addedAt: string
}
```
