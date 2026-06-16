package egovframework.let.uss.auth.service.impl;

import egovframework.let.uss.auth.service.FactoryRegistrationRequestVO;
import egovframework.let.uss.auth.service.FactoryRegistrationResultVO;
import egovframework.let.uss.auth.service.PlatformFactoryService;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service("platformFactoryService")
public class PlatformFactoryServiceImpl implements PlatformFactoryService {

    private final JdbcTemplate jdbcTemplate;

    public PlatformFactoryServiceImpl(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    @Transactional
    public FactoryRegistrationResultVO registerFactory(FactoryRegistrationRequestVO requestVO) {
        validateRequest(requestVO);

        // Unique 제약 충돌에 대비해 코드 생성+삽입을 제한된 횟수로 재시도한다.
        for (int attempt = 0; attempt < 5; attempt++) {
            String maxCode = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(MAX(factory_code), '000000') FROM tb_factoryinfo WHERE factory_code ~ '^[0-9]{6}$'",
                    String.class
            );

            String factoryCode = FactoryCodeGenerator.nextFactoryCode(maxCode);
            String tenantCode = "TENANT_" + factoryCode;

            try {
                jdbcTemplate.update(
                        "INSERT INTO tb_factoryinfo (factory_code, factory_nm, tenant_code, admin_email) VALUES (?, ?, ?, ?)",
                        factoryCode,
                        requestVO.getFactoryNm().trim(),
                        tenantCode,
                        emptyToNull(requestVO.getAdminEmail())
                );

                FactoryRegistrationResultVO resultVO = new FactoryRegistrationResultVO();
                resultVO.setFactoryCode(factoryCode);
                resultVO.setFactoryNm(requestVO.getFactoryNm().trim());
                resultVO.setTenantCode(tenantCode);
                resultVO.setAdminEmail(emptyToNull(requestVO.getAdminEmail()));
                return resultVO;
            } catch (DuplicateKeyException ex) {
                // concurrent create. retry with fresh max code.
            }
        }

        throw new IllegalStateException("Unable to generate unique factory code");
    }

    private void validateRequest(FactoryRegistrationRequestVO requestVO) {
        if (requestVO == null || requestVO.getFactoryNm() == null || requestVO.getFactoryNm().trim().isEmpty()) {
            throw new IllegalArgumentException("factoryNm is required");
        }
    }

    private String emptyToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
