/**
 * 统计凭证图生成（纯 Canvas 手绘，无第三方依赖）
 *
 * 使用场景：企业微信等 webview 内，用户需要完整数据作为工作凭证，
 * 但手机截图无法截全长内容。本模块把统计数据绘制成完整长图（dataURL），
 * 由页面用 <img> 展示，用户长按即可保存到相册。
 */

// 2 倍像素输出，保证图片清晰度
const SCALE = 2
// 逻辑宽度（375 设计稿宽度）
const W = 375
// 页面左右留白
const PADDING = 16
const CONTENT_W = W - PADDING * 2
// 卡片间距
const GAP = 12
// 单页最多明细条数（控制图片高度，规避 iOS canvas 尺寸上限导致白图）
const MAX_ROWS_PER_PAGE = 28

// 各区块高度（逻辑像素）
const HEADER_H = 96
const HEADER_H_PAGED = 114 // 多页时头部含页码行，略高
const SUMMARY_H = 76
const DETAIL_TOP = 46 // 明细卡片：上内边距 + 标题行
const ROW_H = 52 // 单条明细行

const FONT_FAMILY = "-apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif"

const COLORS = {
  bg: '#f5f6f7',
  card: '#ffffff',
  primary: '#1989fa',
  primaryLight: '#4facfe',
  green: '#07c160',
  text: '#333333',
  secondary: '#969799',
  divider: '#f5f5f5',
  track: '#eef4fd',
  white85: 'rgba(255, 255, 255, 0.85)'
}

// 圆角矩形路径（手写实现，兼容不支持 ctx.roundRect 的旧 webview）
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

// 文本超长省略
function fitText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text
  let t = text
  while (t.length > 1 && ctx.measureText(t + '…').width > maxWidth) {
    t = t.slice(0, -1)
  }
  return t + '…'
}

// 绘制单行文本（textBaseline 固定为 top，y 即文本顶部）
function drawText(ctx, text, x, y, { size = 12, color = COLORS.text, weight = 'normal', align = 'left' } = {}) {
  ctx.save()
  ctx.font = `${weight} ${size}px ${FONT_FAMILY}`
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.textBaseline = 'top'
  ctx.fillText(text, x, y)
  ctx.restore()
}

// 绘制带浅阴影的白色卡片
function drawCard(ctx, x, y, w, h) {
  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.06)'
  ctx.shadowBlur = 8
  ctx.shadowOffsetY = 2
  ctx.fillStyle = COLORS.card
  roundRect(ctx, x, y, w, h, 12)
  ctx.fill()
  ctx.restore()
}

