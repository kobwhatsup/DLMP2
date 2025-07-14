package com.dlmp.aspect;

import com.dlmp.config.PerformanceConfig;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 性能监控切面
 * 用于监控方法执行时间和性能指标
 */
@Aspect
@Component
@Profile({"production", "performance"})
public class PerformanceAspect {
    
    private static final Logger logger = LoggerFactory.getLogger(PerformanceAspect.class);
    private static final Logger performanceLogger = LoggerFactory.getLogger("performance");
    
    /**
     * 监控Service层方法执行时间
     */
    @Around("execution(* com.dlmp.service..*.*(..))")
    public Object monitorServiceMethods(ProceedingJoinPoint joinPoint) throws Throwable {
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = joinPoint.getSignature().getName();
        String fullMethodName = className + "." + methodName;
        
        long startTime = System.currentTimeMillis();
        
        try {
            Object result = joinPoint.proceed();
            long executionTime = System.currentTimeMillis() - startTime;
            
            // 记录性能日志
            performanceLogger.info("Service方法执行时间 - {}: {}ms", fullMethodName, executionTime);
            
            // 超过阈值记录警告
            if (executionTime > 1000) {
                logger.warn("Service方法执行时间过长: {} - {}ms", fullMethodName, executionTime);
            }
            
            return result;
        } catch (Exception e) {
            long executionTime = System.currentTimeMillis() - startTime;
            logger.error("Service方法执行异常: {} - {}ms - {}", fullMethodName, executionTime, e.getMessage());
            throw e;
        }
    }
    
    /**
     * 监控Controller层方法执行时间
     */
    @Around("execution(* com.dlmp.controller..*.*(..))")
    public Object monitorControllerMethods(ProceedingJoinPoint joinPoint) throws Throwable {
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = joinPoint.getSignature().getName();
        String fullMethodName = className + "." + methodName;
        
        long startTime = System.currentTimeMillis();
        
        try {
            Object result = joinPoint.proceed();
            long executionTime = System.currentTimeMillis() - startTime;
            
            performanceLogger.info("Controller方法执行时间 - {}: {}ms", fullMethodName, executionTime);
            
            // API响应时间超过3秒记录警告
            if (executionTime > 3000) {
                logger.warn("API响应时间过长: {} - {}ms", fullMethodName, executionTime);
            }
            
            return result;
        } catch (Exception e) {
            long executionTime = System.currentTimeMillis() - startTime;
            logger.error("Controller方法执行异常: {} - {}ms - {}", fullMethodName, executionTime, e.getMessage());
            throw e;
        }
    }
    
    /**
     * 监控Repository层方法执行时间
     */
    @Around("execution(* com.dlmp.repository..*.*(..))")
    public Object monitorRepositoryMethods(ProceedingJoinPoint joinPoint) throws Throwable {
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = joinPoint.getSignature().getName();
        String fullMethodName = className + "." + methodName;
        
        long startTime = System.currentTimeMillis();
        
        try {
            Object result = joinPoint.proceed();
            long executionTime = System.currentTimeMillis() - startTime;
            
            performanceLogger.info("Repository方法执行时间 - {}: {}ms", fullMethodName, executionTime);
            
            // 数据库操作超过500ms记录警告
            if (executionTime > 500) {
                logger.warn("数据库操作时间过长: {} - {}ms", fullMethodName, executionTime);
            }
            
            return result;
        } catch (Exception e) {
            long executionTime = System.currentTimeMillis() - startTime;
            logger.error("Repository方法执行异常: {} - {}ms - {}", fullMethodName, executionTime, e.getMessage());
            throw e;
        }
    }
    
    /**
     * 监控标记了@PerformanceMonitor注解的方法
     */
    @Around("@annotation(performanceMonitor)")
    public Object monitorAnnotatedMethods(ProceedingJoinPoint joinPoint, PerformanceMonitor performanceMonitor) throws Throwable {
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = joinPoint.getSignature().getName();
        String fullMethodName = className + "." + methodName;
        
        long startTime = System.currentTimeMillis();
        
        try {
            Object result = joinPoint.proceed();
            long executionTime = System.currentTimeMillis() - startTime;
            
            performanceLogger.info("自定义监控方法执行时间 - {}: {}ms [{}]", 
                                   fullMethodName, executionTime, performanceMonitor.description());
            
            // 使用注解中定义的阈值
            if (executionTime > performanceMonitor.threshold()) {
                logger.warn("自定义监控方法执行时间超过阈值: {} - {}ms > {}ms [{}]", 
                           fullMethodName, executionTime, performanceMonitor.threshold(), performanceMonitor.description());
            }
            
            return result;
        } catch (Exception e) {
            long executionTime = System.currentTimeMillis() - startTime;
            logger.error("自定义监控方法执行异常: {} - {}ms - {} [{}]", 
                        fullMethodName, executionTime, e.getMessage(), performanceMonitor.description());
            throw e;
        }
    }
    
    /**
     * 监控缓存操作
     */
    @Around("@annotation(org.springframework.cache.annotation.Cacheable) || " +
            "@annotation(org.springframework.cache.annotation.CachePut) || " +
            "@annotation(org.springframework.cache.annotation.CacheEvict)")
    public Object monitorCacheOperations(ProceedingJoinPoint joinPoint) throws Throwable {
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = joinPoint.getSignature().getName();
        String fullMethodName = className + "." + methodName;
        
        long startTime = System.currentTimeMillis();
        
        try {
            Object result = joinPoint.proceed();
            long executionTime = System.currentTimeMillis() - startTime;
            
            performanceLogger.info("缓存操作执行时间 - {}: {}ms", fullMethodName, executionTime);
            
            // 缓存操作超过100ms记录警告
            if (executionTime > 100) {
                logger.warn("缓存操作时间过长: {} - {}ms", fullMethodName, executionTime);
            }
            
            return result;
        } catch (Exception e) {
            long executionTime = System.currentTimeMillis() - startTime;
            logger.error("缓存操作异常: {} - {}ms - {}", fullMethodName, executionTime, e.getMessage());
            throw e;
        }
    }
}

/**
 * 性能监控注解
 * 用于标记需要特殊监控的方法
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@interface PerformanceMonitor {
    
    /**
     * 监控描述
     */
    String description() default "";
    
    /**
     * 性能阈值（毫秒）
     */
    long threshold() default 1000;
    
    /**
     * 是否记录方法参数
     */
    boolean logParameters() default false;
    
    /**
     * 是否记录返回结果
     */
    boolean logResult() default false;
}