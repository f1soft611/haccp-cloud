import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ExpandLessOutlinedIcon from '@mui/icons-material/ExpandLessOutlined';
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined';
import FactoryOutlinedIcon from '@mui/icons-material/FactoryOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined';
import PeopleOutlineOutlinedIcon from '@mui/icons-material/PeopleOutlineOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import {
  Box,
  Chip,
  IconButton,
  Skeleton,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Fragment } from 'react';
import { useTheme } from '@mui/material/styles';
import { AdminGrid } from '../../../../shared/components/data/AdminGrid';
import { GridPaginationBar } from '../../../../shared/components/data/GridPaginationBar';
import type { PlatformMenuItem } from '../../../../services/platform-admin/platformMenuService';

export const ICON_OPTIONS = [
  'Dashboard',
  'Settings',
  'Menu',
  'Factory',
  'AdminPanelSettings',
  'Business',
  'People',
  'Assignment',
  'Inventory',
  'Build',
  'Category',
  'Security',
  'Link',
  'History',
  'AccessTime',
];

const ICON_COMPONENTS: Record<string, typeof DashboardOutlinedIcon> = {
  Dashboard: DashboardOutlinedIcon,
  Settings: SettingsOutlinedIcon,
  Menu: MenuOutlinedIcon,
  Factory: FactoryOutlinedIcon,
  AdminPanelSettings: AdminPanelSettingsOutlinedIcon,
  Business: BusinessOutlinedIcon,
  People: PeopleOutlineOutlinedIcon,
  Assignment: AssignmentOutlinedIcon,
  Inventory: Inventory2OutlinedIcon,
  Build: BuildOutlinedIcon,
  Category: CategoryOutlinedIcon,
  Security: SecurityOutlinedIcon,
  Link: LinkOutlinedIcon,
  History: HistoryOutlinedIcon,
  AccessTime: AccessTimeOutlinedIcon,
};

export type MenuTreeRow = {
  menu: PlatformMenuItem;
  children: PlatformMenuItem[];
  orphanParentLabel: string | null;
};

