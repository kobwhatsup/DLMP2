const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const webpack = require('webpack')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')

/**
 * Bundle分析配置
 */
const bundleAnalyzerConfig = {
  analyzerMode: 'static',
  reportFilename: 'bundle-report.html',
  openAnalyzer: false,
  generateStatsFile: true,
  statsFilename: 'bundle-stats.json'
}

/**
 * 分析打包文件大小
 */
function analyzeBundleSize(distDir = './dist') {
  if (!fs.existsSync(distDir)) {
    throw new Error(`Distribution directory not found: ${distDir}`)
  }

  const stats = {
    totalSize: 0,
    gzippedSize: 0,
    files: [],
    chunks: {},
    assets: []
  }

  // 递归分析目录
  function analyzeDirectory(dir, basePath = '') {
    const files = fs.readdirSync(dir)
    
    files.forEach(file => {
      const filePath = path.join(dir, file)
      const relativePath = path.join(basePath, file)
      const stat = fs.statSync(filePath)
      
      if (stat.isDirectory()) {
        analyzeDirectory(filePath, relativePath)
      } else {
        const size = stat.size
        const ext = path.extname(file)
        
        stats.totalSize += size
        stats.files.push({
          path: relativePath,
          size,
          sizeFormatted: formatBytes(size),
          extension: ext
        })
        
        // 按文件类型分组
        if (!stats.chunks[ext]) {
          stats.chunks[ext] = { count: 0, size: 0 }
        }
        stats.chunks[ext].count++
        stats.chunks[ext].size += size
      }
    })
  }

  analyzeDirectory(distDir)

  // 按大小排序
  stats.files.sort((a, b) => b.size - a.size)

  // 计算压缩后大小（估算）
  stats.gzippedSize = Math.round(stats.totalSize * 0.3) // 粗略估算30%压缩率

  return stats
}

/**
 * 格式化字节数
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 生成bundle分析报告
 */
function generateBundleReport(stats, outputDir = './bundle-analysis') {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  // 保存JSON数据
  const jsonPath = path.join(outputDir, 'bundle-analysis.json')
  fs.writeFileSync(jsonPath, JSON.stringify(stats, null, 2))

  // 生成HTML报告
  let html = `
<!DOCTYPE html>
<html>
<head>
  <title>Bundle Analysis Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .metric { display: inline-block; margin: 10px 20px 10px 0; }
    .metric-value { font-size: 24px; font-weight: bold; color: #2196F3; }
    .metric-label { font-size: 14px; color: #666; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .large-file { background-color: #ffebee; }
    .warning { color: #ff9800; }
    .error { color: #f44336; }
    .good { color: #4caf50; }
    .chart { margin: 20px 0; }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
  <h1>Bundle Analysis Report</h1>
  <p>Generated on: ${new Date().toLocaleString()}</p>
  
  <div class="summary">
    <div class="metric">
      <div class="metric-value">${formatBytes(stats.totalSize)}</div>
      <div class="metric-label">Total Size</div>
    </div>
    <div class="metric">
      <div class="metric-value">${formatBytes(stats.gzippedSize)}</div>
      <div class="metric-label">Gzipped Size (estimated)</div>
    </div>
    <div class="metric">
      <div class="metric-value">${stats.files.length}</div>
      <div class="metric-label">Total Files</div>
    </div>
  </div>
  
  <h2>Size Distribution by File Type</h2>
  <div class="chart">
    <canvas id="typeChart" width="400" height="200"></canvas>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>File Type</th>
        <th>Count</th>
        <th>Total Size</th>
        <th>Average Size</th>
        <th>Percentage</th>
      </tr>
    </thead>
    <tbody>
  `

  const chartData = {
    labels: [],
    sizes: [],
    colors: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']
  }

  Object.entries(stats.chunks).forEach(([ext, data], index) => {
    const percentage = ((data.size / stats.totalSize) * 100).toFixed(1)
    const avgSize = data.size / data.count
    const sizeClass = data.size > stats.totalSize * 0.3 ? 'error' : 
                     data.size > stats.totalSize * 0.1 ? 'warning' : 'good'
    
    html += `
      <tr>
        <td>${ext || 'No extension'}</td>
        <td>${data.count}</td>
        <td class="${sizeClass}">${formatBytes(data.size)}</td>
        <td>${formatBytes(avgSize)}</td>
        <td>${percentage}%</td>
      </tr>
    `
    
    chartData.labels.push(ext || 'Other')
    chartData.sizes.push(data.size)
  })

  html += `
    </tbody>
  </table>
  
  <h2>Largest Files</h2>
  <table>
    <thead>
      <tr>
        <th>File Path</th>
        <th>Size</th>
        <th>Type</th>
        <th>Recommendation</th>
      </tr>
    </thead>
    <tbody>
  `

  stats.files.slice(0, 20).forEach(file => {
    const isLarge = file.size > 500 * 1024 // 500KB
    const recommendation = getRecommendation(file)
    
    html += `
      <tr class="${isLarge ? 'large-file' : ''}">
        <td>${file.path}</td>
        <td class="${isLarge ? 'error' : 'good'}">${file.sizeFormatted}</td>
        <td>${file.extension}</td>
        <td>${recommendation}</td>
      </tr>
    `
  })

  html += `
    </tbody>
  </table>
  
  <h2>Optimization Recommendations</h2>
  <ul>
    <li><strong>Code Splitting:</strong> Split large chunks into smaller ones for better caching</li>
    <li><strong>Tree Shaking:</strong> Remove unused code to reduce bundle size</li>
    <li><strong>Compression:</strong> Enable gzip/brotli compression on server</li>
    <li><strong>Image Optimization:</strong> Compress and optimize images</li>
    <li><strong>Lazy Loading:</strong> Load components only when needed</li>
    <li><strong>CDN:</strong> Use CDN for static assets</li>
  </ul>
  
  <h2>Performance Thresholds</h2>
  <ul>
    <li><strong>JavaScript:</strong> < 200KB per chunk (gzipped)</li>
    <li><strong>CSS:</strong> < 50KB total (gzipped)</li>
    <li><strong>Images:</strong> < 100KB per image</li>
    <li><strong>Total Bundle:</strong> < 1MB (gzipped)</li>
  </ul>
  
  <script>
    const ctx = document.getElementById('typeChart').getContext('2d');
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ${JSON.stringify(chartData.labels)},
        datasets: [{
          data: ${JSON.stringify(chartData.sizes)},
          backgroundColor: ${JSON.stringify(chartData.colors)}
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Bundle Size by File Type'
          },
          legend: {
            position: 'right'
          }
        }
      }
    });
  </script>
</body>
</html>
  `

  const reportPath = path.join(outputDir, 'bundle-report.html')
  fs.writeFileSync(reportPath, html)
  
  console.log(`📊 Bundle analysis report saved to: ${reportPath}`)
  return reportPath
}

