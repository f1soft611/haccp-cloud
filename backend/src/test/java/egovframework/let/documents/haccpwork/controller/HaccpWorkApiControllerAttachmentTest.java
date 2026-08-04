package egovframework.let.documents.haccpwork.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import egovframework.com.cmm.ResponseCode;
import egovframework.com.cmm.service.ResultVO;
import egovframework.com.cmm.util.ResultVoHelper;
import egovframework.let.documents.haccpwork.service.HaccpWorkAttachmentService;
import egovframework.let.documents.haccpwork.service.HaccpWorkDraftService;
import egovframework.let.documents.haccpwork.service.HaccpWorkFlowService;

class HaccpWorkApiControllerAttachmentTest {

    private MockMvc mockMvc;
    private HaccpWorkAttachmentService attachmentService;

    @BeforeEach
    void setUp() {
        ResultVoHelper resultVoHelper = mock(ResultVoHelper.class);
        HaccpWorkDraftService draftService = mock(HaccpWorkDraftService.class);
        HaccpWorkFlowService flowService = mock(HaccpWorkFlowService.class);
        attachmentService = mock(HaccpWorkAttachmentService.class);

        HaccpWorkApiController controller = new HaccpWorkApiController(
                resultVoHelper,
                draftService,
                flowService,
                attachmentService);

        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();

        when(resultVoHelper.buildFromMap(anyMap(), any(ResponseCode.class))).thenAnswer(invocation -> {
            @SuppressWarnings("unchecked")
            Map<String, Object> map = (Map<String, Object>) invocation.getArgument(0);
            ResponseCode responseCode = invocation.getArgument(1);
            ResultVO result = new ResultVO();
            result.setResult(map);
            result.setResultCode(responseCode.getCode());
            result.setResultMessage(responseCode.getMessage());
            return result;
        });
    }

    @Test
    void presignUpload_returnsResultEnvelope() throws Exception {
        Map<String, Object> item = new HashMap<String, Object>();
        item.put("uploadToken", "token-1");
        item.put("uploadUrl", "https://example/upload");

        Map<String, Object> payload = new HashMap<String, Object>();
        payload.put("items", Collections.singletonList(item));

        when(attachmentService.presignUpload(eq(100L), eq("PLATFORM"), any(), eq(null), any(), any()))
                .thenReturn(payload);

        mockMvc.perform(post("/api/v1/haccp-work/approvals/100/attachments/presign-upload")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-tenant-code", "PLATFORM")
                        .content("{\"items\":[{\"fileName\":\"a.pdf\",\"contentType\":\"application/pdf\",\"fileSize\":123}]}")
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resultCode").value(200))
                .andExpect(jsonPath("$.result.items[0].uploadToken").value("token-1"));
    }

    @Test
    void completeUpload_returnsResultList() throws Exception {
        Map<String, Object> completed = new HashMap<String, Object>();
        completed.put("attachmentId", 88);
        completed.put("uploadStatus", "COMPLETED");

        when(attachmentService.completeUpload(eq(100L), eq("PLATFORM"), any(), eq(null)))
                .thenReturn(Arrays.asList(completed));

        mockMvc.perform(post("/api/v1/haccp-work/approvals/100/attachments/complete")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-tenant-code", "PLATFORM")
                        .content("{\"items\":[{\"uploadToken\":\"token-1\",\"objectKey\":\"k1\",\"fileName\":\"a.pdf\",\"contentType\":\"application/pdf\",\"fileSize\":123}]}")
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resultCode").value(200))
                .andExpect(jsonPath("$.result.resultList[0].attachmentId").value(88));
    }

    @Test
    void listAttachments_returnsResultList() throws Exception {
        Map<String, Object> item = new HashMap<String, Object>();
        item.put("attachmentId", 77);
        item.put("originalFileName", "a.pdf");

        when(attachmentService.listAttachments(eq(100L), eq("PLATFORM"), eq(null)))
                .thenReturn(Arrays.asList(item));

        mockMvc.perform(get("/api/v1/haccp-work/approvals/100/attachments")
                        .header("x-tenant-code", "PLATFORM"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resultCode").value(200))
                .andExpect(jsonPath("$.result.resultList[0].attachmentId").value(77));
    }

    @Test
    void presignDownload_returnsUrl() throws Exception {
        Map<String, Object> result = new HashMap<String, Object>();
        result.put("downloadUrl", "https://example/download");

        when(attachmentService.presignDownload(eq(100L), eq(77L), eq("PLATFORM"), eq(null), any(), any()))
                .thenReturn(result);

        mockMvc.perform(post("/api/v1/haccp-work/approvals/100/attachments/77/presign-download")
                        .header("x-tenant-code", "PLATFORM"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resultCode").value(200))
                .andExpect(jsonPath("$.result.downloadUrl").value("https://example/download"));
    }

    @Test
    void presignPreview_returnsUrl() throws Exception {
        Map<String, Object> result = new HashMap<String, Object>();
        result.put("previewUrl", "https://example/preview");

        when(attachmentService.presignPreview(eq(100L), eq(77L), eq("PLATFORM"), eq(null), any(), any()))
                .thenReturn(result);

        mockMvc.perform(post("/api/v1/haccp-work/approvals/100/attachments/77/presign-preview")
                        .header("x-tenant-code", "PLATFORM"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resultCode").value(200))
                .andExpect(jsonPath("$.result.previewUrl").value("https://example/preview"));
    }

    @Test
    void deleteAttachment_returnsSuccessMessage() throws Exception {
        mockMvc.perform(delete("/api/v1/haccp-work/approvals/100/attachments/77")
                        .header("x-tenant-code", "PLATFORM"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resultCode").value(200))
                .andExpect(jsonPath("$.result.message").value("첨부파일이 삭제되었습니다."));
    }
}
