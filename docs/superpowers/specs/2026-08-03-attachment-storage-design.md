# 첨부파일 기능 설계서 (실무형 1차 + 미리보기)

작성일: 2026-08-03  
대상: HACCP 문서 기안/결재 도메인 첨부파일 기능

## 1. 목표

기안/결재 문서에 다중 첨부파일 기능을 추가한다. 파일 원본은 오브젝트 스토리지에 저장하고, 애플리케이션 DB에는 메타데이터와 감사 로그만 저장한다.

핵심 목표:

- 다중 파일 업로드
- 확장자/용량 제한
- 업로드 실패 정리 배치
- 다운로드 감사 로그
- 미리보기(이미지/PDF)

## 2. 범위

포함 범위:

- Presigned URL 기반 직접 업로드
- 업로드 완료 확정 API
- 첨부파일 목록/삭제/다운로드/미리보기 API
- 미완료 업로드 정리 스케줄러
- 다운로드 감사 로그 적재

제외 범위(2차 이후):

- 바이러스 스캔
- Office 문서 서버 변환 미리보기
- 대용량 재개 업로드(TUS)

## 3. 권장 아키텍처

선택안: MinIO 로컬 기준 구현 + 운영 전환 가능한 스토리지 인터페이스

구성:

1. 프론트는 업로드 전 서버에 Presigned URL 발급 요청
2. 서버는 권한/정책 검증 후 Presigned PUT URL 발급
3. 프론트는 MinIO에 직접 업로드
4. 프론트는 업로드 완료 확정 API 호출
5. 서버는 오브젝트 존재 확인 후 메타데이터 커밋
6. 다운로드/미리보기 시 권한 확인 후 짧은 만료 URL 발급

장점:

- 백엔드 트래픽/메모리 부담 최소화
- 작은 클라우드 서비스에서 비용 절감
- MinIO, S3, R2 교체 용이

## 4. 기존 코드 기준 반영 지점

기존 문서 API 진입점:

- backend/src/main/java/egovframework/let/documents/haccpwork/controller/HaccpWorkApiController.java

기존 문서/결재 권한 검사 로직 활용 대상:

- backend/src/main/java/egovframework/let/documents/haccpwork/service/impl/HaccpWorkDraftServiceImpl.java
- backend/src/main/java/egovframework/let/documents/haccpwork/service/impl/HaccpWorkFlowServiceImpl.java

기존 DAO 패턴 확장 대상:

- backend/src/main/java/egovframework/let/documents/haccpwork/domain/repository/HaccpWorkDAO.java
- backend/src/main/resources/egovframework/mapper/let/documents/haccpwork/HaccpWorkMapper_SQL_postgresql.xml (신규 SQL 추가 예상)

## 5. 도메인 모델

### 5.1 첨부파일 엔티티

테이블: tb_document_attachment

- attachment_id BIGSERIAL PK
- tenant_id BIGINT NOT NULL
- approval_id BIGINT NOT NULL
- object_key VARCHAR(512) NOT NULL UNIQUE
- original_file_name VARCHAR(255) NOT NULL
- file_ext VARCHAR(20) NOT NULL
- content_type VARCHAR(100) NOT NULL
- file_size BIGINT NOT NULL
- checksum_sha256 VARCHAR(64) NULL
- storage_provider VARCHAR(20) NOT NULL
- bucket_name VARCHAR(100) NOT NULL
- upload_status VARCHAR(20) NOT NULL (PENDING, COMPLETED, ABANDONED, DELETED)
- previewable_yn CHAR(1) NOT NULL DEFAULT 'N'
- created_by BIGINT NOT NULL
- created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- updated_by BIGINT NULL
- updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- deleted_yn CHAR(1) NOT NULL DEFAULT 'N'

인덱스:

- idx_attachment_tenant_approval (tenant_id, approval_id, deleted_yn)
- idx_attachment_status_created (upload_status, created_at)

### 5.2 업로드 세션 엔티티

테이블: tb_document_attachment_upload_session

