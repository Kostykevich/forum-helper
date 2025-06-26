// popup.js

// Открывает options.html по клику на “Настройки кнопок”
document.getElementById('openSettings').addEventListener('click', () => {
	chrome.runtime.openOptionsPage()
})

document.addEventListener('DOMContentLoaded', () => {
	// Сначала подцепляем “примерные” кнопки слева/справа
	document.querySelectorAll('.sample-btn').forEach(btn => {
		btn.addEventListener('click', () => {
			chrome.runtime.openOptionsPage()
		})
	})

	// <-- ЗДЕСЬ ДОБАВЛЯЕМ НОВЫЙ ЧЕКБОКС В DOM -->
	const showButtonsOnPageCheckbox = document.getElementById('showButtonsOnPage')
	// <-- КОНЕЦ -->

	// Далее — стандартная логика загрузки/сохранения “общих” опций
	const autoCloseCheckbox   = document.getElementById('autoClose')
	const autoSendCheckbox    = document.getElementById('autoSend')
	const fontSelect          = document.getElementById('fontSelect')
	const fontSizeSelect      = document.getElementById('fontSizeSelect')
	const primaryColorInput   = document.getElementById('primaryColor')
	const statusColorInput    = document.getElementById('statusColor')
	const editColorInput      = document.getElementById('editColor')
	const textAlignSelect     = document.getElementById('textAlign')
	const boldTextCheckbox    = document.getElementById('boldText')
	const italicTextCheckbox  = document.getElementById('italicText')

	// Загрузка сохранённых настроек (добавляем ключ "showButtonsOnPage")
	chrome.storage.sync.get(
		[
			'autoClose',
			'autoSend',
			'selectedFont',
			'selectedFontSize',
			'primaryColor',
			'statusColor',
			'editColor',
			'textAlign',
			'boldText',
			'italicText',
			'showButtonsOnPage'      // <-- сюда
		],
		data => {
			// Авто закрытие
			if (typeof data.autoClose === 'boolean') {
				autoCloseCheckbox.checked = data.autoClose
			} else {
				autoCloseCheckbox.checked = true
			}

			// Авто отправка
			if (typeof data.autoSend === 'boolean') {
				autoSendCheckbox.checked = data.autoSend
			} else {
				autoSendCheckbox.checked = true
			}

			// Шрифт
			fontSelect.value = data.selectedFont || 'Arial'

			// Размер шрифта
			fontSizeSelect.value = data.selectedFontSize || 15

			// Цвета
			primaryColorInput.value = data.primaryColor || '#ffffff'
			statusColorInput.value  = data.statusColor  || '#ff2416'
			editColorInput.value    = data.editColor    || '#f3ec14'

			// Выравнивание (по умолчанию пусть будет слева)
			textAlignSelect.value = data.textAlign || 'left'

			// Жирный
			if (typeof data.boldText === 'boolean') {
				boldTextCheckbox.checked = data.boldText
			} else {
				// по умолчанию пусть будет false
				boldTextCheckbox.checked = false
			}

			// Курсив
			if (typeof data.italicText === 'boolean') {
				italicTextCheckbox.checked = data.italicText
			} else {
				// по умолчанию пусть будет false
				italicTextCheckbox.checked = false
			}

			// Отображение кнопок на странице
			if (typeof data.showButtonsOnPage === 'boolean') {
				showButtonsOnPageCheckbox.checked = data.showButtonsOnPage
			} else {
				// по умолчанию пусть будет true
				showButtonsOnPageCheckbox.checked = true
			}
		}
	)

	// Сохранение при изменении каждого поля
	autoCloseCheckbox.addEventListener('change', () => {
		chrome.storage.sync.set({ autoClose: autoCloseCheckbox.checked })
	})
	autoSendCheckbox.addEventListener('change', () => {
		chrome.storage.sync.set({ autoSend: autoSendCheckbox.checked })
	})
	fontSelect.addEventListener('change', () => {
		chrome.storage.sync.set({ selectedFont: fontSelect.value })
	})
	fontSizeSelect.addEventListener('input', () => {
		const val = parseInt(fontSizeSelect.value, 10)
		chrome.storage.sync.set({ selectedFontSize: isNaN(val) ? 16 : val })
	})	
	primaryColorInput.addEventListener('input', () => {
		chrome.storage.sync.set({ primaryColor: primaryColorInput.value })
	})
	statusColorInput.addEventListener('input', () => {
		chrome.storage.sync.set({ statusColor: statusColorInput.value })
	})
	editColorInput.addEventListener('input', () => {
		chrome.storage.sync.set({ editColor: editColorInput.value })
	})
	textAlignSelect.addEventListener('change', () => {
		chrome.storage.sync.set({ textAlign: textAlignSelect.value })
	})
	boldTextCheckbox.addEventListener('change', () => {
		chrome.storage.sync.set({ boldText: boldTextCheckbox.checked })
	})
	italicTextCheckbox.addEventListener('change', () => {
		chrome.storage.sync.set({ italicText: italicTextCheckbox.checked })
	})

	// <-- И добавляем сохранение для нового чекбокса -->
	showButtonsOnPageCheckbox.addEventListener('change', () => {
		chrome.storage.sync.set({ showButtonsOnPage: showButtonsOnPageCheckbox.checked })
	})
	// <-- КОНЕЦ -->
})
