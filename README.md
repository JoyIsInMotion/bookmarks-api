# 📚 Bookmarks API

A minimalistic REST API for managing bookmarks built with **Next.js**, **TypeScript**, and **JWT Authentication**.

## Features

- ✅ User authentication (register, login, logout, me endpoint)
- ✅ JWT-based protected endpoints
- ✅ User-specific bookmark CRUD operations
- ✅ Pagination support (5 items per page)
- ✅ JSON file-based storage
- ✅ Password encryption (PBKDF2)
- ✅ User isolation (each user can only access their own bookmarks)
- ✅ Sample data with multiple users and bookmarks

## Quick Start

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

Visit the home page to see full API documentation.

### Build

```bash
npm run build
npm start
```

## Test Users

All test users have the password: `password`

- alice@example.com
- bob@example.com
- charlie@example.com

## API Endpoints

### Authentication

- `POST /api/auth/register` - Create a new user account
- `POST /api/auth/login` - Login and receive JWT token
- `GET /api/auth/me` - Get current user (requires auth)
- `POST /api/auth/logout` - Logout

### Bookmarks (Protected)

All bookmark endpoints require a valid JWT token in the `Authorization` header: `Bearer <token>`

- `GET /api/bookmarks?page=1` - List paginated bookmarks
- `POST /api/bookmarks` - Create a new bookmark
- `GET /api/bookmarks/[id]` - Get a specific bookmark
- `PUT /api/bookmarks/[id]` - Update a bookmark
- `DELETE /api/bookmarks/[id]` - Delete a bookmark

## Data Structure

### User
```json
{
  "id": "user-1",
  "email": "user@example.com",
  "password": "encrypted-hash"
}
```

### Bookmark
```json
{
  "id": "bm-1",
  "userId": "user-1",
  "url": "https://example.com",
  "description": "Optional description",
  "createdAt": "2026-01-15T10:30:00Z"
}
```

## Example Usage

### 1. Register a new user

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "mypassword"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "password"
  }'
```

Response:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "user-1"
}
```

### 3. Get current user

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <token>"
```

### 4. List bookmarks (with pagination)

```bash
curl -X GET "http://localhost:3000/api/bookmarks?page=1" \
  -H "Authorization: Bearer <token>"
```

Response:
```json
{
  "data": [
    {
      "id": "bm-1",
      "userId": "user-1",
      "url": "https://github.com",
      "description": "GitHub - Where the world builds software",
      "createdAt": "2026-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 5,
    "total": 12,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### 5. Create a bookmark

```bash
curl -X POST http://localhost:3000/api/bookmarks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "url": "https://nextjs.org",
    "description": "Next.js Documentation"
  }'
```

### 6. Update a bookmark

```bash
curl -X PUT http://localhost:3000/api/bookmarks/bm-1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "url": "https://updated-url.com",
    "description": "Updated description"
  }'
```

### 7. Delete a bookmark

```bash
curl -X DELETE http://localhost:3000/api/bookmarks/bm-1 \
  -H "Authorization: Bearer <token>"
```

## Project Structure

```
bookmarks-api/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── register/route.ts
│   │   │   ├── login/route.ts
│   │   │   ├── me/route.ts
│   │   │   └── logout/route.ts
│   │   └── bookmarks/
│   │       ├── route.ts (GET, POST)
│   │       └── [id]/route.ts (GET, PUT, DELETE)
│   ├── page.tsx (Home with API documentation)
│   ├── layout.tsx
│   └── globals.css
├── lib/
│   ├── types.ts (TypeScript interfaces)
│   ├── auth.ts (JWT utilities)
│   ├── encryption.ts (Password hashing)
│   ├── storage.ts (File I/O)
│   └── middleware.ts (Auth middleware)
├── data/
│   └── db.json (JSON storage)
└── package.json

```

## Technologies

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Jose** - JWT signing and verification
- **Tailwind CSS** - Styling
- **Node.js Crypto** - Password hashing (PBKDF2)

## Notes

- The application uses a JSON file (`data/db.json`) for storage
- Passwords are hashed using PBKDF2 with 1000 iterations
- JWT tokens expire after 7 days
- All timestamps use ISO 8601 format
- Pagination limit is 5 items per page
- User data is isolated; each user can only access their own bookmarks

## License

MIT
