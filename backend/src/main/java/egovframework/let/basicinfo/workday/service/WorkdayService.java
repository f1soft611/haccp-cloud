package egovframework.let.basicinfo.workday.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import egovframework.let.basicinfo.workday.domain.model.WeekVO;
import egovframework.let.basicinfo.workday.domain.model.WorkdayGenerateRequestVO;
import egovframework.let.basicinfo.workday.domain.model.WorkdaySaveRequestVO;
import egovframework.let.basicinfo.workday.domain.model.WorkdayVO;

/**
 * 업무일 관리를 위한 서비스 인터페이스
 * @author SHMT-MES
 * @since 2026.11.03
 * @version 1.0
 */
public interface WorkdayService {

    List<WorkdayVO> listWorkdays(String tenantCode, int year) throws Exception;

    void saveWorkdays(WorkdaySaveRequestVO payload) throws Exception;

    // 연도 데이터가 있고 overwrite=false 면 BizException
    void checkGeneratable(WorkdayGenerateRequestVO payload) throws Exception;

    // holidays 는 트랜잭션 밖(컨트롤러)에서 미리 받아 넘긴다
    void generateWorkdays(WorkdayGenerateRequestVO payload, Map<LocalDate, String> holidays) throws Exception;

    // from ~ to 와 겹치는 주차 (YYYY-MM-DD)
    List<WeekVO> listWeeks(String tenantCode, String from, String to) throws Exception;

}