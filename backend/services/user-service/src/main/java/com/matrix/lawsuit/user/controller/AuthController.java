package com.matrix.lawsuit.user.controller;

import com.matrix.lawsuit.common.core.domain.Result;
import com.matrix.lawsuit.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 认证控制器
 */
@Tag(name = "认证管理", description = "用户认证相关接口")
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    
    private final UserService userService;
    
    @Operation(summary = "用户登录")
    @PostMapping("/login")
    public Result<UserService.LoginResponse> login(@RequestBody LoginRequest request) {
        return userService.login(request.getUsername(), request.getPassword());
    }
    
    @Operation(summary = "用户注册")
    @PostMapping("/register")
    public Result<String> register(@RequestBody RegisterRequest request) {
        UserService.RegisterRequest serviceRequest = new UserService.RegisterRequest();
        serviceRequest.setUsername(request.getUsername());
        serviceRequest.setPassword(request.getPassword());
        serviceRequest.setRealName(request.getRealName());
        serviceRequest.setPhone(request.getPhone());
        serviceRequest.setEmail(request.getEmail());
        serviceRequest.setUserType(request.getUserType());
        
        return userService.register(serviceRequest);
    }
    
    @Operation(summary = "获取验证码")
    @GetMapping("/captcha")
    public Result<String> getCaptcha() {
        // TODO: 实现验证码生成
        return Result.success("验证码生成成功");
    }
    
    @Operation(summary = "用户登出")
    @PostMapping("/logout")
    public Result<String> logout() {
        // TODO: 实现登出逻辑（清除token缓存等）
        return Result.success("登出成功");
    }
    
    /**
     * 登录请求参数
     */
    public static class LoginRequest {
        private String username;
        private String password;
        private String captcha;
        
        // getters and setters
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        public String getCaptcha() { return captcha; }
        public void setCaptcha(String captcha) { this.captcha = captcha; }
    }
    
    /**
     * 注册请求参数
     */
    public static class RegisterRequest {
        private String username;
        private String password;
        private String realName;
        private String phone;
        private String email;
        private Integer userType;
        
        // getters and setters
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        public String getRealName() { return realName; }
        public void setRealName(String realName) { this.realName = realName; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public Integer getUserType() { return userType; }
        public void setUserType(Integer userType) { this.userType = userType; }
    }
}