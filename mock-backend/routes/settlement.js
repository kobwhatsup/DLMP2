import express from 'express';

const router = express.Router();

// 模拟数据
const mockSettlementRecords = [
  {
    id: 1,
    settlementNumber: 'JS2024001',
    caseId: 1,
    caseNumber: 'CASE001',
    clientId: 1,
    clientName: '浦发银行',
    settlementType: 'litigation',
    totalAmount: 50000,
    paidAmount: 20000,
    unpaidAmount: 30000,
    status: 5,
    dueDate: '2024-12-31',
    description: '个人贷款纠纷案件结算',
    creatorId: 1,
    creatorName: '系统用户',
    createTime: '2024-01-15 10:00:00',
    feeDetails: [
      { id: 1, feeType: 1, feeTypeName: '服务费', amount: 30000 },
      { id: 2, feeType: 2, feeTypeName: '诉讼费', amount: 20000 }
    ]
  },
  {
    id: 2,
    settlementNumber: 'JS2024002',
    caseId: 2,
    caseNumber: 'CASE002',
    clientId: 2,
    clientName: '招商银行',
    settlementType: 'mediation',
    totalAmount: 35000,
    paidAmount: 35000,
    unpaidAmount: 0,
    status: 4,
    dueDate: '2024-11-30',
    description: '调解成功结算',
    creatorId: 1,
    creatorName: '系统用户',
    createTime: '2024-02-01 14:00:00',
    feeDetails: [
      { id: 3, feeType: 1, feeTypeName: '服务费', amount: 25000 },
      { id: 4, feeType: 4, feeTypeName: '佣金', amount: 10000 }
    ]
  },
  {
    id: 3,
    settlementNumber: 'JS2024003',
    caseId: 3,
    caseNumber: 'CASE003',
    clientId: 3,
    clientName: '中国银行',
    settlementType: 'execution',
    totalAmount: 80000,
    paidAmount: 0,
    unpaidAmount: 80000,
    status: 2,
    dueDate: '2024-10-15',
    description: '执行阶段费用结算',
    creatorId: 1,
    creatorName: '系统用户',
    createTime: '2024-03-10 09:30:00',
    feeDetails: [
      { id: 5, feeType: 3, feeTypeName: '执行费', amount: 50000 },
      { id: 6, feeType: 1, feeTypeName: '服务费', amount: 30000 }
    ]
  }
];

// 模拟费用规则
const mockFeeRules = [
  { 
    id: 1, 
    feeType: 1, 
    feeTypeName: '服务费', 
    rate: 0.15, 
    minAmount: 500,
    maxAmount: 50000,
    formula: 'base_amount * rate', 
    description: '基础服务费用，按标的金额的15%收取',
    settlementType: null,
    isActive: true 
  },
  { 
    id: 2, 
    feeType: 2, 
    feeTypeName: '诉讼费', 
    rate: 0.10, 
    minAmount: 300,
    maxAmount: 30000,
    formula: 'base_amount * rate', 
    description: '法院诉讼费用，按标的金额的10%收取',
    settlementType: 'litigation',
    isActive: true 
  },
  { 
    id: 3, 
    feeType: 3, 
    feeTypeName: '执行费', 
    rate: 0.12, 
    minAmount: 400,
    maxAmount: 40000,
    formula: 'base_amount * rate', 
    description: '强制执行费用，按标的金额的12%收取',
    settlementType: 'execution',
    isActive: true 
  },
  { 
    id: 4, 
    feeType: 4, 
    feeTypeName: '佣金', 
    rate: 0.08, 
    minAmount: 200,
    maxAmount: 20000,
    formula: 'base_amount * rate', 
    description: '成功调解佣金，按标的金额的8%收取',
    settlementType: 'mediation',
    isActive: true 
  },
  { 
    id: 5, 
    feeType: 5, 
    feeTypeName: '律师费', 
    rate: 0.18, 
    minAmount: 1000,
    maxAmount: 60000,
    formula: 'base_amount * rate', 
    description: '律师代理费用，按标的金额的18%收取',
    settlementType: null,
    isActive: true 
  }
];

