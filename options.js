// options.js

// 1) Список типов жалоб
const complaintTypes = ['criminal', 'state', 'nonFactional', 'admin', 'discord']

// 2) Заготовка для defaultConfigs — будем загружать из JSON-файла
let defaultConfigs = {}

// 3) Текущий выбранный тип (берём из localStorage или по умолчанию 'criminal')
let currentType = localStorage.getItem('complaintType') || 'criminal'
// Индекс редактируемой кнопки (-1, если создаём новую)
let editingIndex = -1

// 4) DOM-элементы
const typeSelect = document.getElementById('complaintTypeSelect')

const styleButton = document.getElementById('styleButton')
const styleEditorContainer = document.getElementById('styleEditorContainer')
const stylePrimaryColor = document.getElementById('stylePrimaryColor')
const styleStatusColor = document.getElementById('styleStatusColor')
const styleEditColor = document.getElementById('styleEditColor')
const styleFont = document.getElementById('styleFont')
const styleFontSize = document.getElementById('styleFontSize')
const styleWidth = document.getElementById('styleWidth')
const styleHeight = document.getElementById('styleHeight')
const styleBorderRadius = document.getElementById('styleBorderRadius')
const stylePadding = document.getElementById('stylePadding')
const styleBold = document.getElementById('styleBold')
const styleItalic = document.getElementById('styleItalic')
const saveStyleButton = document.getElementById('saveStyleButton')
const cancelStyleButton = document.getElementById('cancelStyleButton')

// Спаны для отображения выбранных HEX рядом с <input type="color">
const valPrimaryColor = document.getElementById('valPrimaryColor')
const valStatusColor = document.getElementById('valStatusColor')
const valEditColor = document.getElementById('valEditColor')

const leftContainer = document.getElementById('leftDialogButtons')
const rightContainer = document.getElementById('rightDialogButtons')
const addButton = document.getElementById('addButton')
const editorContainer = document.getElementById('editorContainer')

const editLabel = document.getElementById('editLabel')
const editText1 = document.getElementById('editText1')
const editText2 = document.getElementById('editText2')
const editText3 = document.getElementById('editText3')
const editColor1 = document.getElementById('editColor1')
const editColor2 = document.getElementById('editColor2')
const editColor3 = document.getElementById('editColor3')
const editAction = document.getElementById('editAction')
const editShouldClose = document.getElementById('editShouldClose')
const editShouldSend = document.getElementById('editShouldSend')
const saveButton = document.getElementById('saveButton')
const cancelButton = document.getElementById('cancelButton')

const exportButton = document.getElementById('exportButton')
const importButton = document.getElementById('importButton')
const fileInput = document.getElementById('fileInput')
const statusDiv = document.getElementById('status')

// 5) Загружаем defaultConfigs из JSON-файла
function loadDefaultConfigs() {
	return fetch('defaultConfigs.json')
		.then(response => response.json())
		.then(json => {
			defaultConfigs = json
		})
		.catch(err => {
			console.error('Не удалось загрузить defaultConfigs.json:', err)
			defaultConfigs = {}
		})
}

