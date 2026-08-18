import { Alert, Stack } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { GridPaginationBar } from '../../../shared/components/data/GridPaginationBar';
import { ConfirmDialog } from '../../../shared/components/feedback/ConfirmDialog';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { useGridPagination } from '../../../shared/hooks/useGridPagination';
import { useAuthStore } from '../../../shared/store/authStore';
import {
  createCustomer,
  deleteCustomer,
  listCustomersPaged,
  updateCustomer,
  type CustomerItem,
} from '../../../services/basicinfo/customersService';
import {
  CustomersSearchBar,
  type CustomersSearchValue,
} from './components/CustomersSearchBar';
import { CustomersGrid } from './components/CustomersGrid';
import {
  CustomerFormDialog,
  type CustomerFormValue,
} from './components/CustomerFormDialog';

export function CustomersPage() {
  const queryClient = useQueryClient();
  const tenantCode = useAuthStore((state) => state.tenantCode);
  const { pageIndex, pageSize, setPageIndex, setPageSize, resetPage } =
    useGridPagination();

  const [searchValue, setSearchValue] = useState<CustomersSearchValue>({
    keyword: '',
    filterActive: 'all',
  });
  const [appliedSearch, setAppliedSearch] = useState<CustomersSearchValue>({
    keyword: '',
    filterActive: 'all',
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerItem | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<CustomerItem | null>(null);

  const customersQuery = useQuery({
    queryKey: [
      'basicinfo-customers',
      tenantCode || 'self',
      pageIndex,
      pageSize,
      appliedSearch.keyword,
      appliedSearch.filterActive,
    ],
    queryFn: () =>
      listCustomersPaged({
        tenantCode: tenantCode || undefined,
        pageIndex,
        pageSize,
        keyword: appliedSearch.keyword || undefined,
        filterActive: appliedSearch.filterActive,
      }),
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      setFormOpen(false);
      setEditingCustomer(null);
      resetPage();
      void queryClient.invalidateQueries({
        queryKey: ['basicinfo-customers', tenantCode || 'self'],
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateCustomer,
    onSuccess: () => {
      setFormOpen(false);
      setEditingCustomer(null);
      void queryClient.invalidateQueries({
        queryKey: ['basicinfo-customers', tenantCode || 'self'],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      setDeleteTarget(null);
      resetPage();
      void queryClient.invalidateQueries({
        queryKey: ['basicinfo-customers', tenantCode || 'self'],
      });
    },
  });

  const handleSearch = () => {
    resetPage();
    setAppliedSearch({
      keyword: searchValue.keyword.trim(),
      filterActive: searchValue.filterActive,
    });
  };

  const handleOpenCreate = () => {
    setEditingCustomer(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (customer: CustomerItem) => {
    setEditingCustomer(customer);
    setFormOpen(true);
  };

  const handleSubmitForm = (value: CustomerFormValue) => {
    const payload = {
      tenantCode: tenantCode || undefined,
      ...value,
    };

    if (editingCustomer) {
      updateMutation.mutate({
        id: editingCustomer.id,
        ...payload,
      });
      return;
    }

    createMutation.mutate(payload);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) {
      return;
    }
    deleteMutation.mutate({
      tenantCode: tenantCode || undefined,
      id: deleteTarget.id,
    });
  };

  return (
    <Stack spacing={2} data-testid="basicinfo-customers-page">
      <PageHeader
        groupLabel="기준정보 관리"
        title="거래처관리"
        description="원부자재 매입처 등 거래처 기준정보를 관리합니다."
      />

      {customersQuery.isError ? (
        <Alert severity="warning">거래처 목록을 불러오지 못했습니다.</Alert>
      ) : null}

      <CustomersSearchBar
        value={searchValue}
        disabled={customersQuery.isLoading}
        onChange={setSearchValue}
        onSearch={handleSearch}
        onCreate={handleOpenCreate}
      />

      <CustomersGrid
        rows={customersQuery.data?.items ?? []}
        loading={customersQuery.isLoading}
        onEdit={handleOpenEdit}
        onDelete={(customer) => setDeleteTarget(customer)}
      />

      <GridPaginationBar
        pageIndex={pageIndex}
        pageSize={pageSize}
        totalCount={customersQuery.data?.totalCount ?? 0}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
      />

      <CustomerFormDialog
        open={formOpen}
        mode={editingCustomer ? 'edit' : 'create'}
        saving={createMutation.isPending || updateMutation.isPending}
        customerCode={editingCustomer?.customerCode}
        initialValue={
          editingCustomer
            ? {
                customerName: editingCustomer.customerName,
                custNameAbbr: editingCustomer.custNameAbbr,
                presidentName: editingCustomer.presidentName,
                businessNo: editingCustomer.businessNo,
                juridNo: editingCustomer.juridNo,
                businessStatus1: editingCustomer.businessStatus1,
                businessItem1: editingCustomer.businessItem1,
                postCode: editingCustomer.postCode,
                address: editingCustomer.address,
                telephoneNo: editingCustomer.telephoneNo,
                facsimileNo: editingCustomer.facsimileNo,
                custMemo: editingCustomer.custMemo,
                active: editingCustomer.active,
              }
            : undefined
        }
        onClose={() => {
          if (createMutation.isPending || updateMutation.isPending) {
            return;
          }
          setFormOpen(false);
          setEditingCustomer(null);
        }}
        onSubmit={handleSubmitForm}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="거래처 삭제"
        description={
          deleteTarget
            ? `'${deleteTarget.customerName}' 거래처를 삭제하시겠습니까? 삭제 후에는 되돌릴 수 없습니다.`
            : '거래처를 삭제하시겠습니까?'
        }
        confirmText="삭제"
        confirmColor="error"
        loading={deleteMutation.isPending}
        onClose={() => {
          if (deleteMutation.isPending) {
            return;
          }
          setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </Stack>
  );
}
