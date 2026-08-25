# 03. 운영 배포 변수 정리

## 1. 설정 파일 위치

운영 환경 변수 및 DB 연결 정보는 아래 파일에서 확인됩니다.

- `backend/src/main/resources/application-dev.properties`
- `backend/src/main/resources/application-prod.properties`
- `backend/config/application-prod.properties.example`

---

## 2. 핵심 환경 변수 목록

### 2-1. 데이터소스 관련

| 변수                                 | 예시                                                                | 설명        |
| ------------------------------------ | ------------------------------------------------------------------- | ----------- |
| `Globals.DbType`                     | `postgresql`                                                        | DB 타입     |
| `Globals.postgresql.Url`             | `jdbc:log4jdbc:postgresql://218.155.74.34:5433/haccp_cloud_central` | 중앙 DB URL |
| `Globals.postgresql.UserName`        | `postgres`                                                          | DB 사용자   |
| `Globals.postgresql.Password`        | `${POSTGRES_PASSWORD:f1soft@96}`                                    | DB 비밀번호 |
| `Globals.postgresql.DriverClassName` | `net.sf.log4jdbc.DriverSpy`                                         | 드라이버    |

중요 포인트:

- 현재 구조는 “중앙 DB + 테넌트 DB” 분리 구조입니다.
- 중앙 DB 연결은 기본적으로 `Globals.postgresql.Url`을 사용합니다.

### 2-2. 스토리지 관련

| 변수                           | 예시                        | 설명              |
| ------------------------------ | --------------------------- | ----------------- |
| `storage.provider`             | `minio`                     | 스토리지 타입     |
| `storage.bucket`               | `document-attachments`      | 첨부 저장 버킷    |
| `storage.endpoint`             | `http://218.155.74.34:9000` | MinIO 엔드포인트  |
| `storage.accessKey`            | `f1soft`                    | 액세스 키         |
| `storage.secretKey`            | `CHANGE_ME`                 | 비밀 키           |
| `storage.region`               | `us-east-1`                 | 리전              |
| `storage.presignExpirySeconds` | `600`                       | presign 만료 시간 |

참고:

- 첨부 파일 저장은 MinIO 기반
- `tb_document_attachment`의 `object_key`와 연결되어 저장됨

### 2-3. 보안/인증 관련

| 변수                      | 예시                    | 설명               |
| ------------------------- | ----------------------- | ------------------ |
| `Globals.crypto.algoritm` | `YOUR_CRYPTO_KEY`       | 암호화 알고리즘 키 |
| `Globals.jwt.secret`      | `YOUR_JWT_SECRET_KEY`   | JWT 시크릿         |
| `Globals.Allow.Origin`    | `http://localhost:3000` | CORS 허용 origin   |

중요 포인트:

- JWT 시크릿 값은 운영 환경에서 반드시 별도 보관해야 함
- 변경 시 기존 토큰 무효화에 영향을 줌

### 2-4. 메일/온보딩 관련

| 변수                                          | 예시                             | 설명                 |
| --------------------------------------------- | -------------------------------- | -------------------- |
| `mail.from.address`                           | `no-reply@f1soft.co.kr`          | 발신 이메일          |
| `onboarding.verify.base-url`                  | `https://haccp-cloud.vercel.app` | 인증 링크 베이스 URL |
| `spring.mail.host`                            | `smtps.hiworks.com`              | SMTP 서버            |
| `spring.mail.port`                            | `465`                            | SMTP 포트            |
| `spring.mail.username`                        | `erpsystem@f1soft.co.kr`         | 메일 계정            |
| `spring.mail.password`                        | `${MAIL_PASSWORD:CHANGE_ME}`     | 메일 비밀번호        |
| `spring.mail.properties.mail.smtp.ssl.enable` | `true`                           | SSL 활성화           |

운영 포인트:

- 온보딩 이메일은 테넌트 생성 후 발송되며, `TenantOnboardingServiceImpl`에서 사용됨

### 2-5. SSO/외부 API 관련

| 변수                     | 예시                                         | 설명                        |
| ------------------------ | -------------------------------------------- | --------------------------- |
| `Sns.naver.clientId`     | `YOUR_NAVER_CLIENT_ID`                       | 네이버 로그인 client ID     |
| `Sns.naver.clientSecret` | `YOUR_NAVER_CLIENT_SECRET`                   | 네이버 로그인 client secret |
| `Sns.naver.callbackUrl`  | `http://localhost:3000/login/naver/callback` | 네이버 콜백 URL             |
| `Sns.kakao.clientId`     | `YOUR_KAKAO_CLIENT_ID`                       | 카카오 로그인 client ID     |
| `Sns.kakao.callbackUrl`  | `http://localhost:3000/login/kakao/callback` | 카카오 콜백 URL             |

### 2-6. 정부 로그 API 관련

| 변수                             | 예시                                                   | 설명              |
| -------------------------------- | ------------------------------------------------------ | ----------------- |
| `gov.log.api.url`                | `https://log.smart-factory.kr/apisvc/sendLogData.json` | 외부 로그 API URL |
| `gov.log.api.crtfcKey`           | secret value                                           | 인증 키           |
| `gov.log.api.useSe`              | `접속`                                                 | 사용 여부 값      |
| `gov.log.api.connect-timeout-ms` | `5000`                                                 | 연결 타임아웃     |
| `gov.log.api.read-timeout-ms`    | `10000`                                                | 읽기 타임아웃     |

---

## 3. 운영 환경 체크 리스트

배포 전 아래 항목을 반드시 점검합니다.

- `POSTGRES_PASSWORD` 값이 운영 서버에 실제로 존재하는지
- `Globals.jwt.secret` 값이 production 기준으로 올바른지
- `storage.secretKey`가 비밀 저장소에 안전하게 관리되는지
- 메일 계정/SMTP 정보가 실제 운영용으로 맞는지
- Frontend의 `VITE_API_BASE_URL` 또는 프록시 설정이 운영 도메인에 맞는지
- `onboarding.verify.base-url`이 실제 배포 도메인으로 설정되어 있는지

---

## 4. 운영에서 가장 중요한 점

1. DB 비밀번호, JWT 시크릿, 메일 비밀번호는 코드에 하드코딩하지 않아야 함
2. `application-prod.properties`는 운영 환경에서 민감 정보가 포함되므로 보안 저장소 또는 환경 변수로 관리하는 것을 권장함
3. MinIO/SMTP/SNS 등 외부 연동 값이 누락되면 테넌트 신규 생성과 온보딩이 실패할 수 있음
4. `Globals.postgresql.Url`이 중앙 DB 주소만 가리키고 있어서, 테넌트 DB는 `tb_tenant_database` 메타를 기준으로 동적 연결됨

---

## 5. 간단 요약

운영 배포에서 가장 중요한 설정은 다음 5가지입니다.

- DB 연결 정보
- JWT secret
- MinIO 스토리지 정보
- 메일 정보
- 외부 SSO/로그 API 정보

이 값들이 모두 정상이어야 신규 테넌트 생성, 로그인, 파일 업로드, 온보딩이 정상적으로 동작합니다.
