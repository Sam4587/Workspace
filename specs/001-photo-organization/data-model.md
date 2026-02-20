# Data Model: Photo Organization Application

**Date**: 2026-02-20  
**Feature**: 001-photo-organization

## Database Schema

### photos Table

Stores metadata about each photo file.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique photo identifier |
| file_path | TEXT | NOT NULL | Full path to photo file on disk |
| filename | TEXT | NOT NULL | Original filename |
| file_size | INTEGER | | File size in bytes |
| width | INTEGER | | Image width in pixels |
| height | INTEGER | | Image height in pixels |
| date_taken | TEXT | | Date photo was taken (ISO 8601) |
| date_imported | TEXT | NOT NULL DEFAULT CURRENT_TIMESTAMP | Date photo was imported |
| thumbnail_path | TEXT | | Path to cached thumbnail (if any) |
| created_at | TEXT | NOT NULL DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |
| updated_at | TEXT | NOT NULL DEFAULT CURRENT_TIMESTAMP | Record last update timestamp |

**Indexes**:
- `idx_photos_date_taken`: date_taken
- `idx_photos_file_path`: file_path (UNIQUE)
- `idx_photos_date_imported`: date_imported

---

### albums Table

Stores album information, both date-based and custom.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique album identifier |
| name | TEXT | NOT NULL | Album display name |
| type | TEXT | NOT NULL CHECK(type IN ('date', 'custom')) | Album type |
| date_value | TEXT | | For date albums: ISO 8601 date |
| sort_order | INTEGER | NOT NULL DEFAULT 0 | Custom sort order |
| created_at | TEXT | NOT NULL DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |
| updated_at | TEXT | NOT NULL DEFAULT CURRENT_TIMESTAMP | Record last update timestamp |

**Indexes**:
- `idx_albums_type`: type
- `idx_albums_date_value`: date_value
- `idx_albums_sort_order`: sort_order

**Unique Constraints**:
- For date albums: (type, date_value) must be unique
- For custom albums: name must be unique

---

### album_photos Table

Join table for many-to-many relationship between albums and photos.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique record identifier |
| album_id | INTEGER | NOT NULL REFERENCES albums(id) ON DELETE CASCADE | Foreign key to album |
| photo_id | INTEGER | NOT NULL REFERENCES photos(id) ON DELETE CASCADE | Foreign key to photo |
| sort_order | INTEGER | NOT NULL DEFAULT 0 | Photo order within album |
| added_at | TEXT | NOT NULL DEFAULT CURRENT_TIMESTAMP | When photo was added to album |

**Indexes**:
- `idx_album_photos_album_id`: album_id
- `idx_album_photos_photo_id`: photo_id
- `idx_album_photos_sort_order`: (album_id, sort_order)

**Unique Constraint**:
- (album_id, photo_id) must be unique

---

## Entity Relationships

```
photos (1) ───< (N) album_photos (N) >─── (1) albums

- A photo can be in multiple albums
- An album contains multiple photos
- album_photos is the join table with sort order
```

---

## Entity Definitions

### Photo Entity

```javascript
{
  id: number,
  filePath: string,
  filename: string,
  fileSize?: number,
  width?: number,
  height?: number,
  dateTaken?: string, // ISO 8601
  dateImported: string, // ISO 8601
  thumbnailPath?: string,
  createdAt: string, // ISO 8601
  updatedAt: string // ISO 8601
}
```

### Album Entity

```javascript
{
  id: number,
  name: string,
  type: 'date' | 'custom',
  dateValue?: string, // ISO 8601 (for date albums)
  sortOrder: number,
  createdAt: string, // ISO 8601
  updatedAt: string // ISO 8601
}
```

### AlbumPhoto Entity

```javascript
{
  id: number,
  albumId: number,
  photoId: number,
  sortOrder: number,
  addedAt: string // ISO 8601
}
```

---

## Validation Rules

### Photo Validation

- `file_path`: Must be non-empty, valid file path
- `filename`: Must be non-empty, sanitized (no path traversal)
- `file_size`: If provided, must be positive integer
- `width`/`height`: If provided, must be positive integers
- `date_taken`: If provided, must be valid ISO 8601 date
- `date_imported`: Auto-generated, valid ISO 8601 date

### Album Validation

- `name`: Must be non-empty, max 255 characters
- `type`: Must be either 'date' or 'custom'
- `date_value`: Required for 'date' type, must be valid ISO 8601 date
- `sort_order`: Must be integer, defaults to 0

### AlbumPhoto Validation

- `album_id`: Must reference existing album
- `photo_id`: Must reference existing photo
- `sort_order`: Must be integer, defaults to 0
- Unique: Cannot have same photo in same album multiple times

---

## State Transitions

### Photo Lifecycle

```
Imported → In Album(s) → (Optional) Deleted
   ↓
(Metadata extracted)
   ↓
(Thumbnail generated)
```

### Album Lifecycle

```
Created → Has Photos → (Optional) Deleted
   ↓
(Photos added/removed)
   ↓
(Sort order updated)
```

---

## Data Volume Assumptions

- **Photos**: Up to 50,000 photos total
- **Albums**: Up to 1,000 albums total
- **Album-Photo Relationships**: Up to 100,000 relationships
- **Database Size**: Target < 100MB (excluding thumbnails)
- **Query Performance**: Album queries < 100ms, photo queries < 50ms
