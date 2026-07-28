# HACCP Base Editor Reset Design

Date: 2026-07-09
Status: In progress
Scope: frontend/src/editor/\* 전체 리셋 설계

## Progress

- [x] Stage A: Baseline reset
- [x] Stage B: Performance hardening (1차)
- [ ] Stage C: Verification

## 1. 목표

현재 에디터를 부분 패치로 유지하지 않고, 다음 목표 기준으로 다시 설계한다.

- 표 기능 안정성: 셀 배경/텍스트/보더/정렬이 항상 적용되어야 한다.
- 상호작용 단순화: 표 메뉴 동작이 selection 상태에 덜 민감해야 한다.
- 성능 회복: 입력 지연, 선택 변경 지연, 메뉴 클릭 지연 제거.
- 첨부 참조 구현 정합: document-template-demo의 표 처리 패턴을 핵심 기준으로 삼는다.

## 2. 비목표

- 기존 훅 내부 알고리즘을 추가 패치로 유지하지 않는다.
- 에디터 외부 페이지/라우팅 구조는 변경하지 않는다.
- 1차 리셋에서는 고급 협업/실시간 기능을 넣지 않는다.

## 3. 핵심 원칙

### 3.1 Table-first command model

표 관련 액션은 모두 단일 커맨드 게이트를 통해 실행한다.

- command 실행 전: 현재 선택이 표 셀인지 확인
- 표 셀이 아니면: 마지막 셀 포지션 기반 CellSelection 복원
- 복원 실패 시: 현재 커서 트리에서 nearest cell 탐색 후 CellSelection 생성
- 그래도 실패 시: 사용자에게 no-op (에러 throw 금지)

### 3.2 Attribute-driven cell styling

셀 스타일은 확장 속성에 저장하고, 렌더링은 data-attr + inline style 동시 사용.

필수 속성:

- backgroundColor
- textColor
- verticalAlign
- borderColor
- borderWidth
- borderStyle

직렬화 규칙:

- data-cell-\* 우선
- style fallback 허용
- 저장/불러오기 모두 동일 키 사용

### 3.3 Interaction state 최소화

표 메뉴 상태는 아래만 가진다.

- open
- anchor position
- lastCellPos

제거 대상:

- 복잡한 bookmark/range 이중 추적
- selectionUpdate마다 무거운 상태 재구성

## 4. 모듈 구조 (재정의)

### 4.1 Extension layer

파일:

- frontend/src/editor/extensions/tableCellStyleExtensions.ts
- frontend/src/editor/extensions/baseExtensions.ts

역할:

- 셀 속성 정의/파싱/렌더링
- Table.configure({ resizable: true }) 유지
- 표 생성 기본값 통일: rows 3, cols 4, withHeaderRow false

### 4.2 Command layer

파일:

- frontend/src/editor/hooks/useEditorContextMenu.ts

역할:

- 표 관련 command만 제공
- command gate 내부에서 selection 보정
- 커맨드 함수는 boolean 반환 기반으로 성공/실패를 명확히 처리

### 4.3 View layer

파일:

- frontend/src/editor/menus/TableContextMenu.tsx
- frontend/src/editor/components/NotionLikeEditor.tsx
- frontend/src/editor/components/editor.css

역할:

- UI/이벤트 분리
- 메뉴는 command 호출만 수행
- CSS는 selectedCell outline 중심, background overlay 최소화

## 5. 성능 설계

### 5.1 입력 성능

- onUpdate에서 변경분만 부모에 전달
- content sync는 ref 직렬화 캐시로 중복 setContent 차단
- emitUpdate false를 기본 sync 경로에 사용

### 5.2 이벤트 비용

- DOM 이벤트 리스너는 editor 생성/파괴 시에만 바인딩
- isOpen 변화를 effect deps로 재바인딩하지 않음
- mousemove 핸들러는 threshold 계산 외 작업 금지

### 5.3 렌더 비용

- canMergeCells/canSplitCell 계산은 editor 기준 useMemo
- 메뉴 mode 전환 외에는 재렌더 최소화

## 6. 표 기능 상세 계약

### 6.1 색상

- 셀 배경: setCellAttribute(backgroundColor)
- 글씨 색상: setCellAttribute(textColor)
- 색상 제거: 해당 attr null

### 6.2 보더

- 보더 색상만 적용 시 기본값 보장
  - borderStyle = solid
  - borderWidth = 1px (없으면)
- 보더 제거
  - borderStyle = none
  - borderColor = null
  - borderWidth = 0

### 6.3 정렬

- verticalAlign: top | middle | bottom

### 6.4 구조 편집

- row/column add/delete
- merge/split
- header row toggle

## 7. 구현 단계

### Stage A: Baseline reset

1. useEditorContextMenu를 command gate 단일 구조로 재작성
2. tableCellStyleExtensions 속성 스키마 정합 점검
3. TableContextMenu props/액션 정리

완료 기준:

- 표 셀 배경색/텍스트색/보더가 즉시 반영
- 빌드 통과

### Stage B: Performance hardening

1. NotionLikeEditor content sync 최적화
2. 불필요 deps/재바인딩 제거
3. selectedCell CSS 시각 피드백 단순화

적용 메모:

- `NotionLikeEditor`의 `onUpdate` -> `onChange` 경로를 requestAnimationFrame 단위로 병합해 입력 시 부모 리렌더 빈도를 감소시켰다.

완료 기준:

- 긴 문서 타이핑 지연 체감 감소
- 메뉴 열고 닫기 지연 감소

### Stage C: Verification

수동 검증 시나리오:

1. 표 생성
2. 다중 셀 드래그
3. 셀 배경색 적용/제거
4. 보더 스타일/색/두께 적용
5. 행/열 추가 및 병합/분할
6. 저장 후 재진입 시 스타일 유지 확인

## 8. 리스크와 대응

리스크 1: selection 상태가 브라우저 포커스 이동으로 유실

- 대응: lastCellPos 기반 CellSelection 복원

리스크 2: 스타일이 저장되나 화면에서 가려짐

- 대응: selectedCell overlay 최소화, outline 기반 표시

리스크 3: 커맨드 실패 침묵으로 원인 파악 지연

- 대응: 개발 모드에서 command 실패 로그 출력 옵션 추가

## 9. 수용 기준

아래 모두 만족 시 리셋 완료로 판단:

- 표 배경색 기능이 10회 연속 정상 동작
- 보더 색상/두께/스타일이 저장 및 재로드 시 유지
- 타이핑 체감 지연이 기존 대비 개선
- 빌드/기본 페이지 진입/저장 동작 정상
