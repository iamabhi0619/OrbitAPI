# Projects API Documentation

## Base URL
```
/me/projects
```

## Authentication
Most endpoints require authentication:
- **Authorization Header**: `Bearer <jwt_token>`
- **Admin Only Endpoints**: Marked with 🔒
- **User Endpoints**: Accessible to authenticated users

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation description",
  "data": {} // Varies by endpoint
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": "Additional error details"
}
```

## Project Object Schema

```json
{
  "_id": "string (ObjectId)",
  "name": "string (required)",
  "slug": "string (unique, auto-generated)",
  "description_short": "string (required)",
  "description_long": "string (required)",
  "tech_stack": ["string array"],
  "api_used": ["string array"],
  "status": "string (default: 'planned')",
  "start_date": "string (ISO date)",
  "end_date": "string (ISO date)",
  "deployment_date": "string (ISO date)",
  "version": "string",
  "estimated_hours": "number",
  "coverImage": "string (URL)",
  "youtubeUrl": "string (URL)",
  "videoUrl": "string (URL)",
  "budget": "number",
  "client": "string",
  "database": "string",
  "hosting": "string",
  "authentication": "string",
  "features": ["string array"],
  "star_rating": "number",
  "user_reviews": [
    {
      "_id": "string (ObjectId)",
      "name": "string (required)",
      "review": "string (required)",
      "star": "number (required)",
      "date": "string (ISO date)",
      "important": "boolean (default: false)"
    }
  ],
  "roadmap": "string",
  "screenshots": ["string array (URLs)"],
  "github_repo": "string (URL)",
  "live_demo": "string (URL)",
  "change_log": [
    {
      "version": "string (required)",
      "date": "string (ISO date, required)",
      "changes": "string (required)"
    }
  ],
  "createdAt": "string (ISO date)",
  "updatedAt": "string (ISO date)"
}
```

## Endpoints

### 1. Create Project 🔒
**POST** `/me/projects/`

Creates a new project. Admin access required.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "E-Commerce Platform",
  "description_short": "Modern e-commerce solution with advanced features",
  "description_long": "A comprehensive e-commerce platform built with modern technologies...",
  "tech_stack": ["React", "Node.js", "MongoDB", "Express"],
  "api_used": ["Stripe API", "PayPal API", "SendGrid"],
  "status": "in-progress",
  "start_date": "2025-01-15T00:00:00.000Z",
  "end_date": "2025-06-30T00:00:00.000Z",
  "deployment_date": "2025-07-15T00:00:00.000Z",
  "version": "1.0.0",
  "estimated_hours": 500,
  "coverImage": "https://example.com/cover.jpg",
  "youtubeUrl": "https://youtube.com/watch?v=example",
  "videoUrl": "https://example.com/demo.mp4",
  "budget": 25000,
  "client": "ABC Corporation",
  "database": "MongoDB Atlas",
  "hosting": "AWS",
  "authentication": "JWT",
  "features": ["User Authentication", "Payment Gateway", "Admin Dashboard"],
  "star_rating": 4.5,
  "roadmap": "Phase 1: Basic setup, Phase 2: Core features...",
  "screenshots": ["https://example.com/screen1.jpg", "https://example.com/screen2.jpg"],
  "github_repo": "https://github.com/user/ecommerce-platform",
  "live_demo": "https://demo.ecommerce-platform.com",
  "change_log": [
    {
      "version": "1.0.0",
      "date": "2025-07-15T00:00:00.000Z",
      "changes": "Initial release with core features"
    }
  ]
}
```

**Required Fields:**
- `name` (string)
- `description_short` (string)
- `description_long` (string)

