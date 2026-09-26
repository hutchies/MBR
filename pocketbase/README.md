# PocketBase schema

The app talks to the PocketBase instance configured in `src/lib/pb.js`.

`pb_migrations/` holds schema changes the front end depends on. Copy the files
into the server's `pb_migrations` directory and restart PocketBase (or run
`./pocketbase migrate up`) to apply them. They use the PocketBase 0.23+
migration API.

| Migration | Adds |
|---|---|
| `1790000000_create_suggestions.js` | `suggestions` collection used by the public `/suggest` form and the admin suggestions queue. Anyone can create a suggestion (status must be `new`); only `mbr_users` can list, update or delete. |
