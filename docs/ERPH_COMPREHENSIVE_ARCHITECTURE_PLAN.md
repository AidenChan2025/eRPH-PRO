# eRPH Pro 全面审查与实施计划

状态：第 7 版（Gemini 内部浏览器独立审查通过：10.0/10，11 项全 10，重大/非重大遗留 0；计划门禁放行，可恢复 Phase 0。第 5 版评分不涵盖新增范围）
审查基线：`f84cb98bf99233462e1b7c7989fd012f9f64d1b5`（本地 main 与 origin/main 一致）
产品类型：马来西亚学校运营 SaaS，生产前端以 Laravel SSR + MySQL/MariaDB 为准

## 1. 目标与边界

把 eRPH Pro 做成可靠、完整、响应式的学校日常工作系统；保留 AppSheet 与现有 RPH/DSKP 的必要业务条件，只改进信息组织与操作呈现。计划覆盖官网、登录、平台级全站管理控制台、学校管理端、教师工作区、支持中心、演示学校、教育文章/资料库、课程数据底座和后续交付治理。

本文件定义实施范围、阶段依赖、验收和安全门禁；实际实现按第 6 节逐阶段推进，未通过该阶段 Gemini 10/10 审查不得进入下一阶段。旧代码清理先做调用/依赖/数据/部署追踪，再分为可删、迁移后删、保留三类；不因“看起来旧”就删除。

## 2. 审查基线与当前证据

- SSR 路由已包含公开首页、Features、About、FAQ、Owner 登录、只读学校概览、审计/工单、学校工作区、RPH 新建/编辑/提交、学校设置/成员/访问、审核、报告，以及 support 子域文章和 ticket。现有 Owner 页仅有跨租户学校数量/状态概览，没有学校生命周期管理、平台团队/RBAC、集成配置、全局运营等全站控制台能力；不能把 Owner 登录存在等同于平台后台已完成。
- 生产前端目标已明确为 SSR + SQL；React/Vite + Firebase 仅作为历史实现/参考。`docs/FIREBASE_BRIDGE_PLAN.md` 当前已明确拒绝 Firebase 桥接、双写与自动导入；其中的迁移图位于“Rejected migration boundary”并明确标为不实施方案，不视为现存决策冲突。Phase 0 仍须核验活跃调用、构建依赖和 `VITE_FIREBASE_*` 残留。
- SQL 已有学校/成员、教师资料、课程条目、RPH/版本/审核、提交事件、学校设置/课表、Google 身份、审计、支持文章/工单等表。
- RPH 结构以 `docs/RPH_FORMAT_MAPPING.md` 列出的教师 workbook（MENU/DATA/DSKP/SUBJEK/课表）与提交 workbook（DASHBOARD/REPORT/SEMAK ERPH/guru/CONFIG）为基准。`LessonPlanController` 当前允许大量教学字段为空；表单和更新/提交流程是否满足官方条件必须通过逐字段对照确认。
- AppSheet 已直接观察到 MENU 有 e-RPH、MODUL ADMIN、MODUL GURU。Admin 可见功能包括管理 Google Classroom/Topic/Assignment、提交日程、检查提交、打印提交记录、教师转校/离职、JPN/PPD 检查；Guru 可见提交信息、准备及编写日常 RPH、代课日 RPH、Google Classroom 学生模块和提交模块。此为菜单级证据；每个表单与链接目标仍需继续逐项读取。
- 已只读审阅内部 Drive 中的 `3.1 Modul Semakan Penghantaran` Google Slides（9 页）：Admin/审核人进入 Classwork/Assignment；`Assigned` 下包括未在截止后提交者与附件，培训材料标为 `Missing`；已提交教案属于另一条待阅/评分路径。单份审核示例要求 1/1 评分并添加评语；批量路径为对已 Turn in 项评分、Return，并填写评论。它是 Google Classroom 培训操作证据，不是现有 eRPH Pro 完整状态/评分政策；本系统仍须把 `Missing`（未提交）与 `pending_review`（已提交待审）分离，评分上限/是否必须评分应配置化，批量结果须逐项显示成功/失败且可安全重试。材料未证明退回后的再次提交、部分成功、跨周迟交、学校间政策差异；这些仍列为待取证和验收用例。
- 已只读审阅内部 Drive 中 `1.3 Modul Admin- Membina jadual Penghantaran eRPH (Schedule)` Google Slides（6 页）：排程包含周标题、提交 topic、开放/启用时间、到期时间、适用 Classroom 班级；可把日期设置复制至所有班级再统一 Schedule。该材料证明源流程按周组织、可配置开放/截止时间并批量套用多个班级；不证明节假日/Group A/B 校历、个人补交、截止后附件策略、更新既有任务时的覆盖语义。SSR 排程须由学校日历和课表计算目标教学周，并对批量操作提供逐班结果，不能照搬 Google Classroom 的全班统一时间假设。
- 2026-11-21 用户授权清理的 5 个历史未跟踪副本（`README 2.md` 与 4 个 `* 2.php` 视图）已核对为过期/冗余文件并移除；此前有差异保护的决定已由 Owner 的明确清理指令取代。当前实现不得留下未归属的临时或重复文件。
- React 工程含三语 JSON、Firebase/Firestore DSKP 同步代码、Drive 备份与演示文案。这些与 SSR-only 生产决策是否一致需做静态依赖图和实际路径审查；不可把旧代码里宣传性文案误当成已交付能力。
- Firebase 静态依赖增量（2026-11-21，当前 checkout 只读）：`git grep` 在旧 React/Vite 页面、context、services 与 DSKP 模块发现 Firestore/Auth imports 和写路径；`vite.config.ts` 仍把 `VITE_FIREBASE_*` 编译进旧 bundle，根 `package.json` 仍提供 `deploy`（Firebase Hosting）/`serve:firebase`，根 `firebase.json` rewrite 到 SPA，`scripts/seed-firestore-dskp.js` 仍可向 Firestore 写 DSKP，部分旧翻译仍宣称云端 Firestore 同步。相同扫描在 `ssr/app`、`ssr/routes`、`ssr/resources`、`ssr/bootstrap`、`ssr/config`、`ssr/database` 与 SSR composer manifest 未发现 Firebase SDK/import/config 命中；Plesk 当前 Document root 指向 `ssr/public`。因此当前证据支持“生产目标 SSR 没有 Firebase 调用点、旧前端仍有可执行 Firebase 路径”，但不证明 Firebase 项目已停用或旧 Hosting 无流量。保留历史代码期间须从生产发布入口、CI、Plesk Git 自动部署路径中隔离旧 `npm run deploy`/Firestore seed；删依赖前还需追踪旧 Firebase Hosting 流量、资产/数据保留与备份归档，不能仅因 SSR 无引用就删除。
- 现有演示学校 seeder 是工程测试/预置数据证据，不等于安全、可公开的试用体验；演示身份、重置和租户隔离尚需专门验收。

## 3. 业务追踪矩阵（目标验收基线）

需求 ID 前缀：`PUB` 官网/支持、`PLT` 平台级管理、`RPH` 教案、`ADM` 学校管理、`REP` 报告、`CUR` 课程资源、`TEN` 租户身份、`INT` 集成、`OPS` 运维、`UX` 体验。Phase 0 产出的追踪表须双向关联每个需求到实际 route/name、controller/service、model/table/迁移、授权策略、页面、验收用例和运行证据；位置未核验时标为 TBD，不臆造代码映射。实施批次按 ID 引用该追踪表，变更矩阵与本节保持同一版本。

| 需求 ID | 业务域 | 必须保留/实现的能力 | 当前核验状态 | 验收证据 |
|---|---|---|---|---|
| RPH-01 | 教师 RPH | 教师、学年、周次/跨周顺延、日期/星期、节次/时间、班级、出席/总人数、科目、Tema、Kemahiran、Tajuk、SK/SP/TP、Sivik、目标、PdPc 活动、BBM、EMK、PAK21、书面/口头/观察评估、NILAI、Pengayaan、Pemulihan、KBAT、多元智能、Refleksi、Catatan/Sebab Tidak Dilaksanakan、备注；兼顾 Tingkatan 1 与小学字段差异；按 A/B 组及校历生成实际教学日 | `docs/RPH_FORMAT_MAPPING.md` 与部分表单存在；源表和条件规则未完整核实 | AppSheet 字段/条件矩阵；服务端规则；输入-保存-重开-打印端到端保真；单节详案与 Mingguan A4 样张 |
| RPH-02 / TEN-01 | 教师提交与历史 | 草稿、必填拦截、单份/整周提交、准时/迟交、退回修订、批注、版本和不可变提交快照；冻结提交时引用的 SK/SP 原文、课程版本及来源哈希；代课记录原任/代课教师、原课表项与原因 | 草稿/提交/版本和单份审核基础存在；周状态聚合和课程快照未证实 | 状态机、历史版本回看、部分退回聚合、并发/幂等、审计与浏览器旅程 |
| ADM-01 | 学校 Admin | 州属日历/学年/截止日、成员/审核轮值、教师/班级/课表、教师提交/截止缺交状态、逐份与批量审核、评分/评语/Return、批次逐条结果与重试、检查清单、单节及周表打印、转校/离职、限时督学只读授权 | 部分学校设置、成员和单份审核路由存在；工作流未证实完整。只读 AppSheet 流程确认 Classroom Assigned 中的 Missing 与已提交待审核需区分；示例 1/1 评分并 Return，不足以证明所有学校的评分政策 | 权限矩阵、完整状态机与政策配置、逐条批次结果/重试语义、缺交/迟交/补交/退回/重交场景、跨校身份场景及打印样张 |
| PLT-01 | 平台级全站控制台 | 独立于学校 membership 的 Owner/平台运营后台；学校开户/校验/启停/归档与管理员指派；平台运营成员及最小权限角色；学校/账户/邀请/身份关联与未分配访问处理；支持与工单队列；课程资料发布治理；全局 FAQ/文章；邮件、OAuth、Drive、Telegram、DeepSeek 连接状态（只展示 secret 配置状态，不显示 secret）；Demo 会话/限额；运行健康、版本/部署、队列/Cron、备份状态、告警；平台审计与限时、默认只读的跨租户协助 | 只有 `/owner` 只读学校列表、`/owner/audit` 和 Owner 工单；平台登录有单个配置邮箱门禁；没有学校生命周期写操作或完整 RBAC 控制台 | Owner 无学校 membership 仍可进入平台控制台；零学校时可开户；学校用户/学校 Admin 无法进入平台路由；角色权限负向矩阵；学校开户至首位管理员邀请全旅程；跨租户支持授权须学校侧批准或平台安全双人审批、明确 scope/目的/操作、最长 2 小时、显著标识/自动切断/审计；Break-glass 双人核验且 24 小时内独立复核；平台 MFA、Guard/session/CSRF 隔离、Owner SSH 恢复路径通过演练；secret 值永不回显 |
| REP-01 | 报告 | 周/月/年；单节 Slot 主状态 9 枚举：`absent`、`approved_leave`、`not_assigned`、`school_holiday`、`cancelled_class`、`not_submitted`、`pending_review`、`returned`、`approved`；提交时效 `on_time`/`late` 为独立维度；周汇总状态为 `not_submitted`、`pending_review`、`partially_returned`、`returned`、`approved`。按教师/班级/年级/科目筛选；统计按 Slot 计数，部分退回周中已批准 Slot 即计 `approved`、退回 Slot 计 `returned`，周状态只作摘要 | 报告路由和提交表存在；分母及聚合口径待审 | 指标字典、原始事件复算、代课双维度归属及 CSV/PDF 对照 |
| CUR-01 | DSKP/教学资料 | SK/SJKC/SJKT/Prasekolah/KAFA/合班及 KP2027/KSSR Semakan 2017 的来源、原文、学年/年级/学科/版本/有效期/权利/导入校验；已引用版本不可被后续导入覆盖 | 当前 SQL 模型较简单，React/Firebase 路径与生产集成未证实 | 逐年级×科目×课程版本覆盖/授权矩阵、历史快照和导入差异报告 |
| CUR-02 | 预制教案 | 由课程目标/学年/科目/主题/节时/班情组合可解释建议，教师确认编辑后才成为正式 RPH | 生产规则引擎未证实 | 可追溯规则、审校样例、冲突及覆盖分析 |
| TEN-02 | Demo 学校 | 只读共享基线 + 每个短期会话隔离可写沙箱、合成数据、重置、真实外部副作用拒绝 | 现有 seeder 不代表公开安全试用 | 并发隔离；`demo_session_id`/`expires_at` 标记；小时级 GC/删除失败告警；越权与外发拒绝验证 |
| PUB-01 | 官网与登录 | 首页、Features、About、FAQ、登录、语言、SEO、性能、无障碍 | SSR 路由存在；逐页验收未完成 | 路由/页面/控制器映射、视口截图、键盘/屏幕阅读和页面指标 |
| UX-01 | 三语与响应式 | 简中、BM、EN 的 SSR 导航/表单/错误/邮件/支持/文章/报告；原课程文本保持官方语言 | React 有 locale JSON；SSR 覆盖待核实 | 可见翻译键覆盖、日期数字格式、390/768/1024/1440 视口及横溢出验收 |
| PUB-02 | 支持与文章 | FAQ/知识库、分类/搜索、ticket、管理员回复、人工升级 | Support 路由/表存在；全旅程待核实 | 访问/权限/反滥用/邮件通知/审计旅程 |
| INT-01 | Google Drive | 最小授权文件选择/展示/预览、撤权、ACL 变更和失效处理 | SSR 集成未证实 | Scope/ACL/撤权/删除/审计验证 |
| INT-02 | 通知与机器人 | 站内/邮件/每周提醒；Telegram opt-in；WhatsApp 先核价；DeepSeek 安全答疑与人工接管 | 仅部分支持基础存在 | 发送/失败/退订日志、脱敏、人工升级、预算限额 |
| OPS-01 | 发布与迁移 | 每阶段记录实施 SHA、自审、Gemini 评分、Plesk 验收范围、生产依赖、备份/恢复证据、可回退或前滚方案与 Owner 放行；无 staging 时按同版本影子库验证数据库变更 | Plesk 实际能力与恢复证据待 Phase 0 | 发布清单、影子库迁移/数据核验、备份可读与恢复演练、候选环境运行记录 |

当前可核实的代码入口（能力是否完整仍待验收）：`PUB-01` → `public.features`/`public.about`/`public.faq`；`RPH-01/02` → `rph.create/store/edit/update/submit`；`ADM-01` → `school.admin.*`、`school.settings*`；`REP-01` → `school.reports`；`PUB-02` → `support.*`、`owner.support.*`；`PLT-01` 仅有 `/owner`、`/owner/audit`、`/owner/support/*`，分别由 `OwnerController`、`OwnerAuditController`、`OwnerSupportController` 处理，且 `owner.dashboard` 目前只渲染只读学校列表。只读 `php artisan route:list --except-vendor -v` 于 2026-11-21 列出 48 条路由；8 条 Owner 路由只有登录、概览、审计及工单，尚无学校生命周期、平台团队/RBAC 或全局设置端点。平台身份通过 `platform.owner` 中间件检查 `platform_role === owner`，Owner 身份不要求 school membership；普通学校用户没有活动 membership 时必须进入明确的待分配/联系管理员旅程，不应误显示为平台后台。**已发现认证隔离实现缺口（只记录，不在 Phase 0 改代码）：**`routes/web.php` 的平台读写路由仍共用默认 `auth` Guard，Owner 登录入口、Google 回调也未按 host 限定；`GoogleAuthController` 将 Owner 登录意图与学校子域状态放在同一个 web session，成功后调用 `Auth::login()`；`config/session.php` 接受 `SESSION_DOMAIN`，仓库 `.env.example` 及部署契约建议值为 `.erphpro.com`，若生产环境沿用该值则 cookie 会发送到各学校子域。后续 2026-11-22 13:09 MYT 未认证根域 HTTP 响应确认 `XSRF-TOKEN` 与 `erph-pro-session` 的 `Domain=.erphpro.com`，证明根域签发的这两类 Cookie 会发往子域；尚未验证认证会话是否被跨 host 接受、Guard 混淆或 CSRF 可利用性，不能据此宣称已证实账户接管。该静态证据说明当前实现尚未达到 Phase 1 要求的独立平台 Guard、host-only session 与独立 CSRF；Phase 1 必须以浏览器双身份隔离与跨学校子域负向用例闭合此项。PLT-01 仍缺开户、平台操作员管理、控制台导航和大部分全局操作。对应迁移已见 `2026_11_20_000100_create_school_core_tables.php`、`...000200_create_teacher_and_lesson_tables.php`、`...000201_create_lesson_plan_submissions_table.php`、`...000202_create_school_settings_table.php`、`...000204_create_school_timetable_slots_table.php`、`2026_11_21_000400_create_support_system_tables.php`。这些候选映射仅证明入口/表存在，不证明授权、字段、租户过滤或旅程合格。Phase 0 要逐条补 controller/service/model/policy/view/字段映射、验收用例和证据链接；位置未核验则标 TBD，不臆造。
2026-11-21 按当前 checkout 重新生成 48 条路由及 controller/view/model/租户过滤初步映射，详见本计划第 21 节。该底表明确标出需求映射仍需逐 action、迁移、授权策略及验收证据交叉验证，不能视为完整追踪或 Phase 0 放行。

## 4. 目标架构

```text
公开官网 / erphpro.com/owner 平台控制台 / 学校教师与 Admin SSR / support/article 子域
                         │ HTTPS + CSRF + 会话
Laravel SSR：路由 → 独立 platform RBAC 或 school membership/租户上下文 → 应用服务 → 校验/状态机
                  │                                               │
平台运营控制面                                         school_id 租户数据面
独立 platform Guard/Session + 强制 MFA                 每个查询/写入强制 school scope
学校主动授权/双人审批的限时 JIT                         教师、School Admin、审核与 RPH
                  └───────────────────┬───────────────────────────┘
                                      │
        MySQL/MariaDB（平台目录、租户业务、参考课程、审计、队列）
          │                  │                    │
  私有文件存储         队列/定时任务          外部适配器
  Drive 连接(可选)     邮件/提醒              Google/Telegram/DeepSeek
```

- 保持 Laravel SSR + SQL 为唯一生产写路径；先核验部署实际入口，随后评估移除不再运行的 Firebase 客户端/路由/依赖。React UI 如仍承载独立有用页面，先逐页迁移和比对再删。
- 平台控制台固定使用主域名路径 `https://erphpro.com/owner`（包括登录与 OAuth 回调），禁止学校子域访问平台路由；学校端继续使用学校子域。平台 RBAC 与学校 membership 是两个独立身份/授权面；平台使用独立 Laravel Auth Guard、独立 session cookie 名称和 host-only 主域 Cookie，限定 `/owner` 路径且不设置 `.erphpro.com` 父域共享；学校会话不得认证平台请求，平台会话也不得成为学校 membership。平台 CSRF token 与 session 独立，切换身份不复用 token。
- 所有平台操作员强制完成平台 MFA（独立 TOTP 或经验证的等强度第二因素）后才能进入平台工作区或任何平台写路由；未完成绑定仅允许受限 enroll/recovery。高风险操作另要求近期重新认证。平台运营页面默认聚合脱敏元数据；读取具体租户业务内容必须由目标学校 Admin 主动发起带 scope/对象/目的/期限的授权并批准平台请求，或由两名不同平台人员（其中一名有安全权限）双人审批；不能由同一人申请和批准。JIT 默认只读、范围最小、最长 2 小时、显著显示会话标记、自动切断并全程审计。写入/导出另行审批并重新认证。
- Break-glass 仅限 P0 安全事故或学校 Admin 确实不可联系且业务/安全紧急的情形；由两名不同平台授权人员批准并限定学校/数据范围/操作/期限，事后 24 小时内由未参与开启者完成复核。若唯一 Owner 被停用或 OAuth 故障致平台锁死，可由具备已授权服务器 SSH 的运维人员运行受版本控制、签名/校验并受 OS 权限保护的本地 bootstrap 命令；命令只允许恢复指定平台账号的受限访问，不授予学校 membership、不提供 Web 提权入口，要求独立第二人核验/批准并将操作者、目标、原因、工单、时间和结果写入受保护的追加式审计日志，恢复后立即强制 MFA、轮换恢复凭据并在 24 小时内独立复核。无法满足双人核验时只允许恢复登录能力，不开放租户数据访问。
- 以 `school_id` 为租户边界；每个学校业务读取、写入、导出、队列任务、对象存储路径都必须显式带租户上下文，禁止通过空 `school_id` 获得全租户访问。
- 身份与学校成员关系分离；同一教师可有多个并行 membership，任一学校管理员只能访问本校成员有效期内本校产生的 RPH；教师转校后新校仅见新校任期记录。原校档案不随身份迁移，教师本人按授权导出；跨校督学只允许有范围/期限的只读授权并全程审计。学校数据留存、个人资料导出按政策执行。
- RPH 用结构化主键/索引 + 可版本化字段内容；把官方字段字典、表单条件、必填策略和输出版式显式版本化，不让 JSON 随意丢字段。
- 课程库作为受版本管理的参考数据域：来源/版权、学年、科目、年级、主题、内容标准、学习标准、绩效标准、语言/原文、有效期、导入批次、校验状态、变更差异。
- 课程实体还需覆盖 SK、SJKC、SJKT、Prasekolah、KAFA、合班等校型/学制；KP2027 与 KSSR Semakan 2017 可在同一学年按年级并存路由，界面三语不得覆盖官方课程原文。
- 课程勘误须区分非实质排版/拼写修正与实质标准变更，保留来源版本和变更审计；已提交或已批准 RPH 永不静默刷新。未提交 draft 可提示有新版本并由教师显式选择更新，更新前后均可查看差异，保留教师内容且不丢字段。
- 同一教师并行任职多校时，每个请求必须从明确选择且经服务端校验的活动 membership 建立租户上下文；切换学校轮换会话/CSRF 状态，写请求绑定 membership 与 `school_id`，并发/多标签请求不得依赖可变的全局 session school。排课冲突仅在同一教师、同一实际时间区间检测，并支持经授权的跨校代课例外及审计。
- 通知、Drive、Telegram、DeepSeek 都采用可关闭的适配层和失败队列；外部服务失败不能阻止保存 RPH/审核。
- SSR 优先保持首屏可用、表单可访问和 SEO；CSS 负责布局/过渡，服务端状态机与验证负责正确性，少量渐进增强 JS 处理 Modal、动态课表预填和异步交互。优先复用现有依赖，避免仅为动画引入重型框架。

## 5. UI/UX 设计系统

- 品牌基线按用户指定：背景 `#F5F5F7`、卡片 `#FFFFFF`、正文 `#1D1D1F`、次级 `#86868B`、分隔 `#D2D2D7`、强调蓝 `#0071E3`；状态绿/橙/红采用用户给的低饱和语义值及浅底。
- 进行对比度核算；`#86868B` 在白底上的普通小字可能不达 WCAG AA，需为小字选择更深辅助色，保留原色用于非正文/大字或图形。
- 页面范围：官网四页；登录/身份绑定/错误；平台 Owner 控制台（overview、学校生命周期、平台团队/RBAC、账户分配、课程/内容、支持/工单、集成状态、Demo、运维、审计/安全、全局设置）；教师 workspace、RPH 列表/周视图/编辑/预览/提交/修订；学校 Admin dashboard/成员/课表/配置/批量审核/报告；support 首页/搜索/分类文章/ticket 创建与对话；演示学校体验；Article/资源库。
- 每页先定义桌面信息密度与任务路径，再适配平板/手机；表格需转卡片/横向局部滚动策略，主要操作触控目标至少 44px，键盘焦点、错误定位、空/加载/成功状态一致。
- 评审断点：390、768、1024、1440；检查横向溢出、表单输入、长标题、Malay/中文混排、sticky bar、Modal 高度、打印版 RPH。
- 逐页应用 UIUX Max 与 Taste 的设计审查门槛；不生成没有实际用途的装饰图。缺失的关键图标/品牌视觉才生成，并提供可授权、马来西亚本地化的素材。
- 平台后台按 UIUX Max 建议采用可筛选/可搜索的数据密集型操作台，但服从 Owner 选择的 Apple 中性配色；按 Taste 高级前端约束控制视觉变奏与动效，拒绝装饰性动画、无意义 Bento/卡片堆叠和 emoji 图标。重点验收表格替代文本、过滤/排序/分页、批量选择、权限禁用说明、空/错误/加载状态和降低动态效果设置。

## 6. 阶段与依赖顺序

### 每个 Phase 的共同审查/放行流程
每个 Phase 都采用同一闭环：实施候选版本 → 我方逐需求审查和可复现验证 → UI 阶段按 UIUX Max、Taste skill 逐页审查，所有代码阶段按 Ponytail 做深度代码审查 → 整理差异/证据 → 仅用 Codex 内部浏览器把该 Phase 的范围、差异、证据与验收结果交 Gemini 独立审查 → 按意见修订并重复送审，直到 Gemini 明确给出该 Phase 10/10、无重大未解决项 → 部署至 Plesk 的受控生产候选/灰度范围 → 在真实生产运行栈做合成数据 smoke、安全与核心旅程核验 → 检查日志/指标/外部副作用 → 符合准出后才扩大真实学校可见范围并进入下一 Phase。Gemini 满分只表示该阶段设计/审查意见通过，不代替运行验收或 Owner 授权，也不单独构成生产发布许可。

#### Gemini Phase 审查传递协议

为减少附件失败、候选版本混淆和重复解释，每轮审查都使用同一份短审查包，直接在 Codex 内部浏览器提交；不依赖自动化脚本替 Gemini 评分，也不允许脚本自动改文件、提交、推送或部署。审查包必须先锁定并写明：

1. Phase 编号/名称、审查范围与明确排除项；候选 Git 分支、完整 40 位 SHA、相对生产基线的变更文件清单，以及工作树是否干净。
2. 本轮完整 diff（较大时分文件/逻辑段逐条发送，并标注顺序与总段数）；若给 GitHub 链接，必须注明 URL 对应的分支/提交及 Gemini 是否实际打开该 SHA。只提供 GitHub `main` 或尚未推送的本地 SHA，不能声称 Gemini 已读取候选源码。
3. 逐项需求→实现位置→自审/可复现证据→未验证限制的追踪表；附实际执行过的命令、退出状态和原始结果摘要，不把计划命令写成已执行证据。Laravel SSR 的检查项按仓库脚本/Composer 配置与本 Phase 风险选择，不套用 Next.js、npm 或固定测试命令。
4. 上轮 Gemini 每条意见的原文/编号、处置（修复/有依据不采纳/仍待解决）、对应 diff 和复核证据。未解决的重大意见必须在包首部醒目标为阻断项，不能用平均分掩盖。

审查请求要求 Gemini 独立核对其实际可见的精确版本，按计划 11 个维度逐项评分并给出总分、重大/非重大问题、证据不足项、具体修复建议和“是否可通过本 Phase 审查”。只有 Gemini 明确给出总评 10/10、11 项全 10、无重大未解决项时，记录才可标为本 Phase 第三方审查通过；若附件/源码不可见、版本未核实或只审了摘要，应如实缩小审查范围，不得用该结果放行 Phase。每轮修订后重新生成包并列出新 SHA/diff，旧轮意见不能自动沿用为新版本背书。审查通过后仍须分别关闭本 Phase 的生产候选验收、数据/安全/回退闸门及 Owner 放行，才能进入下一 Phase。

生产环境中的验证只使用合成数据、隔离 demo session/租户与不产生真实外部副作用的测试收件端；关闭实际学校通知、付费 AI、真实 Drive 写入和生产数据导出。用 feature flag、受控路由或独立 Plesk staging subscription 限定候选功能，避免未验收变化影响真实教师/Admin。若主机没有 staging，则先用 demo 隔离做受限生产 smoke。任何数据库 schema 变更须先在与生产数据库引擎/主版本一致的隔离快照库做正向迁移、代表性数据兼容/一致性核对和恢复演练；不以 `migrate:rollback` 作为通用安全证明（回滚可能丢失数据），仅对可逆且经核验的 migration 做回滚演练。生产变更前须由责任人确认加密备份完成、非空、可读取且恢复路径/耗时已知；先做向后兼容的 expand，灰度观察后才可另行批准收缩。涉及表结构、认证、租户权限或外发集成时须记录负责人、版本、窗口、准入健康指标与回退/前滚决策。出现数据泄漏、越权、不可恢复写入或关键旅程失败，立即关闭功能开关并停止扩量；按已演练方案恢复或前滚，不盲目执行生产 rollback。不得在生产上执行破坏性测试或通过公开可写 Demo 制造测试负载。


### Phase 0 — P0 线上恢复与证据/旧代码审计（不可跳过的实施闸门）
**P0 首要动作：** 先对用户报告的线上 503 做只读诊断和服务恢复：确认域名解析/TLS、Plesk subscription 与 document root、代理/应用进程、PHP-FPM、Laravel 日志、DB/缓存连接及最近自动拉取/部署记录；保存带时间戳的脱敏证据，定位故障层后采用最小可回滚修复，并复核首页、登录入口与健康端点。未定位前禁止清理代码、运行迁移或覆盖部署。若缺少控制台权限，立即明确记录阻塞点与所需只读访问，不伪称已修复。恢复后再继续常规基线审计。
只读取证路径：在 Codex 内部浏览器进入对应 Plesk subscription 的 Hosting/PHP Settings/Logs/Git/Databases/Backup 页面，记录版本、路径、运行状态、时间和脱敏错误摘要，不查看或复制 secret 值；SSH 若已授权，仅在确认的项目根目录运行 `pwd`、`php -v`、`php artisan route:list`、`php artisan about`（命令需受当前 Laravel 版本支持），数据库版本优先读 Plesk 信息，否则仅执行 `SELECT VERSION()`。将 503 访问时间与同一时间窗的应用/代理日志、最近部署 SHA 和恢复后首页/登录健康检查关联。
AppSheet 取证路径：在已授权的 AppSheet 页面依次打开 e-RPH、MODUL ADMIN、MODUL GURU 的菜单及实际表单，记录字段、显示条件、必填/枚举、动作和跳转；在关联 Google Sheet 查看全部标签、列标题、公式与引用范围。无法读取的项目标为未验证并注明表单/页面，不从菜单名推断逻辑。
仓库取证路径：在基线 checkout 保存 `git rev-parse HEAD`、`git status --short`、`php artisan route:list`、迁移列表及 `rg` 依赖引用结果；保护中的未跟踪文件只记录名称/归属待核项，不改名、不移位、不忽略、不删除。
课程与版权取证路径：由课程负责人提交“课程框架×学年×学段/年级×科目×语言”来源定位、版本/生效期、许可依据与抽样核验结论；无权利依据的材料维持私有，不公开分发。
完成路由/视图/控制器/模型/迁移/Seeder/JS/生产入口的依赖图；与 AppSheet 每个菜单项和字段映射；锁定删除名单及回滚点。核验 Firebase 文档所定“拒绝桥接”与实际活跃调用/构建依赖一致，盘点遗留 Firebase 配置是否仍在活跃路径。须形成可复核证据包：生产入口与 Plesk 配置、DB/备份恢复演练、队列与定时任务实测、AppSheet 源表/公式/枚举、DSKP 来源和授权清单、当前页面与路由实测、各类敏感数据出站清单。任一关键项未验证时，不进入依赖该项的估时、删代码或发布；只允许开展不依赖该项的审查准备。

### Phase 1 — 平台级全站管理控制台与学校生命周期
先建立与学校租户隔离的 platform control plane，固定宿主为 `https://erphpro.com/owner`；学校子域对平台路径一律拒绝，不增设 admin 子域。平台用独立 Guard、host-only/path-scoped session cookie 与 CSRF 状态，和学校登录会话物理隔离。提供 Owner/平台运营角色入口、清楚主导航及学校开户/管理员邀请/暂停恢复流程。平台角色采用显式权限矩阵（Owner、安全/运维、Support、课程/内容运营），默认拒绝；所有平台操作员强制 MFA 才能使用后台，未完成 MFA 只能完成绑定/恢复流程。Owner 无 school membership 仍可进入后台；无有效 membership 的学校用户看到待邀请/联系管理员指引。Owner bootstrap 受控且审计，禁止自助提权或邮箱域名自动赋权。

平台控制台的功能范围：
- 总览：学校/账户/待办工单、服务健康、运行告警和最近审计事件；指标注明范围/时间，不展示未授权租户明细。
- 学校目录与生命周期：新建/校验/编辑 school tenant、唯一 subdomain、校型/州属/日历默认值、首位管理员邀请、启用/暂停/恢复/归档；敏感生命周期动作二次确认并审计。订阅/计费只管理已批准的 entitlement 与状态，任何收费规则仍需 Owner 定义后才上线。
- 平台团队与权限：邀请/停用平台操作员、赋予最小角色、撤销/到期、重新认证及高风险操作复核；校内 `school_admin/principal/teacher` 角色不可映射或提升为平台角色。
- 账户和学校分配：查看 pending invitation/未匹配身份、重发/撤销邀请、处理教师跨校 membership 生命周期；任何跨校资料转移仍要求教师明确同意并保留来源学校档案。
- 全局运营模块入口按实际完成阶段开放：课程资源发布、FAQ/文章、支持/工单、邮件/OAuth/Drive/Telegram/DeepSeek 连接状态、Demo 限额与 GC、部署/健康/队列/cron/备份监控、全局配置及安全审计。尚未完成的模块不得用空壳假装可用；secret 只显示已配置/未配置与最近验证时间，不可回显。
- 跨租户协助使用 just-in-time 支持授权：目标学校 Admin 发起授权或审批平台请求，或者由平台 Owner/安全官两人审批；明确 school、目的、对象/数据 scope、操作和到期时间，默认只读、最长 2 小时，明显显示支持会话条幅，全程审计并自动过期。写入/导出需单独双人批准、重新认证和二次确认。P0 事故或学校管理员不可联系时可使用双人批准的 Break-glass，并在 24 小时内独立复核；详细限制见第 4、7 节。无合规授权时任何平台人员不得浏览教师/学生个人内容。

UI 按工作导向组织为：概览、学校、平台团队、账户分配、课程与内容、支持工单、集成、Demo、系统运行、安全与审计、全局设置；用清晰的租户上下文标记区分平台与学校，不以学校 Admin 页面充当平台后台。遵守既定 Apple 简约配色、可访问对比度、44px 触控、390/768/1024/1440 断点；加载/空/错误/成功/权限不足状态均有可执行下一步。

Phase 1 解锁矩阵：Phase 1 必须交付可运行的「概览、学校、平台团队、账户分配、安全与审计、基础系统运行/全局设置」六个模块；其中系统运行只展示本阶段已接通的健康/部署摘要，未接通的队列/Cron/备份项隐藏。Phase 3 通过后解锁课程与内容；Phase 4 通过后解锁 Demo 会话/限额；Phase 5 通过后解锁支持工单、邮件与提醒运营；Phase 6 通过后解锁 Article/FAQ 发布、OAuth/Drive/Telegram/DeepSeek 等集成运营。后续每个模块仅在其自身实现、自审、Gemini 10/10 和运行验收通过后出现；不显示禁用空壳或虚假状态。