**Response:**
```json
{
  "success": true,
  "message": "Project created",
  "data": {
    "_id": "64a1b2c3d4e5f6789abc0123",
    "name": "E-Commerce Platform",
    "slug": "e-commerce-platform",
    "description_short": "Modern e-commerce solution with advanced features",
    "description_long": "A comprehensive e-commerce platform built with modern technologies...",
    "tech_stack": ["React", "Node.js", "MongoDB", "Express"],
    "api_used": ["Stripe API", "PayPal API", "SendGrid"],
    "status": "in-progress",
    "start_date": "2025-01-15T00:00:00.000Z",
    "end_date": "2025-06-30T00:00:00.000Z",
    "deployment_date": "2025-07-15T00:00:00.000Z",
    "version": "1.0.0",
    "estimated_hours": 500,
    "coverImage": "https://example.com/cover.jpg",
    "youtubeUrl": "https://youtube.com/watch?v=example",
    "videoUrl": "https://example.com/demo.mp4",
    "budget": 25000,
    "client": "ABC Corporation",
    "database": "MongoDB Atlas",
    "hosting": "AWS",
    "authentication": "JWT",
    "features": ["User Authentication", "Payment Gateway", "Admin Dashboard"],
    "star_rating": 4.5,
    "user_reviews": [],
    "roadmap": "Phase 1: Basic setup, Phase 2: Core features...",
    "screenshots": ["https://example.com/screen1.jpg", "https://example.com/screen2.jpg"],
    "github_repo": "https://github.com/user/ecommerce-platform",
    "live_demo": "https://demo.ecommerce-platform.com",
    "change_log": [
      {
        "version": "1.0.0",
        "date": "2025-07-15T00:00:00.000Z",
        "changes": "Initial release with core features"
      }
    ],
    "createdAt": "2025-09-06T10:00:00.000Z",
    "updatedAt": "2025-09-06T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Invalid project data / Validation error
- `401` - Unauthorized
- `403` - Admin access required
- `409` - Project already exists (duplicate name/slug)

---

### 2. Get All Projects (Enhanced)
**GET** `/me/projects/`

Retrieves all projects with comprehensive filtering, searching, sorting, and pagination capabilities. Public endpoint.

**Query Parameters:**

#### Search Parameters:
- `search` (string) - Global search across name, descriptions, tech stack, features, and client
- `name` (string) - Search by project name

#### Filter Parameters:
- `status` (string|array) - Filter by project status (e.g., "completed", "in-progress", "planned")
- `tech_stack` (string|array) - Filter by technology stack
- `database` (string) - Filter by database type
- `hosting` (string) - Filter by hosting platform
- `authentication` (string) - Filter by authentication method
- `client` (string) - Filter by client name

#### Rating Filters:
- `min_rating` (number) - Minimum star rating
- `max_rating` (number) - Maximum star rating

#### Date Filters:
- `start_date_from` (ISO date) - Filter projects starting from this date
- `start_date_to` (ISO date) - Filter projects starting before this date
- `end_date_from` (ISO date) - Filter projects ending from this date
- `end_date_to` (ISO date) - Filter projects ending before this date
- `deployment_date_from` (ISO date) - Filter projects deployed from this date
- `deployment_date_to` (ISO date) - Filter projects deployed before this date

#### Budget Filters:
- `min_budget` (number) - Minimum budget amount
- `max_budget` (number) - Maximum budget amount

#### Hours Filters:
- `min_hours` (number) - Minimum estimated hours
- `max_hours` (number) - Maximum estimated hours

#### Sorting:
- `sort_by` (string) - Sort field (default: "star_rating")
  - Valid options: `name`, `star_rating`, `start_date`, `end_date`, `deployment_date`, `budget`, `estimated_hours`, `createdAt`, `updatedAt`
- `sort_order` (string) - Sort direction: `asc` or `desc` (default: "desc")

#### Pagination:
- `page` (number) - Page number (default: 1)
- `limit` (number) - Items per page (default: 10)

#### Field Selection:
- `fields` (string) - Comma-separated list of fields to include (e.g., "name,status,tech_stack")

**Example Requests:**
```
GET /me/projects/
GET /me/projects/?search=ecommerce
GET /me/projects/?status=completed&sort_by=star_rating&sort_order=desc
GET /me/projects/?tech_stack=React,Node.js&min_rating=4
GET /me/projects/?min_budget=10000&max_budget=50000
GET /me/projects/?page=2&limit=5&fields=name,status,star_rating
GET /me/projects/?start_date_from=2025-01-01&end_date_to=2025-12-31
```

**Response:**
```json
{
  "success": true,
  "message": "Projects retrieved successfully",
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789abc0123",
      "name": "E-Commerce Platform",
      "slug": "e-commerce-platform",
      "description_short": "Modern e-commerce solution with advanced features",
      "tech_stack": ["React", "Node.js", "MongoDB", "Express"],
      "status": "completed",
      "star_rating": 4.8,
      "budget": 25000,
      "estimated_hours": 500,
      "start_date": "2025-01-15T00:00:00.000Z",
      "end_date": "2025-06-30T00:00:00.000Z",
      "deployment_date": "2025-07-15T00:00:00.000Z",
      "coverImage": "https://example.com/cover.jpg",
      "github_repo": "https://github.com/user/ecommerce-platform",
      "live_demo": "https://demo.ecommerce-platform.com",
      "createdAt": "2025-09-06T10:00:00.000Z",
      "updatedAt": "2025-09-06T10:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalProjects": 45,
    "projectsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "filters": {
    "applied": true,
    "count": 3
  }
}
```

---

### 3. Get Single Project
**GET** `/me/projects/:id`

Retrieves a specific project by ID or slug. Authentication required.

**Parameters:**
- `id` (path) - Project ID (ObjectId) or slug

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "64a1b2c3d4e5f6789abc0123",
    "name": "E-Commerce Platform",
    "slug": "e-commerce-platform",
    "description_short": "Modern e-commerce solution with advanced features",
    "description_long": "A comprehensive e-commerce platform built with modern technologies...",
    "tech_stack": ["React", "Node.js", "MongoDB", "Express"],
    "api_used": ["Stripe API", "PayPal API", "SendGrid"],
    "status": "completed",
    "start_date": "2025-01-15T00:00:00.000Z",
    "end_date": "2025-06-30T00:00:00.000Z",
    "deployment_date": "2025-07-15T00:00:00.000Z",
    "version": "1.0.0",
    "estimated_hours": 500,
    "coverImage": "https://example.com/cover.jpg",
    "youtubeUrl": "https://youtube.com/watch?v=example",
    "videoUrl": "https://example.com/demo.mp4",
    "budget": 25000,
    "client": "ABC Corporation",
    "database": "MongoDB Atlas",
    "hosting": "AWS",
    "authentication": "JWT",
    "features": ["User Authentication", "Payment Gateway", "Admin Dashboard"],
    "star_rating": 4.5,
    "user_reviews": [
      {
        "_id": "64a1b2c3d4e5f6789abc0124",
        "name": "John Doe",
        "review": "Excellent project with great features!",
        "star": 5,
        "date": "2025-08-15T10:30:00.000Z",
        "important": true
      }
    ],
    "roadmap": "Phase 1: Basic setup, Phase 2: Core features...",
    "screenshots": ["https://example.com/screen1.jpg", "https://example.com/screen2.jpg"],
    "github_repo": "https://github.com/user/ecommerce-platform",
    "live_demo": "https://demo.ecommerce-platform.com",
    "change_log": [
      {
        "version": "1.0.0",
        "date": "2025-07-15T00:00:00.000Z",
        "changes": "Initial release with core features"
      }
    ],
    "createdAt": "2025-09-06T10:00:00.000Z",
    "updatedAt": "2025-09-06T10:00:00.000Z"
  }
}
```

