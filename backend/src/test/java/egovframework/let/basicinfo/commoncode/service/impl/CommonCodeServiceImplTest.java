package egovframework.let.basicinfo.commoncode.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.*;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.function.Executable;

import egovframework.let.basicinfo.commoncode.domain.model.CommonCodeGroupVO;
import egovframework.let.basicinfo.commoncode.domain.model.CommonCodeItemVO;

class CommonCodeServiceImplTest {

    private static final Set<String> ACTIVE = new HashSet<String>(Arrays.asList("UNIT", "UNIT2"));
    private static final Map<String, Set<String>> NO_PARENTS = Collections.<String, Set<String>>emptyMap();

    // UNIT2 는 상위그룹이 있고, 상위그룹의 사용 중 상세는 WEIGHT 하나
    private static final Map<String, Set<String>> UNIT2_PARENTS = Collections.<String, Set<String>>singletonMap(
            "UNIT2", new HashSet<String>(Arrays.asList("WEIGHT")));

    private static CommonCodeGroupVO group(String code, String name) {
        CommonCodeGroupVO group = new CommonCodeGroupVO();
        group.setGroupCode(code);
        group.setGroupName(name);
        return group;
    }

    private static CommonCodeGroupVO group(String code, String name, String parentGroupCode) {
        CommonCodeGroupVO group = group(code, name);
        group.setParentGroupCode(parentGroupCode);
        return group;
    }

    private static CommonCodeItemVO item(String groupCode, String code, String name) {
        CommonCodeItemVO item = new CommonCodeItemVO();
        item.setGroupCode(groupCode);
        item.setCode(code);
        item.setCodeName(name);
        return item;
    }

    private static CommonCodeItemVO item(String groupCode, String code, String name, String parentCode) {
        CommonCodeItemVO item = item(groupCode, code, name);
        item.setParentCode(parentCode);
        return item;
    }

    private static String errorOf(Executable executable) {
        return assertThrows(IllegalArgumentException.class, executable).getMessage();
    }

    private static String groupError(List<CommonCodeGroupVO> groups) {
        return errorOf(() -> CommonCodeServiceImpl.validateGroups(groups));
    }

    private static String itemError(List<CommonCodeItemVO> details) {
        return errorOf(() -> CommonCodeServiceImpl.validateItems(details, ACTIVE, NO_PARENTS));
    }

    private static String parentItemError(List<CommonCodeItemVO> details) {
        return errorOf(() -> CommonCodeServiceImpl.validateItems(details, ACTIVE, UNIT2_PARENTS));
    }

    @Test
    void 그룹_정상_입력은_공백을_제거하고_통과한다() {
        CommonCodeGroupVO unit = group(" UNIT ", " 단위 ");
        CommonCodeServiceImpl.validateGroups(Arrays.asList(unit));
        assertEquals("UNIT", unit.getGroupCode());
        assertEquals("단위", unit.getGroupName());
    }

    @Test
    void 상세_정상_입력은_공백을_제거하고_통과한다() {
        CommonCodeItemVO kg = item(" UNIT ", " KG ", " 킬로그램 ");
        CommonCodeServiceImpl.validateItems(Arrays.asList(kg), ACTIVE, NO_PARENTS);
        assertEquals("UNIT", kg.getGroupCode());
        assertEquals("KG", kg.getCode());
        assertEquals("킬로그램", kg.getCodeName());
    }

    @Test
    void 그룹코드_누락() {
        assertEquals("신규 그룹: 그룹코드를 입력하세요.", groupError(Arrays.asList(group(" ", "단위"))));
    }

    @Test
    void 그룹명_누락() {
        assertEquals("UNIT: 그룹명을 입력하세요.", groupError(Arrays.asList(group("UNIT", null))));
    }

    @Test
    void 그룹코드_중복() {
        assertEquals("UNIT: 그룹코드가 중복됩니다.",
                groupError(Arrays.asList(group("UNIT", "단위"), group("UNIT", "단위2"))));
    }

    @Test
    void 코드_길이_초과() {
        String longCode = String.join("", Collections.nCopies(51, "A"));
        assertEquals(longCode + ": 그룹코드 길이는 50자 이하로 입력하세요.",
                groupError(Arrays.asList(group(longCode, "단위"))));
    }