/**
 * 获取文件优化建议
 */
function getRecommendation(file) {
  const { extension, size } = file
  
  if (extension === '.js') {
    if (size > 500 * 1024) return 'Consider code splitting or tree shaking'
    if (size > 200 * 1024) return 'Review for unused dependencies'
    return 'Good size'
  }
  
  if (extension === '.css') {
    if (size > 100 * 1024) return 'Consider CSS purging or splitting'
    return 'Good size'
  }
  
  if (['.png', '.jpg', '.jpeg', '.gif', '.svg'].includes(extension)) {
    if (size > 200 * 1024) return 'Compress image or use WebP format'
    if (size > 100 * 1024) return 'Consider image optimization'
    return 'Good size'
  }
  
  return 'Review if necessary'
}

/**
 * 运行完整的bundle分析
 */
function runBundleAnalysis(distDir = './dist', outputDir = './bundle-analysis') {
  console.log('🔍 Analyzing bundle...')
  
  try {
    const stats = analyzeBundleSize(distDir)
    const reportPath = generateBundleReport(stats, outputDir)
    
    console.log('\n📊 Bundle Analysis Summary:')
    console.log(`   Total Size: ${formatBytes(stats.totalSize)}`)
    console.log(`   Gzipped Size (est.): ${formatBytes(stats.gzippedSize)}`)
    console.log(`   Total Files: ${stats.files.length}`)
    console.log(`   Largest File: ${stats.files[0]?.path} (${stats.files[0]?.sizeFormatted})`)
    
    // 性能警告
    if (stats.totalSize > 5 * 1024 * 1024) { // 5MB
      console.log('⚠️  Warning: Bundle size is very large (>5MB)')
    } else if (stats.totalSize > 2 * 1024 * 1024) { // 2MB
      console.log('⚠️  Warning: Bundle size is large (>2MB)')
    } else {
      console.log('✅ Bundle size looks good')
    }
    
    return { stats, reportPath }
    
  } catch (error) {
    console.error('❌ Bundle analysis failed:', error.message)
    throw error
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const distDir = process.argv[2] || './dist'
  const outputDir = process.argv[3] || './test-results/bundle-analysis'
  
  runBundleAnalysis(distDir, outputDir)
    .then(({ reportPath }) => {
      console.log(`\n✅ Bundle analysis completed!`)
      console.log(`📁 Report saved to: ${reportPath}`)
    })
    .catch(error => {
      console.error('❌ Bundle analysis failed:', error)
      process.exit(1)
    })
}

module.exports = {
  analyzeBundleSize,
  generateBundleReport,
  runBundleAnalysis,
  formatBytes
}