**Notes:**
- User reviews are sorted with important reviews first
- Authentication required for detailed view

**Error Responses:**
- `401` - Unauthorized
- `404` - Project not found

---

### 4. Update Project 🔒
**PUT** `/me/projects/:id`

Updates an existing project. Admin access required.

**Parameters:**
- `id` (path) - Project ID (ObjectId) or slug

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Updated E-Commerce Platform",
  "description_short": "Updated description",
  "status": "completed",
  "star_rating": 4.8,
  "features": ["User Authentication", "Payment Gateway", "Admin Dashboard", "Analytics"],
  "change_log": [
    {
      "version": "1.1.0",
      "date": "2025-08-15T00:00:00.000Z",
      "changes": "Added analytics dashboard and performance improvements"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Project updated",
  "data": {
    "_id": "64a1b2c3d4e5f6789abc0123",
    "name": "Updated E-Commerce Platform",
    "slug": "updated-e-commerce-platform",
    "description_short": "Updated description",
    "status": "completed",
    "star_rating": 4.8,
    "features": ["User Authentication", "Payment Gateway", "Admin Dashboard", "Analytics"],
    "change_log": [
      {
        "version": "1.0.0",
        "date": "2025-07-15T00:00:00.000Z",
        "changes": "Initial release with core features"
      },
      {
        "version": "1.1.0",
        "date": "2025-08-15T00:00:00.000Z",
        "changes": "Added analytics dashboard and performance improvements"
      }
    ],
    "updatedAt": "2025-09-06T11:00:00.000Z"
  }
}
```

**Notes:**
- Only new changelog entries (by version) are added to prevent duplicates
- Slug is auto-updated if name changes
- Arrays are properly formatted (CSV strings converted to arrays)

**Error Responses:**
- `401` - Unauthorized
- `403` - Admin access required
- `404` - Project not found

---

### 5. Delete Project 🔒
**DELETE** `/me/projects/:id`

Deletes a project. Admin access required.

**Parameters:**
- `id` (path) - Project ID (ObjectId) or slug

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

**Error Responses:**
- `401` - Unauthorized
- `403` - Admin access required
- `404` - Project not found

---

### 6. Get Summary 🔒
**GET** `/me/projects/summary/info`

Provides statistical summary of all projects. Admin access required.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_project": 15,
    "statusCount": {
      "completed": 8,
      "in-progress": 4,
      "planned": 2,
      "on-hold": 1
    }
  }
}
```

**Error Responses:**
- `401` - Unauthorized
- `403` - Admin access required

---

### 7. Upload Screenshot 🔒
**POST** `/me/projects/upload-screenshot`

Uploads a screenshot image to Cloudinary. Admin access required.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
- `file` (file) - Image file to upload

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "url": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/project_screenshots/abc123.jpg",
  "fileName": "screenshot.jpg"
}
```

**Error Responses:**
- `400` - No file uploaded
- `401` - Unauthorized
- `403` - Admin access required

---

### 8. Add User Review
**POST** `/me/projects/:projectId/reviews`

Adds a user review to a project. Authentication required.

**Parameters:**
- `projectId` (path) - Project ID (ObjectId) or slug

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Jane Smith",
  "review": "Amazing project! Very well implemented with clean code.",
  "important": false
}
```

