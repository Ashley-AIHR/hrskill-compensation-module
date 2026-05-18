---
name: hr-compensation-checks
description: 帮中国 HR 在个税、社保、公积金申报前做数据检查、缺口定位、风险摘要和待办输出。 / Help HR teams in China check payroll filing data before IIT, social insurance, and housing fund submission.
version: 0.1.0
metadata:
  openclaw:
    homepage: https://github.com/Ashley-AIHR/hrskill-compensation-module
    envVars:
      - name: COMP_EXPORT_PATH
        required: false
        description: Optional local export path for filing check outputs.
---

# 薪酬申报检查助手 / Payroll Filing Check Assistant

当用户需要在个税、社保、公积金申报前快速发现数据缺口、识别高风险错误、整理待办事项时使用这个 skill。它不是完整算薪系统，而是一个帮 HR 在申报前“先排雷”的执行型助手。 / Use this skill when the user needs a fast pre-filing check for payroll, IIT, social insurance, and housing fund data in China.

## 当前最完整场景

`个税 / 社保 / 公积金申报前检查`

这个场景最适合第一版，因为它：

1. 高频
2. 真实
3. 风险感强
4. 不需要一开始就做完整算薪引擎

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

## 当前 production-ready workflow

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

1. 优先检查申报失败风险，而不是追求复杂表达。
2. 优先发现“漏人、错城市、错主体、错基数、缺专项附加扣除”。
3. 如果只能做一件事，先把高风险问题按人列清楚。
4. 不自动给出法律结论，但要明确提示合规风险。
5. 如果用户给了自己公司的检查口径，优先遵循用户口径。

## 参考资料

1. [references/compensation-workflows.md](references/compensation-workflows.md)
2. [references/real-user-scenario.md](references/real-user-scenario.md)