// =======================================
// 6) Функция: отрисовка левой колонки
// =======================================
function renderDialogButtons(container, configs) {
	container.innerHTML = ''
	chrome.storage.sync.get(
		[
			'buttonBgColor',
			'buttonTextColor',
			'buttonEditColor',
			'buttonBorderRadius',
			'buttonPadding',
			'selectedFontBTN',
			'selectedFontBTNSize',
			'buttonWidth',
			'buttonHeight',
			'buttonBold',
			'buttonItalic',
		],
		data => {
			// Собираем сохранённые стили (если нет — дефолтные)
			const bgColor = data.buttonBgColor || '#FF5722'
			const textColor = data.buttonTextColor || '#FFFFFF'
			const editColor = data.buttonEditColor || '#FFA500'
			const borderRadius = data.buttonBorderRadius || '6px'
			const paddingVal = data.buttonPadding || '10px 15px'
			const fontFamily = data.selectedFontBTN || 'Arial, sans-serif'
			const fontSizePx = data.selectedFontBTNSize || '16'
			const widthVal = data.buttonWidth || 'auto'
			const heightVal = data.buttonHeight || 'auto'
			const boldOn = data.buttonBold || false
			const italicOn = data.buttonItalic || false

			configs.forEach((cfg, idx) => {
				const row = document.createElement('div')
				row.className = 'config-row'

				// 6.1) Основная кнопка: по клику — открыть редактор
				const mainBtn = document.createElement('button')
				mainBtn.className = 'main-btn'
				mainBtn.textContent = cfg.label

				// Применяем стили, учитывая сохранённые параметры:
				mainBtn.style.backgroundColor = bgColor
				mainBtn.style.color = textColor
				mainBtn.style.border = `2px solid ${bgColor}`
				mainBtn.style.borderRadius = borderRadius
				mainBtn.style.padding = paddingVal
				mainBtn.style.fontFamily = fontFamily
				mainBtn.style.fontSize = fontSizePx + 'px'

				if (boldOn) mainBtn.style.fontWeight = 'bold'
				else mainBtn.style.fontWeight = 'normal'

				if (italicOn) mainBtn.style.fontStyle = 'italic'
				else mainBtn.style.fontStyle = 'normal'

				// Ширина / Высота
				if (widthVal !== 'auto') mainBtn.style.width = widthVal + 'px'
				if (heightVal !== 'auto') mainBtn.style.height = heightVal + 'px'

				mainBtn.addEventListener('click', () => openEditor(idx, cfg))
				row.appendChild(mainBtn)

				// 6.2) Кнопка “↑” (переместить выше)
				const upBtn = document.createElement('button')
				upBtn.className = 'small-btn'
				upBtn.textContent = '↑'
				upBtn.title = 'Переместить выше'
				upBtn.addEventListener('click', () => moveUp(idx))
				row.appendChild(upBtn)

				// 6.3) Кнопка “↓” (переместить ниже)
				const downBtn = document.createElement('button')
				downBtn.className = 'small-btn'
				downBtn.textContent = '↓'
				downBtn.title = 'Переместить ниже'
				downBtn.addEventListener('click', () => moveDown(idx))
				row.appendChild(downBtn)

				// 6.4) Кнопка удаления “✕”
				const delBtn = document.createElement('button')
				delBtn.className = 'small-btn'
				delBtn.textContent = '✕'
				delBtn.title = 'Удалить'
				delBtn.addEventListener('click', () => deleteConfig(idx))
				row.appendChild(delBtn)

				container.appendChild(row)
			})
		}
	)
}

// =======================================
// 7) Правые (статические) кнопки
// =======================================
function createAllButtonsR(container) {
	container.innerHTML = ''
	// Здесь вставьте реальный код из вашего content.js,
	// который создаёт “Mute / Ajail / Ban” и т. д.
	// Для примера:
	const dummy = document.createElement('button')
	dummy.textContent = 'Пример All-кнопки'
	dummy.style.margin = '6px'
	dummy.style.padding = '8px 12px'
	dummy.style.backgroundColor = '#FF5722'
	dummy.style.color = '#FFF'
	dummy.style.border = '2px solid #FF5722'
	dummy.style.borderRadius = '6px'
	dummy.style.cursor = 'pointer'
	container.appendChild(dummy)
}

function createAdminButtonsR(container) {
	container.innerHTML = ''
	// Пример для раздела "admin"
	const btn = document.createElement('button')
	btn.textContent = 'Пример admin-кнопки'
	btn.style.margin = '6px'
	btn.style.padding = '8px 12px'
	btn.style.backgroundColor = '#FF5722'
	btn.style.color = '#FFF'
	btn.style.border = '2px solid #FF5722'
	btn.style.borderRadius = '6px'
	btn.style.cursor = 'pointer'
	container.appendChild(btn)
}

function createDsButtonsR(container) {
	container.innerHTML = ''
	// Пример для раздела "discord"
	const btn = document.createElement('button')
	btn.textContent = 'Пример discord-кнопки'
	btn.style.margin = '6px'
	btn.style.padding = '8px 12px'
	btn.style.backgroundColor = '#FF5722'
	btn.style.color = '#FFF'
	btn.style.border = '2px solid #FF5722'
	btn.style.borderRadius = '6px'
	btn.style.cursor = 'pointer'
	container.appendChild(btn)
}

