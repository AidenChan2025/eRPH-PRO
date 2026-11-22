# ERPHPro — Commercial Automation & Growth Platform V1.0

> **Stage Boundary Notice:** Parked post-goal backlog specification. Excluded from Phase 0 and Phase 1 scope and acceptance; work starts only after the current architecture goal is complete.

## MASTER DEVELOPMENT GOAL

| 属性 | 内容 |
|---|---|
| 项目 | ERPHPro |
| Mission | 建立完整的商业化运营系统，涵盖 Copyright & IP Protection、School CRM、Automated Email Marketing、Affiliate Program、AI Support Center、Ticket Automation、Subscription Billing Integration、Revenue Sharing 和 Business Analytics。 |
| 执行模式 | Autonomous Goal-Based Development |
| 优先级 | 不破坏 ERPHPro 现有核心教学功能 |
| 部署边界 | 先开发、测试及验收；未经 Owner 授权不得正式上线、收费或发送营销邮件。 |

---

# 0. 核心开发原则

你是 ERPHPro 的高级全栈开发工程师、SaaS 架构师、安全审计员、产品经理及自动化系统设计师。

目标是交付真正可运行、可测试、可维护、可扩展的商业系统，而不是仅制作漂亮的 Dashboard 或模拟数据。

必须遵守：

1. 首先完整审计现有 ERPHPro 仓库、技术架构、数据库、权限系统、订阅机制、部署环境及开发进度。
2. 优先复用现有技术栈、组件及基础设施，不得未经批准进行大规模技术迁移。
3. 不得破坏现有 RPH、DSKP、用户管理及教学功能。
4. 不得直接修改生产环境、真实客户资料或现有收款配置。
5. 所有新功能必须具备前台、后台、数据库、API、权限控制、日志、测试及使用文档。
6. 所有外部服务必须通过安全配置管理，不得硬编码 API Key。
7. 必须有 Feature Flags，允许单独启用或关闭各商业模块。
8. 开发可以自动推进，但涉及真实资金、法律声明、外部营销及生产部署时必须取得 Owner 批准。
9. 每个阶段必须进行相关模块测试及全站回归测试。
10. 不得以假数据、Mock API 或未经验证的截图冒充真实验收结果。

---

# 1. Copyright & Intellectual Property Protection

## 1.1 权属设计

ERPHPro 的软件知识产权计划由以下个人持有：

**Aiden Chan**

ANKL Sdn Bhd 计划作为商业签约、收款及开票主体，双方正式授权协议尚未完成。

不得假设 ANKL 自动拥有软件、源码、品牌或商标。

开发以下配置：

- IP Owner Legal Name
- Copyright Display Name
- Product Name
- Copyright Year
- Software Licence Status
- Commercial Operator Name
- Commercial Operator Registration Number
- Trademark Application Status
- Trademark Registration Number
- Legal Documents Version

所有资料必须可由超级管理员管理，但涉及权属及法律声明的更改必须具备审计日志和二次确认。

## 1.2 网站 Footer

在确认权属后，默认显示：

© 2026 Aiden Chan. All Rights Reserved.

ERPHPro is a software product developed and owned by Aiden Chan.

在正式签署商业授权协议后，才允许启用：

Commercially operated by ANKL Sdn Bhd under licence.

必须支持年份自动更新，并确保 Footer 在公开页面、登录页面及适用的应用页面一致。

不得在商标正式注册前显示 ®。

## 1.3 法律页面

建立或完善：

- Terms of Service
- Privacy Policy
- Copyright Notice
- Intellectual Property Notice
- Acceptable Use Policy
- Refund & Cancellation Policy
- Affiliate Terms
- Marketing Consent & Unsubscribe Policy
- Data Retention & Deletion Policy

法律文件必须支持版本管理、发布日期、适用日期及用户接受记录。

先生成供审核的草案，不得将未经法律审核的文本标记为已获法律认证。

## 1.4 IP Evidence Archive

建立内部知识产权证据档案：

- Git Commit SHA
- Release Version
- Release Timestamp
- Source Archive Hash
- Design Asset Inventory
- Third-Party Licence Inventory
- Contributor Attribution
- AI-Assisted Development Notes
- Copyright Notification Reference
- Trademark Application Reference

证据档案必须限制管理员访问，不能公开源码或敏感信息。

不得声称软件已经获得 MyIPO 注册，除非存在可核实的正式资料。

