-- 结算管理示例数据

USE dlmp_platform;

-- 插入示例结算记录
INSERT INTO settlement_records (
  settlement_number, case_id, case_number, client_id, client_name, 
  settlement_type, total_amount, paid_amount, unpaid_amount, 
  status, due_date, description, creator_id, creator_name
) VALUES
('JS1720953600001', 1, 'DLMP-2024-000001', 1, '某银行股份有限公司', 'mediation', 15000.00, 0.00, 15000.00, 3, '2024-08-15', '调解成功案件结算', 1, '系统用户'),
('JS1720953600002', 2, 'DLMP-2024-000002', 1, '某银行股份有限公司', 'litigation', 32000.00, 16000.00, 16000.00, 5, '2024-08-20', '诉讼案件阶段性结算', 1, '系统用户'),
('JS1720953600003', 3, 'DLMP-2024-000003', 2, '某小贷公司', 'execution', 8500.00, 8500.00, 0.00, 4, '2024-07-30', '执行完毕结算', 1, '系统用户'),
('JS1720953600004', 4, 'DLMP-2024-000004', 1, '某银行股份有限公司', 'mediation', 12000.00, 0.00, 12000.00, 2, '2024-08-10', '调解案件费用结算', 1, '系统用户'),
('JS1720953600005', 5, 'DLMP-2024-000005', 3, '某消费金融公司', 'litigation', 45000.00, 0.00, 45000.00, 6, '2024-07-25', '诉讼费用结算（已逾期）', 1, '系统用户');

-- 插入费用明细数据
INSERT INTO fee_details (
  settlement_id, fee_type, fee_type_name, description, 
  base_amount, rate, amount, calculation_method, formula
) VALUES
-- 结算记录1的费用明细
(1, 1, '服务费', '调解服务费', 200000.00, 0.05, 10000.00, '按债务金额5%计算', 'base_amount * rate'),
(1, 4, '佣金', '调解成功佣金', 200000.00, 0.025, 5000.00, '按债务金额2.5%计算', 'base_amount * rate'),

-- 结算记录2的费用明细  
(2, 1, '服务费', '诉讼服务费', 300000.00, 0.08, 24000.00, '按债务金额8%计算', 'base_amount * rate'),
(2, 2, '诉讼费', '法院诉讼费', 300000.00, 0.02, 6000.00, '按债务金额2%计算', 'base_amount * rate'),
(2, 4, '佣金', '诉讼阶段佣金', 40000.00, 0.05, 2000.00, '按回收金额5%计算', 'base_amount * rate'),

-- 结算记录3的费用明细
(3, 3, '执行费', '强制执行费', 150000.00, 0.015, 2250.00, '按执行金额1.5%计算', 'base_amount * rate'),
(3, 4, '佣金', '执行成功佣金', 125000.00, 0.05, 6250.00, '按回收金额5%计算', 'base_amount * rate'),

-- 结算记录4的费用明细
(4, 1, '服务费', '调解服务费', 180000.00, 0.05, 9000.00, '按债务金额5%计算', 'base_amount * rate'),
(4, 4, '佣金', '调解佣金', 180000.00, 0.0167, 3000.00, '按债务金额1.67%计算', 'base_amount * rate'),

-- 结算记录5的费用明细
(5, 1, '服务费', '诉讼服务费', 500000.00, 0.08, 40000.00, '按债务金额8%计算', 'base_amount * rate'),
(5, 2, '诉讼费', '法院费用', 500000.00, 0.01, 5000.00, '按债务金额1%计算', 'base_amount * rate');

-- 插入付款记录
INSERT INTO payment_records (
  settlement_id, payment_amount, payment_date, payment_method, 
  transaction_id, status, operator_id, operator_name, confirm_time
) VALUES
(2, 16000.00, '2024-07-20', '银行转账', 'TXN20240720001', 2, 1, '财务专员', '2024-07-20 14:30:00'),
(3, 8500.00, '2024-07-28', '银行转账', 'TXN20240728001', 2, 1, '财务专员', '2024-07-28 16:45:00');

-- 插入提醒记录
INSERT INTO reminder_records (
  settlement_id, reminder_type, reminder_content, 
  scheduled_time, actual_time, status, result
) VALUES
(1, 'email', '结算单JS1720953600001到期提醒，请及时付款', '2024-08-13 09:00:00', '2024-08-13 09:00:00', 2, '邮件发送成功'),
(4, 'sms', '结算单JS1720953600004即将到期，请关注付款时间', '2024-08-08 10:00:00', '2024-08-08 10:00:00', 2, '短信发送成功'),
(5, 'email', '结算单JS1720953600005已逾期，请尽快处理', '2024-07-26 09:00:00', '2024-07-26 09:00:00', 2, '邮件发送成功');