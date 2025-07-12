package com.matrix.lawsuit.common.log.annotation;

import java.lang.annotation.*;

/**
 * 操作日志注解
 */
@Target({ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface OperationLog {
    
    /**
     * 操作类型
     */
    String operationType() default "";
    
    /**
     * 操作名称
     */
    String operationName() default "";
    
    /**
     * 操作描述
     */
    String description() default "";
    
    /**
     * 业务类型
     */
    String businessType() default "";
    
    /**
     * 是否保存请求参数
     */
    boolean saveRequestData() default true;
    
    /**
     * 是否保存响应参数
     */
    boolean saveResponseData() default true;
    
    /**
     * 是否排除敏感属性字段
     */
    String[] excludeParamNames() default {};
}