// 获取结算记录列表
router.get('/records', (req, res) => {
  try {
    console.log('收到查询参数:', req.query);
    const { 
      page = 1, 
      size = 10, 
      caseNumber, 
      clientName, 
      status, 
      settlementType
    } = req.query;
    
    // 过滤数据
    let filteredRecords = [...mockSettlementRecords];
    
    if (caseNumber) {
      filteredRecords = filteredRecords.filter(record => 
        record.caseNumber.includes(caseNumber)
      );
    }
    
    if (clientName) {
      filteredRecords = filteredRecords.filter(record => 
        record.clientName.includes(clientName)
      );
    }
    
    if (status) {
      filteredRecords = filteredRecords.filter(record => 
        record.status == status
      );
    }
    
    if (settlementType) {
      filteredRecords = filteredRecords.filter(record => 
        record.settlementType === settlementType
      );
    }
    
    // 分页处理
    const pageNum = parseInt(page);
    const pageSize = parseInt(size);
    const startIndex = (pageNum - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedRecords = filteredRecords.slice(startIndex, endIndex);
    
    console.log(`分页信息: page=${pageNum}, size=${pageSize}, start=${startIndex}, end=${endIndex}, total=${filteredRecords.length}, returned=${paginatedRecords.length}`);
    
    res.json({
      code: 200,
      message: '查询成功',
      data: {
        records: paginatedRecords,
        total: filteredRecords.length,
        current: pageNum,
        size: pageSize,
        pages: Math.ceil(filteredRecords.length / pageSize)
      }
    });
  } catch (error) {
    console.error('获取结算列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取结算列表失败',
      error: error.message
    });
  }
});

// 获取结算记录详情
router.get('/records/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const record = mockSettlementRecords.find(r => r.id == id);
    
    if (!record) {
      return res.status(404).json({
        code: 404,
        message: '结算记录不存在'
      });
    }
    
    // 返回完整的结算记录（包含费用明细）
    res.json({
      code: 200,
      message: '查询成功',
      data: record
    });
  } catch (error) {
    console.error('获取结算详情失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取结算详情失败',
      error: error.message
    });
  }
});

// 创建结算记录
router.post('/records', (req, res) => {
  try {
    const {
      caseId,
      settlementType,
      feeDetails = [],
      dueDate,
      description
    } = req.body;
    
    console.log('收到创建结算记录请求:', { caseId, settlementType, feeDetails, dueDate, description });
    
    // 从现有的案件数据中查找案件（模拟数据）
    const mockCases = [
      { id: 1, caseNo: 'DLMP20240101001', debtorName: '张三', clientName: '某银行', overdueTotalAmount: 50000 },
      { id: 2, caseNo: 'DLMP20240101002', debtorName: '李四', clientName: '某银行', overdueTotalAmount: 80000 },
      { id: 3, caseNo: 'DLMP20240101003', debtorName: '王五', clientName: '某银行', overdueTotalAmount: 120000 },
      { id: 4, caseNo: 'DLMP20240101004', debtorName: '赵六', clientName: '某银行', overdueTotalAmount: 30000 },
      { id: 5, caseNo: 'DLMP20240101005', debtorName: '孙七', clientName: '某银行', overdueTotalAmount: 75000 }
    ];
    
    const caseData = mockCases.find(c => c.id === caseId);
    if (!caseData) {
      return res.status(400).json({
        code: 400,
        message: '案件不存在'
      });
    }
    
    // 生成结算单号
    const settlementNumber = `JS${Date.now()}`;
    
    // 计算总金额
    const totalAmount = feeDetails.reduce((sum, detail) => sum + (detail.amount || 0), 0);
    
    // 创建新的结算记录
    const newSettlement = {
      id: Math.max(...mockSettlementRecords.map(r => r.id)) + 1,
      settlementNumber,
      caseId: caseId,
      caseNumber: caseData.caseNo,
      clientId: 1,
      clientName: caseData.clientName,
      settlementType: settlementType,
      totalAmount: totalAmount,
      paidAmount: 0,
      unpaidAmount: totalAmount,
      status: 1, // 草稿状态
      dueDate: dueDate,
      description: description || '',
      creatorId: 1,
      creatorName: '系统用户',
      createTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      feeDetails: feeDetails.map((detail, index) => ({
        id: index + 1,
        feeType: detail.feeType,
        feeTypeName: detail.feeTypeName || getFeeTypeName(detail.feeType),
        description: detail.description,
        baseAmount: detail.baseAmount || 0,
        rate: detail.rate || 0,
        amount: detail.amount,
        calculationMethod: detail.calculationMethod || '',
        formula: detail.formula || '',
        remarks: detail.remarks || ''
      }))
    };
    
    // 添加到模拟数据中
    mockSettlementRecords.push(newSettlement);
    
    console.log('结算记录创建成功:', newSettlement);
    
    res.json({
      code: 200,
      message: '结算记录创建成功',
      data: {
        id: newSettlement.id,
        settlementNumber: newSettlement.settlementNumber
      }
    });
  } catch (error) {
    console.error('创建结算记录失败:', error);
    res.status(500).json({
      code: 500,
      message: '创建结算记录失败',
      error: error.message
    });
  }
});

