## Roles Edit Modal Freeze – Root Cause and Fix

Date: 2025-08-30

### Affected areas
- src/components/administration/roles/
  - create-edit-modal.tsx
  - roles.tsx
  - roles-detail.tsx
  - data-table-row-actions.tsx
- src/components/ui/dialog.tsx

### Symptoms
- After closing the Roles Edit modal, the page becomes unclickable (appears “frozen”).
- Overlay seems to remain active. A full browser refresh restores normal behavior.

### How we reproduced it
- Open Roles list page and click row action “Edit”, then close modal using Cancel/Escape/X.
- Or open Roles detail page, click “Edit”, then close.

### Root cause
This was a combination of focus/overlay management issues when stacking Radix UI portals (DropdownMenu + Dialog) and the way the Dialog was controlled:

1) Dialog close handler was called on any onOpenChange (true/false)
- Using onOpenChange={() => onClose()} triggered closes on both open and close transitions, making state transitions racy and sometimes leaving the overlay/focus-trap in an inconsistent state.

2) Modal could be implicitly closed by outside interactions
- Without guarding onInteractOutside, the dialog might close during outside interaction while the app is mid state update.

3) Dynamic key remounting for CreateEditModal
- key={...} on CreateEditModal usages caused remounts during close/open. In rare sequences, Radix’s overlay portal could be orphaned and left blocking clicks.

4) Nested portal interaction with DropdownMenu
- Opening the Edit modal from within a DropdownMenu can cause focus conflicts if the dropdown hasn’t fully closed. Using a modal dropdown by default and auto-focus close behavior sometimes leaves focus/overlay states stuck.

5) Overlay pointer-events during closing animation
- During the closing animation, the overlay could still capture pointer events even after the modal began to close.

### Why Assets Edit worked
- The Assets modal prevents outside interactions, unmounts cleanly, coordinates dropdown close before opening a modal, and doesn’t rely on dynamic keys for remounts.

### Fix implemented
We aligned Roles components with the safer patterns used in Assets and added further defensive tweaks.

1) Roles CreateEditModal
- Only close when open becomes false.
- Prevent outside interactions and auto-focus on close.
- Make Dialog non-modal to avoid page-wide inert/aria-hidden behavior when stacking portals.
- Hard unmount the dialog when closed (if (!isOpen) return null) so overlays and traps cannot linger.

2) Remove dynamic key props on CreateEditModal usages
- Avoids remount-on-close race conditions that can orphan overlays.

3) Data table row actions
- Make DropdownMenu non-modal, prevent close auto-focus, and defer showing the Edit modal to next tick so the menu closes first.

4) Dialog overlay CSS
- When Dialog state=closed, set pointer-events: none to ensure an overlay in closing animation cannot block clicks.

### Code changes (high level)
- roles/create-edit-modal.tsx
  - onOpenChange={(open) => { if (!open) onClose(); }}
  - onInteractOutside={(e) => e.preventDefault()}
  - onCloseAutoFocus={(e) => e.preventDefault()}
  - modal={false} on Dialog
  - if (!isOpen) return null

- roles/roles.tsx, roles/roles-detail.tsx, roles/data-table-row-actions.tsx
  - Remove key={...} from <CreateEditModal ... />

- roles/data-table-row-actions.tsx
  - <DropdownMenu modal={false}>
  - <DropdownMenuContent onCloseAutoFocus={(e) => e.preventDefault()} sideOffset={5}>
  - setTimeout(() => setShowEdit(true), 0) // defer modal open after menu closes

- components/ui/dialog.tsx
  - Overlay class adds data-[state=closed]:pointer-events-none
  - Content class adds data-[state=closed]:pointer-events-none

### Minimal code excerpts

CreateEditModal: guard render + controlled onOpenChange
<small>
</small>

create-edit-modal.tsx

<assets_code_snippet_1>

Row actions: non-modal dropdown + deferred open

<data_table_row_actions_snippet>

Dialog overlay: pointer-events during closing

<dialog_overlay_snippet>

### Verification steps
- From Roles list page:
  - Open Edit via row action → Close via X → Page remains interactive
  - Open Edit via row action → Close via Cancel → Page remains interactive
  - Open Edit via row action → Press Escape → Page remains interactive
- From Roles detail page: repeat the above.
- Confirm you can click filters, rows, buttons immediately after closing.

### Preventative guidelines
- Use onOpenChange with the open boolean and only close on open === false.
- Prefer non-modal Dialogs when interacting with other Radix portals (DropdownMenu, Popover) or orchestrate strict open/close ordering.
- Prevent outside interactions for complex forms (onInteractOutside preventDefault) and consider preventing onCloseAutoFocus.
- Avoid dynamic keys that force remounts on modals; manage state explicitly.
- If opening a Dialog from a DropdownMenu, set dropdown modal={false} and consider a short defer (setTimeout 0) for opening the Dialog.
- Consider sheets or inline panels when a true modal is not necessary.

### Regression risks and watch-outs
- Non-modal dialog means background remains interactive. We already prevent outside interactions, but be mindful of keyboard navigation.
- If future code re-introduces dynamic keys on modals or changes dropdown/modal ordering, the issue can resurface.

### Quick checklist
- [ ] onOpenChange closes only on open=false
- [ ] onInteractOutside prevented when needed
- [ ] onCloseAutoFocus prevented when needed
- [ ] No dynamic key on modal usages
- [ ] DropdownMenu modal={false} when opening a Dialog from it
- [ ] Defer opening Dialog until DropdownMenu closes
- [ ] Overlay pointer-events safe during close