// 绘制单页
function renderPage({ empName, empId, startDate, endDate, totalHours, projectCount, rows, pageIndex, pageCount }) {
  const rowCount = rows.length
  const detailH = DETAIL_TOP + (rowCount > 0 ? (rowCount - 1) * ROW_H + 30 : 0) + 16
  const hasPageInfo = pageCount > 1
  const headerH = hasPageInfo ? HEADER_H_PAGED : HEADER_H
  const H = PADDING + headerH + GAP + SUMMARY_H + GAP + detailH + PADDING

  const canvas = document.createElement('canvas')
  canvas.width = W * SCALE
  canvas.height = Math.round(H * SCALE)
  const ctx = canvas.getContext('2d')
  ctx.scale(SCALE, SCALE)

  // 背景
  ctx.fillStyle = COLORS.bg
  ctx.fillRect(0, 0, W, H)

  let y = PADDING

  // ===== 头部（渐变，与页面头部风格一致） =====
  const grad = ctx.createLinearGradient(PADDING, y, PADDING + CONTENT_W, y + headerH)
  grad.addColorStop(0, COLORS.primary)
  grad.addColorStop(1, COLORS.primaryLight)
  ctx.fillStyle = grad
  roundRect(ctx, PADDING, y, CONTENT_W, headerH, 12)
  ctx.fill()

  let hy = y + 16
  if (hasPageInfo) {
    drawText(ctx, `第 ${pageIndex + 1} 页 / 共 ${pageCount} 页`, PADDING + 18, hy, { size: 12, color: COLORS.white85 })
    hy += 18
  }
  drawText(ctx, empName, PADDING + 18, hy, { size: 21, color: '#ffffff', weight: 'bold' })
  hy += 30
  drawText(ctx, `工号：${empId}`, PADDING + 18, hy, { size: 12, color: COLORS.white85 })
  hy += 18
  drawText(ctx, `日期：${startDate} ~ ${endDate}`, PADDING + 18, hy, { size: 12, color: COLORS.white85 })

  y += headerH + GAP

  // ===== 概要（两张卡片，与统计页面 summary-card 布局一致） =====
  const cardW = (CONTENT_W - GAP) / 2
  // 左卡：总工时
  drawCard(ctx, PADDING, y, cardW, SUMMARY_H)
  const colA = PADDING + cardW / 2
  drawText(ctx, `${(Number(totalHours) || 0).toFixed(1)}h`, colA, y + 16, { size: 21, color: COLORS.primary, weight: 'bold', align: 'center' })
  drawText(ctx, '总工时', colA, y + 46, { size: 11, color: COLORS.secondary, align: 'center' })
  // 右卡：总项目数
  drawCard(ctx, PADDING + cardW + GAP, y, cardW, SUMMARY_H)
  const colB = PADDING + cardW + GAP + cardW / 2
  drawText(ctx, `${projectCount}`, colB, y + 16, { size: 21, color: COLORS.green, weight: 'bold', align: 'center' })
  drawText(ctx, '总项目数', colB, y + 46, { size: 11, color: COLORS.secondary, align: 'center' })

  y += SUMMARY_H + GAP

  // ===== 明细 =====
  drawCard(ctx, PADDING, y, CONTENT_W, detailH)
  const innerX = PADDING + 16
  const innerW = CONTENT_W - 32
  drawText(ctx, '项目明细', innerX, y + 16, { size: 14, color: COLORS.text, weight: 'bold' })

  const rowsTop = y + DETAIL_TOP
  const barW = innerW - 56 // 右侧为占比文案预留
  rows.forEach((item, i) => {
    const ry = rowsTop + i * ROW_H

    // 第一行：项目名称 + 工时
    const hoursText = `${(Number(item.workHours) || 0).toFixed(1)}h`
    ctx.font = `bold 13px ${FONT_FAMILY}`
    const hoursW = ctx.measureText(hoursText).width
    ctx.font = `13px ${FONT_FAMILY}`
    drawText(ctx, fitText(ctx, item.projectName, innerW - hoursW - 12), innerX, ry, { size: 13 })
    drawText(ctx, hoursText, innerX + innerW, ry, { size: 13, color: COLORS.primary, weight: 'bold', align: 'right' })

    // 第二行：进度条 + 占比
    const by = ry + 24
    const pct = Math.min(100, Math.max(0, Number(item.percent) || 0))
    ctx.fillStyle = COLORS.track
    roundRect(ctx, innerX, by, barW, 6, 3)
    ctx.fill()
    if (pct > 0) {
      ctx.fillStyle = COLORS.primary
      roundRect(ctx, innerX, by, Math.max(6, (barW * pct) / 100), 6, 3)
      ctx.fill()
    }
    drawText(ctx, `${pct.toFixed(2)}%`, innerX + innerW, by - 4, { size: 11, color: COLORS.secondary, align: 'right' })

    // 行分隔线（最后一行不画）
    if (i < rowCount - 1) {
      ctx.fillStyle = COLORS.divider
      ctx.fillRect(innerX, ry + ROW_H - 8, innerW, 1)
    }
  })

  y += detailH

  return canvas.toDataURL('image/png')
}

/**
 * 生成统计凭证图
 * @param {object} options
 * @param {string} options.empName 姓名
 * @param {string} options.empId 工号
 * @param {string} options.startDate 开始日期（YYYY-MM-DD）
 * @param {string} options.endDate 截止日期（YYYY-MM-DD）
 * @param {number} options.totalHours 总工时
 * @param {number} options.projectCount 总项目数
 * @param {Array<{projectName: string, workHours: number, percent: number}>} options.items 项目明细
 * @returns {string[]} 每页一张 PNG dataURL（内容多时自动分页）
 */
export function generateCertificateImages(options) {
  const items = options.items || []
  const pageRows = []
  for (let i = 0; i < items.length; i += MAX_ROWS_PER_PAGE) {
    pageRows.push(items.slice(i, i + MAX_ROWS_PER_PAGE))
  }
  if (pageRows.length === 0) pageRows.push([])

  return pageRows.map((rows, index) =>
    renderPage({ ...options, rows, pageIndex: index, pageCount: pageRows.length })
  )
}
