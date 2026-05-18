#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType } = require("docx");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function safe(value, fallback = "") {
  return value == null ? fallback : String(value);
}

function csvEscape(value) {
  const str = safe(value);
  if (str.includes(",") || str.includes("\"") || str.includes("\n")) return `"${str.replace(/"/g, "\"\"")}"`;
  return str;
}

function avg(values) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}

function classifyBandPosition(value, band) {
  if (value < band.monthly_base_min) return "低于 band 下限";
  if (value <= band.monthly_base_mid) return "位于 band 下半段";
  if (value <= band.monthly_base_max) return "位于 band 上半段";
  return "高于 band 上限";
}

function buildDecision(payload) {
  const expected = payload.candidate.expected_monthly_base;
  const band = payload.band;
  const market = payload.market_benchmark;
  const internalAvg = avg(payload.internal_reference.same_level_employees.map((x) => x.monthly_base));

  const bandPosition = classifyBandPosition(expected, band);
  const risks = [];
  if (expected > band.monthly_base_max) risks.push("候选人期望高于当前 band 上限");
  if (expected > market.p75) risks.push("候选人期望高于市场 P75");
  if (expected > internalAvg * 1.08) risks.push("候选人期望明显高于内部同级平均水平");

  let recommendation = "建议按 band 中高位定薪";
  let suggestedBase = Math.min(Math.max(expected, band.monthly_base_mid), band.monthly_base_max);
  if (expected > band.monthly_base_max) {
    recommendation = "建议控制在 band 上限附近，必要时用一次性激励补足";
    suggestedBase = band.monthly_base_max;
  } else if (expected < band.monthly_base_mid) {
    recommendation = "建议按 band 中位附近定薪，保留一定调薪空间";
    suggestedBase = Math.max(expected, band.monthly_base_mid);
  }

  return {
    recommendation,
    suggestedBase,
    bandPosition,
    internalAvg: Math.round(internalAvg),
    risks
  };
}

async function writeDocx(filePath, title, sections) {
  const doc = new Document({
    sections: [{ children: [new Paragraph({ text: title, heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }), ...sections] }]
  });
  fs.writeFileSync(filePath, await Packer.toBuffer(doc));
}

function para(text, opts = {}) {
  return new Paragraph({ text, heading: opts.heading, spacing: { after: 160 } });
}

function bullet(text) {
  return new Paragraph({ text, bullet: { level: 0 }, spacing: { after: 120 } });
}

function keyValueTable(rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(([k, v]) => new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: k, bold: true })] })] }),
        new TableCell({ children: [new Paragraph(safe(v))] })
      ]
    }))
  });
}

async function main() {
  const inputPath = process.argv[2];
  const outDir = process.argv[3];
  if (!inputPath || !outDir) {
    console.error("Usage: node scripts/generate_band_offer_packet.js <input.json> <output-dir>");
    process.exit(1);
  }

  const payload = readJson(inputPath);
  ensureDir(outDir);
  const result = buildDecision(payload);

  const reportPath = path.join(outDir, "compensation-band-offer-review.docx");
  const summaryPath = path.join(outDir, "business-summary-message.docx");
  const trackerPath = path.join(outDir, "band-offer-review.csv");
  const jsonPath = path.join(outDir, "band-offer-review-output.json");

  await writeDocx(reportPath, "薪酬 Band 与定薪建议报告", [
    para("一、岗位与候选人概况", { heading: HeadingLevel.HEADING_1 }),
    keyValueTable([
      ["岗位名称", payload.position.job_title],
      ["职级", payload.position.level],
      ["工作城市", payload.position.city],
      ["候选人", payload.candidate.candidate_name],
      ["当前月薪", payload.candidate.current_monthly_base],
      ["期望月薪", payload.candidate.expected_monthly_base]
    ]),
    para("二、Band 与市场对标", { heading: HeadingLevel.HEADING_1 }),
    bullet(`Band 区间：${payload.band.monthly_base_min} - ${payload.band.monthly_base_max}`),
    bullet(`Band 中位值：${payload.band.monthly_base_mid}`),
    bullet(`市场 P25/P50/P75：${payload.market_benchmark.p25} / ${payload.market_benchmark.p50} / ${payload.market_benchmark.p75}`),
    bullet(`内部同级平均月薪：${result.internalAvg}`),
    bullet(`候选人期望位置：${result.bandPosition}`),
    para("三、定薪建议", { heading: HeadingLevel.HEADING_1 }),
    bullet(`建议：${result.recommendation}`),
    bullet(`建议月薪：${result.suggestedBase}`),
    bullet(`主要风险：${result.risks.join("；") || "暂无明显风险"}`),
    bullet(`岗位判断依据：${payload.candidate.target_role_reason}`),
    bullet(`市场备注：${payload.market_benchmark.notes}`)
  ]);

  await writeDocx(summaryPath, "给业务或老板的摘要", [
    para("建议发送对象：招聘负责人 / 业务负责人 / 审批人", { heading: HeadingLevel.HEADING_1 }),
    para(`${payload.candidate.candidate_name} 应聘 ${payload.position.job_title}，候选人期望月薪 ${payload.candidate.expected_monthly_base}，当前位于 ${result.bandPosition}。综合 band、市场分位和内部同级参考，${result.recommendation}，建议月薪控制在 ${result.suggestedBase} 左右。${result.risks.length ? `当前需重点关注：${result.risks.join("；")}。` : "当前未发现明显越带宽或市场失衡风险。"}`)
  ]);

  const header = ["candidate_name", "target_role", "expected_monthly_base", "band_position", "suggested_base", "risk_flags", "recommendation"];
  const row = [
    payload.candidate.candidate_name,
    payload.position.job_title,
    payload.candidate.expected_monthly_base,
    result.bandPosition,
    result.suggestedBase,
    result.risks.join("；"),
    result.recommendation
  ];
  fs.writeFileSync(trackerPath, `${header.join(",")}\n${row.map(csvEscape).join(",")}\n`, "utf8");

  fs.writeFileSync(jsonPath, JSON.stringify({
    normalized_data: payload,
    missing_information: [],
    risk_summary: result.risks.length ? result.risks.join("；") : "暂无明显高风险",
    priority_issues: result.risks,
    next_action: `按 ${result.suggestedBase} 左右准备定薪审批材料，并同步说明 band 与市场依据。`,
    message_draft: `${payload.candidate.candidate_name} 的期望薪资与岗位 band、市场分位已完成比对，建议 ${result.recommendation}。`,
    record_update: {
      candidate_name: payload.candidate.candidate_name,
      target_role: payload.position.job_title,
      suggested_base: result.suggestedBase
    },
    compliance_warning_if_any: []
  }, null, 2), "utf8");

  console.log(JSON.stringify({
    ok: true,
    files: {
      report: reportPath,
      summary: summaryPath,
      tracker: trackerPath,
      json: jsonPath
    }
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
