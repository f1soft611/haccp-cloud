package egovframework.let.platform_admin.tenants.service.exception;

public class MailAuthenticationFailureException extends RuntimeException {

    public MailAuthenticationFailureException(String message) {
        super(message);
    }

    public MailAuthenticationFailureException(String message, Throwable cause) {
        super(message, cause);
    }
}
