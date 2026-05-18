---
name: hr-compensation-checks
description: 帮中国 HR 做薪酬 band 校验、市场调研摘要、定薪建议，以及个税社保公积金申报前检查。 / Help HR teams in China with compensation band review, market benchmark summaries, offer pricing suggestions, and payroll filing prechecks.
version: 0.2.0
metadata:
  openclaw:
    homepage: https://github.com/Ashley-AIHR/hrskill-compensation-module
    envVars:
      - name: COMP_EXPORT_PATH
        required: false
        description: Optional local export path for filing check outputs.
---

# 薪酬判断与申报检查助手 / Compensation Decision and Filing Check Assistant

当用户需要做两类薪酬工作时使用这个 skill：

1. 薪酬判断：band、市场调研、offer 定薪建议
2. 薪酬执行：个税、社保、公积金申报前检查

它不是完整薪酬系统，而是一个把“高阶判断”和“落地检查”都结构化的小助手。 / Use this skill for both compensation decision work and payroll filing risk checks in China.

## 当前 production-ready 场景

1. `薪酬 band / 市场调研 / 定薪建议`
2. `个税 / 社保 / 公积金申报前检查`

这两个场景分别解决两类问题：

1. 第一类解决“值多少钱、怎么定更合理”
2. 第二类解决“报之前有哪些坑、哪些风险要先排”

## 统一输出结构

处理这类薪酬检查任务时，始终产出：

```text
normalized_data
missing_information
risk_summary
priority_issues
next_action
message_draft
record_update
compliance_warning_if_any
```

要求：

1. `normalized_data` 要清楚列出人员、申报主体、申报地、基数和扣除信息。
2. `missing_information` 要直接指出缺什么字段、缺在哪一类人员上。
3. `risk_summary` 要优先写申报失败风险和合规风险。
4. `priority_issues` 要按高、中、低分级。
5. `next_action` 必须是 HR 今天可以执行的动作。
6. `message_draft` 默认写成给内部协作方的数据追回或风险说明话术。
7. `record_update` 适合写回申报 tracker 或月度薪酬待办表。

## 当前 production-ready workflows

### `review_compensation_band_and_offer`

触发：

1. HR 准备做 offer 定薪
2. HR 想看候选人期望与 band、市场分位、内部公平是否匹配
3. HR 想给老板准备定薪建议说明

典型输入：

1. 岗位职级与岗位族
2. band 最低值、中位值、最高值
3. 市场调研分位点
4. 候选人当前薪资与期望薪资
5. 内部同岗参考

典型输出：

1. band 位置判断
2. 市场对标摘要
3. 定薪建议
4. 风险说明
5. 给业务/老板的摘要
6. 可下载的分析报告、CSV、JSON

如果在本仓库本地运行，使用：

```text
node scripts/generate_band_offer_packet.js <input.json> <output-dir>
```

示例输入见 [assets/band-offer-review-input.sample.json](assets/band-offer-review-input.sample.json)。

### `precheck_payroll_filing`

触发：

1. 月度工资已经核完，准备进入个税、社保、公积金申报
2. HR 想先看有没有漏人、错基数、错申报地、错主体、专项附加扣除异常

典型输入：

1. 员工薪酬明细
2. 个税申报字段
3. 社保、公积金申报字段
4. 员工状态与法人主体信息

典型输出：

1. 高风险问题清单
2. 缺失字段清单
3. 申报前待办
4. 内部说明稿
5. 可下载的检查报告、CSV、JSON

如果在本仓库本地运行，使用：

```text
node scripts/generate_payroll_precheck_packet.js <input.json> <output-dir>
```

示例输入见 [assets/payroll-precheck-input.sample.json](assets/payroll-precheck-input.sample.json)。

## 工作原则

1. 做薪酬判断时，先看 band、市场和内部公平，再看单一薪资数字。
2. 做申报检查时，优先检查申报失败风险，而不是追求复杂表达。
3. 优先发现“漏人、错城市、错主体、错基数、缺专项附加扣除”。
4. 如果只能做一件事，先把高风险问题按人列清楚。
5. 不自动给出法律结论，但要明确提示合规风险。
6. 如果用户给了自己公司的口径或 band 规则，优先遵循用户口径。

## 参考资料

1. [references/compensation-workflows.md](references/compensation-workflows.md)
2. [references/real-user-scenario.md](references/real-user-scenario.md)