准出：Owner 登录不依赖 school membership；零学校实例可开户并邀请管理员；非平台角色访问平台读写路由均拒绝，学校 Admin 越权成功为 0；所有操作员强制 MFA；Owner 与学校 Guard/session cookie/CSRF 隔离经同浏览器双身份及跨学校子域场景验证；平台角色矩阵允许/拒绝用例全部通过；学校生命周期服务端验证且审计；未分配用户得到正确指引；JIT 满足学校侧授权/双人复核、明确 scope、最长 2 小时、只读、自动切断及审计；Break-glass 仅限规定场景、双人核验、24 小时独立复核；唯一 Owner/OAuth 故障恢复演练成功；Phase 1 六个模块真实可用，其余模块按解锁矩阵隐藏；平台写入幂等、防 CSRF/重放，secret 不回显；关键旅程在合成数据隔离环境通过。

### Phase 2 — 核心 RPH 保真与工作流
完成字段字典和条件规则；构建学校日历/课表驱动周视图；服务端完整校验与提交前缺项拦截；版本、退回修改、代课 RPH；Admin 批量审核与审计。课表顺延只自动作用于尚未生成的未来空白周次；若目标周已有 draft，展示变更差异与冲突，由教师显式选择保留原计划或将未冲突内容复制到空白 Slot。任何已编辑内容不静默覆盖；保留原日期、假期豁免、来源 Slot 和审计记录，重复生成须幂等。

准出：字段与条件映射覆盖 100%；输入—保存—重开—打印/PDF字段保真 100%；A/B 组州属、假期、补课、跨周顺延、代课与 Tingkatan 1 差异场景逐一通过；批量审核失败语义与实际结果一致，重复提交不产生重复审核事件。单节状态与周级汇总分层：单节以 9 个业务状态之一计数，`on_time`/`late` 单独记录；已批准 Slot 即计 approved，被退回 Slot 计 returned 并可修订；周聚合遇到已通过/待审与退回混合时为 `partially_returned`，所有应审 Slot 均退回才为 `returned`，全部应审 Slot 通过后为 `approved`。修订提醒只针对退回 Slot；已批准 Slot 保持不可变；聚合状态只作摘要，不覆盖明细，且可由事件/明细重算。

### Phase 3 — DSKP 与教学资源数据底座
确认官方来源与版权授权；数据模式、语言/版本/有效期、导入预览、规则校验、去重、失败回滚、差异报告和管理界面；先以真实样本覆盖率验收，再决定是否可称“完整库”。教材/练习库支持来源、年级、科目、DSKP 对齐、文件权限、标签与搜索。

准出：每条已导入内容均有来源、版本、原语言、适用校型/年级/科目和权利状态；覆盖矩阵完整生成；无权利确认内容不可公开分发；抽样核验和重复/缺失报告经课程负责人确认。
### Phase 4 — Demo 学校与试用路径
为公开试用设置隔离 tenant 与合成数据；每条会话写入 `demo_session_id`、`expires_at`，默认建议 TTL 24 小时（Phase 0 按试用体验确认），每小时清理过期沙箱并告警清理失败；清理应幂等、分批、可重试且不得级联触及非 demo 数据。专用 demo 权限/速率限制/内容重置；在所有页面显著标注示例数据；禁止进入真实学校或通过 API 横向访问。

准出：并发会话互不可见；每个会话到期清理；默认硬上限为每 IP 每小时创建 5 个会话、每会话 200 条可写记录和 10 MB 附件、全站最多 500 个活跃沙箱。Phase 0 资源实测可将上限调低；调高须有容量证据、负责人记录并复核监控阈值。超限须由服务端拒绝并告警；跨租户越权测试成功读取/写入为零；外部邮件、消息、Drive OAuth 和付费模型调用均被服务端拒绝。
### Phase 5 — 报告、三语与站内沟通
定义周/月/年报告口径并复算；实现统一语言选择及 SSR 字典；站内通知、邮件发送日志和每周提醒计划。

准出：周/月/年每项汇总可由事件明细复算且差异为零；休假、豁免、无排课、停课与代课样本口径经学校负责人签核；`partially_returned` 周的已批准与退回 Slot 分别纳入相应计数；三语用户可见字符串缺键为零或明确标作未翻译。
### Phase 6 — Article、Drive、Bot 与渠道集成
独立 article 子域与教育内容治理；Google Drive 最小权限授权、浏览/预览/撤权；Telegram opt-in 绑定与解除；WhatsApp 做官方现行价格/地区条款核实后再选；DeepSeek Bot 仅在有经审核知识来源时回答，教学/账户/隐私/申诉问题转人工。

附件仅接收核准的 PDF/图片白名单，校验扩展名、MIME 与文件头魔数、大小及租户配额；拒绝加密/宏文档、压缩包及无法安全解析的文件。病毒扫描存在时先隔离扫描，通过后才可取用；若 Plesk 无本地扫描器，则采用不可执行的私有隔离存储、强制下载响应头和严格解析器/主动内容检测，扫描能力恢复前保持附件不可预览/转发，并记录风险接受责任。Mingguan 打印按实际节数和文本长度分页/续表，禁止缩小到不可读字号或丢弃反思内容。
准出：Drive 撤权/ACL 改变/文件删除呈现授权失效状态且不阻塞 RPH；Bot 敏感字段外发测试为零，人工升级路由可验证；通知均有可追踪发送/失败/退订状态；附件拒收/隔离路径按生产可用扫描能力验收。
### Phase 7 — 全站视觉打磨与性能/安全验收
以页面矩阵迭代 desktop/tablet/mobile；审查 SSR、性能、无障碍、SEO、备份恢复、日志监控、故障告警与部署回滚；移除已确认无用的旧视图、重复 locale/DSKP 实现、死代码和不再需要的依赖。

## 7. 安全、数据与运维验收门槛

1. 租户 A 的教师、Admin、导出、搜索、附件、ticket、队列均无法读取租户 B 数据；只信服务端租户上下文，不信请求传入的 `school_id`。下载使用短时效、单用途签名链接，并在签发和下载时分别验证用户、资源租户、权限及对象存储 key；队列任务执行时重新验证用户/租户/授权，不信任过期 payload。
2. 每个角色的路由、按钮、服务层写操作一致地校验；批量审核需明示全批原子或逐项结果语义、失败与重试处理，并防止重复/竞争提交；退回理由可追踪且保留批注历史。审计记录操作者、对象、决策与时间。
3. 身份证等敏感字段最小化收集、掩码/加密、受限访问与审计；演示数据不得复制生产个人资料。
4. 所有文件导出/Drive 链接过期、撤权、删除和越权访问有定义；支持文件上传安全扫描、大小类型限制、解压炸弹/恶意宏检测、随机化存储名、非公开存储和每校/每用户配额；扫描未完成或失败的文件禁止预览/下载/转发，并保留隔离与清理审计。
5. 数据库迁移可前进/回滚策略清楚；重要变更先备份并验证恢复；绝不把 `migrate:fresh` 或类似破坏命令用于生产。
6. 自动化测试需覆盖关键授权边界、字段保真、状态机、报告计算、接口失败、demo 隔离和外部服务降级；浏览器旅程覆盖三角色及三种视口。
7. 监控健康、队列失败、邮件送达、OAuth/Drive/Telegram API 错误；Secret 只在 Plesk/安全配置管理，日志脱敏。
8. DeepSeek 调用默认不得发送学生姓名、作业/评估内容、教师身份证/电话、学校私有文件或认证令牌；先做字段级脱敏与数据最小化。账号、账务、个人资料、法律/安全、投诉、低置信度或用户明确要求人工的工单必须转人工；机器人须标识身份、展示来源/置信度、留存最少必要的审计元数据，并允许关闭与升级。
9. Google Drive 文件授权过期、用户撤权、共享盘权限变更或文件删除，必须呈现明确的“授权已失效/需重新授权”状态；不得以后台异常代替状态处理。仅保存运行所需的最小文件元数据快照，不绕过原 ACL。
10. 所有平台操作员必须启用 MFA；平台与学校认证使用独立 Guard、host-only session cookie 与独立 CSRF，平台 cookie 不向 `.erphpro.com` 子域共享。平台主入口固定 `/owner`；学校子域访问平台路由拒绝。JIT 访问真实学校内容须目标学校 Admin 发起/批准或两名不同平台人员（含安全角色）审批，明确目的/数据 scope/操作，默认只读且最长 2 小时；Break-glass 仅限 P0/管理员不可联系，由双人核验，24 小时内独立复核。Owner 锁死恢复只允许经 SSH 执行的受审计 bootstrap 命令，禁止 Web/email-domain 提权。

## 8. 旧代码简化/删除准则

- 可删除：无入口/引用、无生产数据依赖、非部署脚本所需、无历史兼容用途且有明确验证证据的旧代码、重复样式或未使用依赖。
- 先迁移再删：仍被旧 React/Firebase 页面或历史数据使用，但目标 SSR 已承接并有字段/行为等价验收的模块。
- 保留：迁移/回滚/审计/历史参考所需脚本，或虽暂时未调用但承担安全/恢复职责的内容。未跟踪文件须先辨明来源和依赖；Owner 已明确要求清理的冗余副本按审查结果处置，不以临时副本取代正式文件。
- 删除批次需附：引用扫描、运行入口扫描、表/文件数据依赖、构建/自动化部署影响、删除前后对比与可恢复提交点。只在计划获批后执行。

## 9. 交付物与审查清单

1. AppSheet Admin/Guru/e-RPH 全菜单、表单、字段、条件与角色映射表。
2. 页面/路由/表/权限/集成现状与平台 Owner 控制台能力矩阵，逐项标注 `已实现 / 部分 / 缺失 / 未证实` 并引用证据。
3. 目标信息架构、数据模型、平台/学校角色矩阵、租户生命周期、集成数据流和威胁/失败分析。
4. 分阶段依赖计划、优先级、验收用例、回滚点及旧代码清理清单。
5. Gemini 第三方审查记录：每轮提示、评分、完整意见、采纳/拒绝理由、计划修订差异；每阶段满分后再进入下一阶段。

Gemini 评分维度（每项 0–10，共 11 项）：需求覆盖与可追溯性、AppSheet/RPH 保真、课程/教材数据治理与来源、租户/隐私安全、SSR/架构/部署可行性、交互/响应式/无障碍、通知/AI/外部集成边界、测试/回滚/运维、旧系统清理安全、Demo/运行隔离、阶段依赖与可验收性。只有 11 项均为 10、总评 10/10 且无阻断意见才达到目标；评分只记录 Gemini 实际给出的评语，不预写或伪造结果。Phase 0 事实在实施前确实尚不可得时，应评估计划是否明确负责人、只读获取方法、依赖阶段、替代证据和硬门禁；不得要求将其伪装为已取得，但也不得把证据尚未取得误作计划方案缺失。

## 10. 当前未证实事项（须在实施闸门前补齐）

- AppSheet e-RPH、Admin、Guru 每个链接实际打开后的完整字段、条件表达式、步骤与权限；当前只读取到目录菜单。
- 源 workbook/Google Sheet 的完整标签、列名、公式、枚举与引用关系，以及样本内容的授权/最新性；2026-11-22 已只读比对 `M41 1620112026`、KPM 2026 RPH 副本、KPM 2026 Maklumat 副本与 `Borang Penghantaran eRPH 2026` 的元数据，读取 KPM `DATA` 第 1 行字段表头及 KPM/M41 部分模板表头；两个 workbook 的 bounded validation 元数据仅记录规则/引用、不记录选项值。KPM 信息副本时区为 Asia/Hong_Kong，且“副本”与 Drive 修改日期不能证明权威/最新审批版本；完整公式、命名范围、表单条件/角色与版权仍未核实，详见 `docs/RPH_FORMAT_MAPPING.md`。
- Firebase 路径是否仍可运行、旧 React 页面是否还被外部用户访问，以及 Owner 控制台需要哪些平台操作员子角色/生命周期策略；当前已核验的平台后台范围缺口见 PLT-01 与 Phase 1。
- DSKP 各年级/学科/年份的真实数据覆盖率、出处许可、版本和更新责任人；Phase 0 只读观察到生产 `dskp_standards` 表有 46,967 行，但它不在当前 SSR migration 创建路径中，行数不能证明课程覆盖或版权合规，须先追踪数据来源/旧系统依赖及备份再规划导入或清理（详见 `docs/PLESK_SSR_DEPLOYMENT.md`）。
- 数据库/备份恢复、队列/定时任务执行、邮件送达与持续生产监控证据；当前已观察 Plesk PHP/document root、生产首页/health、main 自动部署配置，但发布 SHA 对应关系仍未闭环。
- Google Drive 的预期用例（备份、内容导入、资料展示或多者）、学校共享盘支持和授权边界；需结合现有 Google Workspace 登录权限设计。
- 公开试用的访问政策、重置频率/数据保留期限、是否无需登录，以及 demo 用户是否可提交审核。
- 三语内容由谁校对；课程标准的翻译是否只作辅助，不替换官方原文。
- WhatsApp Business API 的当前地区价格与政策、Telegram 绑定意愿与运营责任、DeepSeek 数据处理与预算。

## 11. Gemini 第 1 轮意见与第 2 版修订

Gemini 对上一版给出总评 **7.4/10**，未通过目标门槛。主要指出 RPH 马来西亚本地字段/代课归属不全、学校日历不能假设周一至周五、KP2027 与 KSSR Semakan 2017 并行治理缺失、公开 Demo 租户并发污染风险、报告分母与休假/代课统计口径不清、DeepSeek 敏感数据边界不足、Plesk 队列/定时任务/部署回滚及阶段验收缺少证据与量化标准。本版纳入下列硬要求；尚未取得的外部/生产证据仍作为 Phase 0 明确闸门，不伪称已核实。

### 11.1 RPH 与学校日历的本地保真

- 逐字段追踪并保留 AppSheet/官方表格中的 Tema、Kemahiran（按科目/语言技能分类）、Catatan/Sebab Tidak Dilaksanakan 等字段及其出现条件；条件字段不能因表单改版而丢失。
- 代课教案记录被代教师、代课教师、原任班级/科目/时段、关联原课表项、代课原因及教案作者；提交与报告能区分“岗位责任人”和“内容作者”，不重复计入同一授课责任。
- 支持学段字段差异，至少逐项比对 Tahun 1–6、Tingkatan 1–6、PraSekolah 与 KAFA 模板；跨周/补课/改期按学校日历和原课表关系保存，不以 ISO 周切换丢失关联。每周至少覆盖五个实际教学日，但日期由学校/州属日历、校历、年级课表和假期例外计算；支持 Group A Sunday–Thursday、Group B Monday–Friday、州假期/公共假期、校内活动日、停课日和补课日。须以学校配置生成教学周，禁止把固定 Mon–Fri 写死为全马来西亚规则。
- 每个字段形成“来源字段 → 显示条件 → 服务器验证 → 存储 → 编辑/打印/PDF → 报告”端到端映射；提交前缺项检查与服务端拒绝规则使用同一版本化字段策略。

### 11.2 课程版本、语言与官方资料

- 课程参考模型须支持 KP2027 与 KSSR Semakan 2017 在过渡期共存，并可按实施年份、年级、州/学校配置与学科选择适用版本；不能假定切换日后全库同时替换。至少分别验证 Year 1/Form 1 过渡样本与仍使用旧课程的年级。
- 保存官方原文、原始语言、原始来源文件/页码或定位、文件哈希、获取/核验日期、授权状态、版本/生效日期、适用年级/学科与导入批次。翻译仅作为可标记来源的辅助注释，不覆盖或冒充官方文本；SJKC/双语课程按官方实际媒介与学校选择呈现。
- RPH 一旦提交即冻结所引用的 DSKP 版本、SK/SP 原文快照（或经内容寻址验证的不可变快照）、源定位与哈希；批准后永久保留该快照。新课标导入生成新版本，不回写旧版或历史 RPH。
- 对“完整 DSKP/教材/练习库”的任何宣称，以逐年级×科目×版本的覆盖报表、权利状态、缺失清单、抽样人工核验和责任人签核为前置；未满足时标记部分覆盖，不能由空 schema 或演示数据推断已建成。

### 11.3 Demo 租户隔离与报告口径

- 公开 Demo 采用只读共享基线加独立、短期、可过期的会话沙箱；每条 demo 数据强制带 `demo_session_id`/`expires_at`，建议 TTL 24 小时、每小时 GC、幂等分批清理和失败告警；每次试用的数据变更仅在该沙箱可见，自动重置不影响其他用户。需要演示写流程时按 session 克隆或隔离事务，不开放共享可写 tenant。
- Demo 强制使用合成数据；所有沙箱实体标记 `demo_session_id` 和 `expires_at`，后台每小时 GC 只清理过期 demo 数据并记录数量/失败重试；关闭真实邮件、Telegram/WhatsApp、Drive OAuth、DeepSeek 生产密钥/计费调用和任何真实学校导出。所有外发适配器在环境层强制拒绝，而不只依赖前端隐藏按钮。
- 报告分母由学校日历、教师任职/课表生效区间、休假/缺勤授权、豁免日及提交责任共同计算。每个应交 Slot 仅允许一个主业务状态（9 项：`absent`、`approved_leave`、`not_assigned`、`school_holiday`、`cancelled_class`、`not_submitted`、`pending_review`、`returned`、`approved`）；准时/迟交（`on_time`/`late`）为独立提交时效字段；周级摘要另可为 `not_submitted`、`pending_review`、`partially_returned`、`returned`、`approved`。每个状态给出是否计入分母的政策与审计原因，并用原始事件复算周/月/年报告。
- 代课由责任教师与作者双维度呈现；原教师被批准休假且由代课教师完成任务时，报告不得将原教师误判为未交，也不得把一份代课教案重复算作双方各自完成。整周聚合若混有已通过/待审和退回课时，显示 `partially_returned`；仅退回节次可编辑/提醒，全部节次均退回才显示 `returned`；周报保留逐节原始状态，不以周状态覆盖明细。

### 11.4 Plesk/SSR 交付与可量化阶段门槛

- Phase 0 必须先实测 Exabytes/Plesk 的 PHP 版本、document root、SSR 入口、环境变量来源、MySQL/MariaDB 版本、Git main/自动拉取、部署钩子、队列 worker 生存方式、cron/scheduler 频率、文件权限、HTTPS、日志位置、备份/恢复及现存 503 根因；任何本地文档都不能代替生产观察证据。
- 在上述证据确认后才选部署方式：优先可回滚的 release 目录/原子切换；若主机限制不允许，则定义维护窗口、预检、迁移前备份、健康检查、回滚步骤和责任人。部署须检查 SSR 首页/登录/健康端点、DB、缓存、队列、静态资源与关键角色流程，不能只看 HTTP 200。
- 队列/定时任务先确认 Plesk 能力和实际 SLA，再设计：标准 Plesk 环境的基线方案为 MySQL database queue，由 Plesk Cron 每分钟触发 `php artisan queue:work --stop-when-empty --max-time=50`，使用 `withoutOverlapping`/原子锁避免并发消费者；须先验证当前 Laravel 版本、Cron 最短间隔、命令耗时和主机资源限制，若不适用则记录经验证的替代方案。任务失败可重试且幂等，执行时重新校验用户/租户/授权，过期任务安全终止；队列不可用时核心 RPH 保存/审核同步路径仍可工作，异步通知有可见失败队列。
- 阶段完成阈值建议：必需 RPH 字段与条件映射覆盖率 100%；关键表单端到端字段保真 100%；租户越权用例 0 成功；报告汇总与事件重算差异为 0；公开页面支持 390/768/1024/1440px 且无非预期横向溢出；三语可见字符串缺失 0（未翻译内容明确标注）；Demo 外部副作用成功数 0；关键浏览器旅程全部通过；备份恢复演练成功且记录 RPO/RTO。具体性能预算需先量测基线再由 Owner 定值，不能凭空承诺。
- 打印验收须同时覆盖 A4 纵向单节次详案与 A4 横向每周五日一览（Format Mingguan）：分页不切断字段标签与内容、不丢官方栏目、不包含交互控件，包含学校/教师/日期/版本等必要出处信息；PDF 与浏览器打印结果一致。

### 11.5 旧代码清理依赖顺序

在获准实施后，先保存基线 SHA、构建产物清单、路由/资源访问日志与数据库结构快照；再按依赖顺序执行：确认 Plesk 实际入口 → 盘点 SSR/Vite/Firebase 生产引用 → 将被用户访问的功能迁移并做行为/数据等价核验 → 从部署钩子和构建流程解除旧运行时依赖 → 逐批移除静态资产/死代码/依赖 → 清理冲突文档与过期配置 → 在隔离环境和候选发布验证 → 可回滚部署。每批都记录删除理由、引用证据、迁移对应项、构建与关键旅程结果、回滚提交。先检查 `composer.json`/lock、`package.json`/lock、Vite manifest 与 Plesk 部署脚本关系；不得因 SSR 目标就直接删除 Vite 或 Firebase 包，实际部署仍可能需要其构建产物。2026-11-21 Owner 明确授权清理的 5 个冗余 `* 2.*` 文件已核对并移除；后续对任何未跟踪用户文件仍须先辨明归属、引用与恢复点，按 Owner 指令处理。

## 12. 评分与阶段状态约束

Gemini 的每轮总分和分项评分应原样记录；只有 Gemini 明确写出总评 10/10、所有列明维度均为 10/10，并确认没有重大未解决意见，才可标记“第三方审查通过”。若其把缺证据、版权、法律或生产事实保留为条件，则继续收集可获得证据并修订；对只能在实施时或 Owner/供应商权限下取得的证据，不伪造为已闭合，而在计划中明确列出责任方、获取方式、阻断阶段、替代证据与放行记录模板。Gemini 不得把“计划尚未实施所以没有运行时证据”误判成计划遗漏；但任何线上安全事故（包括 503）必须在 Phase 0 作为最高优先级恢复和取证门禁。Gemini 的评分是独立评审输入，不替代 Owner 的最终架构/发布接受，也不授权部署。

## 13. 证据缺口关闭记录

本节记录的是当前未取得的外部/生产事实，不是本计划未定义交付方式。责任人为 Owner/获授权运维人员（Plesk）、AppSheet 数据所有者、课程/版权负责人；每项证据使用脱敏导出或只读观察，标注采集人、时间、来源和 SHA/版本。Phase 0 输出缺口清单、权限请求、证据模板和放行记录；无权限时以明确的阻塞项留档，不能伪造“已验证”。503 是 P0 现场恢复事件，需在任何新功能实施前先闭环。

| 缺口 | 当前状态 | 关闭证据/动作 | 依赖阶段 |
|---|---|---|---|
| AppSheet 各菜单表单及底层源表 | AppSheet 菜单已观察；2026-11-22 只读核对 4 份工作簿元数据、KPM `DATA` 原始字段头、部分日表/RPT 表头；M41 validation 样本151个 MENU/61个 DATA 规则；KPM 样本200个 MENU、五个工作日表各44个、92个 RPT、97个 DATA 规则（仅规则/引用，不含选项值）。发现 `KHAMIS!B31` 下拉引用 `ISNIN!AG`，同位置其他日表引用本表，待确认是否有意；完整表单/权限证据缺失，KPM 副本权威版本和来源权利未确认 | 逐菜单打开，记录字段/条件/权限；核验源 Sheet 全标签/列、公式、枚举及跨表引用；确认跨日引用和 KPM 主版本/权利；避免读取不必要的教师/学生个人记录 | Phase 0 |
| Plesk 当前生产 SSR/数据库/队列/Cron | 11/21 13:05–13:54 MYT 首页间歇 503、同期间 `/health` 多为 200；已通过 main commit `7fb43058…` 将 `DirectoryIndex index.php` 固定为 Laravel front controller，Plesk commit time 13:54:46、`ssr/public/.htaccess` 面板修改时间 13:55，之后首页及公开页面访问日志为 200 至 19:48，且 19:48 内部浏览器复查首页和 health 均成功。时间、源码修复、文件修改时间和访问日志强相关，P0 首页 503 事件视为已修复并观察到当日稳定；Plesk Git 没有提供 hook 成功/served-tree SHA 直接证据，health release `0973ac…` 与当前 main SHA 不一致的来源仍待闭合。2026-11-22 13:09 MYT 未认证外部 HTTP 探测中，首页与 `/health` 返回 200、DB/cache 为 ok；根域响应同时确认 `XSRF-TOKEN` 和 `erph-pro-session` 使用 `Domain=.erphpro.com`。这是单次公共入口观察，不证明持续可用或认证隔离。Scheduled Tasks 为空；外部 worker、队列、Cron、备份恢复未完成核验 | 保留脱敏故障及修复证据；后续通过发布构建元数据绑定 served SHA，分开闭合 OAuth callback 可靠性、队列/Cron 与恢复演练。不得因 health 200 推断所有路由可用；本次未再修改生产配置 | Phase 0 |
| KP2027/KSSR 适用矩阵及资料权利 | 规划要求已补，真实覆盖/许可待证 | 官方来源与年级学科版本矩阵、版权/许可清单、人工抽查 | Phase 0/3 |
| 平台级全站管理控制台 | 现有 Owner 只有只读学校概览、审计和工单；开户/平台 RBAC/全站运营控制缺失 | PLT-01 权限矩阵、Owner 无 school membership 登录、学校开户/管理员邀请、未分配访问引导、JIT 支持授权和全链路审计 | Phase 1，扩展跨 Phase |
| UI 全页和可访问性 | 设计令牌已定义，逐页设备核验未完成 | 每页状态/视口截图、对比度和键盘核验及 Taste/UIUX Max 审查项 | Phase 7 |
| 邮件/Drive/Telegram/DeepSeek 生产配置与隐私边界 | Plesk 邮箱清单已只读确认 `admin@erphpro.com`、`hello@erphpro.com`、`noreply@erphpro.com` 三个邮箱账号存在；SMTP/IMAP 收发、转发、发信身份、SPF/DKIM/DMARC 与应用邮件链路尚未验证；其他集成凭据/运营政策未核实 | 不显示或导出 secret；核验授权范围、数据流、邮箱/DNS 发信认证，并在隐私安全条件下做受控收发与人工接管 SLA 记录 | Phase 0/5/6 |


## 14. Gemini 第 2 轮意见与第 3 版修订

Gemini 第 2 轮总评 **8.8/10**。主要未通过项：主矩阵缺少具体需求 ID 且与 RPH 本地规则不一致；生产 503 未列为 Phase 0 P0；Tingkatan 1/跨周场景未进入主追踪；历史 RPH 未冻结 DSKP 快照；多校教师任期可见范围未定义；缺少单节/周总表两种打印版、周状态 `partially_returned` 聚合、Demo GC、恶意附件与配额约束。另指出 Phase 0 实证证据尚未取得。

本版逐项采纳：第 3 节加入 `RPH-01` 至 `INT-02` 的需求 ID 和字段矩阵；Phase 0 增加 P0 503 止血/根因取证门禁；RPH 扩展 Tingkatan/跨周与不可变课程快照要求；增加跨校兼职/转校历史可见边界、A4 纵向单节详案与横向 Mingguan 样张、`partially_returned` 周聚合、Demo 会话 TTL/每小时 GC、附件扫描/配额。实际 Plesk、源表和版权资料仍是实施前必须由有权限责任人取得的事实证据，不会写成已验证。


## 15. Owner 的逐阶段审查与 Plesk 验收要求

Owner 指定每个 Phase 完成后均须经过我方独立审查与 Gemini 复审；Gemini 未明确 10/10 或仍有重大意见时，修订并重新送审，不继续下一 Phase。其后将候选版本部署到 Plesk 的受控生产验证范围，在真实 PHP/DB/队列/代理栈做真实运行审查；默认以 Demo 租户和合成数据做生产 smoke，功能开关/隔离范围验证通过后才向真实学校开放。所有外发渠道、付费 AI、真实 Drive 写入和真实学校数据在验证期间保持禁用。若无独立 staging，Plesk 上的验证限于安全 smoke 与隔离 Demo，不在真实学校数据上做故障注入或破坏性操作。每个阶段记录 Gemini 评分/意见、提交 SHA、Plesk 部署版本、验收环境/租户、关键旅程结果、日志与副作用、回滚点及 Owner 放行。

Owner 同时授权：在 Codex 内部浏览器进入 Plesk 时，如登录页已由系统密码管理器自动填好账号与密码，可直接点击登录继续工作；不得读取、复制、输出或保存凭据。浏览器使用规则：**只使用 Codex 内部浏览器，不转用 Chrome 外部浏览器**。

## 16. Gemini 第 3、4、5 轮复审与第 5 版修订记录

Gemini 第 3 轮于 2026-11-21 在 Codex 内部浏览器完成，基于第 2 版附件和第 3 版 11 项修订摘要，因附件控件未能附上第 3 版全文，Gemini 明确将结论标作摘要审查而非全文审查。总分 **9.3/10**，未通过。11 个维度依序为：9.5、9.5、9.5、9.5、9.0、9.5、9.0、9.5、9.0、9.5、9.0。不得将该轮记作第 3 版全文已审或 10/10。

Gemini 提出的修订事项及本稿处理：

- 跨周顺延：只自动作用于未来空白周次；已有 draft 必须显示差异并由教师确认，不静默覆盖，保留假期豁免、原日期、Slot 来源与审计，重复生成幂等。
- 部分退回统计：以 Slot 为报告原子单位；已批准 Slot 立即计 `approved`，退回 Slot 计 `returned`，周聚合仅作 `partially_returned` 摘要；所有应审 Slot 通过后周聚合才是 `approved`。
- 附件安全：明确 PDF/图片白名单、魔数与 MIME 校验、拒绝压缩包/宏/加密文件、隔离扫描；无本地扫描器时附件留在不可执行私有隔离区、强制下载头并保持不可预览/转发，直到可安全处置。具体扫描器可用性仍 Phase 0 实测。
- 无 staging 的数据库变更：生产引擎/主版本一致的隔离快照库先验证正向 migration、数据兼容与恢复。只对已证明可逆的 migration 演练 rollback；不把 rollback 当普遍回滚承诺。生产前须确认加密备份可读、恢复路径已知，并采用 expand/observe/contract 分离策略。
- 其他需在后续正文全文审查时核实：课程勘误对 draft/已提交内容的刷新策略、同一教师多校并行会话的租户/CSRF 隔离、Mingguan 超长内容分页、匿名 Demo 限流/行数/存储上限、`OPS-*` 双向追踪、Tingkatan 1 字段差异。当前已在架构/准出正文补充对应策略，但仍需 Gemini 对全文核验一致性和可执行性。按用户保护要求，未跟踪 `* 2.*` 文件未经明确授权不移动或改名；不采纳自动归档建议。

第 3 轮提出报告状态口径和 Demo 限流仍需全文核验。本轮全文复审进一步发现历史修订记录曾把 `late` 错列为主状态、并把周级 `partially_returned` 混入 Slot 状态；本版已统一为 9 个 Slot 主状态、独立 `on_time`/`late` 时效维度及 5 个周级摘要状态。Mingguan 分页和 OPS 双向追踪规则见第 3、6、11 节。Demo 默认上限见第 5 版的 Phase 3 准出（当前已调整为 Phase 4），Phase 0 只允许基于容量证据下调；调高需书面记录。

Phase 0 证据责任矩阵：Plesk 故障/运行栈由获授权运维者提供内部控制台只读观察与脱敏时间戳证据；AppSheet 与 Sheet 字段公式由数据所有者在已授权页面逐项观察/导出；代码路由/依赖由 Codex 在当前 checkout 生成只读清单；课程覆盖/版权由课程负责人提供来源许可和覆盖核验；外部服务数据流与凭据键清单由 Owner/运维者在 Plesk 只读盘点（不读取 secret 值）。若获取失败，记录责任人、请求时间、阻塞阶段和缺项；对应功能不得进入依赖实施或开放。运行事实留在阶段证据包，计划文件只记录方法和状态，不冒充已完成。

### 第 4 轮全文审查（2026-11-21）

Gemini 在 Codex 内部浏览器收到本计划第 4 版完整正文（分 4 条消息），逐节复审后给出 **9.7/10，未通过**。两项重大意见：第 3/11.3 节曾将周级 `partially_returned` 错列为 Slot 状态，且第 16 节曾把 `late` 错列为第 11 个主状态；本版拆分为 9 个 Slot 状态、独立 `on_time`/`late` 时效维度与 5 个周级汇总状态。两项非重大建议：为 Plesk Cron 明确可验证的 database queue 基线消费者；为 Demo 写入给出默认资源硬上限。上述内容均已合并。Gemini 第 4 轮分项评分为：需求覆盖 10、AppSheet/RPH 10、课程数据 10、租户安全 10、SSR/部署 9.5、UX/无障碍 10、通知/AI 10、测试运维 10、旧系统清理 10、Demo 隔离 9.5、阶段依赖 9。

### 第 5 轮完整计划终审（2026-11-21）

Gemini 在 Codex 内部浏览器基于此前已完整审阅的第 4 版全文及第 5 版全部变更，重新核对合并后的完整计划，明确给出 **10.0/10.0**，11 个维度全部 **10/10**，重大/阻断性遗留意见 **0 项**，无新增阻断或缺陷。其核验确认 Slot/周汇总状态层级一致、Plesk 每分钟 Cron 与 50 秒 worker/原子锁基线有 Phase 0 适配门禁、Demo 上限有硬性服务端拒绝与容量调高审批门禁，且 Phase 0 的线上 503 恢复与只读取证列为 P0。终审维度依序为：需求追踪 10、AppSheet/RPH 10、课程数据治理 10、租户/隐私安全 10、SSR/部署 10、UX/响应式/无障碍 10、通知/AI/集成 10、测试/回滚/运维 10、旧系统清理安全 10、Demo 隔离 10、阶段依赖/验收 10。计划审查目标达成；这不代表计划已实施、生产 503 已恢复或 Owner 已批准部署。

## 17. 跨文档架构与治理审查补充（2026-11-21）

本节纳入用户提交的全套架构文档交叉审查报告。报告将 7 个文件按最后两份研究文档合并为一组，故称“6 份核心文档”。其结论为：主计划第 5 版 10.0/10.0（延续第 5 轮 Gemini 全文终审）；文档体系整体协调度 9.8/10.0；没有方向性冲突，留下 2 项非阻断的跨文档表述对齐建议。报告在提交时记录的生产健康端点曾返回 React/Firebase HTML；本轮内部浏览器现在观察到 SSR 首页和健康 JSON，因此部署文档已更新为当前观测并保留版本对应关系待核验。报告附带的 Phase 0 执行清单仍受第 6、15 节实施授权与安全闸门约束。

审查覆盖：`ERPH_COMPREHENSIVE_ARCHITECTURE_PLAN_3.md`（对应本计划第 5 版）、`FIREBASE_BRIDGE_PLAN.md`、`PLESK_SSR_DEPLOYMENT.md`、`RPH_FORMAT_MAPPING.md`、`FUTURE_PRODUCT_ROADMAP_D2-D9.md`、`STUDENT_AFFAIRS_RESEARCH.md`、`TIMETABLE_RESEARCH_MY.md`。报告确认的共同基线包括 Laravel SSR + MySQL/MariaDB 单一生产写路径、Firebase 桥接退出、马来西亚本地 RPH/校历/排课规则、Development 1 与 D2–D9 的范围隔离，以及高敏感资料分权与脱敏。各研究文档中的字段、生产和覆盖声明仍按第 10 节列为实施前需取证项目，不因交叉审查而自动成为现场验证事实。

