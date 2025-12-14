# Complex Input / Tool Result Logic Analysis

## 1. Data Source & Trace
- **Source**: `src/model/selectors/projectTimeline.ts` -> `selectProjectTimeline`.
- **Flow**:
  1. `selectProjectTimeline` aggregates events from all sessions in a project.
  2. It iterates through events sorted chronologically.
  3. A new `ProjectTurn` is created whenever `event.message.role === 'user'`.
  4. The user message content is extracted via `getTextContent`.

## 2. Logic Conditions

### ToolOnly
Determined in `src/model/selectors/projectTimeline.ts`:
```typescript
const isToolResultOnly = !text; // text is empty string
```
If `text` is empty, the `userQuery` is set to `'(Complex Input/Tool Result Only)'`.
**Note**: In `ProjectTimelineHomePage.tsx`, if a turn's `userQuery` exactly matches this string, it is merged into the previous turn.

### Complex Input
Determined in `src/model/selectors/projectTimeline.ts`:
```typescript
const isComplex = text.length > 500 || text.includes('```');
```
Reasons for `complex`:
- **Length**: Input text > 500 characters.
- **Code**: Input text contains markdown code fences (` ``` `).

## 3. Title & Preview Generation
The `QueryBlockCard` displays `block.userQuery`. This string is constructed in `selectProjectTimeline`:

- **Case 1: Complex Input**
  ```typescript
  `(Complex Input: ~${text.length} chars)\n${text.slice(0, 200)}...`
  ```
  The "Title" seen in UI is the first line of this string. The "Preview" is the truncated text.

- **Case 2: ToolOnly**
  ```typescript
  '(Complex Input/Tool Result Only)'
  ```
  (Usually merged and hidden by UI layer, but if orphan, shows this).

- **Case 3: Normal**
  ```typescript
  text
  ```
  Shows the raw user text.

## 4. Template Handling
**Current State**: No special handling.
- There is logic in the *debug* code to detect templates (e.g., "This session is being continued"), but **no logic** in the main code path to strip them or alter the `isComplex` decision.
- **Result**: System-generated summaries (often long or containing code blocks) are treated as User inputs, triggering the `isComplex` logic and appearing as "Complex Input" cards.