- upload_session_id BIGSERIAL PK
- tenant_id BIGINT NOT NULL
- approval_id BIGINT NOT NULL
- object_key VARCHAR(512) NOT NULL UNIQUE
- upload_token VARCHAR(120) NOT NULL UNIQUE
- expires_at TIMESTAMP NOT NULL
- status VARCHAR(20) NOT NULL (ISSUED, COMPLETED, EXPIRED, CLEANED)
- request_ip VARCHAR(64) NULL
- user_agent TEXT NULL
- created_by BIGINT NOT NULL
- created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

인덱스:

- idx_upload_session_expiry (status, expires_at)

### 5.3 다운로드 감사 로그

테이블: tb_document_attachment_download_audit

- download_audit_id BIGSERIAL PK
- tenant_id BIGINT NOT NULL
- approval_id BIGINT NOT NULL
- attachment_id BIGINT NOT NULL
- actor_login_id BIGINT NOT NULL
- action_type VARCHAR(20) NOT NULL (DOWNLOAD, PREVIEW)
- request_ip VARCHAR(64) NULL
- user_agent TEXT NULL
- created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

인덱스:

- idx_download_audit_attachment_created (attachment_id, created_at)
- idx_download_audit_actor_created (actor_login_id, created_at)

## 6. 스토리지 키 정책

키 포맷:

tenants/{tenantCode}/approvals/{approvalId}/{yyyy}/{MM}/{uuid}\_{safeFileName}

정책:

- 원본 파일명은 object key에 직접 노출하지 않거나 정규화하여 사용
- 사용자 입력 파일명은 DB original_file_name에만 보관
- object key는 충돌 방지를 위해 uuid 접두 사용

## 7. API 설계

기본 prefix:

/api/v1/haccp-work/approvals/{approvalId}/attachments

### 7.1 다중 업로드 URL 발급

POST /presign-upload

요청:

- items: 배열
  - fileName
  - contentType
  - fileSize
  - checksumSha256 (옵션)

검증:

- 결재 참여자 권한 검사
- 확장자 화이트리스트 검사
- MIME 허용 목록 검사
- 파일당 최대 용량 검사
- 문서당 총 용량 검사
- 최대 파일 개수 검사

응답:

- items: 배열
  - uploadToken
  - objectKey
  - uploadUrl
  - requiredHeaders
  - expiresAt

### 7.2 업로드 완료 확정

POST /complete

요청:

- items: 배열
  - uploadToken
  - objectKey
  - fileName
  - contentType
  - fileSize
  - checksumSha256

처리:

- uploadToken 유효성 확인
- 스토리지 HEAD 조회로 오브젝트 존재/크기/타입 확인
- 검증 통과 시 attachment 레코드 COMPLETED 저장
- upload_session 상태 COMPLETED 전환

응답:

- 등록된 첨부파일 목록 또는 신규 등록 항목

### 7.3 첨부파일 목록

GET /

응답:

- resultList: attachment 목록
  - attachmentId
  - originalFileName
  - fileSize
  - contentType
  - previewable
  - createdAt
  - createdBy

### 7.4 다운로드 URL 발급

POST /{attachmentId}/presign-download

처리:

- 권한 검사
- 감사 로그 action_type=DOWNLOAD 기록
- 짧은 만료 URL(권장 60초) 발급

응답:

- downloadUrl
- expiresAt

### 7.5 미리보기 URL 발급

POST /{attachmentId}/presign-preview

처리:

- 권한 검사
- preview 가능 타입만 허용(image/\*, application/pdf)
- 감사 로그 action_type=PREVIEW 기록
- inline Content-Disposition 적용 URL 발급

응답:

- previewUrl
- expiresAt

### 7.6 첨부파일 삭제

DELETE /{attachmentId}

처리:

- 권한 검사(기안자 또는 정책상 허용 역할)
- DB soft delete 처리
- 스토리지 삭제 시도
- 실패 시 재시도 대상 큐/상태 표식

## 8. 제한 정책

초기 기본값:

- 허용 확장자: pdf, png, jpg, jpeg, gif, doc, docx, xls, xlsx, hwp
- 파일당 최대 크기: 20MB
- 문서당 총합: 100MB
- 문서당 파일 개수: 20개
- Presigned URL 만료: 업로드 10분, 다운로드/미리보기 60초

