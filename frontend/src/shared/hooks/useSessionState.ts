import { useState } from 'react';

// useState와 같지만 값을 sessionStorage에 저장해 화면을 나갔다 돌아와도 유지 (같은 탭 안에서만)
export function useSessionState<T>(key: string, initial: T | (() => T)) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.sessionStorage.getItem(key);
      if (raw !== null) {
        return JSON.parse(raw) as T;
      }
    } catch {
      // 읽기 실패 시 초기값 사용
    }
    return initial instanceof Function ? initial() : initial;
  });

  const setAndStore = (next: T) => {
    setValue(next);
    try {
      window.sessionStorage.setItem(key, JSON.stringify(next));
    } catch {
      // 저장 실패 시 현재 화면 상태만 유지
    }
  };

  return [value, setAndStore] as const;
}
