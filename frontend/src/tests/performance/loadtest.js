const autocannon = require('autocannon')
const fs = require('fs')
const path = require('path')

/**
 * 负载测试配置
 */
const loadTestConfigs = {
  // 轻量级测试
  light: {
    connections: 10,
    duration: 10,
    requests: [
      {
        method: 'GET',
        path: '/',
        headers: {
          'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      }
    ]
  },
  
  // 中等强度测试
  medium: {
    connections: 50,
    duration: 30,
    requests: [
      {
        method: 'GET',
        path: '/',
        weight: 30
      },
      {
        method: 'GET',
        path: '/dashboard',
        weight: 25
      },
      {
        method: 'GET',
        path: '/cases',
        weight: 20
      },
      {
        method: 'GET',
        path: '/users',
        weight: 15
      },
      {
        method: 'GET',
        path: '/mediation',
        weight: 10
      }
    ]
  },
  
  // 高强度测试
  heavy: {
    connections: 100,
    duration: 60,
    pipelining: 1,
    requests: [
      {
        method: 'GET',
        path: '/',
        weight: 25
      },
      {
        method: 'GET',
        path: '/dashboard',
        weight: 20
      },
      {
        method: 'GET',
        path: '/cases',
        weight: 15
      },
      {
        method: 'GET',
        path: '/users',
        weight: 15
      },
      {
        method: 'GET',
        path: '/mediation',
        weight: 10
      },
      {
        method: 'GET',
        path: '/litigation',
        weight: 10
      },
      {
        method: 'GET',
        path: '/settlement',
        weight: 5
      }
    ]
  },
  
  // 极限测试
  extreme: {
    connections: 200,
    duration: 120,
    pipelining: 2,
    requests: [
      {
        method: 'GET',
        path: '/',
        weight: 20
      },
      {
        method: 'GET',
        path: '/dashboard',
        weight: 20
      },
      {
        method: 'GET',
        path: '/cases',
        weight: 15
      },
      {
        method: 'GET',
        path: '/users',
        weight: 15
      },
      {
        method: 'GET',
        path: '/mediation',
        weight: 10
      },
      {
        method: 'GET',
        path: '/litigation',
        weight: 10
      },
      {
        method: 'GET',
        path: '/settlement',
        weight: 10
      }
    ]
  }
}

/**
 * API负载测试配置
 */
const apiTestConfigs = {
  // API基础测试
  api_basic: {
    url: 'http://localhost:8080',
    connections: 20,
    duration: 30,
    headers: {
      'Authorization': 'Bearer test-token',
      'Content-Type': 'application/json'
    },
    requests: [
      {
        method: 'GET',
        path: '/api/users',
        weight: 30
      },
      {
        method: 'GET',
        path: '/api/cases',
        weight: 25
      },
      {
        method: 'GET',
        path: '/api/dashboard/statistics',
        weight: 20
      },
      {
        method: 'GET',
        path: '/api/mediation',
        weight: 15
      },
      {
        method: 'GET',
        path: '/api/litigation',
        weight: 10
      }
    ]
  },
  
  // API压力测试
  api_stress: {
    url: 'http://localhost:8080',
    connections: 100,
    duration: 60,
    headers: {
      'Authorization': 'Bearer test-token',
      'Content-Type': 'application/json'
    },
    requests: [
      {
        method: 'GET',
        path: '/api/users',
        weight: 25
      },
      {
        method: 'GET',
        path: '/api/cases',
        weight: 25
      },
      {
        method: 'POST',
        path: '/api/cases',
        body: JSON.stringify({
          caseNumber: 'LOAD_TEST_001',
          borrowerName: '测试用户',
          debtAmount: 100000
        }),
        weight: 20
      },
      {
        method: 'GET',
        path: '/api/dashboard/statistics',
        weight: 15
      },
      {
        method: 'PUT',
        path: '/api/users/1',
        body: JSON.stringify({
          realName: '更新用户'
        }),
        weight: 10
      },
      {
        method: 'GET',
        path: '/api/mediation',
        weight: 5
      }
    ]
  }
}

/**
 * 运行单个负载测试
 */
async function runLoadTest(config, url = 'http://localhost:5173') {
  console.log(`Starting load test: ${config.connections} connections for ${config.duration}s`)
  
  const instance = autocannon({
    url: config.url || url,
    connections: config.connections,
    duration: config.duration,
    pipelining: config.pipelining || 1,
    headers: config.headers || {},
    requests: config.requests
  })

  return new Promise((resolve, reject) => {
    autocannon.track(instance, {
      renderProgressBar: true,
      renderResultsTable: true,
      renderLatencyTable: true
    })

    instance.on('done', (result) => {
      resolve(result)
    })

    instance.on('error', (error) => {
      reject(error)
    })
  })
}

/**
 * 运行批量负载测试
 */
async function runBatchLoadTest(configs, baseUrl = 'http://localhost:5173', outputDir = './load-test-reports') {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const results = []

  for (const [name, config] of Object.entries(configs)) {
    console.log(`\n🔥 Running ${name} load test...`)
    
    try {
      const result = await runLoadTest(config, baseUrl)
      
      // 处理结果
      const summary = {
        name,
        config: {
          connections: config.connections,
          duration: config.duration,
          pipelining: config.pipelining || 1
        },
        results: {
          requests: result.requests,
          throughput: result.throughput,
          latency: result.latency,
          errors: result.errors,
          timeouts: result.timeouts,
          duration: result.duration
        },
        timestamp: new Date().toISOString()
      }
      
      results.push(summary)
      
      // 保存详细结果
      const detailPath = path.join(outputDir, `${name}-detail.json`)
      fs.writeFileSync(detailPath, JSON.stringify(result, null, 2))
      
      console.log(`✅ ${name} completed`)
      console.log(`   Requests: ${result.requests.total}`)
      console.log(`   Throughput: ${result.throughput.average.toFixed(2)} req/sec`)
      console.log(`   Latency (avg): ${result.latency.average.toFixed(2)}ms`)
      console.log(`   Errors: ${result.errors}`)
      
    } catch (error) {
      console.error(`❌ ${name} failed:`, error.message)
      results.push({
        name,
        error: error.message,
        timestamp: new Date().toISOString()
      })
    }
  }

  // 保存汇总结果
  const summaryPath = path.join(outputDir, 'load-test-summary.json')
  fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2))
  
  // 生成HTML报告
  generateLoadTestReport(results, outputDir)
  
  return results
}