환경설정화:

- application-dev.properties / application-prod.properties 에서 조정 가능하도록 외부화

## 9. 미완료 업로드 정리 배치

스케줄러 주기:

- 10분마다 실행

정리 기준:

- upload_session.status=ISSUED 이고 expires_at 경과
- attachment.status=PENDING 이고 생성 후 TTL 경과

정리 동작:

1. 오브젝트 존재 시 삭제 시도
2. session 상태 EXPIRED 또는 CLEANED 전환
3. attachment 상태 ABANDONED 전환
4. 처리 건수 로그 남김

실패 처리:

- 실패 건은 재시도 카운트 증가 후 다음 주기에 재시도

## 10. 권한 모델

조회/다운로드/미리보기 권한:

- 기존 결재 문서 접근권한(selectApprovalTemplateAccessCount) 재사용

업로드/삭제 권한:

- 기본: 기안자 + 결재 참여자 중 편집 허용 정책 사용자
- 정책은 서비스 메서드로 캡슐화하여 향후 역할 기반 확장 가능하게 설계

## 11. 감사/추적

다운로드/미리보기 각각 감사 로그를 남긴다.

기록 항목:

- 누가(actor_login_id)
- 어떤 문서/파일(approval_id, attachment_id)
- 어떤 행위(action_type)
- 언제(created_at)
- 어디서(request_ip, user_agent)

## 12. 프론트 동작 설계

문서 작성 화면에서:

1. 파일 선택(다중)
2. 로컬 선검증(확장자/용량)
3. presign-upload 호출
4. 각 파일을 MinIO로 직접 PUT
5. 완료 후 complete 호출
6. 첨부 목록 갱신

미리보기:

- 이미지/PDF는 새 탭 또는 모달에서 presign-preview URL 사용
- 그 외 파일은 presign-download 사용

## 13. 에러 처리 원칙

주요 실패 코드:

- 400: 확장자/용량 제한 위반, 잘못된 토큰
- 403: 문서 권한 없음
- 404: 첨부파일 없음
- 409: 중복 완료요청/상태 충돌
- 500: 스토리지 접근 실패

응답 메시지 원칙:

- 사용자 메시지는 명확하게
- 내부 에러 상세는 서버 로그에만 기록

## 14. 테스트 전략

백엔드 테스트:

- 서비스 단위 테스트
  - 허용/비허용 확장자
  - 파일 크기 제한 경계값
  - 총 용량/개수 제한
  - 권한 실패
  - 만료 토큰 실패
- DAO/MyBatis 통합 테스트
  - 첨부 등록/조회/소프트삭제
  - 감사 로그 적재
- 배치 테스트
  - 만료 세션 정리 시나리오

프론트 테스트:

- 다중 업로드 성공/부분실패
- 미리보기 가능/불가 분기
- complete 미호출 시 UI 경고

## 15. 운영 전환 전략

로컬/개발:

- MinIO endpoint 사용

운영:

- StorageClient 인터페이스 구현체 교체
  - MinioStorageClient
  - S3StorageClient 또는 R2StorageClient

필수 전환 체크:

- 버킷 권한 private
- CORS 정책 최소화
- URL 만료시간 유지

## 16. 구현 순서 제안

1. DB 마이그레이션 SQL 추가
2. StorageClient 인터페이스 + MinIO 구현
3. 첨부 API(발급/완료/목록/다운로드/미리보기/삭제)
4. 정리 배치
5. 프론트 업로드 UI 연동
6. 테스트/검증

## 17. 리스크와 완화

리스크:

- complete API 누락 시 orphan 오브젝트 발생
- 잘못된 Content-Type 위장 업로드
- 대량 동시 업로드 시 토큰/세션 관리 부하

완화:

- 정리 배치 필수 적용
- 서버측 HEAD 재검증 강제
- 요청당 파일 개수 상한

## 18. 승인 체크

본 설계는 아래 요구사항을 모두 포함한다.

- 다중 파일 업로드
- 확장자/용량 제한
- 업로드 실패 정리 배치
- 다운로드 감사 로그
- 미리보기

승인 후 다음 단계에서 구현 계획서를 작성한다.
