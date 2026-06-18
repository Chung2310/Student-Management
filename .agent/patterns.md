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