// 更新结算记录
router.put('/records/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      settlementType,
      feeDetails,
      dueDate,
      description,
      status
    } = req.body;
    
    // 检查记录是否存在
    const records = await db.query('SELECT * FROM settlement_records WHERE id = ?', [id]);
    if (records.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '结算记录不存在'
      });
    }
    
    const currentRecord = records[0];
    
    // 检查是否可以修改
    if (currentRecord.status >= 4) { // 已付款或以上状态不能修改
      return res.status(400).json({
        code: 400,
        message: '该结算记录状态不允许修改'
      });
    }
    
    await db.transaction(async (connection) => {
      // 更新主记录
      const updateData = {};
      if (settlementType) updateData.settlement_type = settlementType;
      if (dueDate) updateData.due_date = dueDate;
      if (description !== undefined) updateData.description = description;
      if (status !== undefined) updateData.status = status;
      
      // 如果有费用明细更新，重新计算总金额
      if (feeDetails && feeDetails.length > 0) {
        const totalAmount = feeDetails.reduce((sum, detail) => sum + (detail.amount || 0), 0);
        updateData.total_amount = totalAmount;
        updateData.unpaid_amount = totalAmount - currentRecord.paid_amount;
        
        // 删除旧的费用明细
        await connection.execute('DELETE FROM fee_details WHERE settlement_id = ?', [id]);
        
        // 插入新的费用明细
        for (let detail of feeDetails) {
          const feeDetailData = {
            settlement_id: id,
            fee_type: detail.feeType,
            fee_type_name: detail.feeTypeName || getFeeTypeName(detail.feeType),
            description: detail.description,
            base_amount: detail.baseAmount || 0,
            rate: detail.rate || 0,
            amount: detail.amount,
            calculation_method: detail.calculationMethod || '',
            formula: detail.formula || '',
            remarks: detail.remarks || ''
          };
          
          await connection.execute('INSERT INTO fee_details SET ?', [feeDetailData]);
        }
      }
      
      if (Object.keys(updateData).length > 0) {
        await connection.execute(
          `UPDATE settlement_records SET ${Object.keys(updateData).map(key => `${key} = ?`).join(', ')} WHERE id = ?`,
          [...Object.values(updateData), id]
        );
      }
    });
    
    res.json({
      code: 200,
      message: '结算记录更新成功'
    });
  } catch (error) {
    console.error('更新结算记录失败:', error);
    res.status(500).json({
      code: 500,
      message: '更新结算记录失败',
      error: error.message
    });
  }
});

// 提交结算审核
router.post('/records/:id/submit', async (req, res) => {
  try {
    const { id } = req.params;
    
    const records = await db.query('SELECT * FROM settlement_records WHERE id = ?', [id]);
    if (records.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '结算记录不存在'
      });
    }
    
    const record = records[0];
    if (record.status !== 1) {
      return res.status(400).json({
        code: 400,
        message: '只有草稿状态的记录才能提交审核'
      });
    }
    
    await db.update('settlement_records', 
      { status: 2 }, // 待审核
      'id = ?', 
      [id]
    );
    
    res.json({
      code: 200,
      message: '提交审核成功'
    });
  } catch (error) {
    console.error('提交审核失败:', error);
    res.status(500).json({
      code: 500,
      message: '提交审核失败',
      error: error.message
    });
  }
});