    @Test
    void 상세의_그룹이_사용중이_아님() {
        assertEquals("STORAGE: 사용 중인 그룹이 아닙니다.",
                itemError(Arrays.asList(item("STORAGE", "ROOM", "실온"))));
    }

    @Test
    void 상세코드_누락() {
        assertEquals("UNIT: 상세코드를 입력하세요.", itemError(Arrays.asList(item("UNIT", "", "킬로그램"))));
    }

    @Test
    void 상세코드명_누락() {
        assertEquals("UNIT: 상세코드명을 입력하세요.", itemError(Arrays.asList(item("UNIT", "KG", " "))));
    }

    @Test
    void 같은_그룹_상세코드_중복() {
        assertEquals("UNIT: 상세코드가 중복됩니다.",
                itemError(Arrays.asList(item("UNIT", "KG", "킬로그램"), item("UNIT", "KG", "킬로"))));
    }

    @Test
    void 다른_그룹이면_같은_상세코드_허용() {
        CommonCodeServiceImpl.validateItems(
            Arrays.asList(item("UNIT", "KG", "킬로그램"), item("UNIT2", "KG", "킬로그램")), ACTIVE, NO_PARENTS);
    }

    @Test
    void 상위그룹은_공백을_제거하고_뒤에_나오는_그룹도_참조할_수_있다() {
        CommonCodeGroupVO child = group("ITEM_UNIT", "품목 단위", " ITEM ");
        CommonCodeServiceImpl.validateGroups(Arrays.asList(child, group("ITEM", "품목", "")));
        assertEquals("ITEM", child.getParentGroupCode());
    }

    @Test
    void 상위그룹_자기참조() {
        assertEquals("ITEM: 상위그룹으로 자기 자신을 지정할 수 없습니다.",
                groupError(Arrays.asList(group("ITEM", "품목", "ITEM"))));
    }

    @Test
    void 상위그룹이_목록에_없음() {
        assertEquals("ITEM_UNIT: 상위그룹이 목록에 없습니다.",
                groupError(Arrays.asList(group("ITEM_UNIT", "품목 단위", "ITEM"))));
    }

    @Test
    void 상위그룹이_있는_그룹의_상세는_상위코드가_필수() {
        assertEquals("UNIT2: 상위코드를 선택하세요.",
                parentItemError(Arrays.asList(item("UNIT2", "G", "그램", " "))));
    }

    @Test
    void 상위그룹의_사용중_상세가_아니면_오류() {
        assertEquals("UNIT2: 사용 중인 상위코드가 아닙니다.",
                parentItemError(Arrays.asList(item("UNIT2", "G", "그램", "COUNT"))));
    }

    @Test
    void 상위코드는_공백을_제거하고_통과한다() {
        CommonCodeItemVO gram = item("UNIT2", "G", "그램", " WEIGHT ");
        CommonCodeServiceImpl.validateItems(Arrays.asList(gram), ACTIVE, UNIT2_PARENTS);
        assertEquals("WEIGHT", gram.getParentCode());
    }

    @Test
    void 상위그룹이_없는_그룹의_상세는_상위코드를_비운다() {
        CommonCodeItemVO kg = item("UNIT", "KG", "킬로그램", "WEIGHT");
        CommonCodeServiceImpl.validateItems(Arrays.asList(kg), ACTIVE, UNIT2_PARENTS);
        assertEquals("", kg.getParentCode());
    }

    @Test
    void 상위그룹에_사용중_상세가_없으면_상위코드_검증_대상이_아니다() {
        Map<String, String> parentGroupByGroup = new HashMap<String, String>();
        parentGroupByGroup.put("COMBO_OK_NG", "EDITOR_COMBO");
        parentGroupByGroup.put("UNIT2", "ITEM");
        // item() 헬퍼는 useAt 을 안 넣으므로(boolean 기본 false) 직접 켠다
        CommonCodeItemVO weight = item("ITEM", "WEIGHT", "중량형");
        weight.setUseAt(true);

        Map<String, Set<String>> result =
                CommonCodeServiceImpl.buildParentCodesByGroup(parentGroupByGroup, Arrays.asList(weight));

        assertEquals(false, result.containsKey("COMBO_OK_NG"));
        assertEquals(new HashSet<String>(Arrays.asList("WEIGHT")), result.get("UNIT2"));
    }
}