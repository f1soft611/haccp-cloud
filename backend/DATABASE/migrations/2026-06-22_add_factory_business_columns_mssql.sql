IF COL_LENGTH('tb_factoryinfo', 'corporate_number') IS NULL
BEGIN
    ALTER TABLE tb_factoryinfo ADD corporate_number NVARCHAR(50) NULL;
END;

IF COL_LENGTH('tb_factoryinfo', 'business_type') IS NULL
BEGIN
    ALTER TABLE tb_factoryinfo ADD business_type NVARCHAR(100) NULL;
END;

IF COL_LENGTH('tb_factoryinfo', 'business_category') IS NULL
BEGIN
    ALTER TABLE tb_factoryinfo ADD business_category NVARCHAR(100) NULL;
END;
