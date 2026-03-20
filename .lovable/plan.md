

## Replace Email Templates Manager with Live Orchestrator Previewer

### Problem
The current Trunkline Email Templates Manager reads from the `email_templates` database table, which is stale — it has old emoji-laden subject lines and HTML that doesn't match what actually gets sent. The live system is the inline `getEmailTemplate()` in the orchestrator edge function. The DB table and its CRUD UI are dead weight.

### Plan

**1. Add a `preview` mode to the orchestrator edge function**
Add a check at the top of the handler: if the request body includes `preview: true`, render the template with the provided sample data and return `{ html, subject }` without sending via Resend. This lets Trunkline fetch a live render of any template.

**2. Replace `EmailTemplatesManager` with a live previewer**
Rebuild the component to:
- Show a dropdown of all event types (the ~20 types from `getEmailTemplate`)
- Pre-fill sample data per event type (order number, customer name, items, etc.)
- Call the orchestrator with `preview: true` to get rendered HTML
- Display in an iframe with desktop/mobile toggle
- Show the rendered subject line above the preview
- Keep the "Send Test" button that sends a real email to a specified address

**3. Update `EmailPreviewModal` to use live rendering**
Instead of substituting `{{variables}}` in stored HTML, it calls the orchestrator preview endpoint and renders the actual output.

**4. Remove stale DB-dependent components**
- Remove `EmailTemplateEditor` (was for editing DB templates)
- Remove the `email_templates` / `email_template_variables` table CRUD logic
- The DB tables themselves can stay (no migration needed) but the UI no longer reads from them

**5. Deploy the updated orchestrator**

### Event types and sample data
Each event type gets a hardcoded sample data object in the frontend, e.g.:
- `order_confirmation`: `{ customer_name: "Sarah", order_number: "ORD-A1B2C3", items: [...], total_amount: 89.99 }`
- `welcome_email`: `{ first_name: "Sarah" }`
- `auto_gift_approval`: `{ recipient_name: "Mom", occasion: "birthday", product_title: "Silk Scarf", ... }`
- etc.

### Files affected
- **Edit**: `supabase/functions/ecommerce-email-orchestrator/index.ts` — add preview mode (~10 lines)
- **Rewrite**: `src/components/trunkline/communications/EmailTemplatesManager.tsx` — live previewer
- **Rewrite**: `src/components/trunkline/communications/EmailPreviewModal.tsx` — iframe-based live render
- **Delete**: `src/components/trunkline/communications/EmailTemplateEditor.tsx` — no longer needed
- **Keep**: `TestEmailModal.tsx` — still useful for sending real test emails
- **Deploy**: `ecommerce-email-orchestrator`

### What stays
- `TestEmailModal` for sending actual test emails
- `EmailAnalyticsDashboard` (reads from `email_send_log`, unrelated)
- All orchestrator sending logic unchanged

