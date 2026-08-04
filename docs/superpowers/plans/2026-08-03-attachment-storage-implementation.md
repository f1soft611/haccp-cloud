# Attachment Storage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기안/결재 문서에 Presigned URL 기반 첨부파일(다중 업로드, 제한 정책, 정리 배치, 감사 로그, 미리보기) 기능을 추가한다.

**Architecture:** 백엔드는 StorageClient 인터페이스를 통해 MinIO(S3 호환)로 직접 업로드 URL을 발급하고, DB에는 메타데이터/업로드세션/감사로그만 저장한다. 프론트는 presign-upload -> direct PUT -> complete 3단계로 처리하며, 다운로드/미리보기는 짧은 만료 URL을 사용한다. 미완료 업로드는 동적 스케줄러 잡으로 정리한다.

**Tech Stack:** Java 8, Spring Boot, MyBatis, PostgreSQL, React, TypeScript, React Query, Vitest, MSW, MinIO

---

### Task 1: DB 스키마와 마이그레이션 추가

**Files:**

- Create: `backend/DATABASE/migrate_postgresql_add_document_attachment_tables.sql`
- Modify: `backend/DATABASE/apply_latest_plan_scripts_dev.ps1`
- Test: `backend/src/test/java/egovframework/let/documents/haccpwork/domain/repository/HaccpWorkAttachmentDaoIntegrationTest.java`

- [ ] **Step 1: 실패하는 DAO 통합 테스트 먼저 작성**

```java
@Test
void insertAndSelectAttachment_shouldPersistMetadata() throws Exception {
    // given
    Map<String, Object> params = new HashMap<String, Object>();
    params.put("tenantId", 1L);
    params.put("approvalId", 100L);
    params.put("objectKey", "tenants/PLATFORM/approvals/100/2026/08/uuid_a.pdf");
    params.put("originalFileName", "a.pdf");
    params.put("fileExt", "pdf");
    params.put("contentType", "application/pdf");
    params.put("fileSize", 1234L);
    params.put("uploadStatus", "COMPLETED");
    params.put("previewableYn", "Y");
    params.put("createdBy", 1L);

    // when
    haccpWorkDAO.insertDocumentAttachment(params);
    List<Map<String, Object>> list = haccpWorkDAO.selectDocumentAttachmentsByApprovalId(params);

    // then
    assertThat(list).isNotEmpty();
}
```

- [ ] **Step 2: 테스트 실행으로 RED 확인**

Run: `cd backend; mvn -Pdev "-Dtest=HaccpWorkAttachmentDaoIntegrationTest" test`
Expected: FAIL (`insertDocumentAttachment`/테이블 없음)

- [ ] **Step 3: 마이그레이션 SQL 작성**

