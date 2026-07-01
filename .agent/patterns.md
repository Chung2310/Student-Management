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

- **Dynamic AI Model Routing**: When integrating third-party AI APIs like OpenRouter in systems, utilizing dynamic fallback router endpoints (e.g., `openrouter/free`) is preferred over pinning concrete free model IDs. This guards the service against deprecations or status changes in free model catalogs.

- **React State Optimization (Lazy Initialization)**: Avoid calling state mutations inside `useEffect` immediately on component mount. If the initial state depends on synchronous operations like `localStorage` parsing, utilize lazy initialization functions inside `useState` (e.g., `useState(() => { ... })`). This prevents unnecessary render cascades, optimizes paint performance, and resolves dependency warning issues under linter analysis.

- **Isolated Database Context Injection**: For AI Chatbots embedded in internal management dashboards, dynamically querying and serializing user-owned MongoDB records (scoped by `ownerId` from the JWT token) directly into the System Prompt context ensures 100% accurate responses and maintains absolute multi-user data isolation.

- **AI Integration Consolidation**: When consolidating multiple AI engines to a single high-performance model (e.g. Google Gemini 2.5), using the unified OpenAI compatibility schema for payloads (containing messages array, role headers) simplifies routing and makes it effortless to remove external vendor wrappers (like OpenRouter or PiAPI). This reduces technical debt, reduces environmental dependencies, and ensures high availability and cost stability.

- **SPA Caching Prevention & Chunk Load Self-Healing**: To prevent White Screen of Death (WSOD) issues during application updates:
  1. Always set `Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate` for `index.html` on the server-side to guarantee the client fetches the latest entrypoint.
  2. Map the static asset wildcard routing to return a `404` for missing static files (e.g. JS/CSS files inside `/assets/`) instead of falling back to returning the HTML contents of `index.html`. This avoids parsing errors like `Uncaught SyntaxError: Unexpected token '<'`.
  3. Implement global self-healing listeners (`window.addEventListener("error")`, `window.addEventListener("unhandledrejection")`, and React `componentDidCatch`) that detect `ChunkLoadError` or related script failure messages, and automatically reload the page (guarded with a `sessionStorage` throttle to avoid infinite reload loops).

- **OpenRouter API Adaptation**: When routing requests to OpenRouter, ensure standard header formatting is applied (including `Authorization: Bearer <key>`) alongside diagnostic headers (`HTTP-Referer` and `X-Title`). Ensure error logs specify the model broker (OpenRouter) instead of the underlying model provider to facilitate cleaner debugging context.

- **Safe Configuration Checks**: When validating optional service integrations (such as SMTP, SMS, or banking gateways) during automated checks or initialization, missing setup/keys must be logged as warnings (`logger.warn`) instead of errors (`logger.error`). This prevents trace pollution and false positives in application monitoring systems under default settings.
