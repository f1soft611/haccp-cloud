package egovframework.let.platform_admin.tenants.service.exception;

public class MailConfigurationException extends RuntimeException {

    public MailConfigurationException(String message) {
        super(message);
    }

    public MailConfigurationException(String message, Throwable cause) {
        super(message, cause);
    }
}
