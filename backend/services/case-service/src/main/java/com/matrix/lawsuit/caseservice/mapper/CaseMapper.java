package com.matrix.lawsuit.caseservice.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.matrix.lawsuit.caseservice.entity.Case;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 案件映射器
 */
@Mapper
public interface CaseMapper extends BaseMapper<Case> {
    
    /**
     * 根据批次号查询案件列表
     */
    List<Case> selectByBatchNo(@Param("batchNo") String batchNo);
    
    /**
     * 根据调解中心ID查询案件列表
     */
    List<Case> selectByMediationCenterId(@Param("mediationCenterId") Long mediationCenterId);
    
    /**
     * 根据调解员ID查询案件列表
     */
    List<Case> selectByMediatorId(@Param("mediatorId") Long mediatorId);
    
    /**
     * 统计各状态案件数量
     */
    List<CaseStatusCount> countByStatus();
    
    /**
     * 案件状态统计结果
     */
    class CaseStatusCount {
        private Integer caseStatus;
        private Long count;
        
        public Integer getCaseStatus() { return caseStatus; }
        public void setCaseStatus(Integer caseStatus) { this.caseStatus = caseStatus; }
        public Long getCount() { return count; }
        public void setCount(Long count) { this.count = count; }
    }
}