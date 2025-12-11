# @hydrooj/user-management

A Hydro plugin that adds a control panel page for comprehensive user management. It provides administrators with tools to view, edit, and manage user accounts and their permissions across domains.

## Prerequisites

- The plugin is installed and enabled (enabled by default).
- You are signed in with an account that has the `PRIV_EDIT_SYSTEM` privilege.

## How to access the page

- **From the Control Panel**
  1. Visit the Control Panel at `/manage`.
  2. In the left sidebar, click **User Management** (用户管理).
  3. You will land on the user list at `/manage/users`.
- **Direct link**
  - Navigate directly to `/manage/users` for the list view.
  - Open `/manage/users/<uid>` to view a specific user, and `/manage/users/<uid>/domains` to check their domain permissions.

## Features

- Adds a "User Management" entry to the admin Control Panel (requires `PRIV_EDIT_SYSTEM`).
- Lists users with detailed information including:
  - ID, username, display name, student ID, school
  - Email, role, privilege value
  - Registration time, last login time, last login IP
- **Enhanced search functionality**:
  - Search by username, email, or user ID
  - Sort by various fields (ID, username, display name, student ID, school, email, registration time, last login time, role, privilege, last login IP)
  - Both ascending and descending sort order
- **Advanced user management**:
  - View user details
  - Edit user information (home page, permissions)
  - Change user passwords
  - View user permissions across all domains
- Pagination support (20 users per page)
- Responsive design with consistent UI

## Usage tips

### User list view
- **Search**: Enter keywords in the search box to filter users by username, email, or user ID.
- **Sort**: Select a field from the "Sort by" dropdown to sort users.
- **Order**: Choose ascending or descending order from the "Sort order" dropdown.
- **Navigation**: Use the pagination controls at the bottom to navigate between pages.
- **View details**: Click on a username to view detailed information about a user.

### User detail view
- **View information**: See comprehensive details about a specific user.
- **Edit profile**: Update user information including home page and permissions.
- **Change password**: Set a new password for the user.
- **Domain permissions**: Click on the "Domain Permissions" link to view the user's permissions across all domains.

### Domain permissions view
- **Domain list**: See all domains the user has access to.
- **Permission details**: View the user's role and permission level in each domain.

## Configuration

The plugin supports the following configuration options:

- `enabled`: Boolean, default `true` - Whether the plugin is enabled.
- `adminOnly`: Boolean, default `true` - Whether only administrators can access the user management page.

## Development notes

### Architecture
- **Frontend**: Uses Hydro's template system with `user_management.html` for rendering all views.
- **Backend**: Implements three Handler classes for different views:
  - `UserListHandler`: Handles the main user list view with search and pagination.
  - `UserDetailHandler`: Handles the user detail view for editing user information.
  - `UserDomainsHandler`: Handles the domain permissions view.
- **API**: Provides RESTful API endpoints for client-side interactions.

### Key files
- `index.ts`: Main plugin logic, Handler classes, and API endpoints.
- `templates/user_management.html`: Template file for all user management views.
- `package.json`: Plugin configuration and dependencies.

### API endpoints

The plugin exposes the following API endpoints:

- `GET /api/manage/users`: Get list of users with search and pagination support.
- `GET /api/manage/users/:uid`: Get detailed information about a specific user.
- `POST /api/manage/users/:uid/update`: Update user information.
- `POST /api/manage/users/:uid/change-password`: Change user password.
- `GET /api/manage/users/:uid/domains`: Get user permissions across all domains.

## Changelog

### v1.0.0
- Complete rewrite with proper Handler classes
- Enhanced search functionality with multiple sort options
- Added user detail view for editing user information
- Added domain permissions view
- Updated routing from `/admin/users` to `/manage/users`
- Improved performance with parallel database queries
- Enhanced security with parameter validation

### v0.1.0
- Initial release with basic user list functionality
- Simple keyword search
- Basic pagination

## License

AGPL-3.0-or-later
