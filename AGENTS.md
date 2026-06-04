# AGENTS.md

## High-value notes from recent sessions

### Local Windows dev setup
- Use `npm run setup` for first-time local setup on Windows. It creates `.env`, downloads `pocketbase.exe`, and installs dependencies.
- Run services in separate terminals:
  - `npm run pocketbase` (PocketBase on `http://localhost:8090`)
  - `npm run dev` (Vite on `http://localhost:3000`, or next available port if occupied)

### UI testing gotcha
- If `pocketbase/pb_data/data.db` has no `cards` / `search_text_fts` data, search-based UI tests will appear broken.
- Validate data presence before debugging filter logic.

### Project board / issue workflow
- Project board status can be updated with:
  - `gh project item-edit --id <item_id> --project-id <project_id> --field-id <status_field_id> --single-select-option-id <done_option_id>`
- `gh project item-edit` does **not** accept `--owner`.

### Git hygiene in this repo
- This worktree may contain unrelated local changes (seen during session in `pocketbase/CHANGELOG.md` and `pocketbase/pb_hooks/scan.pb.js`).
- Keep commits scoped; avoid staging unrelated files.
