# Coding & Migration Patterns
- **Database**: Mongoose schemas under `server/models/`. Indexes are set on frequently queried/searched fields (e.g., `phone`, `email`, `fullName` text search).
- **Migration**: Reading Firebase configurations dynamically from the specified external directory.
- **Upload Pattern**: Files from Firebase Storage are downloaded (via URL fetch or Firebase SDK) and uploaded to Cloudinary, then the URLs are mapped and saved in MongoDB.
- **Notifications**: Do not use browser `alert()`. Use the custom Toast hook:
  ```typescript
  import { useToast } from '../../hooks/useToast';
  const { toast } = useToast();
  toast.success("Message");
  toast.error("Message");
  toast.warning("Message");
  toast.info("Message");
  ```
  Ensure `ToastProvider` is placed at the top level and `ToastContainer` is rendered.

- **Form Validation**: Always perform matching checks (such as password confirmation) on the frontend first before sending requests to the backend, in order to avoid unnecessary network requests and ensure prompt user feedback. Toggling password/confirm password visibility should be independent.

- **Logging & Security**: All HTTP requests should be logged. For any non-GET requests, request bodies should be logged under `debug` level. However, to prevent data leak, any sensitive properties (such as password, tokens, credentials, secrets) must be masked recursively before printing/writing to files.

- **Configuration & Validation**: LocalStorage is used to synchronize UI settings (like form field required configuration) across independent views (Settings page, Add Student modal, Edit Student modal). Validation triggers should dynamically inspect the configuration instead of hardcoding HTML standard attributes like `required` to allow fully customized validation errors.

- **Clean Architecture & Decoupling**: Obsolete configurations, scripts, and package dependencies of migrated platforms (e.g., Firebase) should be fully purged from the codebase. This keeps dependencies minimal, prevents security audit warnings (e.g. from unused packages), and ensures that all entry points and files focus exclusively on active systems (e.g. MongoDB and Cloudinary).

