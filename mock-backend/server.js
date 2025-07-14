import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 8080;

// 中间件
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
}));
app.use(express.json());

// Mock数据
const mockUsers = [
  {
    id: 1,
    username: 'admin',
    realName: '系统管理员',
    phone: '18888888888',
    email: 'admin@dlmp.com',
    userType: 1,
    organizationId: 1,
    status: 1,
    createdTime: '2024-01-01 00:00:00',
    updatedTime: '2024-07-13 21:00:00'
  },
  {
    id: 2,
    username: 'mediator1',
    realName: '调解员张三',
    phone: '18888888889',
    email: 'mediator1@dlmp.com',
    userType: 2,
    organizationId: 1,
    status: 1,
    createdTime: '2024-01-01 00:00:00',
    updatedTime: '2024-07-13 21:00:00'
  },
  {
    id: 3,
    username: 'client1',
    realName: '委托方代表',
    phone: '18888888890',
    email: 'client1@bank.com',
    userType: 3,
    organizationId: 2,
    status: 1,
    createdTime: '2024-01-01 00:00:00',
    updatedTime: '2024-07-13 21:00:00'
  }
];

const mockCases = [
  {
    id: 1,
    caseNo: 'DLMP20240101001',
    title: '张三个人贷款纠纷案',
    amount: 50000,
    overdueTotalAmount: 50000,
    debtorName: '张三',
    debtorIdCard: '110101199001010001',
    debtorPhone: '13800138001',
    clientName: '某银行',
    status: 1,
    caseStatus: 1,
    assignmentStatus: 0,
    createTime: '2024-01-01',
    createdTime: '2024-01-01 10:00:00',
    updatedTime: '2024-01-01 10:00:00'
  },
  {
    id: 2,
    caseNo: 'DLMP20240101002',
    title: '李四信用卡透支案',
    amount: 80000,
    overdueTotalAmount: 80000,
    debtorName: '李四',
    debtorIdCard: '110101199002020002',
    debtorPhone: '13800138002',
    clientName: '某银行',
    status: 2,
    caseStatus: 2,
    assignmentStatus: 1,
    mediationCenterId: 1,
    mediatorId: 101,
    createTime: '2024-01-02',
    createdTime: '2024-01-02 10:00:00',
    updatedTime: '2024-01-02 10:00:00'
  },
  {
    id: 3,
    caseNo: 'DLMP20240101003',
    title: '王五房贷逾期案',
    amount: 120000,
    overdueTotalAmount: 120000,
    debtorName: '王五',
    debtorIdCard: '110101199003030003',
    debtorPhone: '13800138003',
    clientName: '某银行',
    status: 3,
    caseStatus: 3,
    assignmentStatus: 1,
    mediationCenterId: 1,
    mediatorId: 102,
    createTime: '2024-01-03',
    createdTime: '2024-01-03 10:00:00',
    updatedTime: '2024-01-03 10:00:00'
  },
  {
    id: 4,
    caseNo: 'DLMP20240101004',
    title: '赵六车贷违约案',
    amount: 30000,
    overdueTotalAmount: 30000,
    debtorName: '赵六',
    debtorIdCard: '110101199004040004',
    debtorPhone: '13800138004',
    clientName: '某银行',
    status: 4,
    caseStatus: 4,
    assignmentStatus: 1,
    mediationCenterId: 1,
    mediatorId: 103,
    createTime: '2024-01-04',
    createdTime: '2024-01-04 10:00:00',
    updatedTime: '2024-01-04 10:00:00'
  },
  {
    id: 5,
    caseNo: 'DLMP20240101005',
    title: '孙七消费贷纠纷案',
    amount: 75000,
    overdueTotalAmount: 75000,
    debtorName: '孙七',
    debtorIdCard: '110101199005050005',
    debtorPhone: '13800138005',
    clientName: '某银行',
    status: 4,
    caseStatus: 4,
    assignmentStatus: 1,
    mediationCenterId: 1,
    mediatorId: 101,
    createTime: '2024-01-05',
    createdTime: '2024-01-05 10:00:00',
    updatedTime: '2024-01-05 10:00:00'
  }
];

// Mock调解中心数据
const mockMediationCenters = [
  {
    id: 1,
    name: '北京朝阳调解中心',
    address: '北京市朝阳区建国路88号',
    phone: '010-12345678',
    status: 1,
    createTime: '2024-01-01 00:00:00'
  },
  {
    id: 2,
    name: '北京海淀调解中心',
    address: '北京市海淀区中关村大街1号',
    phone: '010-87654321',
    status: 1,
    createTime: '2024-01-01 00:00:00'
  },
  {
    id: 3,
    name: '上海浦东调解中心',
    address: '上海市浦东新区陆家嘴环路1000号',
    phone: '021-12345678',
    status: 1,
    createTime: '2024-01-01 00:00:00'
  }
];

// Mock调解员数据
const mockMediators = [
  {
    id: 101,
    name: '调解员张三',
    phone: '13800138001',
    email: 'zhangsan@mediation.com',
    mediationCenterId: 1,
    mediationCenterName: '北京朝阳调解中心',
    specialties: ['金融纠纷', '合同纠纷'],
    caseLoad: 25,
    maxCaseLoad: 50,
    successRate: 0.85,
    status: 1,
    createTime: '2024-01-01 00:00:00'
  },
  {
    id: 102,
    name: '调解员李四',
    phone: '13800138002',
    email: 'lisi@mediation.com',
    mediationCenterId: 1,
    mediationCenterName: '北京朝阳调解中心',
    specialties: ['房产纠纷', '借贷纠纷'],
    caseLoad: 30,
    maxCaseLoad: 50,
    successRate: 0.92,
    status: 1,
    createTime: '2024-01-01 00:00:00'
  },
  {
    id: 103,
    name: '调解员王五',
    phone: '13800138003',
    email: 'wangwu@mediation.com',
    mediationCenterId: 2,
    mediationCenterName: '北京海淀调解中心',
    specialties: ['消费纠纷', '服务纠纷'],
    caseLoad: 15,
    maxCaseLoad: 50,
    successRate: 0.78,
    status: 1,
    createTime: '2024-01-01 00:00:00'
  },
  {
    id: 104,
    name: '调解员赵六',
    phone: '13800138004',
    email: 'zhaoliu@mediation.com',
    mediationCenterId: 3,
    mediationCenterName: '上海浦东调解中心',
    specialties: ['金融纠纷', '投资纠纷'],
    caseLoad: 20,
    maxCaseLoad: 50,
    successRate: 0.89,
    status: 1,
    createTime: '2024-01-01 00:00:00'
  }
];

// Mock分案任务数据
const mockAssignmentTasks = [
  {
    id: 1,
    name: '智能分案任务-20240713-001',
    strategy: 'rule_based',
    status: 'completed',
    progress: 100,
    totalCount: 50,
    successCount: 48,
    failCount: 2,
    createTime: '2024-07-13 09:00:00',
    updateTime: '2024-07-13 09:30:00',
    config: {
      strategy: 'rule_based',
      batchSize: 50,
      maxCasesPerMediator: 50
    }
  },
  {
    id: 2,
    name: '地区分案任务-20240713-002',
    strategy: 'region_based',
    status: 'running',
    progress: 65,
    totalCount: 80,
    successCount: 52,
    failCount: 0,
    createTime: '2024-07-13 10:00:00',
    updateTime: '2024-07-13 10:15:00',
    config: {
      strategy: 'region_based',
      batchSize: 80,
      maxCasesPerMediator: 50
    }
  }
];