两项非阻断表述对齐建议已修订对应文档：

1. `docs/PLESK_SSR_DEPLOYMENT.md` 首次切换顺序现说明：若 Plesk 套餐无法提供独立 preview host/database，则依主计划第 6/15 节使用受控路由/功能开关和隔离 Demo 做无破坏验证；旧根路径仅在仍可用且安全时保留至切换门禁满足，不以此掩盖或延迟现有线上故障恢复。
2. `docs/FUTURE_PRODUCT_ROADMAP_D2-D9.md` 现说明未来模块继承 Development 1 的简体中文、Bahasa Melayu、English 三语界面架构，新增模块也提供三语标签。

交叉审查还确认 Firebase 退出契约与主计划方向一致。主计划早先关于 Firebase 文档“仍存在迁移目标矛盾”的描述已更正：退出契约中的迁移图明确标注为被否决方案；Phase 0 核验运行时代码/构建残留即可。其余逐文档发现、状态声明及行动建议以用户提交的审查报告为依据；生产 503 修复、OAuth、数据库/队列实测、AppSheet 完整表单取证及发布并未因此完成或获授权。

## 18. 平台级全站后台缺口与第 6 版修订（2026-11-21）

用户指出登录/管理界面仅提示无 school assignment，担忧当前产品缺少全站 Admin。静态核对 `ssr/routes/web.php`、`OwnerController`、`owner/dashboard.blade.php` 和 Owner 登录页确认：平台 Owner 登录入口独立存在；`/owner` 只显示只读学校清单，`/owner/audit` 提供审计列表，`/owner/support/*` 管理工单；页面文案称可查看平台健康，但此页未见相应健康/运营控制。当前没有平台级学校开户/生命周期、操作员邀请与 RBAC、全局账户分配、集成/内容/课程管理或运行面板。学校 Admin 则是带 school middleware、仅本校范围的另一个后台。

身份语义：平台 Owner 本来不属于某个 school membership，不能要求其先 assign school 才能登录平台后台；Owner 应通过受保护的 `/owner/login` 进入全站控制台。普通教师/学校管理员应从所属学校子域登录；无有效 school membership 时显示明确的待邀请/联系学校管理员说明，不提供任何平台后台入口。现有 `services.google.owner_email` 单邮箱配置是当前限制；新方案要求受控 bootstrap 后通过数据库角色/RBAC 管理平台操作员，禁止自助提权和邮箱域名隐式赋权。

由于上述平台控制台没有被第 5 版完整定义，开发按用户指令暂缓；第 6 版新增 `PLT-01` 后再次送 Gemini。依据第 6 版审查，现形成第 7 版，补齐 JIT 学校侧/平台安全双重授权、强制 MFA、Guard/session/CSRF 隔离、SSH Owner 恢复、主域 `/owner` 路由及渐进模块解锁。第 5 版评分仅适用于原范围。第 7 版已在内部 Gemini 达到 10/10 后解除计划审查门禁；恢复 Phase 0 后续只读取证和 P0 503 闭环。

Phase 0 P0 生产故障处理（2026-11-21，Codex 内部浏览器）：Plesk 日志在 2026-11-20 22:03:26–22:03:48 记录多次 `GET /` 返回 503；LiteSpeed 对应用 Unix socket 出现 `Connection reset by peer`、`Connection refused`、`No such file or directory`，随后 `Max retries has been reached, 503`。Node.js 扩展显示 `/erphpro.com/ssr` 被误识别为 `Static (Vite)`、状态 `Idle / No process is running`，配置启动文件 `/ssr/app.js` 不存在。仓库实际 `ssr/package.json` 只有 Vite `build`/`dev` 脚本，生产应用为 Laravel/PHP SSR；因此已在 Plesk 可逆地停用错误 Node.js 托管入口（配置/文件保留、未删除）。停用后通过内部浏览器重新加载 `https://erphpro.com/`，确认返回 Laravel SSR 官网；重新加载 `/health` 确认 `status=ok`、`database=ok`、`cache=ok`、release `0973ac7474e915ed6cd9027829c47f547daad043`。这是根因对应修复与即时生产 smoke 通过；持续稳定性仍需观察，未宣称长期恢复门禁完成。

同日只读取证：Plesk 将 erphpro.com 标为 Active，document root `/home/w4chinese.com/erphpro.com/ssr/public`，PHP 8.3.37 FastCGI；Git 页面显示 `eRPH-PRO.git` 跟踪 `main`、自动部署到 `/erphpro.com`。Plesk 域名概览显示 last commit `f84cb98`，而 health release 为 `0973ac…`；SHA 与实际发布产物的映射仍待核实。此次修复未触发 Pull/Deploy、未改数据库/域名/邮件/OAuth 设置、未访问生产个人资料。


## 19. Gemini 第 6 版完整审查与第 7 版修订（2026-11-21）

Gemini 在 Codex 内部浏览器收到本计划后给出总评 **9.6/10，不通过**；11 项中未达到满分的方面包括需求追踪 9.5、租户/身份/隐私安全 9.0、SSR/部署可行性 9.5、测试/回滚/运维 9.5、阶段依赖/可验收性 9.5；其它维度按 Gemini 原答复记录（AppSheet/RPH 10、课程数据 10、UX/无障碍 10、通知/AI/集成 10、旧系统清理 10、Demo 隔离 10）。两项重大阻断为：(1) JIT 只读租户访问可由单一平台人员自行开启，缺少学校 Admin 同意/平台安全双人审批、紧急破窗范围与时限；(2) 未定义强制 MFA、平台与学校 Guard/session/CSRF 隔离及唯一 Owner/OAuth 锁死的应急恢复。两项优化建议为：固定平台控制台域名/路由并规范章节编号；附平台控制台模块跨阶段渐进解锁矩阵。

第 7 版已采纳阻断与建议：固定 `https://erphpro.com/owner`，学校子域拒绝平台路由；平台 MFA、独立 Guard、host-only/path-scoped session cookie 和 CSRF；JIT 学校侧授权或两人（含安全角色）审批、只读最大 2 小时、到期切断；P0/管理员失联 Break-glass 双人核验、24 小时独立复核；SSH-only Owner bootstrap 灾难恢复并记录受保护的追加式审计；Phase 1 的六个可用控制模块和 Phase 3/4/5/6 的渐进解锁表。

Gemini 提及第 14、17 节重号，核对源计划发现源文档编号本身连续且唯一；重号来自本轮向 Gemini 分段粘贴时，第 3 与第 4 段交界处重复发送了部分第 14–18 节。第 7 版源文件保留单份章节，不为传输重复而改动源章节编号。重新审查时应基于下方单份完整正文或仅发送本轮修改的第 4、6、7 节及第 18–19 节，并明确上述传输重复已纠正。

Gemini 第 7 版复审：内部浏览器将第 6 版完整计划作为基线，并以本节提交的第 7 版修订章节替换对应范围，明确给出 **通过，10.0/10.0，11 个维度全部 10.0/10，重大遗留 0，非重大遗留 0**。11 项依序评分：需求覆盖与可追溯性 10；AppSheet/RPH 10；课程/教材治理 10；租户/身份/隐私 10；SSR/架构/部署 10；交互/响应式/无障碍 10；通知/AI/外部集成 10；测试/回滚/运维 10；旧系统清理 10；Demo/运行隔离 10；阶段依赖/可验收性 10。Gemini 明确确认两个安全阻断、两个优化建议均闭合，并签注可恢复 Phase 0。该分数只放行计划进入实施，不替代各 Phase 审查、生产验收及 Owner 发布授权。

## 20. Phase 0 P0 修复独立复审（2026-11-21）

在 Codex 内部浏览器向 Gemini 提交了 P0 线上 503 故障的根因证据、最小可逆修复和修复后首页/`/health` 即时 smoke。Gemini 对该 P0 子任务明确判定 **PASS，10.0/10.0（适用维度全 10，重大遗留 0、非重大遗留 0）**；对不属于本次 P0 范围的其余维度标记 N/A，不推定通过。其复核确认错误的 Plesk Node.js `Static (Vite)` 上游挂载及不存在的 `/ssr/app.js` 足以解释 LiteSpeed socket 503；停用该托管入口符合 Laravel/PHP SSR 架构、最小化且可逆，修复后即时首页与健康检查成立。

该结果只关闭 P0 故障修复子任务，不代表 Phase 0 整体通过。Gemini 明确要求继续核实：Plesk Git `f84cb98…` 与 health release `0973ac…` 的版本映射及自动部署稳定性；数据库、队列、Cron、备份可读性和恢复证据；AppSheet 三模块及源 Sheet 全字段/条件/公式；KP2027 与 KSSR 数据来源/版权；代码路由、依赖和外发配置键名盘点；持续观察 503 不复发及 `/owner/login` 可达性。上述证据完成后须再提交 Phase 0 整体审查；此前不得进入 Phase 1。

后续只读取证补充（2026-11-21，Plesk 内部浏览器）：Plesk Git 页面仍显示跟踪 `main`、自动部署到 `/erphpro.com`，最新 commit message 为 `fix google oauth callback provisioning`（本地 `main` HEAD 为 `f84cb98…`）；未按下 Pull/Deploy。刷新 `/health` 仍为 `status/database/cache=ok`、release `0973ac…`，故 SHA 与 served artifact 的映射仍未闭环。Plesk Scheduled Tasks 当前列表显示 `No items`，无法据此确认 Laravel 队列消费者/Cron 已配置。订阅级 Backup Manager 显示 3 个备份共 10.3 GB，最新为 2026-11-21 00:24、5.67 GB；旧版备份页的 minor-issues 提示对应 11 月 13 日记录，不应归到最新快照。只观察到备份条目，不代表 eRPH 数据库单独备份可读、恢复成功或 RPO/RTO 达标；恢复演练未执行。Plesk Databases 列出 `erphpro` 并关联 erphpro.com；当时尚未打开 Web Admin；后续只读取证已确认数据库引擎为 MariaDB 10.5.26，队列配置和备份恢复仍未核实。


版本标识诊断补充：`/health` 的 `release` 来源是 Laravel `config('app.release_version')`，由 `RELEASE_VERSION` 环境配置提供；当前 `scripts/deploy-ssr.sh` 没有从 Git 自动写入该值。因此 `f84cb98…` 与 `0973ac…` 不一致尚不能证明线上代码 checkout 落后，也可能只是固定 release 环境标签未更新。需从不暴露环境 secret 的部署元数据/脱敏日志确认线上代码 SHA，并在后续阶段让 release 元数据由不可变发布 SHA 生成，再以同一 SHA 验收；当前版本对应关系仍列为未闭合。

代码基线盘点补充（本地 `f84cb98…`，2026-11-21）：`php artisan route:list --except-vendor` 成功列出 48 条 SSR routes。平台 Owner 相关只有登录/Google 入口、dashboard、audit、support index/detail/update/reply；学校 Admin 是单独 `admin/*` 路由组。已再次验证生产 `/owner/login` 返回平台专用登录页，但没有登录或发起 OAuth。静态扫描发现 Owner 后台缺口与计划一致：没有平台学校生命周期、平台操作员/RBAC、账户分配、全局课程/内容和完整运营模块。平台身份环境配置键仅盘点键名，不读取值；生产 Owner 登录成功与 MFA 状态仍待授权验收。`composer.json` 生产依赖包括 Laravel 12、Socialite、Google API Client；`package.json` 仅有 Vite/Tailwind/Axios 等构建依赖，未发现前端运行时必须托管 Node 服务的依据。代码引用到的外部集成配置键包含 Google OAuth、邮件供应商、DeepSeek、支持 AI 开关、平台 Owner 和数据库/缓存/队列/会话设置；只记录键名，不读取任何 `.env` secret。全路由、授权策略、DB 字段与 view 的双向追踪表尚未完成，不能据此宣布 Phase 0 准出。

2026-11-21 本地只读复核增量（工作树 `f84cb98…`，Laravel 根目录 `ssr/`）：从仓库根误运行 `php artisan` 得到 `Could not open input file: artisan`；在正确的 `ssr/` 目录执行 `php artisan route:list --except-vendor --json` 成功，得到 48 条路由。核对 `routes/web.php`、`bootstrap/app.php`、`OwnerController`、`RequirePlatformOwner` 与 `ResolveSchool`：学校 Admin 的 `/admin/*` 路由在 `school`、身份、membership、权限中间件内；`/owner`、`/owner/audit`、`/owner/support/*` 只有 `auth` 与 `platform.owner`，目前未按计划绑定 `erphpro.com` 主机，Owner 登录与 Google redirect 也未按 host 约束。`RequirePlatformOwner` 只检查 `platform_role === owner`；`OwnerController` 直接展示全量学校及成员数。`GoogleAuthController` 将 Owner 登录标志写进普通 Web session，登录后使用同一默认 `Auth` guard；`config/session.php` 的 cookie domain/path 由 `SESSION_DOMAIN`/`SESSION_PATH` 控制，其中 domain 配置未知，若设为 `.erphpro.com` 则浏览器会向学校子域发送同一 session cookie。计划要求 Owner 与学校 Guard/session cookie/CSRF 隔离，因此需在 Phase 1 实现独立会话边界；仅凭当前代码不能断言生产 cookie 实际配置或存在可利用的跨域登录。现有 Feature 测试覆盖 base-domain Owner 登录入口、配置 Owner 邮箱后 OAuth callback 建立 Owner、按角色访问 `/owner`；未见学校子域访问平台路由、Owner 登录会话与学校登录会话隔离或 CSRF 跨宿主测试。由此确认 Phase 1 必须实施主域 host 固定、学校子域拒绝、Owner/学校 session 与 CSRF 隔离，以及完整平台 RBAC；当前记录是代码差距，不代表已验证可从生产学校子域利用，也不在 Phase 0 直接改路由。迁移目录当前有 13 个文件（users/cache/jobs、schools/memberships、教师/RPH/submission/settings/timetable、platform_role、Google identities、support）；未发现 `app/Policies` 目录，授权主要通过路由中间件，须在需求追踪表逐项验证资源级租户过滤。对 `app/`、`bootstrap/`、`config/`、`database/`、`public/`、`resources/`、`routes/` 与 Composer/npm manifest 的 Firebase 活跃引用扫描无匹配；这仅覆盖上述路径，不证明根目录历史文件、构建产物或服务器环境没有残留。该增量使用的命令与文件应纳入 Phase 0 证据包；需求—route/controller/service/model/migration/view/policy—验收双向矩阵、全仓库 Firebase/出站引用检查仍未完成。

日志观察补充：刷新后的 Plesk Log Browser 仍列出 1,002 条记录、最晚时间 `2026-11-20 22:03:49`，即 Node.js 停用之前的故障窗口；没有修复后日志条目，无法从该视图证明当前持续无 503。须确认日志轮转/数据新鲜度和采集范围，并在后续观察窗口记录修复后的成功与错误请求。

RPH 源样本对照补充（2026-11-21，内部浏览器只读）：重新检查 view-only `01. e-RPH TING6 17/10/2026`，确认 `MENU`、AHAD 至 KHAMIS 五个日页、`RPT`、`DSKP`、`DATA` 共九个可见 tabs；AHAD 模板呈现按班级重复的每日表单，含学期、参考教材、CONTENT 多栏、标题/副标题、学习成果、目标、活动/主要活动/收尾活动、反思和 Intervention。与 `ssr/app/Http/Controllers/LessonPlanController.php` 及 create/edit views 比对，当前没有独立输入/校验这些字段的完整路径；JSON version 存储不等于格式保真。详见 `docs/RPH_FORMAT_MAPPING.md`。这是单一 Tingkatan 6 样本的字段差距证据，不替代其它模板、公式/验证规则、AppSheet 实际表单与隐藏条件审计；Phase 0 的 AppSheet/Sheet 全量追踪仍未完成，Phase 2 不得以当前实现宣称字段覆盖完整。

AppSheet 菜单只读取证增量（2026-11-21）：顶层菜单明确有 e-RPH、MODUL ADMIN、MODUL GURU 三个分区；e-RPH 子项列出 Tingkatan 6、Tingkatan 1–6、Tahun 1–6、PraSekolah、KAFA 及 Maklumat/AI 指引；Admin 菜单展示提交审核、班级归档、Google Classroom 管理、提交排程、审核/打印、教师转校和 JPN/PPD 审查；Guru 菜单展示资料提交、日常与代课 RPH 准备/撰写及指引。多个菜单动作只是标为 `Open Url`，不得当成已核实的结构化数据写入。实际 linked forms、表达式/公式、字段必填和角色控制仍未逐项检查，逐条核对方法见 `docs/RPH_FORMAT_MAPPING.md`；AppSheet 证据门禁保持打开。

课程底表样本对照（2026-11-21，view-only Google Sheet）：`RPT` 显示科目、班级、Tingkatan、周次、日期起止、SK 与 SP；`DSKP` 的筛选区域为 A1:Q10379，17 列，原始标题含 `SUBJEK`、`TINGKATAN`、`TEMA/BIDANG/TERAS`、`TAJUK/KEMAHIRAN/NILAITERAS`、`SK`、`SP`、`TSIVIK`、`OB`、`Pengetahuan`、`Sosioemosi`、`Tindakan` 等，并含缩写/重复标题与一个可视空列。样本有可见课程行，但 10,379 行是表格区域边界，不是有效课程数或覆盖率；字段解释、去重、数据质量、许可和跨年级/科目覆盖都未验证。保存原始列头及完整来源/版本/权利清单后，才可设计标准化课程 schema。详见 `docs/RPH_FORMAT_MAPPING.md`。

同一只读样本的 `DATA` 标签显示 1,001 行、89 列，表头将 `KELAS`、`MASA`、日期跨度、`MINGGU` 与重复 `M.SIVIK` 周主题列分组；日期与主题区含合并表头。该观察支持继续取证其课表/周次/假期/公民主题关系，但不证明列间公式、条件或日页自动填充规则已还原；字段和依赖仍须从源 Sheet 逐项复核。

生产入口复核（2026-11-21，内部浏览器只读）：`https://erphpro.com/` 正常呈现 Laravel SSR 官网首页；`/owner/login` 正常呈现专用平台 Owner 登录页面，未发起 OAuth；`/health` 再次返回 `status=ok`、`database=ok`、`cache=ok`，release 标签仍为 `0973ac7474e915ed6cd9027829c47f547daad043`。这是当前时点的成功响应，不能代替持续观察，也未解决该 release 标签与 Plesk `main` 部署 SHA 的映射问题。

AppSheet 管理流程取证增量（2026-11-21，内部浏览器只读）：已进入 `MODUL ADMIN` 实际菜单，确认范围包括 Google Classroom 课程/Topic/Assignment 管理、按周设置提交窗口、审查/打印提交记录、班级归档、教师转校/离职及 JPN/PPD 检查。已读取周提交排程说明：按周次任务设置适用班级、开放和截止时间、提交 Topic，并可复制规则到多个班级。这证明管理流程与 Classroom 的班级/任务配置有关，但菜单目标大多是 `Open Url`；真实表单、数据源、公式、权限条件、覆盖/补交流程尚未验证。详见 `docs/RPH_FORMAT_MAPPING.md`，Phase 0 源系统映射门禁仍未关闭。

AppSheet 教师转校与归档证据增量（2026-11-21，内部浏览器只读）：只读查看 `4.1 Modul Guru-Berpindah, Bertukar Classroom, Bersara dan lain-lain` 说明。材料指引转校教师先在 Google Drive 的 Classroom 文件夹下建立个人 e-RPH 文件夹，将旧校 e-RPH 资料移入；随后由新校管理员邀请其加入新校 Classroom，并从后续周次继续提交。旧校管理员移除教师前，材料要求先确认资料已迁移，并建议记录至少保留至该学年结束；材料同时警示移除账号会删除该教师记录的可见呈现。该流程是培训文档的操作指引，不证明现有 AppSheet/Google Classroom 的实际保留策略，也不应直接复制为 SSR 删除行为。SSR 生命周期必须把教师身份与学校任职/学期分离：转校时结束旧校 membership、保留旧校提交及审核历史的归属和审计，再独立授予新校 membership；归档采用可恢复的状态转换、保留策略和明确数据导出/授权，不因移除成员而级联删除历史记录。菜单中的“ARKIB BILIK DARJAH”目标打开后返回 Google Docs `Access denied`，故班级归档步骤、字段与保留期限仍属未取证项，不作推断；需通过有权限的只读源材料或 AppSheet 表单取证补齐。以上新增要求已并入 ADM-01、TEN-01 与数据保留/迁移验收追踪；Phase 0 源证据门禁仍未关闭。

AppSheet Guru 实际菜单与受限流程链接核对（2026-11-21，内部浏览器只读）：从顶层 `MENU` 打开 `MODUL GURU`，确认共有 `PENGHANTARAN e-RPH`、`PENGHANTARAN MAKLUMAT e-RPH`、`PENYEDIAAN e-RPH`、`PENULISAN RANCANGAN PENGAJARAN HARIAN`、`PENULISAN RANCANGAN PENGAJARAN HARIAN UNTUK HARI GANTIAN` 五项核心任务，以及 Guru-as-Students 教程。逐一打开提交、资料提交、准备、日常 RPH 撰写和代课 RPH 撰写对应链接，目标均为 Google Docs，当前已登录账号均显示 `You need access`；未点击 Request access，也未切换账号。因此本次直接证实的是菜单名称/跳转目标及权限阻断，不是表单字段、条件、自动公式、提交格式或代课数据语义。Phase 0 必须取得这些源文件的只读授权，或由资料所有者提供等价的只读导出；在此之前这些 Guru 流程的条件映射保留为未验证，不能以 workbook 的 TING6 单一样本代替，也不得推断代课归属字段。

队列/调度基线增量（2026-11-21，本地 SSR 源码只读 + Plesk 内部浏览器只读）：源码默认队列是 `database`，示例环境亦如此，但生产实际 `.env` 未读取。当前 SSR 无 `ShouldQueue` 任务、排队 dispatch 或业务 scheduler 注册；`routes/console.php` 只有 Laravel 样例 `inspire` 命令，`queue:listen` 仅出现在本地开发 Composer 脚本。支持工单邮件当前通过控制器内 `Mail::raw` 同步发送。Plesk Scheduled Tasks 页面观察为 `No items`。此证据表明当前审阅范围内未发现生产队列/调度消费配置，也未发现现有应用队列负载；不能排除面板外 worker，也不能推断部署环境变量。未来启用邮件提醒、AI 或异步导出前，必须有经核验的 worker、失败告警、重试与 scheduler 运维契约。详见 `docs/PLESK_SSR_DEPLOYMENT.md`。

Plesk 日志新鲜度复核（2026-11-21 18:49 MYT，内部浏览器）：手动刷新 Log Browser 后仍显示同一批 1,002 条日志，最新时间为 2026-11-20 22:03:49；尾部仍是修复前 LiteSpeed socket 错误与 503。日志页没有提供修复后的请求证据。同期独立浏览器请求官网首页及 `/health` 成功，因此这是日志采集/轮转可观测性缺口，不能据此判断当前站点正在失败，也不能把无新日志当作干净稳定观察窗口。Phase 0 需查明日志源与轮转配置，并取得修复后带时间戳的请求/错误指标证据。

RPT 直接结构核对增量（2026-11-21，内部浏览器只读）：实际打开 `01. e-RPH TING6 17/10/2026` 的 `RPT` 标签，页面包含学科/学校/学年上下文、每周周次、起止日期、`STANDARD KANDUNGAN` 内容区及每周多行合并布局；Google Sheets 对该表报出显示范围 2,967 行、74 列（不是有效业务行数）。该证据补充了周报告必须保留的周次与日期区间语义；隐藏字段、公式、验证及打印分页仍待审计。个人识别图像和姓名未进入需求资料。详见 `docs/RPH_FORMAT_MAPPING.md`。

RPT 日期公式抽样（2026-11-21，内部浏览器只读）：`RPT` 页的周起始日期输入区为合并单元格 `B10:B12`，单元格注释要求仅在该处填写日期；结束日期合并单元格 `C10:C12` 直接使用 `=B10+4`。该样本表达周一至周五日期区间，结束日由起始日计算。该公式不能直接套用于马来西亚 Group A（日历周日–周四）学校；SSR 日期生成必须服从学校周组别、假期与有效教学日。其余周次、假期和跨年度边界公式仍待抽样验证。详见 `docs/RPH_FORMAT_MAPPING.md`。

RPT 连续周日期递推抽样（2026-11-21）：第二个周起始日期合并区 `B13:B15` 的公式为 `=C10+3`，即前周五加 3 天得到下周一；配合前述周结束日 `=B10+4`，样本将普通周一至周五工作周连续递推。该模板公式本身未显示假期或 Group A（日历周日–周四）适配；需在 SSR 里改用学校日历/工作日逻辑并完成来源条件核验，不可直接复刻固定偏移量。详见 `docs/RPH_FORMAT_MAPPING.md`。

生产课程表结构只读取证（2026-11-21 18:51 MYT，Plesk phpMyAdmin）：`dskp_standards` 有 46,967 条（Browse 计数），结构含 `id varchar(50)` 主键及学校类型、科目、年级、内容/学习标准、主题/技能/标题等 9 个 nullable text 字段；除主键外无二级索引。表元数据创建于 2026-01-07，最后更新 2026-11-21 18:51。浏览首屏曾渲染少量课程内容，项目文档未复制任何行值。它不在当前迁移中且 SSR 无引用；当前 `curriculum_items` 则由迁移建成，含 school_id 和 subject/year 查询索引，但 `CurriculumItem` 模型在 app 中没有调用点。故当前 DSKP 行数不代表系统可调用数据，两个表均未证明可供 RPH 使用。导入/清理前必须确认来源、授权、版本覆盖与旧系统依赖，并在隔离副本完成全量映射与索引设计。详见 `docs/PLESK_SSR_DEPLOYMENT.md`。

生产 `curriculum_items` 结构对照（2026-11-21 18:52 MYT，phpMyAdmin Structure 只读）：表具备 SSR migration 设计的 school_id、subject/year_level、title/content/metadata/is_active 字段及学校+科目+年级复合索引、is_active 索引；表创建于当日 13:01，phpMyAdmin 显示 16 KiB 数据区/48 KiB 索引区。未查询行数或行内容，因此不能据此认定课程数据已导入；该模型当前也未被业务路由调用。当前生产结构与目标 schema 对齐仅是结构证据，课程覆盖、权利与 RPH 实际可调用旅程仍未验证。详见 `docs/PLESK_SSR_DEPLOYMENT.md`。

AppSheet e-RPH 模板入口增量（2026-11-21，内部浏览器只读）：菜单列出 Tingkatan 6、Tingkatan 1–6、Tahun 1–6、PraSekolah、KAFA 五类模板及 e-RPH 信息、Gemini AI 指引和用户指南。打开 Tingkatan 1–6 入口落到 Google Sheets “Make a copy” 页面，并提示复制时会同时复制附加 Apps Script；未执行该云端写操作，故完整模板字段/公式保持未验证。“Siap”菜单标识不代表 SSR 实施完成。当前 Tingkatan 6 单本样本不能证明其它模板等价。详见 `docs/RPH_FORMAT_MAPPING.md`。

RPH 源工作簿入口追加核对（2026-11-21，内部浏览器只读）：从 AppSheet 分别打开 Tingkatan 6 与 Tingkatan 1–6 的模板链接，两者都进入 Google Sheets 的“创建副本”确认页，并提示一并复制附加 Apps Script。未执行创建副本操作；因此菜单对应工作簿的完整字段、公式、验证与脚本行为仍未取证。已查看的 TING6 工作簿预览仍仅支持有限的可见字段/公式样本。详见 `docs/RPH_FORMAT_MAPPING.md`。

AppSheet 审核操作流程取证增量（2026-11-21，内部浏览器只读）：只读查看 `3.1 Modul Semakan Penghantaran` 说明，确认审核员经 DELIMa 登录 Google Classroom，在 Classwork/Assignment 中逐份或批量处理；截止后未交者在 Assigned 列表识别为 Missing；已交项可配置示例 1/1 分值、填写评语并 Return。此流程映射要求区分已分配缺交与已提交待审，并记录审核人、分值/评语、Return 时间及批次逐项结果。1/1 是材料中的建议，不据此硬编码全校政策；迟交、补交、退回重交和申诉规则未在样本中说明，仍需学校级可配置和源材料核验。详见 `docs/RPH_FORMAT_MAPPING.md`。平台级 PLT-01 与学校级 ADM-01 继续作为独立控制面/租户工作区需求；Phase 0 的需求追踪仍须将两者每条权限和路由双向映射，Phase 1 平台控制台不得被学校 Admin 页面替代。


## 21. Phase 0 — SSR 路由到需求追踪底表


状态：本地只读生成，基于当前工作树 `ssr/` 下 `php artisan route:list --except-vendor --json`；生成日期 2026-11-21。当前分支 `main`，HEAD `f84cb98bf99233462e1b7c7989fd012f9f64d1b5`。需求 ID 为初步归类，须再核对 controller 内部租户过滤、模型关系、数据库字段/迁移、Blade 视图、能力验收和生产证据；路由存在不代表功能完整或安全。

## 路由清单（48 条）

| Domain | Method | URI | Route name | Action | Middleware | 需求映射（待逐项验证） |
|---|---|---|---|---|---|---|
| support.erphpro.com | GET / HEAD | `/` | `support.home` | `SupportHomeController` | `web`, `support.host` | PUB-02 / PLT-01 |
| erphpro.com | GET / HEAD | `/` | `public.home` | `SchoolHomeController` | `web`, `school` | PUB-01 |
| default | GET / HEAD | `/` | `school.home` | `SchoolHomeController` | `web`, `school` | PUB-01 / TEN-01 |
| default | GET / HEAD | `/about` | `public.about` | `Illuminate\Routing\ViewController` | `web` | PUB-01 |
| default | GET / HEAD | `/account/identities` | `account.identities` | `Auth\GoogleAuthController@identities` | `web`, `school`, `auth`, `school.member` | TEN-01 / UX-01 |
| default | DELETE | `/account/identities/{identity}` | `account.identities.unlink` | `Auth\GoogleAuthController@unlinkIdentity` | `web`, `school`, `auth`, `school.member` | TEN-01 / UX-01 |
| default | GET / HEAD | `/admin` | `school.admin` | `SchoolAdminController` | `web`, `school`, `auth`, `school.member:school_admin,principal,vice_principal`, `permission:school.users.manage` | ADM-01 |
| default | GET / HEAD | `/admin/access` | `school.admin.access` | `SchoolAdminController@access` | `web`, `school`, `auth`, `school.member:school_admin,principal,vice_principal`, `permission:school.users.manage` | ADM-01 |
| default | POST | `/admin/access` | `school.admin.access.grant` | `SchoolAdminController@grantAccess` | `web`, `school`, `auth`, `school.member:school_admin,principal,vice_principal`, `permission:school.users.manage` | ADM-01 |
| default | POST | `/admin/people` | `school.admin.people.store` | `SchoolAdminController@store` | `web`, `school`, `auth`, `school.member:school_admin,principal,vice_principal`, `permission:school.users.manage` | ADM-01 |
| default | PUT | `/admin/people/{user}` | `school.admin.people.update` | `SchoolAdminController@updateMember` | `web`, `school`, `auth`, `school.member:school_admin,principal,vice_principal`, `permission:school.users.manage` | ADM-01 |
| default | GET / HEAD | `/admin/rph/{lessonPlan}/review` | `rph.review` | `LessonPlanReviewController@show` | `web`, `school`, `auth`, `school.member:school_admin,principal,vice_principal`, `permission:lesson_plans.review` | ADM-01 / RPH-02 |
| default | POST | `/admin/rph/{lessonPlan}/review` | `rph.review.decide` | `LessonPlanReviewController@decide` | `web`, `school`, `auth`, `school.member:school_admin,principal,vice_principal`, `permission:lesson_plans.review` | ADM-01 / RPH-02 |
| default | GET / HEAD | `/admin/settings` | `school.settings` | `SchoolSettingsController@edit` | `web`, `school`, `auth`, `school.member:school_admin,principal,vice_principal`, `permission:school.users.manage` | ADM-01 |
| default | PUT | `/admin/settings` | `school.settings.update` | `SchoolSettingsController@update` | `web`, `school`, `auth`, `school.member:school_admin,principal,vice_principal`, `permission:school.users.manage` | ADM-01 |
| default | POST | `/admin/settings/timetable` | `school.settings.timetable.add` | `SchoolSettingsController@addSlot` | `web`, `school`, `auth`, `school.member:school_admin,principal,vice_principal`, `permission:school.users.manage` | ADM-01 |
| default | GET / HEAD | `/auth/google/callback` | `auth.google.callback` | `Auth\GoogleAuthController@callback` | `web` | TEN-01 / INT-01 / PLT-01 |
| default | GET / HEAD | `/auth/google/link` | `auth.google.link` | `Auth\GoogleAuthController@redirectLink` | `web`, `school`, `auth` | TEN-01 / INT-01 / PLT-01 |
| default | POST | `/auth/google/one-tap` | `auth.google.one-tap` | `Auth\GoogleAuthController@oneTap` | `web` | TEN-01 / INT-01 / PLT-01 |
| default | GET / HEAD | `/auth/google/redirect` | `auth.google.redirect` | `Auth\GoogleAuthController@redirect` | `web`, `school` | TEN-01 / INT-01 / PLT-01 |
| default | GET / HEAD | `/faq` | `public.faq` | `Illuminate\Routing\ViewController` | `web` | PUB-01 |
| default | GET / HEAD | `/features` | `public.features` | `Illuminate\Routing\ViewController` | `web` | PUB-01 |
| default | GET / HEAD | `/health` | `health` | `HealthController` | `web` | OPS-01 |
| default | GET / HEAD | `/login` | `login` | `Auth\GoogleAuthController@show` | `web`, `school` | TEN-01 / PLT-01 |
| default | POST | `/logout` | `logout` | `Auth\GoogleAuthController@logout` | `web`, `school`, `auth` | TEN-01 / PLT-01 |
| default | GET / HEAD | `/owner` | `owner.dashboard` | `OwnerController` | `web`, `auth`, `platform.owner` | PLT-01 |
| default | GET / HEAD | `/owner/audit` | `owner.audit` | `OwnerAuditController` | `web`, `auth`, `platform.owner` | PLT-01 |
| default | GET / HEAD | `/owner/auth/google/redirect` | `owner.auth.google.redirect` | `Auth\GoogleAuthController@redirectOwner` | `web` | PLT-01 |
| default | GET / HEAD | `/owner/login` | `owner.login` | `Auth\GoogleAuthController@showOwner` | `web` | PLT-01 |
| default | GET / HEAD | `/owner/support` | `owner.support.index` | `OwnerSupportController@index` | `web`, `auth`, `platform.owner` | PUB-02 / PLT-01 |
| default | GET / HEAD | `/owner/support/{publicId}` | `owner.support.show` | `OwnerSupportController@show` | `web`, `auth`, `platform.owner` | PUB-02 / PLT-01 |
| default | PUT | `/owner/support/{publicId}` | `owner.support.update` | `OwnerSupportController@update` | `web`, `auth`, `platform.owner` | PUB-02 / PLT-01 |
| default | POST | `/owner/support/{publicId}/reply` | `owner.support.reply` | `OwnerSupportController@reply` | `web`, `auth`, `platform.owner` | PUB-02 / PLT-01 |
| default | GET / HEAD | `/profile` | `teacher.profile.edit` | `TeacherProfileController@edit` | `web`, `school`, `auth`, `school.member` | TEN-01 / UX-01 |
| default | PUT | `/profile` | `teacher.profile.update` | `TeacherProfileController@update` | `web`, `school`, `auth`, `school.member` | TEN-01 / UX-01 |
| default | GET / HEAD | `/reports` | `school.reports` | `SchoolReportController` | `web`, `school`, `auth`, `school.member:school_admin,principal,vice_principal`, `permission:reports.view` | REP-01 |
| default | POST | `/rph` | `rph.store` | `LessonPlanController@store` | `web`, `school`, `auth`, `school.member`, `permission:lesson_plans.create` | RPH-01 / RPH-02 |
| default | GET / HEAD | `/rph/create` | `rph.create` | `LessonPlanController@create` | `web`, `school`, `auth`, `school.member`, `permission:lesson_plans.create` | RPH-01 / RPH-02 |
| default | PUT | `/rph/{lessonPlan}` | `rph.update` | `LessonPlanController@update` | `web`, `school`, `auth`, `school.member`, `permission:lesson_plans.create` | RPH-01 / RPH-02 |
| default | GET / HEAD | `/rph/{lessonPlan}/edit` | `rph.edit` | `LessonPlanController@edit` | `web`, `school`, `auth`, `school.member`, `permission:lesson_plans.create` | RPH-01 / RPH-02 |
| default | POST | `/rph/{lessonPlan}/submit` | `rph.submit` | `LessonPlanController@submit` | `web`, `school`, `auth`, `school.member`, `permission:lesson_plans.create` | RPH-01 / RPH-02 |
| support.erphpro.com | GET / HEAD | `/solutions` | `support.solutions` | `SupportHomeController` | `web`, `support.host` | PUB-02 / PLT-01 |
| support.erphpro.com | GET / HEAD | `/solutions/{slug}` | `support.article` | `SupportArticleController@show` | `web`, `support.host` | PUB-02 / PLT-01 |
| support.erphpro.com | POST | `/tickets` | `support.ticket.store` | `SupportTicketController@store` | `web`, `support.host`, `throttle:5,1` | PUB-02 / PLT-01 |
| support.erphpro.com | GET / HEAD | `/tickets/new` | `support.ticket.create` | `SupportTicketController@create` | `web`, `support.host` | PUB-02 / PLT-01 |
| support.erphpro.com | GET / HEAD | `/tickets/{publicId}` | `support.ticket.show` | `SupportTicketController@show` | `web`, `support.host` | PUB-02 / PLT-01 |
| support.erphpro.com | POST | `/tickets/{publicId}/reply` | `support.ticket.reply` | `SupportTicketController@reply` | `web`, `support.host`, `throttle:10,1` | PUB-02 / PLT-01 |
| default | GET / HEAD | `/workspace` | `workspace.dashboard` | `WorkspaceController` | `web`, `school`, `auth`, `school.member` | TEN-01 / UX-01 |

