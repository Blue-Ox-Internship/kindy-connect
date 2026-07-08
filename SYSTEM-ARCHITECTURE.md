# System Architecture - Kindy Connect

## ✅ All Files Connected and Working

### Core System Flow

```
User Login
    ↓
[index.tsx] → Login Page
    ↓
[db-functions.ts] → loginUser() → PostgreSQL Database
    ↓
[mock-store.tsx] → Load user data → Store in React Context
    ↓
[app.tsx] → Protected Routes
    ↓
[app-shell.tsx] → Main Layout with Navigation
    ↓
[Dashboard/Pages] → Display data
```

### File Connections

#### 1. Database Layer (`src/lib/`)
- ✅ **db.ts** - PostgreSQL connection, toCamel/toSnake transformers
- ✅ **db-functions.ts** - All server functions (CRUD operations)
  - `getInitialData()` - Load schools, users, classes, pupils, parents
  - `loginUser()` - Authentication
  - `registerUser()`, `addPupil()`, `markArrival()`, etc.

#### 2. State Management (`src/lib/`)
- ✅ **mock-store.tsx** - React Context provider
  - Wraps entire app
  - Calls db-functions to load data
  - Provides data to all components via `useStore()`

#### 3. Routing (`src/routes/`)
- ✅ **__root.tsx** - Root layout with MockStoreProvider
- ✅ **index.tsx** - Login page
- ✅ **app.tsx** - Protected route wrapper
- ✅ **app.dashboard.tsx** - Dashboard page
- ✅ **app.users.tsx** - Users management (super admin only)
- ✅ **app.teachers.tsx** - Teachers management
- ✅ **app.schools.tsx** - Schools management (super admin only)
- ✅ **app.pupils.tsx** - Pupils management
- ✅ **app.classes.tsx** - Classes management
- ✅ **app.parents.tsx** - Parents management
- ✅ **app.attendance.tsx** - Attendance tracking
- ✅ **app.marks.tsx** - Marks/grades management
- ✅ **app.reports.tsx** - Reports generation
- ✅ **app.audit.tsx** - Audit logs

#### 4. Components (`src/components/`)
- ✅ **app-shell.tsx** - Main layout with sidebar navigation
  - Checks authentication
  - Shows loading spinner if no currentUser
  - Renders navigation based on user role
- ✅ **school-selector.tsx** - School dropdown for super admin
- ✅ **ui/** - Reusable UI components (buttons, cards, dialogs, etc.)

### Data Flow Example: Login

1. **User enters ID** on `/` (index.tsx)
2. **Click "Sign In"** → calls `store.login(id)`
3. **mock-store.tsx** → calls `loginUser({ data: { id } })`
4. **db-functions.ts** → `SELECT * FROM users WHERE id = ${id}`
5. **PostgreSQL** returns user data
6. **db-functions.ts** → `toCamel()` transforms snake_case to camelCase
7. **mock-store.tsx** → saves to state, calls `getInitialData()`
8. **db-functions.ts** → loads schools, users, classes, pupils, parents
9. **PostgreSQL** returns all data
10. **mock-store.tsx** → stores in context
11. **app.tsx** → redirects to `/app/dashboard`
12. **app-shell.tsx** → checks currentUser, renders layout
13. **app.dashboard.tsx** → reads data from `useStore()`, displays dashboard

### Database Schema

**Tables:**
- `users` - All system users (super admin, school admin, deputy, teacher)
- `schools` - School information
- `classes` - Classes with teacher assignments
- `pupils` - Student records
- `parents` - Parent/guardian information
- `pupil_parents` - Many-to-many relationship
- `attendance` - Daily arrival/departure records
- `notifications` - SMS/Email notification logs
- `marks` - Student grades/scores
- `audit_logs` - System activity logs

### Environment Variables (.env)

```env
DATABASE_URL=postgresql://...
VITE_APP_NAME=Little Stars
VITE_APP_URL=http://localhost:3000
```

### User Roles & Permissions

1. **Super Admin**
   - Access: All schools, all users
   - Can: Create schools, manage all users, view all data

2. **School Admin** 
   - Access: Their school only
   - Can: Add teachers, pupils, manage classes, view reports

3. **Deputy**
   - Access: Their school only
   - Can: Same as school admin

4. **Teacher**
   - Access: Their assigned class
   - Can: Mark attendance, view pupils in their class

### Performance Optimizations

1. **Initial Load**: Only essential data (schools, users, classes, pupils, parents)
2. **On-Demand**: Heavy data loaded per page (attendance, marks, notifications, audit)
3. **Database**: Connection pooling (20), prepared statements, indexes
4. **Caching**: React Query (5min stale time, 10min cache)
5. **Code Splitting**: Lazy load PDF libraries (630KB)

### Current Status

✅ Database connected (Supabase PostgreSQL)
✅ All CRUD operations working
✅ Authentication working
✅ All roles implemented
✅ All pages loading
✅ Performance optimized
✅ No TypeScript errors
✅ Dev server running on port 8080

## Access the System

**URL**: http://localhost:8080

**Test Users**:
- Super Admin: `NIC00` / `admin123`
- School Admin: `u1` / `admin123`
- Teacher: `u4` / `peter123`

**All systems operational! 🎉**
