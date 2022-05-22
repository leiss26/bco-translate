const vscode = require('vscode')
const api = require('./translate-api')

/**
 * 处理异常
 */
function handlingExceptions(code) {
  const codes = {
    "52001": "请求超时,检查网络后重试" ,
    "52002": "系统错误, 查看百度翻译官网公告",
    "52003": "请确认appid或者服务是否开通",
    "54000": "必填参数为空",
    "54001": " 签名错误",
    "54003": "访问频率受限，访问频率为每秒钟一次请求",
    "54004": "账户余额不足",
    "54005": "请求频繁, 请降低翻译频率，3s后再试",
    "58000": "客户端IP非法",
    "58001": "语言不支持",
    "58002": "服务当前已关闭, 请前往管理控制台开启服务",
    "90107": "认证未通过或未生效",
  }
  vscode.window.showWarningMessage("系统提示: " + codes[code] || "未知异常, 可评论反馈")
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  const disposable = vscode.commands.registerCommand('bco.translate', async function () {
    /**
     * @type {string} 选择的单词
     */
    let selectWord
    const currentEditor = vscode.window.activeTextEditor
    if (!currentEditor) return
    const currentSelect = currentEditor.document.getText(currentEditor.selection)
    if (!currentSelect) return
    let data = ""
		if(new RegExp("[A-Za-z]+").test(currentSelect)) {
			data = await api.translate(currentSelect, 'en', 'zh')
		}else if(new RegExp("[\u4E00-\u9FA5]+").test(currentSelect)){
			data = await api.translate(currentSelect, 'zh', 'en')
		}

    if(data.data.error_code) {
      handlingExceptions(data.data.error_code)
      return
    }
    
    const result = data.data.trans_result[0].dst
    // 基于空格分割
    const list = result.split(' ')
    const arr = []
    if (list.length > 1) {
      // 正常
      arr.push(result)
      // 小驼峰
      arr.push(list.map((v, i) => {
        if (i !== 0) {
          return v.charAt(0).toLocaleUpperCase() + v.replace(/\?|\!|\'|\.|\,/g, '').slice(1)
        }
        return v.replace(/\?|\!|\'|\.|\,/g, '').toLocaleLowerCase()
      }).join(''))
      // - 号连接
      arr.push(list.map(v => v.replace(/\?|\!|\'|\.|\,/g, '').toLocaleLowerCase()).join('-'))
      // 下划线连接
      arr.push(list.map(v => v.replace(/\?|\!|\'|\.|\,/g, '').toLocaleLowerCase()).join('_'))
      // 大驼峰
      arr.push(list.map(v => v.charAt(0).toLocaleUpperCase() + v.replace(/\?|\!|\'|\.|\,/g, '').slice(1)).join(''))
			// 大写下划线连接
      arr.push(list.map(v => v.replace(/\?|\!|\'|\.|\,/g, '').toLocaleUpperCase()).join('_'))
      selectWord = await vscode.window.showQuickPick(arr, { placeHolder: '请选择要替换的变量名' })
    } else if (list.length === 1) {
      arr.push(list.map(v => v.charAt(0).toLocaleUpperCase() + v.slice(1)).replace(/\?|\!|\'|\.|\,/g, '').join(''))
      arr.push(list[0].replace(/\?|\!|\'|\.|\,/g, '').toLocaleLowerCase())
      arr.push(list.map(v => v.replace(/\?|\!|\'|\.|\,/g, '').toLocaleUpperCase()).join(''))
      selectWord = list[0]
    }

    if (selectWord) {
      currentEditor.edit(editBuilder => {
        editBuilder.replace(currentEditor.selection, selectWord)
      })
    }
  })

  context.subscriptions.push(disposable)
}
exports.activate = activate

function deactivate() { }

module.exports = {
  activate,
  deactivate
}