/**
 * 生成负载测试HTML报告
 */
function generateLoadTestReport(results, outputDir) {
  let html = `
<!DOCTYPE html>
<html>
<head>
  <title>Load Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .metric { background-color: #f9f9f9; }
    .good { color: green; }
    .warning { color: orange; }
    .error { color: red; font-weight: bold; }
    .chart { margin: 20px 0; }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
  <h1>Load Test Report</h1>
  <p>Generated on: ${new Date().toLocaleString()}</p>
  
  <h2>Test Summary</h2>
  <table>
    <thead>
      <tr>
        <th>Test Name</th>
        <th>Connections</th>
        <th>Duration (s)</th>
        <th>Total Requests</th>
        <th>Throughput (req/s)</th>
        <th>Avg Latency (ms)</th>
        <th>Errors</th>
        <th>Timeouts</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
  `

  const chartData = {
    labels: [],
    throughput: [],
    latency: []
  }

  results.forEach(result => {
    if (result.error) {
      html += `
        <tr>
          <td>${result.name}</td>
          <td colspan="8" class="error">Error: ${result.error}</td>
        </tr>
      `
    } else {
      const r = result.results
      const errorRate = (r.errors / r.requests.total * 100).toFixed(2)
      const statusClass = r.errors > 0 ? 'error' : r.latency.average > 1000 ? 'warning' : 'good'
      
      html += `
        <tr>
          <td>${result.name}</td>
          <td>${result.config.connections}</td>
          <td>${result.config.duration}</td>
          <td>${r.requests.total}</td>
          <td>${r.throughput.average.toFixed(2)}</td>
          <td class="${statusClass}">${r.latency.average.toFixed(2)}</td>
          <td class="${r.errors > 0 ? 'error' : 'good'}">${r.errors} (${errorRate}%)</td>
          <td class="${r.timeouts > 0 ? 'error' : 'good'}">${r.timeouts}</td>
          <td class="${statusClass}">${r.errors === 0 ? 'PASS' : 'FAIL'}</td>
        </tr>
      `
      
      chartData.labels.push(result.name)
      chartData.throughput.push(r.throughput.average)
      chartData.latency.push(r.latency.average)
    }
  })

  html += `
    </tbody>
  </table>
  
  <h2>Performance Charts</h2>
  <div class="chart">
    <canvas id="throughputChart" width="400" height="200"></canvas>
  </div>
  <div class="chart">
    <canvas id="latencyChart" width="400" height="200"></canvas>
  </div>
  
  <h2>Performance Criteria</h2>
  <ul>
    <li><strong>Good:</strong> Latency < 500ms, Error rate < 1%</li>
    <li><strong>Warning:</strong> Latency 500-1000ms, Error rate 1-5%</li>
    <li><strong>Error:</strong> Latency > 1000ms, Error rate > 5%</li>
  </ul>
  
  <script>
    // Throughput Chart
    const throughputCtx = document.getElementById('throughputChart').getContext('2d');
    new Chart(throughputCtx, {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(chartData.labels)},
        datasets: [{
          label: 'Throughput (req/s)',
          data: ${JSON.stringify(chartData.throughput)},
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Throughput Comparison'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
    
    // Latency Chart
    const latencyCtx = document.getElementById('latencyChart').getContext('2d');
    new Chart(latencyCtx, {
      type: 'line',
      data: {
        labels: ${JSON.stringify(chartData.labels)},
        datasets: [{
          label: 'Average Latency (ms)',
          data: ${JSON.stringify(chartData.latency)},
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 2,
          fill: false
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Latency Comparison'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  </script>
</body>
</html>
  `

  const reportPath = path.join(outputDir, 'load-test-report.html')
  fs.writeFileSync(reportPath, html)
  
  console.log(`\n📊 Load test report saved to: ${reportPath}`)
}