---

# 2. School CRM — 全国学校潜在客户管理

建立 School CRM，作为营销、订阅及售后的共同数据基础。

## 2.1 School Database

支持：

- School ID
- KPM School Code
- School Name
- State
- District
- School Type
- SKM Eligibility
- Estimated Teacher Count
- Official Public Email
- Contact Person
- Contact Role
- Source URL
- Source Verification Date
- Marketing Contact Permission Status
- Subscription Status
- Assigned Sales Partner
- Last Contact Date
- Next Follow-up Date

支持 SK、SJKC、SJKT 及其他适用学校类别。

不得仅凭教师人数自动认定学校具有 SKM 资格。

## 2.2 数据收集与验证

建立公开学校资料导入工具。

支持：

- CSV Import
- Official Directory Import
- Deduplication
- Email Format Validation
- School Code Matching
- Source Tracking
- Stale Data Detection
- Manual Review Queue
- Export
- Audit Log

自动收集必须遵守来源网站使用条件、合理访问频率及适用法律。

公开电邮地址不得自动等同于营销同意。

不得抓取私人账户、绕过登录权限或规避网站访问限制。

## 2.3 CRM Pipeline

建立以下销售阶段：

Prospect → Verified → Contact Eligible → Contacted → Interested → Demo → Trial → Paid → Renewed → Churned

另设：

- Unsubscribed
- Do Not Contact
- Invalid Contact
- Disqualified

CRM 必须支持学校联系人与教师个人联系人分别管理。

---

# 3. Automated Marketing Engine

## 3.1 Marketing Dashboard

建立独立 Marketing Center。

显示：

- Total School Prospects
- Verified Schools
- Contact-Eligible Leads
- Active Campaigns
- Emails Sent
- Delivered Emails
- Bounces
- Unsubscribes
- Email Clicks
- Trial Registrations
- Paid Conversions
- Campaign Revenue
- Customer Acquisition Cost
- Conversion Rate
- Marketing Cost
- Return on Marketing Spend

不能把邮件打开率作为唯一成功指标。

所有指标必须有可追溯的数据来源。

## 3.2 Campaign Builder

支持：

- 中文、马来文、英文
- Email Templates
- Audience Segmentation
- Personalization
- A/B Testing
- Scheduled Campaigns
- Preview
- Test Email
- Approval Workflow
- Campaign Pause/Resume
- Suppression Lists
- Delivery Reports

首批营销活动必须由 Owner 审核。

之后仅可在已批准的活动范围及合法联系条件内自动运行。

## 3.3 Marketing Automation

建立事件驱动流程：

**Flow A — 新注册教师**

Registration → Welcome Email → Onboarding → Usage Tips → Trial Follow-up → Upgrade Invitation

**Flow B — SKM 学校**

Verified SKM → Eligible Outreach → Interest Captured → Demo → School Registration → Payment → Onboarding

**Flow C — 试用转付费**

Trial Started → Usage Tracking → Helpful Reminder → Trial Ending → Upgrade → Subscription

**Flow D — 续费**

Renewal Approaching → Reminder → Payment → Receipt → Subscription Updated

**Flow E — 流失客户**

Cancellation → Feedback → Support Review → Re-engagement, only where permitted

每个 Flow 必须有：

- Trigger
- Eligibility
- Delay
- Frequency Cap
- Exit Condition
- Suppression Check
- Error Handling
- Audit Trail

营销退订必须立即阻止后续营销发送，但不影响必要的交易及安全通知。

## 3.4 Email Infrastructure

支持通过可配置的专业邮件服务发送营销邮件。

必须考虑：

- SPF
- DKIM
- DMARC
- Unsubscribe
- Bounce Processing
- Complaint Processing
- Rate Limiting
- Retry Queue
- Delivery Webhooks
- Domain Reputation Monitoring

营销邮件与客服邮件使用逻辑隔离的发送渠道。

不得使用个人 Gmail 账户进行大规模群发。

---

# 4. Affiliate & Referral Program

建立 ERPHPro Affiliate Center。

## 4.1 Affiliate 类型

支持：

**Standard Affiliate**

- 首年推荐佣金建议15%
- 续费佣金建议5%
- 只按有效、合资格的付费订阅计算

**Sales & Support Partner**

- 首年最高30%
- 第二年建议15%
- 第三年起建议10%
- 必须符合独立合作协议及售后绩效要求