// Mock分案规则数据
const mockAssignmentRules = [
  {
    id: 1,
    name: '大额案件专项分案规则',
    description: '债务金额超过10万元的案件分配给经验丰富的调解员',
    priority: 1,
    status: 'active',
    executeCount: 125,
    successRate: 0.89,
    conditions: [
      {
        field: 'debtAmount',
        operator: 'gte',
        value: '100000',
        logic: 'AND'
      }
    ],
    actions: [
      {
        type: 'assign_mediator',
        target: '101,102',
        weight: 10
      }
    ],
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-07-13 10:00:00'
  },
  {
    id: 2,
    name: '地区匹配分案规则',
    description: '优先分配给债务人同地区的调解员',
    priority: 2,
    status: 'active',
    executeCount: 320,
    successRate: 0.76,
    conditions: [
      {
        field: 'debtorRegion',
        operator: 'eq',
        value: 'mediatorRegion',
        logic: 'AND'
      }
    ],
    actions: [
      {
        type: 'assign_mediation_center',
        target: 'same_region',
        weight: 8
      }
    ],
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-07-13 10:00:00'
  }
];

// API路由
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') {
    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token: 'mock-jwt-token-' + Date.now(),
        user: mockUsers[0]
      }
    });
  } else {
    res.status(401).json({
      code: 401,
      message: '用户名或密码错误'
    });
  }
});

// 用户登录接口 (与authService匹配)
app.post('/user/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') {
    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token: 'mock-jwt-token-' + Date.now(),
        userId: 1,
        username: 'admin',
        realName: '系统管理员',
        userType: 1
      }
    });
  } else {
    res.status(401).json({
      code: 401,
      message: '用户名或密码错误'
    });
  }
});

// 获取当前用户信息
app.get('/user/auth/current', (req, res) => {
  res.json({
    code: 200,
    message: '获取成功',
    data: {
      id: 1,
      username: 'admin',
      realName: '系统管理员',
      phone: '18888888888',
      email: 'admin@dlmp.com',
      userType: 1,
      status: 1,
      createTime: '2024-01-01 00:00:00',
      updateTime: '2024-07-13 21:00:00'
    }
  });
});

app.get('/api/user/profile', (req, res) => {
  res.json({
    code: 200,
    data: mockUsers[0]
  });
});

app.get('/api/user/list', (req, res) => {
  res.json({
    code: 200,
    data: {
      list: mockUsers,
      total: mockUsers.length
    }
  });
});

app.get('/api/case/list', (req, res) => {
  res.json({
    code: 200,
    data: {
      list: mockCases,
      total: mockCases.length
    }
  });
});

app.get('/api/case/:id', (req, res) => {
  const case_ = mockCases.find(c => c.id == req.params.id);
  if (case_) {
    res.json({
      code: 200,
      data: case_
    });
  } else {
    res.status(404).json({
      code: 404,
      message: '案件不存在'
    });
  }
});

// 案件服务API
app.get('/case/cases', (req, res) => {
  const { page = 1, size = 10, caseNo, debtorName, debtorIdCard, caseStatus, assignmentStatus } = req.query;
  
  let filteredCases = [...mockCases];
  
  // 过滤条件
  if (caseNo) {
    filteredCases = filteredCases.filter(c => c.caseNo.includes(caseNo));
  }
  if (debtorName) {
    filteredCases = filteredCases.filter(c => c.debtorName.includes(debtorName));
  }
  if (debtorIdCard) {
    filteredCases = filteredCases.filter(c => c.debtorIdCard.includes(debtorIdCard));
  }
  if (caseStatus) {
    filteredCases = filteredCases.filter(c => c.caseStatus == caseStatus);
  }
  if (assignmentStatus !== undefined) {
    filteredCases = filteredCases.filter(c => c.assignmentStatus == assignmentStatus);
  }
  
  // 分页
  const pageNum = parseInt(page);
  const pageSize = parseInt(size);
  const total = filteredCases.length;
  const start = (pageNum - 1) * pageSize;
  const end = start + pageSize;
  const records = filteredCases.slice(start, end);
  
  res.json({
    code: 200,
    message: '查询成功',
    data: {
      records,
      total,
      size: pageSize,
      current: pageNum,
      pages: Math.ceil(total / pageSize)
    }
  });
});

app.get('/case/cases/:id', (req, res) => {
  const case_ = mockCases.find(c => c.id == req.params.id);
  if (case_) {
    res.json({
      code: 200,
      message: '查询成功',
      data: case_
    });
  } else {
    res.status(404).json({
      code: 404,
      message: '案件不存在'
    });
  }
});

app.post('/case/cases', (req, res) => {
  const newCase = {
    id: Math.max(...mockCases.map(c => c.id)) + 1,
    ...req.body,
    createTime: new Date().toISOString().split('T')[0],
    createdTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
    updatedTime: new Date().toISOString().replace('T', ' ').slice(0, 19)
  };
  mockCases.push(newCase);
  res.json({
    code: 200,
    message: '创建成功',
    data: newCase
  });
});

app.put('/case/cases/:id', (req, res) => {
  const index = mockCases.findIndex(c => c.id == req.params.id);
  if (index !== -1) {
    mockCases[index] = {
      ...mockCases[index],
      ...req.body,
      updatedTime: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };
    res.json({
      code: 200,
      message: '更新成功',
      data: mockCases[index]
    });
  } else {
    res.status(404).json({
      code: 404,
      message: '案件不存在'
    });
  }
});

app.delete('/case/cases/:id', (req, res) => {
  const index = mockCases.findIndex(c => c.id == req.params.id);
  if (index !== -1) {
    const deletedCase = mockCases.splice(index, 1)[0];
    res.json({
      code: 200,
      message: '删除成功',
      data: deletedCase
    });
  } else {
    res.status(404).json({
      code: 404,
      message: '案件不存在'
    });
  }
});

// 批量导入案件
app.post('/case/cases/batch-import', (req, res) => {
  const { cases } = req.body;
  
  if (!Array.isArray(cases) || cases.length === 0) {
    return res.status(400).json({
      code: 400,
      message: '导入数据不能为空'
    });
  }
  
  const results = {
    total: cases.length,
    success: 0,
    failed: 0,
    errors: []
  };
  
  cases.forEach((caseData, index) => {
    try {
      // 简单验证
      if (!caseData.debtorName || !caseData.debtorIdCard || !caseData.amount) {
        results.failed++;
        results.errors.push({
          row: index + 1,
          message: '必填字段缺失'
        });
        return;
      }
      
      // 模拟添加到数据库
      const newCase = {
        id: Math.max(...mockCases.map(c => c.id)) + index + 1,
        caseNo: caseData.caseNo || `DLMP${Date.now()}${index}`,
        title: `${caseData.debtorName}债务纠纷案`,
        amount: caseData.amount,
        overdueTotalAmount: caseData.overdueTotalAmount || caseData.amount,
        debtorName: caseData.debtorName,
        debtorIdCard: caseData.debtorIdCard,
        debtorPhone: caseData.debtorPhone,
        clientName: caseData.clientName,
        status: 1,
        caseStatus: 1,
        assignmentStatus: 0,
        createTime: new Date().toISOString().split('T')[0],
        createdTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
        updatedTime: new Date().toISOString().replace('T', ' ').slice(0, 19)
      };
      
      mockCases.push(newCase);
      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        row: index + 1,
        message: error.message || '导入失败'
      });
    }
  });
  
  res.json({
    code: 200,
    message: '批量导入完成',
    data: results
  });
});