// 审核结算
router.post('/records/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, reason } = req.body;
    
    const records = await db.query('SELECT * FROM settlement_records WHERE id = ?', [id]);
    if (records.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '结算记录不存在'
      });
    }
    
    const record = records[0];
    if (record.status !== 2) {
      return res.status(400).json({
        code: 400,
        message: '只有待审核状态的记录才能进行审核'
      });
    }
    
    await db.update('settlement_records', {
      status: approved ? 3 : 1, // 3-已审核, 1-退回草稿
      approver_id: 1,
      approver_name: '审核员',
      approve_time: new Date(),
      approve_remarks: reason || ''
    }, 'id = ?', [id]);
    
    res.json({
      code: 200,
      message: approved ? '审核通过' : '审核拒绝'
    });
  } catch (error) {
    console.error('审核失败:', error);
    res.status(500).json({
      code: 500,
      message: '审核失败',
      error: error.message
    });
  }
});

// 确认付款
router.post('/records/:id/payment', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      paidAmount,
      paymentDate,
      paymentMethod,
      transactionId,
      remarks
    } = req.body;
    
    const records = await db.query('SELECT * FROM settlement_records WHERE id = ?', [id]);
    if (records.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '结算记录不存在'
      });
    }
    
    const record = records[0];
    const newPaidAmount = (parseFloat(record.paid_amount) || 0) + (parseFloat(paidAmount) || 0);
    const newUnpaidAmount = (parseFloat(record.total_amount) || 0) - newPaidAmount;
    
    await db.transaction(async (connection) => {
      // 创建付款记录
      const paymentData = {
        settlement_id: id,
        payment_amount: paidAmount,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        transaction_id: transactionId || '',
        status: 2, // 已确认
        operator_id: 1,
        operator_name: '系统用户',
        confirm_time: new Date(),
        remarks: remarks || ''
      };
      
      const paymentFields = Object.keys(paymentData).join(', ');
      const paymentPlaceholders = Object.keys(paymentData).map(() => '?').join(', ');
      const paymentValues = Object.values(paymentData);
      
      await connection.execute(
        `INSERT INTO payment_records (${paymentFields}) VALUES (${paymentPlaceholders})`,
        paymentValues
      );
      
      // 更新结算记录状态
      let newStatus = 5; // 部分付款
      if (newUnpaidAmount <= 0) {
        newStatus = 4; // 已付款
      }
      
      await connection.execute(
        'UPDATE settlement_records SET paid_amount = ?, unpaid_amount = ?, status = ? WHERE id = ?',
        [newPaidAmount, Math.max(0, newUnpaidAmount), newStatus, id]
      );
    });
    
    res.json({
      code: 200,
      message: '付款确认成功'
    });
  } catch (error) {
    console.error('确认付款失败:', error);
    res.status(500).json({
      code: 500,
      message: '确认付款失败',
      error: error.message
    });
  }
});

// 费用计算
router.post('/calculate-fees', (req, res) => {
  try {
    const {
      caseId,
      settlementType,
      baseAmount,
      feeTypes,
      customRates = {}
    } = req.body;
    
    // 获取费用规则 - 使用模拟数据
    const rules = mockFeeRules.filter(rule => 
      feeTypes.includes(rule.feeType) && 
      (!rule.settlementType || rule.settlementType === settlementType) &&
      rule.isActive === true
    );
    
    let totalAmount = baseAmount;
    const feeDetails = [];
    const breakdown = [];
    
    for (let feeType of feeTypes) {
      const rule = rules.find(r => r.feeType === feeType);
      if (!rule) continue;
      
      const rate = customRates[feeType] || rule.rate;
      let amount = 0;
      
      // 计算费用金额
      if (rule.formula === 'base_amount * rate') {
        amount = baseAmount * rate;
      } else {
        // 可以扩展其他计算公式
        amount = baseAmount * rate;
      }
      
      // 应用最小最大限制
      if (rule.minAmount && amount < rule.minAmount) {
        amount = rule.minAmount;
      }
      if (rule.maxAmount && amount > rule.maxAmount) {
        amount = rule.maxAmount;
      }
      
      amount = Math.round(amount * 100) / 100; // 保留两位小数
      totalAmount += amount;
      
      feeDetails.push({
        feeType: feeType,
        feeTypeName: rule.feeTypeName,
        description: rule.description,
        baseAmount: baseAmount,
        rate: rate,
        amount: amount,
        calculationMethod: rule.formula,
        formula: rule.formula
      });
      
      breakdown.push({
        feeType: feeType,
        amount: amount,
        rate: rate,
        calculation: `${baseAmount} * ${rate} = ${amount}`
      });
    }
    
    res.json({
      code: 200,
      message: '费用计算成功',
      data: {
        totalAmount: Math.round(totalAmount * 100) / 100,
        feeDetails,
        calculation: {
          baseAmount: baseAmount,
          totalFees: Math.round((totalAmount - baseAmount) * 100) / 100,
          breakdown
        }
      }
    });
  } catch (error) {
    console.error('费用计算失败:', error);
    res.status(500).json({
      code: 500,
      message: '费用计算失败',
      error: error.message
    });
  }
});

