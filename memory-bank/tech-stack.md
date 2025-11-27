# Tech Stack - LVL.AI Analytics Feature

## Existing Stack (Must Follow)

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js with TypeScript
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT tokens (already implemented)
- **Validation:** express-validator

### Frontend
- **Framework:** Next.js 15 with React 19
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI primitives with custom components
- **Charts:** Recharts (already installed)
- **Icons:** Heroicons
- **HTTP Client:** Axios

## Architecture Patterns to Follow

### Backend
1. Route ’ Controller ’ Model pattern
2. Authenticate all private routes
3. Use express-validator for input validation
4. Always return { success: boolean, data?: any, message?: string }

### Frontend
1. Use 'use client' for interactive components
2. Use centralized API client in /lib/api/
3. Wrap pages with ClientGuard + Sidebar
4. Use Tailwind utility classes for styling

## Database Schema
**No new models needed** - Use existing User and Task models

## Code Quality
- TypeScript strict mode
- No console.logs in production code
- Proper error handling