**Required Fields:**
- `name` (string)
- `review` (string)

**Response:**
```json
{
  "success": true,
  "message": "Review added successfully"
}
```

**Notes:**
- Star rating is automatically set to 3
- Date is automatically set to current date
- `important` field is optional (defaults to false)

**Error Responses:**
- `401` - Unauthorized
- `404` - Project not found

---

### 9. Mark Review as Important
**PATCH** `/me/projects/:projectId/reviews/:reviewId/important`

Marks a specific review as important. Authentication required.

**Parameters:**
- `projectId` (path) - Project ID (ObjectId) or slug
- `reviewId` (path) - Review ID (ObjectId)

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Review marked as important"
}
```

**Error Responses:**
- `401` - Unauthorized
- `404` - Project not found / Review not found

---

### 10. Delete User Review
**DELETE** `/me/projects/:projectId/reviews/:reviewId`

Deletes a user review from a project. Authentication required.

**Parameters:**
- `projectId` (path) - Project ID (ObjectId) or slug
- `reviewId` (path) - Review ID (ObjectId)

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Review deleted successfully"
}
```

**Error Responses:**
- `401` - Unauthorized
- `404` - Project not found

---

### 11. Get All Reviews
**GET** `/me/projects/reviews`

Retrieves all reviews from all projects. Public endpoint.