// 获取费用规则
router.get('/fee-rules', (req, res) => {
  try {
    const { settlementType } = req.query;
    
    let filteredRules = [...mockFeeRules];
    
    if (settlementType) {
      filteredRules = filteredRules.filter(rule => 
        !rule.settlementType || rule.settlementType === settlementType
      );
    }
    
    res.json({
      code: 200,
      message: '查询成功',
      data: filteredRules
    });
  } catch (error) {
    console.error('获取费用规则失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取费用规则失败',
      error: error.message
    });
  }
});

// 获取结算统计
router.get('/stats', (req, res) => {
  try {
    const { settlementType, clientId } = req.query;
    
    // 过滤数据
    let filteredRecords = [...mockSettlementRecords];
    
    if (settlementType) {
      filteredRecords = filteredRecords.filter(record => 
        record.settlementType === settlementType
      );
    }
    
    if (clientId) {
      filteredRecords = filteredRecords.filter(record => 
        record.clientId == clientId
      );
    }
    
    // 计算统计数据
    const totalCount = filteredRecords.length;
    const totalAmount = filteredRecords.reduce((sum, record) => sum + record.totalAmount, 0);
    const paidAmount = filteredRecords.reduce((sum, record) => sum + record.paidAmount, 0);
    const pendingAmount = filteredRecords.reduce((sum, record) => sum + record.unpaidAmount, 0);
    const paidCount = filteredRecords.filter(record => record.status === 4).length;
    const pendingCount = filteredRecords.filter(record => [1,2,3,5].includes(record.status)).length;
    const overdueCount = filteredRecords.filter(record => record.status === 6).length;
    const overdueAmount = filteredRecords
      .filter(record => record.status === 6)
      .reduce((sum, record) => sum + record.unpaidAmount, 0);
    
    res.json({
      code: 200,
      message: '查询成功',
      data: {
        totalCount,
        totalAmount,
        paidAmount,
        pendingAmount,
        overdueAmount,
        paidCount,
        pendingCount,
        overdueCount
      }
    });
  } catch (error) {
    console.error('获取结算统计失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取结算统计失败',
      error: error.message
    });
  }
});

