window.addEventListener('load', () => {
	const savedFont = localStorage.getItem('selectedFont')
	const savedFontSize = localStorage.getItem('selectedFontSize')

	if (savedFont) {
		document.body.style.fontFamily = savedFont
	}
	if (savedFontSize) {
		document.body.style.fontSize = `${savedFontSize}px`
	}

	const getComplaintId = () => {
		const url = window.location.href
		const match = url.match(/threads\/.*\.(\d+)(\/|$)/)
		return match ? match[1] : ''
	}

	// Функция для получения CID игрока который нарушил
	const getPlayerCodes = () => {
		const firstMessage = document.querySelector('.message-content')
		let codeText = ''

		const cyrillicToLatinMap = {
			А: 'A',
			В: 'B',
			Е: 'E',
			К: 'K',
			М: 'M',
			Н: 'H',
			О: 'O',
			Р: 'P',
			С: 'C',
			Т: 'T',
			У: 'Y',
			Х: 'X',
		}

		const replaceCyrillicWithLatin = text => {
			return text.replace(/[А-Я]/g, char => cyrillicToLatinMap[char] || char)
		}

		const removeSpecialCharacters = text => {
			// Удаляем все символы, кроме букв и цифр
			return text.replace(/[^A-Z0-9]/g, '')
		}

		if (firstMessage) {
			// Очищаем от символов (), {}, [], "", <>, и др.
			const cleanedText = firstMessage.innerText.replace(/[<>""(){}[\]]/g, '')
			const match = cleanedText.match(
				/CID\/Никнейм нарушителя\s*([A-ZА-Я0-9, ]+)/
			)
			if (match) {
				codeText = match[1]
					.split(/[, ]+/)
					.map(code => replaceCyrillicWithLatin(code.trim()))
					.map(code => removeSpecialCharacters(code))
					.filter(code => code.length > 0)
					.join(', ')
			}
		}
		return codeText
	}

	// Функция для получения CID игрока в жалобах на администрацию
	const getAdminComplaintCID = () => {
		const firstMessage = document.querySelector('.message-content')
		let cid = ''

		if (firstMessage) {
			const match = firstMessage.innerText.match(/CID персонажа\s*([A-Z0-9]+)/)
			if (match) {
				cid = match[1].trim()
			}
		}
		return cid
	}

	// content.js (или ваш файл, где создаются кнопки на странице)
	function createButton(text, onClick) {
		const btn = document.createElement('button')
		btn.textContent = text
		btn.style.cursor = 'pointer'
		btn.style.display = 'block'

		// Считываем все нужные CSS-параметры из настроек:
		chrome.storage.sync.get(
			[
				'selectedFont',
				'selectedFontSize',
				'buttonBgColor',
				'buttonTextColor',
				'buttonBorderRadius',
				'buttonPadding',
			],
			data => {
				// Шрифт:
				const font = data.selectedFont || 'Arial'
				const fontSize = (data.selectedFontSize || 16) + 'px'

				// Цвета:
				const bgColor = data.buttonBgColor || '#FF5722'
				const txtColor = data.buttonTextColor || '#FFFFFF'

				// Скругление:
				const radius = data.buttonBorderRadius || '10px'

				// Паддинг:
				const pad = data.buttonPadding || '10px 15px'

				// Применяем стили:
				btn.style.fontFamily = font
				btn.style.fontSize = fontSize
				btn.style.backgroundColor = bgColor
				btn.style.color = txtColor
				btn.style.border = `2px solid ${bgColor}`
				btn.style.borderRadius = radius
				btn.style.padding = pad

				// Дополнительно вы можете задать margin-bottom или другие мелочи:
				btn.style.marginBottom = '10px'
				btn.style.position = 'relative'
			}
		)

		btn.addEventListener('click', onClick)
		return btn
	}

	const insertText = text => {
		const editableDiv = document.querySelector(
			'.fr-element.fr-view[contenteditable="true"]'
		)
		if (editableDiv) {
			editableDiv.focus()
			const range = document.createRange()
			const sel = window.getSelection()
			range.selectNodeContents(editableDiv)
			range.collapse(false)
			sel.removeAllRanges()
			sel.addRange(range)
			document.execCommand('insertText', false, text + '\n')
		} else {
			alert('Не удалось найти элемент для ввода текста')
		}
	}

	function insertFormattedText(
		text,
		color,
		handleAuto = { close: false, send: false }
	) {
		const editableDiv = document.querySelector(
			'.fr-element.fr-view[contenteditable="true"]'
		)
		if (!editableDiv) {
			alert('Не удалось найти элемент для ввода текста')
			return
		}

		chrome.storage.sync.get(
			[
				'selectedFont',
				'selectedFontSize',
				'textAlign',
				'boldText',
				'italicText',
			],
			data => {
				const selectedFont = data.selectedFont || 'Arial'
				const selectedFontSize = data.selectedFontSize || '16'
				const textAlign = data.textAlign || 'left'
				const isBold = data.boldText === true
				const isItalic = data.italicText === true

				editableDiv.focus()
				const range = document.createRange()
				const sel = window.getSelection()
				range.selectNodeContents(editableDiv)
				range.collapse(false)
				sel.removeAllRanges()
				sel.addRange(range)

				// Формируем <span> без переводов строк
				let innerSpan =
					'<span style="' +
					'color:' +
					color +
					';' +
					'font-size:' +
					selectedFontSize +
					'px;' +
					'font-family:' +
					selectedFont +
					'">' +
					text +
					'</span>'

				if (isItalic) {
					innerSpan = '<em>' + innerSpan + '</em>'
				}
				if (isBold) {
					innerSpan = '<strong>' + innerSpan + '</strong>'
				}

				// Формируем <p> «в одну строку»
				const formattedText =
					'<p style="text-align:' + textAlign + ';">' + innerSpan + '</p>'

				document.execCommand('insertHTML', false, formattedText + '<br>')

				// После вставки проверяем автозакрытие/автоотправку:
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

	const createNicknameInput = () => {
		// Создаём элемент заранее
		const input = document.createElement('input')
		input.type = 'text'
		input.placeholder = 'Введите ник администратора'
		input.style.marginBottom = '10px'
		input.style.padding = '10px'
		input.style.fontSize = '16px'
		// пока поставим заглушку, стиль подправим чуть позже
		input.style.border = '2px solid #FF5722'
		input.style.borderRadius = '10px'
		input.style.width = '100%'
		input.style.backgroundColor = '#000000'
		input.style.color = '#FFFFFF'
		input.value = localStorage.getItem('adminNick') || ''

		input.addEventListener('input', () => {
			localStorage.setItem('adminNick', input.value)
		})

		// Асинхронно получаем реальный цвет и сразу же меняем стиль:
		chrome.storage.sync.get(['buttonBgColor'], data => {
			const realColor = data.buttonBgColor || '#FF5722'
			input.style.border = `2px solid ${realColor}`
		})

		return input
	}

	const createCheckbox = (labelText, onChange) => {
		const label = document.createElement('label')
		label.style.display = 'flex'
		label.style.alignItems = 'center'
		label.style.marginBottom = '10px'

		const checkbox = document.createElement('input')
		checkbox.type = 'checkbox'
		checkbox.style.marginRight = '10px'
		checkbox.checked = JSON.parse(
			localStorage.getItem('requestEnabled') || 'false'
		)

		checkbox.addEventListener('change', () => {
			localStorage.setItem('requestEnabled', checkbox.checked)
			onChange(checkbox.checked)
		})

		label.appendChild(checkbox)
		label.appendChild(document.createTextNode(labelText))

		return label
	}

	const close_open_report = () => {
		const openButton = document.querySelector('a[href*="/quick-close"]')
		if (openButton) {
			openButton.click()
		} else {
			alert('Кнопка открытия жалобы не найдена')
		}
	}

	const enter_message = () => {
		const replyButton = document.querySelector(
			'button.button--primary.button--icon.button--icon--reply.rippleButton'
		)
		if (replyButton) {
			replyButton.click()
		} else {
			alert('Кнопка "Ответить" не найдена')
		}
	}

	const createButtonContainer = position => {
		const container = document.createElement('div')
		container.className = `${position}-buttons`
		container.style.position = 'fixed'
		container.style.top = '80px'
		container.style[position] = '20px'
		container.style.zIndex = '1000'
		container.style.display = 'flex'
		container.style.flexDirection = 'column'
		container.style.width = '250px'
		document.body.appendChild(container)
		return container
	}

	const leftContainer = createButtonContainer('left')
	const rightContainer = createButtonContainer('right')

	// Новая версия toggleButtons:
	const toggleButtons = type => {
		const leftContainer = document.querySelector('.left-buttons')
		const rightContainer = document.querySelector('.right-buttons')

		// Сначала проверяем флаг showButtonsOnPage
		chrome.storage.sync.get(['showButtonsOnPage'], data => {
			const show =
				typeof data.showButtonsOnPage === 'boolean'
					? data.showButtonsOnPage
					: true

			// Если не показывать кнопки, просто очищаем контейнеры и выходим
			if (!show) {
				leftContainer.innerHTML = ''
				rightContainer.innerHTML = ''
				return
			}

			// Иначе – продолжаем как раньше
			leftContainer.innerHTML = ''
			rightContainer.innerHTML = ''

			chrome.storage.sync.get([`buttonsConfig_${type}`], data2 => {
				let configs = data2[`buttonsConfig_${type}`]
				if (!Array.isArray(configs) || configs.length === 0) {
					configs = defaultConfigs[type] || []
				}
				renderLeftButtons(leftContainer, configs)

				switch (type) {
					case 'criminal':
					case 'state':
					case 'nonFactional':
						createAllButtonsR(rightContainer, true)
						break
					case 'admin':
						createAdminButtonsR(rightContainer, true)
						break
					case 'discord':
						createDsButtonsR(rightContainer, true)
						break
				}
			})
		})
	}

    
	

			

    const createAllButtonsR = rootContainer => {
			chrome.storage.sync.get(['buttonBgColor'], data => {
				const baseColor = data.buttonBgColor || '#FF5722'

				// простая функция, которая затемняет HEX-цвет на заданный процент
				function darkenColor(hex, percent) {
					// убираем «#», если он есть
					hex = hex.replace(/^#/, '')
					// если короткий формат (e.g. "F52"), приводим к полному
					if (hex.length === 3) {
						hex = hex
							.split('')
							.map(ch => ch + ch)
							.join('')
					}
					const num = parseInt(hex, 16)
					const r = (num >> 16) & 0xff
					const g = (num >> 8) & 0xff
					const b = num & 0xff

					// уменьшаем каждый канал на percent%
					const newR = Math.max(
						0,
						Math.min(255, Math.floor(r * (1 - percent / 100)))
					)
					const newG = Math.max(
						0,
						Math.min(255, Math.floor(g * (1 - percent / 100)))
					)
					const newB = Math.max(
						0,
						Math.min(255, Math.floor(b * (1 - percent / 100)))
					)

					// возвращаем обратно строку вида "#RRGGBB"
					return (
						'#' +
						((1 << 24) | (newR << 16) | (newG << 8) | newB)
							.toString(16)
							.slice(1)
					)
				}

				// пример: контейнер будет на 20% темнее, чем baseColor
				const dropdownBgColor = darkenColor(baseColor, 20)

				// 1) создаём и прописываем главные кнопки
				const mainButton_mute = document.createElement('button')
				mainButton_mute.innerText = 'Mute'
				mainButton_mute.style.padding = '10px 15px'
				mainButton_mute.style.backgroundColor = baseColor
				mainButton_mute.style.color = 'white'
				mainButton_mute.style.border = '2px solid ' + baseColor
				mainButton_mute.style.borderRadius = '10px'
				mainButton_mute.style.cursor = 'pointer'
				mainButton_mute.style.fontSize = '16px'
				mainButton_mute.style.marginBottom = '10px'
				mainButton_mute.style.position = 'relative'
				rootContainer.appendChild(mainButton_mute)

				const mainButton_ajail = document.createElement('button')
				mainButton_ajail.innerText = 'Ajail'
				mainButton_ajail.style.padding = '10px 15px'
				mainButton_ajail.style.backgroundColor = baseColor
				mainButton_ajail.style.color = 'white'
				mainButton_ajail.style.border = '2px solid ' + baseColor
				mainButton_ajail.style.borderRadius = '10px'
				mainButton_ajail.style.cursor = 'pointer'
				mainButton_ajail.style.fontSize = '16px'
				mainButton_ajail.style.marginBottom = '10px'
				mainButton_ajail.style.position = 'relative'
				rootContainer.appendChild(mainButton_ajail)

				const mainButton_ban = document.createElement('button')
				mainButton_ban.innerText = 'Ban'
				mainButton_ban.style.padding = '10px 15px'
				mainButton_ban.style.backgroundColor = baseColor
				mainButton_ban.style.color = 'white'
				mainButton_ban.style.border = '2px solid ' + baseColor
				mainButton_ban.style.borderRadius = '10px'
				mainButton_ban.style.cursor = 'pointer'
				mainButton_ban.style.fontSize = '16px'
				mainButton_ban.style.marginBottom = '10px'
				mainButton_ban.style.position = 'relative'
				rootContainer.appendChild(mainButton_ban)

				// 2) Функция для создания «дропдауна» под кнопкой, с фоном чуть темнее baseColor
				function createStyledContainer(id, parentButton) {
					const container = document.createElement('div')
					container.id = id
					container.style.position = 'absolute'
					// фон на 20% темнее, чем baseColor:
					container.style.backgroundColor = dropdownBgColor
					// бордер можем сделать того же «тёмного» оттенка:
					container.style.border = '2px solid ' + dropdownBgColor
					container.style.borderRadius = '10px'
					container.style.padding = '10px'
					container.style.display = 'none'
					container.style.flexDirection = 'column'
					container.style.boxShadow = '0 4px 10px rgba(0,0,0,0.1)'
					container.style.zIndex = '1000'

					// ширина как у кнопки и позиционирование сразу под ней:
					const rect = parentButton.getBoundingClientRect()
					container.style.width = rect.width + 'px'
					container.style.top = rect.bottom + window.scrollY + 'px'
					container.style.left = rect.left + window.scrollX + 'px'

					document.body.appendChild(container)
					return container
				}

				// 3) создаём три «дропдауна» сразу после того, как кнопки вставлены в DOM
				const buttonContainer_mute = createStyledContainer(
					'buttonContainer_mute',
					mainButton_mute
				)
				const buttonContainer_ajail = createStyledContainer(
					'buttonContainer_ajail',
					mainButton_ajail
				)
				const buttonContainer_ban = createStyledContainer(
					'buttonContainer_ban',
					mainButton_ban
				)

				// 4) вспомогательная функция для пересчёта позиции «дропдауна» под кнопкой
				function positionBelow(button, dropdown) {
					const rect = button.getBoundingClientRect()
					dropdown.style.top = rect.bottom + window.scrollY + 3 + 'px'
					dropdown.style.left = rect.left + window.scrollX + 'px'
				}

				// 5) навешиваем клики на главные кнопки, чтобы они переключали цвет и открывали свой «дропдаун»
				mainButton_mute.addEventListener('click', () => {
					positionBelow(mainButton_mute, buttonContainer_mute)
					// переключаем цвет самой кнопки (светлее ↔ темнее)
					if (mainButton_mute.style.backgroundColor === 'rgb(255,  87,  34)') {
						mainButton_mute.style.backgroundColor = '#c06e35'
						mainButton_mute.style.border = '2px solid #c06e35'
					} else {
						mainButton_mute.style.backgroundColor = baseColor
						mainButton_mute.style.border = '2px solid ' + baseColor
					}
					buttonContainer_mute.style.display =
						buttonContainer_mute.style.display === 'none' ? 'flex' : 'none'
				})

				mainButton_ajail.addEventListener('click', () => {
					positionBelow(mainButton_ajail, buttonContainer_ajail)
					if (mainButton_ajail.style.backgroundColor === 'rgb(255,  87,  34)') {
						mainButton_ajail.style.backgroundColor = '#c06e35'
						mainButton_ajail.style.border = '2px solid #c06e35'
					} else {
						mainButton_ajail.style.backgroundColor = baseColor
						mainButton_ajail.style.border = '2px solid ' + baseColor
					}
					buttonContainer_ajail.style.display =
						buttonContainer_ajail.style.display === 'none' ? 'flex' : 'none'
				})

				mainButton_ban.addEventListener('click', () => {
					positionBelow(mainButton_ban, buttonContainer_ban)
					if (mainButton_ban.style.backgroundColor === 'rgb(255,  87,  34)') {
						mainButton_ban.style.backgroundColor = '#c06e35'
						mainButton_ban.style.border = '2px solid #c06e35'
					} else {
						mainButton_ban.style.backgroundColor = baseColor
						mainButton_ban.style.border = '2px solid ' + baseColor
					}
					buttonContainer_ban.style.display =
						buttonContainer_ban.style.display === 'none' ? 'flex' : 'none'
				})

				// Добавляем кнопки в контейнер
				;('------------------------------------MUTE-------------------------------------------')

				buttonContainer_mute.appendChild(
					createButton(
						'Оск. в ООС',
						() => {
							const playerCodes = getPlayerCodes()
							if (playerCodes) {
								let complaintTypeText =
									complaintTypes[localStorage.getItem('complaintType')] ||
									complaintTypes.nonFactional
								let text = `/offmuteooc ${playerCodes} 30m Оскорбление в ООС чат [${complaintTypeText} | ${getComplaintId()}]`
								if (
									JSON.parse(localStorage.getItem('requestEnabled') || 'false')
								) {
									const adminNick =
										localStorage.getItem('adminNick') ||
										'неизвестный администратор'
									text += `. Выдано по просьбе ${adminNick}.`
								}
								insertText(text)
							} else {
								alert('Не удалось найти нужные коды игроков')
							}
						},
						'#FF5722'
					)
				)

				buttonContainer_mute.appendChild(
					createButton(
						'Угрозы в ООС чат',
						() => {
							const playerCodes = getPlayerCodes()
							if (playerCodes) {
								let complaintTypeText =
									complaintTypes[localStorage.getItem('complaintType')] ||
									complaintTypes.nonFactional
								let text = `/offmuteooc ${playerCodes} 300m Угрозы в ООС чат [${complaintTypeText} | ${getComplaintId()}]`
								if (
									JSON.parse(localStorage.getItem('requestEnabled') || 'false')
								) {
									const adminNick =
										localStorage.getItem('adminNick') ||
										'неизвестный администратор'
									text += `. Выдано по просьбе ${adminNick}.`
								}
								insertText(text)
							} else {
								alert('Не удалось найти нужные коды игроков')
							}
						},
						'#FF5722'
					)
				)

				buttonContainer_mute.appendChild(
					createButton(
						'Разговор в агониях',
						() => {
							const playerCodes = getPlayerCodes()
							if (playerCodes) {
								let complaintTypeText =
									complaintTypes[localStorage.getItem('complaintType')] ||
									complaintTypes.nonFactional
								let text = `/offmuteic ${playerCodes} 30m Разговор в агониях [${complaintTypeText} | ${getComplaintId()}]`
								if (
									JSON.parse(localStorage.getItem('requestEnabled') || 'false')
								) {
									const adminNick =
										localStorage.getItem('adminNick') ||
										'неизвестный администратор'
									text += `. Выдано по просьбе ${adminNick}.`
								}
								insertText(text)
							} else {
								alert('Не удалось найти нужные коды игроков')
							}
						},
						'#FF5722'
					)
				)

				buttonContainer_mute.appendChild(
					createButton(
						'Мат в ООС',
						() => {
							const playerCodes = getPlayerCodes()
							if (playerCodes) {
								let complaintTypeText =
									complaintTypes[localStorage.getItem('complaintType')] ||
									complaintTypes.nonFactional
								let text = `/offmuteooc ${playerCodes} 30m Мат в ООС чат [${complaintTypeText} | ${getComplaintId()}]`
								if (
									JSON.parse(localStorage.getItem('requestEnabled') || 'false')
								) {
									const adminNick =
										localStorage.getItem('adminNick') ||
										'неизвестный администратор'
									text += `. Выдано по просьбе ${adminNick}.`
								}
								insertText(text)
							} else {
								alert('Не удалось найти нужные коды игроков')
							}
						},
						'#FF5722'
					)
				)

				buttonContainer_mute.appendChild(
					createButton(
						'Бред в голосовой чат',
						() => {
							const playerCodes = getPlayerCodes()
							if (playerCodes) {
								let complaintTypeText =
									complaintTypes[localStorage.getItem('complaintType')] ||
									complaintTypes.nonFactional
								let text = `/offmutevoice ${playerCodes} 30m Бред в голосовой чат [${complaintTypeText} | ${getComplaintId()}]`
								if (
									JSON.parse(localStorage.getItem('requestEnabled') || 'false')
								) {
									const adminNick =
										localStorage.getItem('adminNick') ||
										'неизвестный администратор'
									text += `. Выдано по просьбе ${adminNick}.`
								}
								insertText(text)
							} else {
								alert('Не удалось найти нужные коды игроков')
							}
						},
						'#FF5722'
					)
				)

				buttonContainer_mute.appendChild(
					createButton(
						'Транслит в IC',
						() => {
							const playerCodes = getPlayerCodes()
							if (playerCodes) {
								let complaintTypeText =
									complaintTypes[localStorage.getItem('complaintType')] ||
									complaintTypes.nonFactional
								let text = `/offmuteic ${playerCodes} 30m Транслит в IC чат [${complaintTypeText} | ${getComplaintId()}]`
								if (
									JSON.parse(localStorage.getItem('requestEnabled') || 'false')
								) {
									const adminNick =
										localStorage.getItem('adminNick') ||
										'неизвестный администратор'
									text += `. Выдано по просьбе ${adminNick}.`
								}
								insertText(text)
							} else {
								alert('Не удалось найти нужные коды игроков')
							}
						},
						'#FF5722'
					)
				)

				buttonContainer_mute.appendChild(
					createButton(
						'Banword',
						() => {
							const playerCodes = getPlayerCodes()
							if (playerCodes) {
								let complaintTypeText =
									complaintTypes[localStorage.getItem('complaintType')] ||
									complaintTypes.nonFactional
								let text1 = `/offmutevoice ${playerCodes} 180m Banword [${complaintTypeText} | ${getComplaintId()}]`
								let text2 = `/offmuteic ${playerCodes} 180m Banword [${complaintTypeText} | ${getComplaintId()}]`
								let text3 = `/offmuteooc ${playerCodes} 180m Banword [${complaintTypeText} | ${getComplaintId()}]`
								if (
									JSON.parse(localStorage.getItem('requestEnabled') || 'false')
								) {
									const adminNick =
										localStorage.getItem('adminNick') ||
										'неизвестный администратор'
									text1 += `. Выдано по просьбе ${adminNick}.`
									text2 += `. Выдано по просьбе ${adminNick}.`
									text3 += `. Выдано по просьбе ${adminNick}.`
								}
								insertText(text1)
								insertText(text2)
								insertText(text3)
							} else {
								alert('Не удалось найти нужные коды игроков')
							}
						},
						'#FF5722'
					)
				)
				;('------------------------------------AJAIL AND WARN-------------------------------------------')

				buttonContainer_ajail.appendChild(
					createButton(
						'Таран',
						() => {
							const playerCodes = getPlayerCodes()
							if (playerCodes) {
								let complaintTypeText =
									complaintTypes[localStorage.getItem('complaintType')] ||
									complaintTypes.nonFactional
								let text = `/offajail ${playerCodes} 40m Таран [${complaintTypeText} | ${getComplaintId()}]`
								if (
									JSON.parse(localStorage.getItem('requestEnabled') || 'false')
								) {
									const adminNick =
										localStorage.getItem('adminNick') ||
										'неизвестный администратор'
									text += `. Выдано по просьбе ${adminNick}.`
								}
								insertText(text)
							} else {
								alert('Не удалось найти нужные коды игроков')
							}
						},
						'#FF5722'
					)
				)

				buttonContainer_ajail.appendChild(
					createButton(
						'НПO',
						() => {
							const playerCodes = getPlayerCodes()
							if (playerCodes) {
								let complaintTypeText =
									complaintTypes[localStorage.getItem('complaintType')] ||
									complaintTypes.nonFactional
								let text = `/offajail ${playerCodes} 40m НПО [${complaintTypeText} | ${getComplaintId()}]`
								if (
									JSON.parse(localStorage.getItem('requestEnabled') || 'false')
								) {
									const adminNick =
										localStorage.getItem('adminNick') ||
										'неизвестный администратор'
									text += `. Выдано по просьбе ${adminNick}.`
								}
								insertText(text)
							} else {
								alert('Не удалось найти нужные коды игроков')
							}
						},
						'#FF5722'
					)
				)

				buttonContainer_ajail.appendChild(
					createButton(
						'Байт на DM',
						() => {
							const playerCodes = getPlayerCodes()
							if (playerCodes) {
								let complaintTypeText =
									complaintTypes[localStorage.getItem('complaintType')] ||
									complaintTypes.nonFactional
								let text = `/offajail ${playerCodes} 60m Байт на DM [${complaintTypeText} | ${getComplaintId()}]`
								if (
									JSON.parse(localStorage.getItem('requestEnabled') || 'false')
								) {
									const adminNick =
										localStorage.getItem('adminNick') ||
										'неизвестный администратор'
									text += `. Выдано по просьбе ${adminNick}.`
								}
								insertText(text)
							} else {
								alert('Не удалось найти нужные коды игроков')
							}
						},
						'#FF5722'
					)
				)

				buttonContainer_ajail.appendChild(
					createButton(
						'DM сотрудников ЦБ',
						() => {
							const playerCodes = getPlayerCodes()
							if (playerCodes) {
								let complaintTypeText =
									complaintTypes[localStorage.getItem('complaintType')] ||
									complaintTypes.nonFactional
								let text1 = `/offajail ${playerCodes} 180m DM сотрудников ЦГБ-А/ЦГБ-Ю [${complaintTypeText} | ${getComplaintId()}]`
								let text2 = `/offwarn ${playerCodes} 7d DM сотрудников ЦГБ-А/ЦГБ-Ю [${complaintTypeText} | ${getComplaintId()}]`
								if (
									JSON.parse(localStorage.getItem('requestEnabled') || 'false')
								) {
									const adminNick =
										localStorage.getItem('adminNick') ||
										'неизвестный администратор'
									text1 += `. Выдано по просьбе ${adminNick}.`
									text2 += `. Выдано по просьбе ${adminNick}.`
								}
								insertText(text1)
								insertText(text2)
							} else {
								alert('Не удалось найти нужные коды игроков')
							}
						},
						'#FF5722'
					)
				)

				buttonContainer_ajail.appendChild(
					createButton(
						'DM in GZ',
						() => {
							const playerCodes = getPlayerCodes()
							if (playerCodes) {
								let complaintTypeText =
									complaintTypes[localStorage.getItem('complaintType')] ||
									complaintTypes.nonFactional
								let text1 = `/offajail ${playerCodes} 180m DM in GZ [${complaintTypeText} | ${getComplaintId()}]`
								let text2 = `/offwarn ${playerCodes} 7d DM in GZ [${complaintTypeText} | ${getComplaintId()}]`
								if (
									JSON.parse(localStorage.getItem('requestEnabled') || 'false')
								) {
									const adminNick =
										localStorage.getItem('adminNick') ||
										'неизвестный администратор'
									text1 += `. Выдано по просьбе ${adminNick}.`
									text2 += `. Выдано по просьбе ${adminNick}.`
								}
								insertText(text1)
								insertText(text2)
							} else {
								alert('Не удалось найти нужные коды игроков')
							}
						},
						'#FF5722'
					)
				)

				buttonContainer_ajail.appendChild(
					createButton(
						'TK',
						() => {
							const playerCodes = getPlayerCodes()
							if (playerCodes) {
								let complaintTypeText =
									complaintTypes[localStorage.getItem('complaintType')] ||
									complaintTypes.nonFactional
								let text1 = `/offajail ${playerCodes} 180m TK [${complaintTypeText} | ${getComplaintId()}]`
								let text2 = `/offwarn ${playerCodes} 7d TK [${complaintTypeText} | ${getComplaintId()}]`
								if (
									JSON.parse(localStorage.getItem('requestEnabled') || 'false')
								) {
									const adminNick =
										localStorage.getItem('adminNick') ||
										'неизвестный администратор'
									text1 += `. Выдано по просьбе ${adminNick}.`
									text2 += `. Выдано по просьбе ${adminNick}.`
								}
								insertText(text1)
								insertText(text2)
							} else {
								alert('Не удалось найти нужные коды игроков')
							}
						},
						'#FF5722'
					)
				)

				buttonContainer_ajail.appendChild(
					createButton(
						'SK',
						() => {
							const playerCodes = getPlayerCodes()
							if (playerCodes) {
								let complaintTypeText =
									complaintTypes[localStorage.getItem('complaintType')] ||
									complaintTypes.nonFactional
								let text1 = `/offajail ${playerCodes} 90m SK [${complaintTypeText} | ${getComplaintId()}]`
								let text2 = `/offwarn ${playerCodes} 12d SK [${complaintTypeText} | ${getComplaintId()}]`
								if (
									JSON.parse(localStorage.getItem('requestEnabled') || 'false')
								) {
									const adminNick =
										localStorage.getItem('adminNick') ||
										'неизвестный администратор'
									text1 += `. Выдано по просьбе ${adminNick}.`
									text2 += `. Выдано по просьбе ${adminNick}.`
								}
								insertText(text1)
								insertText(text2)
							} else {
								alert('Не удалось найти нужные коды игроков')
							}
						},
						'#FF5722'
					)
				)

				buttonContainer_ajail.appendChild(
					createButton(
						'NRP cop',
						() => {
							const playerCodes = getPlayerCodes()
							if (playerCodes) {
								let complaintTypeText =
									complaintTypes[localStorage.getItem('complaintType')] ||
									complaintTypes.nonFactional
								let text1 = `/offajail ${playerCodes} 120m NRP cop [${complaintTypeText} | ${getComplaintId()}]`
								let text2 = `/offwarn ${playerCodes} 7d NRP cop [${complaintTypeText} | ${getComplaintId()}]`
								if (
									JSON.parse(localStorage.getItem('requestEnabled') || 'false')
								) {
									const adminNick =
										localStorage.getItem('adminNick') ||
										'неизвестный администратор'
									text1 += `. Выдано по просьбе ${adminNick}.`
									text2 += `. Выдано по просьбе ${adminNick}.`
								}
								insertText(text1)
								insertText(text2)
							} else {
								alert('Не удалось найти нужные коды игроков')
							}
						},
						'#FF5722'
					)
				)

				buttonContainer_ajail.appendChild(
					createButton(
						'Гос + Крайм',
						() => {
							const playerCodes = getPlayerCodes()
							if (playerCodes) {
								let complaintTypeText =
									complaintTypes[localStorage.getItem('complaintType')] ||
									complaintTypes.nonFactional
								let text1 = `/offajail ${playerCodes} 60m Гос + Крайм [${complaintTypeText} | ${getComplaintId()}]`
								let text2 = `/offwarn ${playerCodes} 7d Гос + Крайм [${complaintTypeText} | ${getComplaintId()}]`
								if (
									JSON.parse(localStorage.getItem('requestEnabled') || 'false')
								) {
									const adminNick =
										localStorage.getItem('adminNick') ||
										'неизвестный администратор'
									text1 += `. Выдано по просьбе ${adminNick}.`
									text2 += `. Выдано по просьбе ${adminNick}.`
								}
								insertText(text1)
								insertText(text2)
							} else {
								alert('Не удалось найти нужные коды игроков')
							}
						},
						'#FF5722'
					)
				)

				buttonContainer_ajail.appendChild(
					createButton(
						'Багоюз',
						() => {
							const playerCodes = getPlayerCodes()
							if (playerCodes) {
								let complaintTypeText =
									complaintTypes[localStorage.getItem('complaintType')] ||
									complaintTypes.nonFactional
								let text = `/offajail ${playerCodes} 60m Багоюз [${complaintTypeText} | ${getComplaintId()}]`
								if (
									JSON.parse(localStorage.getItem('requestEnabled') || 'false')
								) {
									const adminNick =
										localStorage.getItem('adminNick') ||
										'неизвестный администратор'
									text += `. Выдано по просьбе ${adminNick}.`
								}
								insertText(text)
							} else {
								alert('Не удалось найти нужные коды игроков')
							}
						},
						'#FF5722'
					)
				)

				buttonContainer_ajail.appendChild(
					createButton(
						'Веский багоюз',
						() => {
							const playerCodes = getPlayerCodes()
							if (playerCodes) {
								let complaintTypeText =
									complaintTypes[localStorage.getItem('complaintType')] ||
									complaintTypes.nonFactional
								let text1 = `/offajail ${playerCodes} 90m Веский багоюз [${complaintTypeText} | ${getComplaintId()}]`
								let text2 = `/offwarn ${playerCodes} 7d Веский багоюз [${complaintTypeText} | ${getComplaintId()}]`
								if (
									JSON.parse(localStorage.getItem('requestEnabled') || 'false')
								) {
									const adminNick =
										localStorage.getItem('adminNick') ||
										'неизвестный администратор'
									text1 += `. Выдано по просьбе ${adminNick}.`
									text2 += `. Выдано по просьбе ${adminNick}.`
								}
								insertText(text1)
								insertText(text2)
							} else {
								alert('Не удалось найти нужные коды игроков')
							}
						},
						'#FF5722'
					)
				)
				;('------------------------------------BAN-------------------------------------------')

				buttonContainer_ban.appendChild(
					createButton(
						'Упоминание родных',
						() => {
							const playerCodes = getPlayerCodes()
							if (playerCodes) {
								let complaintTypeText =
									complaintTypes[localStorage.getItem('complaintType')] ||
									complaintTypes.nonFactional
								let text = `/offban ${playerCodes} 7d Упоминание родных [${complaintTypeText} | ${getComplaintId()}]`
								if (
									JSON.parse(localStorage.getItem('requestEnabled') || 'false')
								) {
									const adminNick =
										localStorage.getItem('adminNick') ||
										'неизвестный администратор'
									text += `. Выдано по просьбе ${adminNick}.`
								}
								insertText(text)
							} else {
								alert('Не удалось найти нужные коды игроков')
							}
						},
						'#FF5722'
					)
				)

				buttonContainer_ban.appendChild(
					createButton(
						'Меж. национальный розжиг',
						() => {
							const playerCodes = getPlayerCodes()
							if (playerCodes) {
								let complaintTypeText =
									complaintTypes[localStorage.getItem('complaintType')] ||
									complaintTypes.nonFactional
								let text = `/offban ${playerCodes} 7d Между национальный розжиг [${complaintTypeText} | ${getComplaintId()}]`
								if (
									JSON.parse(localStorage.getItem('requestEnabled') || 'false')
								) {
									const adminNick =
										localStorage.getItem('adminNick') ||
										'неизвестный администратор'
									text += `. Выдано по просьбе ${adminNick}.`
								}
								insertText(text)
							} else {
								alert('Не удалось найти нужные коды игроков')
							}
						},
						'#FF5722'
					)
				)

				buttonContainer_ban.appendChild(
					createButton(
						'Оск. проекта/администрации',
						() => {
							const playerCodes = getPlayerCodes()
							if (playerCodes) {
								let complaintTypeText =
									complaintTypes[localStorage.getItem('complaintType')] ||
									complaintTypes.nonFactional
								let text = `/offban ${playerCodes} 7d Оскорбление проекта/администрации [${complaintTypeText} | ${getComplaintId()}]`
								if (
									JSON.parse(localStorage.getItem('requestEnabled') || 'false')
								) {
									const adminNick =
										localStorage.getItem('adminNick') ||
										'неизвестный администратор'
									text += `. Выдано по просьбе ${adminNick}.`
								}
								insertText(text)
							} else {
								alert('Не удалось найти нужные коды игроков')
							}
						},
						'#FF5722'
					)
				)

				buttonContainer_ban.appendChild(
					createButton(
						'Продажа виртов',
						() => {
							const playerCodes = getPlayerCodes()
							if (playerCodes) {
								let complaintTypeText =
									complaintTypes[localStorage.getItem('complaintType')] ||
									complaintTypes.nonFactional
								let text = `/offban ${playerCodes} 36500d Продажа виртов [${complaintTypeText} | ${getComplaintId()}]`
								if (
									JSON.parse(localStorage.getItem('requestEnabled') || 'false')
								) {
									const adminNick =
										localStorage.getItem('adminNick') ||
										'неизвестный администратор'
									text += `. Выдано по просьбе ${adminNick}.`
								}
								insertText(text)
							} else {
								alert('Не удалось найти нужные коды игроков')
							}
						},
						'#FF5722'
					)
				)

				buttonContainer_ban.appendChild(
					createButton(
						'Покупка виртов',
						() => {
							const playerCodes = getPlayerCodes()
							if (playerCodes) {
								let complaintTypeText =
									complaintTypes[localStorage.getItem('complaintType')] ||
									complaintTypes.nonFactional
								let text = `/offban ${playerCodes} 365d Покупка виртов [${complaintTypeText} | ${getComplaintId()}]`
								if (
									JSON.parse(localStorage.getItem('requestEnabled') || 'false')
								) {
									const adminNick =
										localStorage.getItem('adminNick') ||
										'неизвестный администратор'
									text += `. Выдано по просьбе ${adminNick}.`
								}
								insertText(text)
							} else {
								alert('Не удалось найти нужные коды игроков')
							}
						},
						'#FF5722'
					)
				)

				buttonContainer_ban.appendChild(
					createButton(
						'Попытка ППВ',
						() => {
							const playerCodes = getPlayerCodes()
							if (playerCodes) {
								let complaintTypeText =
									complaintTypes[localStorage.getItem('complaintType')] ||
									complaintTypes.nonFactional
								let text = `/offban ${playerCodes} 222d Попытка покупки/продажи виртов [${complaintTypeText} | ${getComplaintId()}]`
								if (
									JSON.parse(localStorage.getItem('requestEnabled') || 'false')
								) {
									const adminNick =
										localStorage.getItem('adminNick') ||
										'неизвестный администратор'
									text += `. Выдано по просьбе ${adminNick}.`
								}
								insertText(text)
							} else {
								alert('Не удалось найти нужные коды игроков')
							}
						},
						'#FF5722'
					)
				)

				buttonContainer_ban.appendChild(
					createButton(
						'Слив фракции',
						() => {
							const playerCodes = getPlayerCodes()
							if (playerCodes) {
								let complaintTypeText =
									complaintTypes[localStorage.getItem('complaintType')] ||
									complaintTypes.nonFactional
								let text = `/offban ${playerCodes} 30d Слив фракции [${complaintTypeText} | ${getComplaintId()}]`
								if (
									JSON.parse(localStorage.getItem('requestEnabled') || 'false')
								) {
									const adminNick =
										localStorage.getItem('adminNick') ||
										'неизвестный администратор'
									text += `. Выдано по просьбе ${adminNick}.`
								}
								insertText(text)
							} else {
								alert('Не удалось найти нужные коды игроков')
							}
						},
						'#FF5722'
					)
				)

				buttonContainer_ban.appendChild(
					createButton(
						'Реклама сторонних ресурсов',
						() => {
							const playerCodes = getPlayerCodes()
							if (playerCodes) {
								let complaintTypeText =
									complaintTypes[localStorage.getItem('complaintType')] ||
									complaintTypes.nonFactional
								let text = `/offban ${playerCodes} 30d Реклама сторонних ресурсов [${complaintTypeText} | ${getComplaintId()}]`
								if (
									JSON.parse(localStorage.getItem('requestEnabled') || 'false')
								) {
									const adminNick =
										localStorage.getItem('adminNick') ||
										'неизвестный администратор'
									text += `. Выдано по просьбе ${adminNick}.`
								}
								insertText(text)
							} else {
								alert('Не удалось найти нужные коды игроков')
							}
						},
						'#FF5722'
					)
				)

				buttonContainer_ban.appendChild(
					createButton(
						'Обход бана',
						() => {
							const playerCodes = getPlayerCodes()
							if (playerCodes) {
								let complaintTypeText =
									complaintTypes[localStorage.getItem('complaintType')] ||
									complaintTypes.nonFactional
								let text = `/offban ${playerCodes} 30d Обход бана [${complaintTypeText} | ${getComplaintId()}]`
								if (
									JSON.parse(localStorage.getItem('requestEnabled') || 'false')
								) {
									const adminNick =
										localStorage.getItem('adminNick') ||
										'неизвестный администратор'
									text += `. Выдано по просьбе ${adminNick}.`
								}
								insertText(text)
							} else {
								alert('Не удалось найти нужные коды игроков')
							}
						},
						'#FF5722'
					)
				)

				buttonContainer_ban.appendChild(
					createButton(
						'Оскорбительные ники',
						() => {
							const playerCodes = getPlayerCodes()
							if (playerCodes) {
								let complaintTypeText =
									complaintTypes[localStorage.getItem('complaintType')] ||
									complaintTypes.nonFactional
								let text = `/offban ${playerCodes} 7d Оскорбительный ник [${complaintTypeText} | ${getComplaintId()}]`
								if (
									JSON.parse(localStorage.getItem('requestEnabled') || 'false')
								) {
									const adminNick =
										localStorage.getItem('adminNick') ||
										'неизвестный администратор'
									text += `. Выдано по просьбе ${adminNick}.`
								}
								insertText(text)
							} else {
								alert('Не удалось найти нужные коды игроков')
							}
						},
						'#FF5722'
					)
				)

				buttonContainer_ban.appendChild(
					createButton(
						'BanWord ',
						() => {
							const playerCodes = getPlayerCodes()
							if (playerCodes) {
								let complaintTypeText =
									complaintTypes[localStorage.getItem('complaintType')] ||
									complaintTypes.nonFactional
								let text = `/offban ${playerCodes} 7d BanWord  [${complaintTypeText} | ${getComplaintId()}]`
								if (
									JSON.parse(localStorage.getItem('requestEnabled') || 'false')
								) {
									const adminNick =
										localStorage.getItem('adminNick') ||
										'неизвестный администратор'
									text += `. Выдано по просьбе ${adminNick}.`
								}
								insertText(text)
							} else {
								alert('Не удалось найти нужные коды игроков')
							}
						},
						'#FF5722'
					)
				)

				rootContainer.appendChild(
					createButton(
						'Форматировать текст',
						() => {
							chrome.storage.sync.get(
								['selectedFont', 'selectedFontSize', 'primaryColor'],
								data => {
									const editableDiv = document.querySelector(
										'.fr-element.fr-view[contenteditable="true"]'
									)
									if (editableDiv) {
										const selectedFont = data.selectedFont || 'Book Antiqua'
										const selectedFontSize = data.selectedFontSize || '16px'
										const primaryColor = data.primaryColor || '#ffffff'

										// Получаем только текст без HTML
										let rawText = editableDiv.innerText || ''

										// Убираем лишние пробелы, табы и лишние символы
										rawText = rawText
											.replace(/\u00A0/g, ' ') // заменяем неразрывные пробелы на обычные
											.replace(/\t+/g, ' ') // убираем табуляции
											.replace(/ +/g, ' ') // убираем повторяющиеся пробелы
											.replace(/ *\n */g, '\n') // убираем пробелы вокруг переносов строк
											.trim() // убираем пробелы с начала и конца

										const lines = rawText
											.split(/\r?\n/)
											.filter(line => line.length > 0)

										if (lines.length === 0) {
											alert('Нет текста для форматирования.')
											return
										}

										const formattedHTML = lines
											.map(
												line => `
                    <p style="text-align: center;">
                        <strong><em>
                            <span style="color: ${primaryColor}; font-size: ${selectedFontSize}px; font-family: '${selectedFont}'; font-weight: bold;">
                                ${line}
                            </span>
                        </em></strong>
                    </p>
                `
											)
											.join('\n')

										editableDiv.innerHTML = formattedHTML + '<p><br></p>'
									}
								}
							)
						},
						'#FF5722'
					)
				)

				rootContainer.appendChild(
					createButton(
						'DM',
						() => {
							const playerCodes = getPlayerCodes()
							if (playerCodes) {
								let complaintTypeText =
									complaintTypes[localStorage.getItem('complaintType')] ||
									complaintTypes.nonFactional
								let text = `/offajail ${playerCodes} 180 DM [${complaintTypeText} | ${getComplaintId()}]`
								if (
									JSON.parse(localStorage.getItem('requestEnabled') || 'false')
								) {
									const adminNick =
										localStorage.getItem('adminNick') ||
										'неизвестный администратор'
									text += `. Выдано по просьбе ${adminNick}.`
								}
								insertText(text)
							} else {
								alert('Не удалось найти нужные коды игроков')
							}
						},
						'#FF5722'
					)
				)

				rootContainer.appendChild(
					createButton(
						'NRP поведение',
						() => {
							const playerCodes = getPlayerCodes()
							if (playerCodes) {
								let complaintTypeText =
									complaintTypes[localStorage.getItem('complaintType')] ||
									complaintTypes.nonFactional
								let text = `/offajail ${playerCodes} 60 NRP поведение [${complaintTypeText} | ${getComplaintId()}]`
								if (
									JSON.parse(localStorage.getItem('requestEnabled') || 'false')
								) {
									const adminNick =
										localStorage.getItem('adminNick') ||
										'неизвестный администратор'
									text += `. Выдано по просьбе ${adminNick}.`
								}
								insertText(text)
							} else {
								alert('Не удалось найти нужные коды игроков')
							}
						},
						'#FF5722'
					)
				)

				rootContainer.appendChild(
					createButton(
						'PG',
						() => {
							const playerCodes = getPlayerCodes()
							if (playerCodes) {
								let complaintTypeText =
									complaintTypes[localStorage.getItem('complaintType')] ||
									complaintTypes.nonFactional
								let text = `/offajail ${playerCodes} 80 PG [${complaintTypeText} | ${getComplaintId()}]`
								if (
									JSON.parse(localStorage.getItem('requestEnabled') || 'false')
								) {
									const adminNick =
										localStorage.getItem('adminNick') ||
										'неизвестный администратор'
									text += `. Выдано по просьбе ${adminNick}.`
								}
								insertText(text)
							} else {
								alert('Не удалось найти нужные коды игроков')
							}
						},
						'#FF5722'
					)
				)

				rootContainer.appendChild(
					createButton(
						'Уход от РП',
						() => {
							const playerCodes = getPlayerCodes()
							if (playerCodes) {
								let complaintTypeText =
									complaintTypes[localStorage.getItem('complaintType')] ||
									complaintTypes.nonFactional
								let text1 = `/offajail ${playerCodes} 180 Уход от РП [${complaintTypeText} | ${getComplaintId()}]`
								let text2 = `/offwarn ${playerCodes} 5 Уход от РП [${complaintTypeText} | ${getComplaintId()}]`
								if (
									JSON.parse(localStorage.getItem('requestEnabled') || 'false')
								) {
									const adminNick =
										localStorage.getItem('adminNick') ||
										'неизвестный администратор'
									text1 += `. Выдано по просьбе ${adminNick}.`
									text2 += `. Выдано по просьбе ${adminNick}.`
								}
								insertText(text1)
								insertText(text2)
							} else {
								alert('Не удалось найти нужные коды игроков')
							}
						},
						'#FF5722'
					)
				)

				// Дополнительно добавляем поле для ввода ника администратора и чекбокс
				rootContainer.appendChild(createNicknameInput())
				rootContainer.appendChild(
					createCheckbox('Выдано по просьбе', checked => {
						// Обновляем состояние при изменении чекбокса
					})
				)
			})
		}


	const createDsButtonsR = (container, isRightContainer = false) => {
		container.appendChild(
			createButton(
				'Форматировать текст',
				() => {
					chrome.storage.sync.get(
						['selectedFont', 'selectedFontSize', 'primaryColor'],
						data => {
							const editableDiv = document.querySelector(
								'.fr-element.fr-view[contenteditable="true"]'
							)
							if (editableDiv) {
								const selectedFont = data.selectedFont || 'Book Antiqua'
								const selectedFontSize = data.selectedFontSize || '16px'
								const primaryColor = data.primaryColor || '#ffffff'

								// Получаем только текст без HTML
								let rawText = editableDiv.innerText || ''

								// Убираем лишние пробелы, табы и лишние символы
								rawText = rawText
									.replace(/\u00A0/g, ' ') // заменяем неразрывные пробелы на обычные
									.replace(/\t+/g, '') // убираем все табуляции
									.replace(/ +/g, ' ') // убираем повторяющиеся пробелы
									.replace(/ *\n */g, '\n') // убираем пробелы вокруг переносов строк
									.trim() // убираем пробелы с начала и конца

								const lines = rawText
									.split(/\r?\n/)
									.filter(line => line.length > 0)

								if (lines.length === 0) {
									alert('Нет текста для форматирования.')
									return
								}

								// Формируем HTML без лишних пробелов и табуляций
								const formattedHTML = lines
									.map(
										line =>
											`<p style="text-align:center;"><strong><em><span style="color:${primaryColor};font-size:${selectedFontSize};font-family:'${selectedFont}';font-weight:bold;">${line}</span></em></strong></p>`
									)
									.join('')

								editableDiv.innerHTML = formattedHTML + '<p><br></p>'
							}
						}
					)
				},
				'#FF5722'
			)
		)
	}

	// Функция для вставки HTML-кода в текстовое поле или редактор
	const insertHtmlIntoContentEditable = html => {
		// Найти элемент с contenteditable
		const contentEditable = document.querySelector(
			'.fr-element.fr-view[contenteditable="true"]'
		)

		if (contentEditable) {
			// Создаем объект Range для работы с DOM
			const range = document.createRange()
			const selection = window.getSelection()

			// Если в элементе уже есть содержимое
			if (contentEditable.firstChild) {
				// Установить диапазон перед первым <p> элементом
				range.setStartBefore(contentEditable.firstChild)
				range.collapse(true)
				selection.removeAllRanges()
				selection.addRange(range)

				// Создаем документный фрагмент для вставки HTML
				const frag = document.createDocumentFragment()
				const tempDiv = document.createElement('div')
				tempDiv.innerHTML = html
				while (tempDiv.firstChild) {
					frag.appendChild(tempDiv.firstChild)
				}
				range.insertNode(frag)
			} else {
				// Если элемент пуст, просто вставить HTML
				contentEditable.innerHTML = html
			}
		} else {
			alert('Не удалось найти элемент для вставки ссылки.')
		}
	}

	// Функция для открытия модального окна и вставки ссылки
	const openLinkDialog = () => {
		const dialog = document.createElement('div')
		dialog.innerHTML = `
        <div class="dialog" style="position: fixed; top: 78%; left: 8%; transform: translate(-50%, -50%); background: #313742; padding: 20px; border-radius: 8px; width: 300px; text-align: center; box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);">
        <button id="closeDialog" style="position: absolute; top: 10px; right: 10px; background: none; border: none; font-size: 18px; color: #FF5722; cursor: pointer;">&times;</button>
        <label for="url" style="display: block; margin-bottom: 10px; font-size: 16px;">Введите ссылку:</label>
        <input type="text" id="url" placeholder="https://forum.gtadom.com/" style="width: 100%; padding: 8px; margin-bottom: 20px; border: 1px solid #ccc; border-radius: 4px;">
        <button id="insertLink" style="background-color: #FF5722; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer;">Создать ссылку</button>
            </div>
    `

		document.body.appendChild(dialog)

		document.getElementById('closeDialog').addEventListener('click', () => {
			document.body.removeChild(dialog) // Закрываем диалог
		})

		document.getElementById('insertLink').addEventListener('click', () => {
			const url = document.getElementById('url').value

			if (url) {
				const linkHtml = `<a href="${url}" target="_blank">Жалоба по которой были наказаны.</a>`
				insertHtmlIntoContentEditable(linkHtml) // Вставляем ссылку в элемент contenteditable
			}
			document.body.removeChild(dialog) // Закрываем диалог
		})
	}

	const createAdminButtonsR = (container, isRightContainer = false) => {
		container.appendChild(
			createButton(
				'Форматировать текст',
				() => {
					chrome.storage.sync.get(
						['selectedFont', 'selectedFontSize', 'primaryColor'],
						data => {
							const editableDiv = document.querySelector(
								'.fr-element.fr-view[contenteditable="true"]'
							)
							if (editableDiv) {
								const selectedFont = data.selectedFont || 'Book Antiqua'
								const selectedFontSize = data.selectedFontSize || '16px'
								const primaryColor = data.primaryColor || '#ffffff'

								// Получаем только текст без HTML
								let rawText = editableDiv.innerText || ''

								// Убираем лишние пробелы, табы и лишние символы
								rawText = rawText
									.replace(/\u00A0/g, ' ') // заменяем неразрывные пробелы на обычные
									.replace(/\t+/g, ' ') // убираем табуляции
									.replace(/ +/g, ' ') // убираем повторяющиеся пробелы
									.replace(/ *\n */g, '\n') // убираем пробелы вокруг переносов строк
									.trim() // убираем пробелы с начала и конца

								const lines = rawText
									.split(/\r?\n/)
									.filter(line => line.length > 0)

								if (lines.length === 0) {
									alert('Нет текста для форматирования.')
									return
								}

								const formattedHTML = lines
									.map(
										line => `
                    <p style="text-align: center;">
                        <strong><em>
                            <span style="color: ${primaryColor}; font-size: ${selectedFontSize}px; font-family: '${selectedFont}'; font-weight: bold;">
                                ${line}
                            </span>
                        </em></strong>
                    </p>
                `
									)
									.join('\n')

								editableDiv.innerHTML = formattedHTML + '<p><br></p>'
							}
						}
					)
				},
				'#FF5722'
			)
		)

		container.appendChild(
			createButton(
				'Снять Ajail',
				() => {
					const cid = getAdminComplaintCID()
					if (cid) {
						let text = `/offunajail ${cid}`
						insertText(text)
					} else {
						alert('Не удалось найти нужный код игрока')
					}
				},
				'#FF5722'
			)
		)

		container.appendChild(
			createButton(
				'Снять Warn',
				() => {
					const cid = getAdminComplaintCID()
					if (cid) {
						let text = `/offunwarn ${cid}`
						insertText(text)
					} else {
						alert('Не удалось найти нужный код игрока')
					}
				},
				'#FF5722'
			)
		)

		container.appendChild(
			createButton(
				'Снять Ban',
				() => {
					const cid = getAdminComplaintCID()
					if (cid) {
						let text = `/unban ${cid}`
						insertText(text)
					} else {
						alert('Не удалось найти нужный код игрока')
					}
				},
				'#FF5722'
			)
		)
	}

	const createButtonContainers = () => {
		const leftContainer = document.querySelector('.left-buttons')
		const rightContainer = document.querySelector('.right-buttons')

		if (!leftContainer) {
			const newLeftContainer = document.createElement('div')
			newLeftContainer.className = 'left-buttons'
			newLeftContainer.style.position = 'fixed'
			newLeftContainer.style.top = '80px'
			newLeftContainer.style.left = '20px'
			newLeftContainer.style.zIndex = '1000'
			newLeftContainer.style.display = 'flex'
			newLeftContainer.style.flexDirection = 'column'
			newLeftContainer.style.width = '250px'
			document.body.appendChild(newLeftContainer)
		}

		if (!rightContainer) {
			const newRightContainer = document.createElement('div')
			newRightContainer.className = 'right-buttons'
			newRightContainer.style.position = 'fixed'
			newRightContainer.style.top = '80px'
			newRightContainer.style.right = '20px'
			newRightContainer.style.zIndex = '1000'
			newRightContainer.style.display = 'flex'
			newRightContainer.style.flexDirection = 'column'
			newRightContainer.style.width = '250px'
			document.body.appendChild(newRightContainer)
		}
	}

	function renderLeftButtons(container, configs) {
		container.innerHTML = ''
		chrome.storage.sync.get(
			['primaryColor', 'statusColor', 'editColor'],
			data => {
				const pC = data.primaryColor || '#FF5722'
				const sC = data.statusColor || '#F1E207'
				const eC = data.editColor || '#FFA500'
				const resolveColor = key => {
					switch (key) {
						case 'primaryColor':
							return pC
						case 'statusColor':
							return sC
						case 'editColor':
							return eC
						default:
							return key || pC
					}
				}

				configs.forEach(cfg => {
					const color1 = resolveColor(cfg.color1)
					const color2 = resolveColor(cfg.color2)
					const color3 = resolveColor(cfg.color3)

					const onClick = () => {
						if (cfg.action === 'openLinkDialog') {
							openLinkDialog()
							return
						}

						// Собираем один HTML-фрагмент из текстов с разными цветами
						let html = ''
						if (cfg.text1) {
							html += `<span style="color:${color1};">${cfg.text1}</span>`
						}
						if (cfg.text2) {
							html += `<br><span style="color:${color2};">${cfg.text2}</span>`
						}
						if (cfg.text3) {
							html += `<br><span style="color:${color3};">${cfg.text3}</span>`
						}

						// Единственный вызов: передаём флаги shouldClose / shouldSend
						insertFormattedText(html, null, {
							close: cfg.shouldClose,
							send: cfg.shouldSend,
						})
					}

					const btn = createButton(cfg.label, onClick, resolveColor(cfg.color1))
					container.appendChild(btn)
				})
			}
		)
	}      

	const updateButtons = () => {
		const complaintType =
			localStorage.getItem('complaintType') || 'nonFactional'
		const leftContainer = document.querySelector('.left-buttons')
		const rightContainer = document.querySelector('.right-buttons')

		// Сначала проверяем флаг showButtonsOnPage
		chrome.storage.sync.get(['showButtonsOnPage'], data => {
			const show =
				typeof data.showButtonsOnPage === 'boolean'
					? data.showButtonsOnPage
					: true // по умолчанию — true

			// Если не показывать кнопки, просто очищаем контейнеры и выходим
			if (!show) {
				leftContainer.innerHTML = ''
				rightContainer.innerHTML = ''
				return
			}

			// Иначе – продолжаем как раньше
			leftContainer.innerHTML = ''
			rightContainer.innerHTML = ''

			chrome.storage.sync.get([`buttonsConfig_${complaintType}`], data2 => {
				let configs = data2[`buttonsConfig_${complaintType}`]
				if (!Array.isArray(configs) || configs.length === 0) {
					configs = defaultConfigs[complaintType] || []
				}
				renderLeftButtons(leftContainer, configs)

				switch (complaintType) {
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
				}
			})
		})
	}

	const updatePageOnComplaintTypeChange = () => {
		const complaintTypeSelect = document.querySelector('#complaintTypeSelect')
		if (complaintTypeSelect) {
			complaintTypeSelect.addEventListener('change', event => {
				const selectedType = event.target.value
				localStorage.setItem('complaintType', selectedType)

				// Эмуляция нажатия клавиши F5
				window.dispatchEvent(
					new KeyboardEvent('keydown', { keyCode: 116, which: 116 })
				)
			})
		}
	}

	const complaintTypes = {
		criminal: 'Жалобы на игроков криминальных структур',
		state: 'Жалобы на государственных служащих',
		nonFactional: 'Жалобы на нефракционных игроков',
		admin: 'Жалобы на администрацию',
		discord: 'Разбан в дискорде',
	}

	let currentComplaintIndex = 0

	const switchComplaint = () => {
		const keys = Object.keys(complaintTypes)
		const currentType = keys[currentComplaintIndex]
		const targetElement = Array.from(
			document.querySelectorAll('span[itemprop="name"]')
		).find(el => el.textContent.includes(complaintTypes[currentType]))

		if (targetElement) {
			console.log(`Выбран режим жалоб: ${complaintTypes[currentType]}`)
			localStorage.setItem('complaintType', currentType)
			toggleButtons(currentType) // Ваша логика переключения
		}

		currentComplaintIndex = (currentComplaintIndex + 1) % keys.length
	}

	// Запуск автоматического переключения
	const executeSwitchComplaint = times => {
		let count = 0
		const interval = setInterval(() => {
			if (count < times) {
				times
				switchComplaint()
				count++
			} else {
				clearInterval(interval)
			}
		}, 50)
	}

	executeSwitchComplaint(5)

	createButtonContainers()
	updatePageOnComplaintTypeChange() // при смене селекта
	updateButtons() // отрисовать сразу, при загрузке страницы
});

function isLightColor(rgbString) {
    const rgb = rgbString.match(/\d+/g).map(Number);
    const brightness = (rgb[0] + rgb[1] + rgb[2]) / 3;
    return brightness > 180;
}

function darkenColor(rgbString) {
    const rgb = rgbString.match(/\d+/g).map(Number);
    const darkenFactor = 0.25;
    return `rgb(${Math.floor(rgb[0] * darkenFactor)}, ${Math.floor(rgb[1] * darkenFactor)}, ${Math.floor(rgb[2] * darkenFactor)})`;
}

function applyexpandableSignatures() {
    // Раскрываем все подписи
    const expandableSignatures = document.querySelectorAll('.message-signature.message-signature--expandable');
    expandableSignatures.forEach(signature => {
        signature.classList.add('message-signature--expanded');
    });
}

document.addEventListener('DOMContentLoaded', applyexpandableSignatures);
applyexpandableSignatures()
