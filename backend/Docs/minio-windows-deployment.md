# Windows 개발서버 MinIO 배포 가이드

대상 서버: `218.155.74.34`

전제:

- 백엔드는 Windows Tomcat에 WAR로 배포한다.
- 파일 원본은 MinIO에 저장하고, DB에는 메타데이터만 저장한다.
- 브라우저에서 MinIO로 직접 PUT 업로드하므로 CORS 설정이 필요하다.

---

## 1. 준비물

아래 3가지만 있으면 된다.

- Windows 관리자 권한
- `winget`
- 외부에서 접근 가능한 MinIO 포트 `9000`

선택:

- MinIO 콘솔 포트 `9001`
- NSSM(Windows 서비스 등록용)

---

## 2. MinIO 서버/클라이언트 설치

PowerShell을 관리자 권한으로 실행한 뒤 아래를 실행한다.

```powershell
winget install --id MinIO.Server --accept-source-agreements --accept-package-agreements --silent
winget install --id MinIO.Client --accept-source-agreements --accept-package-agreements --silent
```

설치 후 바로 PATH가 안 잡히면, 아래 절대경로 방식으로 실행할 수 있다.

예시 설치 경로:

```powershell
C:\Users\<사용자>\AppData\Local\Microsoft\WinGet\Packages\MinIO.Server_Microsoft.Winget.Source_8wekyb3d8bbwe\minio.exe
C:\Users\<사용자>\AppData\Local\Microsoft\WinGet\Packages\MinIO.Client_Microsoft.Winget.Source_8wekyb3d8bbwe\mc.exe
```

---

## 3. MinIO 데이터 폴더 생성

예시 경로:

```powershell
New-Item -ItemType Directory -Force -Path D:\minio\data | Out-Null
New-Item -ItemType Directory -Force -Path D:\minio\config | Out-Null
```

권장:

- 시스템 드라이브보다 별도 데이터 드라이브를 사용한다.
- 이 폴더는 MinIO 저장소이므로 백업 대상이다.

---

## 4. MinIO 서버 기동

### 4-1. 수동 기동 테스트

관리자 PowerShell에서 실행한다.

```powershell
$env:MINIO_ROOT_USER='dev-access-key'
$env:MINIO_ROOT_PASSWORD='dev-secret-key'
& 'C:\Users\<사용자>\AppData\Local\Microsoft\WinGet\Packages\MinIO.Server_Microsoft.Winget.Source_8wekyb3d8bbwe\minio.exe' server D:\minio\data --address ':9000' --console-address ':9001'
```

검증:

```powershell
Invoke-WebRequest -Uri 'http://127.0.0.1:9000/minio/health/live' -Method GET
```

정상 응답:

- HTTP 200

### 4-2. 브라우저 접근 주소

개발서버에서는 브라우저와 백엔드가 다음 주소로 MinIO에 접근해야 한다.

- `http://218.155.74.34:9000`

즉, `localhost:9000` 을 쓰면 안 된다.

---

## 5. 버킷 생성

MinIO Client로 버킷을 만든다.

```powershell
& 'C:\Users\<사용자>\AppData\Local\Microsoft\WinGet\Packages\MinIO.Client_Microsoft.Winget.Source_8wekyb3d8bbwe\mc.exe' alias set local http://218.155.74.34:9000 dev-access-key dev-secret-key
& 'C:\Users\<사용자>\AppData\Local\Microsoft\WinGet\Packages\MinIO.Client_Microsoft.Winget.Source_8wekyb3d8bbwe\mc.exe' mb -p local/document-attachments
```

권장 버킷명:

- `document-attachments`

---

## 6. CORS 설정

브라우저가 MinIO로 직접 PUT 하므로 CORS 허용이 필요하다.

