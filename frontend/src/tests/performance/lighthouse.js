const lighthouse = require('lighthouse')
const chromeLauncher = require('chrome-launcher')
const fs = require('fs')
const path = require('path')

/**
 * Lighthouse性能测试配置
 */
const lighthouseConfig = {
  extends: 'lighthouse:default',
  settings: {
    onlyAudits: [
      'first-contentful-paint',
      'largest-contentful-paint',
      'first-meaningful-paint',
      'speed-index',
      'interactive',
      'cumulative-layout-shift',
      'total-blocking-time',
      'max-potential-fid'
    ],
    emulatedFormFactor: 'desktop',
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      cpuSlowdownMultiplier: 1,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0
    }
  }
}

/**
 * 运行Lighthouse性能测试
 */
async function runLighthouseTest(url, options = {}) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] })
  
  try {
    const runnerResult = await lighthouse(url, {
      port: chrome.port,
      ...options
    }, lighthouseConfig)

    const reportHtml = runnerResult.report
    const score = runnerResult.lhr.categories.performance.score * 100

    return {
      score,
      report: reportHtml,
      audits: runnerResult.lhr.audits
    }
  } finally {
    await chrome.kill()
  }
}

/**
 * 批量测试多个页面
 */
async function runBatchTest(urls, outputDir = './performance-reports') {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const results = []

  for (const [name, url] of Object.entries(urls)) {
    console.log(`Testing ${name}: ${url}`)
    
    try {
      const result = await runLighthouseTest(url)
      
      // 保存HTML报告
      const reportPath = path.join(outputDir, `${name}-report.html`)
      fs.writeFileSync(reportPath, result.report)
      
      // 收集性能指标
      const metrics = {
        name,
        url,
        score: result.score,
        fcp: result.audits['first-contentful-paint'].numericValue,
        lcp: result.audits['largest-contentful-paint'].numericValue,
        fmp: result.audits['first-meaningful-paint'].numericValue,
        si: result.audits['speed-index'].numericValue,
        tti: result.audits['interactive'].numericValue,
        cls: result.audits['cumulative-layout-shift'].numericValue,
        tbt: result.audits['total-blocking-time'].numericValue,
        fid: result.audits['max-potential-fid'].numericValue
      }
      
      results.push(metrics)
      console.log(`✅ ${name} - Score: ${result.score.toFixed(2)}`)
      
    } catch (error) {
      console.error(`❌ Error testing ${name}:`, error.message)
      results.push({
        name,
        url,
        error: error.message
      })
    }
  }

  // 保存汇总结果
  const summaryPath = path.join(outputDir, 'performance-summary.json')
  fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2))
  
  // 生成汇总报告
  generateSummaryReport(results, outputDir)
  
  return results
}

/**
 * 生成汇总报告
 */
function generateSummaryReport(results, outputDir) {
  let html = `
<!DOCTYPE html>
<html>
<head>
  <title>Performance Test Summary</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .good { color: green; }
    .medium { color: orange; }
    .poor { color: red; }
    .error { color: red; font-weight: bold; }
  </style>
</head>
<body>
  <h1>Performance Test Summary</h1>
  <p>Generated on: ${new Date().toLocaleString()}</p>
  
  <table>
    <thead>
      <tr>
        <th>Page</th>
        <th>Score</th>
        <th>FCP (ms)</th>
        <th>LCP (ms)</th>
        <th>FMP (ms)</th>
        <th>SI</th>
        <th>TTI (ms)</th>
        <th>CLS</th>
        <th>TBT (ms)</th>
        <th>FID (ms)</th>
      </tr>
    </thead>
    <tbody>
  `

  results.forEach(result => {
    if (result.error) {
      html += `
        <tr>
          <td>${result.name}</td>
          <td colspan="9" class="error">Error: ${result.error}</td>
        </tr>
      `
    } else {
      const scoreClass = result.score >= 90 ? 'good' : result.score >= 50 ? 'medium' : 'poor'
      html += `
        <tr>
          <td>${result.name}</td>
          <td class="${scoreClass}">${result.score.toFixed(2)}</td>
          <td>${result.fcp.toFixed(2)}</td>
          <td>${result.lcp.toFixed(2)}</td>
          <td>${result.fmp.toFixed(2)}</td>
          <td>${result.si.toFixed(2)}</td>
          <td>${result.tti.toFixed(2)}</td>
          <td>${result.cls.toFixed(4)}</td>
          <td>${result.tbt.toFixed(2)}</td>
          <td>${result.fid.toFixed(2)}</td>
        </tr>
      `
    }
  })

  html += `
    </tbody>
  </table>
  
  <h2>Performance Thresholds</h2>
  <ul>
    <li><strong>Good:</strong> Score ≥ 90</li>
    <li><strong>Needs Improvement:</strong> Score 50-89</li>
    <li><strong>Poor:</strong> Score < 50</li>
  </ul>
  
  <h2>Metrics Explanation</h2>
  <ul>
    <li><strong>FCP:</strong> First Contentful Paint</li>
    <li><strong>LCP:</strong> Largest Contentful Paint</li>
    <li><strong>FMP:</strong> First Meaningful Paint</li>
    <li><strong>SI:</strong> Speed Index</li>
    <li><strong>TTI:</strong> Time to Interactive</li>
    <li><strong>CLS:</strong> Cumulative Layout Shift</li>
    <li><strong>TBT:</strong> Total Blocking Time</li>
    <li><strong>FID:</strong> First Input Delay (estimated)</li>
  </ul>
</body>
</html>
  `

  const summaryHtmlPath = path.join(outputDir, 'performance-summary.html')
  fs.writeFileSync(summaryHtmlPath, html)
  
  console.log(`\n📊 Performance summary saved to: ${summaryHtmlPath}`)
}

// 主要测试页面配置
const testUrls = {
  'home': 'http://localhost:5173/',
  'login': 'http://localhost:5173/login',
  'dashboard': 'http://localhost:5173/dashboard',
  'cases': 'http://localhost:5173/cases',
  'case-detail': 'http://localhost:5173/cases/1',
  'users': 'http://localhost:5173/users',
  'mediation': 'http://localhost:5173/mediation',
  'litigation': 'http://localhost:5173/litigation',
  'settlement': 'http://localhost:5173/settlement'
}

// 如果直接运行此脚本
if (require.main === module) {
  const outputDir = process.argv[2] || './test-results/performance'
  
  console.log('🚀 Starting Lighthouse performance tests...')
  console.log('Make sure your application is running on http://localhost:5173')
  
  runBatchTest(testUrls, outputDir)
    .then(results => {
      console.log('\n✅ Performance tests completed!')
      console.log(`📁 Reports saved to: ${outputDir}`)
      
      const avgScore = results
        .filter(r => !r.error)
        .reduce((sum, r) => sum + r.score, 0) / results.filter(r => !r.error).length
      
      console.log(`📊 Average Performance Score: ${avgScore.toFixed(2)}`)
    })
    .catch(error => {
      console.error('❌ Performance tests failed:', error)
      process.exit(1)
    })
}

module.exports = {
  runLighthouseTest,
  runBatchTest,
  testUrls
}