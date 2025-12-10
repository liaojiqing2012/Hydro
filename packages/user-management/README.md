# @hydrooj/user-management

A Hydro plugin that adds a control panel page for browsing and auditing user accounts. It surfaces a searchable table of users and basic metadata so administrators can quickly review accounts without leaving the admin shell.

## Features
- Adds a "User Management" entry to the admin Control Panel (requires `PRIV_EDIT_SYSTEM`).
- Lists users with ID, username, email, role, privilege value, registration time, and last login time.
- Supports keyword filtering against usernames and email addresses.
- Provides pagination (20 users per page) with consistent PJAX/full-page rendering.

## Usage
1. Install or enable the plugin in your Hydro instance.
2. Visit `/manage/users` (or the "User Management" link in the Control Panel) while signed in with sufficient privileges.
3. Use the keyword search box to filter by username or email; navigate pages with the built-in controls.

## Development notes
- The page uses the shared `manage_base.html` layout and renders the full table, empty state, and pagination from `templates/user_management.html`.
- Backend logic lives in `index.ts`, which handles privilege checks, querying, and response payload for the template.