```sql
CREATE TABLE IF NOT EXISTS tb_document_attachment (
  attachment_id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL,
  approval_id BIGINT NOT NULL,
  object_key VARCHAR(512) NOT NULL UNIQUE,
  original_file_name VARCHAR(255) NOT NULL,
  file_ext VARCHAR(20) NOT NULL,
  content_type VARCHAR(100) NOT NULL,
  file_size BIGINT NOT NULL,
  checksum_sha256 VARCHAR(64),
  storage_provider VARCHAR(20) NOT NULL,
  bucket_name VARCHAR(100) NOT NULL,
  upload_status VARCHAR(20) NOT NULL,
  previewable_yn CHAR(1) NOT NULL DEFAULT 'N',
  deleted_yn CHAR(1) NOT NULL DEFAULT 'N',
  created_by BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by BIGINT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

- [ ] **Step 4: 개발용 최신 스크립트 적용 목록에 SQL 포함**

```powershell
$scriptFiles = @(
  "$PSScriptRoot\migrate_postgresql_add_document_attachment_tables.sql",
  # ...existing scripts
)
```

- [ ] **Step 5: 테스트 실행으로 GREEN 확인**

Run: `cd backend; mvn -Pdev "-Dtest=HaccpWorkAttachmentDaoIntegrationTest" test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/DATABASE/migrate_postgresql_add_document_attachment_tables.sql backend/DATABASE/apply_latest_plan_scripts_dev.ps1 backend/src/test/java/egovframework/let/documents/haccpwork/domain/repository/HaccpWorkAttachmentDaoIntegrationTest.java
git commit -m "feat(db): add attachment metadata/session/audit tables"
```

### Task 2: 백엔드 첨부파일 도메인 모델/DAO/매퍼 확장

**Files:**

- Create: `backend/src/main/java/egovframework/let/documents/haccpwork/domain/model/HaccpAttachmentUploadRequestVO.java`
- Create: `backend/src/main/java/egovframework/let/documents/haccpwork/domain/model/HaccpAttachmentCompleteRequestVO.java`
- Create: `backend/src/main/java/egovframework/let/documents/haccpwork/domain/model/HaccpAttachmentPolicy.java`
- Modify: `backend/src/main/java/egovframework/let/documents/haccpwork/domain/repository/HaccpWorkDAO.java`
- Modify: `backend/src/main/resources/egovframework/mapper/let/documents/haccpwork/HaccpWorkMapper_SQL_postgresql.xml`
- Test: `backend/src/test/java/egovframework/let/documents/haccpwork/service/impl/HaccpWorkAttachmentPolicyTest.java`

- [ ] **Step 1: 정책 테스트 작성 (허용 확장자/용량/개수)**

```java
@Test
void validate_shouldRejectDisallowedExtension() {
    HaccpAttachmentPolicy policy = new HaccpAttachmentPolicy(20L * 1024 * 1024, 20, 100L * 1024 * 1024, Arrays.asList("pdf", "png"));
    Throwable thrown = catchThrowable(() -> policy.validateSingle("virus.exe", "application/octet-stream", 100L));
    assertThat(thrown).isInstanceOf(IllegalArgumentException.class);
}
```

- [ ] **Step 2: 테스트 실행으로 RED 확인**

Run: `cd backend; mvn -Pdev "-Dtest=HaccpWorkAttachmentPolicyTest" test`
Expected: FAIL (정책 클래스/메서드 미구현)

- [ ] **Step 3: 최소 정책/요청 VO/DAO 시그니처 구현**

```java
public void validateSingle(String fileName, String contentType, long fileSize) {
    String ext = extractExt(fileName);
    if (!allowedExt.contains(ext)) {
        throw new IllegalArgumentException("허용되지 않는 확장자입니다.");
    }
    if (fileSize <= 0 || fileSize > maxFileSizeBytes) {
        throw new IllegalArgumentException("파일 크기 제한을 초과했습니다.");
    }
}
```

- [ ] **Step 4: 매퍼 SQL 추가 (insert/select/update for attachment/session/audit)**

```xml
<insert id="HaccpWorkDAO.insertDocumentAttachment" parameterType="map">
  INSERT INTO tb_document_attachment (
    tenant_id, approval_id, object_key, original_file_name, file_ext, content_type,
    file_size, checksum_sha256, storage_provider, bucket_name, upload_status,
    previewable_yn, created_by, created_at
  ) VALUES (
    #{tenantId}, #{approvalId}, #{objectKey}, #{originalFileName}, #{fileExt}, #{contentType},
    #{fileSize}, #{checksumSha256}, #{storageProvider}, #{bucketName}, #{uploadStatus},
    #{previewableYn}, #{createdBy}, NOW()
  )
