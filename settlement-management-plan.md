# 结算管理模块详细规划

## 1. 功能架构概览

### 1.1 核心功能模块
1. **费用计算器** - 智能费用计算和预览
2. **报表分析** - 多维度数据分析和可视化
3. **结算报表** - 各类结算报表生成和导出
4. **费用设置** - 费用规则配置和管理
5. **结算审批** - 结算流程管理
6. **账期管理** - 逾期跟踪和提醒

### 1.2 页面结构
```
/settlement
├── /list          # 结算列表 (已完成)
├── /calculator    # 费用计算器
├── /reports       # 报表分析
├── /templates     # 报表模板
├── /settings      # 结算设置
├── /approval      # 结算审批
└── /statistics    # 统计看板
```

## 2. 费用计算器功能

### 2.1 功能特性
- **智能计算**：根据案件类型、标的金额、费用规则自动计算
- **实时预览**：输入参数实时显示费用明细
- **方案比较**：多种费用方案对比
- **费用分解**：详细的费用构成分析
- **保存模板**：常用费用方案保存和复用

### 2.2 计算规则
```javascript
// 费用计算公式
const calculateFee = (baseAmount, feeType, rule) => {
  let amount = baseAmount * rule.rate;
  
  // 应用最小最大限制
  if (rule.minAmount && amount < rule.minAmount) {
    amount = rule.minAmount;
  }
  if (rule.maxAmount && amount > rule.maxAmount) {
    amount = rule.maxAmount;
  }
  
  return Math.round(amount * 100) / 100;
};
```

### 2.3 支持的费用类型
1. **服务费** (15%) - 基础服务费用
2. **诉讼费** (10%) - 法院相关费用
3. **执行费** (12%) - 强制执行费用
4. **佣金** (8%) - 成功调解奖励
5. **律师费** (18%) - 法律代理费用

## 3. 报表分析功能

### 3.1 分析维度
- **时间维度**：日/周/月/季/年度分析
- **地区维度**：按地区分布分析
- **客户维度**：按委托方分析
- **案件维度**：按案件类型分析
- **费用维度**：按费用类型分析

### 3.2 分析图表
1. **收入趋势图** - 时间序列收入变化
2. **费用构成饼图** - 各类费用占比
3. **客户排名榜** - 按收入贡献排序
4. **区域热力图** - 地理分布可视化
5. **完成率仪表盘** - KPI指标展示

### 3.3 关键指标
- **总收入**：累计结算金额
- **平均单价**：平均每案收入
- **完成率**：结算完成比例
- **回款率**：实际回款比例
- **逾期率**：逾期案件比例

## 4. 结算报表功能

### 4.1 报表类型
1. **明细报表** - 详细的结算记录
2. **汇总报表** - 按维度汇总统计
3. **对账报表** - 与客户对账使用
4. **财务报表** - 财务核算专用
5. **税务报表** - 税务申报使用

### 4.2 报表格式
- **Excel格式** - 便于二次处理
- **PDF格式** - 正式文档输出
- **CSV格式** - 数据交换使用
- **在线预览** - 网页直接查看

### 4.3 报表定制
- **字段选择** - 自定义显示字段
- **筛选条件** - 灵活的数据筛选
- **排序规则** - 多字段排序
- **样式设置** - 报表外观定制

## 5. 费用设置功能

### 5.1 规则管理
- **费用类型管理** - 添加/编辑费用类型
- **费率设置** - 配置各类费用费率
- **阶梯定价** - 按金额区间设置不同费率
- **特殊规则** - 针对特定客户的特殊费率

### 5.2 模板管理
- **标准模板** - 预设的标准费用模板
- **客户模板** - 针对特定客户的费用模板
- **案件模板** - 针对特定案件类型的模板
- **区域模板** - 针对不同地区的模板

### 5.3 审批流程
- **规则变更审批** - 费用规则变更需要审批
- **特殊费率审批** - 超出标准范围需要审批
- **批量调整审批** - 批量费率调整审批

## 6. 技术实现方案

### 6.1 前端技术栈
- **React 18** + **TypeScript**
- **Ant Design** - UI组件库
- **ECharts** - 图表可视化
- **React Query** - 数据状态管理
- **React Hook Form** - 表单处理

### 6.2 后端API设计
```
GET  /settlement/calculator/rules    # 获取计算规则
POST /settlement/calculator/compute  # 费用计算
GET  /settlement/reports/types       # 获取报表类型
POST /settlement/reports/generate    # 生成报表
GET  /settlement/analytics/overview  # 获取分析概览
GET  /settlement/analytics/trend     # 获取趋势数据
GET  /settlement/settings/rules      # 获取费用规则
PUT  /settlement/settings/rules/:id  # 更新费用规则
```

### 6.3 数据模型
```typescript
// 费用规则
interface FeeRule {
  id: number;
  feeType: number;
  feeTypeName: string;
  rate: number;
  minAmount?: number;
  maxAmount?: number;
  formula: string;
  description: string;
  settlementType?: string;
  isActive: boolean;
}

// 计算结果
interface CalculationResult {
  baseAmount: number;
  totalAmount: number;
  feeDetails: FeeDetail[];
  breakdown: FeeBreakdown[];
}

// 报表配置
interface ReportConfig {
  type: string;
  fields: string[];
  filters: Record<string, any>;
  format: 'excel' | 'pdf' | 'csv';
  template?: string;
}
```

## 7. 开发计划

### 阶段1：费用计算器 (2-3天)
1. 创建计算器页面组件
2. 实现费用计算逻辑
3. 添加实时预览功能
4. 集成费用规则管理

### 阶段2：报表分析 (3-4天)
1. 创建分析Dashboard
2. 实现各类图表组件
3. 添加数据筛选功能
4. 集成导出功能

### 阶段3：报表生成 (2-3天)
1. 创建报表模板
2. 实现报表生成逻辑
3. 添加多格式导出
4. 集成打印功能

### 阶段4：设置管理 (2天)
1. 创建设置页面
2. 实现规则CRUD
3. 添加模板管理
4. 集成审批流程

### 阶段5：优化完善 (1-2天)
1. 性能优化
2. 用户体验改进
3. 错误处理完善
4. 测试和调试

## 8. 质量保证

### 8.1 测试策略
- **单元测试** - 核心计算逻辑测试
- **集成测试** - API接口测试
- **E2E测试** - 完整业务流程测试
- **性能测试** - 大数据量处理测试

### 8.2 代码质量
- **TypeScript** - 类型安全
- **ESLint** - 代码规范检查
- **Prettier** - 代码格式化
- **Husky** - Git钩子检查

### 8.3 文档完善
- **API文档** - 接口说明文档
- **组件文档** - 组件使用说明
- **用户手册** - 功能使用指南
- **开发指南** - 开发规范说明

---

## 下一步行动
1. 立即开始费用计算器功能开发
2. 创建基础API接口
3. 实现核心计算逻辑
4. 逐步完善其他功能模块