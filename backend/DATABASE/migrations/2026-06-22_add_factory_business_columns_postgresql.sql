ALTER TABLE tb_factoryinfo
    ADD COLUMN IF NOT EXISTS corporate_number VARCHAR(50);

ALTER TABLE tb_factoryinfo
    ADD COLUMN IF NOT EXISTS business_type VARCHAR(100);

ALTER TABLE tb_factoryinfo
    ADD COLUMN IF NOT EXISTS business_category VARCHAR(100);