</insert>
```

- [ ] **Step 5: 테스트 실행으로 GREEN 확인**

Run: `cd backend; mvn -Pdev "-Dtest=HaccpWorkAttachmentPolicyTest" test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/egovframework/let/documents/haccpwork/domain/model/HaccpAttachmentUploadRequestVO.java backend/src/main/java/egovframework/let/documents/haccpwork/domain/model/HaccpAttachmentCompleteRequestVO.java backend/src/main/java/egovframework/let/documents/haccpwork/domain/model/HaccpAttachmentPolicy.java backend/src/main/java/egovframework/let/documents/haccpwork/domain/repository/HaccpWorkDAO.java backend/src/main/resources/egovframework/mapper/let/documents/haccpwork/HaccpWorkMapper_SQL_postgresql.xml backend/src/test/java/egovframework/let/documents/haccpwork/service/impl/HaccpWorkAttachmentPolicyTest.java
git commit -m "feat(backend): add attachment policy and dao mapper contracts"
```

### Task 3: StorageClient와 MinIO Presign 구현

**Files:**

- Create: `backend/src/main/java/egovframework/let/storage/StorageClient.java`
- Create: `backend/src/main/java/egovframework/let/storage/minio/MinioStorageClient.java`
- Create: `backend/src/main/java/egovframework/let/storage/StorageProperties.java`
- Modify: `backend/src/main/resources/application-dev.properties`
- Test: `backend/src/test/java/egovframework/let/storage/minio/MinioStorageClientTest.java`

- [ ] **Step 1: Presign 계약 테스트 작성**

```java
@Test
void presignUpload_shouldReturnPutUrlWithExpiry() {
    PresignedUploadRequest req = new PresignedUploadRequest("bucket", "key.pdf", "application/pdf", Duration.ofMinutes(10));
    PresignedUploadResult result = storageClient.presignUpload(req);
    assertThat(result.getUrl()).contains("X-Amz-Algorithm");
}
```

- [ ] **Step 2: 테스트 실행으로 RED 확인**

Run: `cd backend; mvn -Pdev "-Dtest=MinioStorageClientTest" test`
Expected: FAIL (StorageClient/구현체 없음)

- [ ] **Step 3: StorageClient 인터페이스/MinIO 구현**

```java
public interface StorageClient {
    PresignedUploadResult presignUpload(PresignedUploadRequest request) throws Exception;
    PresignedDownloadResult presignDownload(PresignedDownloadRequest request) throws Exception;
    ObjectStat statObject(String bucket, String objectKey) throws Exception;
    void deleteObject(String bucket, String objectKey) throws Exception;
}
```

- [ ] **Step 4: dev 설정 추가**

```properties
storage.provider=minio
storage.bucket=document-attachments
storage.endpoint=http://localhost:9000
storage.accessKey=minioadmin
storage.secretKey=minioadmin
storage.region=us-east-1
```

- [ ] **Step 5: 테스트 실행으로 GREEN 확인**

Run: `cd backend; mvn -Pdev "-Dtest=MinioStorageClientTest" test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/egovframework/let/storage/StorageClient.java backend/src/main/java/egovframework/let/storage/minio/MinioStorageClient.java backend/src/main/java/egovframework/let/storage/StorageProperties.java backend/src/main/resources/application-dev.properties backend/src/test/java/egovframework/let/storage/minio/MinioStorageClientTest.java
git commit -m "feat(storage): add minio-backed presign storage client"
```

### Task 4: 첨부파일 서비스/컨트롤러 API 구현

**Files:**

- Create: `backend/src/main/java/egovframework/let/documents/haccpwork/service/HaccpWorkAttachmentService.java`
- Create: `backend/src/main/java/egovframework/let/documents/haccpwork/service/impl/HaccpWorkAttachmentServiceImpl.java`
- Modify: `backend/src/main/java/egovframework/let/documents/haccpwork/controller/HaccpWorkApiController.java`
- Modify: `backend/src/main/java/egovframework/let/documents/haccpwork/domain/repository/HaccpWorkDAO.java`
- Modify: `backend/src/main/resources/egovframework/mapper/let/documents/haccpwork/HaccpWorkMapper_SQL_postgresql.xml`
- Test: `backend/src/test/java/egovframework/let/documents/haccpwork/service/impl/HaccpWorkAttachmentServiceImplTest.java`
- Test: `backend/src/test/java/egovframework/let/documents/haccpwork/controller/HaccpWorkApiControllerAttachmentTest.java`

- [ ] **Step 1: 서비스 테스트 작성 (권한/presign/complete/list/delete)**

```java
@Test
void presignUpload_shouldFailWhenNoApprovalAccess() throws Exception {
    when(haccpWorkDAO.selectApprovalTemplateAccessCount(anyMap())).thenReturn(0);
    Throwable thrown = catchThrowable(() -> service.presignUpload(100L, "PLATFORM", request, "platform_admin"));
    assertThat(thrown).isInstanceOf(ResponseStatusException.class);
}
```

- [ ] **Step 2: 테스트 실행으로 RED 확인**

Run: `cd backend; mvn -Pdev "-Dtest=HaccpWorkAttachmentServiceImplTest" test`
Expected: FAIL (서비스 미구현)

- [ ] **Step 3: 서비스 최소 구현**

```java
if (hasAccess == null || hasAccess.intValue() <= 0) {
    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "해당 결재 문서 접근 권한이 없습니다.");
}
PresignedUploadResult upload = storageClient.presignUpload(req);
haccpWorkDAO.insertAttachmentUploadSession(sessionParams);
```

- [ ] **Step 4: 컨트롤러 엔드포인트 추가**

```java
@PostMapping("/approvals/{approvalId}/attachments/presign-upload")
public ResultVO presignUpload(...)