export function MenuGrid(props: {
  rows: MenuTreeRow[];
  loading?: boolean;
  canManage?: boolean;
  deletePending?: boolean;
  expandedIds: Set<string>;
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  onToggleExpand: (menuId: string) => void;
  onEdit: (menu: PlatformMenuItem) => void;
  onDelete: (menu: PlatformMenuItem) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const {
    rows,
    loading = false,
    canManage = false,
    deletePending = false,
    expandedIds,
    pageIndex,
    pageSize,
    totalCount,
    onToggleExpand,
    onEdit,
    onDelete,
    onPageChange,
    onPageSizeChange,
  } = props;

  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const renderIconCell = (iconNm: string) => {
    const IconComponent = ICON_COMPONENTS[iconNm];
    return (
      <Box
        component="span"
        title={iconNm}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 30,
          height: 30,
          borderRadius: '50%',
          bgcolor: isDarkMode
            ? 'rgba(251, 191, 36, 0.14)'
            : 'rgba(31, 79, 143, 0.10)',
          color: isDarkMode ? '#fbbf24' : '#1f4f8f',
          fontSize: '0.95rem',
          fontWeight: 800,
          lineHeight: 1,
        }}
      >
        {IconComponent ? (
          <IconComponent fontSize="small" />
        ) : (
          <MenuOutlinedIcon fontSize="small" />
        )}
      </Box>
    );
  };

  const renderUrlCell = (menuUrl: string) => (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        px: 1,
        py: 0.25,
        borderRadius: 1,
        bgcolor: isDarkMode
          ? 'rgba(251, 191, 36, 0.14)'
          : 'rgba(31, 79, 143, 0.08)',
        color: isDarkMode ? '#fef3c7' : '#184173',
        fontFamily: 'monospace',
        fontSize: '0.8rem',
      }}
    >
      {menuUrl}
    </Box>
  );

  return (
    <>
      <AdminGrid ariaLabel="메뉴 목록">
        <TableHead>
          <TableRow>
            <TableCell width="30">확장</TableCell>
            <TableCell>메뉴명</TableCell>
            <TableCell>설명</TableCell>
            <TableCell>URL</TableCell>
            <TableCell width="80">순서</TableCell>
            <TableCell width="80">아이콘</TableCell>
            <TableCell width="80">사용여부</TableCell>
            <TableCell width="100" align="center">
              작업
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow
                key={`platform-menu-grid-skeleton-${index}`}
                data-testid={`platform-menu-grid-skeleton-row-${index}`}
              >
                <TableCell align="center">
                  <Skeleton variant="circular" width={24} height={24} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width="70%" />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width="85%" />
                </TableCell>
                <TableCell>
                  <Skeleton variant="rounded" width="90%" height={24} />
                </TableCell>
                <TableCell align="center">
                  <Skeleton variant="text" width={24} sx={{ mx: 'auto' }} />
                </TableCell>
                <TableCell align="center">
                  <Skeleton
                    variant="circular"
                    width={24}
                    height={24}
                    sx={{ mx: 'auto' }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Skeleton
                    variant="rounded"
                    width={48}
                    height={24}
                    sx={{ mx: 'auto' }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Skeleton variant="circular" width={26} height={26} />
                </TableCell>
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} align="center">
                메뉴가 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            rows.map(({ menu: rootMenu, children, orphanParentLabel }) => (
              <Fragment key={rootMenu.menuId}>
                <TableRow
                  sx={{
                    '& .MuiTableCell-root': {
                      backgroundColor: isDarkMode ? '#111827' : '#ffffff',
                    },
                    '&:nth-of-type(even) .MuiTableCell-root': {
                      backgroundColor: isDarkMode ? '#162032' : '#fbfdff',
                    },
                    '&:hover .MuiTableCell-root': {
                      backgroundColor: isDarkMode ? '#1b2535' : '#f2f7ff',
                    },
                  }}
                >
                  <TableCell align="center">
                    {children.length > 0 ? (
                      <IconButton
                        size="small"
                        onClick={() => onToggleExpand(rootMenu.menuId)}
                      >
                        {expandedIds.has(rootMenu.menuId) ? (
                          <ExpandLessOutlinedIcon fontSize="small" />
                        ) : (
                          <ExpandMoreOutlinedIcon fontSize="small" />
                        )}
                      </IconButton>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">{rootMenu.menuNm}</Typography>
                      {orphanParentLabel !== null ? (
                        <Typography variant="caption" color="text.secondary">
                          상위 메뉴: {orphanParentLabel}
                        </Typography>
                      ) : null}
                    </Box>
                  </TableCell>
                  <TableCell>{rootMenu.menuDc}</TableCell>
                  <TableCell>{renderUrlCell(rootMenu.menuUrl)}</TableCell>
                  <TableCell align="center">{rootMenu.menuOrdr}</TableCell>
                  <TableCell align="center">
                    {renderIconCell(rootMenu.iconNm)}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={rootMenu.useAt === 'Y' ? '사용' : '미사용'}
                      size="small"
                      color={rootMenu.useAt === 'Y' ? 'success' : 'default'}
                      variant="filled"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => onEdit(rootMenu)}
                      disabled={!canManage}
                      sx={{
                        mr: 0.25,
                        color: isDarkMode ? '#fbbf24' : '#1f4f8f',
                        bgcolor: isDarkMode
                          ? 'rgba(251, 191, 36, 0.12)'
                          : 'rgba(31, 79, 143, 0.08)',
                        '&:hover': {
                          bgcolor: isDarkMode
                            ? 'rgba(251, 191, 36, 0.2)'
                            : 'rgba(31, 79, 143, 0.16)',
                        },
                      }}
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => onDelete(rootMenu)}
                      disabled={
                        !canManage ||
                        Boolean(rootMenu.hasChildren) ||
                        deletePending
                      }
                      sx={{
                        color: isDarkMode ? '#f87171' : '#c53b3b',
                        bgcolor: isDarkMode
                          ? 'rgba(248, 113, 113, 0.12)'
                          : 'rgba(197, 59, 59, 0.08)',
                        '&:hover': {
                          bgcolor: isDarkMode
                            ? 'rgba(248, 113, 113, 0.2)'
                            : 'rgba(197, 59, 59, 0.16)',
                        },
                      }}
                    >
                      <DeleteOutlineOutlinedIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>

                {expandedIds.has(rootMenu.menuId)
                  ? children.map((childMenu) => (
                      <TableRow
                        key={childMenu.menuId}
                        sx={{
                          '& .MuiTableCell-root': {
                            backgroundColor: isDarkMode ? '#0f172a' : '#f8fbff',
                          },
                          '& .MuiTableCell-root:first-of-type': {
                            borderLeft: isDarkMode
                              ? '4px solid #fbbf24'
                              : '4px solid #1f4f8f',
                          },
                          '&:hover .MuiTableCell-root': {
                            backgroundColor: isDarkMode ? '#162032' : '#edf4ff',
                          },
                        }}
                      >
                        <TableCell />
                        <TableCell sx={{ pl: 4 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.75,
                            }}
                          >
                            <Box
                              component="span"
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: isDarkMode ? '#fbbf24' : '#1f4f8f',
                                flexShrink: 0,
                              }}
                            />
                            {childMenu.menuNm}
                          </Box>
                        </TableCell>
                        <TableCell>{childMenu.menuDc}</TableCell>
                        <TableCell>
                          {renderUrlCell(childMenu.menuUrl)}
                        </TableCell>
                        <TableCell align="center">
                          {childMenu.menuOrdr}
                        </TableCell>
                        <TableCell align="center">
                          {renderIconCell(childMenu.iconNm)}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={childMenu.useAt === 'Y' ? '사용' : '미사용'}
                            size="small"
                            color={
                              childMenu.useAt === 'Y' ? 'success' : 'default'
                            }
                            variant="filled"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => onEdit(childMenu)}
                            disabled={!canManage}
                            sx={{
                              mr: 0.25,
                              color: '#1f4f8f',
                              bgcolor: 'rgba(31, 79, 143, 0.08)',
                              '&:hover': { bgcolor: 'rgba(31, 79, 143, 0.16)' },
                            }}
                          >
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => onDelete(childMenu)}
                            disabled={
                              !canManage ||
                              Boolean(childMenu.hasChildren) ||
                              deletePending
                            }
                            sx={{
                              color: '#c53b3b',
                              bgcolor: 'rgba(197, 59, 59, 0.08)',
                              '&:hover': {
                                bgcolor: 'rgba(197, 59, 59, 0.16)',
                              },
                            }}
                          >
                            <DeleteOutlineOutlinedIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  : null}
              </Fragment>
            ))
          )}
        </TableBody>
      </AdminGrid>

      <GridPaginationBar
        pageIndex={pageIndex}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </>
  );
}