## Controller → 视图/数据/租户过滤抽样核对

| 领域 | Controller | 可见视图/数据模型 | 已核对的租户/身份边界 | 未证明事项 |
|---|---|---|---|---|
| 官网 | `SchoolHomeController`、静态 `Route::view` | `public-home` / `school-home`、`public.features/about/faq` | 根域与学校域入口由 `school` 中间件解析 | 全页面三语/响应式/无障碍及功能验收 |
| 登录与身份 | `GoogleAuthController` | `auth.login/owner-login/error/not-member/identities`；`User`、`School`、`GoogleIdentity` | OAuth callback 查找学校/成员；身份解绑检查当前 user | Owner/学校 Guard、host、session、CSRF 隔离未实现/未验证；one-tap 路由移除 CSRF middleware，需单独安全核查 |
| 教师工作区 | `WorkspaceController`、`TeacherProfileController` | `workspace.dashboard`、`teacher-profile.edit`；`TeacherProfile`、`LessonPlan` | workspace 与资料按当前 school 和 user 查询 | 交叉学校负向用例、完整教师字段与角色旅程 |
| RPH | `LessonPlanController`、`LessonPlanReviewController` | `lesson-plans.create/edit/review`；`LessonPlan`、`LessonPlanVersion`、`LessonPlanSubmission`、`LessonPlanReview`、`SchoolTimetableSlot` | create/edit/submit 有 school_id + teacher profile 检查；review 有 school_id 检查 | 源模板字段完整性、SK/SP 快照、周级聚合、缺交/批量审核/并发旅程 |
| 学校 Admin | `SchoolAdminController`、`SchoolSettingsController`、`SchoolReportController` | `school-admin.dashboard/access/settings`、`school-reports.dashboard`；School/member/profile/settings/timetable/submission models | Admin middleware 限制管理角色与权限；查询多处按当前 school_id 过滤 | 完整状态机、所有写操作资源授权/批量、转校/归档、审计与报表口径 |
| 平台 Owner | `OwnerController`、`OwnerAuditController`、`OwnerSupportController` | `owner.dashboard/audit/support/*`；School、DB audit log、SupportTicket | `platform.owner` 检查 `platform_role=owner` | 平台独立 Guard/host/MFA、完整 RBAC、全局功能及平台数据操作审计均未完成；dashboard 当前只读学校列表 |
| 支持中心 | `SupportHomeController`、`SupportArticleController`、`SupportTicketController` | `support.home/article/ticket-create/ticket-show`；SupportCategory/Article/Ticket/Message/Event | 子域中间件；公开工单通过 public id + token hash 授权查看/回复；提交/回复有 throttle | 垃圾内容/附件/邮件送达/AI 安全与人工接管全流程未验证 |
| 运维 | `HealthController` | JSON health | 检查数据库连接 | release SHA 与部署产物对应、缓存语义、外部监控/告警和稳定性证据 |

## 数据与验收映射缺口

- 本次生成只覆盖 Laravel 路由端点，不是完整的双向需求追踪。CUR-01/02、INT-01/02、Demo 隔离、文章管理/FAQ 管理、全局平台设置等无对应完整业务路由或已知调用链；应标为缺实现/待映射，不能用模型或生产表存在替代。
- Migration 文件清单为 `database/migrations/` 中 13 个 PHP 文件；生产另有未由当前 migration 创建的历史表，来源及调用依赖见 `docs/PLESK_SSR_DEPLOYMENT.md`。迁移文件数与生产 `migrations` 记录相等不代表字段/数据/回滚兼容性已验证。
- 下一步需逐个 action 阅读完整方法与对应 Blade、middleware 实现、Model relations/casts/fillable、Migration schema 和 feature tests；再补一条需求一条验收证据的双向矩阵及缺口清单。不能据本文件进入 Phase 1，也不视为 Gemini Phase 0 复审包。

### Middleware 与认证边界源码核验增量

2026-11-21 本地只读核对 `ResolveSchool`、`RequireSchoolMembership`、`RequirePermission`、`RequirePlatformOwner`、`ResolveSupportHost` 和 `bootstrap/app.php`：`school` 仅接受配置 base domain 根路径或单层子域，并解析 active school；`school.member` 根据当前 request school 查询 active membership、拒绝过期 membership，并可限制角色；`permission` 从 `config/permissions.php` 按角色检查权限；`support.host` 对配置支持域名做精确 host 比较。该代码证明基础学校租户/角色门禁存在，但不证明所有 controller 资源查询都完整带 school_id，也不证明多宿主认证隔离。

平台 Owner/学校 Admin 区分复核（2026-11-21）：静态追踪 `routes/web.php`、`OwnerController`、`RequirePlatformOwner`、`RequireSchoolMembership`、`owner/dashboard.blade.php`、`GoogleAuthController` 与 `auth/not-member.blade.php`。`/owner` 的 `OwnerController` 直接运行 `School::query()->withCount('members')->orderBy('name')->get()`，不要求学校 membership；这是平台级全局学校目录的只读雏形，当前视图明确标为 Platform Owner / read-only by default。学校管理路由则要求当前 host 解析出的 school、有该校 active membership、未过期，并且角色为 school_admin/principal/vice_principal，再检查对应 permission。`auth/not-member` 页面要求登录者针对当前学校没有 membership，并明确请该校管理员添加其 Google Workspace 账号；它是学校待分配提示，不是平台控制台或平台身份判定。故平台入口与学校待分配旅程已在代码中区分，但完整平台后台仍未实现；计划 PLT-01 / Phase 1 要求的生命周期、平台团队/RBAC、账户分配等不得以现有只读目录或学校 Admin 模块替代。此处只作静态源码确认；尚未通过真实 Owner/学校账号双会话和跨 host 浏览器负向验证。

具体边界差距：Owner dashboard/audit/support 的路由 middleware 是默认 `auth` + `platform.owner`，后者只校验 `platform_role === owner`；Owner 页面、登录入口、OAuth redirect/callback 没有 route domain/host middleware 限定。学校与 Owner OAuth 意图都保存在同一默认 Web session（`auth.owner_login`、`auth.school_subdomain`），共用默认 Auth guard。`auth.google.one-tap` 的路由定义显式 `withoutMiddleware(VerifyCsrfToken::class)`，应在 Phase 1 前以正确 Laravel CSRF middleware 和 Google credential audience/nonce 校验进行安全审查；不可仅凭此静态点断言可利用 CSRF。实际线上 session cookie domain、One Tap credential 校验行为和跨 host 可利用性均未通过生产动态测试确认。Phase 1 验收必须覆盖：Owner 与学校两套登录同时使用及注销隔离、学校子域不能请求任何 Owner 页面/回调、主域平台登录全链路、CSRF/credential 重放负向验证、角色和学校资源越权负向矩阵。

### Migration → 表名静态映射

2026-11-21 对当前 13 个 migration 文件的 `Schema::create/table` 进行只读扫描。计数校正：迁移声明创建 25 张表（含 Laravel users/cache/jobs 框架表）；若数据库总表数为 38、其中另有 12 张未由这些迁移创建的应用表，再加 Laravel migration repository 表，算术为 25 + 12 + 1 = 38。部署记录中“24 migration-created tables”是笔误，已更正为 25。以下只是源码 schema 声明映射，不证明生产表结构/数据完全一致，也不代表可安全回滚。

2026-11-22 隔离候选源码复核补充：新增 `docs/PHASE0_LEGACY_TABLE_USAGE_MATRIX.md`，对照上述 12 张表与当前 SSR、旧 Flask SQLAlchemy、旧 React/Firebase 路径。归档 Flask 源明确映射其中 9 张 SQL 表；三张 `legacy_*` 表无精确源码表名引用。旧前端存在同名或近似命名 Firebase 集合，但 Firebase namespace 与 MariaDB 并不等同。源码位置不能证明归档程序仍运行或生产流量为零；全部 12 张表继续保护，须先在授权隔离恢复中查 schema/完整性并核验运行消费者、数据来源与保留责任。本轮未访问生产数据库、Firebase 或 Plesk，未进行任何数据读取/写入或清理。

同次发现仓库还包含不同的 Flask/SQLite DSKP 原型：`backend/models.py` 使用 `dskp_data` 等五张 SQLite 表，与上述 12 张 MariaDB 表不是同一份 schema。跟踪的 `backend/instance/erph.db` 只做只读表/行数元数据检查，显示 `dskp_data` 5 行、其余四表 0 行；未读出任何行值，文件未修改。原 `backend/seed_dskp.py` 会清空 DSKP 表且允许显式数据库 URL；隔离候选将其改为仅允许显式初始化一个全新默认本地 SQLite 库、拒绝任何现存非空 DB、拒绝 `DATABASE_URL` 并移除删除操作。无标志、非本地 URL、现存 DB 三种拒绝路径均验证通过，SQLite 文件 SHA-256 前后相同；没有运行实际 seed。另一个被跟踪的 `backend/erph.db` 为 0 字节且非 Flask 配置默认路径，已从候选移除。当前容器没有 Flask，且现存 SQLite 数据库非空，因此实际导入流程尚未运行；生产 DSKP 来源、授权和覆盖仍未闭合。

2026-11-22 增加并运行五项 Python 标准库隔离回归测试：脚本缺少显式 flag 时拒绝、显式 `DATABASE_URL` 时拒绝、非空 SQLite 文件保持哈希不变、已有 DSKP 行时不提交、仅空本地演示库可进入 seed 并生成五条样例记录。测试把脚本复制到临时目录，以 stub app/model 验证控制流，不加载真实 Flask/SQLite 数据；命令 `python3 -m unittest discover -s backend/tests -v` 通过 5 项。GitHub workflow 已纳入该测试路径。这不能代替实际 Flask 数据库正向流程或数据兼容验证，也不授权运行真实 seed。

上述矩阵进一步比较了生产 `dskp_standards`、本地 SQLite `dskp_data` 与 Laravel `curriculum_items` 字段，确认各自 ID、学校分类/租户、主题细分、SK/SP 编码、版本/来源/授权字段并不对齐；旧 MariaDB 表在主题/技能/标题上有四个字段，本地原型仅有两个，直接折叠可能丢信息。此为源结构比较，不证明记录等价。本轮只写入后续字段/权限/版本/导入门槛，没有创建 SSR migration 或导入器；详见 `docs/PHASE0_LEGACY_TABLE_USAGE_MATRIX.md`。

| Migration | 声明创建的表 | 修改既有表 |
|---|---|---|
| `0001_01_01_000000_create_users_table.php` | `users`、`password_reset_tokens`、`sessions` | — |
| `0001_01_01_000001_create_cache_table.php` | `cache`、`cache_locks` | — |
| `0001_01_01_000002_create_jobs_table.php` | `jobs`、`job_batches`、`failed_jobs` | — |
| `2026_11_20_000100_create_school_core_tables.php` | `schools`、`school_memberships`、`audit_logs` | — |
| `2026_11_20_000101_add_google_subject_to_users_table.php` | — | `users` |
| `2026_11_20_000200_create_teacher_and_lesson_tables.php` | `teacher_profiles`、`curriculum_items`、`lesson_plans`、`lesson_plan_versions`、`lesson_plan_reviews` | — |
| `2026_11_20_000201_create_lesson_plan_submissions_table.php` | `lesson_plan_submissions` | — |
| `2026_11_20_000202_create_school_settings_table.php` | `school_settings` | — |
| `2026_11_20_000203_add_expiry_to_school_memberships.php` | — | `school_memberships` |
| `2026_11_20_000204_create_school_timetable_slots_table.php` | `school_timetable_slots` | — |
| `2026_11_20_000205_add_platform_role_to_users_table.php` | — | `users` |
| `2026_11_21_000300_create_google_identities_table.php` | `google_identities` | — |
| `2026_11_21_000400_create_support_system_tables.php` | `support_categories`、`support_articles`、`support_tickets`、`support_ticket_messages`、`support_ticket_events` | — |

下一步需要在只读生产 schema 比较中逐表核对 25 张预期表和 12 张历史表，不查询/导出业务行；再按字段、索引、外键、迁移批次和调用依赖核验差异。当前计数修正不解除任何历史数据保护或迁移门禁。

### 全仓 Firebase、邮件及 AI 外发路径核验

2026-11-21 本地只读扫描当前工作树（范围包括根 React/Vite、`ssr/`、`services/`、`pages/`、`src/`、`scripts/`、PHP 配置和部署/CI 文件；搜索排除了 vendor、node_modules、lock、map、docs 与 `.git`）。当前基线 `main@f84cb98bf99233462e1b7c7989fd012f9f64d1b5`，期间未读取任何 `.env` secret 值。

- 根目录仍是 Firebase 原型而非单纯文档：`package.json` 含 React/Vite 与 Firebase SDK/CLI，`firebase.json` 指向静态 `build/` 并对所有路径回落 `index.html`，有 `firebase deploy --only hosting` 命令；`services/firebase.ts` 初始化 Auth/Firestore，多个门户、管理员、课程/日程/审核和 DSKP 页面直接调用。`scripts/seed-firestore-dskp.js` 会从 Google Sheet 拉取并写入 Firestore，未执行。Plesk 当前 Document Root 已核为 `ssr/public`，SSR 自动部署流程由独立 `.github/workflows/ssr.yml` 约束。内部 Firebase 控制台的 `erph-pro` Web app 页面仍提供“Link to a Firebase Hosting site”动作，Hosting 页面显示 `Get started`，因此当前 console UI 未显示已创建/关联 Hosting site；这不验证 Firestore/Auth 是否含有仍需保留的数据，也不等同于 Firebase 项目整体已停用。根原型/SDK/脚本在数据保全和引用审计通过前不可直接删除。
- 根 React 邮箱后台并非真实邮箱集成：`services/emailService.ts` 的 `getEmails()` 返回内置 `MOCK_EMAILS`；Mailbox 回复只显示成功提示，不调用后端。旧 SMTP 测试邮件函数将内容写进 Firestore `mail` collection（依赖 Trigger Email 扩展才可能投递）。`pages/Admin/SystemConfig.tsx` 的保存是 `setTimeout` 模拟数据库提交，旧邮箱/密码配置并未持久化；表单中原先存在非空硬编码 SMTP 密码默认值，本次已清为空字符串，未将值复制到文档/回复。若它是真实凭据，因曾处于受 Git 跟踪源码中，应按泄露凭据处理并轮换；Git 历史是否被远端保留需单独核查。旧 `services/email_service.py` 有 SMTP 发送实现，但 SSR 路由/Composer 调用链未引用它，不能当成线上邮箱能力。
- Laravel SSR 现有支持工单和同步邮件尝试：新 ticket 事务保存成功后调用 `SupportAIService::analyse()`；若服务端 DeepSeek key 存在，发送 ticket subject 与最新用户 message 原文（分别截断至 240/6000 字符），未做字段级脱敏。没有证据确认生产 key 当前已配置或本次浏览器核验实际触发了供应商请求。`SUPPORT_AI_AUTO_REPLY` 虽在 `config/support.php` 定义，但 `SupportAIService`/controller 没有读取该开关；目前只保存 AI 分类/摘要/草稿，邮件仅发给支持管理员或由人工回复用户。自动回复没有发出，但敏感内容外发仍可能发生。必须在开放/继续 AI 前先做隐私分类、PII/学生数据脱敏、供应商用途与保留核验、低置信/敏感类别强制人工、关闭开关时 fail-closed，并为每次外发记录最少必要审计信息。
- 扫描在 SSR 找到 Google OAuth（Socialite）、`Mail::raw` 与 DeepSeek HTTP 客户端；未找到当前 SSR 的 Telegram/WhatsApp API 发送路径。Legacy 根界面包含 SMTP/Telegram 文案，不代表已集成。配置键名已静态列举，但没有打开 `.env`，未确认任何供应商 secret 的实际配置状态。
- SSR GitHub Actions workflow 在 push `main` 时运行 PHP 测试和部署脚本语法检查，但其 PR 路径过滤仅覆盖 `ssr/**`、SSR 部署脚本/验证脚本和该 workflow；根 React 文件变更不触发该 PR workflow。该事实只描述 CI 触发范围，不能据此推断 Plesk 每次自动部署实际执行 hook 的行为。

### 学校 Admin 与审核逐 action 静态差距（2026-11-21）

只读对照 `routes/web.php`、`SchoolAdminController`、`SchoolSettingsController`、`LessonPlanReviewController`、`RequireSchoolMembership`、`RequirePermission`、`config/permissions.php` 及相关 migration；不在 Phase 0 修复业务逻辑、不运行写入或测试。学校 admin 路由确实要求当前学校 active membership、未过期、角色为 `school_admin/principal/vice_principal` 并匹配对应 permission；多个核心写流程仍只是最小雏形：

- `SchoolAdminController::store` 和 `grantAccess` 对全局 `User` 按 email `firstOrCreate` 后无条件覆盖 `users.name`，会把当前学校录入的姓名写入跨校共享身份记录；流程未发送邀请或验证目标邮箱。二者用 `syncWithoutDetaching` 添加 membership：已有同校 inactive membership 不会被恢复/更新，但 `store` 会把对应 `TeacherProfile` 更新为 active，可能造成 profile 与 membership 状态不一致；临时授权重发/续期/变更角色也不会更新已有 pivot 的 expiry/role/status/reason。需改为明确 invitation/identity linking 与事务化、可审计的 membership upsert/rehire 生命周期，且保护全局身份信息不被单校改写。
- `updateMember` 有“不能停用自己”和至少保留一名 active 管理员的业务检查，但管理员计数、pivot 更新、profile 更新、audit event 未置于单一事务/锁定流程；并发下最后管理人检查可能失效，部分失败时状态可能不同步。离职只改 pivot `left_at` 与 profile `employment_status`，未填 profile 的 `left_school_on`，也没有转校/离职的完整档案封存/重新入职动作。必须补并发安全的学校管理员保留不变量和完整任期事件。
- `SchoolSettingsController::edit` 的 GET 请求调用 `SchoolSetting::firstOrCreate`（存在读请求副作用）；`update` 分别校验 `total_weeks` 和 `active_week` 在 1..60，但不约束 `active_week <= total_weeks`，也未证明 A/B 周组、州属假期/学年和提交截止策略已有学校配置。`addSlot` 只创建节次，没有同校时间重叠/重复检查、更新/停用/删除或课表导入路径；当前 schema 虽有 `is_active`，所读 view/controller 没有对应管理动作。
- `LessonPlanReviewController::decide` 按 school_id 检查对象且记录 review/audit，但不校验教案当前已提交/待审状态，不携带期望版本或幂等键，不用事务包住 review row、lesson status 与 audit；审批评论可空，重复请求/并发决策的最终语义没有定义。没有逐条结果或批量审核路由。Phase 2 需用显式状态机/版本检查/幂等事务实现单份与批量审核及可重试的逐项结果，不可把现有单条 endpoint 视为审核流程完整。
- `school_memberships` schema 唯一键为 `(school_id,user_id)`，支持同一用户跨校任职，但当前 teacher/profile 写操作、转校、离职和跨校档案/身份边界还没有完整生命周期服务或验收。`RequireSchoolMembership` 只证明请求层当前学校 active/expiry/role 门禁；不能替代每个写动作的事务、不变量和对象级授权证明。

以上是源代码静态差距，未作为已证实的生产利用事件，也没有在本阶段修改。正式开发必须在对应 Phase 纳入回归场景、错误/并发测试与隔离 Demo 旅程；Phase 0 汇总后再交 Gemini 对完整证据包审查。

### RPH 创建、版本与提交逐 action 静态差距（2026-11-21）

只读追踪 `LessonPlanController`、`WorkspaceController`、`LessonPlan`/`LessonPlanVersion`、RPH create/edit Blade 与 `lesson_plan_submissions` migration，并与 `docs/RPH_FORMAT_MAPPING.md` 的可见 TING6 workbook 字段对照；未运行测试或修改业务代码。

- `rph.create` 虽展示学校 timetable slot 下拉框，表单会在浏览器端据 slot 填充起止时间，但 `LessonPlanController::store` 未验证/接收 `slot_id`，也不校验日期星期、slot 是否属于当前学校/是否有效；DB `lesson_plans` 没有 timetable slot 外键。故所选课表关系未持久化，不能证明“按学校课表自动生成每天/每周教案”。日期、学科、班级仍手动输入，未实现按校历生成至少 5 个有效教学日。
- 创建表单及 controller 缺源 workbook 里重复班级区块的 semester、课本参考、CONTENT 多栏、title/subtitle、learning outcomes、main/closing activities、intervention，以及 RPT 的 SK/SP、年级/周次上下文等独立字段；也没有 `attendance_present/attendance_total`、课表 Slot 关系与 substitute/original teacher 双身份。字段清单及来源证据详见 `docs/RPH_FORMAT_MAPPING.md`。现有 JSON version 可存当前提交进来的键，但不代表缺失源字段已经建模/验证/展示/打印保真。
- 创建时教学字段多数可空，`store` 只要求日期/科目/班级/标题；`submit` 不执行字段完成度、学校校历、至少五天/周或缺项清单校验，也没有“提交前列出缺项并确认”的服务端契约。因此最小草稿可直接提交，尚未实现完整提交前自动审查/提醒。
- `edit` 页面仅渲染日期、科目、班级、标题、目标、活动、一般评估、反思、作业、材料与版本说明；虽接受部分其它键，教师不能在编辑页修改已创建的 Civic、时间、EMK/PAK21、书面/口头/观察评估、Nilai、出席人数、Enrichment/Remedial/KBAT/多元智能/备注等字段。更新时 JSON `array_replace` 会保留未渲染键的旧值，避免直接删除，但不能满足 RPH 全字段可编辑/保真验收。
- 保存新版本会从 `current_version + 1` 取号，但在事务前读取且不锁定父记录；并发编辑可能争用相同版本号。表的唯一约束可能拒绝其中一笔，但当前没有友好冲突恢复/重试语义。审核只能读取版本列表；review 行、lesson status 与审计写入未原子化；审批可作用于未提交状态，return comment 可空。
- `submit` 不限制教案原状态，故静态代码允许未提交或已批准记录再次进入 submitted；教师 `update` 仅阻止 approved，编辑其它状态均重置 draft 但不清除父表 `submitted_at`。提交记录 `updateOrCreate(lesson_plan_id, week_no)` 覆盖同周现有 `submitted_at/status`，表没有 `version_id`、提交内容 JSON/hash 或 attempt number；不能还原每次提交时实际审阅的内容，重复提交时间会改写而非保存不可变尝试。submission 写入、父记录状态、审计不在同一事务。
- 当前周级提交仅用一个 `SchoolSetting.active_week` 与一个 `active_week_deadline`，不是按学校日历/教师/课程或每周规则解析；`WorkspaceController` 只聚合计划当前状态，未实现缺交 Slot 分母、准时/迟交维度与完整周状态，也没有单节/周/月/年报告。
- 时间语义也尚未闭合：Laravel `config/app.php` 固定 `UTC`，当前 `school_settings` migration/controller 没有学校 timezone 字段；提交用 `now()` 后按 UTC `startOfDay()` 与 date-only deadline 比较，报告则用 Laravel 默认 `startOfWeek()`（周一）过滤。靠近马来西亚午夜/周边界时，迟交状态或学校周报可能落到错误日期/周。当前源码不能证明生产已有错误数据；Phase 2 必须定义学校时区、时间戳存储与本地日历日期转换，并按 Group A/B 周历及截止日边界测试后才可用于行政报告。

这些静态差距把 Phase 2 的实际范围具体化：先完成字段/条件字典和 slot/校历模型，再实现有版本快照与幂等/并发约束的提交审核状态机、修订及报告；历史与已批准内容须保持不可变。结论仅为源码差距，不是生产动态验证。Phase 0 的源模板/公式/条件和动态旅程仍需继续取证，Phase 2 不得提前解锁。

### Support Ticket 与 DeepSeek 数据流逐 action 静态差距（2026-11-21）

只读追踪 `SupportTicketController`、`OwnerSupportController`、`SupportAIService`、支持路由及 `2026_11_21_000400_create_support_system_tables.php`。未调用 DeepSeek、未发邮件、未运行测试、未修改业务代码。

- 新工单在事务内写入 ticket、首条消息和事件；事务结束后立即同步调用 `SupportAIService::analyse`，将原始主题和最多 6,000 字用户消息发送到配置的 DeepSeek endpoint。当前代码没有检测/遮罩个人、学校、学生或账号信息，没有在提交前展示外部处理告知/同意，也没有可见的数据留存/删除契约。`services.deepseek.api_key` 是否在生产配置、实际 endpoint/数据处理条款和线上触发率均未核实；此静态调用链本身已证明：只要配置 API key，新工单就会尝试外发原文。后续必须先完成供应商/区域/保留与隐私评估、明确告知及 opt-in/opt-out 或经批准的最小化策略，再开放该路径；安全、身份、账单、法律、访问授权、删除和其他敏感工单须默认人工处理。不得把系统提示词当作数据防泄漏控制。
- AI 返回 `reply_draft` 并存入 ticket，当前 Owner 工单页/客服流程没有可见的人工审核后发送该草稿控件，也没有任何 AI 自动发信路径；所以“自动回复处理”目前并未实现。服务端将 `needs_human` 或置信度不足标成 `human_review`，但在输出格式损坏/异常时只记 `failed`，且工单类别与 AI 分类未写回；重试、人工接管 SLA、草稿审阅记录与 AI 决策审计未建立。未来自动回复必须独立于分类/草稿阶段，使用服务端允许的知识来源、严格类别白名单、置信门槛、人工审批/升级、速率/预算上限、可追溯 prompt/model 版本及可停用开关；本期不得将 `draft_ready` 视为已答复或关闭工单。
- 创建工单后把一次性明文访问 token 放在 `support.ticket.show` 的 query string；首次 GET 再将其写入 session 并重定向去掉参数。此前 URL 仍可能进入浏览器历史、代理/服务器访问日志或 referrer。数据库只保存 token hash 是正向控制，但不能消除 URL 暴露面。应改为不把 bearer token 放入可记录 URL 的传递方式，并加入短期/一次性兑换、token 轮换/撤销、敏感页面 `Referrer-Policy: no-referrer` 与日志脱敏；在完成访问授权前不得用 public id 单独授权。
- 客服回复先写消息、再更新 ticket、再写 event，各步不在事务内；邮件发送失败仅 `report()`，页面仍回显“Reply sent to the requester.”，没有 delivery state、重试队列或可见失败提示。工单状态更新与事件写入也没有事务/幂等边界。实际 queue/Cron 尚无生产 consumer 证据（见部署文档），因此邮件可靠发送需先定义可运行的异步 outbox/重试/失败队列或明确同步发送与失败提示契约，再启用客服运营。
- 工单读/改/回覆路由虽置于精确 support host 与公开写入限流之下，顾客查看/回复依靠 64 字随机 token 的 SHA-256 校验，Owner 路由依赖 `platform.owner`。ticket 中 `school_id` 和 `assigned_to` 已建列，但创建路径没有写入学校关联或指派，Owner 队列也没有指派/团队角色管理；目前是全平台 Owner 队列，不是已完成的多客服沟通系统。公开 ticket 与创建接口缺少已证实的邮箱所有权验证、附件扫描、垃圾/滥用处置及请求者账号登录关联完整流程；不能把 `throttle` 等同于这些控制已完成。

上述均为当前 checkout 源码静态事实，不证明生产 DeepSeek 实际被调用或邮件曾误报送达。对应 PUB-02、PLT-01、INT-02 与隐私/OPS-01 验收矩阵须增加原文外发控制、令牌泄露防护、客服角色/指派、事务及幂等、邮件真实送达和人工审阅/升级旅程；Phase 0 动态凭据/供应商状态和运行队列证据仍未取得，Phase 5/6 不得解锁。

### 审计日志隐私与现有报告聚合补充核验（2026-11-21）

只读复核 `AuditLogger`、`OwnerAuditController`、`SchoolReportController` 与提交表约束；未读取生产审计行、未运行报告查询、未修改业务代码或运行测试。

- `AuditLogger::record` 对每个调用写入请求 IP、完整 User-Agent 与未经统一脱敏的 `context` JSON。现有认证/成员操作的若干调用会把完整邮箱写入 context；`OwnerAuditController` 让唯一 `platform_role=owner` 用户读取最近 100 行的全部 context，页面查询没有字段级脱敏/角色 scope。生产日志实际包含何种值、访问记录、保留期限、清除/导出控制及数据库备份保留情况均未通过只读取证核验。Phase 1 的平台审计必须使用字段白名单、最小化/脱敏与访问审计，并由安全/隐私负责人定义保留和受控处置期限；不可把“只展示最近 100 行”当作数据保留策略。
- 当前 `SchoolReportController` 以提交记录行数计算周提交数，并用 `max(activeTeachers - submittedRows, 0)` 作为 pending。`lesson_plan_submissions` 的唯一键为 `(lesson_plan_id, week_no)`，允许一个教师同周有多条教案提交；因而提交行数不能代表已提交教师数，也不能作为按课表 Slot 计算的缺交分母。现有报告数值仅是粗略条数，不能用于行政考核或对外报告；Phase 2 须从有效课表/校历/教师责任 Slot 及不可变提交事件派生唯一分母并可复算。

这两项是当前源码的准确行为与待治理数据，不证明生产日志已泄露或已经产生错误报告。Phase 0 的需求追踪、敏感数据出站清单和 Phase 1/2 准出矩阵应纳入上述字段、访问、保留及报告口径；本次未作任何清除、导出或校验性写入。

### 教师身份证字段静态隐私核验（2026-11-21）

只读核对 `TeacherProfile`、`TeacherProfileController`、教师资料编辑页与建表 migration；未读取生产资料、未运行测试、未修改业务代码。

- `teacher_profiles.identity_no` 当前是可空普通字符串列；模型将其列入 `$fillable`，没有应用层加密 cast。控制器允许教师自行写入并审计字段名；资料编辑页把原值直接回显。静态代码未发现掩码、访问目的/同意提示或字段专用的访问审计。数据库/磁盘层加密状态及生产数据是否已有身份证号码均未知，不得据此推断线上已有泄漏。
- 当前资料读写按当前 school 与 user 限定，说明普通资料页仅读写本人该校 profile；但以明文形式收集完整身份证号码的必要性、学校侧/平台侧后续访问路径、导出/日志/备份中的副本范围均未证明。应先完成字段必要性与数据责任评估；若业务不需要则不收集，若获批准需要，则采用应用层加密存储、最小权限访问、默认遮罩、显式授权/目的记录、审计与保留/删除规则，并设计兼容迁移和密钥轮换/恢复，不可直接改写生产列。
- `RPH_FORMAT_MAPPING.md` 已将身份证号码列作严禁登录主键且普通教师不可见的敏感字段；实际模型仍存储明文，故字段契约尚未落实。将此差异加入 Phase 0 数据字典/敏感字段与副本清单，并作为 Phase 1 隐私门禁；在源数据、使用目的和加密/访问方案未经核实前，不导入、展示或复制生产身份证值。

### Legacy Firebase / DSKP 写路径与 SSR 课程数据依赖核对（2026-11-21）

本次按当前 checkout 只读追踪根 React `pages/ReferenceManager.tsx`、`src/components/dskp/SyncModal.tsx`、`services/dskpService.ts`、`services/dskpSync.ts`、`scripts/seed-firestore-dskp.js`、`services/firebaseService.ts` 与 SSR routes/models/migrations；没有执行任何同步、删除或外部 API 请求。

