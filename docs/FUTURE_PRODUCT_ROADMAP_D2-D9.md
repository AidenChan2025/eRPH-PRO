# eRPH Pro 未来产品路线：Development 2–9

状态：研究完成，作为未来开发目标；暂不实现  
日期：2026-11-20  
当前阶段：Development 1 = 学校租户、Google Workspace 登录、角色权限、教师资料、RPH、审核、报告与 Plesk SSR 基线

## 1. 研究结论

这 25 个 Facebook Reel 反复呈现同一个学校痛点：资料不是没有，而是散落在 Excel、Word、文件夹、WhatsApp 和纸本；校长或管理层一问问题，就要人工打开多个文件、重新计算，无法即时回答。

未来 eRPH Pro 不应只是 RPH 工具，而应逐步成为轻量 School Operations Platform：

- 一套学校 SQL 数据源；
- 每个模块拥有自己的权限、生命周期和审计；
- Dashboard 从结构化资料计算；
- 报告可以按学校格式打印或导出 PDF；
- 批量任务优先自动化；
- 学校管理员可配置学年、班级、作息、阈值和模板；
- 学生、教师和活动资料可以互相联通，但模块分阶段启用。

研究依据是 Facebook Reel 的公开标题、描述和 canonical 页面；完整视频画面、内部实现和原系统数据库不是可验证证据，因此表结构和路线属于 eRPH Pro 的产品推导，不宣称复制原系统。

## 2. 阶段边界

### Development 1：当前正在做

学校多租户、学校 subdomain、Google Workspace 登录、Owner、学校管理员、教师资料、RPH、审核、报告、作息设置、临时督学访问、审计日志和 Plesk SSR 部署基线。

### Development 2：学校资料与分析底座

统一学生、班级、教师、科目、学年、活动、文件、标签和报告查询模型。

### Development 3：学生事务与学习进展

学生档案、出勤、纪律、PBD、UASA、补救、PPKI、学前教育和学生综合进展。

### Development 4：教师与学校行政运营

教师出勤/请假、教师任务分配、工作量、Portfolio、Guru Ganti、会议与学校工作流。

### Development 5：课程、课外活动与图书馆

课外活动、PAJSK、PSS 图书馆、NILAM、活动出席和报告。

### Development 6：文件、证书、表格和审批自动化

批量证书、课程证书、信件、考试成绩单、活动文件、学校计划书、预算、tentative、AJK 和电子审批。

### Development 7：考试、评估与干预分析

考试成绩、TOV/AR/ETR、等级分布、班级比较、学科热图、3M 技能分析和干预追踪。

### Development 8：资源与学校运营

RMT 资格、费用/缴费、场地预约、资源、供应商和可配置的学校运营记录。

### Development 9：整合式学校 Dashboard 与 AI

跨模块校长 Dashboard、自然语言查询、自动报告摘要、DeepSeek 教案生成、学校级额度、通知和可审计 AI 工作流。

## 3. 逐条视频研究记录

### 3.1 MPT4 矩阵分析