// =======================================
// 8) Toggle: показываем слева JSON-кнопки, справа статические
// =======================================
function toggleButtons(type) {
	chrome.storage.sync.get([`buttonsConfig_${type}`], data => {
		let configs = data[`buttonsConfig_${type}`]
		if (!Array.isArray(configs) || configs.length === 0) {
			configs = defaultConfigs[type] || []
		}
		renderDialogButtons(leftContainer, configs)

		// Правая колонка:
		rightContainer.innerHTML = ''
		switch (type) {
			case 'criminal':
			case 'state':
			case 'nonFactional':
				createAllButtonsR(rightContainer)
				break
			case 'admin':
				createAdminButtonsR(rightContainer)
				break
			case 'discord':
				createDsButtonsR(rightContainer)
				break
			default:
				break
		}
	})
}

// =======================================
// 9) Экспорт/Импорт
// =======================================
function exportAllConfigs() {
	statusDiv.textContent = ''
	const toFetch = complaintTypes.map(type => {
		return new Promise(resolve => {
			chrome.storage.sync.get([`buttonsConfig_${type}`], data => {
				let arr = data[`buttonsConfig_${type}`]
				if (!Array.isArray(arr) || arr.length === 0) {
					arr = defaultConfigs[type] || []
				}
				resolve({ type, value: arr })
			})
		})
	})

	Promise.all(toFetch).then(results => {
		const exportObj = {}
		results.forEach(({ type, value }) => {
			exportObj[type] = value
		})
		const jsonStr = JSON.stringify(exportObj, null, 2)
		const blob = new Blob([jsonStr], { type: 'application/json' })
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = 'buttons-config-export.json'
		a.click()
		URL.revokeObjectURL(url)
	})
}

function importAllConfigs(file) {
	statusDiv.textContent = ''
	const reader = new FileReader()
	reader.onload = () => {
		try {
			const obj = JSON.parse(reader.result)
			const toSave = {}
			complaintTypes.forEach(type => {
				if (Array.isArray(obj[type])) {
					toSave[`buttonsConfig_${type}`] = obj[type]
				}
			})
			chrome.storage.sync.set(toSave, () => {
				statusDiv.textContent = 'Импорт успешно выполнен!'
				toggleButtons(currentType)
				setTimeout(() => (statusDiv.textContent = ''), 2000)
			})
		} catch {
			statusDiv.textContent = 'Ошибка: некорректный JSON'
		}
	}
	reader.onerror = () => {
		statusDiv.textContent = 'Не удалось прочитать файл'
	}
	reader.readAsText(file)
}

// =======================================
// 10) Хелперы (вставка в контент, автодействия)
// =======================================
function insertFormattedText(
	text,
	color,
	handleAuto = { close: false, send: false }
) {
	const editable = document.querySelector(
		'.fr-element.fr-view[contenteditable="true"]'
	)
	if (!editable) {
		alert('Не удалось найти поле для ввода текста')
		return
	}

	// Читаем шрифты и выравнивание из хранилища (если нужно)
	chrome.storage.sync.get(
		[
			'selectedFontBTN',
			'selectedFontBTNSize',
			'textAlign',
			'boldText',
			'italicText',
		],
		data => {
			const font = data.selectedFontBTN || 'Arial, sans-serif'
			const size = data.selectedFontBTNSize || '16'
			const align = data.textAlign || 'left'
			const isBold = data.boldText === true
			const isItalic = data.italicText === true

			editable.focus()
			const range = document.createRange()
			const sel = window.getSelection()
			range.selectNodeContents(editable)
			range.collapse(false)
			sel.removeAllRanges()
			sel.addRange(range)

			let spanHtml = `<span style="
          color: ${color};
          font-size: ${size}px;
          font-family: ${font};
        ">${text}</span>`

			if (isItalic) spanHtml = `<em>${spanHtml}</em>`
			if (isBold) spanHtml = `<strong>${spanHtml}</strong>`

			const finalHtml = `<p style="text-align:${align};">${spanHtml}</p>`
			document.execCommand('insertHTML', false, finalHtml + '<br>')

			// После вставки проверим: если handleAuto.close === true и в storage.autoClose === true → нажать “Закрыть жалобу”
			// Аналогично для handleAuto.send / autoSend
			if (handleAuto.close || handleAuto.send) {
				chrome.storage.sync.get(['autoClose', 'autoSend'], autos => {
					if (handleAuto.close && autos.autoClose) {
						const closeBtn = document.querySelector('a[href*="/quick-close"]')
						if (closeBtn) closeBtn.click()
					}
					if (handleAuto.send && autos.autoSend) {
						const replyBtn = document.querySelector(
							'button.button--primary.button--icon--reply'
						)
						if (replyBtn) replyBtn.click()
					}
				})
			}
		}
	)
}