// 下载结算单
router.get('/records/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 模拟PDF生成 - 实际应用中需要使用PDF生成库
    const pdfContent = `结算单 - ${id}\n这是一个模拟的PDF文件内容\n结算编号: JS${id}\n生成时间: ${new Date().toLocaleString()}`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="settlement_${id}.pdf"`);
    res.send(Buffer.from(pdfContent, 'utf8'));
  } catch (error) {
    console.error('下载结算单失败:', error);
    res.status(500).json({
      code: 500,
      message: '下载结算单失败',
      error: error.message
    });
  }
});

// 获取逾期结算列表
router.get('/overdue', (req, res) => {
  try {
    const { page = 1, size = 10 } = req.query;
    
    // 模拟逾期数据
    const overdueRecords = mockSettlementRecords.filter(record => 
      new Date(record.dueDate) < new Date() && ![4, 7].includes(record.status)
    );
    
    const pageNum = parseInt(page);
    const pageSize = parseInt(size);
    const startIndex = (pageNum - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedRecords = overdueRecords.slice(startIndex, endIndex);
    
    res.json({
      code: 200,
      message: '查询成功',
      data: {
        records: paginatedRecords,
        total: overdueRecords.length,
        current: pageNum,
        size: pageSize,
        pages: Math.ceil(overdueRecords.length / pageSize)
      }
    });
  } catch (error) {
    console.error('获取逾期结算失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取逾期结算失败',
      error: error.message
    });
  }
});

// 获取结算趋势数据
router.get('/trend', (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    // 模拟趋势数据
    const trendData = [];
    const today = new Date();
    
    for (let i = parseInt(days) - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      trendData.push({
        date: date.toISOString().split('T')[0],
        totalAmount: Math.floor(Math.random() * 100000) + 50000,
        paidAmount: Math.floor(Math.random() * 80000) + 30000,
        newCount: Math.floor(Math.random() * 20) + 5,
        paidCount: Math.floor(Math.random() * 15) + 3
      });
    }
    
    res.json({
      code: 200,
      message: '查询成功',
      data: trendData
    });
  } catch (error) {
    console.error('获取趋势数据失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取趋势数据失败',
      error: error.message
    });
  }
});

// 获取账龄分析
router.get('/aging-analysis', (req, res) => {
  try {
    // 模拟账龄分析数据
    const agingData = [
      { ageRange: '0-30天', count: 25, amount: 1250000, percentage: 35 },
      { ageRange: '31-60天', count: 18, amount: 900000, percentage: 25 },
      { ageRange: '61-90天', count: 12, amount: 600000, percentage: 17 },
      { ageRange: '91-180天', count: 8, amount: 400000, percentage: 13 },
      { ageRange: '180天以上', count: 6, amount: 350000, percentage: 10 }
    ];
    
    res.json({
      code: 200,
      message: '查询成功',
      data: agingData
    });
  } catch (error) {
    console.error('获取账龄分析失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取账龄分析失败',
      error: error.message
    });
  }
});

// 生成报表
router.post('/reports/generate', (req, res) => {
  try {
    const { reportType, startDate, endDate, settlementType, groupBy } = req.body;
    
    // 模拟报表生成
    const reportId = `RPT${Date.now()}`;
    const fileName = `${reportType}_report_${startDate}_${endDate}.pdf`;
    
    res.json({
      code: 200,
      message: '报表生成任务已提交',
      data: {
        reportId,
        downloadUrl: `/settlement/reports/${reportId}/download`,
        fileName
      }
    });
  } catch (error) {
    console.error('生成报表失败:', error);
    res.status(500).json({
      code: 500,
      message: '生成报表失败',
      error: error.message
    });
  }
});

// 获取报表列表
router.get('/reports', (req, res) => {
  try {
    const { page = 1, size = 10 } = req.query;
    
    // 模拟报表列表数据
    const mockReports = [
      {
        id: 'RPT1721015840123',
        reportType: 'summary',
        fileName: 'summary_report_2024-07-01_2024-07-15.pdf',
        status: 'completed',
        createTime: '2024-07-15 10:30:40',
        downloadUrl: '/settlement/reports/RPT1721015840123/download',
        fileSize: 2048576
      },
      {
        id: 'RPT1721015840124',
        reportType: 'detail',
        fileName: 'detail_report_2024-07-01_2024-07-15.pdf',
        status: 'completed',
        createTime: '2024-07-15 09:20:30',
        downloadUrl: '/settlement/reports/RPT1721015840124/download',
        fileSize: 5242880
      },
      {
        id: 'RPT1721015840125',
        reportType: 'aging',
        fileName: 'aging_report_2024-07-15.pdf',
        status: 'generating',
        createTime: '2024-07-15 11:45:00',
        downloadUrl: null,
        fileSize: null
      }
    ];
    
    const pageNum = parseInt(page);
    const pageSize = parseInt(size);
    const startIndex = (pageNum - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedReports = mockReports.slice(startIndex, endIndex);
    
    res.json({
      code: 200,
      message: '查询成功',
      data: {
        records: paginatedReports,
        total: mockReports.length,
        current: pageNum,
        size: pageSize,
        pages: Math.ceil(mockReports.length / pageSize)
      }
    });
  } catch (error) {
    console.error('获取报表列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取报表列表失败',
      error: error.message
    });
  }
});

// 下载报表
router.get('/reports/:reportId/download', (req, res) => {
  try {
    const { reportId } = req.params;
    
    // 模拟PDF报表内容
    const reportContent = `结算报表 - ${reportId}\n这是一个模拟的PDF报表文件\n报表ID: ${reportId}\n生成时间: ${new Date().toLocaleString()}\n\n模拟报表数据内容...`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="report_${reportId}.pdf"`);
    res.send(Buffer.from(reportContent, 'utf8'));
  } catch (error) {
    console.error('下载报表失败:', error);
    res.status(500).json({
      code: 500,
      message: '下载报表失败',
      error: error.message
    });
  }
});