// 用户管理API
app.get('/user/users', (req, res) => {
  const { page = 1, size = 10, username, realName, userType, status } = req.query;
  
  let filteredUsers = [...mockUsers];
  
  // 过滤条件
  if (username) {
    filteredUsers = filteredUsers.filter(u => u.username.includes(username));
  }
  if (realName) {
    filteredUsers = filteredUsers.filter(u => u.realName.includes(realName));
  }
  if (userType) {
    filteredUsers = filteredUsers.filter(u => u.userType == userType);
  }
  if (status !== undefined) {
    filteredUsers = filteredUsers.filter(u => u.status == status);
  }
  
  // 分页
  const pageNum = parseInt(page);
  const pageSize = parseInt(size);
  const total = filteredUsers.length;
  const start = (pageNum - 1) * pageSize;
  const end = start + pageSize;
  const records = filteredUsers.slice(start, end);
  
  res.json({
    code: 200,
    message: '查询成功',
    data: {
      records,
      total,
      size: pageSize,
      current: pageNum,
      pages: Math.ceil(total / pageSize)
    }
  });
});

app.get('/user/users/:id', (req, res) => {
  const user = mockUsers.find(u => u.id == req.params.id);
  if (user) {
    res.json({
      code: 200,
      message: '查询成功',
      data: user
    });
  } else {
    res.status(404).json({
      code: 404,
      message: '用户不存在'
    });
  }
});

app.post('/user/users', (req, res) => {
  const newUser = {
    id: Math.max(...mockUsers.map(u => u.id)) + 1,
    ...req.body,
    createdTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
    updatedTime: new Date().toISOString().replace('T', ' ').slice(0, 19)
  };
  mockUsers.push(newUser);
  res.json({
    code: 200,
    message: '创建成功',
    data: newUser
  });
});

app.put('/user/users/:id', (req, res) => {
  const index = mockUsers.findIndex(u => u.id == req.params.id);
  if (index !== -1) {
    mockUsers[index] = {
      ...mockUsers[index],
      ...req.body,
      updatedTime: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };
    res.json({
      code: 200,
      message: '更新成功',
      data: mockUsers[index]
    });
  } else {
    res.status(404).json({
      code: 404,
      message: '用户不存在'
    });
  }
});

app.delete('/user/users/:id', (req, res) => {
  const index = mockUsers.findIndex(u => u.id == req.params.id);
  if (index !== -1) {
    const deletedUser = mockUsers.splice(index, 1)[0];
    res.json({
      code: 200,
      message: '删除成功',
      data: deletedUser
    });
  } else {
    res.status(404).json({
      code: 404,
      message: '用户不存在'
    });
  }
});

// 智能分案API接口

// 获取分案任务列表
app.get('/assignment/tasks', (req, res) => {
  const { page = 1, size = 10, status, strategy } = req.query;
  
  let filteredTasks = [...mockAssignmentTasks];
  
  if (status) {
    filteredTasks = filteredTasks.filter(t => t.status === status);
  }
  if (strategy) {
    filteredTasks = filteredTasks.filter(t => t.strategy === strategy);
  }
  
  const pageNum = parseInt(page);
  const pageSize = parseInt(size);
  const total = filteredTasks.length;
  const start = (pageNum - 1) * pageSize;
  const end = start + pageSize;
  const records = filteredTasks.slice(start, end);
  
  res.json({
    code: 200,
    message: '查询成功',
    data: {
      records,
      total,
      size: pageSize,
      current: pageNum,
      pages: Math.ceil(total / pageSize)
    }
  });
});

// 获取分案规则列表
app.get('/assignment/rules', (req, res) => {
  const { page = 1, size = 10, name, status } = req.query;
  
  let filteredRules = [...mockAssignmentRules];
  
  if (name) {
    filteredRules = filteredRules.filter(r => r.name.includes(name));
  }
  if (status) {
    filteredRules = filteredRules.filter(r => r.status === status);
  }
  
  const pageNum = parseInt(page);
  const pageSize = parseInt(size);
  const total = filteredRules.length;
  const start = (pageNum - 1) * pageSize;
  const end = start + pageSize;
  const records = filteredRules.slice(start, end);
  
  res.json({
    code: 200,
    message: '查询成功',
    data: {
      records,
      total,
      size: pageSize,
      current: pageNum,
      pages: Math.ceil(total / pageSize)
    }
  });
});

// 获取调解中心列表
app.get('/assignment/mediation-centers', (req, res) => {
  res.json({
    code: 200,
    message: '查询成功',
    data: mockMediationCenters
  });
});

// 获取调解员列表
app.get('/assignment/mediators', (req, res) => {
  const { mediationCenterId } = req.query;
  
  let filteredMediators = [...mockMediators];
  
  if (mediationCenterId) {
    filteredMediators = filteredMediators.filter(m => m.mediationCenterId == mediationCenterId);
  }
  
  res.json({
    code: 200,
    message: '查询成功',
    data: filteredMediators
  });
});

