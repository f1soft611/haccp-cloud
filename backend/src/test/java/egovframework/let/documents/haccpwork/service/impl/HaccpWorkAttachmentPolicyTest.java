package egovframework.let.documents.haccpwork.service.impl;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Arrays;
import java.util.Collections;

import org.junit.jupiter.api.Test;

import egovframework.let.documents.haccpwork.domain.model.HaccpAttachmentPolicy;
import egovframework.let.documents.haccpwork.domain.model.HaccpAttachmentUploadRequestVO;

class HaccpWorkAttachmentPolicyTest {

    @Test
    void validateSingle_shouldRejectDisallowedExtension() {
        HaccpAttachmentPolicy policy = new HaccpAttachmentPolicy(
                20L * 1024L * 1024L,
                20,
                100L * 1024L * 1024L,
                Arrays.asList("pdf", "png"));

        assertThatThrownBy(() -> policy.validateSingle("virus.exe", "application/octet-stream", 100L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("확장자");
    }

    @Test
    void validateSingle_shouldRejectWhenFileSizeExceedsLimit() {
        HaccpAttachmentPolicy policy = new HaccpAttachmentPolicy(
                1024L,
                20,
                10240L,
                Arrays.asList("pdf"));

        assertThatThrownBy(() -> policy.validateSingle("a.pdf", "application/pdf", 1025L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("크기");
    }

    @Test
    void validateBatch_shouldRejectWhenCountExceedsLimit() {
        HaccpAttachmentPolicy policy = new HaccpAttachmentPolicy(
                1024L,
                1,
                10240L,
                Arrays.asList("pdf"));

        HaccpAttachmentUploadRequestVO first = new HaccpAttachmentUploadRequestVO();
        first.setOriginalFileName("a.pdf");
        first.setContentType("application/pdf");
        first.setFileSize(100L);

        HaccpAttachmentUploadRequestVO second = new HaccpAttachmentUploadRequestVO();
        second.setOriginalFileName("b.pdf");
        second.setContentType("application/pdf");
        second.setFileSize(100L);

        assertThatThrownBy(() -> policy.validateBatch(Arrays.asList(first, second)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("개수");
    }

    @Test
    void validateBatch_shouldRejectWhenTotalSizeExceedsLimit() {
        HaccpAttachmentPolicy policy = new HaccpAttachmentPolicy(
                1024L,
                10,
                150L,
                Arrays.asList("pdf"));

        HaccpAttachmentUploadRequestVO first = new HaccpAttachmentUploadRequestVO();
        first.setOriginalFileName("a.pdf");
        first.setContentType("application/pdf");
        first.setFileSize(100L);

        HaccpAttachmentUploadRequestVO second = new HaccpAttachmentUploadRequestVO();
        second.setOriginalFileName("b.pdf");
        second.setContentType("application/pdf");
        second.setFileSize(60L);

        assertThatThrownBy(() -> policy.validateBatch(Arrays.asList(first, second)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("총 용량");
    }

    @Test
    void validateBatch_shouldAllowValidRequest() {
        HaccpAttachmentPolicy policy = new HaccpAttachmentPolicy(
                1024L,
                10,
                10000L,
                Arrays.asList("pdf", "png"));

        HaccpAttachmentUploadRequestVO request = new HaccpAttachmentUploadRequestVO();
        request.setOriginalFileName("a.pdf");
        request.setContentType("application/pdf");
        request.setFileSize(100L);

        assertThatCode(() -> policy.validateBatch(Collections.singletonList(request)))
                .doesNotThrowAnyException();
    }

    @Test
    void validateSingle_shouldRejectWhenContentTypeIsBlank() {
        HaccpAttachmentPolicy policy = new HaccpAttachmentPolicy(
                1024L,
                10,
                10000L,
                Arrays.asList("pdf"));

        assertThatThrownBy(() -> policy.validateSingle("a.pdf", " ", 100L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("콘텐츠 타입");
    }

    @Test
    void validateBatch_shouldUseFileNameWhenOriginalFileNameMissing() {
        HaccpAttachmentPolicy policy = new HaccpAttachmentPolicy(
                1024L,
                10,
                10000L,
                Arrays.asList("pdf"));

        HaccpAttachmentUploadRequestVO request = new HaccpAttachmentUploadRequestVO();
        request.setFileName("fallback.pdf");
        request.setContentType("application/pdf");
        request.setFileSize(100L);

        assertThatCode(() -> policy.validateBatch(Collections.singletonList(request)))
                .doesNotThrowAnyException();
    }

    @Test
    void validateSingle_shouldAllowUpperCaseExtension() {
        HaccpAttachmentPolicy policy = new HaccpAttachmentPolicy(
                1024L,
                10,
                10000L,
                Arrays.asList("pdf"));

        assertThatCode(() -> policy.validateSingle("A.PDF", "application/pdf", 100L))
                .doesNotThrowAnyException();
    }
}