- 根 React 的 Admin → Reference Manager 仍提供“Sync DSKP Master”入口，`services/dskpSync.ts` 从固定 Google Sheets CSV 读取整份数据并调用 `api.dskp.sync`，但 `services/api.ts` 对应请求为 `/dskp/sync`，当前 `ssr/routes` 只有 `web.php` 与 `console.php`，没有该 API 路由；生产前端/API 主机是否还有仓库外实现未核实。旧 UI 运行该按钮的真实效果因此未知，不能将其称作可用的 SSR 数据导入能力。
- 另一套 Firebase 管理导入在 Stage 1 会先逐批删除 Firestore `dskp_raw` 全部现存文档，再写入新暂存行；Stage 2 把映射结果写进 `dskp_final/{schoolType}/years/{year}/subjects/{subject}`，并非与生产 MariaDB 的原子替换。旧 `scripts/seed-firestore-dskp.js` 则从另一个固定 Google Sheet 读取并逐文档写入 Firestore `curriculum_dskp`；该脚本注释仍描述不确定的客户端认证/规则，不含可证明的服务端受限凭据。另有旧层级 manager 的 `delete(id)` 明确返回“不支持”，但 legacy 平面 service 仍有单条 `dskp_standards` 更新/删除方法。多条不同来源、结构、写入目标并存，存在数据漂移与误删风险；Phase 0 禁止运行这些写入口或据此清理云端数据。
- Firestore 读取仍存在于 `services/firebaseService.ts`，至少查询 `curriculum_dskp` 与 `lesson_records`，而旧 DSKP reader 同时存在扁平 `dskp_standards`、`metadata/dskp_structure` 与新层级 `dskp_final`。静态仓库调用图证明根 React 仍有 Firebase SDK/读写路径，因此“SSR 路由面已切换”不等于“Firebase 已退出”或“旧系统无人使用”；外部访问流量、Firestore 身份验证规则、各集合真实数据量/出处/备份和 Google Sheet 许可仍未核验。安全移除前必须逐条证明流量/调用归零、导出与 hash/计数核对、权限和保留审批以及可恢复备份。
- Laravel SSR 当前只有 `curriculum_items` migration/model，没有 DSKP 查询、导入 API 或 RPH controller/model 调用该模型；`curriculum_items` 是否包含任何实际课程记录未由本地源码证明，生产表的结构证据也不证明行数/课程覆盖。旧 Firestore `dskp_standards`（部署盘点所见 46,967 行）与 SSR `curriculum_items` 没有已证实的键、字段、课程版本/来源/授权对应关系。不得把它们视为同一数据集、直接覆盖导入或删除其一。迁移需先有获授权的数据来源和逐课程版本/语言/年级映射、重复/差异报告、影子库导入及回滚演练。

此证据加固了 Phase 0 的代码依赖图和课程数据 gate，但未关闭生产流量、Firebase 数据保全、Google Sheet 版权、SSR 导入契约或课程覆盖门禁；任何 Firebase/DSKP 删除或生产导入仍未获本阶段授权。

### Plesk 自动部署写入面复核（2026-11-21，内部浏览器只读）

只读打开 Plesk `eRPH-PRO.git` Repository settings；确认 `main` 分支、Automatic 部署模式、目标 `/erphpro.com`、post-deployment actions 已启用，并运行 `/home/w4chinese.com/erphpro.com/scripts/deploy-ssr.sh`。该脚本每次执行会 `composer install`、`composer check-platform-reqs`、`php artisan migrate --force`、运行 `SupportContentSeeder --force` 并重建 Laravel cache。Seeder 对固定 slug 使用 `updateOrCreate`，会覆盖同 slug 文章/分类的 body、excerpt、发布状态和排序；所以任何到达 main 的提交都会自动进入生产部署后处理，并可能变更生产 schema 和覆盖运营内容。Plesk 设置对话框已取消关闭，未 Apply/改写 webhook、分支或路径；本次未 Push/Pull/Deploy。

静态 migration 与 seeder 路径复核（2026-11-21，本地 checkout 只读）：当前 13 个 SSR migration 的 `up()` 仅执行建表与加列操作；没有发现 `up()` 内的行更新、删除、截断或表重命名。3 个 migration 为既有表加列（Google subject、membership expiry/access reason、platform role），其余创建当前 SSR 表。所有包含 `Schema::dropIfExists`/`dropColumn` 的操作位于 `down()`，回滚会删除对应表/列，不能当作无损回滚。生产 deploy hook 只调用 `SupportContentSeeder`，没有调用通用 `DatabaseSeeder`；后者目前另含 demo school/user、membership、profile、settings 与 factory 用户写入，因此本轮确认的是“该通用 seeder 不在已审查的部署脚本调用链中”，不能把它描述成每次自动部署必然运行。`composer.json` 的 `setup` 脚本含 migration，但它是显式 setup 脚本，不是 `composer install` 自动触发的 Composer lifecycle hook。上述均为当前 checkout 静态证据，不代表 Plesk 实际 hook 曾成功、迁移在生产已安全演练，或未来新增 migration 没有数据风险。

此项为 Phase 0 的 P0 发布安全发现：现有 main 自动部署不可视为只复制文件的无害操作，也不可用来承载未经阶段门禁和生产备份/恢复证据批准的开发候选。后续推进必须先让生产 migration 具有可审查、可恢复的变更门禁，并让 seed 数据与运营编辑内容分离/幂等保留，再按用户要求在受控生产范围执行该 Phase 验收。自动部署配置本身尚未更改；在完成 Phase 0 与授权的部署策略前不得向该 main 推送新工作。

### Plesk 503 日志与排程任务二次只读取证（2026-11-21）

通过 Codex 内部浏览器再次查看 Plesk 域名概览、PHP Settings、Scheduled Tasks 与聚合 Logs；未保存任何配置，也未运行 Pull/Deploy。

- 域名当前仍显示 Active，document root 指向 `ssr/public`，PHP 8.3.37 / FastCGI；这只证明面板配置值，不等同于当前外网请求成功。
- Plesk Scheduled Tasks 页面显示 `No items`。因此没有 Plesk 管理的 Laravel scheduler/queue worker 现场证据；外部 worker 或主机级任务仍未知。此观察与部署契约的来源/时间一致，但尚未逐项验证各类外部配置。
- 聚合日志页面仍只有 1,002 项，尾部停在 `2026-11-20 22:03:59`。其中约 22:03:26–22:03:59 有多条首页 503；同期 LiteSpeed external-app Unix socket 出现 connection reset/refused/no-such-file，达到最大重试后返回 503。Apache error 项还显示配置的 Node.js app log path 位于订阅用户 home 之外而被忽略。该历史日志支持当时上游应用 handler/socket 不可用及 Node 路径配置异常这一诊断方向；它不证明当前仍有 503，也不证明此次异常与屏幕截图的时间完全对应。此前 11 月 21 日观察到的首页/health 200 是不同时间的点时恢复证据。
- 聚合视图没有刷新到当前访问日志尾部，当前 per-file `access_ssl_log`、`error_log` 时间窗和首页/health 实时状态需要重新对应；持续稳定性、handler 当前状态、具体 503 请求与影响范围仍未闭环。不能将历史失败日志抹去，也不能将其升级为当前仍故障的断言。

该增量修正 P0 事件证据：已有明确历史 503 与 upstream socket 失败证据，同时仍有较晚的点时 200；因此“曾发生的上游故障”有日志支持，“当前是否持续故障”仍需最新 per-file 访问/错误日志和入口检查。计划仍要求保持 Phase 0，先完成故障窗口关联与连续性/运行恢复证据再关闭线上事件。

最新生产现场关联（2026-11-21 19:48 MYT，Plesk 内部浏览器只读）：直接打开首页呈现 SSR 官网；`/health` 返回 `status=ok`、`database=ok`、`cache=ok`。Plesk File Manager 中 domain-specific `logs/erphpro.com/access_ssl_log` 在 19:48 修改，最新记录到 19:48:30，首页 19:48:27 为 200、health 19:48:30 为 200。该日志直接复现并时间关联用户截图：同日 13:33:19 和 13:33:21 首页为 503；13:05–13:54 多个首页请求间歇性 503，其中 health 多次 200，13:53 `/index.php` 为 200 但 `/` 仍 503；13:55 起首页连续观测转为 200，14:06 公开页面路由均为 200。最新 `logs/erphpro.com/error_log`（19.4 KB，修改至 18:00）在 13:05、13:21、13:33、13:34、13:42、13:48、13:50、13:51、13:53、13:54 对应记录 LiteSpeed external-app UDS reset/refused/no-such-file 与最大重试 503。Plesk 页面同时每小时仍输出 Node.js app log path 在订阅 home 外而被忽略的告警；此告警与站点处理链有关，但日志不足以单独证明它就是 503 的唯一原因。访问日志中包含的 IP、浏览器标识及 OAuth callback query/授权码没有纳入计划。当前最新入口及日志时间窗通过，但仅能证明 19:48 点时恢复；需解释约 50 分钟的间歇故障/恢复机制，并排除后续复发，P0 才能关闭。未修改任何生产配置。

根因与修复时间线补证（2026-11-21，源码 + Plesk Git/文件时间/访问日志交叉核对）：Plesk main 提交清单中 `7fb43058bb8bd768265a2a6d7e0dde15aa9efe46` 的提交时间为 13:54:46 MYT，标题 `fix: route directory requests through laravel`；本地 `git show` 确认它只给 `ssr/public/.htaccess` 增加 `DirectoryIndex index.php`，注释明确说明 LiteSpeed 可能继承 hosting plan 的 Node.js directory index，要求 Laravel 统一进入 PHP front controller。Plesk File Manager 显示生产 `ssr/public/.htaccess` 修改时间为 13:55，与 main auto-deploy 记录吻合；访问日志显示最后一波首页 503 于 13:54:28，首个后续首页 200 于 13:55:24，之后到 19:48:27 持续抽样均为 200。结合 503 的 UDS 错误，这强烈支持“目录请求命中继承的 Node.js index/外部应用，而非 Laravel front controller”为故障原因，且修复已通过 main 自动部署进入生产目录。部署卡未提供 hook 完成记录或 served-tree SHA，故不声称 SHA 级发布证明；但 P0 首页 503 事件可按源码修复 + 生产文件时间 + 故障前后响应时间线视为已解决。更早条目“原因未证实/未持久关闭”由这组新增证据更新。Plesk 每小时残留的 Node.js 日志路径告警仍在，但本身不是该首页 503 根因的单独证明；OAuth callback 的 500/502/503 是独立故障，仍未关闭。

### OAuth 回调失败与访问日志敏感参数复核（2026-11-21，Plesk 内部浏览器只读）

重读 domain-specific `logs/access_ssl_log` 后，发现 2026-11-21 15:22、16:01、16:02、16:04、16:09、16:14、16:17 与 17:42 MYT 多次进入 Google OAuth 回调；对应响应包括 500、502、503，也有 302。成功的 302 后观测到 `/owner` 返回 200；期间 `/health` 多次为 200。因此 OAuth 错误与首页 503 是不同路径，且不能仅以数据库/缓存 health 通过推断登录正常。访问日志完整记录了 OAuth callback query string，其中包括短时授权码及 state 等参数。此处不保留、引用或转述具体值；已读取的值不应复制到工单、报告或聊天。应把 Plesk/HTTP access log 查询参数脱敏、日志访问最小权限和敏感日志保留/清理流程作为 P0 安全处理项；本次没有修改或删除日志，也没有更改 OAuth 凭据。

生产 File Manager 的 Code Editor 可只读打开 `ssr/storage/logs/laravel.log` 并通过内置查找定位到 2026-11-21 07:22 UTC（15:22 MYT）记录；对应 OAuth callback 返回 HTTP 500。脱敏异常为 MySQL `1364`：`users.password` 没有默认值；该次 INSERT 未包含 `password` 列。用户邮箱、姓名、Google subject、数据库标识及完整 SQL 均不保留。随后只读查看当前 Plesk 生产 `GoogleAuthController.php`，确认现行 callback 新建用户时会写入随机 `password`；File Manager 显示该文件修改时间为 2026-11-21 16:08，和 Plesk main 当前最新提交 `f84cb98` 的时间吻合，本地 checkout 同一提交也包含该修复。因此有证据支持：15:22 的登录失败发生在 16:08 修复部署之前，现行代码路径已修复该字段问题；不能据此声称生产登录已动态验证成功，仍需受控登录验收。较早的 duplicate `users` table 异常堆栈经 UI 复核显示从 Laravel Tinker/PsySH 执行路径进入 migration；它证明当次 Tinker 触发的 migration 尝试遇到已存在表，不证明 Plesk post-deployment migration hook 失败。phpMyAdmin 当前只读显示 `migrations` 有 13 项：前 12 项 batch 1、support migration batch 2；`users` 当前有 10 个预期字段，其中 `password` 为 NOT NULL 且无默认值，与当前 migration 定义吻合。当前库共 38 张表。该快照说明当前 migration ledger 已登记初始迁移并且 users schema 存在，但不能还原历史执行、证明其余各表字段/数据安全或成为再次迁移许可；12 张历史表仍须逐表与来源/依赖映射。禁止删表、重放初始迁移或重置生产数据。其它 502/503 仍需分别关联。日志中的 OAuth query 参数及个人信息不复制。此前“无法取得异常摘要”及“当前代码/生产版本疑似漂移”的判断由本证据更新。

生产复核增量（2026-11-21 20:02 MYT，Codex 内部浏览器，只读）：主页 SSR 返回 200 并正常渲染；`/health` 为 `status=ok`、`database=ok`、`cache=ok`，但 release 字段仍为 `0973ac…`，与当前 Git `main@f84cb98` 不同，故健康端点不能证明当前服务代码 SHA。phpMyAdmin 只读确认 `erphpro` 共 38 张表、migrations 13 行，记录 batch 为 1/2；未浏览业务记录、未执行 SQL。以上为点时检查，不能代表持续可用、完整 schema 对齐或线上 OAuth 已成功。

AppSheet/源工作簿只读增量（2026-11-21，Codex 内部浏览器）：实际 `MODUL ADMIN` 视图确认审核、档案/记录打印、教师转校及 JPN/PPD 检查等流程入口；这些项目大多是外链教学材料，不能证明表单规则或实际落库。只读打开 Tingkatan 6 Google Sheets，确认 9 个标签及单页尺寸；DSKP 页 10,379 × 17，读到表头位置但不读业务行；日教案页有个人内容迹象，因此停止查看正文。详见 `docs/RPH_FORMAT_MAPPING.md` 的新证据段。Tingkatan 1–6、Tahun 1–6、PraSekolah、KAFA 模板、实际 Admin/Guru 表单条件/公式、完整 DSKP 字段语义与授权仍未核验；Phase 0 不得关闭这些项目或据菜单状态认定课程库完成。

同一 Tingkatan 6 样本 `DATA` 页的 1,001 × 89 尺寸、`KELAS`/`MASA`/`TARIKH`/`MINGGU` 表头及“在此设置每周日期”单元格注释已只读核验；不含记录正文、公式范围或数据验证规则。该表支持存在班级/时段/周日期设置区，但排课规则及至少五天等实际条件仍未证实。证据细节及限制见 `docs/RPH_FORMAT_MAPPING.md`。

Owner 新提供的长期使用版 `M41 1620112026` 与 KPM Tingkatan 6 样本完成了只读结构级对照：旧版可见 `MON`–`FRI` 五页和 `DATA`，另有 9 个隐藏页（含 `DAY 6`、`DSKP`、`SUBJEK` 与 `indirect D1`–`D6`）；KPM 样本有 `AHAD`–`KHAMIS`、独立 `RPT`/`DSKP` 和更宽的 `DATA`。它证明需要同时保留 Group A/B 日历以及旧版隐藏第六日/引用数据依赖的核验任务，但不能证明 Day 6 当前启用或旧/新字段等价。旧版 Google Sheets 现场显示任何持链接者可无登录访问，权限角色未知；未读记录或更改分享。KPM 作为更完整基线，旧版作为兼容性约束；Phase 0 仍须在安全的脱敏来源证据下完成逐字段、公式、验证和隐藏依赖双向矩阵。详见 `docs/RPH_FORMAT_MAPPING.md`。

Plesk 备份权限边界也已补入部署契约：可见的是父订阅 `w4chinese.com` 下 2026-11-21 00:24 的 5.67 GB“全部配置与内容”计划备份；从 eRPH 域名入口打开专属备份列表则被 Plesk 以跨订阅权限拒绝。两者都不能证明 eRPH 数据库备份可读或已完成恢复演练。Phase 0 恢复闸门继续保持未通过，需由有权访问 eRPH 订阅的操作员提供专属清单及隔离恢复证据；详见 `docs/PLESK_SSR_DEPLOYMENT.md`。

Plesk 快照恢复选择页只读补证（2026-11-21）：打开父订阅最新快照的对象选择页面后，页面显示可按数据库对象选择恢复，并列出 `erphpro`。没有选择对象或提交恢复。此证据只证明 Plesk 恢复目录列出一个 `erphpro` 对象，不证明快照归档字节完整、数据库内容确已写入归档、备份可读、恢复可成功或 RPO/RTO 达标；也不是 eRPH 独立备份证明。恢复门禁仍未通过。

Gemini 对本次备份增量的独立复核（2026-11-21，内部浏览器）：通过“目录元数据”与“归档完整性/隔离恢复成功”的界限审查；确认父订阅最新快照目录列有 `erphpro` 数据库对象、当前列表未显示该快照的 minor-issues 警告，但域名级备份访问仍受权限阻挡，且没有归档完整性或隔离恢复演练证据。该记录只降低“是否存在快照目录条目”的未知度，不关闭独立备份/可恢复性重大阻断；Phase 0 最新有效全套评分维持 **7.08/10**，数据安全/备份/迁移维度不变，Phase 1 继续 **HOLD**。这不是完整 Phase 0 满分复评。

2026-11-21 20:20 MYT 内部浏览器复查：线上 SSR 首页可打开，`/health` 为 `status=ok`、`database=ok`、`cache=ok`；health 仍报告 `0973ac…`，与本地/Plesk `main` 的 `f84cb98` 不符，故生产 served-tree 身份仍未闭合。Plesk 邮箱列表另确认 `admin@`、`hello@`、`noreply@erphpro.com` 三账号存在；收发、认证 DNS 和应用集成尚未验证。详见部署契约。

Firebase Hosting 只读复查（2026-11-21，内部浏览器）：`erph-pro` 项目的 Hosting 页面显示“Get started”初始设置界面，没有展示已部署版本清单。这降低了当前 Firebase Hosting 正在承载旧站的可能性，但不等同于验证所有 Hosting site/domain、Auth、Firestore、Storage 或历史数据均未使用；根目录 React/Firebase 代码与依赖仍须在确认托管域名、数据保留和归档策略后再清理。详见 `docs/FIREBASE_BRIDGE_PLAN.md`。

### Phase 0 当前闸门状态（证据截点：2026-11-21 21:05 MYT）

| 闸门 | 状态 | 已有证据 | 尚缺证据 / 放行条件 |
|---|---|---|---|
| 首页 503 事件 | **当前点测正常，历史故障及持续性未闭合** | `DirectoryIndex index.php` 修复提交、Plesk 文件时间与访问日志前后响应一致；2026-11-22 12:33 MYT 无登录 HTTP GET `/` 和 `/health` 均返回 200；12:34 外部浏览器也显示正式首页且无维护/503/timeout，health JSON 的 `status/database/cache` 为 `ok` | 这些只是连续数分钟内的点测，不证明连续可用、源站直连或 PHP-FPM/OPcache 实际 Git SHA；历史 503、错误日志新鲜度与持续稳定性仍待核验，不与 OAuth 错误混为一项 |
| 生产 served SHA | **受控 manifest 已匹配，运行身份仍未验证** | Plesk Git 与本地 `main` 为 `f84cb98`；三个关键文件及受控 128-file manifest 的 SHA-256 均与本地一致 | 排除的 runtime/vendor/config 与三个额外文件来源待核；health 的 `0973ac…` 是 `.env` release 标签而非提交证明；无 PHP-FPM 实际加载身份或带 SHA 的成功 hook 记录 |
| Plesk 自动部署/迁移副作用 | **Hook 路径已核验；部署 CLI 环境有新风险待确认** | hook 明确执行 `php` 版本守卫、`composer install`、`composer check-platform-reqs`、`migrate --force` 和 `SupportContentSeeder`；13 个 migration 的 up 操作已只读分类；SSH 默认 PATH 下 PHP 8.1.34 的平台检查失败，用 `/opt/plesk/php/8.3/bin/php` 显式执行则通过 | Hook 的实际 PATH/CLI 与 SSH shell 是否相同尚未证明；若同为 PHP 8.1.34，hook 会在迁移前版本守卫退出；`SupportContentSeeder` 会覆盖同 slug 编辑内容；migration down 会 drop 表；生产备份/恢复未验证，自动部署写路径未调整 |
| 身份/租户/会话隔离 | **未验证，存在配置风险** | 已找到一类密码字段缺省造成的 500，并有代码修正时间证据；Plesk `.env` 摘要显示 `APP_DEBUG=false` 与 `SESSION_DOMAIN=.erphpro.com` | 其他 OAuth 502/503 未关联；无受控成功登录或跨校/跨角色负向验收；访问日志曾暴露 callback query 参数；宽域 cookie 与平台/学校隔离契约不一致风险未通过运行态验证 |
| 数据库/备份恢复 | **未验证** | 生产只读盘点见 38 张表、13 条 migration 记录；12 张表不由当前 SSR migrations 定义/管理，并已完成表名及估算行数对账；父订阅存在计划备份 | 12 张表的数据来源、消费者与外部依赖未明；eRPH 专属备份列表因跨订阅权限被拒；无可读性/隔离恢复演练证据；未做清理 |
| 队列/Cron | **部分验证** | Plesk Scheduled Tasks 页面为空；当前 SSR 源码未发现应用内常驻 worker/scheduler 注册；生产 `.env` 摘要确认 `QUEUE_CONNECTION=database` | 外部 worker 是否运行、队列积压/失败数量与消费时效均未核验；不能由空 Cron 页面推定不存在外部 worker；须获授权只读核验和可重复执行证据 |
| 平台级 Admin 后台 | **缺口已确认，待 Phase 1** | 生产 `main@f84cb98` 的历史本地清单为 48 条路由；当前候选源码 `665ec33` 清单为 50 条，其中 8 条 Owner 路由仅覆盖登录、只读概览、审计和工单；候选中仍无学校生命周期、平台 RBAC、全局运营端点。未查询生产当前路由 | 按 PLT-01 Phase 1 建立独立 control plane；此处仅记录代码差距，不以学校 Admin 代替平台后台，也不把候选清单当作生产证据 |
| RPH/AppSheet 规则与模板 | **部分验证，长期版有限结构子项关闭** | 已看菜单级流程、KPM 及长期版工作簿；只读核对长期版 MENU/五个日页/DSKP/SUBJEK/DATA 与一张隐藏间接表：确认重复 RPH 字段族、数据验证/公式引用和五天实际节次差异；已记录 Group A/B 周历与 Day 6 线索 | 最新完整 KPM 课程内容仍为规范基线；长期版全公式/命名范围、AppSheet 条件、Day 6 启用逻辑、完整打印行为、受限流程链接及字段双向映射未完成；原表共享权限/隐私边界待数据所有者确认 |
| DSKP 数据与权利 | **结构已观察，内容/权利未验证** | 生产 `dskp_standards` 约 46,967 行（引擎估值），10 个字段、无 `school_id`，本轮未读取数据行；另有 tenant-aware `curriculum_items` schema | 内容版本、来源/授权、年级学科覆盖、两表映射及实际消费者未核验；数量不代表完整或可用 |
| Firebase/旧 React 清理 | **部分验证** | 旧根工程仍有 Firebase imports、构建变量、部署/seed 入口；此前只读查看的是 `erph-pro` 控制台，而候选 `.firebaserc` 默认手动部署目标为 `erphprocom`，项目身份尚未对齐 | `erph-pro` 的 Hosting 页面未证明 `erphprocom` 或任何其他站点、Auth/Firestore/Storage 与历史数据都未使用；核对准确项目身份、域名/数据归属并完成归档核验前，不删依赖或资源，也不运行旧部署/seed 命令 |
| Email 与外部集成 | **部分验证** | Plesk 有 admin/hello/noreply 三个邮箱账号 | 收发、SPF/DKIM/DMARC、Laravel mail transport、Drive/Telegram/DeepSeek 配置和数据出站边界均未验证；不读取或回显 secret |

部署树哈希增量（2026-11-21 20:49 MYT，Plesk 内部 SSH Terminal 与本地文件）：部署路径中 `GoogleAuthController.php`、`routes/web.php`、`SupportContentSeeder.php` 三个 SHA-256 均与本地 `f84cb98` checkout 对应文件完全一致。后续 21:05 MYT 扩展到受控 manifest（`app bootstrap config database public resources routes tests` 与明确列出的根级构建/锁定文件；排除 `vendor`、`.env`、运行缓存、`storage`、`public/hot` 和本地 SQLite）：本地与 Plesk 同为 `294cc31fd4092f52c75a870450212b6f6bf7652942e9037178182e099745080b`。这将受控范围内的代码、迁移/seed、模板/路由、测试和已构建 public assets 提升为逐文件内容一致；不等于整个部署树或 PHP-FPM 实际加载字节已被证明一致。Plesk 部署树共有 131 个非排除文件，本地受控 checkout 清单为 128 个；额外文件 `.node-version`（值 `22`）、`bin/composer`（独立 PHP 可执行 artifact）和 `stderr.log`（只确认类型/大小/哈希，未读内容）仍待归属及生命周期确认，均未删除。Plesk `.env` 的非 secret 摘要显示 `APP_ENV=production`、`APP_DEBUG=false`、`RELEASE_VERSION=0973ac7474e915ed6cd9027829c47f547daad043`、`SESSION_DOMAIN=.erphpro.com`、`QUEUE_CONNECTION=database`；HealthController 返回配置中的 `app.release_version`，故 health 值是 `.env` 配置标签而非独立计算的 Git/served SHA。PHP 8.3.37 FastCGI，OPcache 显示 enabled (Default)，但 `opcache.validate_timestamps` 未在设置页暴露。应用源码和示例配置均将 session cookie domain 设为跨子域 `.erphpro.com`；后续 2026-11-22 13:09 MYT 未认证根域 HTTP 响应也实际发出该 Domain 属性，确认 Cookie 作用域与平台/学校隔离要求冲突。认证请求是否接受跨 host session、Guard 行为和 CSRF 可利用性仍未通过运行态验证。Plesk 可见事实为只读摘要；未展示 `.env` secret、日志内容或业务数据，未改配置、文件、数据库，未触发 Pull/Deploy。

RPH 源工作簿增量（2026-11-21 20:54 MYT，Google Sheets 只读）：本轮链接再次确认是 Owner 长期使用版 `M41 1620112026`，不是最新 KPM 版本；有限结构范围补确认 5 个日页各自有重复教学字段、验证/公式引用、21 个已填时段块及隐藏 DSKP/SUBJEK/辅助表。证据不含任何真实教师/学生记录；原始结构审查发现的可识别学校/人员/教案内容均未写入仓库。该增量加强字段族及课表动态生成要求，但不关闭全字段、条件、公式、打印和权利核验，RPH 闸门仍为部分验证。

**Phase 0 第六轮 Gemini 独立增量审查（2026-11-21，长期校本 workbook 单元格结构/验证元数据）**：Gemini 同意关闭一个有限子项——Owner 长期版的 RPH 字段族、日页重复 `WAKTU` 块、级联 validation 依赖结构的只读核对；明确它仅是校本兼容参考，最新/完整 KPM workbook 仍作为课程内容与规范字段基线。未关闭公式链、命名范围、AppSheet 动态条件、隐藏 `DAY 6`、打印版式、共享角色与版权边界。六维评分为：证据边界 9.5、代码/部署 6.5、基础设施 6.0、数据安全/备份 5.0、身份/租户 5.0、业务映射 8.5；Gemini 给出的精确加权总分 **6.75/10**（显示约 6.8/10），未达 10/10。Blocker-1 至 Blocker-5 仍全部保留；Phase 1 维持 HOLD。该复核是证据等级判断，不授权代码、生产、日志、数据库或部署变更。

**当前处置：Phase 0 尚未通过，不进入 Phase 1。** 本地路由、依赖与生产可见状态已形成审查基线；需要订阅权限、数据所有者/课程权利负责人或受控验证的条目，仍按上表留在对应闸门。应将此表与 `docs/PLESK_SSR_DEPLOYMENT.md`、`docs/RPH_FORMAT_MAPPING.md`、`docs/FIREBASE_BRIDGE_PLAN.md` 一并交 Gemini 审查证据充分性、错误推断与缺口责任，不以已通过的计划第 7 版 Gemini 评分替代 Phase 0 证据审查。

### Phase 0 第七轮 Gemini 独立增量复评（2026-11-21，Plesk manifest / masked runtime settings）

通过 Codex 内部浏览器向既有 Gemini Phase 0 审查线程提交本轮脱敏增量。Gemini 总分 **7.08/10**（约 7.1），未达 10/10；裁决 **Phase 1 HOLD**。六维分数：证据边界 9.5、代码/部署基线 8.0、基础设施/可用性 6.5、数据安全/备份/迁移 5.0、身份/租户/审计 5.0、业务/外部依赖映射 8.5。该次外部复核认为受控 128-file manifest 一致使代码/部署维度 +1.5，`.env` allowlist 与 PHP/OPcache 只读设置使基础设施维度 +0.5；没有因此关闭任何运行时、安全或灾备重大闸门。

审查接受的有限闭环：受控清单范围与本地 `f84cb98` 逐文件一致；`/health` 的 `0973ac…` 根因是部署 `.env` 中静态 `RELEASE_VERSION` 经配置映射返回，而不是该字段本身证明部署了旧代码；`APP_ENV=production`、`APP_DEBUG=false` 与 `QUEUE_CONNECTION=database` 已由 allowlist 核实。必要限定：这不证明 `vendor`、PHP-FPM 内存中的字节码或 hook provenance；`opcache.validate_timestamps` 仍未知。Gemini 将三个额外文件称为 Plesk 运行/构建残留是其推断，不是已验证来源；仍待确认。空 Scheduled Tasks 页面与源码未发现应用 worker 不能证明不存在外部 worker，因此不能把队列“无人消费”写成既定生产事实；应通过获授权的只读 queue/worker 证据确认。

Gemini 保留的重大阻断：自动部署执行 `migrate --force` 且 `SupportContentSeeder` 可覆盖线上编辑；无法验证 eRPH 独立可恢复 DB 备份，12 张非 migration 表来源/消费者未明；OAuth callback 与工单 bearer token URL/query 及日志处置未闭环；没有 model-level tenant global-scope 兜底及跨学校/角色负向运行验证；数据库队列消费机制与 OPcache/FPM 运行态仍未闭环。非重大项包括 vendor 与 lock 对齐、未读 `stderr.log` 的归属/历史错误核验、工作簿深层公式/条件/权限、DSKP 权利映射、邮件 DNS/Firebase 收尾和同步 DeepSeek/SMTP 超时风险。

Gemini 给出的 Phase 0B 最小复核集合为：经授权止血 Seeder 覆盖并为 release 标记/OPcache 生效建立可关联证据；取得可独立解析/恢复、覆盖全表的 DB 快照及 12 张历史表保留清单；修正 URL bearer-token 传递并界定历史访问日志处置；建立 tenant 级访问兜底并完成 Owner/School Admin 与跨校负向验证；只读检查 `jobs`/`failed_jobs` 与实际 worker 消费机制。Gemini 的分数与建议是第三方质量审查，不构成代码、服务器、数据库、日志或部署变更授权；上述生产写入类整改仍须遵守 Phase 0 当前授权边界。

**工单令牌候选代码状态更新（2026-11-21）**：本地代码候选分支 `codex/phase0-code-candidates`（SHA `b8afbcc33b1b04b02b1aabc1627d4d5238f137e4`）已将新工单访问凭据保存在当前浏览器会话、移除生成 URL 中的 bearer token，并让旧 `?token=` URL 清理后不授予访问权；候选里有会话访问与旧令牌拒绝的特性测试。生产 `main@f84cb98` 仍是 URL token 修复前版本。候选未推送/部署，本轮未执行测试；历史访问日志是否含令牌及其保留/处置仍未确认。此项仅说明本地修复候选已存在，不关闭生产身份/日志闸门，也不改变 Phase 0 的 **7.08/10 HOLD**。

**工单令牌文档增量 Gemini 终审（2026-11-21，Codex 内部浏览器）**：将 GitHub 仓库 `https://github.com/AidenChan2025/eRPH-PRO`、本地候选完整 SHA、生产 `main@f84cb98`、未运行测试状态及两份文档的精确修订文本提交 Gemini 复核。Gemini 对本次窄范围文档/证据增量评分 **10/10**，认为事实准确、候选与生产边界清楚、历史日志风险未被淡化、无敏感数据外露，且没有剩余文字修改。该分数只适用于此增量；Gemini 明确整体 Phase 0 仍为 **7.08/10 HOLD**，不关闭生产工单身份/日志或其它阻断闸门。候选 SHA 未推送，测试未执行，生产未变更。

### Phase 0 第八轮 Gemini 独立增量复评（2026-11-21，Plesk CLI 断层与工作簿 UI 交叉核验）

本轮将 Plesk 默认 SSH CLI、显式 Plesk PHP 8.3 Composer 平台检查结果及部署脚本静态调用方式提交至既有 Gemini 审查线程；同时提供了再次从内部浏览器确认 Owner 长期校本表与既有 M41 记录相同的脱敏结构摘要。未向 Gemini 发送工作簿中可识别的学校/教师资料或教案正文。

Gemini 更新六维评分为：证据边界 9.5（不变）、代码/部署一致性 7.5（从 8.0 下调 0.5）、基础设施 6.5（不变）、数据安全/备份/迁移 5.0（不变）、身份/租户/审计 5.0（不变）、业务/外部依赖 8.5（不变）；总分 **7.00/10**，未达 10/10。工作簿 UI 7 个可见标签与此前 16 个含隐藏标签的元数据相互印证，属于交叉确认，不重复加分。PHP 8.3.37 下 `composer check-platform-reqs --no-dev` 通过，被认定为关闭了“生产 vendor 与 PHP 8.3 平台要求不兼容”的局部子项。

新增/强化的重大风险是 `scripts/deploy-ssr.sh` 裸调用 `php`、`composer` 而没有固定 Plesk PHP 8.3 CLI 路径。在 SSH 默认 PHP 8.1.34 下 hook 若继承相同 PATH，会在 migration 前版本守卫处失败；Gemini 明确这仍是条件推断，因 hook 实际 PATH 未取证而不能说真实部署已失败。它将此风险并入既有 Blocker-1（不可靠且具有破坏性的自动部署：CLI 路径未锁定、`migrate --force`、覆盖式 `SupportContentSeeder`）。其余四项重大阻断不变：独立数据库备份/12 张非 migration 表依赖；OAuth/工单 token URL 与日志处置；模型级 tenant scope 和跨角色/跨校负向验证；database queue 消费、OPcache 与 release label 运行态闭环。Minor 仍包括同步外部调用超时、vendor 全量哈希与 `stderr.log` 归属、工作簿隐藏公式/命名范围/AppSheet 条件/Day 6/打印/分享权限、DSKP 授权与迁移映射、邮件 DNS 和 Firebase 收尾。

