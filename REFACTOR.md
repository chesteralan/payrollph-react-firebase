# Refactor Plan

This document tracks files that need refactoring in the Payroll v2 React/Firebase application. Each file should be reviewed and refactored according to the guidelines below.

## General Instructions

1. **Replace `any` types** — Use proper TypeScript types/interfaces instead of `any`. Add `// eslint-disable-next-line @typescript-eslint/no-explicit-any` only when absolutely necessary with a justification comment.

2. **Remove unused code** — Delete unused imports, variables, parameters, and functions. Prefix intentionally unused parameters with `_`.

3. **Fix hook ordering** — Move `const fetchX = async () => {...}` functions above the `useEffect` that calls them to satisfy `react-hooks/immutability`.

4. **Fix setState in effects** — Replace `useEffect` that calls `setState` synchronously with derived state via `useMemo`, or add eslint-disable with a comment explaining why it's intentional.

5. **Add missing dependencies** — Include all referenced variables/functions in `useEffect`/`useMemo`/`useCallback` dependency arrays, or restructure to avoid stale closures.

6. **Move inline components** — Component definitions (e.g. `const StatusIcon = (...) => (...)`) must be outside the parent component's render function.

7. **Standardize error handling** — Use consistent try/catch patterns with toast notifications. Remove `confirm()` dialogs; use the `ConfirmDialog` component instead.

8. **Use proper imports** — Import `useRef`, `useMemo`, `useCallback` from React where used. Remove unused imports.

9. **Fix empty blocks** — Remove empty `if`/`catch` blocks or add meaningful content/comments.

10. **Consolidate exports** — Move non-component exports to separate files to satisfy `react-refresh/only-export-components`.

11. **Abstract large components** — If a component exceeds ~200–300 lines or handles multiple responsibilities, split it into smaller presentational and container components.

12. **Extract reusable UI** — Repeated JSX blocks should be extracted into reusable components instead of duplicated inline.

13. **Move business logic to hooks** — Complex state management, data fetching, filtering, or side effects should be moved into custom hooks (`useXyz`) to keep components focused on rendering.

14. **Separate concerns by file type** — Prefer organizing code into:
    - `Component.tsx`
    - `Component.types.ts`
    - `Component.hooks.ts`
    - `Component.utils.ts`
    - `Component.constants.ts`
    
    when complexity increases.

15. **Avoid deeply nested JSX** — Extract nested conditional rendering or large render blocks into smaller components or helper render functions.

16. **Reduce prop drilling** — If props are passed through multiple layers unnecessarily, introduce context, composition, or local abstraction.

17. **Keep components single-purpose** — A component should ideally have one clear responsibility. Split components handling unrelated UI behaviors.

18. **Extract static configuration** — Move static arrays, mappings, table columns, menu configs, and constants outside component bodies.

19. **Memoize expensive calculations** — Use `useMemo` for expensive derived values and `useCallback` for stable callbacks passed to children.

20. **Prefer composition over condition-heavy components** — Instead of large components with many boolean flags, create smaller composable variants.

21. **Create shared primitives** — Promote repeated patterns (buttons, cards, modals, loaders, empty states, form sections) into shared UI primitives.

22. **Limit component nesting depth** — Avoid components with excessive indentation or nested ternaries. Refactor into readable subcomponents.

23. **Extract table/list row items** — Large `.map()` render blocks should become dedicated row/item components.

24. **Move utility functions outside components** — Pure helper functions should not be recreated on every render.

25. **Co-locate related tests and stories** — When refactoring components, also update or create:
    - `Component.test.tsx`
    - `Component.stories.tsx`
