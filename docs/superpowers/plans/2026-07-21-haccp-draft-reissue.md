# HACCP Draft Reissue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow final-owner confirmation on rejected HACCP drafts, support re-submission as a new approval with a fresh draft number, and tighten document list visibility and participant filtering.

**Architecture:** Keep the approval lifecycle changes in `HaccpWorkFlowServiceImpl` and the document-list visibility rules in `HaccpWorkDraftServiceImpl` plus the PostgreSQL mapper. On the frontend, extend the approval draft hook and document-management filter state so the UI labels, disabled states, and multi-select search match the backend behavior.

**Tech Stack:** Spring Boot, MyBatis, PostgreSQL, React, TypeScript, MUI.

---

### Task 1: Backend approval state and reissue rules

**Files:**

- Modify: `backend/src/main/java/egovframework/let/documents/haccpwork/domain/model/HaccpWorkVO.java`
- Modify: `backend/src/main/resources/egovframework/mapper/let/documents/haccpwork/HaccpWorkMapper_SQL_postgresql.xml`
- Modify: `backend/src/main/java/egovframework/let/documents/haccpwork/service/impl/HaccpWorkFlowServiceImpl.java`

- [ ] **Step 1: Update the draft-template query to expose final-owner confirmation state**

```sql
CASE
  WHEN EXISTS (
    SELECT 1
    FROM tb_electronic_approval_line_info turn_line
    WHERE turn_line.tenant_id = m.tenant_id
      AND turn_line.electronic_approval_id = m.electronic_approval_id
      AND turn_line.login_id = #{actorLoginId, jdbcType=BIGINT}
      AND COALESCE(turn_line.last_owner_status, '') = 'Y'
  ) THEN TRUE
  ELSE FALSE
END AS last_owner_status
```

- [ ] **Step 2: Allow rejected documents to become writable again only after final-owner confirmation**

```sql
CASE
  WHEN #{actorLoginId, jdbcType=BIGINT} IS NOT NULL
   AND m.login_id = #{actorLoginId, jdbcType=BIGINT}
   AND COALESCE(m.status_type, '') = 'pre_apply' THEN TRUE
  WHEN #{actorLoginId, jdbcType=BIGINT} IS NOT NULL
   AND m.login_id = #{actorLoginId, jdbcType=BIGINT}
   AND COALESCE(m.status_type, '') = 'rejected'
   AND COALESCE(cancel_perm.final_owner_confirmed_flag, 0) = 1 THEN TRUE
  ELSE FALSE
END AS can_submit
```

- [ ] **Step 3: Change the reference-confirm event message when the current line is the final owner**

```java
String lineOption = "참조확인";
String systemAction = "reference_confirm";
if (isFinalOwnerReference) {
    lineOption = "최종확인";
    systemAction = "final_confirm";
}
```

- [ ] **Step 4: Keep the new submit path reusing `submitDraft`, so a rejected document creates a new approval row and new draft number when the pre-apply row no longer exists**

```java
Long preApplyApprovalId = findLatestPreApplyApprovalId(tenantId, workId, actorLoginId);
if (preApplyApprovalId == null) {
    // insert a fresh tb_electronic_approval_main row so ea_exe_id is generated again
}
```

### Task 2: Backend document-list visibility and multi-select participant filters

**Files:**

- Modify: `backend/src/main/java/egovframework/let/documents/haccpwork/domain/model/HaccpWorkSearchConditionVO.java`
- Modify: `backend/src/main/java/egovframework/let/documents/haccpwork/service/HaccpWorkDraftService.java`
- Modify: `backend/src/main/java/egovframework/let/documents/haccpwork/service/impl/HaccpWorkDraftServiceImpl.java`
- Modify: `backend/src/main/resources/egovframework/mapper/let/documents/haccpwork/HaccpWorkMapper_SQL_postgresql.xml`

- [ ] **Step 1: Normalize `participantType` into a list of canonical codes (`DRAFTER`, `APPROVER`, `REFERENCE`)**