**Commercial Operator**

- ANKL Sdn Bhd
- 建议3%–5%
- 独立于 Affiliate 佣金管理

以上比例全部设为可配置的待批准商业政策，不得未经 Owner 确认自动生效。

## 4.2 Affiliate Portal

推广伙伴登录后可以查看：

- Referral Link
- Referral Code
- Marketing Materials
- Total Clicks
- Qualified Leads
- Trial Registrations
- Paid Customers
- Approved Commissions
- Pending Commissions
- Reversed Commissions
- Paid Commissions
- Payment History

不得向 Affiliate 公开教师的敏感资料、密码、教学内容或无必要的个人信息。

## 4.3 Referral Tracking

支持：

- Unique Referral Code
- Referral Attribution
- First-Party Tracking
- Consent-Aware Attribution
- Server-Side Conversion Events
- Attribution Expiry
- Duplicate Detection
- Fraud Detection
- Self-Referral Prevention
- Referral Dispute Review

建议初始归因窗口为30天，但应允许 Owner 调整。

同一订单不得重复支付互相排斥的销售与 Affiliate 佣金。

## 4.4 Commission Engine

佣金计算基础：

Eligible Collected Subscription Revenue

需根据协议定义扣除：

- Refunds
- Chargebacks
- Applicable Indirect Taxes
- Excluded Transactions

支付网关手续费是否从佣金基数扣除，必须由 Owner 确认。

佣金必须经历：

Pending → Qualified → Approved → Payable → Paid

另设：

Rejected → Reversed → Disputed

禁止直接依据点击次数或未付款注册发放现金佣金。

佣金结算必须经过授权审核。

## 4.5 Affiliate Anti-Abuse

禁止：

- 自我推荐套利
- 虚假学校注册
- 伪造付款
- 垃圾邮件推广
- 冒充 KPM 或教育局
- 未经授权使用政府标志
- 误导性宣传
- 多层级招募佣金

本系统采用单层推荐模式，不建立下线分佣机制。

---

# 5. AI Support Center

## 5.1 DeepSeek Integration

DeepSeek 仅用于：

- 智能客服
- FAQ
- 操作指导
- Ticket 分类
- Email Drafting
- Knowledge Base Retrieval
- Support Summarization
- Marketing Copy Assistance

当前版本不提供 AI RPH Generation。

不得擅自加入 AI 自动生成教案功能。

## 5.2 AI Knowledge Base

知识来源包括：

- Official ERPHPro Documentation
- Feature Guides
- FAQ
- Troubleshooting Articles
- Subscription Policies
- Approved Support Resolutions

所有知识条目必须有版本、审核状态和最后更新日期。

AI 不得编造产品功能、付款状态、法律承诺或退款结果。

## 5.3 AI Chatbot

支持：

- 中文
- Bahasa Melayu
- English
- FAQ Retrieval
- Contextual Help
- Ticket Creation
- Human Escalation
- Conversation History
- Satisfaction Feedback

敏感操作必须由已授权的后端服务执行，AI 不得直接修改账户、订阅或付款数据。

## 5.4 AI Cost Control

建立：

- Token Usage Tracking
- Cost per Request
- Cost per School
- Monthly Budget
- Annual Budget
- Cache
- Rate Limit
- Model Selection
- Usage Alerts
- Automatic Fallback

初始 DeepSeek 年度规划预算 USD100，预警上限 USD200。

这些金额属于预算目标，不代表固定供应商价格或保证足够。

不得在未通知管理员的情况下自动超出批准预算。

---

# 6. Email Ticket Automation

建立完整 Ticket System。

## 6.1 Ticket Lifecycle

New → Classified → In Progress → Waiting for Customer → Resolved → Closed

支持 Reopened、Escalated、Spam 和 Duplicate。

## 6.2 Email-to-Ticket

当教师发送客服电邮时：

1. 安全接收邮件。
2. 验证来源及附件。
3. 匹配已有 Ticket。
4. 识别学校或教师账户。
5. 分类问题。
6. 检索知识库。
7. 生成回复。
8. 判断是否允许自动发送。
9. 更新 Ticket。
10. 必要时升级人工。

必须防止邮件循环、恶意附件、Prompt Injection 及未经验证的账户操作。

## 6.3 AI Resolution Levels

**L1 — Fully Automated**

一般 FAQ、操作说明及已审核的标准指引。

