package com.matrix.lawsuit.caseservice.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.matrix.lawsuit.common.core.domain.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

/**
 * 案件实体类
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("t_case")
public class Case extends BaseEntity {
    
    @TableId(type = IdType.AUTO)
    private Long id;
    
    /**
     * 案件编号
     */
    private String caseNo;
    
    /**
     * 批次号
     */
    private String batchNo;
    
    /**
     * 借据编号
     */
    private String iouNumber;
    
    /**
     * 合同金额
     */
    private BigDecimal contractAmount;
    
    /**
     * 债务人编号
     */
    private String debtorId;
    
    /**
     * 债务人姓名
     */
    private String debtorName;
    
    /**
     * 身份证号
     */
    private String debtorIdCard;
    
    /**
     * 手机号
     */
    private String debtorPhone;
    
    /**
     * 性别：1-男，2-女
     */
    private Integer gender;
    
    /**
     * 学历
     */
    private String education;
    
    /**
     * 民族
     */
    private String ethnicity;
    
    /**
     * 婚姻状况
     */
    private String maritalStatus;
    
    /**
     * 户籍所在省
     */
    private String householdProvince;
    
    /**
     * 户籍所在市
     */
    private String householdCity;
    
    /**
     * 户籍详细地址
     */
    private String householdAddress;
    
    /**
     * 现居省
     */
    private String currentProvince;
    
    /**
     * 现居市
     */
    private String currentCity;
    
    /**
     * 现居地址
     */
    private String currentAddress;
    
    /**
     * 单位名称
     */
    private String companyName;
    
    /**
     * 职务
     */
    private String jobPosition;
    
    /**
     * 单位电话
     */
    private String companyPhone;
    
    /**
     * 单位所在省
     */
    private String companyProvince;
    
    /**
     * 单位所在市
     */
    private String companyCity;
    
    /**
     * 单位地址
     */
    private String companyAddress;
    
    /**
     * 借款产品类型
     */
    private String loanProductType;
    
    /**
     * 放款时间
     */
    private String loanDate;
    
    /**
     * 借款金额
     */
    private BigDecimal loanAmount;
    
    /**
     * 逾期本金
     */
    private BigDecimal overduePrincipal;
    
    /**
     * 逾期利息
     */
    private BigDecimal overdueInterest;
    
    /**
     * 逾期费用
     */
    private BigDecimal overdueFees;
    
    /**
     * 逾期总金额
     */
    private BigDecimal overdueTotalAmount;
    
    /**
     * 逾期天数
     */
    private Integer overdueDays;
    
    /**
     * 案件状态：1-待分案，2-调解中，3-调解成功，4-调解失败，5-诉讼中，6-结案
     */
    private Integer caseStatus;
    
    /**
     * 分案状态：0-未分案，1-已分案
     */
    private Integer assignmentStatus;
    
    /**
     * 调解中心ID
     */
    private Long mediationCenterId;
    
    /**
     * 调解员ID
     */
    private Long mediatorId;
    
    /**
     * 案源端客户ID
     */
    private Long clientId;
    
    /**
     * 是否删除：0-未删除，1-已删除
     */
    private Integer deleted;
}