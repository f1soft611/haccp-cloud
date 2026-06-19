# 공통 그리드 서버 페이징 설계서

- 작성일: 2026-06-19
- 범위: 메뉴 관리, 권한 관리, 로그인 이력
- 목표: 로그인 이력과 동일한 서버 페이징 패턴으로 3개 화면을 통일하고, 프론트에서는 공통 훅과 공통 UI로 재사용한다.

## 1. 문제 정의

현재 로그인 이력은 서버 페이징을 사용하지만, 메뉴 관리와 권한 관리는 목록 전체 조회 후 화면에서 필터링/렌더링한다. 이로 인해 다음 문제가 있다.

1. 화면별 페이징/검색 동작이 달라 사용자 경험이 일관되지 않다.
2. 데이터가 증가할수록 메뉴/권한 화면의 조회 비용이 커진다.
3. 페이징 로직이 화면별로 분산되어 유지보수 비용이 높다.

## 2. 설계 목표

1. 3개 화면 모두 서버 페이징으로 통일한다.
2. 백엔드는 로그인 이력과 같은 방식으로 PaginationInfo 기반 계산을 수행한다.
3. 프론트는 공통 훅과 공통 컴포넌트로 페이징 UI/상태를 재사용한다.
4. 페이지 크기 선택은 10/20/50을 지원한다.
5. 기존 비페이징 API는 하위 호환을 위해 유지한다.

## 3. 아키텍처 방향

선택안은 신규 페이징 전용 API 추가 방식이다.

1. 로그인 이력 API는 유지한다.
2. 메뉴/권한은 기존 목록 API를 유지하면서 페이징 전용 API를 추가한다.
3. 프론트는 신규 페이징 API로 단계적 전환한다.

이 방식은 기존 기능 영향 범위를 최소화하고 롤백이 쉽다.

## 4. 백엔드 설계

### 4.1 공통 페이징 규칙

1. 요청 파라미터: pageIndex, pageSize
2. pageIndex는 1 이상, pageSize는 10/20/50만 허용한다.
3. PaginationInfo로 firstIndex, lastIndex, recordCountPerPage를 계산한다.
4. 목록 조회 쿼리는 firstIndex, recordCountPerPage를 사용한다.
5. 응답은 로그인 이력 패턴과 동일하게 목록, totalCount, paginationInfo를 포함한다.
6. pageIndex가 1 미만이면 400을 반환한다.

### 4.2 API 계약

#### 로그인 이력

- 유지: GET /api/platform-admin/login-history, GET /api/platform-admin/login-history/list
- 요청: 기존 검색 파라미터 + pageIndex + pageSize
- 응답: result.loginHistoryList, result.totalCount, result.paginationInfo

#### 메뉴 관리

- 신규: GET /api/platform-admin/menus/paged
- 요청:
  - pageIndex
  - pageSize
  - searchField: menuNm | menuDc | menuUrl
  - searchKeyword
  - useAt: Y | N | all
- 응답:
  - result.menuList
  - result.totalCount
  - result.paginationInfo

#### 권한 관리

- 신규: GET /api/platform-admin/roles/paged
- 요청:
  - pageIndex
  - pageSize
  - searchField: code | name | description
  - searchKeyword
  - useAt: Y | N | all
- 응답:
  - result.roleList
  - result.totalCount
  - result.paginationInfo

### 4.3 계층별 변경 포인트

1. Controller

- 메뉴/권한 paged 엔드포인트 추가
- 입력 검증 및 PaginationInfo 계산
- ResultVO result 맵 구성

2. Service

- 메뉴/권한 페이징 목록 조회 메서드 추가
- 메뉴/권한 전체 건수 조회 메서드 추가

3. DAO

- 메뉴/권한 페이징 목록 조회 쿼리 호출 추가
- 메뉴/권한 건수 조회 쿼리 호출 추가

4. Mapper

- PostgreSQL/MSSQL 각각에 paged list, count 쿼리 추가
- 기존 정렬 기준 유지

5. VO

- 메뉴/권한 VO에 pageIndex, pageSize, firstIndex, lastIndex, recordCountPerPage 필드 추가

## 5. 프론트 설계