@PostMapping("/approvals/{approvalId}/attachments/complete")
public ResultVO completeUpload(...)

@PostMapping("/approvals/{approvalId}/attachments/{attachmentId}/presign-download")
public ResultVO presignDownload(...)
```

- [ ] **Step 5: 컨트롤러 테스트로 GREEN 확인**

Run: `cd backend; mvn -Pdev "-Dtest=HaccpWorkApiControllerAttachmentTest" test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/egovframework/let/documents/haccpwork/service/HaccpWorkAttachmentService.java backend/src/main/java/egovframework/let/documents/haccpwork/service/impl/HaccpWorkAttachmentServiceImpl.java backend/src/main/java/egovframework/let/documents/haccpwork/controller/HaccpWorkApiController.java backend/src/main/java/egovframework/let/documents/haccpwork/domain/repository/HaccpWorkDAO.java backend/src/main/resources/egovframework/mapper/let/documents/haccpwork/HaccpWorkMapper_SQL_postgresql.xml backend/src/test/java/egovframework/let/documents/haccpwork/service/impl/HaccpWorkAttachmentServiceImplTest.java backend/src/test/java/egovframework/let/documents/haccpwork/controller/HaccpWorkApiControllerAttachmentTest.java
git commit -m "feat(api): add attachment presign/complete/list/download/preview/delete endpoints"
```

### Task 5: 미완료 업로드 정리 배치 구현 (동적 스케줄러 연동)

**Files:**

- Create: `backend/src/main/java/egovframework/let/documents/haccpwork/service/HaccpWorkAttachmentCleanupJob.java`
- Create: `backend/src/test/java/egovframework/let/documents/haccpwork/service/HaccpWorkAttachmentCleanupJobTest.java`
- Modify: `backend/src/main/java/egovframework/let/documents/haccpwork/service/impl/HaccpWorkAttachmentServiceImpl.java`
- Modify: `backend/DATABASE/migrate_postgresql_add_document_attachment_tables.sql`

- [ ] **Step 1: 정리 배치 테스트 작성**

```java
@Test
void execute_shouldMarkExpiredSessionsAndDeleteOrphanObjects() throws Exception {
    when(haccpWorkDAO.selectExpiredUploadSessions(anyMap())).thenReturn(expiredRows());
    job.executeInterface();
    verify(storageClient).deleteObject(anyString(), anyString());
    verify(haccpWorkDAO).markUploadSessionCleaned(anyMap());
}
```

- [ ] **Step 2: 테스트 실행으로 RED 확인**

Run: `cd backend; mvn -Pdev "-Dtest=HaccpWorkAttachmentCleanupJobTest" test`
Expected: FAIL (잡 클래스/DAO 메서드 없음)

- [ ] **Step 3: 최소 배치 구현**

```java
public void executeInterface() throws Exception {
    List<Map<String, Object>> targets = haccpWorkDAO.selectExpiredUploadSessions(params);
    for (Map<String, Object> row : targets) {
        storageClient.deleteObject(bucket, objectKey);
        haccpWorkDAO.markUploadSessionCleaned(updateParams);
        haccpWorkDAO.markAttachmentAbandoned(updateParams);
    }
}
```

- [ ] **Step 4: 스케줄러 등록용 SQL 추가**

```sql
INSERT INTO tb_schedulerconfig (
  scheduler_nm, scheduler_desc, is_running, cron_expression
) VALUES (
  'AttachmentCleanup', '미완료 첨부 업로드 정리', 'Y', '0 */10 * * * *'
)
ON CONFLICT DO NOTHING;
```

- [ ] **Step 5: 테스트 실행으로 GREEN 확인**

Run: `cd backend; mvn -Pdev "-Dtest=HaccpWorkAttachmentCleanupJobTest" test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/egovframework/let/documents/haccpwork/service/HaccpWorkAttachmentCleanupJob.java backend/src/test/java/egovframework/let/documents/haccpwork/service/HaccpWorkAttachmentCleanupJobTest.java backend/src/main/java/egovframework/let/documents/haccpwork/service/impl/HaccpWorkAttachmentServiceImpl.java backend/DATABASE/migrate_postgresql_add_document_attachment_tables.sql
git commit -m "feat(batch): add expired attachment upload cleanup job"
```

### Task 6: 프론트 서비스/타입/모킹 API 추가

**Files:**

- Create: `frontend/src/services/documents/haccpAttachmentService.ts`
- Modify: `frontend/src/mocks/handlers.ts`
- Test: `frontend/src/test/haccp-attachment-service.test.ts`

- [ ] **Step 1: 서비스 테스트 작성**

```ts
test('presign -> complete -> list flow returns normalized items', async () => {
  const presigned = await presignHaccpAttachmentsUpload({
    tenantCode: 'PLATFORM',
    approvalId: '100',
    items: [
      { fileName: 'a.pdf', contentType: 'application/pdf', fileSize: 123 },
    ],
  });
  expect(presigned.items.length).toBe(1);
});
```

- [ ] **Step 2: 테스트 실행으로 RED 확인**

Run: `cd frontend; npm run test -- haccp-attachment-service.test.ts`
Expected: FAIL (서비스/핸들러 없음)

- [ ] **Step 3: 서비스 최소 구현**

```ts
export async function presignHaccpAttachmentsUpload(...) {
  const { data } = await apiClient.post(`/v1/haccp-work/approvals/${approvalId}/attachments/presign-upload`, payload, {
    headers: { 'x-tenant-code': tenantCode },
  });
  return normalizePresignResult(data);
}
```

- [ ] **Step 4: MSW 핸들러 추가**

```ts
http.post(
  '/api/v1/haccp-work/approvals/:approvalId/attachments/presign-upload',
  async () => {
    return HttpResponse.json({
      result: {
        items: [
          /* ... */
        ],
      },
    });
  },
);
```

- [ ] **Step 5: 테스트 실행으로 GREEN 확인**

Run: `cd frontend; npm run test -- haccp-attachment-service.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add frontend/src/services/documents/haccpAttachmentService.ts frontend/src/mocks/handlers.ts frontend/src/test/haccp-attachment-service.test.ts
git commit -m "feat(frontend): add attachment service api and mock handlers"
```

### Task 7: 문서 작성 화면에 첨부파일 UI/미리보기 연동

**Files:**

- Create: `frontend/src/pages/documents/approvals/components/ApprovalAttachmentPanel.tsx`
- Create: `frontend/src/pages/documents/approvals/hooks/useApprovalAttachments.ts`
- Modify: `frontend/src/pages/documents/approvals/components/ApprovalDraftContent.tsx`
- Modify: `frontend/src/pages/documents/approvals/ApprovalDraftWritePage.tsx`
- Test: `frontend/src/test/approval-attachment-panel.test.tsx`

- [ ] **Step 1: UI 테스트 작성 (다중 업로드/미리보기/삭제)**

```tsx
test('uploads multiple files and renders attachment rows', async () => {
  render(<ApprovalAttachmentPanel ... />);
  await user.upload(screen.getByLabelText('첨부파일 선택'), [fileA, fileB]);
  expect(await screen.findByText('a.pdf')).toBeInTheDocument();
  expect(await screen.findByText('b.png')).toBeInTheDocument();
});
```

- [ ] **Step 2: 테스트 실행으로 RED 확인**

Run: `cd frontend; npm run test -- approval-attachment-panel.test.tsx`
Expected: FAIL (컴포넌트 없음)

- [ ] **Step 3: 훅 + UI 최소 구현**

```ts
const handleUpload = async (files: File[]) => {
  const presigned = await presignHaccpAttachmentsUpload(...);
  await Promise.all(presigned.items.map((item, i) => putObject(item.uploadUrl, files[i])));
  await completeHaccpAttachmentsUpload(...);
  await refetch();
};
```

- [ ] **Step 4: Draft 화면에 패널 삽입**

```tsx
<ApprovalAttachmentPanel
  tenantCode={tenantCode}
  approvalId={approvalIdForComments}
  isReadOnly={isReadOnly}
