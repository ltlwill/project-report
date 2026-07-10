/**
 * 轻量级提示（纯 DOM，不经过 Vant 遮罩层管理器）
 * 仅用于密码修改场景，避免 Popup 关闭后 Toast 被污染
 */
export function showTip(message) {
  const el = document.createElement('div')
  el.textContent = message
  el.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.75);color:#fff;padding:10px 24px;border-radius:8px;font-size:14px;z-index:9999999;text-align:center;max-width:70%;transition:opacity .3s;'
  document.body.appendChild(el)
  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300) }, 2000)
}