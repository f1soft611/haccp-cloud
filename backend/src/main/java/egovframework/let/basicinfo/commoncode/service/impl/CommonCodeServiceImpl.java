package egovframework.let.basicinfo.commoncode.service.impl;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.egovframe.rte.fdl.cmmn.EgovAbstractServiceImpl;
import org.springframework.stereotype.Service;

import egovframework.let.basicinfo.commoncode.domain.model.CommonCodeGroupVO;
import egovframework.let.basicinfo.commoncode.domain.model.CommonCodeItemVO;
import egovframework.let.basicinfo.commoncode.domain.model.CommonCodeSaveRequestVO;
import egovframework.let.basicinfo.commoncode.service.CommonCodeService;

/**
 * 공통코드 관리를 위한 서비스 구현 클래스
 * @author SHMT-MES
 * @since 2026.10.08
 * @version 1.0
 */
@Service("commonCodeService")
public class CommonCodeServiceImpl extends EgovAbstractServiceImpl implements CommonCodeService {

    private static final int MAX_CODE_LENGTH = 50;
    private static final int MAX_NAME_LENGTH = 200;
    private static final int MAX_DESC_LENGTH = 500;

    @Override
    public Map<String, Object> getCommonCodes(String tenantCode) throws Exception {
        throw new UnsupportedOperationException("Task 4에서 구현");
    }

    @Override
    public void saveCommonCodes(CommonCodeSaveRequestVO payload) throws Exception {
        throw new UnsupportedOperationException("Task 4에서 구현");
    }

    // ── 검증 ─────────────────────────────────────────

    // 화면 validateCommonCodes와 같은 문구. 코드/명은 trim 해서 VO에 다시 넣는다.
    static void validate(List<CommonCodeGroupVO> groups, List<CommonCodeItemVO> details) {
        Set<String> groupCodes = new HashSet<String>();
        for (CommonCodeGroupVO group : groups) {
            group.setGroupCode(trim(group.getGroupCode()));
            group.setGroupName(trim(group.getGroupName()));
            String label = labelOf(group.getGroupCode());
            if (group.getGroupCode().isEmpty()) {
                throw new IllegalArgumentException(label + ": 그룹코드를 입력하세요.");
            }
            if (group.getGroupName().isEmpty()) {
                throw new IllegalArgumentException(label + ": 그룹명을 입력하세요.");
            }
            checkLength(label, "그룹코드", group.getGroupCode(), MAX_CODE_LENGTH);
            checkLength(label, "그룹명", group.getGroupName(), MAX_NAME_LENGTH);
            checkLength(label, "그룹 설명", group.getGroupDesc(), MAX_DESC_LENGTH);
            if (!groupCodes.add(group.getGroupCode())) {
                throw new IllegalArgumentException(label + ": 그룹코드가 중복됩니다.");
            }
        }

        Set<String> itemKeys = new HashSet<String>();
        for (CommonCodeItemVO detail : details) {
            detail.setGroupCode(trim(detail.getGroupCode()));
            detail.setCode(trim(detail.getCode()));
            detail.setCodeName(trim(detail.getCodeName()));
            String label = labelOf(detail.getGroupCode());
            if (!groupCodes.contains(detail.getGroupCode())) {
                throw new IllegalArgumentException(label + ": 그룹을 찾을 수 없습니다.");
            }
            if (detail.getCode().isEmpty()) {
                throw new IllegalArgumentException(label + ": 상세코드를 입력하세요.");
            }
            if (detail.getCodeName().isEmpty()) {
                throw new IllegalArgumentException(label + ": 상세코드명을 입력하세요.");
            }
            checkLength(label, "상세코드", detail.getCode(), MAX_CODE_LENGTH);
            checkLength(label, "상세코드명", detail.getCodeName(), MAX_NAME_LENGTH);
            checkLength(label, "설명", detail.getCodeDesc(), MAX_DESC_LENGTH);
            if (!itemKeys.add(detail.getGroupCode() + ":" + detail.getCode())) {
                throw new IllegalArgumentException(label + ": 상세코드가 중복됩니다.");
            }
        }
    }

    private static void checkLength(String label, String fieldName, String value, int max) {
        if (value != null && value.length() > max) {
            throw new IllegalArgumentException(label + ": " + fieldName + " 길이는 " + max + "자 이하로 입력하세요.");
        }
    }

    private static String labelOf(String code) {
        return code.isEmpty() ? "신규 그룹" : code;
    }

    private static String trim(String value) {
        return value == null ? "" : value.trim();
    }
}