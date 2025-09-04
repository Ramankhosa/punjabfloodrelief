# Admin Section Documentation

This document describes the admin section functionality for the Punjab Flood Relief application.

## Overview

The admin section provides comprehensive management capabilities for relief groups and users, including approval workflows, role-based access control, and administrative oversight.

## Features

### 1. Admin Dashboard
- **Overview Tab**: Displays statistics about total groups, pending approvals, approved groups, and user counts
- **Relief Groups Tab**: Manage and review relief group applications
- **Users Tab**: Manage user roles and permissions
- **Settings Tab**: Administrative configuration (placeholder for future features)

### 2. Relief Group Management
- View all relief groups with filtering by status
- Approve or reject pending group applications
- Detailed view of group information including documents, representatives, and audit logs
- Status tracking and review notes

### 3. User Role Management
- View all users and their current roles
- Update user roles with audit logging
- Role-based permissions system

### 4. Audit Logging
- All admin actions are logged with timestamps and user information
- Track approval/rejection history
- Role change history

## User Roles

### Administrator (`admin`)
- Full system access
- Can manage all users and their roles
- Can approve/reject relief groups
- Access to all admin features

### Group Approver (`group_approver`)
- Can approve or reject relief group applications
- View relief group details and documents
- Cannot manage user roles

### Group Representative (`group_rep`)
- Represents a registered relief group
- Can manage their group's operations
- Limited access to admin features

### User (`user`)
- Basic user access
- Can register relief groups
- No admin access

## API Endpoints

### Admin Routes
- `GET /api/admin` - Get admin statistics and relief groups
- `GET /api/admin?users=true` - Get all users
- `GET /api/admin?stats=true` - Get admin dashboard statistics

### Relief Group Management
- `GET /api/admin/relief-groups/[groupId]` - Get detailed group information
- `PATCH /api/admin/relief-groups/[groupId]?action=approve` - Approve a group
- `PATCH /api/admin/relief-groups/[groupId]?action=reject` - Reject a group

### User Management
- `GET /api/admin/users/[userId]` - Get user details
- `PATCH /api/admin/users/[userId]` - Update user roles

## Setup Instructions

### 1. Database Migration
The admin features require database schema updates. Run the migration:

```bash
cd plr-app
npx prisma migrate dev
```

### 2. Create Admin User
To create an initial admin user, run the seed script:

```bash
node scripts/create-admin-user.js
```

Default admin credentials:
- **Email**: admin@pfr.org
- **Password**: admin123

**⚠️ Important**: Change the default password after first login!

### 3. Access Admin Panel
1. Log in with admin credentials
2. The "Admin Panel" card will appear on the dashboard
3. Click "Access Admin" to enter the admin section

## Usage Guide

### Managing Relief Groups

1. **View Pending Groups**:
   - Go to the Relief Groups tab
   - Click "Pending Review" filter
   - Review group information and documents

2. **Approve/Reject Groups**:
   - Click on a group to view details
   - Add review notes if desired
   - Click "Approve Group" or provide rejection reason and click "Reject Group"

3. **View Group Details**:
   - Click "View Details" on any group card
   - Review complete information including documents, audit logs, and contact details

### Managing Users

1. **View Users**:
   - Go to the Users tab
   - Browse the list of all users

2. **Update User Roles**:
   - Click "Manage Roles" on a user
   - Select/deselect role checkboxes
   - Provide a reason for the changes
   - Click "Save Role Changes"

## Security Features

- **Role-based Access Control**: All admin routes require appropriate roles
- **Audit Logging**: All actions are logged with user information and timestamps
- **Input Validation**: All API inputs are validated using Zod schemas
- **Authentication Required**: All admin features require valid JWT authentication

## File Structure

```
plr-app/src/
├── app/
│   ├── admin/
│   │   ├── page.tsx                    # Main admin dashboard
│   │   ├── relief-groups/
│   │   │   └── [groupId]/
│   │   │       └── page.tsx           # Group detail view
│   │   └── users/
│   │       └── [userId]/
│   │           └── page.tsx           # User management
│   └── api/
│       └── admin/
│           ├── route.ts                # Admin API endpoints
│           ├── relief-groups/
│           │   └── [groupId]/
│           │       └── route.ts       # Group management API
│           └── users/
│               └── [userId]/
│                   └── route.ts       # User management API
├── components/
│   └── ui/
│       ├── checkbox.tsx               # Custom checkbox component
│       └── textarea.tsx               # Textarea component
└── lib/
    └── auth-middleware.ts             # Role-based middleware
```

## Future Enhancements

- **Bulk Operations**: Approve/reject multiple groups at once
- **Advanced Filtering**: Filter groups by date, location, organization type
- **Email Notifications**: Notify users of approval/rejection decisions
- **Reporting**: Generate reports on group activities and user statistics
- **Admin Settings**: Configure system-wide settings and permissions

## Troubleshooting

### Common Issues

1. **"Admin Panel" not showing**:
   - Ensure user has `admin` or `group_approver` role
   - Check that JWT token contains correct roles

2. **Permission denied errors**:
   - Verify user roles in database
   - Check middleware role requirements

3. **Database errors**:
   - Ensure migrations have been run
   - Check database connection

### Support

For technical issues or questions about the admin system, refer to the API documentation or contact the development team.