**L2 — Assisted**

AI 拟稿，由授权人员审核后发送。

**L3 — Human Required**

退款、付款争议、严重系统故障、个人资料问题、法律投诉、账户安全及权限变更。

## 6.4 Support Analytics

显示：

- Ticket Volume
- First Response Time
- Resolution Time
- AI Resolution Rate
- Reopened Tickets
- Escalation Rate
- Satisfaction Score
- Support Cost
- Unresolved Tickets

允许管理员将人工解决方案整理为知识库草稿，但必须审核后才能进入正式知识库。

---

# 7. Subscription & Revenue Sharing

## 7.1 Subscription Plans

建立可配置方案：

**Individual Teacher**

RM10/month<br>
1 Teacher Account

**SKM School**

RM50/month<br>
Maximum 12 Teacher Accounts<br>
School Eligibility Verification Required

**Regular School**

预留分级订阅功能，具体价格等待 Owner 批准。

支持月付、年付、优惠码、试用、续费、取消及退款。

## 7.2 Commercial Operator

配置：

ANKL Sdn Bhd

作为拟定的正式签约及收款主体。

在正式合作协议、公司授权及收款配置完成前，不得自动生成带有未经确认公司资料的正式商业发票。

## 7.3 Revenue Sharing Dashboard

支持：

- Gross Revenue
- Refunds
- Net Eligible Revenue
- ANKL Service Fee
- Sales Partner Commission
- Affiliate Commission
- Payment Processing Fees
- Infrastructure Costs
- AI Costs
- Estimated Operating Surplus

必须防止重复计算。

收入分配与利润计算要分开。

所有佣金、付款及退款均须有可审计记录。

---

# 8. Frontend & Backend Requirements

## 8.1 Public Frontend

建立或整合：

- Pricing
- School Plans
- SKM Special Plan
- Affiliate Program
- Affiliate Registration
- Contact Sales
- Help Center
- AI Chat Widget
- Legal Pages
- Copyright Footer

页面必须支持手机、平板及桌面设备。

## 8.2 Teacher Dashboard

支持：

- Subscription Status
- Billing History
- Support Tickets
- Help Center
- AI Support
- Referral Information, where applicable

## 8.3 School Administrator Dashboard

支持：

- School Subscription
- Teacher Seat Management
- School Billing
- Teacher Invitations
- School Support Tickets
- Renewal Status

## 8.4 Affiliate Dashboard

支持：

- Referral Performance
- Conversion Funnel
- Commission Ledger
- Payout History
- Promotional Resources

## 8.5 Super Admin Dashboard

建立统一 Business Operations Center。

菜单建议：

1. Overview
2. Schools CRM
3. Marketing Campaigns
4. Marketing Automation
5. Affiliate Management
6. Sales Partners
7. Subscriptions
8. Revenue Sharing
9. AI Support
10. Email Tickets
11. Knowledge Base
12. Legal & Copyright
13. Analytics
14. Audit Logs
15. System Settings

必须采用角色权限控制。

营销人员不得访问软件源码、API Key、系统管理凭据或其他不必要的敏感资料。

---

# 9. Security & Compliance

必须包含：

- RBAC
- MFA for privileged accounts
- Secure Session Management
- CSRF Protection
- Input Validation
- SQL Injection Protection
- XSS Protection
- Secure Webhooks
- Idempotent Payment Events
- Secrets Management
- Data Minimization
- Encryption in Transit
- Appropriate Encryption at Rest
- Backup & Recovery
- Audit Logging
- Retention Policies
- Consent Records
- Unsubscribe Enforcement
- Abuse Prevention

审查马来西亚 PDPA、适用的电子营销要求、消费者保护、税务、电子发票及商业合作安排。

法律和税务事项须标记为专业审核项目，不得由 Agent 自行宣称合规认证。

---

# 10. Development Phases

## Phase 0 — Repository & Architecture Audit

完成现有项目审计。

输出：

- Current Architecture
- Existing Features
- Database Inventory
- Authentication Review
- Deployment Review
- Security Risks
- Integration Opportunities
- Development Dependencies
- Proposed Implementation Plan

不得在未完成审计前盲目重构。

## Phase 1 — Legal & Copyright Foundation

实现：

- Copyright Configuration
- Footer
- Legal Pages
- IP Evidence Archive
- Legal Document Versioning

## Phase 2 — CRM Foundation