function handleAutoActions(shouldClose, shouldSend) {
	chrome.storage.sync.get(['autoClose', 'autoSend'], data => {
		if (shouldClose && data.autoClose) closeOpenReport()
		if (shouldSend && data.autoSend) enterMessage()
	})
}

function closeOpenReport() {
	const btn = document.querySelector('a[href*="/quick-close"]')
	if (btn) btn.click()
	else alert('Кнопка закрытия жалобы не найдена')
}

function enterMessage() {
	const btn = document.querySelector(
		'button.button--primary.button--icon--reply'
	)
	if (btn) btn.click()
	else alert('Кнопка "Ответить" не найдена')
}

function insertHtmlIntoContentEditable(html) {
	const contentEditable = document.querySelector(
		'.fr-element.fr-view[contenteditable="true"]'
	)
	if (!contentEditable) {
		alert('Не удалось найти поле для вставки ссылки')
		return
	}
	const range = document.createRange()
	const sel = window.getSelection()
	if (contentEditable.firstChild) {
		range.setStartBefore(contentEditable.firstChild)
		range.collapse(true)
		sel.removeAllRanges()
		sel.addRange(range)
		const frag = document.createDocumentFragment()
		const tmp = document.createElement('div')
		tmp.innerHTML = html
		while (tmp.firstChild) frag.appendChild(tmp.firstChild)
		range.insertNode(frag)
	} else {
		contentEditable.innerHTML = html
	}
}

function openLinkDialog() {
	const dlg = document.createElement('div')
	dlg.innerHTML = `
    <div style="
      position: fixed; top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      background: #313742; padding: 16px; border-radius: 6px;
      box-shadow: 0 0 12px rgba(0,0,0,0.5); width: 300px;
      text-align: center; z-index: 2000;
    ">
      <button id="closeDlg" style="
        position: absolute; top: 8px; right: 8px;
        background: none; border: none; font-size: 18px;
        color: #FF5722; cursor: pointer;
      ">&times;</button>
      <label for="dlgUrl" style="color:#FFF; display:block; margin-bottom:8px;">Введите ссылку:</label>
      <input id="dlgUrl" type="text" placeholder="https://forum.gtadom.com/" style="
        width: 100%; padding: 6px; font-size: 14px;
        border: 1px solid #ccc; border-radius: 4px; margin-bottom:12px;
      ">
      <button id="insertLinkBtn" style="
        background: #FF5722; color:#FFF; border:none;
        border-radius:4px; padding:8px 12px; cursor:pointer;
      ">Создать ссылку</button>
    </div>
  `
	document.body.appendChild(dlg)

	dlg.querySelector('#closeDlg').addEventListener('click', () => {
		document.body.removeChild(dlg)
	})
	dlg.querySelector('#insertLinkBtn').addEventListener('click', () => {
		const url = dlg.querySelector('#dlgUrl').value.trim()
		if (url) {
			const linkHtml = `<a href="${url}" target="_blank">Жалоба по которой были наказаны.</a>`
			insertHtmlIntoContentEditable(linkHtml)
		}
		document.body.removeChild(dlg)
	})
}

// =======================================
// 11) Открыть редактор (для левой колонки)
// =======================================
function openEditor(idx, cfg) {
	editingIndex = idx
	editLabel.value = cfg.label || ''
	editText1.value = cfg.text1 || ''
	editText2.value = cfg.text2 || ''
	editText3.value = cfg.text3 || ''

	// Цвета
	editColor1.value =
		cfg.color1 && cfg.color1.startsWith('#') ? cfg.color1 : '#FF5722'
	editColor2.value =
		cfg.color2 && cfg.color2.startsWith('#') ? cfg.color2 : '#F1E207'
	editColor3.value =
		cfg.color3 && cfg.color3.startsWith('#') ? cfg.color3 : '#FFA500'

	document.getElementById('valColor1').textContent = editColor1.value
	document.getElementById('valColor2').textContent = editColor2.value
	document.getElementById('valColor3').textContent = editColor3.value

	editAction.value = cfg.action || 'none'
	editShouldClose.checked = !!cfg.shouldClose
	editShouldSend.checked = !!cfg.shouldSend
	editorContainer.style.display = 'block'
}

