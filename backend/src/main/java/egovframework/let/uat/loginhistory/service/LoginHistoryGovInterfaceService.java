package egovframework.let.uat.loginhistory.service;

/**
 * 로그인 이력을 정부 로그 API로 전송하는 서비스 인터페이스
 */
public interface LoginHistoryGovInterfaceService {

    /**
     * 스케줄러에서 호출되는 정부 로그 전송 실행 메서드
     * @param fromDate 조회 시작일 (동적 스케줄러 시그니처 호환용)
     * @param toDate 조회 종료일 (동적 스케줄러 시그니처 호환용)
     * @throws Exception 예외
     */
    void executeInterface(String fromDate, String toDate) throws Exception;
}
