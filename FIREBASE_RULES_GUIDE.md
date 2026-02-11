# Firebase Security Rules - Complete Guide

## 📋 Table of Contents
1. [Firestore Rules](#firestore-rules)
2. [Storage Rules](#storage-rules)
3. [Deployment](#deployment)
4. [Testing Rules](#testing-rules)

---

## 🔥 Firestore Rules

### Role-Based Access Control

**Four User Roles:**
1. **Admin** - Full access to everything
2. **Core Employee** - Elevated access, can manage teams
3. **Normal Employee** - Standard access
4. **Intern** - Limited access

### Helper Functions

```javascript
isAuthenticated()        // User is logged in
isAdmin()               // User is admin
isCoreEmployee()        // User is core employee
hasElevatedAccess()     // Admin OR core employee
isOwner(userId)         // User owns the document
isActive()              // User account is active
```

### Collection Rules Summary

| Collection | Read | Create | Update | Delete |
|-----------|------|--------|--------|--------|
| **users** | All auth | Admin only | Owner/Admin | Admin only |
| **groups** | All auth | Elevated | Elevated | Admin only |
| **tasks** | All auth | Elevated | Assignee/Elevated | Admin only |
| **notifications** | Owner/Admin | Admin | Owner | Admin only |
| **messages** | Recipient/Admin | Admin | Owner/Admin | Admin only |
| **resources** | All auth | Elevated | Elevated | Admin only |
| **meetings** | All auth | Elevated | Elevated | Admin only |
| **feedback** | Owner/Admin | All auth | Owner/Admin | Admin only |
| **performance_scores** | Owner/Elevated | Elevated | Elevated | Admin only |
| **finance** | Elevated only | Elevated | Admin | Admin only |

### Key Security Features

✅ **Users Collection:**
- Everyone can see profiles (team visibility)
- Users can update their own profile
- Only admins can create/delete users

✅ **Tasks Collection:**
- Task assignees can update their tasks
- Supports both individual and group task assignments
- Only creators and admins can delete

✅ **Messages Collection:**
- Users only see messages sent to them
- Broadcast messages visible to all
- Users can mark as read (update readBy array)

✅ **Finance Module:**
- Only visible to Admin and Core Employees
- Transactions, budgets, investors, assets protected
- Strict admin-only write access for sensitive data

✅ **Audit Logs:**
- Only admins can read
- Anyone can create (system logging)
- Immutable (no updates allowed)

---

## 📦 Storage Rules

### File Categories

**1. Profile Images**
- Path: `profile-images/{userId}`
- Max size: 5MB
- Type: Images only
- Read: Public
- Write: Owner only

**2. Task Attachments**
- Path: `task-attachments/{taskId}/{fileName}`
- Max size: 10MB (docs), 5MB (images)
- Type: Images and documents
- Read/Write: All authenticated

**3. Resources**
- Path: `resources/{resourceId}/{fileName}`
- Max size: 10MB
- Type: Images and documents
- Read/Write: All authenticated

**4. Expense Receipts**
- Path: `expense-receipts/{userId}/{expenseId}/{fileName}`
- Max size: 5MB
- Type: Images and PDFs
- Read/Write: Owner only

**5. Group Files**
- Path: `group-files/{groupId}/{fileName}`
- Max size: 10MB
- Read/Write: All authenticated

**6. Temp Uploads**
- Path: `temp/{userId}/{fileName}`
- Max size: 20MB
- Read/Write: Owner only

### File Type Validation

```javascript
// Valid image types
image/jpeg, image/png, image/gif, image/webp

// Valid document types
application/pdf
application/msword
application/vnd.openxmlformats-officedocument.*
text/*
```

---

## 🚀 Deployment

### Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### Deploy Storage Rules

```bash
firebase deploy --only storage
```

### Deploy Both

```bash
firebase deploy --only firestore:rules,storage
```

### Deploy Everything

```bash
firebase deploy
```

---

## 🧪 Testing Rules

### Test in Firebase Console

1. Go to Firebase Console
2. Navigate to **Firestore Database** or **Storage**
3. Click **Rules** tab
4. Click **Rules Playground**
5. Test different scenarios

### Test Scenarios

**Firestore:**
```javascript
// Test 1: Regular user reading their tasks
Auth: uid = "user123"
Path: /tasks/task123
Operation: get
Expected: Allow (if assigned to task)

// Test 2: Admin reading all users
Auth: uid = "admin123" (role: admin)
Path: /users
Operation: list
Expected: Allow

// Test 3: User trying to read other's notifications
Auth: uid = "user123"
Path: /notifications/notif456 (belongs to user789)
Operation: get
Expected: Deny
```

**Storage:**
```javascript
// Test 1: User uploading profile image
Auth: uid = "user123"
Path: /profile-images/user123
File: 2MB JPEG
Expected: Allow

// Test 2: User uploading 10MB profile image
Auth: uid = "user123"
Path: /profile-images/user123
File: 10MB JPEG
Expected: Deny (exceeds 5MB limit)

// Test 3: User accessing another user's receipts
Auth: uid = "user123"
Path: /expense-receipts/user789/receipt1.pdf
Expected: Deny (not owner)
```

---

## 🔒 Security Best Practices

### ✅ DO:
- Always validate user authentication
- Check user roles for sensitive operations
- Validate file sizes and types
- Use helper functions for reusability
- Log important actions in audit logs
- Test rules before deploying to production

### ❌ DON'T:
- Never use `allow read, write: if true` in production
- Don't expose sensitive data (salaries, passwords, etc.)
- Don't allow unrestricted file uploads
- Don't skip authentication checks
- Don't allow users to modify roles directly

---

## 📊 Rule Structure

### Firestore Rule Template

```javascript
match /collection/{docId} {
  // Read access
  allow read: if [condition];
  
  // Write access (create, update, delete)
  allow create: if [condition];
  allow update: if [condition];
  allow delete: if [condition];
  
  // Subcollections
  match /{document=**} {
    allow read, write: if [condition];
  }
}
```

### Storage Rule Template

```javascript
match /path/{fileName} {
  // Read access
  allow read: if [condition];
  
  // Write access (upload/update)
  allow write: if [condition] && 
                 [file type check] && 
                 [file size check];
  
  // Delete access
  allow delete: if [condition];
}
```

---

## 🆘 Common Issues

### Issue 1: Permission Denied
**Problem:** Users getting "Missing or insufficient permissions"
**Solution:** Check if user is authenticated and has the right role

### Issue 2: File Upload Failed
**Problem:** Files not uploading to Storage
**Solution:** Verify file size and type match the rules

### Issue 3: Can't Read Documents
**Problem:** Queries returning empty even though data exists
**Solution:** Ensure rules allow reading AND the query filters match rule conditions

---

## 📞 Support

If you encounter issues:
1. Check Firebase Console logs
2. Test rules in Rules Playground
3. Verify user authentication token
4. Check user role in Firestore

---

**Last Updated:** February 2026
**Version:** 2.0