// 获取结算模板列表
router.get('/templates', (req, res) => {
  try {
    // 模拟模板数据
    const mockTemplates = [
      {
        id: 1,
        name: '标准调解模板',
        settlementType: 'mediation',
        feeRules: [
          { feeType: 1, rate: 0.15, formula: 'base_amount * rate' },
          { feeType: 4, rate: 0.08, formula: 'base_amount * rate' }
        ],
        isDefault: true,
        createTime: '2024-07-01 10:00:00'
      },
      {
        id: 2,
        name: '诉讼费用模板',
        settlementType: 'litigation',
        feeRules: [
          { feeType: 1, rate: 0.15, formula: 'base_amount * rate' },
          { feeType: 2, rate: 0.10, formula: 'base_amount * rate' }
        ],
        isDefault: true,
        createTime: '2024-07-02 09:30:00'
      },
      {
        id: 3,
        name: '执行阶段模板',
        settlementType: 'execution',
        feeRules: [
          { feeType: 1, rate: 0.15, formula: 'base_amount * rate' },
          { feeType: 3, rate: 0.12, formula: 'base_amount * rate' }
        ],
        isDefault: false,
        createTime: '2024-07-03 14:20:00'
      }
    ];
    
    res.json({
      code: 200,
      message: '查询成功',
      data: mockTemplates
    });
  } catch (error) {
    console.error('获取模板列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取模板列表失败',
      error: error.message
    });
  }
});

// 根据模板创建结算
router.post('/create-from-template', (req, res) => {
  try {
    const { templateId, caseId, customParams } = req.body;
    
    // 模拟根据模板创建结算记录
    const settlementId = Date.now();
    const settlementNumber = `JS${settlementId}`;
    
    res.json({
      code: 200,
      message: '结算记录创建成功',
      data: {
        id: settlementId,
        settlementNumber,
        caseId,
        templateId
      }
    });
  } catch (error) {
    console.error('根据模板创建结算失败:', error);
    res.status(500).json({
      code: 500,
      message: '根据模板创建结算失败',
      error: error.message
    });
  }
});

// 批量提交审核
router.post('/batch-submit', (req, res) => {
  try {
    const { ids } = req.body;
    
    // 模拟批量提交结果
    const result = {
      successCount: ids.length - 1,
      failCount: 1,
      details: ids.map((id, index) => ({
        id,
        success: index !== 0, // 第一个模拟失败
        reason: index === 0 ? '该记录状态不允许提交' : undefined
      }))
    };
    
    res.json({
      code: 200,
      message: '批量提交完成',
      data: result
    });
  } catch (error) {
    console.error('批量提交失败:', error);
    res.status(500).json({
      code: 500,
      message: '批量提交失败',
      error: error.message
    });
  }
});

// 批量审核
router.post('/batch-approve', (req, res) => {
  try {
    const { ids, approved, reason } = req.body;
    
    // 模拟批量审核结果
    const result = {
      successCount: ids.length,
      failCount: 0,
      details: ids.map(id => ({
        id,
        success: true,
        reason: undefined
      }))
    };
    
    res.json({
      code: 200,
      message: '批量审核完成',
      data: result
    });
  } catch (error) {
    console.error('批量审核失败:', error);
    res.status(500).json({
      code: 500,
      message: '批量审核失败',
      error: error.message
    });
  }
});

// 批量导出
router.get('/records/export', (req, res) => {
  try {
    // 模拟Excel文件内容
    const excelContent = '结算记录导出文件\n这是一个模拟的Excel文件内容\n导出时间: ' + new Date().toLocaleString();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="settlement_export.xlsx"');
    res.send(Buffer.from(excelContent, 'utf8'));
  } catch (error) {
    console.error('导出失败:', error);
    res.status(500).json({
      code: 500,
      message: '导出失败',
      error: error.message
    });
  }
});

// 辅助函数：获取费用类型名称
function getFeeTypeName(feeType) {
  const typeMap = {
    1: '服务费',
    2: '诉讼费',
    3: '执行费',
    4: '佣金',
    5: '其他费用'
  };
  return typeMap[feeType] || '未知费用';
}

export default router;