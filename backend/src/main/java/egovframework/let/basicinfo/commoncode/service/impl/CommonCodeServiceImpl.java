package egovframework.let.basicinfo.commoncode.service.impl;

import java.util.*;

import javax.annotation.Resource;

import egovframework.let.basicinfo.commoncode.domain.repository.CommonCodeDAO;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

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

    @Resource(name = "commonCodeDAO")
    private CommonCodeDAO commonCodeDAO;

    @Override
    public Map<String, Object> getCommonCodes(String tenantCode) throws Exception {
        Long tenantId = resolveTenantId(tenantCode);
        Map<String, Object> result = new HashMap<String, Object>();
        result.put("groups", commonCodeDAO.selectGroupList(tenantId));
        result.put("details", commonCodeDAO.selectItemList(tenantId));
        return result;
    }

//    @Override
//    @Transactional
//    public void saveCommonCodes(CommonCodeSaveRequestVO payload) throws Exception {
//        List<CommonCodeGroupVO> groups = payload.getGroups();
//        List<CommonCodeItemVO> details = payload.getDetails();
//        validateGroups(groups);
//
//        Long tenantId = resolveTenantId(payload.getTenantCode());
//        Long userId = resolveOperatorUserId(payload);
//
//        Map<String, Long> groupIdByCode = new HashMap<String, Long>();
//        for (CommonCodeGroupVO group : groups) {
//            Map<String, Object> params = new HashMap<String, Object>();
//            params.put("tenantId", tenantId);
//            params.put("groupCode", group.getGroupCode());
//            params.put("groupName", group.getGroupName());
//            params.put("groupDesc", normalizeNullable(group.getGroupDesc()));
//            params.put("userId", userId);
//            groupIdByCode.put(group.getGroupCode(), commonCodeDAO.upsertGroup(params));
//        }
//
//        for (CommonCodeItemVO detail : details) {
//            Map<String, Object> params = new HashMap<String, Object>();
//            params.put("tenantId", tenantId);
//            params.put("groupId", groupIdByCode.get(detail.getGroupCode()));
//            params.put("code", detail.getCode());
//            params.put("codeName", detail.getCodeName());
//            params.put("codeDesc", normalizeNullable(detail.getCodeDesc()));
//            // sort_order는 NOT NULL 컬럼, 화면에서 비우면 0
//            params.put("sortOrder", detail.getSortOrder() != null ? detail.getSortOrder() : 0);
//            params.put("useAt", detail.isUseAt() ? "Y" : "N");
//            params.put("userId", userId);
//            commonCodeDAO.upsertItem(params);
//        }
//
//        Map<String, Object> deleteParams = new HashMap<String, Object>();
//        deleteParams.put("tenantId", tenantId);
//        deleteParams.put("groups", groups);
//        deleteParams.put("details", details);
//        commonCodeDAO.deleteMissing(deleteParams);
//    }

    // 변경 -> saveGroups / saveItems 로 분리, 물리 삭제 없음
    // ponytail: 마지막 저장이 이김. 동시 편집 충돌 감지가 필요해지면 updated_at 비교 추가
    @Override
    @Transactional
    public void saveGroups(CommonCodeSaveRequestVO payload) throws Exception {
        List<CommonCodeGroupVO> groups = payload.getGroups();
        validateGroups(groups);

        Long tenantId = resolveTenantId(payload.getTenantCode());
        Long userId = resolveOperatorUserId(payload);

        for (CommonCodeGroupVO group : groups) {
            Map<String, Object> params = new HashMap<String, Object>();
            params.put("tenantId", tenantId);
            params.put("groupCode", group.getGroupCode());
            params.put("groupName", group.getGroupName());
            params.put("groupDesc", normalizeNullable(group.getGroupDesc()));
            params.put("userId", userId);
            commonCodeDAO.upsertGroup(params);
        }

        Map<String, Object> disableParams = new HashMap<String, Object>();
        disableParams.put("tenantId", tenantId);
        disableParams.put("userId", userId);
        disableParams.put("groups", groups);
        commonCodeDAO.disableMissingGroups(disableParams);
    }

    @Override
    @Transactional
    public void saveItems(CommonCodeSaveRequestVO payload) throws Exception {
        List<CommonCodeItemVO> details = payload.getDetails();
        Long tenantId = resolveTenantId(payload.getTenantCode());

        Set<String> activeGroupCodes = new HashSet<String>();
        for (CommonCodeGroupVO group : commonCodeDAO.selectGroupList(tenantId)) {
            activeGroupCodes.add(group.getGroupCode());
        }
        validateItems(details, activeGroupCodes);

        Long userId = resolveOperatorUserId(payload);
        for (CommonCodeItemVO detail : details) {
            Map<String, Object> params = new HashMap<String, Object>();
            params.put("tenantId", tenantId);
            params.put("groupCode", detail.getGroupCode());
            params.put("code", detail.getCode());
            params.put("codeName", detail.getCodeName());
            params.put("codeDesc", normalizeNullable(detail.getCodeDesc()));
            // sort_order는 NOT NULL 컬럼, 화면에서 비우면 0
            params.put("sortOrder", detail.getSortOrder() != null ? detail.getSortOrder() : 0);
            params.put("useAt", detail.isUseAt() ? "Y" : "N");
            params.put("userId", userId);
            commonCodeDAO.upsertItem(params);
        }
    }

    // ── 헬퍼 ─────────────────────────────────────────

    private Long resolveTenantId(String tenantCode) throws Exception {
        String normalized = StringUtils.hasText(tenantCode) ? tenantCode.trim().toUpperCase() : "";
        Long tenantId = commonCodeDAO.selectTenantIdByCode(normalized);
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "테넌트를 찾을 수 없습니다: " + normalized);
        }
        return tenantId;
    }

    private Long resolveOperatorUserId(CommonCodeSaveRequestVO payload) throws Exception {
        if (payload.getOperatorTenantId() == null || !StringUtils.hasText(payload.getOperatorLoginCode())) {
            return null;
        }
        Map<String, Object> params = new HashMap<String, Object>();
        params.put("tenantId", payload.getOperatorTenantId());
        params.put("loginCode", payload.getOperatorLoginCode().trim());
        return commonCodeDAO.selectUserIdByLoginCode(params);
    }

    private String normalizeNullable(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    // ── 검증 ─────────────────────────────────────────

    // 기존 -> validate(groups, details): 그룹/상세를 한 번에 검증 (상세 그룹은 payload 그룹에 있어야 함)
    // 변경 -> 그룹 저장/상세 저장이 분리되어 검증도 분리. 상세 그룹은 DB의 사용 중(use_at='Y') 그룹이어야 함.
    // 화면 검증과 같은 문구. 코드/명은 trim 해서 VO에 다시 넣는다.
    static void validateGroups(List<CommonCodeGroupVO> groups) {
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
    }

    static void validateItems(List<CommonCodeItemVO> details, Set<String> activeGroupCodes) {
        Set<String> itemKeys = new HashSet<String>();
        for (CommonCodeItemVO detail : details) {
            detail.setGroupCode(trim(detail.getGroupCode()));
            detail.setCode(trim(detail.getCode()));
            detail.setCodeName(trim(detail.getCodeName()));
            String label = labelOf(detail.getGroupCode());
            if (!activeGroupCodes.contains(detail.getGroupCode())) {
                throw new IllegalArgumentException(label + ": 사용 중인 그룹이 아닙니다.");
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