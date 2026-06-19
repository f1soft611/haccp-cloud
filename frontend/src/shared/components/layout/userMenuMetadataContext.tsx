import { createContext, useContext } from 'react';

export type UserMenuMetadata = {
  menuNm?: string;
  menuDc?: string;
  iconNm?: string;
};

const UserMenuMetadataContext = createContext<Record<string, UserMenuMetadata>>(
  {},
);

export function UserMenuMetadataProvider({
  value,
  children,
}: {
  value: Record<string, UserMenuMetadata>;
  children: React.ReactNode;
}) {
  return (
    <UserMenuMetadataContext.Provider value={value}>
      {children}
    </UserMenuMetadataContext.Provider>
  );
}

export function useUserMenuMetadata() {
  return useContext(UserMenuMetadataContext);
}