```java
private List<String> normalizeParticipantTypes(String participantType) {
    // split on commas, trim, map to canonical values, and drop blanks
}
```

- [ ] **Step 2: Switch the mapper filter to match any selected participant type**

```xml
<if test="participantTypes != null and participantTypes.size() > 0">
  AND (
    <foreach collection="participantTypes" item="participantType" separator=" OR ">
      ...
    </foreach>
  )
</if>
```

- [ ] **Step 3: Prevent non-owners from seeing pre-apply documents while still allowing owners to see their own temp saves**

```sql
AND (
  m.login_id = #{actorLoginId, jdbcType=BIGINT}
  OR COALESCE(m.status_type, '') <> 'pre_apply'
)
```

### Task 3: Frontend approval draft labels and reissue button flow

**Files:**

- Modify: `frontend/src/services/documents/haccpBaseWorkService.ts`
- Modify: `frontend/src/pages/documents/approvals/hooks/useApprovalDraftWriteData.ts`
- Modify: `frontend/src/pages/documents/approvals/hooks/useApprovalDraftWriteActions.ts`
- Modify: `frontend/src/pages/documents/approvals/ApprovalDraftWritePage.tsx`
- Modify: `frontend/src/pages/documents/approvals/components/ApprovalDraftHeader.tsx`

- [ ] **Step 1: Carry `lastOwnerStatus` through the API normalizer**

```ts
lastOwnerStatus: normalizeBoolean(raw.lastOwnerStatus ?? raw.last_owner_status),
```

- [ ] **Step 2: Derive the final-confirm label from `work.lastOwnerStatus`**

```ts
const showFinalConfirm = canConfirm && Boolean(work?.lastOwnerStatus);
const approveLabel = showFinalConfirm
  ? '최종 확인'
  : approvalEventType === 'final_approve'
    ? '최종 승인'
    : '검토 승인';
```

- [ ] **Step 3: Show `재결재 신청` on rejected documents that can submit again**

```ts
const submitLabel =
  approvalStatusType?.trim().toLowerCase() === 'rejected' &&
  work?.lastOwnerStatus
    ? '재결재 신청'
    : '결재 신청';
```

- [ ] **Step 4: Update the confirmation dialog copy for final confirmation**

```ts
title={showFinalConfirm ? '최종 확인' : `${approveLabel} 확인`}
description={showFinalConfirm ? '문서를 최종 확인 처리하시겠습니까?' : `${approveLabel}를 진행하시겠습니까?`}
```

### Task 4: Frontend document-management multi-select filters

**Files:**

- Modify: `frontend/src/pages/documents/haccp-doc/types.ts`
- Modify: `frontend/src/pages/documents/haccp-doc/hooks/useHaccpDocumentManagement.ts`
- Modify: `frontend/src/pages/documents/haccp-doc/components/HaccpDocumentSearchPanel.tsx`
- Modify: `frontend/src/services/documents/haccpDocumentService.ts` if query serialization needs array support

- [ ] **Step 1: Change `participantType` state to a string array**

```ts
export type HaccpDocSearchValue = {
  participantType: string[];
};
```

- [ ] **Step 2: Render the participation filter as a multi-select with all three document roles**

```tsx
<TextField select SelectProps={{ multiple: true }} ... />
```

- [ ] **Step 3: Send comma-separated participant types to the backend and join chips for display**

```ts
participantType: appliedFilters.participantType.join(',') || undefined,
```

### Task 5: Verify the flow end to end

**Files:**

- Test: `frontend/src/test/...`
- Test: `backend/src/test/...`

- [ ] **Step 1: Run focused backend compile/tests for the touched document workflow classes**

```powershell
mvn -pl backend -DskipTests compile
```

- [ ] **Step 2: Run focused frontend typecheck/tests for the touched document workflow hooks/components**

```powershell
cd frontend
npm run typecheck
```

- [ ] **Step 3: Manually verify the four user-facing cases**

```text
1. final-owner confirm shows the new label and comment text
2. participant-type multi-select filters correctly
3. non-owner pre-apply documents are hidden
4. final rejection allows re-submission as a new approval row
```
