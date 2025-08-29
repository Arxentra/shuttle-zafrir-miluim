# Frontend Migration Plan: Supabase to PostgreSQL/Backend API
**Created:** August 29, 2025  
**Objective:** Complete removal of Supabase dependencies  
**Timeline:** Estimated 2-3 days

## Overview
This plan outlines the systematic migration from Supabase to our Docker PostgreSQL database with backend API, enabling complete removal of Supabase dependencies.

## Current State Analysis

### Dependencies to Remove:
- **NPM Package:** `@supabase/supabase-js@2.56.0`
- **Affected Files:** 18 frontend components
- **Supabase Features in Use:**
  1. Authentication (auth.users)
  2. Real-time subscriptions (channels)
  3. File storage (shuttle-csv bucket)
  4. Edge Functions (process-csv)
  5. Direct database queries

## Migration Tasks

### Phase 1: Backend Preparation ⚙️

#### 1.1 Archive Supabase Assets
```bash
# Create archives directory
mkdir -p database/supabase-archive

# Archive migrations
cp -r frontend/supabase/migrations database/supabase-archive/

# Archive Edge Function
cp frontend/supabase/functions/process-csv/index.ts backend/src/services/csv-processor.reference.ts

# Create backup
tar -czf database/supabase-backup-20250829.tar.gz frontend/supabase/
```

#### 1.2 Authentication System
**Files to create in backend:**
- `backend/src/middleware/auth.js` - JWT middleware
- `backend/src/routes/auth.js` - Auth endpoints
- `backend/src/services/authService.js` - Auth logic

**Endpoints needed:**
- `POST /api/auth/login` - Sign in with email/password
- `POST /api/auth/register` - Sign up new user
- `POST /api/auth/logout` - Sign out user
- `POST /api/auth/reset-password` - Password reset
- `GET /api/auth/session` - Get current session
- `POST /api/auth/refresh` - Refresh JWT token

#### 1.3 CSV Processing Migration
**Convert Edge Function to Backend:**
- Source: `frontend/supabase/functions/process-csv/index.ts`
- Target: `backend/src/services/csvProcessor.js`
- Endpoint: `POST /api/csv/process`

**Required functionality:**
1. File upload handling (multer)
2. CSV parsing
3. Database updates
4. Progress tracking
5. Error handling

#### 1.4 File Storage System
**Implement local/S3 storage:**
- `backend/src/services/storageService.js`
- `POST /api/storage/upload` - File upload
- `GET /api/storage/download/:filename` - File download
- `DELETE /api/storage/delete/:filename` - File deletion

#### 1.5 Real-time Updates
**WebSocket implementation:**
- Use Socket.io or native WebSockets
- `backend/src/services/websocket.js`
- Events to implement:
  - `registration:new`
  - `registration:update`
  - `schedule:update`
  - `shuttle:update`

### Phase 2: Frontend Refactoring 🎨

#### 2.1 Create API Service Layer
**New files to create:**
```typescript
// frontend/src/services/api.ts
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// frontend/src/services/authService.ts
// Authentication API calls

// frontend/src/services/dataService.ts
// Data CRUD operations

// frontend/src/services/websocketService.ts
// WebSocket connection management
```

#### 2.2 Update Authentication Hook
**File:** `frontend/src/hooks/useAuth.tsx`

Replace Supabase auth with:
```typescript
// Before (Supabase)
const { error } = await supabase.auth.signInWithPassword({email, password});

// After (Backend API)
const { data, error } = await authService.login(email, password);
```

#### 2.3 Files to Update (18 total)

**High Priority (Core functionality):**
1. ✅ `src/hooks/useAuth.tsx` - Authentication
2. ✅ `src/integrations/supabase/client.ts` - Remove entirely
3. ✅ `src/integrations/supabase/types.ts` - Replace with API types

