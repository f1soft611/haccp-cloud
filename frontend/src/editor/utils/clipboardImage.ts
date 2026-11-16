type ClipboardLike = {
  getData: (type: string) => string;
  files: ArrayLike<File>;
};

// 붙여넣기 클립보드에서 이미지로 넣을 파일 하나를 고른다.
// 엑셀, 워드는 미리보기 이미지와 텍스트를 같이 담으므로 텍스트가 있으면 null (기존 붙여넣기 유지)
// ponytail: 첫 이미지만 사용, 여러 장 붙여넣기가 필요해지면 배열 반환으로 변경
export function getPastedImageFile(data: ClipboardLike): File | null {
  if ((data.getData('text/plain') ?? '').trim()) {
    return null;
  }

  return (
    Array.from(data.files).find((file) =>
      String(file.type || '').toLowerCase().startsWith('image/'),
    ) ?? null
  );
}