**Response:**
```json
{
  "success": true,
  "message": "All project reviews fetched successfully.",
  "count": 25,
  "reviews": [
    {
      "project": {
        "name": "E-Commerce Platform",
        "slug": "e-commerce-platform"
      },
      "_id": "64a1b2c3d4e5f6789abc0124",
      "name": "John Doe",
      "review": "Excellent project with great features!",
      "star": 5,
      "date": "2025-08-15T10:30:00.000Z",
      "important": true
    },
    {
      "project": {
        "name": "Task Management App",
        "slug": "task-management-app"
      },
      "_id": "64a1b2c3d4e5f6789abc0125",
      "name": "Jane Smith",
      "review": "Very intuitive and user-friendly interface.",
      "star": 4,
      "date": "2025-08-10T14:20:00.000Z",
      "important": false
    }
  ]
}
```

---

### 12. Get Single Project Reviews
**GET** `/me/projects/reviews/:id`

Retrieves all reviews for a specific project.

**Parameters:**
- `id` (path) - Project ID (ObjectId) or slug

**Response:**
```json
{
  "success": true,
  "message": "Project reviews fetched successfully",
  "project": {
    "name": "E-Commerce Platform",
    "slug": "e-commerce-platform"
  },
  "count": 3,
  "reviews": [
    {
      "_id": "64a1b2c3d4e5f6789abc0124",
      "name": "John Doe",
      "review": "Excellent project with great features!",
      "star": 5,
      "date": "2025-08-15T10:30:00.000Z",
      "important": true
    },
    {
      "_id": "64a1b2c3d4e5f6789abc0125",
      "name": "Jane Smith",
      "review": "Very well structured and documented.",
      "star": 4,
      "date": "2025-08-10T14:20:00.000Z",
      "important": false
    }
  ]
}
```

**Error Responses:**
- `404` - Project not found

---

## HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid request data |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Admin access required |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 500 | Internal Server Error - Server error |

## Error Codes

| Error Code | Description |
|------------|-------------|
| INVALID_PROJECT_DATA | Validation error in project data |
| PROJECT_EXISTS | Project with name/slug already exists |
| PROJECT_CREATION_FAILED | Failed to create project |
| FETCH_PROJECTS_FAILED | Failed to fetch projects |
| PROJECT_NOT_FOUND | Project not found |
| FETCH_SINGLE_PROJECT_FAILED | Failed to fetch single project |
| UPDATE_PROJECT_FAILED | Failed to update project |
| DELETE_PROJECT_FAILED | Failed to delete project |
| SUMMARY_FETCH_FAILED | Failed to fetch summary |
| ADD_REVIEW_FAILED | Failed to add review |
| MARK_REVIEW_FAILED | Failed to mark review as important |
| DELETE_REVIEW_FAILED | Failed to delete review |
| REVIEW_NOT_FOUND | Review not found |
| NO_FILE_UPLOADED | No file provided for upload |
| UPLOAD_FAILED | File upload failed |

## Data Formatting Notes

### Arrays
- `tech_stack`: Accepts array or will be converted from comma-separated values
- `api_used`: Accepts comma-separated string and converts to array
- `features`: Accepts array format
- `screenshots`: Accepts array of URLs

### Change Log
- Automatically prevents duplicate versions
- Requires version, date, and changes fields
- Date is converted to proper Date object

### User Reviews
- Automatically sorted with important reviews first
- Star rating defaults to 3 for new reviews
- Date is automatically set to current timestamp

### Slugs
- Auto-generated from project name using slugify
- Lowercase, URL-friendly format
- Updated automatically when name changes

## File Upload
- Supported formats: Images (JPG, PNG, GIF, etc.)
- Uploaded to Cloudinary
- Returns direct URL for use in project data
- Admin access required

## Notes for Frontend Developers

1. **Authentication**: Most endpoints require JWT token in Authorization header
2. **Admin Endpoints**: Marked with 🔒 require admin role
3. **Public Endpoints**: `GET /me/projects/` and review endpoints are public
4. **ID Parameters**: Accept both ObjectId and slug for flexibility
5. **File Uploads**: Use multipart/form-data for screenshot uploads
6. **Data Validation**: Required fields are enforced server-side
7. **Automatic Formatting**: Arrays and slugs are automatically formatted
8. **Review Management**: Important reviews are automatically sorted first
9. **Change Log**: Duplicate versions are prevented automatically
10. **Error Handling**: Comprehensive error codes for better debugging