**Medium Priority (Data operations):**
4. ✅ `src/hooks/useShuttleData.tsx`
5. ✅ `src/hooks/useGlobalSync.tsx`
6. ✅ `src/hooks/useRegistrationCount.tsx`
7. ✅ `src/pages/AdminDashboard.tsx`
8. ✅ `src/components/admin/CSVUploader.tsx`

**Component Updates:**
9. ✅ `src/components/admin/ShuttleManager.tsx`
10. ✅ `src/components/admin/ShuttleManagerNew.tsx`
11. ✅ `src/components/admin/ScheduleTable.tsx`
12. ✅ `src/components/admin/ShuttleExportActions.tsx`
13. ✅ `src/components/admin/CompanyManager.tsx`
14. ✅ `src/components/admin/CompanyScheduleManager.tsx`
15. ✅ `src/components/admin/BulkCompanyEditor.tsx`
16. ✅ `src/components/TimeSlot.tsx`
17. ✅ `src/components/RegistrationModal.tsx`
18. ✅ `src/components/DynamicShuttleBrochure.tsx`

### Phase 3: Testing & Cleanup 🧪

#### 3.1 Functionality Testing Checklist
- [ ] User login/logout
- [ ] User registration
- [ ] Password reset
- [ ] Admin authentication
- [ ] View shuttles/schedules
- [ ] Create/edit/delete shuttles
- [ ] Create/edit/delete schedules
- [ ] User registrations
- [ ] CSV file upload
- [ ] CSV processing
- [ ] Real-time updates
- [ ] Data export

#### 3.2 Final Cleanup
```bash
# Remove Supabase dependency
npm uninstall @supabase/supabase-js

# Remove Supabase folder
rm -rf frontend/supabase

# Clean up unused imports
npm run lint --fix

# Build and test
npm run build
```

## Implementation Order

### Day 1: Backend Implementation
1. ⏱️ Morning: Auth system (JWT, endpoints)
2. ⏱️ Afternoon: CSV processor migration
3. ⏱️ Evening: File storage & WebSocket setup

### Day 2: Frontend Refactoring
1. ⏱️ Morning: API service layer
2. ⏱️ Afternoon: Update auth & hooks
3. ⏱️ Evening: Update components

### Day 3: Testing & Cleanup
1. ⏱️ Morning: Integration testing
2. ⏱️ Afternoon: Bug fixes
3. ⏱️ Evening: Final cleanup & removal

## Code Examples

### Backend Auth Endpoint Example
```javascript
// backend/src/routes/auth.js
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Query PostgreSQL instead of Supabase
    const user = await db.query(
      'SELECT * FROM admin_users WHERE email = $1',
      [email]
    );
    
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Frontend API Service Example
```typescript
// frontend/src/services/authService.ts
export const authService = {
  async login(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      throw new Error('Login failed');
    }
    
    const data = await response.json();
    localStorage.setItem('token', data.token);
    return data;
  },
  
  async logout() {
    localStorage.removeItem('token');
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  }
};
```

## Success Criteria
✅ All Supabase imports removed  
✅ Backend handling all operations  
✅ No references to supabase.co  
✅ All tests passing  
✅ Frontend builds successfully  
✅ All features working with PostgreSQL  

## Risk Mitigation
1. **Backup everything** before starting
2. **Test each component** after updating
3. **Keep Supabase folder** until fully tested
4. **Gradual migration** - one feature at a time
5. **Rollback plan** - Git commits after each phase

## Environment Variables to Update
```env
# Remove these:
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...

# Add these:
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```

## Completion Checklist
- [ ] All backend endpoints created
- [ ] Authentication working
- [ ] CSV processing migrated
- [ ] File storage implemented
- [ ] WebSockets configured
- [ ] All 18 frontend files updated
- [ ] Supabase package removed
- [ ] All tests passing
- [ ] Supabase folder deleted
- [ ] Documentation updated

## Notes
- Keep the migration incremental
- Test frequently
- Commit after each successful step
- Document any issues encountered
- Update this plan as needed

---
**Status:** Ready to begin migration  
**Next Step:** Start with Phase 1.1 - Archive Supabase Assets