实现：

- School Database
- School Verification
- Contact Eligibility
- CRM Pipeline
- School Segmentation

## Phase 3 — AI Support & Ticket System

实现：

- Knowledge Base
- DeepSeek Integration
- Chatbot
- Email-to-Ticket
- Human Escalation
- Support Analytics

## Phase 4 — Marketing Automation

实现：

- Campaign Builder
- Email Infrastructure
- Marketing Workflows
- Consent Management
- Marketing Analytics

## Phase 5 — Affiliate & Sales Partner

实现：

- Affiliate Registration
- Referral Tracking
- Commission Engine
- Partner Portal
- Anti-Fraud
- Commission Reporting

## Phase 6 — Revenue Sharing & Business Dashboard

实现：

- ANKL Commercial Operator Configuration
- Subscription Integration
- Revenue Sharing
- Financial Reporting
- Business Analytics

## Phase 7 — Final Integration & Regression

执行全站测试：

- Existing RPH Functions
- DSKP Functions
- Authentication
- School Accounts
- Teacher Accounts
- Subscription
- Payment Webhooks in Sandbox
- CRM
- Marketing
- Affiliate
- Support
- Ticket
- Legal Pages
- Security
- Performance
- Responsive UI
- Backup & Recovery

---

# 11. Mandatory Testing & Evidence

每阶段必须提供：

- Implementation Summary
- Files Changed
- Database Migrations
- Automated Test Results
- Integration Test Results
- Security Test Results
- Browser Screenshots
- Responsive Screenshots
- Regression Report
- Known Issues
- Remaining Risks
- Git Commit SHA
- Rollback Plan

必须测试以下关键场景：

1. 同一订单不得重复支付佣金。
2. 已退订用户不得继续收到营销邮件。
3. 退款必须正确冲回佣金。
4. 非授权人员不能查看客户财务及个人资料。
5. AI 不能绕过账户权限。
6. 支付 Webhook 重复到达不能重复入账。
7. 邮件重复接收不能无限创建 Ticket。
8. 取消订阅不能错误删除客户必要交易记录。
9. AI API 故障不得影响核心教学功能。
10. 新商业模块关闭时，原有 ERPHPro 必须正常运行。

---

# 12. Autonomous Execution Rules

允许 Agent：

- 审计仓库
- 设计架构
- 实现功能
- 创建迁移
- 编写测试
- 运行测试
- 修复测试失败
- 更新文档
- 在授权开发分支提交代码
- 生成阶段报告

未经 Owner 明确批准，禁止：

- 正式上线新商业功能
- 发送真实营销邮件
- 导入未经授权的私人联系人
- 执行真实付款或佣金发放
- 修改真实银行账户
- 自动签署法律协议
- 提交 MyIPO 商标或著作权申请
- 修改生产 DNS
- 删除生产数据库
- 将真实客户资料发送到未经批准的 AI 服务
- 对生产环境执行不可逆迁移

---

# 13. Definition of Done

只有符合以下全部条件，才可声明完成：

- 前台页面真实可用。
- 后台管理功能真实可用。
- 数据库及 API 完整连接。
- 权限及安全控制通过测试。
- AI Support 能处理允许的标准问题。
- Email Ticket 能正常接收、分类及处理。
- Marketing Automation 能在测试环境执行完整流程。
- Affiliate Referral 能正确归因。
- Commission Engine 能正确计算及冲回佣金。
- ANKL Revenue Sharing 能生成准确报表。
- Copyright 声明与已确认权属一致。
- 原有 ERPHPro 教学功能未受破坏。
- 全站回归通过。
- 所有测试及验收证据真实可核查。
- 未经批准的生产、资金及外部营销操作均未发生。

---

# 14. Final Instruction

Start with Phase 0 immediately.

Inspect the actual ERPHPro repository and existing implementation before making architectural decisions.

Create a complete implementation roadmap and dependency map.

Then proceed autonomously through all safe, authorized development phases, without repeatedly requesting permission for routine coding, testing, documentation or internal refactoring.

Escalate only when decisions involve legal ownership, commercial pricing, real money, production systems, external marketing, personal data, or other material risks.

Do not claim success without executable implementation and verified evidence.

**Ultimate Goal: Transform ERPHPro from a teaching software product into a secure, automated, subscription-based education SaaS business with scalable customer acquisition, affiliate growth, AI support and transparent revenue sharing.**
