package egovframework.let.platform_admin.access.web;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface PlanAccessPolicy {

    String menuUrl();

    String featureCode();

    PlanAccessLevel requiredPermissionLevel();

    boolean skipRolePermissionCheck() default false;

    String limitFeatureCode() default "";
}