// =======================================
// 12) Удалить конфиг
// =======================================
function deleteConfig(idx) {
	chrome.storage.sync.get([`buttonsConfig_${currentType}`], data => {
		let arr = data[`buttonsConfig_${currentType}`]
		if (!Array.isArray(arr)) arr = (defaultConfigs[currentType] || []).slice()
		arr.splice(idx, 1)
		chrome.storage.sync.set({ [`buttonsConfig_${currentType}`]: arr }, () => {
			toggleButtons(currentType)
		})
	})
}

// =======================================
// 13) Переместить вверх
// =======================================
function moveUp(idx) {
	if (idx === 0) return
	chrome.storage.sync.get([`buttonsConfig_${currentType}`], data => {
		let arr = data[`buttonsConfig_${currentType}`]
		if (!Array.isArray(arr)) arr = (defaultConfigs[currentType] || []).slice()
		const tmp = arr[idx - 1]
		arr[idx - 1] = arr[idx]
		arr[idx] = tmp
		chrome.storage.sync.set({ [`buttonsConfig_${currentType}`]: arr }, () => {
			toggleButtons(currentType)
		})
	})
}

// =======================================
// 14) Переместить вниз
// =======================================
function moveDown(idx) {
	chrome.storage.sync.get([`buttonsConfig_${currentType}`], data => {
		let arr = data[`buttonsConfig_${currentType}`]
		if (!Array.isArray(arr)) arr = (defaultConfigs[currentType] || []).slice()
		if (idx === arr.length - 1) return
		const tmp = arr[idx + 1]
		arr[idx + 1] = arr[idx]
		arr[idx] = tmp
		chrome.storage.sync.set({ [`buttonsConfig_${currentType}`]: arr }, () => {
			toggleButtons(currentType)
		})
	})
}

// =======================================
// 15) Сохранить/Отменить редактирование конфигурации
// =======================================
saveButton.addEventListener('click', () => {
	const newCfg = {
		label: editLabel.value.trim(),
		text1: editText1.value.trim(),
		text2: editText2.value.trim(),
		text3: editText3.value.trim(),
		color1: editColor1.value,
		color2: editColor2.value,
		color3: editColor3.value,
		action: editAction.value,
		shouldClose: editShouldClose.checked,
		shouldSend: editShouldSend.checked,
	}
	chrome.storage.sync.get([`buttonsConfig_${currentType}`], data => {
		let arr = data[`buttonsConfig_${currentType}`]
		if (!Array.isArray(arr)) {
			arr = (defaultConfigs[currentType] || []).slice()
		}
		if (editingIndex >= 0) {
			arr[editingIndex] = newCfg
		} else {
			arr.push(newCfg)
		}
		chrome.storage.sync.set({ [`buttonsConfig_${currentType}`]: arr }, () => {
			toggleButtons(currentType)
			editorContainer.style.display = 'none'
			editingIndex = -1
		})
	})
})

cancelButton.addEventListener('click', () => {
	editorContainer.style.display = 'none'
	editingIndex = -1
})

// =======================================
// 16) «Добавить новую кнопку»
// =======================================
addButton.addEventListener('click', () => {
	editingIndex = -1
	editLabel.value = ''
	editText1.value = ''
	editText2.value = ''
	editText3.value = ''
	editColor1.value = '#FF5722'
	document.getElementById('valColor1').textContent = '#FF5722'
	editColor2.value = '#F1E207'
	document.getElementById('valColor2').textContent = '#F1E207'
	editColor3.value = '#FFA500'
	document.getElementById('valColor3').textContent = '#FFA500'
	editAction.value = 'none'
	editShouldClose.checked = false
	editShouldSend.checked = false
	editorContainer.style.display = 'block'
})

// =======================================
// 17) Переключение типа жалобы
// =======================================
typeSelect.addEventListener('change', e => {
	currentType = e.target.value
	localStorage.setItem('complaintType', currentType)
	editorContainer.style.display = 'none'
	editingIndex = -1
	toggleButtons(currentType)
})