Gemini 建议下一步从 Plesk Git 扩展只读查看 Additional deployment actions 与最近历史结果，并只读确认非交互环境 PHP 路径；不得点击 Pull/Deploy，不读取日志中的 token、个人或业务内容。该建议只作为证据获取路线，不构成任何配置或发布授权。Phase 0 状态仍 HOLD，Phase 1 不得开始。详见 `docs/PLESK_SSR_DEPLOYMENT.md` 中该轮证据与可验证边界。

### Phase 0 增量：Plesk 默认 CLI 与部署依赖核验（2026-11-21 21:13 MYT，只读）

Plesk SSH Terminal 中 `command -v php` 指向 `/usr/bin/php`，`php -v` 显示 CLI 8.1.34；`./bin/composer check-platform-reqs --no-dev` 因锁定依赖 `brick/math 0.14.8` 要求 PHP `^8.2` 而失败。服务器存在 `/opt/plesk/php/8.3/bin/php`；以该二进制执行 `/home/w4chinese.com/erphpro.com/ssr/bin/composer check-platform-reqs --no-dev` 后，`composer-runtime-api`、PHP 8.3.37 与全部已列生产扩展均显示 success。该检查只读取已安装 `vendor` 和 PHP 平台，不安装依赖、不执行脚本、不改文件。

静态查看 `scripts/deploy-ssr.sh` 发现 hook 调用裸 `php` 与 `composer`，并先以裸 `php` 执行 PHP 8.3 最低版本守卫，随后才运行 Composer、migration 与 seeder；脚本没有显式选择 `/opt/plesk/php/8.3/bin/php`。因此若 Plesk Git hook 继承与 SSH 登录 shell 相同的 PATH，它会在任何生产迁移前因默认 PHP 8.1.34 失败；但本轮没有实际触发 hook，且尚未取得 hook 的有效 PATH/执行环境证据，不能断言每次真实部署必然失败。Plesk 网站 PHP Settings 的 FastCGI 8.3.37 与 shell CLI 是不同 SAPI/路径，不能相互代证。

此项加入部署准出核验：获取不触发部署的 hook 执行环境/历史成功日志证据，确认其 `PHP_BINARY`、`PHP_VERSION`、Composer binary 和平台检查结果；若需修正脚本，先完成代码审查、独立数据恢复与 Seeder 防覆盖门禁，再安排受控发布，不直接在当前 `main` 上改动或触发自动部署。

### Phase 0 首轮 Gemini 独立审查（2026-11-21）

使用 Codex 内部浏览器向 Gemini 提交了脱敏闸门摘要（不含 secret、个人业务记录、邮箱地址或 OAuth 参数）。Gemini 总评 **6.8/10，Phase 1 HOLD**：认为记录质量诚实、点时和持续状态区分清楚，但运行闸门不足；仅将平台后台缺口现状及本地只读路由审计标为事实已关闭，其余均部分验证或未验证。分项为证据边界 9.0、代码/部署一致性 5.0、基础设施/可用性 6.0、数据备份/迁移治理 4.5、身份/审计 4.5、业务与外部依赖映射 6.5。

Gemini 提出的阻断关注包括：served SHA/release 标签不一致；`main` 自动部署会执行迁移并重写 seeded support 内容；eRPH 专属备份与历史表归属未核实；OAuth callback query 曾进入 access log且未核对脱敏/留存；旧 workbook 的免登录共享状态；以及未提交非敏感运行配置、租户边界、外部调用、文件持久化与隐私评估证据。它建议的历史日志清除、部署钩子改动、工作簿权限调整和登录测试均属于实际写入/外发或安全敏感操作；Gemini 审查意见本身不构成授权，Phase 0 只读取证边界仍有效。对“凭证可重放”“PDPA 已确定适用”“全部 12 表均为孤儿表”等推断不作为既定事实，需用证据和适格责任人复核。

## Phase 0B 本地只读补充：租户与外部调用映射

遵循 Ponytail 的“先读调用链与数据流、再判断删改；不以缩小实现替代安全检查”审查方式，对当前 SSR 路由、控制器、中间件与服务做了静态跟踪，未改应用代码、未运行测试：

- 学校路由通过主机名解析单一 active school；`school.member` 再校验 active membership、期限与角色。RPH/workspace/report/controller 中可见多处显式 `school_id` 过滤和对象归属检查。但模型没有统一 tenant global scope，Owner 路由使用默认 `auth` guard；`.env.example` 设有跨子域 session domain。故源码只证明存在部分租户过滤，不能证明全部请求/会话隔离；生产环境值与跨租户负向运行验收仍缺。
- `SupportTicketController::store` 同步调用 `SupportAIService::analyse`。当 DeepSeek key 配置存在时，服务把用户提交的主题和最新公开消息（截断后）发送到配置的 `/chat/completions`；响应写入 ticket AI 摘要/分类/优先级/回复草稿。代码路径未自动把草稿发给提问者；敏感类别/低置信度需人工处理。实际是否配置 key、服务商数据保留/处理区域、用户告知与师生个人数据限制均未核实。
- SSR 可见外发调用目前包括 DeepSeek HTTP、Google OAuth provider、以及工单创建/客服回复的同步 Laravel Mail。当前 SSR 应用扫描未发现 Drive API、Telegram 或 WhatsApp SDK/HTTP 调用。此结论限于扫描的 SSR 源码，不覆盖根目录旧 React、Plesk 外部工具或环境配置。
- 工单创建后以 query token 作为 bearer access token 重定向至公开票据；请求方后续可经带 token 的 URL进入详情，再由应用存入 session 并重定向去掉 token。由于 token 首次出现在 URL，可能进入 Web access log、浏览器历史或 Referer；需将票据 token 的 URL 暴露面加入安全阻断清单，尚未修改线上日志或路由。
- 应用目前未见附件上传或 `Storage` 写调用；Laravel filesystem 默认 disk 来自环境，默认配置指向本地 private storage，但 Plesk 上 `storage` 的实际权限、部署间持久性、symlink 与备份覆盖规则尚未核验。Plesk Hosting Settings 页面只读打开时返回 `ServerParseError`（响应以跨 subscription session 文本开头而非预期 JSON），因此当前账号无法由该 UI 页面取得 domain-specific 配置证据；没有重试写入或更改订阅。

上述补充收窄了“外部依赖未知”的说法，但未关闭运行闸门。Phase 0B 仍须解决可安全读取的环境与租户配置证据、票据/ OAuth URL 敏感值处理方案、部署/备份风险、源工作簿授权以及适用的隐私审查；任何生产清理、日志删除、Plesk 配置变更或用户外发需在具体动作与影响范围审定后执行。

### Phase 0B 增量：Owner 长期校本 eRPH 工作簿（2026-11-21，只读）

Owner 新提供的 `M41 1620112026` 表已通过 Google Drive 连接器只读核验元数据与有限结构范围。确认 16 个标签，覆盖 `MON`–`FRI`、隐藏 `DAY 6`、隐藏 `DSKP`/`SUBJEK`、`DATA` 与 `indirect D1`–`D6` 辅助标签；`SUBJEK` 字段包含日期/周次/审核者、班级与时间、科目/年级/主题、SK/SP 和学习目标，`DSKP` 前三列是年级或科目、SK、SP。源表包含可识别学校/人员信息，故仅读取少数结构单元格并停止扩展；未读取身份数据行、未导出/复制/编辑工作簿。详细标签、范围尺寸与局限见 `docs/RPH_FORMAT_MAPPING.md`。

该证据补强 Owner 现行流程和兼容字段观察，不改变 Phase 0 的 **HOLD**：最新最完整 KPM 来源仍是内容标准基线；Owner 长期版用于验证实际操作习惯与不得丢失的额外条件。隐藏页公式、数据验证、完整打印/提交行为、来源许可/共享范围与 DSKP 覆盖矩阵仍未核验。该证据已提交 Gemini Phase 0 复评；不据此启动 Phase 1 或扩大生产数据读取。

### Phase 0B 增量 Gemini 第三轮复评（2026-11-21）

使用 Codex 内部浏览器将上述脱敏结构增量提交 Gemini 复核。Gemini 最新总分 **6.33/10（未达 10/10）**，记录质量 **9.5/10**，Phase 0 仍为 **HOLD，不得进入 Phase 1**。业务/外部依赖映射从 7.0 升至 7.5，其余维度未变：证据边界 9.5、代码部署一致性 5.5、基础设施可用性 6.0、数据安全/备份/迁移 4.5、身份/租户/审计 5.0。

Gemini 确认本轮只关闭了“Owner 校本工作簿核心结构与字段映射”这一增量子项；16 个标签及 `SUBJEK` 字段与 KPM 基线分工清楚，但隐藏公式、验证规则、完整 AppSheet 条件、打印字段、实际共享角色和课程覆盖仍未验证。五项重大阻断仍是生产运行 SHA 与 Git 不一致、自动部署迁移/Seeder 覆盖风险、备份可恢复性与 12 张非迁移历史表依赖待查、OAuth/工单 bearer token 的 URL query 与日志处置未闭合、租户隔离缺少模型层兜底与跨租户负向验证。新增工作簿证据没有改变任一运行时阻断项。

Gemini 同时要求精确区分“链接可免登录访问”的现场观察与“Drive 分享角色/权限列表已审计”：当前仅能确认前者，后者尚未检查；不得自行更改分享配置。前两轮用语若把免登录访问直接概括为公开权限已审计，应以此修正。Gemini 的安全整改建议不构成生产、日志、应用代码或分享权限变更授权。

### Phase 0B 增量：生产数据库非迁移表对账（2026-11-21，只读；Gemini 第四轮复评已完成）

通过内部浏览器 phpMyAdmin 查看 `erphpro` 数据库结构清单（38 张表）与 `dskp_standards` 字段结构；没有执行 SQL、打开 Browse/数据行、导出或改动数据库。将生产表名与 13 个本地 migration 文件中 `Schema::create/table` 逐项对照，确认“12 张不在 migration ledger 中”应表述为“12 张生产表未由当前 SSR migrations 定义/管理”，这不等于未使用或可删除。phpMyAdmin 表清单估算总行数约 47,039，其中 `dskp_standards` 约 46,967 行；表引擎的行数可能是估算值，不作精确数据量/记录完整度证明。

12 张表及只读行数估计：有行数的为 `articles` 1、`dskp_standards` 46,967、`legacy_lesson_plans` 1、`legacy_schools` 1、`legacy_users` 3、`system_settings` 1、`tasks` 1；显示 0 的为 `calendar_events`、`leave_records`、`notifications`、`reference_items`、`timetable_templates`。即使显示 0，也只能代表该次面板统计，不证明没有外部/应用引用。

`dskp_standards` 字段为 `id`、`school_type`、`subject`、`grade`、`content_standard`、`learning_standard`、`tema_bidang`、`tema`、`tajuk_kemahiran`、`tajuk`；结构中没有 `school_id`。该表显然是当前生产数据库里的大量课标资料，不能称为孤儿表或因 migration 不管理而删除；须确认权威版本、来源/使用权、生产消费方、与 tenant-aware `curriculum_items` 的字段/重复/覆盖关系及无损迁移策略。未读取其内容。

对当前 `ssr/app`、`ssr/routes`、`ssr/database`、`ssr/config` 的静态文本搜索未发现这 12 个名字的 SQL 读写调用。根目录旧前端中发现 Firebase Firestore 对 `tasks`、`articles`、`dskp_standards` 同名 collection 的调用，以及 `services/api.ts` 对旧 REST 路径的封装；这与 Plesk MariaDB 的同名表是不同数据源，不能据此证明生产 SQL 表由该前端使用或已停用。其余表的外部应用、脚本、手工导入/导出或历史生产路径仍未核清。尤其 `legacy_*` 表有非零估算行数，可能含人员/教案资料；绝不查看行、清空或删除，须由数据所有者做受控归属和保留决策。

这项结构/代码交叉核对缩小了数据迁移治理的不确定范围，也把 `dskp_standards` 由“仅有表名、依赖未知”提升为“生产实际存在的大型课标数据集、当前 SSR 无直接引用、权威性和使用方未确认”。早前 2026-11-21 18:51 的历史现场记录曾显示 phpMyAdmin Browse 首屏渲染过课标文本；本轮 18:44 对账没有打开 Browse、读取或复制任何数据行，二者是不同时间的证据，不能把本轮描述扩大为整个 Phase 0 从未查看过数据内容。

Gemini 第四轮已审查本次数据库增量，整体 **6.50/10，未达 10/10；Phase 1 HOLD**。本轮完成项是 38 张生产表与 13 条 repository migration 记录的结构对账、12 张未由当前 SSR migrations 定义/管理的表及面板估算行数、`dskp_standards` 结构观察；备份/恢复仍无可验证证据。五项主要阻断继续存在：生产运行 SHA 与 Git/health label 未闭环；自动部署 migration 与 Seeder 覆盖风险；备份可恢复性及非 migration 表依赖未明；OAuth/工单 bearer token URL 暴露；模型层租户隔离兜底与跨租户负向运行验证不足。DSKP 的结构已观察，但来源、授权、覆盖、映射及消费者仍未验证。Gemini 关于同名 Firebase collection 与 MariaDB 表可能存在历史演进关系的说法属于推测，未独立证实，不作为事实或决策依据。该轮分数只代表本轮提交材料的评审，不构成 Phase 0 通过或生产变更授权。

该证据没有关闭备份可恢复、历史内容保护、生产运行版本、Seeder 覆盖或租户隔离闸门；Phase 1 仍不得启动。后续须逐项补齐阻断证据并再次交 Gemini 复评，直至明确 10/10 且无重大未解决项。

### Phase 0 增量：Plesk Git 配置 PATH 与 CLI 解析闭环（2026-11-21，只读，待 Gemini 复评）

Plesk Git 设置页显示 `main` 自动部署，并在 post-deployment action 中显式设置 PATH 前缀 `/home/<subscription>/erphpro.com/ssr/bin:/opt/plesk/php/8.3/bin:$PATH` 后调用部署脚本。未点击 Pull、Deploy 或 Apply。为避免执行部署钩子，在 SSH Terminal 的子 shell 中仅复现该 PATH 前缀并只读运行 `command -v php`、输出 `PHP_BINARY`/版本、`command -v composer` 及 `composer check-platform-reqs --no-dev`；解析结果为 PHP `/opt/plesk/php/8.3/bin/php` 8.3.37、Composer `/home/<subscription>/erphpro.com/ssr/bin/composer`，所有平台要求通过。没有执行迁移、Seeder、缓存命令或 HTTP 探测。

因此上一轮对“真实配置可能继承 SSH 默认 PHP 8.1.34”的推断得到修正：当前可见 Plesk post-deploy action 已将 PHP 8.3 CLI 放在 PATH 前面，且仿真解析结果与 Composer 依赖校验通过；不能继续把该配置描述为默认使用 PHP 8.1。边界仍是没有 timestamped hook output 或实际 hook 进程证据，子 shell 复现不等于真实部署运行。`migrate --force`、覆盖式 `SupportContentSeeder`、备份/恢复与回滚门禁仍然存在，故即使 CLI 子项闭合也不自动放行部署或 Phase 1。

本轮只读取 Plesk 配置和无副作用的运行时解析结果，未读取/复制配置页中的无关认证材料；未改工作簿、代码、服务器设置、生产数据，也未触发部署。详见 `docs/PLESK_SSR_DEPLOYMENT.md`。

### Phase 0 第九轮 Gemini 独立增量复评（2026-11-21，post-deployment PATH 只读核验）

Gemini 明确撤回批次八“当前自动部署可能沿用 SSH PHP 8.1、因而很可能一推即挂”的推断：已观察到 Plesk 的 post-deployment action 在运行部署脚本前把项目 `ssr/bin` 与 `/opt/plesk/php/8.3/bin` 放到 PATH 前面；等价只读子 shell 确认 PHP 8.3.37、项目 Composer 路径及平台检查均通过。CLI 路径问题从独立重大阻断正式降为 `scripts/deploy-ssr.sh` 的次要防御性增强建议；真实 hook 的带时间戳执行结果仍未取得，故不能声称已实测部署成功。

Gemini 将代码/部署一致性由 7.5 回调至 8.0，其余维度维持：证据边界 9.5、基础设施 6.5、数据安全/备份/迁移 5.0、身份/租户/审计 5.0、业务映射 8.5；总分 **7.08/10**，未达满分。Phase 0 运行门禁仍 HOLD，Phase 1 不得启动。持续有效的五项重大阻断是：自动部署无发布前备份而执行 `migrate --force` 并以 `SupportContentSeeder` 覆写已有内容；独立可恢复备份与 12 张非 migration 表依赖/保留未知；OAuth/工单 bearer token URL 暴露及访问日志处置；模型层租户隔离兜底及跨校/跨角色负向运行验证；database queue 消费和 FastCGI OPcache/release label 闭环。同步外部调用、部署目录 `stderr.log`/vendor 完整性、校本表隐藏逻辑/共享权限、DSKP 权利与映射、邮件 DNS/Firebase 收尾仍属 minor。CLI 路径复核没有关闭上述重大项。

Gemini 建议继续只读核对 `jobs` 与 `failed_jobs` 的表状态/估算行数，以及是否有脱敏后的历史部署成功痕迹；该建议不授权读取任务 payload、原始日志正文或触发部署。对生产队列只允许读取表结构/统计元数据，避免展示任何业务内容。上述批次评分与结论已同步写入 `docs/PLESK_SSR_DEPLOYMENT.md` 与本 Phase 0 证据记录，不是部署授权。

### Phase 0 增量：生产队列表统计元数据（2026-11-21，只读）

在内部浏览器 phpMyAdmin 的 `erphpro` 数据库结构汇总页只读查看行数估计：`jobs` 为 0、`failed_jobs` 为 0，`job_batches` 也为 0。没有打开任何表的 Browse 视图、没有读取 payload/异常字段、没有执行 SQL、导出或写操作。InnoDB 行数是面板估算，不构成精确计数保证；该点时证据说明未观察到当前积压/失败记录，但不证明生产队列已正确消费、曾经没有失败，也不排除 Plesk 外部 worker、cron 或其他消费者。现有“`QUEUE_CONNECTION=database` 且 Plesk Scheduled Tasks 为空”的运行机制缺口仍需核实。

#### Gemini 批次十状态：未能完成独立复评

通过 Codex 内部浏览器先后两次向现有 Gemini Phase 0 线程提交了仅含上述脱敏元数据的短评审请求。Gemini 分别回复“由于程序代码的局限，我没法办到”和“我只是一个语言模型，不能理解或回复你的这个问题”，均未提供技术判断、分项或总分。因此批次十记为**未评审/无新评分**，不得将其描述为通过或第三方确认。最新有效评分仍是批次九的 **7.08/10**；Phase 1 继续 **HOLD**。在获得有效独立评审前，本轮不重分类队列消费者/端到端消费机制这一重大门禁；零估算行数仅是“当前快照未观察到队列行”，不是 worker 健康证据。可在后续审查时把问题拆成“当前元数据快照无可见积压”和“消费者及端到端交付机制未证”两项分别评价。

队列运行态只读补证（2026-11-21，Plesk 内部 SSH Terminal）：只输出计数的进程过滤发现当前 0 个 PHP 进程匹配 Laravel `artisan` 队列/调度 worker 名称（`queue:work`、`queue:listen`、`horizon`、`schedule:work`）；当前订阅用户 crontab 的同类匹配项为 0。第一次宽泛进程过滤将自身 shell 命令计为 1，已收窄为仅匹配 PHP 进程名并重新核验为 0。未输出进程参数全文、环境变量或 crontab 内容。与 Plesk Scheduled Tasks 空列表合并看，所检查运行面没有当前 worker/scheduler 的正面证据；范围不包含其他系统账号、外部 worker、不同名称的包装服务或瞬时短任务，故结论是“尚未证明消费者配置和交付”，不是断言全主机不存在任意消费者。队列功能与运行 gate 继续未通过；该点时计数不能代替异步端到端投递验证。详见 `docs/PLESK_SSR_DEPLOYMENT.md`。

Gemini 对队列运行态增量的独立复核（2026-11-21，内部浏览器）：认定证据足以确认“当前已检查的订阅用户范围内没有活跃 Laravel worker/scheduler，也没有 crontab 条目”，且与 Plesk Scheduled Tasks 空页、`QUEUE_CONNECTION=database` 以及 `jobs`/`failed_jobs`/`job_batches` 估算为 0 的元数据相符；同时保留 root cron、其他用户、外部/改名 worker 和瞬时进程等边界。Queue consumer blocker 维持未关闭并进一步坐实，Phase 0 最新有效全套评分仍 **7.08/10**，Phase 1 仍 **HOLD**。Gemini提出两种待验证处置方向：为生产建立并验收受控消费者/调度机制，或在消费者能力未就绪时评估同步队列策略；这只是审查建议，不是生产配置授权或已批准架构决策。须先与通知/批量导出/定时任务需求、Plesk 资源限制及故障语义合并设计，再在隔离环境证明后进入受控生产验收。

生产可用性只读复查（2026-11-21 21:46 MYT，Codex 内部浏览器）：根路径重新渲染 Laravel SSR 官网，`/health` 返回 `status/database/cache=ok`、`app=eRPH Pro`。其 `release` 仍为配置标识 `0973ac7474e915ed6cd9027829c47f547daad043`，没有证明线上服务字节对应此 SHA。该观察只更新首页与健康端点的单点状态，不代替 503 持续稳定监测、Git/served tree SHA 绑定或完整 Phase 0 Gemini 10/10 复评；阶段状态与 7.08/10 最新有效评分不变。

Phase 0B 发布数据保全候选（2026-11-21）：隔离工作树分支 `codex/phase0-support-seeder-preserve` 已提交 `dde50ea0edd7dc2a3763ef61d6b4ca13cfa19639`，将 `SupportContentSeeder` 的两处 `updateOrCreate` 改为仅按唯一 `slug` 执行 `firstOrCreate`，避免重复部署覆盖已有 FAQ 编辑。Ponytail 审查覆盖调用链、两条 Seeder 入口、slug 唯一索引及模型删除语义；Gemini 按锁定 Laravel 12.73.0 源码作代码范围 PASS。该提交仅在隔离候选分支，未合入本地 `main`、未推送、未部署、未运行测试。生产 `main@f84cb98` 仍使用 `updateOrCreate`，自动部署覆写风险在生产门禁中仍有效；即使候选修复之后被合入，自动 `migrate --force` 与缺少发布前可读备份/恢复门禁仍须单独解决。详见 `docs/PLESK_SSR_DEPLOYMENT.md`。

### Phase 0 工作区改动归属复核（2026-11-21，Gemini 6.5/10，未通过）

本轮在 Codex 内部浏览器向 Gemini 提交主工作区 `git status`、staged/unstaged 文件清单、候选 worktree 状态和 Phase 0 门禁摘要，要求只审查改动归属及阶段边界。Gemini 评分 **6.5/10，FAIL**：确认架构计划、Plesk 现场证据、RPH 映射、Firebase 边界文件属于 Phase 0；路线图三语措辞仅为术语对齐；商业化平台计划必须保留但标注为当前 Goal 后的独立范围；旧 React 邮件凭据默认值修改须单独处理，不得混入 Phase 0 证据提交；工单恢复代码仍是未提交候选，不能视为生产修复。

依此已在本地隔离分支 `codex/phase0-workspace-reconciliation`（基于 `main@f84cb98bf99233462e1b7c7989fd012f9f64d1b5`，未推送）拆出三笔本地提交：`84f6df0` 将 Owner 指定的商业化平台文档明确标为 Phase 0/1 范围外的后续目标，并整理元数据格式；`d77bc49` 单独移除旧 React 设置页中的邮件凭据默认值，不将它冒充 SSR 生产安全修复；`caab3fa` 汇总并同步 5 份 Phase 0 核心证据/架构文件。独立工单 worktree 的代码现已提交为 `0df2c9c980b68c3df571dc14d8bc6beb859e4da8`，仅为隔离候选，未合入本地 `main`、未推送、未部署；该候选包含访问恢复测试，但本记录不以代码存在或既往审查代替当前生产验收。seeder 候选 `dde50ea0edd7dc2a3763ef61d6b4ca13cfa19639` 同样未合并、推送或部署。所有候选与生产 `main@f84cb98` 明确分开记录。

此专项 Gemini 分数不是 Phase 0 总评分，也不放行下一阶段。须在修复并复评工作区专项、工单候选得到明确版本归属、Phase 0 全部生产/数据/安全门禁闭合且整体 Gemini 达到 10/10 后，才允许进入 Phase 1。

### Phase 0 文档与代码候选无重叠整理（2026-11-21，待 Gemini 复评）

为处理 Gemini 9.5/10 复评指出的两条缺证，已新增唯一代码候选工作树 `/Users/aidenchan/Documents/erph-phase0-code-candidates`，分支 `codex/phase0-code-candidates` 严格从生产基线 `main@f84cb98bf99233462e1b7c7989fd012f9f64d1b5` 分出：`bd7099b` 仅包含 `SupportContentSeeder` 保全修改，`45f3643` 仅包含工单 URL token 隔离、邮件验证码访问恢复、迁移、视图及相应测试。只读比较确认该候选的 SSR 文件树与旧工单候选 `0df2c9c` 完全一致；候选分支不再修改 `docs/PLESK_SSR_DEPLOYMENT.md`。

当前文档分支 `codex/phase0-workspace-reconciliation` 的变更路径与 `codex/phase0-code-candidates` 的变更路径交集为空；`main` 是二者共同祖先，Seeder 代码提交是工单候选的父提交。为消除重复工作树，已在验证 SSR 文件树一致后移除旧 ticket 与 seeder 两个工作树；其本地分支引用暂作历史候选，不作为后续合并目标。所有候选仍未合并本地 `main`、未推送或部署。此整理只解决 Git/文档边界问题，Phase 0 全套仍为 **7.08/10、HOLD**，不得进入 Phase 1。

### Phase 0 生产可用性单点记录复核（2026-11-21，Gemini 10/10，仅限措辞与证据边界）

Codex in-app browser 再次显示官网首页内容与 `/health` JSON 正常，并只读核对 Plesk Git 页面仍跟踪 `main` 且配置自动部署到站点目录；没有执行 Pull/Deploy。证据被追加至 `docs/PLESK_SSR_DEPLOYMENT.md`，明确浏览器未暴露 HTTP 状态码、认证状态未独立核验、`release` 是配置标签、Plesk 仅显示提交标题、泛化旧部署提示不算本次部署证据，并列明单点检查的运行态与持续性限制。Gemini 对修订后的准确记录给出 **10/10 PASS**，仅审查该记录的措辞与边界；实际 HTTP 状态码、PHP-FPM/OPcache 运行 SHA、带时间戳 hook 执行与跨层健康仍需相应独立证据。Phase 0 整体评分仍为 **7.08/10、HOLD**，Phase 1 继续 HOLD。

### Phase 0 工单恢复候选代码复审（2026-11-21，静态设计 10/10；执行门禁未通过）

隔离候选工作树 `/Users/aidenchan/Documents/erph-phase0-code-candidates` 的 `codex/phase0-code-candidates@4909a4ce4d56f3e839bfd0c53e56342d46cc23f4` 收到 Ponytail 代码复核与 Gemini 内部浏览器第三方复评。Gemini 明确说明未直接读取尚未推送的候选源码；审查依据为仓库链接提供的结构背景与本轮逐项提交的实现事实，不能表述为 Gemini 已从 GitHub 检出该 SHA。仓库及对应文件链接已附在审查请求中，并明确说明 GitHub `main` 尚不包含该候选。

候选在同一工单行锁事务中持久化 60 分钟固定配额窗口与最多 5 次发码计数，统一归一化发码邮箱比较，明确计数整数 cast，并在恢复权限写入后轮换 Session ID。相关 PHP 文件通过 `php -l`，候选 diff 通过 `git diff --check`；未运行 Feature tests，未在数据库执行迁移，未 push、合并或部署。Gemini 对静态代码/安全设计给出 **10/10 PASS**；执行与集成证据门禁为 **FAIL / UNVERIFIED**。Gemini 具体化的双工单标签页时序风险被标记为待集成确认的假设；当前实现的 pending/recovered session 键均按 `public_id` 分隔。该专项静态评分不等于运行验证、Phase 0 验收或 Phase 1 放行。Phase 0 全套仍为 **7.08/10、HOLD**，Phase 1 继续 HOLD。

### Phase 0 Plesk 备份调度配置只读取证（2026-11-21，Gemini 10/10，仅限记录质量）

Plesk Websites & Domains 列表将 `erphpro.com` 标为 domain ID `1104`。从该域名面板的可见 Backup & Restore 入口进入后，面板显示 `Backup Manager for w4chinese.com`，URL 对应 `domainId 649`，备份路径指向 `wchinese/domains/w4chinese.com`。列表显示 3 个备份、合计 `10.3 GB`：Nov 21, 2026 12:24 AM 条目标记为 `Scheduled Backup. All configuration and content`（`5.67 GB`）；Nov 13 另有 BrainShift Pro 增量备份和 `4.43 GB` 全量备份。未打开归档或查看内部清单，未执行恢复。

只读打开该备份管理页的 Schedule Settings 后，`Activate this backup task` 未勾选；表单保留 Daily at 22:45、Asia/Kuala_Lumpur、incremental 已勾选、full backup Weekly、maximum full backup files=`1`；Configuration、Mail messages、User files、Databases 均勾选，存储位置为 Server storage。未修改设置、未点击 Save/Apply。当前页面不能说明 Nov 21 的 `Scheduled Backup` 标记是在何种计划状态变更下产生。

可确认的结论仅为：domainId `649` 当前设置页显示该 scheduled backup task 未启用；保留的计划参数不能证明当前存在激活的自动备份，也不能证明未来会自动触发。备份列表并非以 `erphpro.com` 独立域名页展示且含其他产品备注。后续只读打开该快照的恢复界面后，Plesk 在 Database 类型的 Available 对象中列出 `erphpro (localhost:3306)`，证明该快照的恢复目录元数据暴露了 eRPH 数据库对象；这不证明 SQL payload 完整或非空，也不证明可成功恢复。`erphpro.com` 与 `w4chinese.com` 是否同属一个 subscription、该快照是否包含 eRPH 站点文件、Plesk 服务器级 `Tools & Settings > Backup Manager` 是否另有任务均未核验。未选恢复对象、未执行 restore drill。

以上备份调度证据记录与恢复目录增量均经 Gemini 内部浏览器复核为 **10/10 PASS**（仅限事实措辞和推论边界；不评价或放行 Phase 0）。持续有效的独立可恢复备份与恢复演练门禁仍未关闭，Phase 0 **7.08/10 HOLD**、Phase 1 **HOLD** 不变。

### Phase 0 Nov 21 Plesk 快照恢复目录增量（2026-11-21，Gemini 10/10，仅限证据表述）

只读打开 `Nov 21, 2026 12:24 AM` 备份的 Restore 界面。Details 显示 `Domain configuration and content`；在 `Selected objects` 模式下，仅将 `Type of object to restore` 表单下拉选择为 `Database`，Plesk 的 `Available` 列表显示 `erphpro (localhost:3306)`。没有勾选对象；界面显示 `No objects selected` 且 `Restore` 按钮禁用。没有点击 Restore、Save、Apply，没有下载或查看归档内部清单。Plesk 数据库列表另显示 `erphpro` 关联至 `erphpro.com`（domain ID `1104`）。

因此可将此前“没有证据显示 eRPH DB 对象在快照中”更新为“恢复界面列出 `erphpro (localhost:3306)` 数据库对象可选”。这仅证明 UI/恢复目录元数据中存在该对象标识；不证明归档 SQL payload 完整或非空、快照一致性、恢复后 schema/行数/应用读写，也不证明站点文件对象可恢复。未执行实际恢复或 restore drill。该精确证据段经 Gemini 内部浏览器复评为 **10/10 PASS**，仅限事实精度和推论边界；不能替代生产数据恢复演练或关闭 Phase 0。Phase 0 仍为 **7.08/10 HOLD**，Phase 1 仍 **HOLD**。


### Phase 0 生产首页与 health 单点观测（2026-11-21 23:05 MYT，Gemini 10/10，仅限证据表述）

Codex 内部浏览器在 `https://erphpro.com/` 显示标题 `eRPH Pro · School operations software`、导航 `Features`、`About`、`FAQ`、`Support`、`Sign in`、`Request access`，以及主标题 `School operations, in one clear workspace.`；随后 `/health` 显示原始 JSON `{"status":"ok","database":"ok","cache":"ok","release":"0973ac7474e915ed6cd9027829c47f547daad043","app":"eRPH Pro"}`。浏览器没有显示 HTTP status code；这是单次公网主机名请求，不是 origin-direct/server-local probe。`release` 仅是返回的标识值，不能独立证明 PHP-FPM/OPcache 当前服务的 Git SHA。本次未检查认证、持续可用性、部署 hook、备份恢复、队列消费或租户隔离；没有执行 Plesk Pull/Deploy/Apply、数据库操作、设置修改或生产数据写入。

Gemini 在 Codex 内部浏览器独立复核该段并给出 **10/10 PASS**，范围仅为本条记录的准确性与推论边界。其确认该单点证据只能证明所述页面内容与 health JSON 在该次观测中可见，不能证明 HTTP 状态码、源站直连、持续 uptime、实际 served Git SHA 或未检查的运维/安全维度。审查请求附 GitHub 项目 URL，并注明本条新证据尚未同步到本地文档分支、GitHub `main` 可能较旧。此结果不改变 Phase 0 整体 **7.08/10、HOLD**，Phase 1 继续 **HOLD**。


### Phase 0 Plesk 可见导航范围（2026-11-21，Gemini 10/10，仅限事实措辞）

在已登录的 `Backup Manager for w4chinese.com` 页面，顶部显示 `All subscriptions`；展开左侧导航后可见 Websites & Domains、Mail、Files、Databases、Statistics、Users、Account、WordPress、Softaculous、Joomla!，未显示 `Tools & Settings` 或服务器级 Backup Manager 入口。尝试点击顶部 `All subscriptions` 控件后，页面和 URL 未变化。本观察仅限当前页面和当前账号可见菜单；不能据此断言服务器级工具/备份不存在、无法从其他入口访问，或完整界定账号权限。此前 domainId `649` 订阅备份页面显示计划任务未启用；服务器级备份范围与其他订阅仍未核验。未保存设置、未执行备份/恢复、未触发部署或生产写入。

Gemini 在 Codex 内部浏览器复核该表述并给出 **10/10 PASS**，仅确认其准确区分“当前界面未显示”与“不存在”。复核请求包含 GitHub 项目链接，并注明本地文档分支尚未包含该条证据、GitHub `main` 可能较旧。此分数不关闭服务器级备份/恢复门禁；Phase 0 **7.08/10 HOLD**、Phase 1 **HOLD** 不变。