아래 파일을 `D:\minio\cors.json` 으로 저장한다.

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "https://218.155.74.34",
      "http://218.155.74.34"
    ],
    "AllowedMethods": ["GET", "PUT", "HEAD", "DELETE"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

운영/개발서버에서 바로 쓰는 예시로는 아래처럼 두면 된다.

- 개발 프론트가 로컬이면 `http://localhost:5173` / `http://127.0.0.1:5173`
- 실제 개발 프론트가 서버에서 뜨면 그 도메인 주소를 `AllowedOrigins` 에 추가
- MinIO 자체 주소는 `http://218.155.74.34:9000`

적용:

```powershell
& 'C:\Users\<사용자>\AppData\Local\Microsoft\WinGet\Packages\MinIO.Client_Microsoft.Winget.Source_8wekyb3d8bbwe\mc.exe' cors set local/document-attachments D:\minio\cors.json
```

검증:

```powershell
& curl.exe -i -X OPTIONS "http://218.155.74.34:9000/document-attachments/test.xlsx" -H "Origin: http://localhost:5173" -H "Access-Control-Request-Method: PUT" -H "Access-Control-Request-Headers: content-type"
```

정상이라면 응답 헤더에 아래가 보여야 한다.

- `Access-Control-Allow-Origin`
- `Access-Control-Allow-Methods`
- `Access-Control-Allow-Headers`

---

## 7. Tomcat용 `setenv.bat`

Tomcat 설치 폴더의 `bin\setenv.bat` 에 아래를 넣는다.

```bat
@echo off
set "CATALINA_OPTS=%CATALINA_OPTS% -Dspring.profiles.active=prod"
set "CATALINA_OPTS=%CATALINA_OPTS% -Dspring.config.additional-location=file:/C:/haccp-cloud/config/"
set "CATALINA_OPTS=%CATALINA_OPTS% -DMINIO_ACCESS_KEY=dev-access-key"
set "CATALINA_OPTS=%CATALINA_OPTS% -DMINIO_SECRET_KEY=dev-secret-key"
set "CATALINA_OPTS=%CATALINA_OPTS% -DSTORAGE_PROVIDER=minio"
set "CATALINA_OPTS=%CATALINA_OPTS% -DSTORAGE_BUCKET=document-attachments"
set "CATALINA_OPTS=%CATALINA_OPTS% -DSTORAGE_ENDPOINT=http://218.155.74.34:9000"
set "CATALINA_OPTS=%CATALINA_OPTS% -DSTORAGE_REGION=us-east-1"
set "CATALINA_OPTS=%CATALINA_OPTS% -DSTORAGE_PRESIGN_EXPIRY_SECONDS=600"
```

운영값으로 바꿀 때는 아래만 변경하면 된다.

```bat
set "CATALINA_OPTS=%CATALINA_OPTS% -DMINIO_ACCESS_KEY=<운영_액세스키>"
set "CATALINA_OPTS=%CATALINA_OPTS% -DMINIO_SECRET_KEY=<운영_시크릿키>"
set "CATALINA_OPTS=%CATALINA_OPTS% -DSTORAGE_ENDPOINT=http://218.155.74.34:9000"
```

주의:

- 운영에서는 `dev-access-key`, `dev-secret-key` 를 그대로 쓰지 말고 운영 비밀번호로 바꾼다.
- `application-prod.properties` 의 기본값은 개발 편의를 위한 안전장치로만 보고, 실제 값은 `setenv.bat` 또는 환경변수로 덮어쓴다.

---

## 8. 백엔드 `application-prod.properties` 확인

현재 prod 설정에는 MinIO 항목이 들어가 있어야 한다.

핵심 값:

```properties
storage.provider=minio
storage.bucket=document-attachments
storage.endpoint=http://218.155.74.34:9000
storage.accessKey=...
storage.secretKey=...
storage.region=us-east-1
storage.presignExpirySeconds=600
```

기본 파일은 repo에 있고, 실제 운영값은 Tomcat 환경변수로 덮어쓰는 방식이 가장 안전하다.

---

## 9. Windows 서비스 등록 방식

### 방법 A. 작업 스케줄러

가장 단순하다.

1. 작업 스케줄러 실행
2. 새 작업 생성
3. 트리거: 시스템 시작 시
4. 동작: `minio.exe server D:\minio\data --address :9000 --console-address :9001`
5. 최상위 권한으로 실행 체크
6. 사용자 로그온 여부와 관계없이 실행 체크

장점:

- 설치가 쉽다.
- 추가 도구가 필요 없다.

단점:

- 서비스처럼 깔끔하게 관리되지는 않는다.

### 방법 B. NSSM

운영에서는 이 방식이 더 편하다.

예시:

```powershell
nssm install MinIO
```

설정:

- Application: `C:\Users\<사용자>\AppData\Local\Microsoft\WinGet\Packages\MinIO.Server_Microsoft.Winget.Source_8wekyb3d8bbwe\minio.exe`
- Arguments: `server D:\minio\data --address :9000 --console-address :9001`
- Startup directory: MinIO 데이터 폴더 또는 실행 파일 폴더
- Environment:
  - `MINIO_ROOT_USER=...`
  - `MINIO_ROOT_PASSWORD=...`

실행 예시(서비스 등록 직후 확인용):

```powershell
nssm set MinIO AppDirectory D:\minio
nssm set MinIO AppParameters "server D:\minio\data --address :9000 --console-address :9001"
nssm set MinIO AppEnvironmentExtra "MINIO_ROOT_USER=dev-access-key\nMINIO_ROOT_PASSWORD=dev-secret-key"
nssm start MinIO
```

`nssm` 를 설치하지 않는다면 작업 스케줄러를 써도 된다. 다만 운영 편의성은 NSSM이 더 낫다.

### 방법 C. 바로 복붙하는 기본 실행 스크립트

MinIO를 먼저 검증할 때는 아래처럼 한 번에 실행할 수 있다.

```powershell
$env:MINIO_ROOT_USER='dev-access-key'
$env:MINIO_ROOT_PASSWORD='dev-secret-key'
& 'C:\Users\<사용자>\AppData\Local\Microsoft\WinGet\Packages\MinIO.Server_Microsoft.Winget.Source_8wekyb3d8bbwe\minio.exe' server D:\minio\data --address ':9000' --console-address ':9001'
```

장점:

- 서비스처럼 시작/중지/재시작 가능
- 운영 관리가 쉽다

---

## 10. 백엔드 배포 순서

1. MinIO 서버가 살아 있는지 확인
2. 버킷이 생성되어 있는지 확인
3. CORS가 적용되어 있는지 확인
4. Tomcat `setenv.bat` 적용
5. WAR 배포
6. 톰캣 재시작
7. 브라우저에서 업로드 테스트

---

## 11. 점검 순서

### MinIO 점검

```powershell
Invoke-WebRequest -Uri 'http://218.155.74.34:9000/minio/health/live' -Method GET
```

### 업로드 점검

- presign-upload 성공
- 브라우저 PUT 성공
- complete 성공
- 목록에 `COMPLETED` 로 표시
- 다운로드/미리보기 동작

### 실패 시 가장 먼저 볼 것

- `storage.endpoint` 가 `localhost` 로 남아 있지 않은가
- MinIO 9000 포트가 외부에서 접근 가능한가
- CORS 허용 origin 에 실제 프론트 주소가 들어 있는가
- 방화벽 인바운드 규칙이 열려 있는가

---

## 12. 운영 권장값

운영에서는 아래처럼 쓰는 것을 권장한다.

- `storage.endpoint=http://218.155.74.34:9000`
- `storage.bucket=document-attachments`
- `storage.region=us-east-1`
- `storage.presignExpirySeconds=600`
- `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` 는 운영 전용 값 사용

---

## 13. 한 줄 요약

윈도우 개발서버에서는 다음 순서로 하면 된다.

1. MinIO Server/Client 설치
2. MinIO 기동
3. `document-attachments` 버킷 생성
4. CORS 적용
5. Tomcat `setenv.bat` 설정
6. WAR 배포
7. 업로드/다운로드 테스트
