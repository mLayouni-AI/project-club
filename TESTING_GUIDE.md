# 🧪 Quick Testing Guide

## Testing the Complete Authentication System

### Step 1: Ensure Backend is Running

Open a terminal and run:
```powershell
cd "c:\Users\Lenovo x280\OneDrive\Bureau\AliensCoders\back-end\clubsite_backend"
python manage.py runserver
```

You should see:
```
Starting development server at http://127.0.0.1:8000/
```

### Step 2: Ensure Frontend is Running

Open another terminal and run:
```powershell
cd "c:\Users\Lenovo x280\OneDrive\Bureau\AliensCoders\front-end"
npm start
```

Browser should automatically open to `http://localhost:3000`

---

## Test Scenario 1: New User Signup

1. **Navigate to Signup**
   - If at login page, click "Sign up here"
   - Or go directly to `http://localhost:3000/signup`

2. **Fill the form:**
   - First Name: `Test`
   - Last Name: `User`
   - Email: `test.user@example.com`
   - Password: `test1234`
   - Confirm Password: `test1234`

3. **Click "Create Account"**

4. **Expected Result:**
   - Green success message appears
   - Message says "Account created successfully. Please login."
   - Automatically redirects to login page after 2 seconds

---

## Test Scenario 2: Admin Login

1. **At Login Page** (`/login`)

2. **Enter Admin Credentials:**
   - Email: `admin@alienscoder.com`
   - Password: `admin123`

3. **Click "Sign in"**

4. **Expected Result:**
   - Redirects to dashboard (`/`)
   - Welcome message: "Welcome back, Admin! "
   - Shows: "You are logged in as Administrator"
   - Email displayed: `admin@alienscoder.com`
   - Dashboard shows "Admin Panel" section
   - Navbar is visible with logout button

---

## Test Scenario 3: Member Login

1. **Logout first** (click logout in navbar)

2. **Login as Member:**
   - Email: `ayoub@alienscoder.com`
   - Password: `member123`

3. **Click "Sign in"**

4. **Expected Result:**
   - Redirects to dashboard
   - Welcome message: "Welcome back, Ayoub! "
   - Shows: "You are logged in as Member"
   - Dashboard shows "Getting Started" section (different from admin)
   - Different quick actions for members

---

## Test Scenario 4: Protected Routes

1. **While Logged In**, try accessing:
   - `/members` - Should work, shows members list
   - `/projects` - Should work, shows projects
   - `/announcements` - Should work, shows announcements

2. **Logout**

3. **Try accessing protected routes directly:**
   - Type `http://localhost:3000/members` in browser
   - **Expected**: Automatically redirected to `/login`

---

## Test Scenario 5: Validation Testing

### A. Password Mismatch
1. Go to signup page
2. Enter different passwords in Password and Confirm Password
3. Try to submit
4. **Expected**: Error message "Passwords do not match"

### B. Duplicate Email
1. Go to signup page
2. Try to register with existing email: `admin@alienscoder.com`
3. **Expected**: Error message "A user with this email already exists."

### C. Invalid Login
1. Go to login page
2. Enter wrong password
3. **Expected**: Error message "Invalid email or password"

---

## Test Scenario 6: Navigation Flow

1. **Login as any user**
2. **Click on dashboard cards:**
   - Click "Members" card → Should navigate to `/members`
   - Click "Projects" card → Should navigate to `/projects`
   - Click "Announcements" card → Should navigate to `/announcements`

3. **Use navbar to navigate**
4. **Logout** → Should redirect to `/login`

---

## Test Scenario 7: Token Persistence

1. **Login as admin**
2. **Refresh the page** (F5)
3. **Expected**: 
   - Still logged in
   - User data persists
   - No redirect to login

4. **Open DevTools** (F12)
5. **Go to Application → Local Storage**
6. **Check for:**
   - `accessToken`
   - `refreshToken`
   - `user` (JSON object with user data)

---

## Test Scenario 8: API Integration

1. **Login as admin**
2. **Go to Members page** (`/members`)
3. **Open DevTools → Network tab**
4. **Refresh the page**
5. **Check the request to** `/api/members/`:
   - ✅ Should have `Authorization: Bearer <token>` header
   - ✅ Should return 200 status
   - ✅ Should return list of members

---

## 🎯 All Test Credentials

### Admins (password: admin123)
- admin@alienscoder.com
- sarah.admin@alienscoder.com
- mohammed.admin@alienscoder.com
- fatima.admin@alienscoder.com
- hassan.admin@alienscoder.com

### Members (password: member123)
- ayoub@alienscoder.com
- salma@alienscoder.com
- rachid@alienscoder.com
- amina@alienscoder.com
- youssef@alienscoder.com

---

## 🐛 If Something Doesn't Work

### Backend Issues:
```powershell
# Check if MongoDB is running
# Re-seed the database
cd "c:\Users\Lenovo x280\OneDrive\Bureau\AliensCoders\back-end\clubsite_backend"
python seed_database.py

# Restart Django server
python manage.py runserver
```

### Frontend Issues:
```powershell
# Clear localStorage
# Open DevTools → Application → Local Storage → Clear All

# Restart frontend
cd "c:\Users\Lenovo x280\OneDrive\Bureau\AliensCoders\front-end"
npm start
```

---

## ✨ Success Indicators

Your authentication system is working perfectly if:

✅ Signup creates new users in MongoDB
✅ Login returns JWT tokens and user data
✅ Protected routes require authentication
✅ Navbar shows/hides based on auth state
✅ Dashboard displays user-specific content
✅ Role-based content shows correctly
✅ Logout clears session and redirects
✅ Token persists across page refreshes
✅ API requests include authentication headers

---

**Everything should work flawlessly! Happy testing!**
