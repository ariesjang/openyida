# 本地校验修复

适用于 `design-plan`、`check-design`、Canvas `compile` 和发布前本地编译。保持业务完整性、主题 Provider 和抽屉结构校验，不删除检查或改用底层函数绕过。

1. 按 `details.issues` 的 `sourcePath`、`path`、`code` 与 `nextStep` 集中修改对应源文件。Plan 首次物化修 `business.json` / `visual.json` 的 facts，不改派生的 PRD、设计文档或 HTML；已确认方案沿用 `patch --materialize`。
2. 修改后回读文件，确认内容已保存，再执行原校验命令。`repair.inputHash` 包含输入文件和命令参数，Plan 同时记录预览事实、合并基线及保留的产物；输入与参数未变化时不重复执行。文件写入失败时先解决写入问题。
3. 用 `repair.errorHash` 比较错误集合。连续两次修复仍返回相同错误集合时，停止自动重试，保留文件并报告具体字段和未解决原因；不得删除目录、重新 init、编造业务内容或放宽校验求通过。CLI 返回诊断，不保存跨任务计数，由执行本任务的 agent 记录修复次数。
4. `DESIGN_PLAN_STALE_PART` 按提示使用可信基线与 `--rebase-parts`；基线缺失或真实冲突无法解决时停止。需求确认和已创建资源继续保留。

`warnings` 是非阻断问题，命令成功不代表其影响已消失；按告警内容检查并在交付中说明。此规则不授权重放远端写操作；写入结果未知时先回读，遵守命令的 `retrySafe`、`sideEffectState` 和恢复指引。
