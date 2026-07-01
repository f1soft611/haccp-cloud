package egovframework.let.platform_admin.access.web;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class EndpointAccessRule {
    private final String httpMethod;
    private final String pathPattern;
    private final String menuUrl;
    private final String requiredPermissionLevel;
    private final String featureCode;
    private final String limitFeatureCode;
}
