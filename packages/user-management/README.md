# @hydrooj/user-management

A Hydro plugin that adds a control panel page for comprehensive user management. It provides administrators with tools to view, edit, and manage user accounts and their permissions across domains.

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

## Usage

### Installation

1. Ensure the plugin is installed in your Hydro instance.
2. The plugin is enabled by default, but you can configure it in your Hydro settings.

### Accessing User Management

1. Sign in to Hydro with an account that has `PRIV_EDIT_SYSTEM` privileges.
2. Navigate to the **Control Panel** (`/manage`).
3. Click on the **User Management** link in the sidebar menu.
4. Alternatively, you can directly access the user management page at `/manage/users`.

### Using the User Management Interface

#### User List View
- **Search**: Enter keywords in the search box to filter users by username, email, or user ID.
- **Sort**: Select a field from the "Sort by" dropdown to sort users.
- **Order**: Choose ascending or descending order from the "Sort order" dropdown.
- **Navigation**: Use the pagination controls at the bottom to navigate between pages.
- **View Details**: Click on a username to view detailed information about a user.

#### User Detail View
- **View Information**: See comprehensive details about a specific user.
- **Edit Profile**: Update user information including home page and permissions.
- **Change Password**: Set a new password for the user.
- **Domain Permissions**: Click on the "Domain Permissions" link to view the user's permissions across all domains.

#### Domain Permissions View
- **Domain List**: See all domains the user has access to.
- **Permission Details**: View the user's role and permission level in each domain.

## Configuration

The plugin supports the following configuration options:

- `enabled`: Boolean, default `true` - Whether the plugin is enabled.
- `adminOnly`: Boolean, default `true` - Whether only administrators can access the user management page.

## Development Notes

### Architecture
- **Frontend**: Uses Hydro's template system with `user_management.html` for rendering all views.
- **Backend**: Implements three Handler classes for different views:
  - `UserListHandler`: Handles the main user list view with search and pagination.
  - `UserDetailHandler`: Handles the user detail view for editing user information.
  - `UserDomainsHandler`: Handles the domain permissions view.
- **API**: Provides RESTful API endpoints for client-side interactions.

### Key Files
- `index.ts`: Main plugin logic, Handler classes, and API endpoints.
- `templates/user_management.html`: Template file for all user management views.
- `package.json`: Plugin configuration and dependencies.

### API Endpoints

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
