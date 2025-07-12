package com.matrix.lawsuit.common.core.domain;

import lombok.Data;

import java.io.Serializable;

/**
 * 统一响应结果
 */
@Data
public class Result<T> implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    /**
     * 成功状态码
     */
    public static final int SUCCESS = 200;
    
    /**
     * 失败状态码
     */
    public static final int FAIL = 500;
    
    /**
     * 响应状态码
     */
    private int code;
    
    /**
     * 响应消息
     */
    private String message;
    
    /**
     * 响应数据
     */
    private T data;
    
    /**
     * 请求ID
     */
    private String requestId;
    
    /**
     * 时间戳
     */
    private Long timestamp;
    
    public Result() {
        this.timestamp = System.currentTimeMillis();
    }
    
    public Result(int code, String message) {
        this();
        this.code = code;
        this.message = message;
    }
    
    public Result(int code, String message, T data) {
        this(code, message);
        this.data = data;
    }
    
    /**
     * 成功响应
     */
    public static <T> Result<T> success() {
        return new Result<>(SUCCESS, "操作成功");
    }
    
    /**
     * 成功响应（带数据）
     */
    public static <T> Result<T> success(T data) {
        return new Result<>(SUCCESS, "操作成功", data);
    }
    
    /**
     * 成功响应（带消息和数据）
     */
    public static <T> Result<T> success(String message, T data) {
        return new Result<>(SUCCESS, message, data);
    }
    
    /**
     * 失败响应
     */
    public static <T> Result<T> fail() {
        return new Result<>(FAIL, "操作失败");
    }
    
    /**
     * 失败响应（带消息）
     */
    public static <T> Result<T> fail(String message) {
        return new Result<>(FAIL, message);
    }
    
    /**
     * 失败响应（带状态码和消息）
     */
    public static <T> Result<T> fail(int code, String message) {
        return new Result<>(code, message);
    }
    
    /**
     * 判断是否成功
     */
    public boolean isSuccess() {
        return SUCCESS == code;
    }
    
    /**
     * 判断是否失败
     */
    public boolean isFail() {
        return !isSuccess();
    }
}