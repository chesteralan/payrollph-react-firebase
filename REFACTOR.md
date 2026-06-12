# Refactor Plan — Rules & Guidelines

## General Instructions

1. **Replace `any` types** — Use proper TypeScript types/interfaces instead of `any`. Add `// eslint-disable-next-line @typescript-eslint/no-explicit-any` only when absolutely necessary with a justification comment. Prefer `unknown` over `any` when the type is genuinely not known at definition time.

2. **Remove unused code** — Delete unused imports, variables, parameters, and functions. Prefix intentionally unused parameters with `_`. Run `yarn lint` before committing to catch unused declarations.

3. **Fix hook ordering** — Move async data-fetching functions (`const fetchX = async () => {...}`) above the `useEffect` that calls them so they are hoisted before use. This satisfies the `react-hooks/immutability` rule and prevents stale closures.

4. **Fix setState in effects** — Replace `useEffect` that calls `setState` synchronously with derived state via `useMemo`. When synchronous state initialization in an effect is unavoidable (e.g. reading from `localStorage`), add `/* eslint-disable react-hooks/set-state-in-effect */` with a brief comment explaining why.

5. **Add missing dependencies** — All variables and functions referenced inside `useEffect`, `useMemo`, and `useCallback` must appear in the dependency array. If adding a dependency causes infinite loops, restructure the logic to avoid stale closures rather than suppressing the lint rule.

6. **Move inline components** — Component definitions like `const StatusIcon = (props) => (...)` must be defined outside the parent component's render function to avoid re-creating them on every render and breaking React's reconciliation.

7. **Standardize error handling** — Use consistent try/catch patterns with `useToast` notifications. Replace `confirm()` dialogs with the shared `ConfirmDialog` component. Never swallow errors silently — always log them with `console.error` and show user feedback.

8. **Use proper imports** — Import `useRef`, `useMemo`, `useCallback`, `useState`, `useEffect` directly from React. Remove unused imports on save. Use path alias `@/` for project imports instead of relative paths.

9. **Fix empty blocks** — Remove empty `if`, `catch`, or `else` blocks. If a block intentionally does nothing, add a comment: `// no-op` or `// handled above`.

10. **Consolidate exports** — Files exporting both components and non-component utilities (hooks, constants, types) should be split to satisfy `react-refresh/only-export-components`. Move hooks to `*.hooks.ts`, constants to `*.constants.ts`, types to `*.types.ts`.

11. **Abstract large components** — If a component exceeds ~200–300 lines or handles multiple responsibilities, split it:
    - Container (data fetching + state)
    - Presentational (rendering)
    - Sub-components (extracted UI blocks)

12. **Extract reusable UI** — Repeated JSX blocks appearing 2+ times must be extracted into a shared component. Do not duplicate markup — create a component with props for variability.

13. **Move business logic to hooks** — Complex state management, Firestore queries, filtering, and side effects should be moved into custom hooks (`useXyz`). Leave components focused on rendering and event handlers only.

14. **Separate concerns by file type** — As component complexity grows, organize into:
    - `Component.tsx` — Main component
    - `Component.types.ts` — TypeScript interfaces
    - `Component.hooks.ts` — Related custom hooks
    - `Component.utils.ts` — Pure helper functions
    - `Component.constants.ts` — Static data and config

15. **Avoid deeply nested JSX** — Extract nested conditional rendering or large render blocks into named sub-components or render functions. Max nesting depth: 3 levels of JSX.

16. **Reduce prop drilling** — If props pass through 3+ intermediate components without being used, introduce context, composition (children/slots), or a dedicated data hook instead.

17. **Keep components single-purpose** — Each component should have one clear responsibility. If a component handles multiple unrelated UI behaviors, split it into separate components.

18. **Extract static configuration** — Move static arrays, table column definitions, menu configs, enum-like objects, and mapping tables outside component bodies to module-level constants.

19. **Memoize expensive calculations** — Use `useMemo` for derived data from large arrays or complex computations. Use `useCallback` for event handlers passed to child components. Profile first — don't memoize prematurely.

20. **Prefer composition over condition-heavy components** — Instead of a single component with many boolean props (`variant`, `size`, `isLoading`, `hasError`), create smaller composable variants or use a compound component pattern.

21. **Create shared primitives** — Promote repeated UI patterns (buttons, cards, modals, loaders, empty states, form sections, table cells) into the `src/components/ui/` shared library with consistent prop interfaces.

22. **Limit component nesting depth** — Avoid components with excessive indentation or nested ternary expressions. Refactor deeply nested conditionals into guard clauses, early returns, or extracted sub-components.

23. **Extract table/list row items** — Large `.map()` render blocks should become dedicated row/item components with their own props interface, tests, and (if complex) hooks.

24. **Move utility functions outside components** — Pure helper functions (formatting, validation, transformation) must be defined at module level, not inside component render functions, to avoid re-creation on every render.

25. **Co-locate related tests** — When refactoring components, also update or create:
    - `Component.test.tsx` — Unit/component tests
    - `Component.test.ts` — Hook/utility tests
    - `Component.spec.ts` — Integration/E2E test stubs if applicable
