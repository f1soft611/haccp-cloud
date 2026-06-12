package egovframework.com.cmm;

import egovframework.com.cmm.exception.BizException;
import org.springframework.dao.DataAccessException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BizException.class)
    public Map<String, Object> handleBizException(BizException e) {
        Map<String, Object> res = new HashMap<>();
        res.put("resultCode", "FAIL");
        res.put("resultMessage", e.getMessage());
        res.put("message", e.getMessage());
        return res;
    }

    @ExceptionHandler(DataAccessException.class)
    public Map<String, Object> handleDataAccessException(DataAccessException e) {
        Throwable t = e;
        String msg = null;

        while (t != null) {
            // MSSQL JDBC 예외 메시지 우선
            if (t instanceof com.microsoft.sqlserver.jdbc.SQLServerException) {
                msg = t.getMessage();
                break;
            }
            t = t.getCause();
        }

        if (msg == null) {
            msg = e.getMessage();
        }

        Map<String, Object> res = new HashMap<>();
        res.put("resultCode", "FAIL");
        res.put("message", msg);
        res.put("resultMessage", msg);
        return res;
    }

    @ExceptionHandler(IllegalStateException.class)
    public Map<String, Object> handleIllegalStateException(IllegalStateException e) {
        Map<String, Object> res = new HashMap<>();
        res.put("resultCode", "FAIL");
        res.put("message", e.getMessage());
        res.put("resultMessage", e.getMessage());
        return res;
    }

    @ExceptionHandler(Exception.class)
    public Map<String, Object> handleException(Exception e) {
        Map<String, Object> res = new HashMap<>();
        res.put("resultCode", "FAIL");
        res.put("message", "서버 처리 중 오류가 발생했습니다.");
        res.put("resultMessage", "서버 처리 중 오류가 발생했습니다.");
        return res;
    }
}