### 5.1 공통 상태 훅

이름: useGridPagination

1. 상태

- pageIndex 기본값 1
- pageSize 기본값 10

2. 동작

- page 이동
- pageSize 변경 시 pageIndex를 1로 리셋
- 검색/필터 적용 시 resetPage 제공

3. 옵션

- pageSizeOptions: [10, 20, 50]

### 5.2 공통 UI 컴포넌트

이름: GridPaginationBar

1. 입력

- pageIndex
- pageSize
- totalCount
- onPageChange
- onPageSizeChange

2. 출력 UI

- 총 건수 표시
- 페이지 크기 선택 Select
- 페이지네이션 컴포넌트

3. 계산

- totalPages = max(1, ceil(totalCount / pageSize))

### 5.3 화면별 적용

1. 로그인 이력

- 기존 로직 유지
- 하단 페이지네이션 UI만 공통 컴포넌트로 교체

2. 메뉴 관리

- 신규 paged API 사용
- 클라이언트 전체 필터링 제거
- 조회 버튼 클릭 시 appliedFilters 반영 후 1페이지로 리셋
- 메뉴 조회 결과는 서버가 정렬된 평면 목록으로 반환하고, 프론트는 기존 parentMenuId 기반 그룹 렌더링을 유지한다.
- 페이지 경계에서 부모와 자식이 분리될 수 있으며, 이는 1차 릴리즈에서 허용한다.

3. 권한 관리

- 신규 paged API 사용
- 클라이언트 전체 필터링 제거
- 조회 버튼 클릭 시 appliedFilters 반영 후 1페이지로 리셋

## 6. 데이터 흐름

1. 사용자가 검색 조건 입력
2. 조회 버튼 클릭
3. resetPage 실행 후 appliedFilters 갱신
4. queryKey에 pageIndex, pageSize, filters 반영
5. 백엔드 paged API 호출
6. 백엔드가 paginationInfo 계산 후 목록/건수 반환
7. GridPaginationBar가 totalCount 기준으로 페이지 UI 렌더링

## 7. 오류 처리

1. 잘못된 pageSize 입력 시 400 반환
2. 잘못된 searchField 값 시 400 반환
3. pageIndex가 1 미만이면 400 반환
4. API 실패 시 기존 화면 경고 Alert 노출 규칙 유지
5. totalCount 누락 시 0으로 안전 처리

## 8. 테스트 전략

### 8.1 백엔드

1. 메뉴 paged API

- pageIndex/pageSize 검증
- 검색 필터 반영
- totalCount 일치 여부

2. 권한 paged API

- pageIndex/pageSize 검증
- 검색 필터 반영
- totalCount 일치 여부

### 8.2 프론트

1. useGridPagination 단위 테스트

- 초기 상태
- pageSize 변경 시 1페이지 리셋
- resetPage 동작

2. 페이지 통합 테스트

- 로그인 이력: pageSize 변경 파라미터 반영
- 메뉴 관리: 조회/페이지 이동/pageSize 반영
- 권한 관리: 조회/페이지 이동/pageSize 반영

## 9. 단계별 이행 계획

1. 백엔드 메뉴 paged API 추가
2. 백엔드 권한 paged API 추가
3. 프론트 서비스에 paged API 함수 추가
4. useGridPagination, GridPaginationBar 추가
5. 로그인 이력 UI 공통화 적용
6. 메뉴 관리 서버 페이징 전환
7. 권한 관리 서버 페이징 전환
8. 테스트 보강 및 회귀 확인

## 10. 비목표

1. 메뉴 트리 구조 고도화
2. 권한-메뉴 매핑 모달의 페이징 도입
3. 무한 스크롤 전환

## 11. 수용 기준

1. 메뉴/권한/로그인 이력 3개 화면에서 서버 페이징이 동작한다.
2. 페이지 크기 10/20/50 변경 시 즉시 재조회된다.
3. 조회 조건 변경 후 조회 시 1페이지부터 시작한다.
4. 공통 훅과 공통 UI를 사용해 페이징 코드 중복이 감소한다.
5. 기존 비페이징 API를 사용하는 다른 경로는 깨지지 않는다.
