package com.matrix.lawsuit.common.log.aspect;

import com.alibaba.fastjson.JSON;
import com.matrix.lawsuit.common.core.utils.DateUtils;
import com.matrix.lawsuit.common.log.annotation.OperationLog;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.AfterThrowing;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

/**
 * 操作日志切面
 */
@Aspect
@Component
public class OperationLogAspect {
    
    private static final Logger log = LoggerFactory.getLogger(OperationLogAspect.class);
    
    /**
     * 请求开始时间
     */
    private final ThreadLocal<Long> startTime = new ThreadLocal<>();
    
    /**
     * 操作日志信息
     */
    private final ThreadLocal<Map<String, Object>> logInfo = new ThreadLocal<>();
    
    /**
     * 前置通知
     */
    @Before("@annotation(operationLog)")
    public void doBefore(JoinPoint joinPoint, OperationLog operationLog) {
        startTime.set(System.currentTimeMillis());
        
        // 获取请求信息
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();
            
            Map<String, Object> logData = new HashMap<>();
            logData.put("operationType", operationLog.operationType());
            logData.put("operationName", operationLog.operationName());
            logData.put("description", operationLog.description());
            logData.put("businessType", operationLog.businessType());
            logData.put("requestUrl", request.getRequestURL().toString());
            logData.put("requestMethod", request.getMethod());
            logData.put("className", joinPoint.getTarget().getClass().getName());
            logData.put("methodName", joinPoint.getSignature().getName());
            logData.put("userAgent", request.getHeader("User-Agent"));
            logData.put("clientIp", getClientIp(request));
            logData.put("operationTime", DateUtils.nowDateTimeStr());
            
            // 保存请求参数
            if (operationLog.saveRequestData() && joinPoint.getArgs().length > 0) {
                try {
                    String requestParams = JSON.toJSONString(joinPoint.getArgs());
                    // 过滤敏感参数
                    if (operationLog.excludeParamNames().length > 0) {
                        for (String excludeParam : operationLog.excludeParamNames()) {
                            requestParams = requestParams.replaceAll("\"" + excludeParam + "\":\"[^\"]*\"", 
                                    "\"" + excludeParam + "\":\"***\"");
                        }
                    }
                    logData.put("requestParams", requestParams);
                } catch (Exception e) {
                    logData.put("requestParams", "参数序列化失败: " + e.getMessage());
                }
            }
            
            logInfo.set(logData);
        }
    }
    
    /**
     * 返回通知
     */
    @AfterReturning(pointcut = "@annotation(operationLog)", returning = "result")
    public void doAfterReturning(OperationLog operationLog, Object result) {
        handleLog(operationLog, result, null);
    }
    
    /**
     * 异常通知
     */
    @AfterThrowing(pointcut = "@annotation(operationLog)", throwing = "exception")
    public void doAfterThrowing(OperationLog operationLog, Exception exception) {
        handleLog(operationLog, null, exception);
    }
    
    /**
     * 处理日志
     */
    private void handleLog(OperationLog operationLog, Object result, Exception exception) {
        try {
            Map<String, Object> logData = logInfo.get();
            if (logData == null) {
                return;
            }
            
            // 计算执行时间
            Long start = startTime.get();
            if (start != null) {
                logData.put("executeTime", System.currentTimeMillis() - start);
            }
            
            // 保存响应结果
            if (operationLog.saveResponseData() && result != null) {
                try {
                    logData.put("responseData", JSON.toJSONString(result));
                } catch (Exception e) {
                    logData.put("responseData", "响应序列化失败: " + e.getMessage());
                }
            }
            
            // 保存异常信息
            if (exception != null) {
                logData.put("status", "FAIL");
                logData.put("errorMessage", exception.getMessage());
                logData.put("exception", exception.getClass().getName());
            } else {
                logData.put("status", "SUCCESS");
            }
            
            // 记录日志
            log.info("操作日志: {}", JSON.toJSONString(logData));
            
            // 这里可以扩展保存到数据库的逻辑
            // saveToDatabase(logData);
            
        } catch (Exception e) {
            log.error("记录操作日志失败: {}", e.getMessage(), e);
        } finally {
            // 清理ThreadLocal
            startTime.remove();
            logInfo.remove();
        }
    }
    
    /**
     * 获取客户端IP地址
     */
    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("HTTP_CLIENT_IP");
        }
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("HTTP_X_FORWARDED_FOR");
        }
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return "0:0:0:0:0:0:0:1".equals(ip) ? "127.0.0.1" : ip;
    }
}