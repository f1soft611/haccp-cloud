# Approval Comment Edit/Delete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to edit and soft-delete manually written approval comments while keeping system comments read-only and never deletable.

**Architecture:** Store approval comments in the existing electronic approval history table and expose explicit update/delete endpoints for user-authored comments. The backend enforces ownership and system-comment restrictions; the frontend only shows edit/delete actions for non-system comments authored by the current user and renders deleted comments as a tombstone message.

**Tech Stack:** Spring MVC, MyBatis mapper XML, React 19, MUI, React Query, Vitest, JUnit 5, Mockito

---

### Task 1: Lock down the comment contract in tests

**Files:**

- Create: `frontend/src/test/approval-draft-comment-thread.test.tsx`
- Create: `frontend/src/test/haccp-base-work-service-comments.test.ts`
- Modify: `backend/src/test/java/egovframework/let/documents/haccpwork/service/impl/HaccpWorkFlowServiceImplTest.java`

- [ ] **Step 1: Write the failing frontend test**

```tsx
it('shows edit/delete only for the current user manual comment and hides actions for system comments', () => {
  // render thread with one system comment and one owned manual comment
  // expect edit/delete buttons only on the manual comment
});
```

- [ ] **Step 2: Write the failing frontend service test**

```ts
it('calls the approval comment update and delete endpoints', async () => {
  // mock apiClient.patch/delete and verify request payloads and paths
});
```

- [ ] **Step 3: Write the failing backend service test**

```java
@Test
void updateApprovalComment_rejectsSystemComment() {
    // arrange DAO to return SYSTEM and assert BAD_REQUEST
}
```

- [ ] **Step 4: Run the focused tests and confirm they fail for the missing behavior**

Run:
`cd frontend && npm test -- approval-draft-comment-thread.test.tsx haccp-base-work-service-comments.test.ts`
`cd backend && mvn -Dtest=HaccpWorkFlowServiceImplTest test`

- [ ] **Step 5: Commit the test-only baseline**

```bash
git add frontend/src/test/approval-draft-comment-thread.test.tsx frontend/src/test/haccp-base-work-service-comments.test.ts backend/src/test/java/egovframework/let/documents/haccpwork/service/impl/HaccpWorkFlowServiceImplTest.java
git commit -m "test: cover approval comment edit delete contract"
```

### Task 2: Add backend comment edit/delete operations

**Files:**

- Modify: `backend/src/main/java/egovframework/let/documents/haccpwork/service/HaccpWorkFlowService.java`
- Modify: `backend/src/main/java/egovframework/let/documents/haccpwork/service/impl/HaccpWorkFlowServiceImpl.java`
- Modify: `backend/src/main/java/egovframework/let/documents/haccpwork/controller/HaccpWorkApiController.java`
- Modify: `backend/src/main/java/egovframework/let/documents/haccpwork/domain/repository/HaccpWorkDAO.java`
- Modify: `backend/src/main/resources/egovframework/mapper/let/documents/haccpwork/HaccpWorkMapper_SQL_postgresql.xml`
- Modify: `backend/src/main/java/egovframework/let/documents/haccpwork/domain/model/HaccpWorkApprovalCommentCreateRequestVO.java`
- Create: `backend/src/main/java/egovframework/let/documents/haccpwork/domain/model/HaccpWorkApprovalCommentUpdateRequestVO.java`

- [ ] **Step 1: Add service methods and request model**
- [ ] **Step 2: Add mapper update statements for manual comment edit and soft delete**
- [ ] **Step 3: Add controller endpoints for PATCH and DELETE**
- [ ] **Step 4: Implement ownership/system/deleted checks in the service**
- [ ] **Step 5: Run backend tests until green**

### Task 3: Add frontend comment actions and tombstone rendering

**Files:**

- Modify: `frontend/src/services/documents/haccpBaseWorkService.ts`
- Modify: `frontend/src/pages/documents/approvals/types.ts`
- Modify: `frontend/src/pages/documents/approvals/hooks/useApprovalDraftComments.ts`
- Modify: `frontend/src/pages/documents/approvals/components/ApprovalDraftCommentThread.tsx`
- Modify: `frontend/src/pages/documents/approvals/components/ApprovalDraftContent.tsx`
- Modify: `frontend/src/pages/documents/approvals/ApprovalDraftWritePage.tsx`

- [ ] **Step 1: Add frontend API helpers for update/delete comment**
- [ ] **Step 2: Extend comment types with ownership and deletion state**
- [ ] **Step 3: Wire edit/delete handlers through the hook and page**
- [ ] **Step 4: Render edit/delete buttons only for editable manual comments**
- [ ] **Step 5: Render the deleted-comment tombstone text**
- [ ] **Step 6: Run frontend tests and lint until green**

### Task 4: Final verification

**Files:**

- None

- [ ] **Step 1: Run the targeted frontend and backend test suites**
- [ ] **Step 2: Inspect the diff for the final change set**
- [ ] **Step 3: Summarize any residual limitations**
