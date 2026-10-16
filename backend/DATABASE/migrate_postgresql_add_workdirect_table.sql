-- 재실행 가능: IF NOT EXISTS
CREATE TABLE IF NOT EXISTS public.tb_workdirect (
                                                    workdirect_id     bigserial PRIMARY KEY,                 -- 작업지시ID
                                                    tenant_id         bigint NOT NULL,                       -- 사업장(테넌트)ID
                                                    workdt_no         varchar(12) NOT NULL,                  -- 작업지시번호(yyyyMMdd+순번4자리)
    workdt_date       date,                                  -- 작업등록일
    prod_plan_date    date,                                  -- 생산계획일
    material_id       bigint NOT NULL,                       -- 품목ID(tb_material_info)
    customer_id       bigint,                                -- 거래처ID(tb_customer_info)
    expiration_date   date,                                  -- 소비기한
    prod_dept_id      bigint,                                -- 생산부서
    prodplan_qty      numeric(10,5),                         -- 생산량(직접입력)
    mix_qty_kg        double precision,                      -- 배합량(생산량 기준 자동계산, 수정가능)
    mix_workdt_status varchar(20),                           -- 작업지시구분(포장계획/배합계획)
    mix_batch_cnt     numeric(10,5),                         -- 배치수량
    batch_seq         integer,                               -- 배치순번
    prod_memo         varchar(255),                          -- 비고
    mix_qty_stdunit   numeric(10,5),                         -- 표준배합량(적정량)
    limit_mix_qty     numeric(10,5),                         -- 배합한도량(총한도)
    prodqty_boxcan    numeric(10,5),                         -- 생산량(BOX/CAN)
    mix_equip_id      bigint,                                -- 배합설비ID(tb_equipment_info)
    packing_equip_id  bigint,                                -- 포장설비ID(tb_equipment_info)
    finish_status     varchar(20),                           -- 생산완료구분
    system_lot_no     varchar(20),                           -- LOT번호
    work_proc_status  varchar(20),                           -- 작업취소구분
    use_at            char(1) NOT NULL DEFAULT 'Y',          -- 사용(삭제)여부
    created_by        varchar(10),                           -- 등록자
    created_at        timestamp DEFAULT CURRENT_TIMESTAMP,   -- 등록일시
    updated_by        varchar(10),                           -- 수정자
    updated_at        timestamp,                             -- 수정일시
    FOREIGN KEY (tenant_id) REFERENCES public.tb_tenant (tenant_id),
    FOREIGN KEY (material_id, tenant_id) REFERENCES public.tb_material_info (material_id, tenant_id),
    FOREIGN KEY (customer_id, tenant_id) REFERENCES public.tb_customer_info (customer_id, tenant_id),
    FOREIGN KEY (mix_equip_id, tenant_id) REFERENCES public.tb_equipment_info (equipment_id, tenant_id),
    FOREIGN KEY (packing_equip_id, tenant_id) REFERENCES public.tb_equipment_info (equipment_id, tenant_id)
    );

CREATE UNIQUE INDEX IF NOT EXISTS uq_workdirect_id_tenant_id ON public.tb_workdirect (workdirect_id, tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_tb_workdirect_tenant_workdt_no ON public.tb_workdirect (tenant_id, workdt_no);
CREATE INDEX IF NOT EXISTS ix_tb_workdirect_tenant_plan_date ON public.tb_workdirect (tenant_id, prod_plan_date);
CREATE INDEX IF NOT EXISTS ix_tb_workdirect_material_id ON public.tb_workdirect (material_id);
CREATE INDEX IF NOT EXISTS ix_tb_workdirect_customer_id ON public.tb_workdirect (customer_id);

COMMENT ON TABLE public.tb_workdirect IS 'TPR504';
COMMENT ON COLUMN public.tb_workdirect.workdirect_id IS '작업지시ID';
COMMENT ON COLUMN public.tb_workdirect.tenant_id IS '사업장(테넌트)ID';
COMMENT ON COLUMN public.tb_workdirect.workdt_no IS '작업지시번호(yyyyMMdd+순번4자리)';
COMMENT ON COLUMN public.tb_workdirect.workdt_date IS '작업등록일';
COMMENT ON COLUMN public.tb_workdirect.prod_plan_date IS '생산계획일';
COMMENT ON COLUMN public.tb_workdirect.material_id IS '품목ID(tb_material_info)';
COMMENT ON COLUMN public.tb_workdirect.customer_id IS '거래처ID(tb_customer_info)';
COMMENT ON COLUMN public.tb_workdirect.expiration_date IS '소비기한';
COMMENT ON COLUMN public.tb_workdirect.prod_dept_id IS '생산부서';
COMMENT ON COLUMN public.tb_workdirect.prodplan_qty IS '생산량(직접입력)';
COMMENT ON COLUMN public.tb_workdirect.mix_qty_kg IS '배합량(생산량 기준 자동계산, 수정가능)';
COMMENT ON COLUMN public.tb_workdirect.mix_workdt_status IS '작업지시구분(포장계획/배합계획)';
COMMENT ON COLUMN public.tb_workdirect.mix_batch_cnt IS '배치수량';
COMMENT ON COLUMN public.tb_workdirect.batch_seq IS '배치순번';
COMMENT ON COLUMN public.tb_workdirect.prod_memo IS '비고';
COMMENT ON COLUMN public.tb_workdirect.mix_qty_stdunit IS '표준배합량(적정량)';
COMMENT ON COLUMN public.tb_workdirect.limit_mix_qty IS '배합한도량(총한도)';
COMMENT ON COLUMN public.tb_workdirect.prodqty_boxcan IS '생산량(BOX/CAN)';
COMMENT ON COLUMN public.tb_workdirect.mix_equip_id IS '배합설비ID(tb_equipment_info)';
COMMENT ON COLUMN public.tb_workdirect.packing_equip_id IS '포장설비ID(tb_equipment_info)';
COMMENT ON COLUMN public.tb_workdirect.finish_status IS '생산완료구분';
COMMENT ON COLUMN public.tb_workdirect.system_lot_no IS 'LOT번호';
COMMENT ON COLUMN public.tb_workdirect.work_proc_status IS '작업취소구분';
COMMENT ON COLUMN public.tb_workdirect.use_at IS '사용(삭제)여부';
COMMENT ON COLUMN public.tb_workdirect.created_by IS '등록자';
COMMENT ON COLUMN public.tb_workdirect.created_at IS '등록일시';
COMMENT ON COLUMN public.tb_workdirect.updated_by IS '수정자';
COMMENT ON COLUMN public.tb_workdirect.updated_at IS '수정일시';