来源：[Facebook Reel 18UbWyWVCj](https://www.facebook.com/share/v/18UbWyWVCj/)

BM、BI、Math、Sains 的 Tahun 4 成绩集中到 Dashboard，比较班级、掌握率和仍需关注的技能，并可打印/PDF。

路线：Development 7。需要结构化评估科目、技能、班级、掌握状态、学年和报告周期。

### 3.2 PSS 图书馆管理

来源：[Facebook Reel 1FjTt33Gdo](https://www.facebook.com/share/v/1FjTt33Gdo/)

收藏、会员、借阅、归还、NILAM、PSS 活动、逾期自动标记、借阅逾期报告。

路线：Development 5。建议模块：library items、memberships、loans、NILAM、activities。

### 3.3 教师出勤与请假

来源：[Facebook Reel 1HX2rmkwfq](https://www.facebook.com/share/v/1HX2rmkwfq/)

教师资料、请假、工作日计算、学校周末、学校假期和公共假期配置、月度摘要。

路线：Development 4。必须复用学校 academic calendar，不能写死星期或假期。

### 3.4 PBD 学习进展

来源：[Facebook Reel 1CYCNVuEXb](https://www.facebook.com/share/v/1CYCNVuEXb/)

学生、班级、科目、标准学习内容、TP1–TP6、平均值、TP 分布、个人和班级报告。

路线：Development 3 与 7。教师只编辑自己负责的班级/科目。

### 3.5 学校毕业证书

来源：[Facebook Reel 1e6iAekNm3](https://www.facebook.com/share/v/1e6iAekNm3/)

学校资料、Logo、校长批准签名、Excel 导入、自动序号、按班级筛选、预览、批量打印/PDF。

路线：Development 6。签名资产必须私有，证书序号不可重复，生成记录可审计。

### 3.6 教师任务与 Portfolio

来源：[Facebook Reel 14sAKLFP9hb](https://www.facebook.com/share/v/14sAKLFP9hb/)

教学任务、额外职务、任务权重、总工作量、超标提醒、Portfolio 状态和报告。

路线：Development 4。连接当前教师资料、Panitia 和未来课外活动。

### 3.7 学前教育

来源：[Facebook Reel 1H4uEfL8dY](https://www.facebook.com/share/v/1H4uEfL8dY/)

学生、班级、监护人、出勤、活动、评估、月度摘要和学期 Kad Laporan。

路线：Development 3。应支持学前专用评估项目。

### 3.8 PPKI

来源：[Facebook Reel 1FK6FvaeiP](https://www.facebook.com/share/v/1FK6FvaeiP/)

学生、教师、班级、监护人、出勤、学习目标、类别分布、Dashboard、个别进展和筛选报告。

路线：Development 3。属于高敏感资料，需要独立权限和严格附件审计。

### 3.9 学生综合记录

来源：[Facebook Reel 1AGyx6rLJf](https://www.facebook.com/share/v/1AGyx6rLJf/)

学生档案、PBD、UASA、SEGAK、BMI、PAJSK、心理测验、综合 Dashboard、家长报告。

路线：Development 3、5、7。这是未来 Student 360，不在 Development 1 提前实现。

### 3.10 考试成绩分析

来源：[Facebook Reel 1GxExMogEJ](https://www.facebook.com/share/v/1GxExMogEJ/)

Excel 导入、平均成绩、等级分布、TOV、AR1、AR2、ETR、学科分析、班级热图、学生档案和导出。

路线：Development 7。导入必须预览、验证列名、报告错误并保留批次。

### 3.11 课外活动报告

来源：[Facebook Reel 1dcjeRjyeV](https://www.facebook.com/share/v/1dcjeRjyeV/)

会议、出席、目标、活动、反思、自动出席率、图片、签名、月度图表和历史报告。

路线：Development 5。连接 PAJSK、Calendar、教师任务和附件。

### 3.12 课程/培训证书

来源：[Facebook Reel 1524Mti1wnU](https://www.facebook.com/share/v/1524Mti1wnU/)

课程数量、参加者、报告、证书、模板链接和批量生成。

路线：Development 6。可连接教师专业发展、学生活动和外部参加者。

### 3.13 RPH Dashboard

来源：[Facebook Reel 1CXUhSUNpc](https://www.facebook.com/share/v/1CXUhSUNpc/)

显示总数、百分比、尚未提交、未审核、需要编辑、已确认；按星期、年级、科目筛选；颜色状态；点击卡片进入预筛选 RPH。

路线：Development 1 后续增强，优先于新的学生模块。

### 3.14 自动学校活动计划书

来源：[Facebook Reel 1CLxE69D9E](https://www.facebook.com/share/v/1CLxE69D9E/)

活动详情、tentative、预算、AJK、签名、Kertas Kerja、Email 送审、分区编辑和批量生成。

路线：Development 6。需要版本、审批状态、预算权限和已批准 PDF。

### 3.15 补救教学技能分析

来源：[Facebook Reel 1CqCf6ywca](https://www.facebook.com/share/v/1CqCf6ywca/)

补救学生、筛选结果、3M 技能掌握、最弱技能/班级、关注名单、干预和个人报告。

路线：Development 3 与 7。要记录干预前后结果。

### 3.16 课外活动趋势与 PAJSK

来源：[Facebook Reel 1F83vxvWJs](https://www.facebook.com/share/v/1F83vxvWJs/)

月度出席趋势、PAJSK 平均分、按班级/活动查看、制服团体/社团/体育分类和报告。

路线：Development 5。

### 3.17 学生纪律

来源：[Facebook Reel 1FTHgdpfzz](https://www.facebook.com/share/v/1FTHgdpfzz/)

纪律案件总数、抽烟、欺凌、打架、逃课、迟到、已完成/未完成、严重类别、月度趋势、班级分布、Top 5 和 OPR HEM。

路线：Development 3。报告、调查、确认、措施、关闭必须是不同状态。

### 3.18 学费/费用收取

来源：[Facebook Reel 1511aZ9oPZN](https://www.facebook.com/share/v/1511aZ9oPZN/)

公开 canonical 标题指向已缴费学生、欠费学生和班级收款情况。

路线：Development 8。需要财务角色、付款批次、收据、退款/更正审计。

### 3.19 每日学生出勤

来源：[Facebook Reel 1Fsd6PzghK](https://www.facebook.com/share/v/1Fsd6PzghK/)

查询当天缺席学生和缺席原因，替代分散的 Sheet。

路线：Development 3。连接学校日历、班级、监护人通知和低出勤预警。

### 3.20 Guru Ganti

来源：[Facebook Reel 1ACqNLxtk5](https://www.facebook.com/share/v/1ACqNLxtk5/)

公开 canonical 标题指向教师缺席、班级是否已有代课和每日代课安排。

路线：Development 4。连接排课、教师空堂、请假和每日通知。

### 3.21 RMT 资格

来源：[Facebook Reel 1EprM2RPri](https://www.facebook.com/share/v/1EprM2RPri/)

判断哪些学生符合 RMT，避免从 Sheet/Excel 手工筛选。

路线：Development 8。资格规则必须可配置、可追溯。

### 3.22 场地预约

来源：[Facebook Reel 1DqN4HfU7T](https://www.facebook.com/share/v/1DqN4HfU7T/)

查询场地是否空闲和某日是否已有预订，替代 Excel。

路线：Development 8。复用未来 timetable 的时段与资源冲突模型。

### 3.23 批量信件、成绩单和表格

来源：[Facebook Reel 1A6dmszWiY](https://www.facebook.com/share/v/1A6dmszWiY/)

批量替换姓名、IC、成绩，减少重复输入、错填和无法追踪完成状态。

路线：Development 6。需要模板变量、批次、预览、生成状态、重试和下载审计。

### 3.24 Tournament / 比赛积分

来源：[Facebook Reel 1FGfDxFyA7](https://www.facebook.com/share/v/1FGfDxFyA7/)

比赛结果、3/1/0 积分、得失分、赛程、场地和参赛查询。

路线：Development 5 或 8。先作为课外活动扩展。

### 3.25 一体化学校系统方向

来源：[Facebook Reel 19L1pnVQAh](https://www.facebook.com/share/v/19L1pnVQAh/)

公开 canonical 标题指向一个学校管理系统、一个 Dashboard 和 Bahasa Melayu 界面。

路线：Development 9。这确认 eRPH Pro 的长期定位是学校运营平台，而不是单一 RPH 表。

## 4. 共用数据模型与安全原则

所有 Development 2–9 必须遵守：

1. 所有学校资料带 school_id。
2. 学年、班级、科目、学生、教师和成员使用稳定内部 ID。
3. 重要记录使用状态生命周期，不靠删除代表完成。
4. Excel 导入有预览、错误报告、批次和更正记录。
5. 报告从 SQL 结构化资料计算。
6. PDF、打印和下载记录生成者、筛选条件和时间。
7. 纪律、辅导、PPKI、学生健康和财务使用独立权限。
8. 界面支持 BM、English，未来加入简体中文。
9. 批量操作可审计、可重试、可标记失败。
10. AI 只能在授权资料范围内工作，输出必须人工确认。

## 5. 建议开发顺序

### D2：共用资料底座

学生、班级、学年、科目、档案附件、文件、导入批次、报告筛选和统一 Dashboard 查询。

### D3：学生与 HEM

学生档案、监护人、出勤、纪律、低出勤、学生综合进展；这是目前最明确的未来方向。

### D4：教师与日常行政

教师请假、出勤、任务、Portfolio、Guru Ganti，同时增强 RPH Dashboard。

### D5：课外活动和 PSS

课外活动、PAJSK、NILAM、PSS 图书馆和活动报告。

### D6：自动文件工厂

证书、信件、成绩单、课程文件、Kertas Kerja 和电子审批。

### D7：成绩与干预

PBD、考试分析、MPT4、3M 补救、TOV/AR/ETR。

### D8：资源和财务边界

RMT、缴费、场地预约和资源，每一块使用独立权限。

### D9：统一 Dashboard 与 AI

校长视图、管理层视图、自然语言报告、DeepSeek RPH 生成、通知和跨模块洞察。

## 6. 与当前 Development 1 的严格隔离

当前不实现学生正式 SQL 表、纪律、出勤、PBD、UASA、PAJSK、PSS、RMT、缴费、批量证书、学校活动计划书、DeepSeek API 或 Billing。

当前只保留可复用接口：school_id 多租户边界、User、school memberships、roles、permissions、teacher profiles、school settings、academic year、timetable slots、audit logs、lesson plan reports，以及 future module 命名空间预留。

## 7. 产品标准

每个未来模块都必须做到：

输入一次 → 自动计算 → Dashboard 即时回答 → 需要时打印正式报告。

如果新模块仍要求管理层打开多个 Excel 手工计算，就没有真正解决这些视频展示的学校痛点。