### Phase 0 工作树残留复核（2026-11-22）

检查结果：codex/phase0-workspace-reconciliation（HEAD 6fbcce761ae0d2de1f9e55565f4dc863f1392092）和隔离候选 codex/phase0-code-candidates（HEAD 4909a4ce4d56f3e839bfd0c53e56342d46cc23f4）的 Git 工作树均无已跟踪未提交改动，也无未跟踪文件。两个分支的提交均仍仅在本地；候选代码没有合入本地 main、推送或部署。架构/现场证据、路线图措辞、Firebase 边界及 RPH 映射等均已作为明确归属的提交保留；商业自动化增长平台文档被标记为当前架构 Goal 之后的独立后续目标。当前没有需要清除的未跟踪或未提交计划/研究文件。此状态盘点只关闭工作树残留项，不改变生产数据/备份、OAuth 日志、租户隔离、队列/运行身份等 Phase 0 门禁；不得据此进入 Phase 1.

### Phase 0 发布 hook 数据写入安全候选审查（2026-11-21 23:17 MYT）

本地隔离候选 `codex/phase0-code-candidates@b8afbcc33b1b04b02b1aabc1627d4d5238f137e4` 删除 Plesk 自动部署中的 `php artisan migrate --force` 与 `SupportContentSeeder --force`，以 Laravel 12.73.0 的 `migrate:status --pending=1 --no-ansi` 检查替代；pending、缺失 migration repository、数据库/Artisan 错误均 fail closed。文档同步说明独立迁移与初始 seed 必须在审批和恢复点门禁后执行。自审通过 `bash -n` 与 `git diff --check`；应用测试和 Artisan/DB 执行未运行。

已按 Ponytail 最小改动规则审查真实部署入口。Gemini 内部浏览器收到相关 GitHub 仓库 URL、候选 SHA 与精确 diff；提示明确说明候选未推送且 Gemini 未从 GitHub 检出该 SHA。Gemini 对静态代码改动评为 **10/10 PASS**，未列出代码级缺陷。它确认该闸门会保护常规部署免于自动写库和覆盖 seed 内容，同时指出 Plesk Git 在 hook 之前已更新活动工作树，hook 失败不会自动回滚代码/vendor，可能造成新代码配旧 schema；首次安装需另外进行获批 migration/seed。

候选仍是本地分支，未合入本地 main、未推送或部署；生产 main 仍用原自动迁移/Seeder hook。此次静态审查不代表 Plesk 运行验证、恢复演练、原子部署或 Phase 0 通过。Phase 0 整体评分仍 **7.08/10 HOLD**，Phase 1 不得开始。

### Phase 0 Plesk 备份任务状态复核（2026-11-21 23:22 MYT，只读）

在 Codex 内部浏览器重新打开 `w4chinese.com` (`domainId 649`) Backup Manager 下的 Plesk `Scheduled Backup Settings` 页面（URL path `/smb/backup/schedule/domainId/649`）。`Activate this backup task` 未勾选；表单显示 Daily 23:15（Asia/Kuala_Lumpur）、incremental enabled、weekly full、full-backup rotation 上限 1、包含 Configuration/Mail messages/User files/Databases，目标为 Server storage。随后通过 Cancel 退出，未修改或保存任何设置，也未触发备份或恢复。

这与同一资料此前记录的保留时间 22:45 不一致，原因未知，故两次观测按各自时间保留并列为待解释的差异，不能择一当作已确认计划。在 2026-11-21 23:22 MYT 本次观测中，任务 activation checkbox 未勾选；未激活表单中仍显示的 Daily 23:15 等排程参数只是保留表单值，不表示后台 scheduler 当前已激活运行。列表中的 Nov 21 “Scheduled Backup” 不足以解释该表单当前未启用，也不能证明未来会自动备份。该页属于 `w4chinese.com` 管理页，不等同于 eRPH 专属备份。独立可读数据库快照、完整性和隔离恢复演练均未得到证明，灾备门禁继续 HOLD，Phase 0 **7.08/10**、Phase 1 **HOLD** 不变。

Gemini 通过 Codex 内部浏览器对修订后的证据增量给出 **10/10 PASS**，确认页面上下文、绝对时间、22:45/23:15 差异处理及推论边界均准确。审查请求附上 GitHub 项目链接，并明确本地两处文档改动尚未提交/推送；Gemini 按消息内精确文本审查，未声称读取本地 SHA。此 10/10 仅通过该证据段的记录质量，不改变 Phase 0 **7.08/10 HOLD**、Phase 1 **HOLD** 或独立恢复演练要求。

### Phase 0 Plesk Git 与线上页面/health 复核（2026-11-21 23:38 MYT，只读）

Plesk Git UI 显示 `erphpro.com` 仓库选择 `main`，最新提交 `f84cb98`（16:08），自动部署启用，目标 `/erphpro.com`，并配置 post-deployment action。提交历史弹层显示 96 个条目、4 页；最新列表首项仍为 `f84cb98`。未触发 Pull、Deploy、Apply 或 hook，也未见带执行时间的最近 hook 成功结果。随后内部浏览器从公开域名渲染官网；`/health` 返回可见 JSON：`status=ok`、`database=ok`、`cache=ok`、release label `0973ac7474e915ed6cd9027829c47f547daad043`。浏览器未显示 HTTP 状态码，且不是源站直连探测。Plesk Git HEAD `f84cb98` 与 `/health` 配置标签 `0973ac7474e915ed6cd9027829c47f547daad043` 不同；既有只读取证已确认该标签来自静态 `.env` 的 `RELEASE_VERSION`，部署钩子不会从 Git 推导它。因此应将其视为配置标签，不能称为未解释的提交漂移。PHP-FPM/OPcache 实际加载代码身份及带时间戳的 hook 执行结果仍未验证。该增量证明的是配置当前选择/启用状态与两个 URL 的单点可见内容，不证明 hook 实际运行成功、PHP-FPM/OPcache 的 served SHA、连续可用性或登录旅程健康。配置 release label 仍不能替代提交身份。生产部署/运行身份闸门继续开放；Phase 0 **7.08/10 HOLD**、Phase 1 **HOLD** 不变。

Codex 内部浏览器中的 Gemini 对该证据段精确修订文本给出 **10/10 PASS**，确认观测时间戳、配置与执行边界、HEAD 与配置 release label 未对账状态及未验证项均准确。审查请求附 GitHub 仓库链接，并说明本地文档差异未提交/未推送；Gemini 依据请求内精确文本审查，没有声称读取本地 SHA。该局部文档评分不改变 Phase 0 **7.08/10 HOLD**、Phase 1 **HOLD**。

针对 `/health` 配置标签的语义修订，Gemini 在 Codex 内部浏览器复核精确增量并给出 **10/10 PASS**：`0973ac…` 来自静态 `.env` `RELEASE_VERSION`，不能据此称作 Git 提交漂移；PHP-FPM/OPcache 实际加载代码和带时间戳 hook 执行仍未验证。请求提供 GitHub 仓库链接并明确本地差异未提交/未推送，Gemini 未声称读取本地差异。整体 Phase 0 **7.08/10 HOLD** 与 Phase 1 **HOLD** 不变。

针对 `/health` 配置标签的语义修订，Gemini 在 Codex 内部浏览器复核精确增量并给出 **10/10 PASS**，无剩余修改建议：`0973ac…` 来自静态 `.env` `RELEASE_VERSION`，不能据此称作 Git 提交漂移；PHP-FPM/OPcache 实际加载代码和带时间戳 hook 执行仍未验证。审查请求提供 GitHub 仓库链接并明确本地差异未提交/未推送，Gemini 未声称读取远端差异。整体 Phase 0 **7.08/10 HOLD** 与 Phase 1 **HOLD** 不变。

### Phase 0 工作树与候选分支状态复核（2026-11-22 00:03 MYT）

本轮检查 `git worktree list --porcelain` 只列出主工作树 `/Users/aidenchan/Documents/erph`（分支 `codex/phase0-workspace-reconciliation`，检查时 HEAD `807c97218bfe643ac3b4a9e8ef2411e75c7e1003`）及隔离候选 `/Users/aidenchan/Documents/erph-phase0-code-candidates`（分支 `codex/phase0-code-candidates`，HEAD `b8afbcc33b1b04b02b1aabc1627d4d5238f137e4`）。两处 `git status --porcelain=v1` 均为空，没有已跟踪未提交或未跟踪文件。两个分支仍是本地候选，未合入本地 `main`、未推送、未部署；候选代码仍未运行功能测试或生产验证。

此状态更新先前 2026-11-22 工作树复核中主工作树 HEAD `6fbcce...` 的时间点快照，不覆盖其当时真实状态。它只确认本次盘点时没有遗留工作区文件，不关闭生产备份/恢复、schema/历史表来源、OAuth/工单日志、租户隔离、队列消费者或 PHP-FPM/OPcache 运行身份门禁。Phase 0 整体仍为 **7.08/10 HOLD**；Phase 1 继续 **HOLD**。


### Phase 0 归档数据库凭据与旧 DDL 脚本清理（2026-11-22，本地代码清理）

只读检索确认，归档目录中的旧 CGI 迁移脚本没有仓库内调用者；它会执行 `db.create_all()`、多项 `ALTER TABLE`，并含有数据库凭据回退值。旧 `legacy-archive/app.py` 与 seed CGI 也含同一凭据的默认回退；密码重置 CGI 还包含可直接更新管理员密码的逻辑。已从当前工作树删除该迁移 CGI、旧密码重置 CGI 和旧 seed CGI，并将归档应用改为必须由外部提供 `DB_PASS`，未提供时立即失败；保留 `app.py` 中的 SQLAlchemy 模型定义作为旧表结构/命名来源证据（包括 `dskp_standards`、`leave_records`）。该脚本所述 DDL 不能证明它曾成功运行，也不能证明当前生产表/行由其创建。

当前代码清理不改写 Git 历史，历史提交可能仍含该凭据；因此将其视为已暴露，凭据轮换及验证仍未完成。这些 CGI 在本次均未运行；未读取或修改生产凭据、未登录数据库、未触发部署或生产写入。该项是 Phase 0 安全与数据来源证据的增量，不改变 Phase 0 **7.08/10 HOLD** 与 Phase 1 **HOLD**。
### Phase 0 公开 Git 历史凭据与 Plesk 数据库账号映射（2026-11-22，只读核验）

GitHub 仓库 API 元数据显示 `AidenChan2025/eRPH-PRO` 当前为 public；只读读取的实时分支头分别为 `main@f84cb98` 与 `feature/multi-tenant-core@f7923d3`，与本地 `origin/*` 跟踪引用一致。Git ancestry 检查确认两个头均包含旧归档引入提交 `d3cd0df`；该历史引入的归档文件曾含数据库凭据字面值。此处不记录或传输凭据本身。故该凭据按公开泄露处理；仅从当前树删除文件并不能撤销历史可见性。未改写远端历史、未推送任何提交。

Plesk 内部浏览器只读查看 `erphpro.com` (`site_id=1104`, SSH 用户目录 `/home/w4chinese.com`) 的订阅数据库用户清单及用户表单：`erphpro` 用户 (ID 1042) 绑定 `erphpro` 数据库，默认用于 phpMyAdmin，Read and Write，界面列出的数据访问与结构权限均启用；`erphpro_ssr` (ID 1112) 也绑定 `erphpro` 数据库，Read and Write，列出的数据访问与结构权限均启用。Plesk 表单不显示现有密码，本次没有查看或更改密码。SSH Terminal 仅输出 `.env` 中的 `DB_DATABASE=erphpro` 和 `DB_USERNAME=erphpro_ssr` 两项；密码行未读取。由此确认磁盘上的 Laravel `.env` 配置指定账号 `erphpro_ssr`，旧 `erphpro` 用户仍存在且权限较宽。FPM 实际加载的缓存配置与当前数据库会话身份未读取，仍待运行态闭环。旧凭据是否仍匹配旧账号当前密码无法从 Plesk 只读界面判定；需轮换该旧账号密码并核验其他消费者，且不能把轮换描述为已完成。

Plesk 用户密码更改需由账户持有人在页面完成最终保存。后续操作应先协调生产秘密存储/历史消费者，再重设旧 `erphpro` 账号密码。磁盘 `.env` 指定 `erphpro_ssr`，因此按此配置重设旧账号预计不影响 SSR；但 FPM 缓存配置/现有连接身份尚未核验，轮换后必须立即复查线上 DB health 与实际服务状态。此处置待 Owner 完成。以上发现仅收敛凭据事件范围，不改变 Phase 0 **7.08/10 HOLD** 与 Phase 1 **HOLD**。

### Phase 0 生产首页与 health 即时复查（2026-11-22 00:19 MYT，Codex 内部浏览器，只读）

内部浏览器重新打开 `https://erphpro.com/`，页面渲染 eRPH Pro 官网主标题与导航；随后 `/health` 显示 `status=ok`、`database=ok`、`cache=ok`、应用名 `eRPH Pro` 和配置 release label `0973ac7474e915ed6cd9027829c47f547daad043`。浏览器未显示 HTTP status code。这是当前公开主机名的单次观察，不是源站直连或连续监控；release label 仍不证明 PHP-FPM/OPcache 实际服务的 Git SHA，也未验证 OAuth 登录。此次说明本次观测时主页并非 503，不推翻此前日志中历史 LiteSpeed socket/503 事件，也不证明其已根治。未执行登录、部署、数据库或 Plesk 设置写入。Phase 0 仍 **7.08/10 HOLD**，Phase 1 仍 **HOLD**。

### Phase 0 静态租户边界复核（2026-11-22，本地只读代码审查）

按 Ponytail 的“检查改动覆盖点与调用链、优先找共享边界”规则，对当前 SSR 的 school middleware、RPH/审核/学校设置/成员控制器及 web routes 做静态追踪：学校请求由 `ResolveSchool` 按 host 解析 active school，成员路由再经 `RequireSchoolMembership` 与角色/权限中间件；主要 lesson-plan 读写与 reviewer 路径在 controller 中显式校验 `school_id`，成员更新通过当前 school 的 members relation 限定用户。此项是代码路径证据，不是运行时安全证明。

复核同时确认 `LessonPlan`、`LessonPlanSubmission`、`LessonPlanReview`、`TeacherProfile`、`CurriculumItem`、`SchoolSetting` 与 `SchoolTimetableSlot` 等带租户字段模型没有 Eloquent global scope / tenant-aware base query guard；安全仍依赖每个调用点自行过滤。尚未完成所有 controller/service/job/export/import 调用点的封闭盘点，也未运行跨学校、跨角色负向请求验证；`LessonPlanVersion` 依赖父级关系访问且自身没有 `school_id`。因此模型层 fail-closed tenant guard 与负向运行验证继续作为重大阻断，不能仅凭本次静态审查关闭。未修改代码、未运行测试或访问生产业务数据。

### Phase 0 Plesk 队列/会话/缓存配置与代码入口复核（2026-11-22，只读）

Plesk 内部 SSH Terminal 仅用 `awk` 读取订阅 `.env` 中三个非秘密配置项，观察到 `QUEUE_CONNECTION=database`、`CACHE_STORE=database`、`SESSION_DRIVER=database`；未输出或读取任何密码行。对本分支 SSR `app`、`routes`、`bootstrap`、`config` 与 `database` 目录静态搜索 `ShouldQueue`、`dispatch`、`Queue::`、`schedule`、`Schedule::`、`withoutOverlapping` 等入口，没有发现应用级 job dispatch / scheduler 定义。此搜索不覆盖所有运行时注入、框架扩展或订阅外部任务，不能单独证明不存在其他消费者。

结合既有 Plesk 任务页未观察到此订阅的活动 scheduler、进程只读盘点未观察到 Laravel worker、数据库队列表估算为 0，本轮进一步确认当前配置选择数据库队列，但未找到仓库内调度/消费闭环。它与“零积压”是不同证据：没有可见积压不等于消费者健康，配置成 database 也不等于 job 被派发或处理。队列消费者、失败重试/告警与端到端任务实证继续为 Phase 0 重大阻断。未触发任务、未创建 job、未更改环境配置或生产数据。

### Phase 0 工单 URL bearer token 候选代码自审（2026-11-22，Ponytail 静态审查）

检查隔离候选提交 `codex/phase0-ticket-session-token@0df2c9c980b68c3df571dc14d8bc6beb859e4da8` 的完整创建、查看、回复、恢复路由及其测试调用点。新工单访问 token 只存于当前 session，数据库只存 SHA-256；页面访问仅接受工单发起用户、session token 或已验证的恢复 session。恢复码使用 6 位随机码，数据库存哈希，15 分钟失效、最多 5 次错误，按工单至少间隔 1 分钟发码，路由另有限流；恢复页不加载私密消息。候选包含 session 访问、多工单、旧 query token 拒绝、发码/验证码限制等 feature tests，但本次没有执行。

重要边界：有旧书签/邮件仍携带 `?token=` 时，应用先收到该 HTTP 请求再返回去 query 的重定向；应用层 `Referrer-Policy` 不能撤销初始请求，也不能保证服务器 access log 不记录原始 query 或清除浏览器已保存的历史 URL。候选能阻止新工单继续生成 token URL，并拒绝旧 query token 授权，但不等于解决历史链接/日志中的旧 token。须继续核实并处理 Plesk access-log 脱敏/留存与旧链接失效；不把这项静态审查当作日志事故关闭。

当时的候选还增加了生产 schema migration；该时间点记录的 branch 未推送、未部署且未运行测试。当前状态以本节末尾 2026-11-22 候选核对为准。该历史 Ponytail 复核仅验证源代码路径与已知边界；全站 Phase 0 仍 **7.08/10 HOLD**，Phase 1 继续 **HOLD**。

### Phase 0 生产历史表名的仓库引用复核（2026-11-22，本地只读）

按 12 张未由当前 SSR migrations 定义/管理的生产表名复查整个仓库（排除治理文档、锁文件与依赖噪声），区分物理 SQL 表调用与宽泛字符串命中。`dskp_standards` 在旧前端 DSKP 服务中出现，既有文档记录其旧 Firebase collection 路径；`tasks`、`articles`、`notifications` 在旧 React/Firebase 层及归档 Flask 模型中出现，不能由名称相同推定其访问 Plesk MariaDB 的历史表。`calendar_events`、`leave_records`、`timetable_templates`、`reference_items`、`system_settings` 的模型名仅见于 `legacy-archive/app.py`，`legacy_lesson_plans`、`legacy_schools`、`legacy_users` 作为字面表名未见仓库代码引用（旧模型实际命名为 `lesson_plans`、`schools`、`users`，需由生产表结构/历史创建来源另行核对）。

当前 SSR 支持中心使用独立的 `support_articles`、`support_categories`、`support_tickets` 等表；对 `articles`、`notifications` 的文本命中不代表 SSR 查询旧生产表 `articles` 或 `notifications`。该复核是静态引用范围，不覆盖部署目录外脚本、外部客户端、运维手工操作、历史版本调用或生产 SQL 审计；未访问表行、未执行 SQL、未更改代码或生产数据。因此 12 张表的消费者/来源与保留决策仍未闭合，不能据本次搜索删除或迁移任何表。Phase 0 **7.08/10 HOLD**、Phase 1 **HOLD** 不变。

### Phase 0 Firebase 旧发布/DSKP 写入入口复核（2026-11-22 00:32 MYT，只读）

检查根 `package.json`、`firebase.json`、`.github/workflows/ssr.yml` 与 `scripts/seed-firestore-dskp.js`：SSR workflow 只安装 Composer 依赖、运行 SSR tests 并语法检查部署脚本；仓库内没有 workflow 调用 Firebase Hosting deploy 或该 seed 脚本。根 npm manifest 仍保留 `npm run deploy`（执行 Firebase Hosting 部署）、Firebase CLI/SDK 与本地 Hosting emulator；Hosting 配置把 `build/` 发布为 SPA，并将全部路径 rewrite 到 `index.html`。这是一条可由操作者手动触发的旧发布能力，不是当前已验证的 Plesk SSR 发布路径；没有核实所有 GitHub Actions、Plesk 外部 webhook、开发者本地凭据及 Firebase Console 操作，因此不能据仓库搜索断言其绝对不可触发。

在当前候选 HEAD `fd7f136e526b6df4676f3185f5b499d506bf0042` 上复核 `.github/workflows/`、`scripts/deploy-ssr.sh`、`scripts/test-deploy-ssr.sh`、根 `package.json`、`firebase.json`、`ssr/package.json` 与 SSR Composer manifest：唯一 GitHub workflow 使用 Composer/PHP 执行 SSR 测试与发布钩子自检；Plesk 发布脚本只安装 PHP 依赖并运行 Artisan，不调用根 npm/Firebase Hosting 部署或 Firestore seed。根 `npm run deploy` 仍可手动调用，因此这只证明当前仓库内列出的自动 SSR 链没有触发该旧命令，不证明 Firebase Hosting/Firestore 项目、其他操作人或外部触发器未使用。`firebase/php-jwt` 仅作为 SSR Composer lockfile 中的依赖项出现，不能据此推断 Laravel SSR 使用 Firebase 服务。未运行 npm/Firebase 命令、未连接 Firebase 项目或访问数据；旧发布入口与历史数据处置门禁继续开放。

旧 `scripts/seed-firestore-dskp.js` 会读取根 `.env` 的 `VITE_FIREBASE_*` 配置、下载指定 Google Sheet CSV、按科目/年级聚合 SK/SP，逐篇 `setDoc` 写入 Firestore `curriculum_dskp/{subject_grade}`。脚本导入 `signInWithEmailAndPassword` 但没有调用该方法；其注释假设依赖 Firestore rules，真实认证/写权限未验证。脚本还会输出首条 CSV 数据样例；本次没有运行脚本、读取 CSV 或 Firestore、编译/部署 Firebase bundle，也未触碰任何 credential。由此确认旧代码中仍有直接覆盖课标文档的写路径，须在清理/迁移前先做数据来源、当前消费者、备份和规则核验；仅凭脚本存在不能断言它曾成功写入生产项目。

Owner 明确选择暂时保持 `M41 1620112026` 的“Anyone with the link / No sign-in required”分享设置。本轮没有更改权限；该选择记录为当前访问范围决定，不代表已核实 AppSheet 连接器如何访问、访问名单或个人/学校资料的最小化控制。Phase 0 Firebase 数据保全与旧发布隔离门禁仍开放，全套分数 **7.08/10 HOLD**，Phase 1 继续 **HOLD**。

### Phase 0 PLT-01 平台后台源代码边界复核（2026-11-22，只读）

再次直接核对当前 `ssr/routes/web.php`、`OwnerController`、`owner/dashboard.blade.php`、`User` 模型与 `platform_role` migration。当前 `/owner` 只有 GET 概览路由，控制器执行 `School::query()->withCount('members')->orderBy('name')->get()` 并渲染学校名称、子域、成员数与 active 状态；无学校时页面只显示空状态。代码中没有从该页创建/启停/归档学校的表单或写路由，也没有平台运营成员/RBAC、邀请与账户分配、全局配置、连接健康、Demo 控制等管理页面。Owner 支持工单另有读写路由，审计页另有只读路由。

平台入口确实不要求 school membership：Owner 路由使用默认 `auth` 加 `platform.owner`，后者仅检查同一个 `User.platform_role === owner`；`platform_role` 是现有 users 表的一个可空列，不构成独立 Guard 或身份域。此静态核对再次确认“Owner 登录可进入有限只读概览”与“全站管理后台已实现”不是同一件事；同时不能据路由缺少 `school.member` 就证明其 host/session/CSRF 隔离安全。PLT-01 的完整后台与平台/学校认证隔离仍是后续实施的重大缺口，不在 Phase 0 擅自开始实现；本轮未改代码、未运行测试、未触碰生产状态。Phase 0 整体仍 **7.08/10 HOLD**，Phase 1 **HOLD**。

### Phase 0 Firebase 实际资源/近期用量只读核验（2026-11-22 00:35 MYT，内部浏览器）

Firebase 控制台 `erph-pro` 项目的 Hosting 页面仍显示 **Get started**，即当前 Hosting 产品界面未显示已创建的 Hosting site/deployment；这与仓库仍留有可手动触发的旧 Hosting 命令并不矛盾，不能推断 Firebase Hosting 从未运行或其 DNS/缓存/历史部署均不存在。Firestore Data 页面显示现存集合 `dskp`、`leaveRequests`、`lessonPlans`、`schools`、`users`，且 `dskp` 集合下有多份文档；本记录不复制文档字段、内容或人员数据。此前所见 seed 脚本目标集合为 `curriculum_dskp`，与当前控制台可见的 `dskp` 集合名称不同；不能据此认定它已成功写入，也不能把两个 collection 视为同一个数据集。

Firestore Usage 页当前选择 **Last 24 hours (Nov 21–Nov 22)**，面板显示 Reads/Writes/Deletes、snapshot listeners、active connections、rules Allows/Denies/Errors 均为 **No data**。页面说明的 billable metrics 不包括 imports/exports 与 aggregation queries，且未给出数据库全生命周期或外部集成审计。因此只能记录为“该面板在所选窗口未显示用量数据”，不能证明长期无访问、数据可删或外部消费者不存在。Firebase 当前为 Spark 免费方案。此次只查看 Hosting、Firestore Data 和 Usage；未打开或复制文档内容、未改规则/数据/配置、未执行导入导出或发布。该结果增强旧 Firebase 实际资源盘点，但数据归属、备份、权限/规则、历史使用与迁移闭环仍未完成；Phase 0 **7.08/10 HOLD**，Phase 1 **HOLD**。

追加核对 Firestore Rules：内部控制台尝试进入项目 `erph-pro` 的默认数据库 Rules 页面后重定向到 Firebase 项目总览，未能读取已部署规则。当前仓库没有 `firestore.rules` 文件，根 `firebase.json` 也没有 Firestore rules 部署配置；这证明仓库没有可随当前 Firebase 配置审计/发布的规则源，不证明线上实际规则为空或宽松。禁止据此新增发布或更改规则；旧 Firebase 访问控制有效性、规则版本及数据读取/写入边界仍是安全闸门，需由可访问的 Firebase Rules 页面或可信导出证据核实。

#### 仓库默认 Firebase 项目与控制台项目名称待核对（2026-11-22，本地只读）

当前候选根目录 `.firebaserc` 将默认 alias `default` 映射到项目 ID `erphprocom`；根 `firebase.json` 配有 Hosting，`package.json` 的 `deploy` 命令会执行 `firebase deploy --only hosting`，未显式传 `--project`。此前内部控制台记录观察的是项目 ID `erph-pro`。这两个项目 ID 字符串不同，因此此前看到的 `erph-pro` 控制台页面不能证明仓库默认手动部署目标 `erphprocom` 的 Hosting、Firestore、规则、历史数据或使用情况；同样也不能仅凭配置文件证明 `erphprocom` 项目当前存在或曾被部署。继续保持旧 Firebase 发布与写入操作冻结，直到在内部浏览器只读核对两个项目的准确身份、资源清单和数据归属，并由 Owner 确认预期目标。未运行 Firebase CLI、未连接/读取任一 Firebase 项目、未读取环境变量或凭据、未部署或更改 Firebase 资源。

### Phase 0 Owner 工作簿隐藏标签可见性恢复记录（2026-11-22，内部浏览器）

只读核对 Owner 提供的 `M41 1620112026` 链接时，在 Google Sheets **All Sheets** 菜单选择隐藏 `SUBJEK` 标签，页面将其取消隐藏。发现后立即使用该页签的 **Hide sheet** 恢复；Sheets 随后显示 `SUBJEK hidden`、可见标签恢复为 `MENU`、`MON`–`FRI`、`DATA`，并显示 **Saved to Drive**。临时取消隐藏及恢复动作可能都留在 Drive 修订历史，无法从此处移除。没有修改单元格、公式、分享权限或业务数据。仅记录可见标题行字段：`SUBJEK`、`TARIKH`、`HARI`、`MINGGU`、`DISAHKAN OLEH`、`KELAS`、`MASA`；未抄录/保留其他行值。该操作是继此前已记录的 DSKP 标签事件之后的另一次独立标签可见性事件；现态已恢复，但源工作簿的读者仍可查看并取消隐藏这些标签。用户已指示暂时保持链接分享，本轮未更改权限。该事件不关闭工作簿权限、AppSheet 连接器访问或源数据保护门禁。

### Phase 0 Plesk aggregate log 与公网主页复核（2026-11-22，内部浏览器，只读）

Plesk aggregate Log Browser 在刷新后仍显示 1,002 条，最新时间停留于 `2026-11-20 22:04:09`；可见记录包含既有的主页 503 与 LiteSpeed 应用 Unix socket reset/refused/no-such-file 错误。此次浏览器访问主页和 `/health` 后，aggregate 视图没有出现对应的新请求。它与此前已发现的 aggregate Log Browser、单文件 Log Browser、File Manager 查看内容不一致相符；各日志视图的完整性/新鲜度原因仍未查明。因此不能用此 aggregate 记录认定修复后无 503，也不能据此声称当前仍在返回 503。

同次内部浏览器中，`https://erphpro.com/` 显示 eRPH Pro 官网主页，`/health` 显示 `status=ok`、`database=ok`、`cache=ok` 与静态配置 release label；浏览器未显示 HTTP status code。这证明两个页面在该时点经公网主机名渲染，不证明源站直连、连续可用、最新 Git SHA 已被 PHP-FPM/OPcache 加载，或 OAuth/完整业务路径健康。没有执行 Plesk 部署、设置更改、日志/数据库操作或生产数据写入。历史 503 根因复发风险、日志新鲜度、运行态身份与稳定性仍是 Phase 0 闸门；总评分 **7.08/10 HOLD**，Phase 1 继续 **HOLD**。

### Phase 0 Plesk Scheduled Tasks 列表只读复核（2026-11-22 00:49 MYT）

在已认证的内部 Plesk 中打开 Scheduled Tasks 页面并刷新任务列表，界面明确显示 `No items.`。该证据范围仅为 Plesk 此任务列表在观测时没有列出任务，不覆盖操作系统 cron/systemd timer、外部调度器、Laravel queue worker 或其他基础设施派发的任务。没有新增、编辑、删除或运行任务。Laravel scheduler/queue 的端到端消费闭环仍未验证；该观察不关闭调度、重试/失败告警或任务实际运行闸门，Phase 0 仍 **7.08/10 HOLD**，Phase 1 仍 **HOLD**。

### Phase 0 Plesk 刷新日志与实时主页复核（2026-11-22 00:47 MYT，内部浏览器，只读）

重新打开已认证 Plesk 后，网站概览显示 `erphpro.com` 为 Active、Document root `/erphpro.com/ssr/public`、PHP 8.3.37、Git last commit `f84cb98`。手动刷新 aggregate Log Browser 后仍显示 1,002 条，最新渲染项为 2026-11-20 22:04:09；可见历史包含主页 HTTP 503 及 LiteSpeed Unix-socket reset/refused/no-such-file 错误。随后在内部浏览器新开 `https://erphpro.com/`，页面标题为 `eRPH Pro · School operations software`，并渲染 Laravel SSR 官网内容。该公网主机名单点观测未暴露 HTTP status code，也不证明源站直连、日志实时摄取、持续可用、OAuth 流程健康或 PHP-FPM/OPcache 实际服务 SHA；Plesk 当前视图也未提供带时间戳的部署 hook 结果。未执行部署/设置变更、数据库操作或生产数据写入。聚合日志仍未能与新页面观测形成时间关联；Phase 0 及生产运行身份/稳定性闸门保持开放。

### Phase 0 公网主页与健康端点最新复核（2026-11-22 00:52 MYT，Codex 内部浏览器，只读）

重新直接访问 `https://erphpro.com/` 后，内部浏览器显示标题 `eRPH Pro · School operations software` 和官网主页内容；另开 `https://erphpro.com/health` 显示 JSON：`status=ok`、`database=ok`、`cache=ok`、`app=eRPH Pro`、静态 release label `0973ac7474e915ed6cd9027829c47f547daad043`。浏览器未展示 HTTP status code；release label 不能证明 PHP-FPM/OPcache 当前加载的 Git SHA。该时点证据表明公网主页与健康 payload 可呈现，不支持“目前仍持续返回 503”的断言；历史 503 和上游 Unix-socket 故障证据仍成立。结合 Plesk aggregate log 仍停留在旧记录，不能建立修复后的无错误时间窗口，也不能证明连续可用、OAuth/业务流程健康或部署代码身份。未登录、部署、改 Plesk 设置、执行日志/数据库操作或生产写入。运行态身份、日志新鲜度、持续稳定性与完整 Phase 0 验收闸门仍开放；Phase 0 **7.08/10 HOLD**，Phase 1 **HOLD**。

Gemini 在 Codex 内部浏览器对照审查了完整英文小节标题与上述中文原文，最终评分 **10/10**，无实质修订项。初审的两个扣分项来自提交给审查器的材料不完整（英文段落未附其带时间戳的标题，中文只给摘要）；补齐标题及完整中文条目后，审查器确认时间戳、HTTP 状态码边界、静态 release label 限定、历史 503 与单点观察区分、无生产写入声明及 HOLD 状态均准确。已提供 GitHub 仓库链接；Gemini 明确说明无法访问 GitHub/本地工作区，因此评分基于本轮提供的完整文本，不是对 GitHub 内容或本地提交的独立核验。该 10/10 仅适用于本次文档增量，不改变 Phase 0 **7.08/10 HOLD** 或 Phase 1 **HOLD**。

### Phase 0 Owner Google OAuth 登录现场复核（2026-11-22 00:57 MYT，Codex 内部浏览器）

公网 `https://erphpro.com/owner/login` 渲染了 `Continue with Google Workspace` 入口；点击后，浏览器到达 `https://erphpro.com/owner` 并显示已认证的平台 Owner 概览，内容包括 `No schools registered.`。未读取、记录或推断具体账号身份、OAuth scope、HTTP 状态码或 callback trace；未创建/修改学校、用户或其他生产数据。该结果证明当前浏览器会话的一条 Google Workspace→Owner 登录旅程成功到达 Owner 页面，不证明其他账号、学校管理员登录、membership 分配、MFA enforcement 或平台/学校身份与 session 隔离已经合格。当前呈现的 Owner 页面仍只有概览，不能视为完整平台管理后台。Owner OAuth 单一旅程从“未验证”更新为“本次观察成功”；认证隔离、角色/权限、MFA、学校 Admin 旅程与 PLT-01 完整后台仍未闭合。Phase 0 整体仍 **7.08/10 HOLD**，Phase 1 **HOLD**。

Gemini 在 Codex 内部浏览器审查了这份中英文增量，评分 **10/10**，无实质修订。其核查确认：记录的是一次浏览器 OAuth 旅程到达 Owner 页面，不是 HTTP 状态断言；没有暴露账号、scope 或 callback trace；并清楚区分只读 Owner 概览与完整 PLT-01 后台，保留学校管理员、MFA、session 隔离及 Phase 0/Phase 1 未验证边界。已提供 GitHub 地址及本地 HEAD；Gemini 明确表示无法直接查看 GitHub 或本地工作区，评分依据为本轮提供的完整文本。此评分仅适用于证据文档，不代表 OAuth 安全实现或阶段验收通过。