// 如果直接运行此脚本
if (require.main === module) {
  const testType = process.argv[2] || 'frontend'
  const testLevel = process.argv[3] || 'light'
  const outputDir = process.argv[4] || './test-results/load-test'
  
  let configs, baseUrl
  
  if (testType === 'api') {
    configs = { [testLevel]: apiTestConfigs[testLevel] }
    baseUrl = 'http://localhost:8080'
  } else {
    configs = { [testLevel]: loadTestConfigs[testLevel] }
    baseUrl = 'http://localhost:5173'
  }
  
  if (!configs[testLevel]) {
    console.error(`❌ Unknown test level: ${testLevel}`)
    console.log('Available levels:', Object.keys(testType === 'api' ? apiTestConfigs : loadTestConfigs).join(', '))
    process.exit(1)
  }
  
  console.log(`🚀 Starting ${testType} load test (${testLevel} level)...`)
  console.log(`Make sure your application is running on ${baseUrl}`)
  
  runBatchLoadTest(configs, baseUrl, outputDir)
    .then(results => {
      console.log('\n✅ Load tests completed!')
      console.log(`📁 Reports saved to: ${outputDir}`)
      
      const passedTests = results.filter(r => !r.error && r.results && r.results.errors === 0)
      const totalTests = results.filter(r => !r.error).length
      
      console.log(`📊 Tests passed: ${passedTests.length}/${totalTests}`)
    })
    .catch(error => {
      console.error('❌ Load tests failed:', error)
      process.exit(1)
    })
}

module.exports = {
  runLoadTest,
  runBatchLoadTest,
  loadTestConfigs,
  apiTestConfigs
}