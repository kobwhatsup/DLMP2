import express from 'express';

const router = express.Router();

// 模拟案件数据
const mockCases = [
  {
    id: 1,
    caseNumber: 'CASE001',
    borrowerName: '张三',
    clientName: '浦发银行',
    debtAmount: 50000,
    status: 3,
    createTime: '2024-01-15 10:00:00'
  },
  {
    id: 2,
    caseNumber: 'CASE002',
    borrowerName: '李四',
    clientName: '招商银行',
    debtAmount: 35000,
    status: 3,
    createTime: '2024-02-01 14:00:00'
  },
  {
    id: 3,
    caseNumber: 'CASE003',
    borrowerName: '王五',
    clientName: '中国银行',
    debtAmount: 80000,
    status: 3,
    createTime: '2024-03-10 09:30:00'
  }
];

// 获取案件列表
router.get('/cases', (req, res) => {
  try {
    const { page = 1, size = 10, status } = req.query;
    
    let filteredCases = [...mockCases];
    
    if (status) {
      filteredCases = filteredCases.filter(caseItem => caseItem.status == status);
    }
    
    const pageNum = parseInt(page);
    const pageSize = parseInt(size);
    const startIndex = (pageNum - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedCases = filteredCases.slice(startIndex, endIndex);
    
    res.json({
      code: 200,
      message: '查询成功',
      data: {
        records: paginatedCases,
        total: filteredCases.length,
        current: pageNum,
        size: pageSize,
        pages: Math.ceil(filteredCases.length / pageSize)
      }
    });
  } catch (error) {
    console.error('获取案件列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取案件列表失败',
      error: error.message
    });
  }
});

// 根据ID获取案件详情
router.get('/cases/:id', (req, res) => {
  try {
    const { id } = req.params;
    const caseItem = mockCases.find(c => c.id == id);
    
    if (!caseItem) {
      return res.status(404).json({
        code: 404,
        message: '案件不存在'
      });
    }
    
    res.json({
      code: 200,
      message: '查询成功',
      data: caseItem
    });
  } catch (error) {
    console.error('获取案件详情失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取案件详情失败',
      error: error.message
    });
  }
});

export default router;