### Phase 0 Plesk aggregate log 再次刷新（2026-11-22 01:00 MYT，内部浏览器，只读）

在 Plesk aggregate Log Browser 点击 Refresh 后，列表仍显示 1,002 条。最新可见访问记录为 `2026-11-20 22:05:30` 的主页请求；其前一条 `2026-11-20 22:05:19` 的 `robots.txt` 请求返回 HTTP 503，并有 LiteSpeed Unix-socket reset/refused 与重试耗尽记录。刷新结果仍早于 11 月 22 日的主页、健康端点及 OAuth 浏览器观察，无法说明之后是否发生故障。这是新增的历史 503 佐证，不是主页当前仍返回 503 的证据。日志来源新鲜度/关联、修复后稳定窗口、运行代码身份仍未闭合；Phase 0 继续 **7.08/10 HOLD**，Phase 1 **HOLD**。没有改动 Plesk 设置、部署、日志文件、数据库或生产数据。

Gemini 在 Codex 内部浏览器审查上述英文增量及对应中文记录，评分 **10/10**，无实质修订。审查依据为提供的完整文本；Gemini 无法直接访问 GitHub 或本地工作区，因此这不是对提交或生产环境的独立验证。该分数只适用于此文档增量，不改变阶段 HOLD 状态。

### Phase 0 KPM e-RPH Tingkatan 6 工作簿结构抽样（2026-11-22，内部浏览器，只读）

从 KPM AppSheet 链接打开 `01. e-RPH TING6 17/10/2026` Google Sheet 时，Google Sheets 显示 **View only**。此次是只读工作簿界面抽样，不是对 AppSheet 配置或 connector 权限的审查。可见标签为 `MENU`、`AHAD`、`ISNIN`、`SELASA`、`RABU`、`KHAMIS`、`RPT`、`DSKP`、`DATA`。界面报告 `MENU` 为 3,624 行×51 列，五个日页各为 3,184 行×166 列，`DATA` 为 1,001 行×89 列。该份 Tingkatan 6 来源采用周日–周四的日页结构；这只证明此工作簿的组织方式，不可推成所有学校的统一校历。当前可见日页有合并/公式区域和重复的教案表格版式。界面曾渲染部分工作簿内容，包括一个公式引用和个人/学校背景信息；这些内容未抄录或保留在报告中。没有更改单元格、公式、验证规则或分享设置。未系统检查隐藏页内容及公式/验证逻辑。依照 Owner 指示，维持现有链接分享设置；没有更改分享权限。实际受众范围与 AppSheet connector 访问方式仍未核实。此结构抽样不证明完整字段、条件、枚举、来源授权矩阵或其他 KPM 学段科目的覆盖。须保持源文件原样，直到完整字段/条件及来源授权矩阵完成；Phase 0 仍为 **7.08/10 HOLD**，Phase 1 仍为 **HOLD**。

Gemini 在 Codex 内部浏览器审查了完整中英文增量。首轮因四处双语/证据范围不一致评分 **8/10**；按意见修订后复审为 **10/10**，无实质修订项。Gemini 明确无法访问 GitHub 或本地工作区，因此这是对所提供文本的审查，不是对仓库或源工作簿的独立验证。

### Phase 0 KPM Admin/Guru 教程与 Classroom 生命周期抽样（2026-11-22，内部浏览器，只读）

只读核对 KPM AppSheet 的 `MODUL ADMIN`、`MODUL GURU` 菜单及已打开的 Google Slides 流程教程。这些菜单行主要是 `Open Url` 外链到 Google Classroom 教学材料，并非 AppSheet 内的提交/审批表单。教程记载的旧校务流程为：学校 Admin 建 Classroom 班级与 Topic，将学校副本的教案资料表放入 Drive，设置每班 Assignment 的开放时间、截止时间及适用班级，可复制排程给所有班；教师以 Classroom 作业副本填写并呈交；审核员使用学校 Delima 帐号查看已呈交/缺交作业、逐项打开、打分和留言，也可批量 Return。该证据只说明书面流程，不证明现时 Classroom 配置、OAuth 授权或 API 集成已核实。

教师转校教程要求先把个人 e-RPH 记录移至个人 Drive 文件夹，再由旧校 Admin 从 Classroom 移除账号；教程警示移除后原班级中的教师记录可能不可见/消失。教程所写“保留到 2024/2025 学年结束”属于过期教学资料中的旧建议，不作为当前法定/学校保留政策。架构要求应落实教师作品与原学校提交/审核/归档历史长期分离保存；教师可显式导出/迁移，学校 membership 的移除、历史档案可见性和 lesson deletion 必须是不同操作，逐项审计并保留来源校关联。该观察为产品生命周期需求提供来源，不取代现行隐私/保留政策核准。没有修改 Classroom、作业、成员、文件或工作簿；未将示例中的个人姓名、学校名称或教案正文抄录至本报告。

本轮 AppSheet 菜单、工作簿与教程审查未覆盖所有表单条件、验证公式、权限策略、实际提交数据/API、邮件/提醒、文件权限或现行保留政策；这些仍是 Phase 0 阻断项。Phase 0 **7.08/10 HOLD**，Phase 1 **HOLD**。

Gemini 在 Codex 内部浏览器对本轮完整中英文增量复审评分 **10/10**，无实质修订项。Gemini 无法访问 GitHub 或本地工作区；该评分仅针对所提供文本，不是对仓库或源资料的独立验证。

### Phase 0 线上首页与健康端点复查（2026-11-22 01:15 MYT，Codex 内部浏览器，只读）

内部浏览器打开 `https://erphpro.com/`，显示标题 `eRPH Pro · School operations software` 与主页内容；单独打开 `/health` 显示 `status=ok`、`database=ok`、`cache=ok`，release 配置标签为 `0973ac7474e915ed6cd9027829c47f547daad043`。浏览器界面未显示 HTTP status code。这仅证明该时点经公开域名成功渲染页面，不证明直连源站、持续可用、OAuth/业务流程、日志实时性、PHP-FPM/OPcache 实际服务 Git SHA 或部署 hook 成功。没有登录、部署、设置变更、日志/数据库操作或生产写入。历史 503 与稳定性/复发闸门仍未关闭；Phase 0 **7.08/10 HOLD**，Phase 1 **HOLD**。

Gemini 在 Codex 内部浏览器对本轮完整中英文增量首轮评分 **9.5/10**，指出英文缺少“经公开域名”路径限定及中文句末标点不一致；修订后复审为 **10/10**，无实质修订项。Gemini 无法访问本地工作区、GitHub 或生产系统；评分仅针对提交文本，不验证外部现场事实。

#### Phase 0 Plesk HTTPS 访问日志尾部复核（2026-11-22 01:15 MYT，Plesk 内部浏览器，只读）

Plesk File Manager 列出的 `logs/erphpro.com/access_ssl_log` 为 51.5 KB，修改时间为 2026-11-22 01:15 MYT。只读查看该单文件时，尾部记录了经公网域名的 `GET /` 于 01:15:46 返回 200、`GET /health` 于 01:15:51 返回 200。较早的 Nov 22 首页/健康请求也有 200；Nov 21 的 OAuth callback 历史失败与成功记录不在此处复述。单独列出的 `logs/erphpro.com/error_log` 仍为 19.4 KB，修改时间 Nov 21 18:00 MYT。没有复制 IP、OAuth 查询参数/授权码或个人身份信息；日志只在原位查看，没有下载、复制、编辑或删除。

这更新了对日志新鲜度的认知：aggregate Log Browser 仍停留在旧记录，但 Plesk File Manager 中单独查看的 HTTPS access log 已有截至 01:15:51 MYT 的新请求。它佐证主页和健康端点在两个具体时刻返回 HTTP 200，不证明连续无错误、所有路由可用、源站直连、应用异常日志无错、PHP-FPM/OPcache 的代码身份或部署 hook 成功。error_log 修改时间较旧，无法用于当前时段错误关联。历史 503 与 OAuth callback 失败仍成立；稳定性/复发、日志来源对账与安全保留、OAuth 根因/安全及运行代码身份闸门仍开放。Phase 0 仍为 **7.08/10 HOLD**，Phase 1 **HOLD**。未更改生产设置、部署、数据库或应用数据。


Gemini 在 Codex 内部浏览器复核本节完整中英文文本。首轮评分 9.5/10，指出审查消息中的格式伪影及中文标题层级/浏览器标注与英文不同；本地英文文件本身无误插入文本，现已对齐中文标题和 Plesk 标注。Gemini 对修订后的准确文本复评为 **10/10，无实质修改项**。Gemini 无法访问 GitHub、本地工作区或生产系统；该分数只审查文档，不关闭 Phase 0 或 Phase 1 闸门。

#### Phase 0 生产 Laravel 队列表元数据（2026-11-22 01:24 MYT，Plesk 内部浏览器，只读）

通过已认证的 Plesk Databases 页面打开现有 `erphpro` 数据库 phpMyAdmin，在 Structure 列表中看到 `jobs`、`failed_jobs`、`job_batches` 三表显示的估算行数均为 0。本记录仅描述 phpMyAdmin 在该时点展示的表元数据，不视为精确事务计数或队列健康证明。没有打开 Browse 页面、读取任务 payload/任何记录内容，也没有提交 SQL。未更改数据库或生产状态。

该快照与“当前显示的队列表没有积压记录”相符，但不证明 worker/scheduler 正在运行、任务确实入队、通知/导出/定时任务端到端成功，或不存在其他 queue backend/派发路径。生产队列消费者及交付验证闸门继续开放；Phase 0 **7.08/10 HOLD**，Phase 1 **HOLD**。


Gemini 在 Codex 内部浏览器对本节中英文增量独立审查评分 **10/10，无实质修订项**。审查仅依据提供的文字；Gemini 未检查仓库或生产数据库。该分数仅针对文档，不关闭生产队列消费者闸门；Phase 0 仍 **7.08/10 HOLD**，Phase 1 仍 **HOLD**。

#### Phase 0 Plesk 备份清单快照（2026-11-22 01:26 MYT，内部浏览器，只读）

Plesk Backup Manager 显示本地备份共 3 份、合计 10.3 GB。最新一项是 2026-11-21 00:24 MYT 的 subscription scheduled backup，标签为 “All configuration and content”，大小 5.67 GB。另有 11 月 13 日两项 domain-level 备份：一项 incremental，标签 “BrainShift Pro pre-deployment baseline”（+248 MB）；一项 “All configuration and content”，大小 4.43 GB。Plesk 还显示两条 11 月 13 日备份任务通知，称备份虽发生 minor issues 仍可恢复。本次没有新建、下载、恢复、删除或以其他方式更改备份。

这证明 Plesk 清单里有一份较新的订阅级备份，标签声称包含全部配置和内容；不证明 eRPH 数据库可独立恢复、相关表完整且一致、11 月 21 日备份任务无警告，或已在隔离目标完成恢复测试。备份/恢复闸门仍开放；数据归属以及非 migration 表的保留/依赖问题也未关闭。Phase 0 仍为 **7.08/10 HOLD**，Phase 1 仍为 **HOLD**。


Gemini 在 Codex 内部浏览器对照审查本节中英文完整增量，评分 **10/10，无实质修订项**；确认文字区分 Plesk 备份清单元数据与独立恢复验证，并保留未关闭的恢复/数据保留闸门。Gemini 未检查 Plesk、GitHub 或本地仓库；该分数仅适用于提供的文档，不代表 Phase 0 或 Phase 1 通过。

#### Phase 0 Plesk 定时备份配置快照（2026-11-22 01:28 MYT，内部浏览器，只读）

Plesk Scheduled Backup Settings 页面显示 “Activate this backup task” 未勾选。页面展示的已保存计划值为每日 01:15 MYT、启用增量备份、每周完整备份、最多保留 1 份完整备份；Plesk 同时说明主机商存储限制也将该值上限设为 1。备份范围选中了 Configuration、Mail messages、User files、Databases，存储位置为 Server storage；此页未配置远端存储。备份错误邮件通知选项未勾选。这些是任务未启用时页面展示的设置值，不代表有活动的循环任务。使用 Cancel 退出页面，没有点击 Save/Apply，未更改配置。

这表明该 Plesk 定时备份任务当前未启用；其展示的目标为服务器本地存储，完整备份保留数上限为 1。它不能解释单独列出的 Nov 21 subscription backup，也不能证明不存在其他订阅/主机商备份计划；但此页未提供所覆盖范围的活动周期备份保护。备份新鲜度、异地保留、失败通知、独立数据库恢复与隔离恢复演练仍未闭合。Phase 0 **7.08/10 HOLD**，Phase 1 **HOLD**。


Gemini 在 Codex 内部浏览器对本节完整中英文文本审查评分 **10/10，无实质修订项**。审查确认已区分未启用的定时任务与另列的订阅级备份，也未排除其他备份计划。Gemini 未访问 Plesk 或仓库；评分仅针对文档，不关闭恢复闸门，也不改变 Phase 0/Phase 1 状态。

#### Phase 0 Plesk Git 当前部署配置（2026-11-22 01:30 MYT，内部浏览器，只读）

Plesk `erphpro.com` 的 Git 设置页显示所跟踪分支为 `main`，Automatic deployment 已选中，部署目录为 `/erphpro.com`，post-deployment actions 已启用。页面说明 Plesk 仓库所选分支出现新 commit 时会自动部署。提交列表显示 `f84cb98`（`fix google oauth callback provisioning`），Plesk 页面呈现的 Git 记录时间为 `2026-11-21 16:08:12`，其时区没有独立验证。post-deployment 命令及带凭据字段不抄录。使用 Cancel 退出设置页；没有点击 Pull、Deploy、Apply，也没有更改设置。

这确认 Plesk 当前 UI 配置为跟踪 `main` 并自动把其 Plesk 仓库中出现的新提交部署到配置目录；不证明所示 tip 已成功部署、hook 已成功执行，或 PHP-FPM/OPcache 正在服务对应 Git 文件树。本地工作区目前仍在 `codex/phase0-workspace-reconciliation`、HEAD `a657fb1`；本地文档提交尚未推送到 `main`，也未部署。自动部署的迁移/Seeder 安全及部署前可恢复性闸门仍开放；Phase 0 **7.08/10 HOLD**，Phase 1 **HOLD**。

Gemini 在 Codex 内部浏览器对本节双语文本独立审阅，评分 **10/10，无实质修改项**。该审阅仅基于提供的文字，未访问 Plesk 或仓库；不构成部署成功证明，也不改变阶段闸门。

#### Phase 0 local candidate: support AI consent and outbound privacy gate (2026-11-22)

A local, un-deployed candidate at commit `da503522e9dbd5c45c5fb6db91bc9111ac68d575` adds explicit per-ticket consent before support-ticket content can be sent to DeepSeek for draft analysis. The feature defaults off and requires both `SUPPORT_AI_ANALYSIS_ENABLED=true` and a configured API key. The server records consent version and timestamp; service-side checks reject missing or stale consent, disabled configuration, and designated sensitive ticket categories. A limited redaction pass covers common email, Malaysian ID, phone, and payment-number patterns. AI output remains a human-reviewed draft; no automatic customer reply is enabled.

Candidate validation on PHP 8.4.27 passed **48 tests / 205 assertions**, with HTTP fakes; no live DeepSeek request was made. This is local candidate evidence only. No production migration, deployment, or provider configuration change occurred. The redaction rules do not identify every name, student detail, or other personal data. Provider retention/region and applicable data-processing terms remain unverified, so the production AI gate remains closed and AI stays disabled by default. No Gemini review of this exact code commit has been completed; the previously recorded 10/10 reviews apply only to the specific documentation increments named in those records. Phase 0 remains **7.08/10 HOLD** and Phase 1 remains **HOLD**.

Subsequent deployment-hook self-review found that an unset `SSR_HEALTH_URL` previously allowed the hook to finish without checking the HTTP health payload or release label. The candidate now aborts before dependency/cache commands when the health URL is absent; the Plesk contract requires it, and the deployment-hook self-check includes this negative case. `bash scripts/test-deploy-ssr.sh` passes and `git diff --check` is clean in the local candidate. No Plesk execution occurred. Gemini has not reviewed this exact code change; production Phase 0 remains **7.08/10 HOLD**, and Phase 1 remains **HOLD**.

Further source review found that authenticated ticket pages and Google OAuth callback responses did not consistently set cache/referrer protections. A candidate middleware now sets `Cache-Control: no-store, private` and `Referrer-Policy: no-referrer` on ticket workflow routes and the OAuth callback. Feature assertions cover an authorized ticket page, a legacy token-query redirect, and the Owner OAuth callback. The full local PHP suite passes **48 tests / 217 assertions**; PHP syntax checks and `git diff --check` pass. These headers reduce caching and subsequent referrer exposure; they cannot prevent Plesk or upstream access logs from recording the incoming callback/query URL. Historical log handling, OAuth code/query redaction at the web-server layer, and exact production runtime verification remain open. No production changes occurred; Gemini has not reviewed this exact code increment. Phase 0 remains **7.08/10 HOLD**, and Phase 1 remains **HOLD**.

#### Phase 0 local tenant-isolation candidate (2026-11-22)

The local candidate now resolves `tenant_school_id` from the request host in middleware prepended to the `web` group, before implicit route model binding. A default Eloquent tenant scope covers teacher profiles, curriculum items, lesson plans, reviews, submissions, school settings, and timetable slots; lesson-plan versions, reviews, and submissions are additionally constrained through their parent lesson plan. Requests with no valid school context, including the public root/support hosts, return no school-owned rows. Console/background work without an explicit tenant context also fails closed; the Demo seeder uses narrowly scoped `withoutGlobalScopes()` only for its two school bootstrap upserts.

Feature coverage verifies a cross-school lesson-plan ID returns 404, the foreign plan version/review/submission cannot be read from the Demo tenant even when child rows carry a forged matching `school_id`, ordinary Demo school RPH/settings workflows continue to work, and non-school/CLI contexts return no tenant-owned records. Full local PHP validation passes **50 tests / 229 assertions**. This is candidate-only evidence: production tenant authorization, existing data consistency, and queue-job context propagation remain unverified. No production migration/deployment or real tenant-data access occurred, and Gemini has not reviewed the exact code increment. Phase 0 remains **7.08/10 HOLD**; Phase 1 remains **HOLD**.

#### Phase 0 local candidate route inventory (2026-11-22, SHA `5a55cfd99cb1064e3a2f86fb1bf7d0d18e59b029`)

Read-only `php artisan route:list --except-vendor -v --json` at candidate SHA `665ec330e341a627a947451cc223ee8164befb94` returns **50 routes**. Eight platform Owner routes are present: `/owner/login` and `/owner/auth/google/redirect` use `web` only; `/owner`, `/owner/audit`, and the four `/owner/support/*` operations use `web`, `auth`, and `platform.owner`. Separately, nine routes are served on the support host (home/solutions/article and six ticket operations); ticket workflow routes also use `PreventSensitiveResponseCaching`, with the listed per-route throttles on writes. Thus 17 routes contain `owner` or `support` in their URI/name, split between these two route groups. This confirms only the source-level middleware assignment; it does not prove host/Guard/session/CSRF isolation or runtime authorization across browser identities.

The route inventory still exposes no platform school-lifecycle, platform-team/RBAC, or global-settings routes. The `/owner` UI remains a read-only school list, as documented above. The count increased from the dated 2026-11-21 baseline of 48 after candidate support changes. No production route list was queried. This inventory is local static evidence only, is not a Gemini review, and does not change Phase 0 **7.08/10 HOLD** or Phase 1 **HOLD**.

Current-head confirmation (2026-11-22, candidate SHA `30ab8766b0886af09765650eae0cf4c38cb3f929`): rerunning `php artisan route:list --except-vendor -v --json` returns 50 routes and the same eight Owner routes. Source review of `OwnerController` and `owner/dashboard.blade.php` confirms the page only lists school names, subdomains, member counts and active state; there are no create/edit/disable actions. This reconfirms that a successful Owner sign-in is not a complete platform admin backend. It is local source evidence only; it does not verify production routes, host/Guard/session separation or browser authorization. No route, controller, view or production setting was changed.

#### Phase 0 KPM 2026 `RPT`/`DATA` formula-only dependency check (2026-11-22, read-only)

Using Google Drive's bounded `userEnteredValue(formulaValue)` read for `RPT!A1:BV30` and `DATA!A1:CK100` only (no calculated values), the inspected `RPT` range contains 107 formula cells: 60 cascading `FILTER` formulas for `FTAHUN`/`FSK`/`FSP`, 21 `IF`, 7 `IFERROR`, one `UPPER`, and 18 direct-reference/concatenation formulas. The same RPT range contains 92 validation cells: 85 `ONE_OF_RANGE` rules referencing `DSKP!A3:A` and local helper ranges `O7:O`, `P7:P`, `Q7:Q`; 7 other `ONE_OF_LIST` rules were not read for option values. A formula-only read locates the external import at `DATA!CH1` (not `CK1`): it imports `DATASK!CH:CK` from the separate `00. Nota/Link eRPH KPM` workbook (`1BuqPByLOjLsotu3JB22mEbwnfHwrPUbDtCABprjTM-w`). The same workbook is also referenced by `MENU!J3`, importing `MENUSK!J3:J52`. A header-only follow-up on `DATASK!CH1:CK1` identifies the four imported columns as `RUJUKAN`, `LINK`, `BUKU TEKS`, and `LINK`; no data rows, destination formula results, link targets, or sharing/rights behavior were inspected. The dependency means this KPM copy is not proven self-contained. Its owner-approved availability, actual link availability, rights, named-range definitions, and full formula coverage remain open. No source sheet was changed. The detailed evidence is in `docs/RPH_FORMAT_MAPPING.md`.

This is a bounded formula inventory, not an independent Gemini review or a full KPM/AppSheet audit. Phase 0 remains **7.08/10 HOLD** and Phase 1 remains **HOLD**; no phase gate is closed by this observation.

#### Phase 0 KPM form-validation reference inventory (2026-11-22, Google Sheets metadata only)

Re-read only `dataValidation` fields in the bounded KPM source ranges `MENU!A1:AY60`, weekday tabs `ISNIN`–`JUMAAT!A1:FJ40`, `RPT!A1:BV30`, and `DATA!A1:CK100`; no cell values or fixed-list choices were returned. Counts are 200 `MENU` range rules (40 reference `DSKP!A3:A`; 40 other per-column helper ranges in `MENU!L:AY`; remaining references point to `DATA!A/B`), 44 range rules per weekday (13 `DATA!N/U/V` references and 31 local helper references per page), 92 `RPT` rules (85 range plus 7 fixed-list), and 97 `DATA` range rules (all reference `DSKP!A3:A`). The `KHAMIS!B31` cross-day reference to `ISNIN!AG6:AG` remains an unexplained source variance. No `CUSTOM_FORMULA` rule appeared in these sampled rectangles; multiple helper-range endpoints differ and must be preserved exactly.

This is spreadsheet validation metadata, not AppSheet `Valid_If`/`Show_If`, role visibility, submit-time behavior, or complete workbook coverage. The metadata API omitted named-range definitions. The exact per-source range-family counts and remaining limits are in `docs/RPH_FORMAT_MAPPING.md`. No rules or source files were modified. Phase 0 remains **7.08/10 HOLD** and Phase 1 remains **HOLD**.

The KPM 2026 SR metadata comparison now covers two same-title v2 copies. Both list nine tabs (`MENU`, `ISNIN`–`JUMAAT`, `RPT`, `DSKP`, `DATA`) with `hidden=false` and matching grid dimensions; bounded formula/validation reads in `RPT!A1:BV30` and `DATA!A1:CK100` match exactly. Drive metadata marks the later copy as shared and modified 2 minutes 36 seconds after the earlier copy, but does not establish which copy AppSheet uses or who can access it. This differs from the separately sampled KPM Tingkatan 6 workbook, whose five day tabs are Sunday–Thursday; retain stage-specific calendar variability and do not collapse these samples into one schedule rule. See `docs/RPH_FORMAT_MAPPING.md` for IDs, timestamps, ranges, and remaining limits.

Formula-only reads of the five bounded weekday grids found 258 formulas each on `ISNIN`, `RABU`, `KHAMIS`, and `JUMAAT`, versus 290 on `SELASA`; all 32 extra `SELASA` formulas are `FILTER`s in row 38 across later class blocks. Purpose remains unverified, so keep this variation in the field/condition mapping instead of forcing weekday symmetry. Detailed columns and the bounded cross-sheet dependency inventory are recorded in `docs/RPH_FORMAT_MAPPING.md`.

The KPM 2026 SR `DSKP` header-only read returned 17 columns, with column O blank and raw headers `SUBJEK`, `TAHUN`, `TEMA/BIDANG/TERAS`, `tema2`, `TAJUK/KEMAHIRAN/NILAITERAS`, `tajuk2`, `SK`, `SP`, `NTERAS`, `TSIVIK:`, `OB`, `Pengetahuan`, `Sosioemosi:`, `Tindakan:`, blank, `XTVT`, `XTVT2`. Grid size is 56,813 × 17, not a populated-record count. Ambiguous labels and content provenance/rights remain unresolved; no curriculum body rows were read. See `docs/RPH_FORMAT_MAPPING.md` for the exact position mapping.

#### Phase 0 archived SQL table-consumer and write-surface source audit (2026-11-22, local source only)

The existing [12-table usage matrix](PHASE0_LEGACY_TABLE_USAGE_MATRIX.md) was cross-checked against exact SQL table-name references in Laravel SSR and `legacy-archive/app.py`. Current SSR has no exact consumers for the 12 observed non-migration tables (`support_articles` is a different table). The archived Flask file maps nine of the 12 names; route-level ORM reads/writes exist for `articles`, `tasks`, `dskp_standards`, `leave_records`, and `system_settings`; `calendar_events`, `notifications`, `reference_items`, and `timetable_templates` are model-only in that file. `legacy_lesson_plans`, `legacy_schools`, and `legacy_users` have no exact first-party source-name matches. Source code does not prove deployment, reachability, or production data lineage.

An additional release-safety risk is now explicit: archived `POST /api/dskp/sync` defaults to replacement and deletes existing DSKP rows before inserting; `GET /api/seed_2026` executes a checked-in SQL file. A metadata-only scan counted 395 `INSERT INTO lesson_plans` statements with one shared 16-column signature, without reading row values or executing it. That signature is incompatible with the current SSR migration schema for `lesson_plans` (for example, it uses `teacher_id`/`date` instead of required `teacher_profile_id`/`lesson_date`), though the exact production table structure was not rechecked. The archived source has no Flask global `before_request` auth hook or route `login_required` decorator; proxy protection and service reachability are unknown. Therefore the archived write surfaces and the production tables must be preserved until the service route, process, and DB target are read-only verified. No app endpoint, database, or SQL seed was run. This source audit is not an independent Gemini review; Phase 0 remains **7.08/10 HOLD**, Phase 1 remains **HOLD**, and no release gate is changed.

#### Phase 0 current candidate regression verification (2026-11-22, local only)

At candidate commit `6c339a98dd43e0ca3403163476135401eaacf5c7`, `php artisan test` passed **50 tests / 229 assertions** on PHP 8.5.8. `ssr/phpunit.xml` configures SQLite `:memory:`, array cache/session/mail, and a synchronous queue, so this run did not target the production database or send mail. `bash scripts/test-deploy-ssr.sh` also reported `Atomic deployment hook self-check passed.` The attempted `php artisan test --no-interaction` was rejected by PHPUnit as an unknown option before any test executed; it was rerun with the supported command above. These are local candidate checks only: they do not prove Plesk hook execution, production runtime identity, migration/recovery safety, or user-facing behavior. No production database, Plesk configuration, deployment, or external provider was touched. Gemini has not reviewed this exact candidate commit; Phase 0 remains **7.08/10 HOLD**, and Phase 1 remains **HOLD**.

#### Phase 0 Google One Tap login-CSRF candidate fix (2026-11-22, local only)

Ponytail review found that `/auth/google/one-tap` is explicitly exempted from Laravel's CSRF middleware while the controller previously verified the Google ID token without validating the `g_csrf_token` cookie/body double-submit pair. The candidate now rejects missing, non-string, or mismatched values before ID-token verification, using a constant-time equality check. Two feature cases cover missing/mismatched rejection and a matching pair proceeding to credential validation. At exact candidate commit `f96d9d51f1267d0c693a6c34b407fa9838ae9c89`, `php artisan test` passes **52 tests / 236 assertions** on PHP 8.5.8 with in-memory SQLite and array-backed services; PHP syntax checks and `git diff --check` pass, and `bash scripts/test-deploy-ssr.sh` reports `Atomic deployment hook self-check passed.`

This is local candidate evidence only. A real Google GIS browser post, Plesk runtime, and OAuth provider configuration were not exercised; the candidate is not pushed or deployed, and Gemini has not reviewed this exact SHA. The app's broader OAuth callback/log handling and production runtime identity remain separate open gates. Phase 0 remains **7.08/10 HOLD**; Phase 1 remains **HOLD**.

#### Phase 0 deployment health transport integrity (2026-11-22, local only)

Ponytail review found the atomic deployment hook required a health URL but did not require HTTPS, even though the health payload controls promotion of the new release. Candidate commit `37ebcdcc300870ec97dedaff410364e2ea73b55e` now rejects non-HTTPS health URLs before build or symlink work. The hook self-check includes an HTTP negative case and verifies it leaves the current symlink unchanged and runs no build commands. `bash -n scripts/deploy-ssr.sh scripts/test-deploy-ssr.sh`, `git diff --check`, and the post-commit `bash scripts/test-deploy-ssr.sh` pass. No Plesk hook execution or production switch occurred; this change is not pushed/deployed, and Gemini has not reviewed the exact candidate SHA. Phase 0 remains **7.08/10 HOLD**; Phase 1 remains **HOLD**.

#### Phase 0 deployment-lock cleanup regression (2026-11-22, local candidate)

Ponytail review found that the atomic deployment hook acquired `.deploy.lock` before registering its exit cleanup trap. If the first `readlink` of the current release failed, `set -e` exited while leaving the lock behind, causing later automatic deployments to stop. Candidate commit `c5e097e399a30aa91f17205f0599d9697267ec23` registers cleanup first; its added self-check simulates the read failure and verifies both that the current release remains unchanged and that the lock is removed. `bash -n`, `bash scripts/test-deploy-ssr.sh`, and `git diff --check` pass; GitHub Actions run 31 for that exact code SHA completed successfully. This evidence is limited to the isolated local/CI harness: no Plesk hook, production filesystem, database, or PHP-FPM runtime was accessed or changed. Gemini has not reviewed this exact code candidate. Phase 0 remains **7.08/10 HOLD** and Phase 1 **HOLD**.


### Phase 0 当前候选与生产 schema 门禁（2026-11-22）

候选分支 `codex/phase0-code-candidates` 当前 HEAD 为 `4cd46fa2991332f79911b04e0487f74b3a7033c3`，对应草稿 PR #1；PR 未合并、未部署，且没有该 SHA 的 Gemini review。最近的代码树 SHA `8a878fb4d40db61fd4c8948e0557460a74b06ff3` 之后的 `4cd46fa` 只更新了证据文档。

候选仓库当前有 15 个 Laravel migration 文件；最近一次生产只读 migration ledger 观察（2026-11-21）记录 13 项，和当时 `main@f84cb98` 的 13 个迁移文件相符。候选相对旧基线新增 `2026_11_21_000500_add_ticket_access_recovery.php` 与 `2026_11_22_000001_add_ai_processing_consent_to_support_tickets.php`，两者都会改变 `support_tickets` schema。生产 ledger 本轮没有重新读取，因此“当前正好有两项 pending”仍是待验证推断；部署前须在 Plesk 只读核实。候选 hook 使用 `migrate:status --pending=1` 并在有 pending 或状态不可读取时 fail closed，不会自动应用 migration；生产备份/恢复点、独立获批迁移和回滚/前滚方案仍是发布门禁。没有对生产数据库执行 migration。

候选源 SHA `414b18afb83b660bb3c161a068b6eeaf4384988d` 的本地 Laravel suite 通过 52 tests / 236 assertions，部署 hook 临时文件系统自检通过；GitHub Actions PR run #50 (`44988884503`) 在源码树 SHA `8a878fb4d40db61fd4c8948e0557460a74b06ff3` 通过 DSKP 安全、部署 hook 与 SSR 测试。测试均不代表 Plesk 运行态验收。当前 PR 仍待当前精确 diff 的 Gemini 11 维 10/10 审查；Phase 0 继续 HOLD。

#### Phase 0 current Plesk pre-hook atomicity finding (2026-11-22)

Ponytail security/deployment-focused source review compared the current deployment hook's isolated-release contract with the recorded Plesk Git settings. Plesk currently tracks `main`, pulls to `/erphpro.com/`, and runs its post-deployment action after updating that checkout; the active document root is `/erphpro.com/ssr/public`, inside the same checkout. Therefore an Auto Deploy pull can replace active SSR files before `scripts/deploy-ssr.sh` starts. The hook's health-gated symlink swap cannot roll back that pre-hook write. This is a concrete deployment-safety mismatch, independent of the hook's local atomic-release self-check.

The candidate now records this as a release blocker in `docs/PLESK_SSR_DEPLOYMENT.md` and PR #1. Before any candidate merge/deployment, Plesk must be configured to pull into a source path separate from the active document root; the versioned release path, document root, required hook paths/permissions, and rollback must then be verified. No Plesk setting, production file, database, or release was changed. The exact candidate remains unreviewed by Gemini; this finding does not change the latest valid overall Phase 0 score of **7.08/10 HOLD**, and Phase 1 remains **HOLD**.

#### Phase 0 DSKP seed path confinement (2026-11-22, local candidate)

Ponytail review found that `backend/seed_dskp.py` rejected non-empty databases but could still follow a symlinked `backend/instance` directory or `erph.db` file to an empty SQLite file outside the intended local demo path. An explicit demo-init run could then create schema and seed rows at that external target. Candidate commit `3e8d23d8a6ebe8c0fb90573f94eb0b84f72f2a82` now rejects symlinked paths, resolved database paths outside `backend/`, and multiply-linked database files before importing the app or opening SQLite. The synthetic subprocess suite passes **8 tests**, including file symlink, directory symlink, hard-link, and no-write assertions; `git diff --check` passes. GitHub Actions run `44990945640` then passed on exact candidate HEAD `57db12a321d132f3dbdb1970f52bcb244239bb83`, including the DSKP safety suite, deployment-hook validation, and SSR suite. No production or user database was accessed. This fix is candidate code and has not received Gemini review at its exact SHA; Phase 0 remains **7.08/10 HOLD** and Phase 1 **HOLD**.

After the documentation-only update to candidate HEAD `8e0248f822ffdee07174f8c28a207b9e860f2104`, GitHub Actions run `44991213698` passed on that exact SHA. The `test` job completed the DSKP safety tests, deployment-hook validation, and SSR tests. This is hosted CI evidence only; no Plesk hook, production DB, or production runtime was exercised.
