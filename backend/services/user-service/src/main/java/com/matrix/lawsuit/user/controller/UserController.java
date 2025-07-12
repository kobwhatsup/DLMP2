package com.matrix.lawsuit.user.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.matrix.lawsuit.common.core.domain.Result;
import com.matrix.lawsuit.user.entity.User;
import com.matrix.lawsuit.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 用户管理控制器
 */
@Tag(name = "用户管理", description = "用户管理相关接口")
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {
    
    private final UserService userService;
    
    @Operation(summary = "分页查询用户列表")
    @GetMapping
    public Result<IPage<User>> getUsers(
            @Parameter(description = "页码", example = "1") @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "每页大小", example = "10") @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "搜索关键词") @RequestParam(required = false) String keyword) {
        return userService.getUsers(page, size, keyword);
    }
    
    @Operation(summary = "根据ID获取用户信息")
    @GetMapping("/{id}")
    public Result<User> getUserById(@Parameter(description = "用户ID") @PathVariable Long id) {
        return userService.getUserById(id);
    }
    
    @Operation(summary = "更新用户信息")
    @PutMapping("/{id}")
    public Result<String> updateUser(
            @Parameter(description = "用户ID") @PathVariable Long id,
            @RequestBody UpdateUserRequest request) {
        
        UserService.UpdateUserRequest serviceRequest = new UserService.UpdateUserRequest();
        serviceRequest.setRealName(request.getRealName());
        serviceRequest.setPhone(request.getPhone());
        serviceRequest.setEmail(request.getEmail());
        serviceRequest.setStatus(request.getStatus());
        
        return userService.updateUser(id, serviceRequest);
    }
    
    @Operation(summary = "删除用户")
    @DeleteMapping("/{id}")
    public Result<String> deleteUser(@Parameter(description = "用户ID") @PathVariable Long id) {
        return userService.deleteUser(id);
    }
    
    @Operation(summary = "修改密码")
    @PostMapping("/{id}/password")
    public Result<String> changePassword(
            @Parameter(description = "用户ID") @PathVariable Long id,
            @RequestBody ChangePasswordRequest request) {
        return userService.changePassword(id, request.getOldPassword(), request.getNewPassword());
    }
    
    /**
     * 更新用户请求参数
     */
    public static class UpdateUserRequest {
        private String realName;
        private String phone;
        private String email;
        private Integer status;
        
        // getters and setters
        public String getRealName() { return realName; }
        public void setRealName(String realName) { this.realName = realName; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public Integer getStatus() { return status; }
        public void setStatus(Integer status) { this.status = status; }
    }
    
    /**
     * 修改密码请求参数
     */
    public static class ChangePasswordRequest {
        private String oldPassword;
        private String newPassword;
        
        // getters and setters
        public String getOldPassword() { return oldPassword; }
        public void setOldPassword(String oldPassword) { this.oldPassword = oldPassword; }
        public String getNewPassword() { return newPassword; }
        public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
    }
}