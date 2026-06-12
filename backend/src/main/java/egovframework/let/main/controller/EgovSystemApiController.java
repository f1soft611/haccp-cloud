package egovframework.let.main.controller;

import egovframework.com.cmm.ResponseCode;
import egovframework.com.cmm.service.ResultVO;
import egovframework.com.cmm.util.ResultVoHelper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * 시스템 관련 API 컨트롤러
 * @author SHMT-MES
 * @since 2026.01.20
 * @version 1.0
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/system")
@Tag(name = "EgovSystemApiController", description = "시스템 관리")
public class EgovSystemApiController {

    private final ResultVoHelper resultVoHelper;

    /**
     * 서버 시간 조회
     * 클라이언트-서버 시간 동기화를 위한 API
     */
    @Operation(
            summary = "서버 시간 조회",
            description = "서버의 현재 시간을 조회합니다. 클라이언트-서버 시간 동기화에 사용됩니다.",
            security = {@SecurityRequirement(name = "Authorization")},
            tags = {"EgovSystemApiController"}
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "403", description = "인가된 사용자가 아님")
    })
    @GetMapping("/server-time")
    public ResultVO getServerTime() {
        Map<String, Object> result = new HashMap<>();
        
        Date now = new Date();
        
        // 타임스탬프 (밀리초)
        result.put("serverTime", now.getTime());
        
        // 날짜 포맷 (yyyy-MM-dd)
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
        result.put("serverDate", dateFormat.format(now));
        
        // 날짜시간 포맷 (yyyy-MM-dd'T'HH:mm:ss)
        SimpleDateFormat dateTimeFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss");
        result.put("serverDateTime", dateTimeFormat.format(now));
        
        // ISO 8601 포맷
        SimpleDateFormat isoFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
        result.put("serverISODateTime", isoFormat.format(now));
        
        return resultVoHelper.buildFromMap(result, ResponseCode.SUCCESS);
    }
}
