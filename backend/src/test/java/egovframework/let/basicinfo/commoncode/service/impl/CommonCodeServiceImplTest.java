package egovframework.let.basicinfo.commoncode.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import org.junit.jupiter.api.Test;

import egovframework.let.basicinfo.commoncode.domain.model.CommonCodeGroupVO;
import egovframework.let.basicinfo.commoncode.domain.model.CommonCodeItemVO;

class CommonCodeServiceImplTest {

    private static CommonCodeGroupVO group(String code, String name) {
        CommonCodeGroupVO group = new CommonCodeGroupVO();
        group.setGroupCode(code);
        group.setGroupName(name);
        return group;
    }

    private static CommonCodeItemVO item(String groupCode, String code, String name) {
        CommonCodeItemVO item = new CommonCodeItemVO();
        item.setGroupCode(groupCode);
        item.setCode(code);
        item.setCodeName(name);
        return item;
    }

    private static String errorOf(List<CommonCodeGroupVO> groups, List<CommonCodeItemVO> details) {
        return assertThrows(IllegalArgumentException.class,
                () -> CommonCodeServiceImpl.validate(groups, details)).getMessage();
    }

    @Test
    void 정상_입력은_공백을_제거하고_통과한다() {
        CommonCodeGroupVO unit = group(" UNIT ", " 단위 ");
        CommonCodeItemVO kg = item(" UNIT ", " KG ", " 킬로그램 ");
        CommonCodeServiceImpl.validate(Arrays.asList(unit), Arrays.asList(kg));
        assertEquals("UNIT", unit.getGroupCode());
        assertEquals("단위", unit.getGroupName());
        assertEquals("UNIT", kg.getGroupCode());
        assertEquals("KG", kg.getCode());
        assertEquals("킬로그램", kg.getCodeName());
    }

    @Test
    void 그룹코드_누락() {
        assertEquals("신규 그룹: 그룹코드를 입력하세요.",
                errorOf(Arrays.asList(group(" ", "단위")), Collections.<CommonCodeItemVO>emptyList()));
    }

    @Test
    void 그룹명_누락() {
        assertEquals("UNIT: 그룹명을 입력하세요.",
                errorOf(Arrays.asList(group("UNIT", null)), Collections.<CommonCodeItemVO>emptyList()));
    }

    @Test
    void 그룹코드_중복() {
        assertEquals("UNIT: 그룹코드가 중복됩니다.",
                errorOf(Arrays.asList(group("UNIT", "단위"), group("UNIT", "단위2")),
                        Collections.<CommonCodeItemVO>emptyList()));
    }

    @Test
    void 상세의_그룹이_payload에_없음() {
        assertEquals("STORAGE: 그룹을 찾을 수 없습니다.",
                errorOf(Arrays.asList(group("UNIT", "단위")), Arrays.asList(item("STORAGE", "ROOM", "실온"))));
    }

    @Test
    void 상세코드_누락() {
        assertEquals("UNIT: 상세코드를 입력하세요.",
                errorOf(Arrays.asList(group("UNIT", "단위")), Arrays.asList(item("UNIT", "", "킬로그램"))));
    }

    @Test
    void 상세코드명_누락() {
        assertEquals("UNIT: 상세코드명을 입력하세요.",
                errorOf(Arrays.asList(group("UNIT", "단위")), Arrays.asList(item("UNIT", "KG", " "))));
    }

    @Test
    void 같은_그룹_상세코드_중복() {
        assertEquals("UNIT: 상세코드가 중복됩니다.",
                errorOf(Arrays.asList(group("UNIT", "단위")),
                        Arrays.asList(item("UNIT", "KG", "킬로그램"), item("UNIT", "KG", "킬로"))));
    }

    @Test
    void 다른_그룹이면_같은_상세코드_허용() {
        CommonCodeServiceImpl.validate(
                Arrays.asList(group("UNIT", "단위"), group("UNIT2", "단위2")),
                Arrays.asList(item("UNIT", "KG", "킬로그램"), item("UNIT2", "KG", "킬로그램")));
    }

    @Test
    void 코드_길이_초과() {
        String longCode = String.join("", Collections.nCopies(51, "A"));
        assertEquals(longCode + ": 그룹코드 길이는 50자 이하로 입력하세요.",
                errorOf(Arrays.asList(group(longCode, "단위")), Collections.<CommonCodeItemVO>emptyList()));
    }
}