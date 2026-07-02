import { createContext, useContext } from 'react';

export type UserMenuMetadata = {
  menuNm?: string;
  menuDc?: string;
  iconNm?: string;
};

const UserMenuMetadataContext = createContext<Record<string, UserMenuMetadata>>(
  {},
);

const CurrentMenuGroupLabelContext = createContext<string | undefined>(
  undefined,
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

export function CurrentMenuGroupLabelProvider({
  value,
  children,
}: {
  value?: string;
  children: React.ReactNode;
}) {
  return (
    <CurrentMenuGroupLabelContext.Provider value={value}>
      {children}
    </CurrentMenuGroupLabelContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUserMenuMetadata() {
  return useContext(UserMenuMetadataContext);
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCurrentMenuGroupLabel() {
  return useContext(CurrentMenuGroupLabelContext);
}