// =======================================
// 18) Работа с «Настройкой внешнего вида»
// =======================================
styleButton.addEventListener('click', () => {
	// Загрузим текущие значения из storage и поставим в поля:
	chrome.storage.sync.get(
		[
			'buttonBgColor',
			'buttonTextColor',
			'buttonEditColor',
			'buttonBorderRadius',
			'buttonPadding',
			'selectedFontBTN',
			'selectedFontBTNSize',
			'buttonWidth',
			'buttonHeight',
			'buttonBold',
			'buttonItalic',
		],
		data => {
			if (data.buttonBgColor) {
				stylePrimaryColor.value = data.buttonBgColor
				valPrimaryColor.textContent = data.buttonBgColor
			}
			if (data.buttonTextColor) {
				styleStatusColor.value = data.buttonTextColor
				valStatusColor.textContent = data.buttonTextColor
			}
			if (data.buttonEditColor) {
				styleEditColor.value = data.buttonEditColor
				valEditColor.textContent = data.buttonEditColor
			}
			if (data.selectedFontBTN) {
				styleFont.value = data.selectedFontBTN
			}
			if (data.selectedFontBTNSize) {
				styleFontSize.value = data.selectedFontBTNSize
			}
			if (data.buttonBorderRadius) {
				// Если хранилось с 'px', убираем при показе
				styleBorderRadius.value = data.buttonBorderRadius.replace(/px$/, '')
			}
			if (data.buttonPadding) {
				stylePadding.value = data.buttonPadding
			}
			if (data.buttonWidth) {
				styleWidth.value = data.buttonWidth
			}
			if (data.buttonHeight) {
				styleHeight.value = data.buttonHeight
			}
			if (data.buttonBold) {
				document.getElementById('styleBold').checked = data.buttonBold
			}
			if (data.buttonItalic) {
				document.getElementById('styleItalic').checked = data.buttonItalic
			}

			styleEditorContainer.style.display = 'block'
		}
	)
})

// Обновляем показ HEX-значений при изменении <input type="color">
stylePrimaryColor.addEventListener('input', () => {
	valPrimaryColor.textContent = stylePrimaryColor.value
})
styleStatusColor.addEventListener('input', () => {
	valStatusColor.textContent = styleStatusColor.value
})
styleEditColor.addEventListener('input', () => {
	valEditColor.textContent = styleEditColor.value
})
editColor1.addEventListener('input', () => {
	document.getElementById('valColor1').textContent = editColor1.value
})
editColor2.addEventListener('input', () => {
	document.getElementById('valColor2').textContent = editColor2.value
})
editColor3.addEventListener('input', () => {
	document.getElementById('valColor3').textContent = editColor3.value
})

// Отмена (закрыть окно без сохранения):
cancelStyleButton.addEventListener('click', () => {
	styleEditorContainer.style.display = 'none'
})

// Сохранение стилей:
saveStyleButton.addEventListener('click', () => {
	const bgColor = stylePrimaryColor.value
	const textColor = styleStatusColor.value
	const editColor = styleEditColor.value
	let borderRadiusValue = styleBorderRadius.value.trim() || '0'
	const paddingValue = stylePadding.value.trim() || '0'
	const fontFamilyValue = styleFont.value.trim() || 'Arial, sans-serif'
	const fontSizeValue = styleFontSize.value.trim() || '16'
	const widthValue = styleWidth.value.trim() || 'auto'
	const heightValue = styleHeight.value.trim() || 'auto'
	const boldOn = document.getElementById('styleBold').checked
	const italicOn = document.getElementById('styleItalic').checked

	// Добавляем 'px' к скруглению, если введено число без единицы
	if (/^\d+$/.test(borderRadiusValue)) {
		borderRadiusValue = borderRadiusValue + 'px'
	}

	chrome.storage.sync.set(
		{
			buttonBgColor: bgColor,
			buttonTextColor: textColor,
			buttonEditColor: editColor,
			buttonBorderRadius: borderRadiusValue,
			buttonPadding: paddingValue,
			selectedFontBTN: fontFamilyValue,
			selectedFontBTNSize: fontSizeValue,
			buttonWidth: widthValue,
			buttonHeight: heightValue,
			buttonBold: boldOn,
			buttonItalic: italicOn,
		},
		() => {
			// После сохранения — пересобрать превью
			styleEditorContainer.style.display = 'none'
			toggleButtons(currentType)
		}
	)
})

// =======================================
// 19) Экспорт/Импорт
// =======================================
exportButton.addEventListener('click', exportAllConfigs)
importButton.addEventListener('click', () => {
	fileInput.value = ''
	fileInput.click()
})
fileInput.addEventListener('change', () => {
	if (fileInput.files.length === 0) return
	importAllConfigs(fileInput.files[0])
})

// =======================================
// 20) Инициализация при загрузке страницы
// =======================================
document.addEventListener('DOMContentLoaded', () => {
	loadDefaultConfigs().then(() => {
		typeSelect.value = currentType
		toggleButtons(currentType)
	})
})
