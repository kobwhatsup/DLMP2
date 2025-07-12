package com.matrix.lawsuit.user.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.matrix.lawsuit.user.entity.User;
import org.apache.ibatis.annotations.Mapper;

/**
 * 用户映射器
 */
@Mapper
public interface UserMapper extends BaseMapper<User> {
}