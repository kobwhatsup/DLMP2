package com.matrix.lawsuit.caseservice.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.matrix.lawsuit.common.core.domain.Result;
import com.matrix.lawsuit.caseservice.entity.Case;
import com.matrix.lawsuit.caseservice.mapper.CaseMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * 案件服务实现类
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CaseService extends ServiceImpl<CaseMapper, Case> {
    
    /**
     * 分页查询案件
     */
    public Result<IPage<Case>> getCases(int page, int size, CaseQueryRequest request) {
        Page<Case> pageParam = new Page<>(page, size);
        
        LambdaQueryWrapper<Case> wrapper = new LambdaQueryWrapper<Case>()
            .eq(Case::getDeleted, 0);
        
        // 动态条件查询
        if (StringUtils.hasText(request.getCaseNo())) {
            wrapper.like(Case::getCaseNo, request.getCaseNo());
        }
        if (StringUtils.hasText(request.getBatchNo())) {
            wrapper.eq(Case::getBatchNo, request.getBatchNo());
        }
        if (StringUtils.hasText(request.getDebtorName())) {
            wrapper.like(Case::getDebtorName, request.getDebtorName());
        }
        if (StringUtils.hasText(request.getDebtorIdCard())) {
            wrapper.like(Case::getDebtorIdCard, request.getDebtorIdCard());
        }
        if (StringUtils.hasText(request.getDebtorPhone())) {
            wrapper.like(Case::getDebtorPhone, request.getDebtorPhone());
        }
        if (request.getCaseStatus() != null) {
            wrapper.eq(Case::getCaseStatus, request.getCaseStatus());
        }
        if (request.getAssignmentStatus() != null) {
            wrapper.eq(Case::getAssignmentStatus, request.getAssignmentStatus());
        }
        if (request.getMediationCenterId() != null) {
            wrapper.eq(Case::getMediationCenterId, request.getMediationCenterId());
        }
        if (request.getMediatorId() != null) {
            wrapper.eq(Case::getMediatorId, request.getMediatorId());
        }
        if (request.getClientId() != null) {
            wrapper.eq(Case::getClientId, request.getClientId());
        }
        
        wrapper.orderByDesc(Case::getCreatedTime);
        
        IPage<Case> result = page(pageParam, wrapper);
        return Result.success(result);
    }
    
    /**
     * 根据ID获取案件详情
     */
    public Result<Case> getCaseById(Long id) {
        Case caseEntity = getById(id);
        if (caseEntity == null || caseEntity.getDeleted() == 1) {
            return Result.error("案件不存在");
        }
        return Result.success(caseEntity);
    }
    
    /**
     * 创建案件
     */
    @Transactional
    public Result<String> createCase(CreateCaseRequest request) {
        // 参数校验
        if (!StringUtils.hasText(request.getDebtorName()) || 
            !StringUtils.hasText(request.getDebtorIdCard())) {
            return Result.error("债务人姓名和身份证号不能为空");
        }
        
        // 检查身份证号是否已存在
        boolean exists = exists(new LambdaQueryWrapper<Case>()
            .eq(Case::getDebtorIdCard, request.getDebtorIdCard())
            .eq(Case::getDeleted, 0));
        
        if (exists) {
            return Result.error("该身份证号的案件已存在");
        }
        
        // 生成案件编号
        String caseNo = generateCaseNo();
        
        // 创建案件
        Case caseEntity = new Case();
        caseEntity.setCaseNo(caseNo);
        caseEntity.setBatchNo(request.getBatchNo());
        caseEntity.setIouNumber(request.getIouNumber());
        caseEntity.setContractAmount(request.getContractAmount());
        caseEntity.setDebtorId(request.getDebtorId());
        caseEntity.setDebtorName(request.getDebtorName());
        caseEntity.setDebtorIdCard(request.getDebtorIdCard());
        caseEntity.setDebtorPhone(request.getDebtorPhone());
        caseEntity.setGender(request.getGender());
        caseEntity.setEducation(request.getEducation());
        caseEntity.setEthnicity(request.getEthnicity());
        caseEntity.setMaritalStatus(request.getMaritalStatus());
        caseEntity.setHouseholdProvince(request.getHouseholdProvince());
        caseEntity.setHouseholdCity(request.getHouseholdCity());
        caseEntity.setHouseholdAddress(request.getHouseholdAddress());
        caseEntity.setCurrentProvince(request.getCurrentProvince());
        caseEntity.setCurrentCity(request.getCurrentCity());
        caseEntity.setCurrentAddress(request.getCurrentAddress());
        caseEntity.setCompanyName(request.getCompanyName());
        caseEntity.setJobPosition(request.getJobPosition());
        caseEntity.setCompanyPhone(request.getCompanyPhone());
        caseEntity.setCompanyProvince(request.getCompanyProvince());
        caseEntity.setCompanyCity(request.getCompanyCity());
        caseEntity.setCompanyAddress(request.getCompanyAddress());
        caseEntity.setLoanProductType(request.getLoanProductType());
        caseEntity.setLoanDate(request.getLoanDate());
        caseEntity.setLoanAmount(request.getLoanAmount());
        caseEntity.setOverduePrincipal(request.getOverduePrincipal());
        caseEntity.setOverdueInterest(request.getOverdueInterest());
        caseEntity.setOverdueFees(request.getOverdueFees());
        caseEntity.setOverdueTotalAmount(request.getOverdueTotalAmount());
        caseEntity.setOverdueDays(request.getOverdueDays());
        caseEntity.setCaseStatus(1); // 默认状态：待分案
        caseEntity.setAssignmentStatus(0); // 默认：未分案
        caseEntity.setClientId(request.getClientId());
        caseEntity.setDeleted(0);
        caseEntity.setCreatedTime(LocalDateTime.now());
        
        boolean success = save(caseEntity);
        if (success) {
            log.info("案件创建成功: {}", caseNo);
            return Result.success("案件创建成功，案件编号：" + caseNo);
        } else {
            return Result.error("案件创建失败");
        }
    }
    
    /**
     * 更新案件信息
     */
    @Transactional
    public Result<String> updateCase(Long id, UpdateCaseRequest request) {
        Case caseEntity = getById(id);
        if (caseEntity == null || caseEntity.getDeleted() == 1) {
            return Result.error("案件不存在");
        }
        
        // 更新字段
        if (StringUtils.hasText(request.getDebtorName())) {
            caseEntity.setDebtorName(request.getDebtorName());
        }
        if (StringUtils.hasText(request.getDebtorPhone())) {
            caseEntity.setDebtorPhone(request.getDebtorPhone());
        }
        if (request.getContractAmount() != null) {
            caseEntity.setContractAmount(request.getContractAmount());
        }
        if (request.getLoanAmount() != null) {
            caseEntity.setLoanAmount(request.getLoanAmount());
        }
        if (request.getOverdueTotalAmount() != null) {
            caseEntity.setOverdueTotalAmount(request.getOverdueTotalAmount());
        }
        if (request.getCaseStatus() != null) {
            caseEntity.setCaseStatus(request.getCaseStatus());
        }
        
        caseEntity.setUpdatedTime(LocalDateTime.now());
        
        boolean success = updateById(caseEntity);
        if (success) {
            log.info("案件信息更新成功: {}", caseEntity.getCaseNo());
            return Result.success("案件信息更新成功");
        } else {
            return Result.error("案件信息更新失败");
        }
    }
    
    /**
     * 删除案件（逻辑删除）
     */
    @Transactional
    public Result<String> deleteCase(Long id) {
        Case caseEntity = getById(id);
        if (caseEntity == null || caseEntity.getDeleted() == 1) {
            return Result.error("案件不存在");
        }
        
        caseEntity.setDeleted(1);
        caseEntity.setUpdatedTime(LocalDateTime.now());
        
        boolean success = updateById(caseEntity);
        if (success) {
            log.info("案件删除成功: {}", caseEntity.getCaseNo());
            return Result.success("案件删除成功");
        } else {
            return Result.error("案件删除失败");
        }
    }
    
    /**
     * 批量导入案件
     */
    @Transactional
    public Result<String> batchImportCases(List<CreateCaseRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            return Result.error("导入数据不能为空");
        }
        
        int successCount = 0;
        int failureCount = 0;
        
        for (CreateCaseRequest request : requests) {
            try {
                Result<String> result = createCase(request);
                if (result.getCode() == 200) {
                    successCount++;
                } else {
                    failureCount++;
                    log.warn("案件导入失败: {}, 原因: {}", request.getDebtorName(), result.getMessage());
                }
            } catch (Exception e) {
                failureCount++;
                log.error("案件导入异常: {}", request.getDebtorName(), e);
            }
        }
        
        String message = String.format("批量导入完成，成功：%d条，失败：%d条", successCount, failureCount);
        log.info(message);
        return Result.success(message);
    }
    
    /**
     * 分案
     */
    @Transactional
    public Result<String> assignCase(Long caseId, Long mediationCenterId, Long mediatorId) {
        Case caseEntity = getById(caseId);
        if (caseEntity == null || caseEntity.getDeleted() == 1) {
            return Result.error("案件不存在");
        }
        
        if (caseEntity.getAssignmentStatus() == 1) {
            return Result.error("案件已分案，不能重复分案");
        }
        
        caseEntity.setMediationCenterId(mediationCenterId);
        caseEntity.setMediatorId(mediatorId);
        caseEntity.setAssignmentStatus(1);
        caseEntity.setCaseStatus(2); // 调解中
        caseEntity.setUpdatedTime(LocalDateTime.now());
        
        boolean success = updateById(caseEntity);
        if (success) {
            log.info("案件分案成功: {}", caseEntity.getCaseNo());
            return Result.success("案件分案成功");
        } else {
            return Result.error("案件分案失败");
        }
    }
    
    /**
     * 生成案件编号
     */
    private String generateCaseNo() {
        // 格式：DLMP + 年月日 + 6位随机数
        String dateStr = LocalDateTime.now().toString().substring(0, 10).replace("-", "");
        String randomStr = UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase();
        return "DLMP" + dateStr + randomStr;
    }
    
    /**
     * 案件查询请求类
     */
    public static class CaseQueryRequest {
        private String caseNo;
        private String batchNo;
        private String debtorName;
        private String debtorIdCard;
        private String debtorPhone;
        private Integer caseStatus;
        private Integer assignmentStatus;
        private Long mediationCenterId;
        private Long mediatorId;
        private Long clientId;
        
        // getters and setters
        public String getCaseNo() { return caseNo; }
        public void setCaseNo(String caseNo) { this.caseNo = caseNo; }
        public String getBatchNo() { return batchNo; }
        public void setBatchNo(String batchNo) { this.batchNo = batchNo; }
        public String getDebtorName() { return debtorName; }
        public void setDebtorName(String debtorName) { this.debtorName = debtorName; }
        public String getDebtorIdCard() { return debtorIdCard; }
        public void setDebtorIdCard(String debtorIdCard) { this.debtorIdCard = debtorIdCard; }
        public String getDebtorPhone() { return debtorPhone; }
        public void setDebtorPhone(String debtorPhone) { this.debtorPhone = debtorPhone; }
        public Integer getCaseStatus() { return caseStatus; }
        public void setCaseStatus(Integer caseStatus) { this.caseStatus = caseStatus; }
        public Integer getAssignmentStatus() { return assignmentStatus; }
        public void setAssignmentStatus(Integer assignmentStatus) { this.assignmentStatus = assignmentStatus; }
        public Long getMediationCenterId() { return mediationCenterId; }
        public void setMediationCenterId(Long mediationCenterId) { this.mediationCenterId = mediationCenterId; }
        public Long getMediatorId() { return mediatorId; }
        public void setMediatorId(Long mediatorId) { this.mediatorId = mediatorId; }
        public Long getClientId() { return clientId; }
        public void setClientId(Long clientId) { this.clientId = clientId; }
    }
    
    /**
     * 创建案件请求类（简化版，包含主要字段）
     */
    public static class CreateCaseRequest {
        private String batchNo;
        private String iouNumber;
        private java.math.BigDecimal contractAmount;
        private String debtorId;
        private String debtorName;
        private String debtorIdCard;
        private String debtorPhone;
        private Integer gender;
        private String education;
        private String ethnicity;
        private String maritalStatus;
        private String householdProvince;
        private String householdCity;
        private String householdAddress;
        private String currentProvince;
        private String currentCity;
        private String currentAddress;
        private String companyName;
        private String jobPosition;
        private String companyPhone;
        private String companyProvince;
        private String companyCity;
        private String companyAddress;
        private String loanProductType;
        private String loanDate;
        private java.math.BigDecimal loanAmount;
        private java.math.BigDecimal overduePrincipal;
        private java.math.BigDecimal overdueInterest;
        private java.math.BigDecimal overdueFees;
        private java.math.BigDecimal overdueTotalAmount;
        private Integer overdueDays;
        private Long clientId;
        
        // getters and setters (省略，实际项目中需要完整实现)
        public String getBatchNo() { return batchNo; }
        public void setBatchNo(String batchNo) { this.batchNo = batchNo; }
        public String getIouNumber() { return iouNumber; }
        public void setIouNumber(String iouNumber) { this.iouNumber = iouNumber; }
        public java.math.BigDecimal getContractAmount() { return contractAmount; }
        public void setContractAmount(java.math.BigDecimal contractAmount) { this.contractAmount = contractAmount; }
        public String getDebtorId() { return debtorId; }
        public void setDebtorId(String debtorId) { this.debtorId = debtorId; }
        public String getDebtorName() { return debtorName; }
        public void setDebtorName(String debtorName) { this.debtorName = debtorName; }
        public String getDebtorIdCard() { return debtorIdCard; }
        public void setDebtorIdCard(String debtorIdCard) { this.debtorIdCard = debtorIdCard; }
        public String getDebtorPhone() { return debtorPhone; }
        public void setDebtorPhone(String debtorPhone) { this.debtorPhone = debtorPhone; }
        public Integer getGender() { return gender; }
        public void setGender(Integer gender) { this.gender = gender; }
        public String getEducation() { return education; }
        public void setEducation(String education) { this.education = education; }
        public String getEthnicity() { return ethnicity; }
        public void setEthnicity(String ethnicity) { this.ethnicity = ethnicity; }
        public String getMaritalStatus() { return maritalStatus; }
        public void setMaritalStatus(String maritalStatus) { this.maritalStatus = maritalStatus; }
        public String getHouseholdProvince() { return householdProvince; }
        public void setHouseholdProvince(String householdProvince) { this.householdProvince = householdProvince; }
        public String getHouseholdCity() { return householdCity; }
        public void setHouseholdCity(String householdCity) { this.householdCity = householdCity; }
        public String getHouseholdAddress() { return householdAddress; }
        public void setHouseholdAddress(String householdAddress) { this.householdAddress = householdAddress; }
        public String getCurrentProvince() { return currentProvince; }
        public void setCurrentProvince(String currentProvince) { this.currentProvince = currentProvince; }
        public String getCurrentCity() { return currentCity; }
        public void setCurrentCity(String currentCity) { this.currentCity = currentCity; }
        public String getCurrentAddress() { return currentAddress; }
        public void setCurrentAddress(String currentAddress) { this.currentAddress = currentAddress; }
        public String getCompanyName() { return companyName; }
        public void setCompanyName(String companyName) { this.companyName = companyName; }
        public String getJobPosition() { return jobPosition; }
        public void setJobPosition(String jobPosition) { this.jobPosition = jobPosition; }
        public String getCompanyPhone() { return companyPhone; }
        public void setCompanyPhone(String companyPhone) { this.companyPhone = companyPhone; }
        public String getCompanyProvince() { return companyProvince; }
        public void setCompanyProvince(String companyProvince) { this.companyProvince = companyProvince; }
        public String getCompanyCity() { return companyCity; }
        public void setCompanyCity(String companyCity) { this.companyCity = companyCity; }
        public String getCompanyAddress() { return companyAddress; }
        public void setCompanyAddress(String companyAddress) { this.companyAddress = companyAddress; }
        public String getLoanProductType() { return loanProductType; }
        public void setLoanProductType(String loanProductType) { this.loanProductType = loanProductType; }
        public String getLoanDate() { return loanDate; }
        public void setLoanDate(String loanDate) { this.loanDate = loanDate; }
        public java.math.BigDecimal getLoanAmount() { return loanAmount; }
        public void setLoanAmount(java.math.BigDecimal loanAmount) { this.loanAmount = loanAmount; }
        public java.math.BigDecimal getOverduePrincipal() { return overduePrincipal; }
        public void setOverduePrincipal(java.math.BigDecimal overduePrincipal) { this.overduePrincipal = overduePrincipal; }
        public java.math.BigDecimal getOverdueInterest() { return overdueInterest; }
        public void setOverdueInterest(java.math.BigDecimal overdueInterest) { this.overdueInterest = overdueInterest; }
        public java.math.BigDecimal getOverdueFees() { return overdueFees; }
        public void setOverdueFees(java.math.BigDecimal overdueFees) { this.overdueFees = overdueFees; }
        public java.math.BigDecimal getOverdueTotalAmount() { return overdueTotalAmount; }
        public void setOverdueTotalAmount(java.math.BigDecimal overdueTotalAmount) { this.overdueTotalAmount = overdueTotalAmount; }
        public Integer getOverdueDays() { return overdueDays; }
        public void setOverdueDays(Integer overdueDays) { this.overdueDays = overdueDays; }
        public Long getClientId() { return clientId; }
        public void setClientId(Long clientId) { this.clientId = clientId; }
    }
    
    /**
     * 更新案件请求类
     */
    public static class UpdateCaseRequest {
        private String debtorName;
        private String debtorPhone;
        private java.math.BigDecimal contractAmount;
        private java.math.BigDecimal loanAmount;
        private java.math.BigDecimal overdueTotalAmount;
        private Integer caseStatus;
        
        // getters and setters
        public String getDebtorName() { return debtorName; }
        public void setDebtorName(String debtorName) { this.debtorName = debtorName; }
        public String getDebtorPhone() { return debtorPhone; }
        public void setDebtorPhone(String debtorPhone) { this.debtorPhone = debtorPhone; }
        public java.math.BigDecimal getContractAmount() { return contractAmount; }
        public void setContractAmount(java.math.BigDecimal contractAmount) { this.contractAmount = contractAmount; }
        public java.math.BigDecimal getLoanAmount() { return loanAmount; }
        public void setLoanAmount(java.math.BigDecimal loanAmount) { this.loanAmount = loanAmount; }
        public java.math.BigDecimal getOverdueTotalAmount() { return overdueTotalAmount; }
        public void setOverdueTotalAmount(java.math.BigDecimal overdueTotalAmount) { this.overdueTotalAmount = overdueTotalAmount; }
        public Integer getCaseStatus() { return caseStatus; }
        public void setCaseStatus(Integer caseStatus) { this.caseStatus = caseStatus; }
    }
}