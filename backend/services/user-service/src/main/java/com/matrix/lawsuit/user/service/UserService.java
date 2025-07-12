package com.matrix.lawsuit.user.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.matrix.lawsuit.common.core.domain.Result;
import com.matrix.lawsuit.common.core.exception.BusinessException;
import com.matrix.lawsuit.common.security.utils.JwtUtils;
import com.matrix.lawsuit.user.entity.User;
import com.matrix.lawsuit.user.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Objects;

/**
 * 用户服务实现类
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserService extends ServiceImpl<UserMapper, User> {
    
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    
    /**
     * 用户登录
     */
    public Result<LoginResponse> login(String username, String password) {
        if (!StringUtils.hasText(username) || !StringUtils.hasText(password)) {
            return Result.error("用户名和密码不能为空");
        }
        
        // 查询用户
        User user = getOne(new LambdaQueryWrapper<User>()
            .eq(User::getUsername, username)
            .eq(User::getDeleted, 0));
        
        if (user == null) {
            return Result.error("用户不存在");
        }
        
        // 检查用户状态
        if (user.getStatus() == 0) {
            return Result.error("账户已被禁用");
        }
        
        // 验证密码
        if (!passwordEncoder.matches(password, user.getPassword())) {
            return Result.error("密码错误");
        }
        
        // 生成JWT token
        String token = jwtUtils.generateToken(user.getId().toString(), username);
        
        LoginResponse response = new LoginResponse();
        response.setToken(token);
        response.setUserId(user.getId());
        response.setUsername(user.getUsername());
        response.setRealName(user.getRealName());
        response.setUserType(user.getUserType());
        
        log.info("用户登录成功: {}", username);
        return Result.success(response);
    }
    
    /**
     * 用户注册
     */
    @Transactional
    public Result<String> register(RegisterRequest request) {
        // 参数校验
        if (!StringUtils.hasText(request.getUsername()) || 
            !StringUtils.hasText(request.getPassword()) ||
            !StringUtils.hasText(request.getRealName())) {
            return Result.error("必填字段不能为空");
        }
        
        // 检查用户名是否已存在
        boolean exists = exists(new LambdaQueryWrapper<User>()
            .eq(User::getUsername, request.getUsername())
            .eq(User::getDeleted, 0));
        
        if (exists) {
            return Result.error("用户名已存在");
        }
        
        // 检查手机号是否已存在
        if (StringUtils.hasText(request.getPhone())) {
            boolean phoneExists = exists(new LambdaQueryWrapper<User>()
                .eq(User::getPhone, request.getPhone())
                .eq(User::getDeleted, 0));
            
            if (phoneExists) {
                return Result.error("手机号已被注册");
            }
        }
        
        // 创建用户
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRealName(request.getRealName());
        user.setPhone(request.getPhone());
        user.setEmail(request.getEmail());
        user.setUserType(request.getUserType());
        user.setStatus(1); // 默认启用
        user.setDeleted(0);
        user.setCreatedTime(LocalDateTime.now());
        
        boolean success = save(user);
        if (success) {
            log.info("用户注册成功: {}", request.getUsername());
            return Result.success("注册成功");
        } else {
            return Result.error("注册失败");
        }
    }
    
    /**
     * 分页查询用户
     */
    public Result<IPage<User>> getUsers(int page, int size, String keyword) {
        Page<User> pageParam = new Page<>(page, size);
        
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<User>()
            .eq(User::getDeleted, 0);
        
        if (StringUtils.hasText(keyword)) {
            wrapper.and(w -> w
                .like(User::getUsername, keyword)
                .or()
                .like(User::getRealName, keyword)
                .or()
                .like(User::getPhone, keyword));
        }
        
        wrapper.orderByDesc(User::getCreatedTime);
        
        IPage<User> result = page(pageParam, wrapper);
        
        // 移除密码字段
        result.getRecords().forEach(user -> user.setPassword(null));
        
        return Result.success(result);
    }
    
    /**
     * 根据ID获取用户信息
     */
    public Result<User> getUserById(Long id) {
        User user = getById(id);
        if (user == null || user.getDeleted() == 1) {
            return Result.error("用户不存在");
        }
        
        // 移除密码字段
        user.setPassword(null);
        return Result.success(user);
    }
    
    /**
     * 更新用户信息
     */
    @Transactional
    public Result<String> updateUser(Long id, UpdateUserRequest request) {
        User user = getById(id);
        if (user == null || user.getDeleted() == 1) {
            return Result.error("用户不存在");
        }
        
        // 更新字段
        if (StringUtils.hasText(request.getRealName())) {
            user.setRealName(request.getRealName());
        }
        if (StringUtils.hasText(request.getPhone())) {
            // 检查手机号是否被其他用户使用
            boolean phoneExists = exists(new LambdaQueryWrapper<User>()
                .eq(User::getPhone, request.getPhone())
                .ne(User::getId, id)
                .eq(User::getDeleted, 0));
            
            if (phoneExists) {
                return Result.error("手机号已被其他用户使用");
            }
            user.setPhone(request.getPhone());
        }
        if (StringUtils.hasText(request.getEmail())) {
            user.setEmail(request.getEmail());
        }
        if (request.getStatus() != null) {
            user.setStatus(request.getStatus());
        }
        
        user.setUpdatedTime(LocalDateTime.now());
        
        boolean success = updateById(user);
        if (success) {
            log.info("用户信息更新成功: {}", user.getUsername());
            return Result.success("更新成功");
        } else {
            return Result.error("更新失败");
        }
    }
    
    /**
     * 删除用户（逻辑删除）
     */
    @Transactional
    public Result<String> deleteUser(Long id) {
        User user = getById(id);
        if (user == null || user.getDeleted() == 1) {
            return Result.error("用户不存在");
        }
        
        user.setDeleted(1);
        user.setUpdatedTime(LocalDateTime.now());
        
        boolean success = updateById(user);
        if (success) {
            log.info("用户删除成功: {}", user.getUsername());
            return Result.success("删除成功");
        } else {
            return Result.error("删除失败");
        }
    }
    
    /**
     * 修改密码
     */
    @Transactional
    public Result<String> changePassword(Long userId, String oldPassword, String newPassword) {
        if (!StringUtils.hasText(oldPassword) || !StringUtils.hasText(newPassword)) {
            return Result.error("密码不能为空");
        }
        
        User user = getById(userId);
        if (user == null || user.getDeleted() == 1) {
            return Result.error("用户不存在");
        }
        
        // 验证旧密码
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            return Result.error("原密码错误");
        }
        
        // 更新密码
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setUpdatedTime(LocalDateTime.now());
        
        boolean success = updateById(user);
        if (success) {
            log.info("用户密码修改成功: {}", user.getUsername());
            return Result.success("密码修改成功");
        } else {
            return Result.error("密码修改失败");
        }
    }
    
    /**
     * 登录响应类
     */
    public static class LoginResponse {
        private String token;
        private Long userId;
        private String username;
        private String realName;
        private Integer userType;
        
        // getters and setters
        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }
        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getRealName() { return realName; }
        public void setRealName(String realName) { this.realName = realName; }
        public Integer getUserType() { return userType; }
        public void setUserType(Integer userType) { this.userType = userType; }
    }
    
    /**
     * 注册请求类
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
    
    /**
     * 更新用户请求类
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
}