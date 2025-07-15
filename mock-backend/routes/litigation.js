import express from 'express';
import db from '../config/database.js';

const router = express.Router();

// 获取诉讼案件列表
router.get('/cases', async (req, res) => {
  try {
    const { page = 1, size = 10, status, stage, courtName, borrowerName } = req.query;
    
    // 构建查询条件
    let whereConditions = [];
    let whereParams = [];
    
    if (status) {
      whereConditions.push('status = ?');
      whereParams.push(status);
    }
    
    if (stage) {
      whereConditions.push('stage = ?');
      whereParams.push(stage);
    }
    
    if (courtName) {
      whereConditions.push('court_name LIKE ?');
      whereParams.push(`%${courtName}%`);
    }
    
    if (borrowerName) {
      whereConditions.push('borrower_name LIKE ?');
      whereParams.push(`%${borrowerName}%`);
    }
    
    const whereClause = whereConditions.length > 0 ? whereConditions.join(' AND ') : '';
    
    // 分页查询
    const result = await db.paginate('litigation_cases', {
      page: parseInt(page),
      size: parseInt(size),
      where: whereClause,
      whereParams: whereParams,
      orderBy: 'created_time DESC'
    });
    
    res.json({
      code: 200,
      message: '查询成功',
      data: result.data,
      total: result.total,
      page: result.page,
      size: result.size
    });
  } catch (error) {
    console.error('获取诉讼案件列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取诉讼案件列表失败',
      error: error.message
    });
  }
});

// 获取诉讼案件详情
router.get('/cases/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const cases = await db.query(
      'SELECT * FROM litigation_cases WHERE id = ?',
      [id]
    );
    
    if (cases.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '诉讼案件不存在'
      });
    }
    
    res.json({
      code: 200,
      message: '查询成功',
      data: cases[0]
    });
  } catch (error) {
    console.error('获取诉讼案件详情失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取诉讼案件详情失败',
      error: error.message
    });
  }
});

// 创建诉讼案件
router.post('/cases', async (req, res) => {
  try {
    const caseData = {
      case_id: req.body.caseId,
      case_number: req.body.caseNumber || `DLMP-L-${Date.now()}`,
      borrower_name: req.body.borrowerName,
      debt_amount: req.body.debtAmount,
      court_name: req.body.courtName,
      court_case_number: req.body.courtCaseNumber,
      judge_name: req.body.judgeName,
      plaintiff_lawyer: req.body.plaintiffLawyer,
      stage: req.body.stage || 1,
      status: req.body.status || 1,
      progress: req.body.progress || 0,
      filing_date: req.body.filingDate,
      case_description: req.body.caseDescription,
      created_time: new Date()
    };
    
    const result = await db.insert('litigation_cases', caseData);
    
    res.json({
      code: 200,
      message: '诉讼案件创建成功',
      data: {
        id: result.insertId,
        ...caseData
      }
    });
  } catch (error) {
    console.error('创建诉讼案件失败:', error);
    res.status(500).json({
      code: 500,
      message: '创建诉讼案件失败',
      error: error.message
    });
  }
});

// 更新诉讼案件
router.put('/cases/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      court_name: req.body.courtName,
      court_case_number: req.body.courtCaseNumber,
      judge_name: req.body.judgeName,
      plaintiff_lawyer: req.body.plaintiffLawyer,
      filing_date: req.body.filingDate,
      trial_date: req.body.trialDate,
      judgment_date: req.body.judgmentDate,
      judgment_amount: req.body.judgmentAmount,
      execution_court: req.body.executionCourt,
      case_description: req.body.caseDescription,
      remarks: req.body.remarks,
      status: req.body.status,
      updated_time: new Date()
    };
    
    // 移除undefined的字段
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });
    
    await db.update('litigation_cases', updateData, 'id = ?', [id]);
    
    res.json({
      code: 200,
      message: '诉讼案件更新成功'
    });
  } catch (error) {
    console.error('更新诉讼案件失败:', error);
    res.status(500).json({
      code: 500,
      message: '更新诉讼案件失败',
      error: error.message
    });
  }
});

// 获取文书模板列表
router.get('/document-templates', async (req, res) => {
  try {
    const templates = await db.query(
      'SELECT * FROM document_templates ORDER BY created_time DESC'
    );
    
    res.json({
      code: 200,
      message: '查询成功',
      data: templates
    });
  } catch (error) {
    console.error('获取文书模板失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取文书模板失败',
      error: error.message
    });
  }
});

// 创建文书模板
router.post('/document-templates', async (req, res) => {
  try {
    const templateData = {
      name: req.body.name,
      type: req.body.type,
      category: req.body.category || 'litigation',
      description: req.body.description || '',
      content: req.body.content || '',
      template_path: `/templates/${req.body.type}_${Date.now()}.${req.body.fileType || 'docx'}`,
      variables: JSON.stringify(req.body.variables || []),
      file_type: req.body.fileType || 'docx',
      created_by: '系统用户',
      created_time: new Date()
    };
    
    const result = await db.insert('document_templates', templateData);
    
    res.json({
      code: 200,
      message: '模板创建成功',
      data: {
        id: result.insertId,
        ...templateData,
        variables: req.body.variables || []
      }
    });
  } catch (error) {
    console.error('创建文书模板失败:', error);
    res.status(500).json({
      code: 500,
      message: '创建文书模板失败',
      error: error.message
    });
  }
});

// 删除文书模板
router.delete('/document-templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.delete('document_templates', 'id = ?', [id]);
    
    res.json({
      code: 200,
      message: '模板删除成功'
    });
  } catch (error) {
    console.error('删除文书模板失败:', error);
    res.status(500).json({
      code: 500,
      message: '删除文书模板失败',
      error: error.message
    });
  }
});

// 获取诉讼统计数据
router.get('/stats', async (req, res) => {
  try {
    const stats = await db.query(`
      SELECT 
        COUNT(*) as totalCases,
        SUM(CASE WHEN stage = 1 THEN 1 ELSE 0 END) as preparationCount,
        SUM(CASE WHEN stage = 2 THEN 1 ELSE 0 END) as filingCount,
        SUM(CASE WHEN stage = 3 THEN 1 ELSE 0 END) as trialCount,
        SUM(CASE WHEN stage = 5 THEN 1 ELSE 0 END) as executionCount,
        SUM(CASE WHEN stage = 6 THEN 1 ELSE 0 END) as completedCount,
        SUM(debt_amount) as totalDebtAmount,
        SUM(CASE WHEN judgment_amount > 0 THEN judgment_amount ELSE 0 END) as totalRecoveredAmount
      FROM litigation_cases
    `);
    
    const statsData = stats[0];
    const recoveryRate = statsData.totalDebtAmount > 0 
      ? (statsData.totalRecoveredAmount / statsData.totalDebtAmount * 100) 
      : 0;
    
    res.json({
      code: 200,
      message: '查询成功',
      data: {
        ...statsData,
        recoveryRate: parseFloat(recoveryRate.toFixed(2)),
        avgProcessTime: 45 // 示例数据
      }
    });
  } catch (error) {
    console.error('获取诉讼统计失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取诉讼统计失败',
      error: error.message
    });
  }
});

export default router;