/>
```

- [ ] **Step 5: 테스트 실행으로 GREEN 확인**

Run: `cd frontend; npm run test -- approval-attachment-panel.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/documents/approvals/components/ApprovalAttachmentPanel.tsx frontend/src/pages/documents/approvals/hooks/useApprovalAttachments.ts frontend/src/pages/documents/approvals/components/ApprovalDraftContent.tsx frontend/src/pages/documents/approvals/ApprovalDraftWritePage.tsx frontend/src/test/approval-attachment-panel.test.tsx
git commit -m "feat(ui): add approval attachment panel with preview and delete"
```

### Task 8: 통합 검증과 문서 업데이트

**Files:**

- Modify: `backend/Docs/postgresql-local-start.md`
- Modify: `frontend/README.md`
- Modify: `docs/superpowers/specs/2026-08-03-attachment-storage-design.md`

- [ ] **Step 1: 백엔드 첨부 테스트 묶음 실행**

Run: `cd backend; mvn -Pdev "-Dtest=HaccpWorkAttachmentPolicyTest,HaccpWorkAttachmentServiceImplTest,HaccpWorkAttachmentCleanupJobTest,HaccpWorkApiControllerAttachmentTest" test`
Expected: PASS

- [ ] **Step 2: 프론트 첨부 테스트 묶음 실행**

Run: `cd frontend; npm run test -- haccp-attachment-service.test.ts approval-attachment-panel.test.tsx`
Expected: PASS

- [ ] **Step 3: 로컬 수동 점검 절차 문서화**

```md
1. MinIO 실행
2. DB bootstrap + migration 적용
3. backend 실행
4. frontend 실행
5. 다중 업로드/미리보기/다운로드/삭제 점검
```

- [ ] **Step 4: 전체 품질 게이트 확인**

Run: `cd frontend; npm run lint && npm run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/Docs/postgresql-local-start.md frontend/README.md docs/superpowers/specs/2026-08-03-attachment-storage-design.md
git commit -m "docs: add local verification guide for attachment workflow"
```

---

## Plan Self-Review

- Spec coverage: 다중 업로드, 제한 정책, 정리 배치, 감사 로그, 미리보기 모두 Task 1~7에 대응됨.
- Placeholder scan: TODO/TBD 없음.
- Type consistency: approvalId/tenantCode 기반 API 경로와 백엔드 서비스 계약을 동일 키로 유지함.
- Risk checkpoint: 배치/스토리지 경계 로직은 Task 5에서 별도 테스트로 보강.
