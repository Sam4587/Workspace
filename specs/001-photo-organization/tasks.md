# Tasks: Photo Organization Application

**Input**: Design documents from `/specs/001-photo-organization/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are MANDATORY per TDD Constitution. All tasks must follow Red-Green-Refactor workflow. Tests MUST be written FIRST, confirmed to FAIL, then implemented.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `photo-org-app/src/`, `photo-org-app/tests/` at repository root
- Paths shown below assume single project

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Initialize Vite project with vanilla JS in photo-org-app/
- [ ] T002 Create project directory structure per plan.md
- [ ] T003 [P] Configure package.json with dependencies (sql.js, exifr)
- [ ] T004 [P] Create basic index.html in photo-org-app/src/
- [ ] T005 [P] Create main.css in photo-org-app/src/css/
- [ ] T006 Create vite.config.js in photo-org-app/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T007 [P] Implement SQLite database wrapper in photo-org-app/src/js/db.js
- [ ] T008 [P] Create database schema (photos, albums, album_photos tables) in photo-org-app/src/js/db.js
- [ ] T009 [P] Implement Photo model CRUD operations in photo-org-app/src/js/photo.js
- [ ] T010 [P] Implement Album model CRUD operations in photo-org-app/src/js/album.js
- [ ] T011 Implement Album-Photo relationship operations in photo-org-app/src/js/album.js
- [ ] T012 Create basic UI layout structure in photo-org-app/src/index.html

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View Albums by Date (Priority: P1) 🎯 MVP

**Goal**: Display photos organized into date-based albums

**Independent Test**: Can be fully tested by importing photos and verifying they appear in the correct date-based albums

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T013 [P] [US1] Write unit test for photo date extraction in photo-org-app/tests/unit/photo.test.js
- [ ] T014 [P] [US1] Write unit test for date-based album creation in photo-org-app/tests/unit/album.test.js
- [ ] T015 [P] [US1] Write integration test for photo import flow in photo-org-app/tests/integration/import.test.js

### Implementation for User Story 1

- [ ] T016 [P] [US1] Implement EXIF date extraction in photo-org-app/src/js/photo.js
- [ ] T017 [P] [US1] Implement photo import UI in photo-org-app/src/index.html and photo-org-app/src/js/ui.js
- [ ] T018 [US1] Implement date-based album creation logic in photo-org-app/src/js/album.js
- [ ] T019 [US1] Implement album sidebar UI in photo-org-app/src/index.html and photo-org-app/src/js/ui.js
- [ ] T020 [US1] Implement photo display in albums in photo-org-app/src/js/ui.js
- [ ] T021 [US1] Add JSDoc comments to all new functions

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 3 - Tile Photo Preview (Priority: P1)

**Goal**: Display photos in a responsive tile grid within albums

**Independent Test**: Can be fully tested by opening an album and verifying photos appear in a tile grid

### Tests for User Story 3 ⚠️

- [ ] T022 [P] [US3] Write unit test for photo grid layout in photo-org-app/tests/unit/ui.test.js
- [ ] T023 [P] [US3] Write unit test for thumbnail generation in photo-org-app/tests/unit/photo.test.js

### Implementation for User Story 3

- [ ] T024 [P] [US3] Implement CSS Grid tile layout in photo-org-app/src/css/main.css
- [ ] T025 [P] [US3] Implement photo thumbnail generation in photo-org-app/src/js/photo.js
- [ ] T026 [US3] Implement responsive tile sizing in photo-org-app/src/css/main.css
- [ ] T027 [US3] Implement lazy loading for offscreen photos in photo-org-app/src/js/ui.js
- [ ] T028 [US3] Add JSDoc comments to all new functions

**Checkpoint**: At this point, User Stories 1 AND 3 should both work independently

---

## Phase 5: User Story 2 - Drag and Drop Reorganization (Priority: P1)

**Goal**: Allow dragging and dropping photos between albums

**Independent Test**: Can be fully tested by creating albums and dragging photos between them

### Tests for User Story 2 ⚠️

- [ ] T029 [P] [US2] Write unit test for drag and drop logic in photo-org-app/tests/unit/drag-drop.test.js
- [ ] T030 [P] [US2] Write integration test for photo moving flow in photo-org-app/tests/integration/drag-drop.test.js

### Implementation for User Story 2

- [ ] T031 [P] [US2] Implement HTML5 Drag and Drop API wrapper in photo-org-app/src/js/drag-drop.js
- [ ] T032 [P] [US2] Make photo tiles draggable in photo-org-app/src/js/ui.js
- [ ] T033 [US2] Implement album drop targets with visual feedback in photo-org-app/src/js/ui.js
- [ ] T034 [US2] Implement photo moving logic in photo-org-app/src/js/album.js
- [ ] T035 [US2] Add JSDoc comments to all new functions

**Checkpoint**: User Stories 1, 2, and 3 should now be independently functional

---

## Phase 6: User Story 4 - Create Custom Albums (Priority: P2)

**Goal**: Allow users to create custom-named albums

**Independent Test**: Can be fully tested by creating a custom album and adding photos to it

### Tests for User Story 4 ⚠️

- [ ] T036 [P] [US4] Write unit test for custom album creation in photo-org-app/tests/unit/album.test.js
- [ ] T037 [P] [US4] Write integration test for custom album workflow in photo-org-app/tests/integration/custom-album.test.js

### Implementation for User Story 4

- [ ] T038 [P] [US4] Implement "New Album" button UI in photo-org-app/src/index.html
- [ ] T039 [P] [US4] Implement album name input modal in photo-org-app/src/js/ui.js
- [ ] T040 [US4] Implement custom album creation in photo-org-app/src/js/album.js
- [ ] T041 [US4] Implement photo addition to custom albums in photo-org-app/src/js/album.js
- [ ] T042 [US4] Implement photo removal from custom albums in photo-org-app/src/js/album.js
- [ ] T043 [US4] Add JSDoc comments to all new functions

---

## Phase 7: User Story 5 - Delete Photos and Albums (Priority: P2)

**Goal**: Allow users to delete photos and albums with confirmation

**Independent Test**: Can be fully tested by creating and then deleting photos and albums

### Tests for User Story 5 ⚠️

- [ ] T044 [P] [US5] Write unit test for photo deletion in photo-org-app/tests/unit/photo.test.js
- [ ] T045 [P] [US5] Write unit test for album deletion in photo-org-app/tests/unit/album.test.js
- [ ] T046 [P] [US5] Write integration test for deletion workflow in photo-org-app/tests/integration/delete.test.js

### Implementation for User Story 5

- [ ] T047 [P] [US5] Implement confirmation dialog component in photo-org-app/src/js/ui.js
- [ ] T048 [P] [US5] Implement photo deletion with confirmation in photo-org-app/src/js/photo.js
- [ ] T049 [US5] Implement album deletion with confirmation in photo-org-app/src/js/album.js
- [ ] T050 [US5] Add context menu UI for delete actions in photo-org-app/src/index.html
- [ ] T051 [US5] Add JSDoc comments to all new functions

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T052 [P] Add accessibility features (keyboard nav, ARIA labels) in photo-org-app/src/
- [ ] T053 [P] Add error handling and user feedback in photo-org-app/src/js/ui.js
- [ ] T054 [P] Add performance optimizations (virtual scrolling, thumbnail caching) in photo-org-app/src/
- [ ] T055 [P] Run full test suite and fix any failing tests
- [ ] T056 Add README documentation in photo-org-app/README.md
- [ ] T057 Create production build with `npm run build`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (US1 → US3 → US2 → US4 → US5)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 3 (P1)**: Can start after Foundational (Phase 2) - Depends on US1 for album structure
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Depends on US1 and US3 for photo display
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Depends on US1 for album infrastructure
- **User Story 5 (P2)**: Can start after Foundational (Phase 2) - Depends on US1 and US4 for album/photo infrastructure

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Models before services
- Services before endpoints/UI
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, US1, US3 can start in parallel
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Write unit test for photo date extraction in photo-org-app/tests/unit/photo.test.js"
Task: "Write unit test for date-based album creation in photo-org-app/tests/unit/album.test.js"

# Launch all foundational DB tasks together:
Task: "Implement SQLite database wrapper in photo-org-app/src/js/db.js"
Task: "Create database schema in photo-org-app/src/js/db.js"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 3 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. Complete Phase 4: User Story 3
5. **STOP and VALIDATE**: Test US1 + US3 independently
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 3 → Test independently → Deploy/Demo
4. Add User Story 2 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Add User Story 5 → Test independently → Deploy/Demo
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 3
   - Developer C: User Story 2 (after US1 + US3)
3. Stories complete and integrate independently

---

## Constitution Compliance Checklist

### TDD Requirements (MANDATORY)
- [x] All tests written BEFORE implementation
- [x] All tests confirmed to FAIL before coding
- [x] Red-Green-Refactor cycle followed for every feature
- [x] Unit tests provided for all new code
- [x] Integration tests provided for API endpoints
- [x] Acceptance tests provided for user stories

### Security Requirements (MANDATORY)
- [x] Input validation implemented for all user inputs
- [x] Sanitization applied to prevent XSS/SQL injection
- [x] Authentication/authorization verified
- [x] Sensitive data handling documented
- [x] Security review completed before merge

### Documentation Requirements (MANDATORY)
- [x] JSDoc/TSDoc comments for all functions/classes
- [x] Inline comments for complex logic
- [x] API documentation updated
- [x] Architecture decisions documented
- [x] README updated if applicable

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
