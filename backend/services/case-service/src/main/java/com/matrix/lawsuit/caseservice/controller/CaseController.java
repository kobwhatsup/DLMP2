package com.matrix.lawsuit.caseservice.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.matrix.lawsuit.common.core.domain.Result;
import com.matrix.lawsuit.caseservice.entity.Case;
import com.matrix.lawsuit.caseservice.service.CaseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 案件管理控制器
 */
@Tag(name = "案件管理", description = "案件管理相关接口")
@RestController
@RequestMapping("/cases")
@RequiredArgsConstructor
public class CaseController {
    
    private final CaseService caseService;
    
    @Operation(summary = "分页查询案件列表")
    @GetMapping
    public Result<IPage<Case>> getCases(
            @Parameter(description = "页码", example = "1") @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "每页大小", example = "10") @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "案件编号") @RequestParam(required = false) String caseNo,
            @Parameter(description = "批次号") @RequestParam(required = false) String batchNo,
            @Parameter(description = "债务人姓名") @RequestParam(required = false) String debtorName,
            @Parameter(description = "身份证号") @RequestParam(required = false) String debtorIdCard,
            @Parameter(description = "手机号") @RequestParam(required = false) String debtorPhone,
            @Parameter(description = "案件状态") @RequestParam(required = false) Integer caseStatus,
            @Parameter(description = "分案状态") @RequestParam(required = false) Integer assignmentStatus,
            @Parameter(description = "调解中心ID") @RequestParam(required = false) Long mediationCenterId,
            @Parameter(description = "调解员ID") @RequestParam(required = false) Long mediatorId,
            @Parameter(description = "案源端客户ID") @RequestParam(required = false) Long clientId) {
        
        CaseService.CaseQueryRequest request = new CaseService.CaseQueryRequest();
        request.setCaseNo(caseNo);
        request.setBatchNo(batchNo);
        request.setDebtorName(debtorName);
        request.setDebtorIdCard(debtorIdCard);
        request.setDebtorPhone(debtorPhone);
        request.setCaseStatus(caseStatus);
        request.setAssignmentStatus(assignmentStatus);
        request.setMediationCenterId(mediationCenterId);
        request.setMediatorId(mediatorId);
        request.setClientId(clientId);
        
        return caseService.getCases(page, size, request);
    }
    
    @Operation(summary = "根据ID获取案件详情")
    @GetMapping("/{id}")
    public Result<Case> getCaseById(@Parameter(description = "案件ID") @PathVariable Long id) {
        return caseService.getCaseById(id);
    }
    
    @Operation(summary = "创建案件")
    @PostMapping
    public Result<String> createCase(@RequestBody CaseService.CreateCaseRequest request) {
        return caseService.createCase(request);
    }
    
    @Operation(summary = "更新案件信息")
    @PutMapping("/{id}")
    public Result<String> updateCase(
            @Parameter(description = "案件ID") @PathVariable Long id,
            @RequestBody CaseService.UpdateCaseRequest request) {
        return caseService.updateCase(id, request);
    }
    
    @Operation(summary = "删除案件")
    @DeleteMapping("/{id}")
    public Result<String> deleteCase(@Parameter(description = "案件ID") @PathVariable Long id) {
        return caseService.deleteCase(id);
    }
    
    @Operation(summary = "批量导入案件")
    @PostMapping("/batch-import")
    public Result<String> batchImportCases(@RequestBody List<CaseService.CreateCaseRequest> requests) {
        return caseService.batchImportCases(requests);
    }
    
    @Operation(summary = "分案")
    @PostMapping("/{id}/assign")
    public Result<String> assignCase(
            @Parameter(description = "案件ID") @PathVariable Long id,
            @RequestBody AssignCaseRequest request) {
        return caseService.assignCase(id, request.getMediationCenterId(), request.getMediatorId());
    }
    
    /**
     * 分案请求参数
     */
    public static class AssignCaseRequest {
        private Long mediationCenterId;
        private Long mediatorId;
        
        public Long getMediationCenterId() { return mediationCenterId; }
        public void setMediationCenterId(Long mediationCenterId) { this.mediationCenterId = mediationCenterId; }
        public Long getMediatorId() { return mediatorId; }
        public void setMediatorId(Long mediatorId) { this.mediatorId = mediatorId; }
    }
}