---
trigger: glob
globs: 'apps/web/**/*, packages/ui/**/*'
description: 'Frontend UX, Tailwind/shadcn components, TanStack Query, Zustand, and responsive design guidelines.'
---

# Rule: Frontend and UX

- Mobile-first, responsive, accessible semantic HTML; keyboard navigation and focus visibility.
- Use shadcn/ui components and Tailwind tokens consistently; avoid random styling patterns.
- Provide loading, empty, error, success, and offline/retry states.
- Show autosave and submission states accurately; never imply persistence before confirmation.
- Use TanStack Query for server state; Zustand only for limited local/shared UI state.
- Validate forms client-side for usability and server-side for security.
- Keep question renderers extensible via type-specific components and shared contracts.
- Do not preload private grading information in student-facing pages.