// 启动智能分案
app.post('/assignment/smart-assignment/start', (req, res) => {
  const config = req.body;
  
  // 创建新的分案任务
  const newTask = {
    id: Math.max(...mockAssignmentTasks.map(t => t.id)) + 1,
    name: `智能分案任务-${new Date().toISOString().slice(0, 10)}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    strategy: config.strategy,
    status: 'running',
    progress: 0,
    totalCount: Math.floor(Math.random() * 100) + 20,
    successCount: 0,
    failCount: 0,
    createTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
    updateTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
    config: config
  };
  
  mockAssignmentTasks.unshift(newTask);
  
  // 模拟任务执行进度
  setTimeout(() => {
    const task = mockAssignmentTasks.find(t => t.id === newTask.id);
    if (task) {
      task.progress = 50;
      task.successCount = Math.floor(task.totalCount * 0.4);
    }
  }, 2000);
  
  setTimeout(() => {
    const task = mockAssignmentTasks.find(t => t.id === newTask.id);
    if (task) {
      task.progress = 100;
      task.status = 'completed';
      task.successCount = Math.floor(task.totalCount * 0.9);
      task.failCount = task.totalCount - task.successCount;
    }
  }, 5000);
  
  res.json({
    code: 200,
    message: '智能分案任务已启动',
    data: {
      taskId: newTask.id,
      message: '任务已创建并开始执行'
    }
  });
});

// 停止智能分案
app.post('/assignment/smart-assignment/stop', (req, res) => {
  // 停止所有运行中的任务
  mockAssignmentTasks.forEach(task => {
    if (task.status === 'running') {
      task.status = 'cancelled';
      task.updateTime = new Date().toISOString().replace('T', ' ').slice(0, 19);
    }
  });
  
  res.json({
    code: 200,
    message: '智能分案已停止'
  });
});

// 暂停分案任务
app.put('/assignment/tasks/:id/pause', (req, res) => {
  const taskId = parseInt(req.params.id);
  const task = mockAssignmentTasks.find(t => t.id === taskId);
  
  if (task && task.status === 'running') {
    task.status = 'paused';
    task.updateTime = new Date().toISOString().replace('T', ' ').slice(0, 19);
    
    res.json({
      code: 200,
      message: '任务已暂停'
    });
  } else {
    res.status(404).json({
      code: 404,
      message: '任务不存在或状态不正确'
    });
  }
});

// 启动分案任务
app.put('/assignment/tasks/:id/start', (req, res) => {
  const taskId = parseInt(req.params.id);
  const task = mockAssignmentTasks.find(t => t.id === taskId);
  
  if (task && (task.status === 'pending' || task.status === 'paused')) {
    task.status = 'running';
    task.updateTime = new Date().toISOString().replace('T', ' ').slice(0, 19);
    
    res.json({
      code: 200,
      message: '任务已启动'
    });
  } else {
    res.status(404).json({
      code: 404,
      message: '任务不存在或状态不正确'
    });
  }
});

// 创建分案规则
app.post('/assignment/rules', (req, res) => {
  const ruleData = req.body;
  
  const newRule = {
    id: Math.max(...mockAssignmentRules.map(r => r.id)) + 1,
    ...ruleData,
    executeCount: 0,
    successRate: 0,
    createTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
    updateTime: new Date().toISOString().replace('T', ' ').slice(0, 19)
  };
  
  mockAssignmentRules.unshift(newRule);
  
  res.json({
    code: 200,
    message: '规则创建成功',
    data: newRule
  });
});

// 更新分案规则
app.put('/assignment/rules/:id', (req, res) => {
  const ruleId = parseInt(req.params.id);
  const ruleData = req.body;
  const index = mockAssignmentRules.findIndex(r => r.id === ruleId);
  
  if (index !== -1) {
    mockAssignmentRules[index] = {
      ...mockAssignmentRules[index],
      ...ruleData,
      updateTime: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };
    
    res.json({
      code: 200,
      message: '规则更新成功',
      data: mockAssignmentRules[index]
    });
  } else {
    res.status(404).json({
      code: 404,
      message: '规则不存在'
    });
  }
});

// 删除分案规则
app.delete('/assignment/rules/:id', (req, res) => {
  const ruleId = parseInt(req.params.id);
  const index = mockAssignmentRules.findIndex(r => r.id === ruleId);
  
  if (index !== -1) {
    const deletedRule = mockAssignmentRules.splice(index, 1)[0];
    res.json({
      code: 200,
      message: '规则删除成功',
      data: deletedRule
    });
  } else {
    res.status(404).json({
      code: 404,
      message: '规则不存在'
    });
  }
});

// 更新规则状态
app.put('/assignment/rules/:id/status', (req, res) => {
  const ruleId = parseInt(req.params.id);
  const { status } = req.body;
  const rule = mockAssignmentRules.find(r => r.id === ruleId);
  
  if (rule) {
    rule.status = status;
    rule.updateTime = new Date().toISOString().replace('T', ' ').slice(0, 19);
    
    res.json({
      code: 200,
      message: '状态更新成功'
    });
  } else {
    res.status(404).json({
      code: 404,
      message: '规则不存在'
    });
  }
});

// 获取分案统计
app.get('/assignment/stats', (req, res) => {
  const { startDate, endDate } = req.query;
  
  res.json({
    code: 200,
    message: '查询成功',
    data: {
      totalAssigned: 1250,
      successRate: 0.87,
      avgAssignTime: 2.5,
      ruleEffectiveness: mockAssignmentRules.map(rule => ({
        ruleId: rule.id,
        ruleName: rule.name,
        executeCount: rule.executeCount,
        successRate: rule.successRate
      })),
      mediatorDistribution: mockMediators.map(mediator => ({
        mediatorId: mediator.id,
        mediatorName: mediator.name,
        assignedCount: mediator.caseLoad,
        workloadRate: mediator.caseLoad / mediator.maxCaseLoad
      }))
    }
  });
});

// Mock调解案件数据
const mockMediationCases = [
  {
    id: 1,
    caseId: 2,
    caseNumber: 'DLMP20240101002',
    borrowerName: '李四',
    debtorIdCard: '110101199002020002',
    debtorPhone: '13800138002',
    amount: 80000,
    clientName: '某银行',
    mediatorId: 101,
    mediatorName: '调解员张三',
    mediationCenterId: 1,
    mediationCenterName: '北京朝阳调解中心',
    status: 2, // 1-待调解, 2-调解中, 3-调解成功, 4-调解失败, 5-已撤案
    step: 2, // 1-案件受理, 2-联系当事人, 3-调解进行中, 4-达成协议, 5-调解完成
    mediationMethod: 'online', // online, offline, phone
    mediationLocation: '线上视频调解',
    appointmentTime: '2024-07-15 14:00:00',
    expectedDuration: 120,
    mediationPlan: '通过线上调解方式，协助双方达成还款协议',
    createTime: '2024-07-13 10:00:00',
    updateTime: '2024-07-13 15:30:00',
    remarks: '债务人配合度较高，有还款意愿'
  },
  {
    id: 2,
    caseId: 3,
    caseNumber: 'DLMP20240101003',
    borrowerName: '王五',
    debtorIdCard: '110101199003030003',
    debtorPhone: '13800138003',
    amount: 120000,
    clientName: '某银行',
    mediatorId: 102,
    mediatorName: '调解员李四',
    mediationCenterId: 1,
    mediationCenterName: '北京朝阳调解中心',
    status: 3,
    step: 5,
    mediationMethod: 'offline',
    mediationLocation: '北京朝阳调解中心第一调解室',
    appointmentTime: '2024-07-14 09:00:00',
    expectedDuration: 180,
    mediationPlan: '面对面调解，重点协商分期还款方案',
    createTime: '2024-07-12 14:00:00',
    updateTime: '2024-07-14 12:00:00',
    remarks: '调解成功，双方达成分期还款协议',
    agreementAmount: 120000,
    paymentSchedule: '分12期，每月还款10000元'
  },
  {
    id: 3,
    caseId: 4,
    caseNumber: 'DLMP20240101004',
    borrowerName: '赵六',
    debtorIdCard: '110101199004040004',
    debtorPhone: '13800138004',
    amount: 30000,
    clientName: '某银行',
    mediatorId: 103,
    mediatorName: '调解员王五',
    mediationCenterId: 1,
    mediationCenterName: '北京朝阳调解中心',
    status: 4, // 调解失败
    step: 3,
    mediationMethod: 'phone',
    mediationLocation: '电话调解',
    appointmentTime: '2024-07-10 16:00:00',
    expectedDuration: 60,
    mediationPlan: '通过电话沟通，了解债务人还款意愿',
    createTime: '2024-07-08 09:00:00',
    updateTime: '2024-07-10 17:00:00',
    remarks: '债务人拒绝还款，无还款意愿，调解失败',
    failureReason: '债务人拒绝调解，无还款意愿'
  },
  {
    id: 4,
    caseId: 5,
    caseNumber: 'DLMP20240101005',
    borrowerName: '孙七',
    debtorIdCard: '110101199005050005',
    debtorPhone: '13800138005',
    amount: 75000,
    clientName: '某银行',
    mediatorId: 101,
    mediatorName: '调解员张三',
    mediationCenterId: 1,
    mediationCenterName: '北京朝阳调解中心',
    status: 4, // 调解失败
    step: 4,
    mediationMethod: 'offline',
    mediationLocation: '北京朝阳调解中心第二调解室',
    appointmentTime: '2024-07-09 10:00:00',
    expectedDuration: 120,
    mediationPlan: '现场调解，协商分期还款方案',
    createTime: '2024-07-05 14:00:00',
    updateTime: '2024-07-09 12:30:00',
    remarks: '债务人不同意任何还款方案，调解失败',
    failureReason: '债务人态度强硬，拒绝任何还款方案'
  }
];

// Mock调解记录数据
const mockMediationRecords = [
  {
    id: 1,
    caseId: 1,
    type: 'contact',
    title: '首次联系债务人',
    content: '通过电话联系债务人李四，确认其联系方式和基本情况。债务人表示愿意配合调解，有还款意愿但资金困难。',
    contactTime: '2024-07-13 15:00:00',
    createTime: '2024-07-13 15:30:00',
    attachments: []
  },
  {
    id: 2,
    caseId: 1,
    type: 'mediation',
    title: '第一次调解会议',
    content: '组织债权人和债务人进行首次调解。债务人说明了经济困难情况，债权人了解了实际情况。初步商讨分期还款方案。',
    contactTime: '2024-07-14 14:00:00',
    createTime: '2024-07-14 16:00:00',
    attachments: [
      {
        name: '调解会议记录.pdf',
        url: '/uploads/mediation_record_1.pdf',
        size: 256000
      }
    ]
  }
];

// Mock文书模板数据
const mockDocumentTemplates = [
  {
    id: 1,
    name: '调解协议书',
    type: 'agreement',
    description: '标准调解协议书模板',
    templateUrl: '/templates/mediation_agreement.docx',
    variables: ['borrowerName', 'creditorName', 'amount', 'paymentSchedule'],
    createTime: '2024-01-01 00:00:00'
  },
  {
    id: 2,
    name: '调解通知书',
    type: 'notification',
    description: '调解通知书模板',
    templateUrl: '/templates/mediation_notice.docx',
    variables: ['borrowerName', 'caseNumber', 'mediationTime', 'mediationLocation'],
    createTime: '2024-01-01 00:00:00'
  },
  {
    id: 3,
    name: '调解失败确认书',
    type: 'failure',
    description: '调解失败确认书模板',
    templateUrl: '/templates/mediation_failure.docx',
    variables: ['borrowerName', 'creditorName', 'caseNumber', 'failureReason'],
    createTime: '2024-01-01 00:00:00'
  }
];

// ==================== 调解管理API ====================

// 获取调解案件列表
app.get('/mediation/cases', (req, res) => {
  const { page = 1, size = 10, caseNumber, borrowerName, mediatorName, status, mediationCenterId, mediatorId } = req.query;
  
  let filteredCases = [...mockMediationCases];
  
  // 过滤条件
  if (caseNumber) {
    filteredCases = filteredCases.filter(c => c.caseNumber.includes(caseNumber));
  }
  if (borrowerName) {
    filteredCases = filteredCases.filter(c => c.borrowerName.includes(borrowerName));
  }
  if (mediatorName) {
    filteredCases = filteredCases.filter(c => c.mediatorName.includes(mediatorName));
  }
  if (status) {
    filteredCases = filteredCases.filter(c => c.status == status);
  }
  if (mediationCenterId) {
    filteredCases = filteredCases.filter(c => c.mediationCenterId == mediationCenterId);
  }
  if (mediatorId) {
    filteredCases = filteredCases.filter(c => c.mediatorId == mediatorId);
  }
  
  // 分页
  const pageNum = parseInt(page);
  const pageSize = parseInt(size);
  const total = filteredCases.length;
  const start = (pageNum - 1) * pageSize;
  const end = start + pageSize;
  const records = filteredCases.slice(start, end);
  
  res.json({
    code: 200,
    message: '查询成功',
    data: {
      records,
      total,
      size: pageSize,
      current: pageNum,
      pages: Math.ceil(total / pageSize)
    }
  });
});

// 创建新的调解案件
app.post('/mediation/cases', (req, res) => {
  const caseData = req.body;
  
  // 生成新的案件编号
  const caseNumber = `DLMP${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(Math.max(...mockMediationCases.map(c => c.id)) + 1).padStart(3, '0')}`;
  
  const newCase = {
    id: Math.max(...mockMediationCases.map(c => c.id)) + 1,
    caseId: Math.max(...mockCases.map(c => c.id)) + 1,
    caseNumber: caseNumber,
    borrowerName: caseData.borrowerName,
    amount: caseData.amount || 0,
    debtorIdCard: caseData.debtorIdCard,
    debtorPhone: caseData.debtorPhone,
    clientName: caseData.clientName || '系统录入',
    mediatorId: caseData.mediatorId,
    mediatorName: caseData.mediatorName || '待分配',
    mediationCenterId: caseData.mediationCenterId,
    mediationCenterName: caseData.mediationCenterName || '待分配',
    status: 1, // 待调解
    step: 1, // 案件受理
    mediationMethod: caseData.mediationMethod || 'online',
    mediationLocation: caseData.mediationLocation || '线上调解',
    appointmentTime: caseData.appointmentTime,
    expectedDuration: caseData.expectedDuration || 120,
    mediationPlan: caseData.mediationPlan || '',
    createTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
    updateTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
    remarks: caseData.remarks || ''
  };
  
  // 如果是从现有案件创建，需要同步创建对应的案件记录
  if (caseData.createFromCase) {
    const newCaseRecord = {
      id: newCase.caseId,
      caseNo: newCase.caseNumber,
      title: `${caseData.borrowerName}债务纠纷案`,
      amount: caseData.amount,
      overdueTotalAmount: caseData.amount,
      debtorName: caseData.borrowerName,
      debtorIdCard: caseData.debtorIdCard,
      debtorPhone: caseData.debtorPhone,
      clientName: caseData.clientName,
      status: 2, // 已分案
      caseStatus: 2, // 调解中
      assignmentStatus: 1, // 已分配
      mediationCenterId: caseData.mediationCenterId,
      mediatorId: caseData.mediatorId,
      createTime: new Date().toISOString().slice(0, 10),
      createdTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      updatedTime: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };
    mockCases.push(newCaseRecord);
  }
  
  mockMediationCases.unshift(newCase);
  
  res.json({
    code: 200,
    message: '调解案件创建成功',
    data: newCase
  });
});

// 从现有案件创建调解案件
app.post('/mediation/cases/from-case', (req, res) => {
  const { caseId, mediatorId, mediationCenterId, mediationMethod, appointmentTime, mediationPlan, remarks } = req.body;
  
  // 查找原案件
  const originalCase = mockCases.find(c => c.id === caseId);
  if (!originalCase) {
    return res.status(404).json({
      code: 404,
      message: '原案件不存在'
    });
  }
  
  // 查找调解员信息
  const mediator = mockMediators.find(m => m.id === mediatorId);
  const mediationCenter = mockMediationCenters.find(mc => mc.id === mediationCenterId);
  
  const newMediationCase = {
    id: Math.max(...mockMediationCases.map(c => c.id)) + 1,
    caseId: originalCase.id,
    caseNumber: originalCase.caseNo,
    borrowerName: originalCase.debtorName,
    amount: originalCase.amount,
    debtorIdCard: originalCase.debtorIdCard,
    debtorPhone: originalCase.debtorPhone,
    clientName: originalCase.clientName,
    mediatorId: mediatorId,
    mediatorName: mediator ? mediator.name : '未知调解员',
    mediationCenterId: mediationCenterId,
    mediationCenterName: mediationCenter ? mediationCenter.name : '未知调解中心',
    status: 1, // 待调解
    step: 1, // 案件受理
    mediationMethod: mediationMethod || 'online',
    mediationLocation: mediationCenter ? mediationCenter.address : '线上调解',
    appointmentTime: appointmentTime,
    expectedDuration: 120,
    mediationPlan: mediationPlan || '',
    createTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
    updateTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
    remarks: remarks || ''
  };
  
  // 更新原案件状态
  originalCase.status = 2; // 已分案
  originalCase.caseStatus = 2; // 调解中
  originalCase.assignmentStatus = 1; // 已分配
  originalCase.mediationCenterId = mediationCenterId;
  originalCase.mediatorId = mediatorId;
  originalCase.updatedTime = new Date().toISOString().replace('T', ' ').slice(0, 19);
  
  mockMediationCases.unshift(newMediationCase);
  
  res.json({
    code: 200,
    message: '调解案件创建成功',
    data: newMediationCase
  });
});

// 获取可用于创建调解的案件列表
app.get('/mediation/available-cases', (req, res) => {
  const { page = 1, size = 10, search } = req.query;
  
  // 筛选未分配调解的案件
  let availableCases = mockCases.filter(c => 
    (c.assignmentStatus === 0 || !c.mediationCenterId) && 
    c.status === 1 // 待处理状态
  );
  
  // 搜索过滤
  if (search) {
    availableCases = availableCases.filter(c => 
      c.caseNo.includes(search) || 
      c.debtorName.includes(search) ||
      c.debtorPhone?.includes(search)
    );
  }
  
  const total = availableCases.length;
  const startIndex = (page - 1) * size;
  const endIndex = startIndex + parseInt(size);
  const records = availableCases.slice(startIndex, endIndex);
  
  res.json({
    code: 200,
    message: '查询成功',
    data: {
      records: records,
      total: total,
      size: parseInt(size),
      current: parseInt(page),
      pages: Math.ceil(total / size)
    }
  });
});

// 获取调解案件详情
app.get('/mediation/cases/:id', (req, res) => {
  const caseId = parseInt(req.params.id);
  const mediationCase = mockMediationCases.find(c => c.id === caseId);
  
  if (mediationCase) {
    res.json({
      code: 200,
      message: '查询成功',
      data: mediationCase
    });
  } else {
    res.status(404).json({
      code: 404,
      message: '调解案件不存在'
    });
  }
});

// 更新调解案件
app.put('/mediation/cases/:id', (req, res) => {
  const caseId = parseInt(req.params.id);
  const index = mockMediationCases.findIndex(c => c.id === caseId);
  
  if (index !== -1) {
    mockMediationCases[index] = {
      ...mockMediationCases[index],
      ...req.body,
      updateTime: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };
    
    res.json({
      code: 200,
      message: '更新成功',
      data: mockMediationCases[index]
    });
  } else {
    res.status(404).json({
      code: 404,
      message: '调解案件不存在'
    });
  }
});

// 更新调解步骤
app.put('/mediation/cases/:id/step', (req, res) => {
  const caseId = parseInt(req.params.id);
  const { step } = req.body;
  const index = mockMediationCases.findIndex(c => c.id === caseId);
  
  if (index !== -1) {
    mockMediationCases[index].step = step;
    mockMediationCases[index].updateTime = new Date().toISOString().replace('T', ' ').slice(0, 19);
    
    res.json({
      code: 200,
      message: '步骤更新成功'
    });
  } else {
    res.status(404).json({
      code: 404,
      message: '调解案件不存在'
    });
  }
});

// 完成调解
app.put('/mediation/cases/:id/complete', (req, res) => {
  const caseId = parseInt(req.params.id);
  const index = mockMediationCases.findIndex(c => c.id === caseId);
  
  if (index !== -1) {
    mockMediationCases[index] = {
      ...mockMediationCases[index],
      ...req.body,
      step: 5,
      updateTime: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };
    
    res.json({
      code: 200,
      message: '调解完成'
    });
  } else {
    res.status(404).json({
      code: 404,
      message: '调解案件不存在'
    });
  }
});

// 获取调解记录
app.get('/mediation/cases/:id/records', (req, res) => {
  const caseId = parseInt(req.params.id);
  const records = mockMediationRecords.filter(r => r.caseId === caseId);
  
  res.json({
    code: 200,
    message: '查询成功',
    data: records
  });
});

// 添加调解记录
app.post('/mediation/cases/:id/records', (req, res) => {
  const caseId = parseInt(req.params.id);
  const newRecord = {
    id: Math.max(...mockMediationRecords.map(r => r.id)) + 1,
    caseId: caseId,
    ...req.body,
    createTime: new Date().toISOString().replace('T', ' ').slice(0, 19)
  };
  
  mockMediationRecords.push(newRecord);
  
  res.json({
    code: 200,
    message: '记录添加成功',
    data: newRecord
  });
});

// 获取文书模板列表
app.get('/mediation/document-templates', (req, res) => {
  res.json({
    code: 200,
    message: '查询成功',
    data: mockDocumentTemplates
  });
});

// 生成文书
app.post('/mediation/cases/:id/documents', (req, res) => {
  const caseId = parseInt(req.params.id);
  const { templateId, title } = req.body;
  
  const document = {
    documentId: Math.floor(Math.random() * 1000) + 1,
    downloadUrl: `/downloads/document_${caseId}_${Date.now()}.pdf`,
    fileName: `${title || '调解文书'}_${new Date().toISOString().slice(0, 10)}.pdf`
  };
  
  res.json({
    code: 200,
    message: '文书生成成功',
    data: document
  });
});

// 获取调解统计
app.get('/mediation/stats', (req, res) => {
  res.json({
    code: 200,
    message: '查询成功',
    data: {
      totalCases: 150,
      successCount: 98,
      failedCount: 25,
      inProgressCount: 27,
      successRate: 0.653,
      avgDuration: 15.5,
      avgSettlementAmount: 85000,
      mediatorPerformance: mockMediators.map(mediator => ({
        mediatorId: mediator.id,
        mediatorName: mediator.name,
        caseCount: Math.floor(Math.random() * 20) + 10,
        successCount: Math.floor(Math.random() * 15) + 8,
        successRate: (Math.random() * 0.4 + 0.6).toFixed(3),
        avgDuration: Math.floor(Math.random() * 10) + 10
      }))
    }
  });
});

// 获取调解员列表 (调解模块专用)
app.get('/mediation/mediators', (req, res) => {
  const { mediationCenterId } = req.query;
  
  let filteredMediators = mockMediators.map(mediator => ({
    ...mediator,
    specialty: mediator.specialties,
    level: Math.floor(Math.random() * 3) + 1, // 1-初级, 2-中级, 3-高级
    currentCases: mediator.caseLoad,
    maxCases: mediator.maxCaseLoad,
    workloadRate: mediator.caseLoad / mediator.maxCaseLoad
  }));
  
  if (mediationCenterId) {
    filteredMediators = filteredMediators.filter(m => m.mediationCenterId == mediationCenterId);
  }
  
  res.json({
    code: 200,
    message: '查询成功',
    data: filteredMediators
  });
});

// 发送通知
app.post('/mediation/cases/:id/notifications', (req, res) => {
  res.json({
    code: 200,
    message: '通知发送成功'
  });
});

// 批量分配调解员
app.post('/mediation/batch-assign', (req, res) => {
  const { caseIds, mediatorId } = req.body;
  
  res.json({
    code: 200,
    message: '批量分配成功',
    data: {
      successCount: caseIds.length,
      failCount: 0,
      details: caseIds.map(caseId => ({
        caseId,
        success: true
      }))
    }
  });
});

// Mock诉讼案件数据
const mockLitigationCases = [
  {
    id: 1,
    caseId: 2,
    caseNumber: 'DLMP20240101002-S',
    borrowerName: '李四',
    debtAmount: 80000,
    courtName: '北京市朝阳区人民法院',
    courtCaseNumber: '(2024)京0105民初1234号',
    judgeName: '张法官',
    plaintiffLawyer: '律师王某',
    status: 2, // 审理中
    stage: 2, // 开庭审理阶段
    progress: 60,
    filingDate: '2024-07-10',
    trialDate: '2024-07-20 09:00:00',
    judgmentDate: null,
    judgmentAmount: null,
    recoveredAmount: 0,
    executionCourt: null,
    caseDescription: '信用卡逾期纠纷案件，债务人拒绝还款',
    remarks: '案件证据充分，胜诉把握较大',
    createTime: '2024-07-08 10:00:00',
    updateTime: '2024-07-15 16:30:00'
  },
  {
    id: 2,
    caseId: 3,
    caseNumber: 'DLMP20240101003-S',
    borrowerName: '王五',
    debtAmount: 120000,
    courtName: '北京市海淀区人民法院',
    courtCaseNumber: '(2024)京0108民初5678号',
    judgeName: '李法官',
    plaintiffLawyer: '律师刘某',
    status: 3, // 执行中
    stage: 4, // 强制执行阶段
    progress: 85,
    filingDate: '2024-06-15',
    trialDate: '2024-06-25 14:00:00',
    judgmentDate: '2024-07-01',
    judgmentAmount: 125000,
    recoveredAmount: 45000,
    executionCourt: '北京市海淀区人民法院执行局',
    caseDescription: '房贷逾期纠纷，已获得胜诉判决',
    remarks: '判决已生效，正在执行财产查封',
    createTime: '2024-06-10 14:00:00',
    updateTime: '2024-07-12 09:15:00'
  }
];

// Mock法院事件数据
const mockCourtEvents = [
  {
    id: 1,
    caseId: 1,
    type: 'hearing',
    title: '第一次开庭审理',
    scheduledTime: '2024-07-20 09:00:00',
    actualTime: null,
    location: '北京市朝阳区人民法院第三法庭',
    description: '案件首次开庭审理，进行事实认定和法庭辩论',
    status: 'scheduled',
    result: null,
    createTime: '2024-07-10 10:00:00'
  },
  {
    id: 2,
    caseId: 2,
    type: 'execution',
    title: '财产查封执行',
    scheduledTime: '2024-07-15 10:00:00',
    actualTime: '2024-07-15 10:30:00',
    location: '债务人住所地',
    description: '对债务人名下房产进行查封',
    status: 'completed',
    result: '成功查封房产一套，价值约150万元',
    createTime: '2024-07-12 09:00:00'
  }
];

// Mock诉讼材料数据
const mockLitigationDocuments = [
  {
    id: 1,
    caseId: 1,
    type: 'complaint',
    name: '民事起诉状',
    templateId: 1,
    status: 'generated',
    filePath: '/documents/complaint_case_1.pdf',
    createTime: '2024-07-08 11:00:00',
    createdBy: '系统管理员'
  },
  {
    id: 2,
    caseId: 1,
    type: 'evidence',
    name: '证据清单',
    templateId: 2,
    status: 'generated',
    filePath: '/documents/evidence_case_1.pdf',
    createTime: '2024-07-08 11:30:00',
    createdBy: '系统管理员'
  }
];

// Mock文书模板数据（诉讼）
const mockLitigationTemplates = [
  {
    id: 1,
    name: '民事起诉状模板',
    type: 'complaint',
    description: '标准民事起诉状模板',
    templatePath: '/templates/civil_complaint.docx',
    variables: ['borrowerName', 'debtAmount', 'courtName', 'caseDescription'],
    category: 'litigation',
    createTime: '2024-01-01 00:00:00'
  },
  {
    id: 2,
    name: '证据清单模板',
    type: 'evidence',
    description: '诉讼证据清单模板',
    templatePath: '/templates/evidence_list.docx',
    variables: ['borrowerName', 'evidenceList', 'caseNumber'],
    category: 'litigation',
    createTime: '2024-01-01 00:00:00'
  },
  {
    id: 3,
    name: '执行申请书模板',
    type: 'execution',
    description: '强制执行申请书模板',
    templatePath: '/templates/execution_application.docx',
    variables: ['borrowerName', 'judgmentAmount', 'judgmentDate'],
    category: 'litigation',
    createTime: '2024-01-01 00:00:00'
  }
];

// ================= 诉讼管理API接口 =================

// 获取诉讼案件列表
app.get('/litigation/cases', (req, res) => {
  const { page = 1, size = 10, status, stage, courtName, borrowerName } = req.query;
  
  let filteredCases = [...mockLitigationCases];
  
  // 筛选条件
  if (status) {
    filteredCases = filteredCases.filter(c => c.status == status);
  }
  if (stage) {
    filteredCases = filteredCases.filter(c => c.stage == stage);
  }
  if (courtName) {
    filteredCases = filteredCases.filter(c => c.courtName.includes(courtName));
  }
  if (borrowerName) {
    filteredCases = filteredCases.filter(c => c.borrowerName.includes(borrowerName));
  }
  
  const total = filteredCases.length;
  const startIndex = (page - 1) * size;
  const endIndex = startIndex + parseInt(size);
  const records = filteredCases.slice(startIndex, endIndex);
  
  res.json({
    code: 200,
    message: '查询成功',
    data: {
      records: records,
      total: total,
      size: parseInt(size),
      current: parseInt(page),
      pages: Math.ceil(total / size)
    }
  });
});

// 获取诉讼案件详情
app.get('/litigation/cases/:id', (req, res) => {
  const caseId = parseInt(req.params.id);
  const litigationCase = mockLitigationCases.find(c => c.id === caseId);
  
  if (litigationCase) {
    res.json({
      code: 200,
      message: '查询成功',
      data: litigationCase
    });
  } else {
    res.status(404).json({
      code: 404,
      message: '诉讼案件不存在'
    });
  }
});

// 创建诉讼案件（从调解失败转诉讼）
app.post('/litigation/cases', (req, res) => {
  const caseData = req.body;
  
  // 从调解案件中获取案件信息
  const mediationCase = mockMediationCases.find(c => c.caseId === caseData.caseId);
  if (!mediationCase) {
    return res.status(400).json({ code: 400, message: '调解案件不存在' });
  }
  
  // 检查调解案件是否失败
  if (mediationCase.status !== 4) {
    return res.status(400).json({ code: 400, message: '只能转入调解失败的案件' });
  }
  
  // 检查是否已经转入诉讼
  const existingLitigation = mockLitigationCases.find(c => c.caseId === caseData.caseId);
  if (existingLitigation) {
    return res.status(400).json({ code: 400, message: '该案件已转入诉讼' });
  }
  
  const newCase = {
    id: Math.max(...mockLitigationCases.map(c => c.id)) + 1,
    caseId: caseData.caseId,
    caseNumber: `${mediationCase.caseNumber}-S`,
    borrowerName: mediationCase.borrowerName,
    debtAmount: mediationCase.amount,
    courtName: caseData.courtName,
    courtCaseNumber: null,
    judgeName: null,
    plaintiffLawyer: caseData.plaintiffLawyer || '',
    status: 0, // 诉前准备
    stage: 0, // 诉前准备阶段
    progress: 10,
    filingDate: null,
    trialDate: null,
    judgmentDate: null,
    judgmentAmount: null,
    recoveredAmount: 0,
    executionCourt: null,
    caseDescription: caseData.caseDescription || '',
    remarks: caseData.remarks || '',
    createTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
    updateTime: new Date().toISOString().replace('T', ' ').slice(0, 19)
  };
  
  mockLitigationCases.unshift(newCase);
  
  res.json({
    code: 200,
    message: '诉讼案件创建成功',
    data: newCase
  });
});

// 更新诉讼案件
app.put('/litigation/cases/:id', (req, res) => {
  const caseId = parseInt(req.params.id);
  const index = mockLitigationCases.findIndex(c => c.id === caseId);
  
  if (index !== -1) {
    mockLitigationCases[index] = {
      ...mockLitigationCases[index],
      ...req.body,
      updateTime: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };
    
    res.json({
      code: 200,
      message: '诉讼案件更新成功',
      data: mockLitigationCases[index]
    });
  } else {
    res.status(404).json({
      code: 404,
      message: '诉讼案件不存在'
    });
  }
});

// 更新诉讼阶段
app.put('/litigation/cases/:id/stage', (req, res) => {
  const caseId = parseInt(req.params.id);
  const { stage, progress } = req.body;
  const index = mockLitigationCases.findIndex(c => c.id === caseId);
  
  if (index !== -1) {
    mockLitigationCases[index].stage = stage;
    mockLitigationCases[index].progress = progress || mockLitigationCases[index].progress;
    mockLitigationCases[index].updateTime = new Date().toISOString().replace('T', ' ').slice(0, 19);
    
    res.json({
      code: 200,
      message: '诉讼阶段更新成功'
    });
  } else {
    res.status(404).json({
      code: 404,
      message: '诉讼案件不存在'
    });
  }
});

// 获取法院事件列表
app.get('/litigation/cases/:id/events', (req, res) => {
  const caseId = parseInt(req.params.id);
  const events = mockCourtEvents.filter(e => e.caseId === caseId);
  
  res.json({
    code: 200,
    message: '查询成功',
    data: events
  });
});

// 添加法院事件
app.post('/litigation/cases/:id/events', (req, res) => {
  const caseId = parseInt(req.params.id);
  const eventData = req.body;
  
  const newEvent = {
    id: Math.max(...mockCourtEvents.map(e => e.id)) + 1,
    caseId: caseId,
    ...eventData,
    status: eventData.status || 'scheduled',
    createTime: new Date().toISOString().replace('T', ' ').slice(0, 19)
  };
  
  mockCourtEvents.push(newEvent);
  
  res.json({
    code: 200,
    message: '法院事件添加成功',
    data: newEvent
  });
});

// 更新法院事件
app.put('/litigation/events/:id', (req, res) => {
  const eventId = parseInt(req.params.id);
  const index = mockCourtEvents.findIndex(e => e.id === eventId);
  
  if (index !== -1) {
    mockCourtEvents[index] = {
      ...mockCourtEvents[index],
      ...req.body,
      updateTime: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };
    
    res.json({
      code: 200,
      message: '法院事件更新成功',
      data: mockCourtEvents[index]
    });
  } else {
    res.status(404).json({
      code: 404,
      message: '法院事件不存在'
    });
  }
});

// 获取诉讼文书列表
app.get('/litigation/cases/:id/documents', (req, res) => {
  const caseId = parseInt(req.params.id);
  const documents = mockLitigationDocuments.filter(d => d.caseId === caseId);
  
  res.json({
    code: 200,
    message: '查询成功',
    data: documents
  });
});

// 生成诉讼文书
app.post('/litigation/cases/:id/documents', (req, res) => {
  const caseId = parseInt(req.params.id);
  const { templateId, type, name, variables } = req.body;
  
  const newDocument = {
    id: Math.max(...mockLitigationDocuments.map(d => d.id)) + 1,
    caseId: caseId,
    type: type,
    name: name,
    templateId: templateId,
    status: 'generated',
    filePath: `/documents/${type}_case_${caseId}_${Date.now()}.pdf`,
    createTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
    createdBy: '系统用户'
  };
  
  mockLitigationDocuments.push(newDocument);
  
  res.json({
    code: 200,
    message: '文书生成成功',
    data: {
      documentId: newDocument.id,
      downloadUrl: newDocument.filePath,
      fileName: `${name}_${new Date().toISOString().slice(0, 10)}.pdf`
    }
  });
});

// 获取诉讼文书模板
app.get('/litigation/document-templates', (req, res) => {
  res.json({
    code: 200,
    message: '查询成功',
    data: mockLitigationTemplates
  });
});

// 获取诉讼统计
app.get('/litigation/stats', (req, res) => {
  const stats = {
    totalCases: mockLitigationCases.length,
    preparationCount: mockLitigationCases.filter(c => c.stage === 0).length,
    filingCount: mockLitigationCases.filter(c => c.stage === 1).length,
    trialCount: mockLitigationCases.filter(c => c.stage === 2).length,
    executionCount: mockLitigationCases.filter(c => c.stage === 4).length,
    completedCount: mockLitigationCases.filter(c => c.stage === 5).length,
    totalDebtAmount: mockLitigationCases.reduce((sum, c) => sum + c.debtAmount, 0),
    totalRecoveredAmount: mockLitigationCases.reduce((sum, c) => sum + (c.recoveredAmount || 0), 0),
    recoveryRate: mockLitigationCases.length > 0 ? 
      mockLitigationCases.reduce((sum, c) => sum + (c.recoveredAmount || 0), 0) / 
      mockLitigationCases.reduce((sum, c) => sum + c.debtAmount, 0) : 0,
    avgProcessTime: 45 // 平均处理时间（天）
  };
  
  res.json({
    code: 200,
    message: '查询成功',
    data: stats
  });
});

// 获取可转诉讼的调解失败案件
app.get('/litigation/available-mediation-cases', (req, res) => {
  const { page = 1, size = 10, search } = req.query;
  
  // 筛选调解失败的案件（status=4）
  let availableCases = mockMediationCases.filter(c => c.status === 4);
  
  // 排除已经转诉讼的案件
  const existingLitigationCaseIds = mockLitigationCases.map(lc => lc.caseId);
  availableCases = availableCases.filter(c => !existingLitigationCaseIds.includes(c.caseId));
  
  // 搜索过滤
  if (search) {
    availableCases = availableCases.filter(c => 
      c.caseNumber.includes(search) || 
      c.borrowerName.includes(search)
    );
  }
  
  const total = availableCases.length;
  const startIndex = (page - 1) * size;
  const endIndex = startIndex + parseInt(size);
  const records = availableCases.slice(startIndex, endIndex);
  
  res.json({
    code: 200,
    message: '查询成功',
    data: {
      records: records,
      total: total,
      size: parseInt(size),
      current: parseInt(page),
      pages: Math.ceil(total / size)
    }
  });
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    code: 200,
    message: 'Mock Backend is running',
    timestamp: new Date().toISOString()
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Mock Backend Server running on http://localhost:${PORT}`);
  console.log('Mock API endpoints:');
  console.log('  POST /api/auth/login');
  console.log('  GET  /api/user/profile');
  console.log('  GET  /api/user/list');
  console.log('  GET  /api/case/list');
  console.log('  GET  /api/case/:id');
  console.log('  GET  /api/health');
});
