package com.matrix.lawsuit.common.core.utils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;

/**
 * 日期工具类
 */
public class DateUtils {
    
    public static final String YYYY_MM_DD = "yyyy-MM-dd";
    public static final String YYYY_MM_DD_HH_MM_SS = "yyyy-MM-dd HH:mm:ss";
    public static final String YYYYMMDD = "yyyyMMdd";
    public static final String YYYYMMDDHHMMSS = "yyyyMMddHHmmss";
    
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern(YYYY_MM_DD);
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern(YYYY_MM_DD_HH_MM_SS);
    
    /**
     * 格式化日期
     */
    public static String formatDate(LocalDate date) {
        return date != null ? date.format(DATE_FORMATTER) : null;
    }
    
    /**
     * 格式化日期时间
     */
    public static String formatDateTime(LocalDateTime dateTime) {
        return dateTime != null ? dateTime.format(DATETIME_FORMATTER) : null;
    }
    
    /**
     * 格式化日期（自定义格式）
     */
    public static String formatDate(LocalDate date, String pattern) {
        return date != null ? date.format(DateTimeFormatter.ofPattern(pattern)) : null;
    }
    
    /**
     * 格式化日期时间（自定义格式）
     */
    public static String formatDateTime(LocalDateTime dateTime, String pattern) {
        return dateTime != null ? dateTime.format(DateTimeFormatter.ofPattern(pattern)) : null;
    }
    
    /**
     * 解析日期
     */
    public static LocalDate parseDate(String dateStr) {
        return dateStr != null ? LocalDate.parse(dateStr, DATE_FORMATTER) : null;
    }
    
    /**
     * 解析日期时间
     */
    public static LocalDateTime parseDateTime(String dateTimeStr) {
        return dateTimeStr != null ? LocalDateTime.parse(dateTimeStr, DATETIME_FORMATTER) : null;
    }
    
    /**
     * 计算两个日期之间的天数
     */
    public static long daysBetween(LocalDate startDate, LocalDate endDate) {
        return ChronoUnit.DAYS.between(startDate, endDate);
    }
    
    /**
     * 计算两个日期时间之间的天数
     */
    public static long daysBetween(LocalDateTime startDateTime, LocalDateTime endDateTime) {
        return ChronoUnit.DAYS.between(startDateTime, endDateTime);
    }
    
    /**
     * 获取当前日期
     */
    public static LocalDate now() {
        return LocalDate.now();
    }
    
    /**
     * 获取当前日期时间
     */
    public static LocalDateTime nowDateTime() {
        return LocalDateTime.now();
    }
    
    /**
     * 获取当前日期字符串
     */
    public static String nowStr() {
        return formatDate(now());
    }
    
    /**
     * 获取当前日期时间字符串
     */
    public static String nowDateTimeStr() {
        return formatDateTime(nowDateTime());
    }
}