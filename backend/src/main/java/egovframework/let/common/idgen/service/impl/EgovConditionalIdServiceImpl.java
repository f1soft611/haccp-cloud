package egovframework.let.common.idgen.service.impl;

import egovframework.let.common.idgen.domain.model.ConditionalIdKey;
import egovframework.let.common.idgen.domain.repository.ConditionalIdDAO;
import egovframework.let.common.idgen.service.EgovConditionalIdService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service("egovConditionalIdService")
@RequiredArgsConstructor
public class EgovConditionalIdServiceImpl implements EgovConditionalIdService {

    private static final String NONE_TOKEN = "__NONE__";
    private static final int TABLE_NAME_MAX_LENGTH = 30;
    private static final int CONDITION_MAX_LENGTH = 50;

    private final ConditionalIdDAO conditionalIdDAO;

    @Override
    @Transactional
    public String getNextStringId(String tableName, String condition1, String condition2, String prefix, int cipers, char fillChar) throws Exception {
        if (!StringUtils.hasText(tableName)) {
            throw new IllegalArgumentException("tableName must not be empty");
        }
        if (cipers < 0) {
            throw new IllegalArgumentException("cipers must be greater than or equal to 0");
        }

        ConditionalIdKey key = new ConditionalIdKey();
        key.setTableName(validateLength(tableName.trim(), TABLE_NAME_MAX_LENGTH, "tableName"));
        key.setCondition1(normalizeCondition(condition1));
        key.setCondition2(normalizeCondition(condition2));

        Long nextId = conditionalIdDAO.nextConditionalId(key);
        if (nextId == null) {
            throw new IllegalStateException("Failed to generate conditional id");
        }

        return buildId(prefix, nextId, cipers, fillChar);
    }

    private String normalizeCondition(String condition) {
        if (!StringUtils.hasText(condition)) {
            return NONE_TOKEN;
        }
        return validateLength(condition.trim(), CONDITION_MAX_LENGTH, "condition");
    }

    private String validateLength(String value, int maxLength, String fieldName) {
        if (value.length() > maxLength) {
            throw new IllegalArgumentException(fieldName + " length must be less than or equal to " + maxLength);
        }
        return value;
    }

    private String buildId(String prefix, long nextId, int cipers, char fillChar) {
        String numberPart = String.valueOf(nextId);

        if (cipers > 0 && numberPart.length() < cipers) {
            StringBuilder builder = new StringBuilder(cipers);
            for (int i = numberPart.length(); i < cipers; i++) {
                builder.append(fillChar);
            }
            builder.append(numberPart);
            numberPart = builder.toString();
        }

        if (!StringUtils.hasText(prefix)) {
            return numberPart;
        }

        return prefix + numberPart;
    }
}
