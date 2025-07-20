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

	function darkenColor(hex, amount) {
		const num = parseInt(hex.replace('#', ''), 16)
		let r = (num >> 16) & 0xff
		let g = (num >> 8) & 0xff
		let b = num & 0xff

		r = Math.max(0, Math.min(255, Math.floor(r * (1 - amount))))
		g = Math.max(0, Math.min(255, Math.floor(g * (1 - amount))))
		b = Math.max(0, Math.min(255, Math.floor(b * (1 - amount))))

		return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
	}

	function createButton(text, onClick) {
		const btn = document.createElement('button')
		btn.textContent = text
		btn.classList.add('custom-btn')
		btn.style.marginBottom = '12px' // отступ между кнопками

		chrome.storage.sync.get(
			[
				'buttonBgColor',
				'buttonTextColor',
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
				const bgColor = data.buttonBgColor || '#FF5722'
				const textColor = data.buttonTextColor || '#FFFFFF'
				const borderRadius = data.buttonBorderRadius || '6px'
				const paddingVal = data.buttonPadding || '10px 15px'
				const fontFamily = data.selectedFontBTN || 'Arial, sans-serif'
				const fontSizePx = (data.selectedFontBTNSize || 15) + 'px'
				const widthVal = data.buttonWidth ? data.buttonWidth + 'px' : 'auto'
				const heightVal = data.buttonHeight ? data.buttonHeight + 'px' : 'auto'
				const boldOn = !!data.buttonBold
				const italicOn = !!data.buttonItalic

				// Немного затемнённый цвет для рамки (на 10%)
				const borderColor = darkenColor(bgColor, 0.15)
				// Цвет для hover (на 20%)
				const hoverColor = darkenColor(bgColor, 0.2)

				// Применяем основные стили
				btn.style.backgroundColor = bgColor
				btn.style.color = textColor
				btn.style.border = `3px solid ${borderColor}`
				btn.style.borderRadius = borderRadius
				btn.style.padding = paddingVal
				btn.style.fontFamily = fontFamily
				btn.style.fontSize = fontSizePx
				btn.style.width = widthVal
				btn.style.height = heightVal
				btn.style.fontWeight = boldOn ? 'bold' : 'normal'
				btn.style.fontStyle = italicOn ? 'italic' : 'normal'

				btn.addEventListener('mouseover', () => {
					btn.style.backgroundColor = hoverColor
					btn.style.borderColor = hoverColor
				})
				btn.addEventListener('mouseout', () => {
					btn.style.backgroundColor = bgColor
					btn.style.borderColor = borderColor
				})
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
				const selectedFontSize = data.selectedFontSize || '15'
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

		chrome.storage.sync.get(['showButtonsOnPage'], data => {
			const show = typeof data.showButtonsOnPage === 'boolean' ? data.showButtonsOnPage : true

			if (!show) {
				leftContainer.innerHTML = ''
				rightContainer.innerHTML = ''
				return
			}

			leftContainer.innerHTML = ''
			rightContainer.innerHTML = ''

			chrome.storage.sync.get([`buttonsConfig_${type}`], data2 => {
				let configs = data2[`buttonsConfig_${type}`]
				if (type !== 'default') {
					if (!Array.isArray(configs) || configs.length === 0) {
						configs = defaultConfigs[type] || []
					}
				}

				// 👉 Только если не режим "default" — отрисовываем левые кнопки
				if (type !== 'default') {
					renderLeftButtons(leftContainer, configs)
				}

				switch (type) {
					case 'criminal':
					case 'state':
					case 'lider':
					case 'nonFactional':
						createAllButtonsR(rightContainer, true)
						break
					case 'admin':
						createAdminButtonsR(rightContainer, true)
						break
					case 'discord':
						createDsButtonsR(rightContainer, true)
						break
					case 'default':
						createDefaultButtonsR(rightContainer) // только правые кнопки
						break
				}
			})
		})
	}

    
	

			

    const createAllButtonsR = rootContainer => {
		chrome.storage.sync.get(
			['buttonBgColor', 'buttonBold', 'buttonItalic', 'buttonTextColor'],
			data => {
				const baseColor = data.buttonBgColor || '#FF5722'
				const boldOn = !!data.buttonBold
				const italicOn = !!data.buttonItalic
				const buttonTextColor = data.buttonTextColor || 'white'

				// Функция затемнения HEX-цвета на заданный процент
				function darkenColor(hex, percent) {
					hex = hex.replace(/^#/, '')
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
					return (
						'#' +
						((1 << 24) | (newR << 16) | (newG << 8) | newB)
							.toString(16)
							.slice(1)
					)
				}

				const borderColor = darkenColor(baseColor, 10) // рамка на 10% темнее
				const hoverBgColor = darkenColor(baseColor, 20) // фон при hover на 20% темнее
				const dropdownBgColor = darkenColor(hoverBgColor, 20)

				// Общая функция создания кнопок
				function makeButton(label) {
					const btn = document.createElement('button')
					btn.innerText = label
					btn.style.padding = '10px 15px'
					btn.style.backgroundColor = baseColor
					btn.style.color = buttonTextColor
					btn.style.border = `2px solid ${borderColor}`
					btn.style.borderRadius = '10px'
					btn.style.cursor = 'pointer'
					btn.style.fontSize = '16px'
					btn.style.marginBottom = '10px'
					btn.style.position = 'relative'
					btn.style.fontWeight = boldOn ? 'bold' : 'normal'
					btn.style.fontStyle = italicOn ? 'italic' : 'normal'

					btn.addEventListener('mouseover', () => {
						btn.style.backgroundColor = hoverBgColor
						btn.style.borderColor = hoverBgColor
					})
					btn.addEventListener('mouseout', () => {
						btn.style.backgroundColor = baseColor
						btn.style.borderColor = borderColor
					})

					return btn
				}

				// 1) Создаём основные кнопки
				const mainButton_mute = makeButton('Mute')
				const mainButton_ajail = makeButton('Ajail')
				const mainButton_ban = makeButton('Ban')

				rootContainer.appendChild(mainButton_mute)
				rootContainer.appendChild(mainButton_ajail)
				rootContainer.appendChild(mainButton_ban)

				// 2) Функция создания дропдауна
				function createStyledContainer(id, parentButton) {
					const container = document.createElement('div')
					container.id = id
					container.style.position = 'absolute'
					container.style.backgroundColor = dropdownBgColor
					container.style.border = `2px solid ${dropdownBgColor}`
					container.style.borderRadius = '10px'
					container.style.padding = '10px'
					container.style.display = 'none'
					container.style.flexDirection = 'column'
					container.style.boxShadow = '0 4px 10px rgba(0,0,0,0.1)'
					container.style.zIndex = '1000'

					const rect = parentButton.getBoundingClientRect()
					container.style.width = `${rect.width}px`
					container.style.top = `${rect.bottom + window.scrollY}px`
					container.style.left = `${rect.left + window.scrollX}px`

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
				// переменные для отслеживания открытого контейнера
				let current = { button: null, container: null }

				// вспомогательная функция для позиционирования
				function positionBelow(button, dropdown) {
					const rect = button.getBoundingClientRect()
					dropdown.style.top = rect.bottom + window.scrollY + 3 + 'px'
					dropdown.style.left = rect.left + window.scrollX + 'px'
				}

				// функция закрытия контейнера
				function closeCurrent() {
					if (current.container) {
						current.container.style.display = 'none'
						current.button.style.backgroundColor = baseColor // исправлено
						current.button.style.borderColor = borderColor // исправлено
						current = { button: null, container: null }
					}
				}				

				// обработчик кликов вне кнопок и контейнеров
				document.addEventListener('click', e => {
					const isInside = [
						mainButton_mute,
						mainButton_ajail,
						mainButton_ban,
						buttonContainer_mute,
						buttonContainer_ajail,
						buttonContainer_ban,
					].some(el => el.contains(e.target))
					if (!isInside) closeCurrent()
				})

				// 3) навешиваем event listeners
				;[
					{
						button: mainButton_mute,
						container: buttonContainer_mute,
					},
					{
						button: mainButton_ajail,
						container: buttonContainer_ajail,
					},
					{
						button: mainButton_ban,
						container: buttonContainer_ban,
					},
				].forEach(({ button, container }) => {
					// hover
					button.addEventListener('mouseover', () => {
						button.style.backgroundColor = hoverBgColor // исправлено
						button.style.borderColor = hoverBgColor // исправлено
					})
					button.addEventListener('mouseout', () => {
						if (container.style.display === 'flex') {
							button.style.backgroundColor = dropdownBgColor
							button.style.borderColor = dropdownBgColor
						} else {
							button.style.backgroundColor = baseColor // исправлено
							button.style.borderColor = borderColor // исправлено
						}
					})					

					// click
					button.addEventListener('click', e => {
						e.stopPropagation()
						positionBelow(button, container)
						// если открыт другой, закрываем его
						if (current.container && current.container !== container) {
							closeCurrent()
						}
						if (container.style.display === 'none') {
							container.style.display = 'flex'
							button.style.backgroundColor = dropdownBgColor
							button.style.borderColor = dropdownBgColor
							current = { button, container }
						} else {
							closeCurrent()
						}
					})
				})

				// Добавляем кнопки в контейнер('------------------------------------MUTE-------------------------------------------')

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
						'NRP music',
						() => {
							const playerCodes = getPlayerCodes()
							if (playerCodes) {
								let complaintTypeText =
									complaintTypes[localStorage.getItem('complaintType')] ||
									complaintTypes.nonFactional
								let text = `/offmutevoice ${playerCodes} 30m NRP music [${complaintTypeText} | ${getComplaintId()}]`
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
								[
									'selectedFont',
									'selectedFontSize',
									'primaryColor',
									'textAlign',
								],
								({
									selectedFont,
									selectedFontSize,
									primaryColor,
									textAlign,
								}) => {
									const editableDiv = document.querySelector(
										'.fr-element.fr-view[contenteditable="true"]'
									)
									if (!editableDiv) {
										alert('Не найдено поле для редактирования.')
										return
									}

									// Fallbacks
									const fontFamily = selectedFont || 'Arial'
									const fontSizeNumber = parseInt(selectedFontSize, 10) || 15
									const color = primaryColor || '#ffffff'
									const align = textAlign || 'left'

									// Get raw text and normalize whitespace
									let rawText = editableDiv.innerText || ''
									rawText = rawText
										.replace(/\u00A0/g, ' ')
										.replace(/\t+/g, ' ')
										.replace(/ +/g, ' ')
										.replace(/ *\n */g, '\n')
										.trim()

									const lines = rawText
										.split(/\r?\n/)
										.filter(line => line.length > 0)
									if (lines.length === 0) {
										alert('Нет текста для форматирования.')
										return
									}

									// Build the new HTML
									const formattedHTML = lines
										.map(
											line => `
					<p style="text-align: ${align}; margin: 0;">
					  <strong><em>
						<span style="
						  color: ${color};
						  font-size: ${fontSizeNumber}px;
						  font-family: '${fontFamily}';
						  font-weight: bold;
						">
						  ${line}
						</span>
					  </em></strong>
					</p>`
										)
										.join('\n')

									// Replace the contents
									editableDiv.innerHTML = formattedHTML + '<p><br></p>'
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
			}
		)
		}

	const createDefaultButtonsR = container => {
		const defaultLinks = [
			{ label: 'Жалобы на криминальные структуры', url: '/Жалобы-на-игроков-криминальных-структур.27/' },
			{ label: 'Жалобы на государсвенных служащих', url: '/forums/Жалобы-на-государственных-служащих.26/' },
			{ label: 'Жалобы на нефракционных игроков', url: '/forums/Жалобы-на-нефракционных-игроков.25/' },
			{ label: 'Жалобы на лидеров', url: '/forums/Жалобы-на-лидеров.28/' },
			{ label: 'Жалобы на администрацию', url: '/forums/Жалобы-на-администрацию.23/' },
			{ label: 'Discord-разбаны', url: '/forums/Разбан-в-дискорде.69/' },
		]

		container.innerHTML = ''

		chrome.storage.sync.get(
			['buttonBgColor', 'buttonBold', 'buttonItalic', 'buttonTextColor'],
			data => {
				const baseColor = data.buttonBgColor || '#FF5722'
				const boldOn = !!data.buttonBold
				const italicOn = !!data.buttonItalic
				const buttonTextColor = data.buttonTextColor || 'white'

				// Функция затемнения HEX-цвета
				function darkenColor(hex, percent) {
					hex = hex.replace(/^#/, '')
					if (hex.length === 3) {
						hex = hex.split('').map(ch => ch + ch).join('')
					}
					const num = parseInt(hex, 16)
					const r = (num >> 16) & 0xff
					const g = (num >> 8) & 0xff
					const b = num & 0xff
					const newR = Math.max(0, Math.min(255, Math.floor(r * (1 - percent / 100))))
					const newG = Math.max(0, Math.min(255, Math.floor(g * (1 - percent / 100))))
					const newB = Math.max(0, Math.min(255, Math.floor(b * (1 - percent / 100))))
					return (
						'#' +
						((1 << 24) | (newR << 16) | (newG << 8) | newB)
							.toString(16)
							.slice(1)
					)
				}

				const borderColor = darkenColor(baseColor, 10)
				const hoverBgColor = darkenColor(baseColor, 20)

				// Создание и применение кнопок
				defaultLinks.forEach(link => {
					const btn = document.createElement('button')
					btn.innerText = link.label
					btn.style.padding = '10px 15px'
					btn.style.backgroundColor = baseColor
					btn.style.color = buttonTextColor
					btn.style.border = `2px solid ${borderColor}`
					btn.style.borderRadius = '10px'
					btn.style.cursor = 'pointer'
					btn.style.fontSize = '16px'
					btn.style.marginBottom = '10px'
					btn.style.width = '100%'
					btn.style.fontWeight = boldOn ? 'bold' : 'normal'
					btn.style.fontStyle = italicOn ? 'italic' : 'normal'
					btn.style.transition = 'all 0.2s ease'

					btn.addEventListener('mouseover', () => {
						btn.style.backgroundColor = hoverBgColor
						btn.style.borderColor = hoverBgColor
					})
					btn.addEventListener('mouseout', () => {
						btn.style.backgroundColor = baseColor
						btn.style.borderColor = borderColor
					})

					btn.addEventListener('click', () => {
						location.href = link.url
					})

					container.appendChild(btn)
				})
			}
		)
	}

	const createDsButtonsR = (container, isRightContainer = false) => {
		container.appendChild(
			createButton(
				'Форматировать текст',
				() => {
					chrome.storage.sync.get(
						[
							'selectedFont',
							'selectedFontSize',
							'primaryColor',
							'textAlign',
						],
						({
							selectedFont,
							selectedFontSize,
							primaryColor,
							textAlign,
						}) => {
							const editableDiv = document.querySelector(
								'.fr-element.fr-view[contenteditable="true"]'
							)
							if (!editableDiv) {
								alert('Не найдено поле для редактирования.')
								return
							}

							// Fallbacks
							const fontFamily = selectedFont || 'Arial'
							const fontSizeNumber = parseInt(selectedFontSize, 10) || 15
							const color = primaryColor || '#ffffff'
							const align = textAlign || 'left'

							// Get raw text and normalize whitespace
							let rawText = editableDiv.innerText || ''
							rawText = rawText
								.replace(/\u00A0/g, ' ')
								.replace(/\t+/g, ' ')
								.replace(/ +/g, ' ')
								.replace(/ *\n */g, '\n')
								.trim()

							const lines = rawText
								.split(/\r?\n/)
								.filter(line => line.length > 0)
							if (lines.length === 0) {
								alert('Нет текста для форматирования.')
								return
							}

							// Build the new HTML
							const formattedHTML = lines
								.map(
									line => `
			<p style="text-align: ${align}; margin: 0;">
			  <strong><em>
				<span style="
				  color: ${color};
				  font-size: ${fontSizeNumber}px;
				  font-family: '${fontFamily}';
				  font-weight: bold;
				">
				  ${line}
				</span>
			  </em></strong>
			</p>`
								)
								.join('\n')

							// Replace the contents
							editableDiv.innerHTML = formattedHTML + '<p><br></p>'
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
		// Получаем настройки вместе с buttonBgColor
		chrome.storage.sync.get(
			['buttonBgColor', 'buttonTextColor'],
			({ buttonBgColor, buttonTextColor }) => {
				const btnColor = buttonBgColor || '#FF5722' // fallback
				const btnTextColor = buttonTextColor || '#FFFFFF' // fallback

				// Подключаем стили для placeholder один раз
				if (!document.getElementById('dialog-placeholder-style')) {
					const style = document.createElement('style')
					style.id = 'dialog-placeholder-style'
					style.textContent = `
				#url::placeholder { color: ${btnTextColor}; opacity: 1; }
				#url::-webkit-input-placeholder { color: ${btnTextColor}; }
				#url:-ms-input-placeholder         { color: ${btnTextColor}; }
				#url::-ms-input-placeholder        { color: ${btnTextColor}; }
			  `
					document.head.appendChild(style)
				}

				// Создаём диалог
				const dialog = document.createElement('div')
				dialog.innerHTML = `
			<div class="dialog" style="position: fixed; top: 78%; left: 8.4%; transform: translate(-50%, -50%); background: rgb(34, 34, 34); padding: 20px; border-radius: 8px; width: 300px; text-align: center; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);">
			<button id="closeDialog" style="position: absolute; top: 10px; right: 10px; background: none; border: none; font-size: 18px; color: ${btnColor}; cursor: pointer;">
				&times;
			</button>
			<label for="url" style="display: block; margin-bottom: 10px; font-size: 16px; color: ${btnTextColor};">
				Введите ссылку:
			</label>
			<input type="text" id="url" placeholder="https://forum.gtadom.com/" style="width: 100%; padding: 8px; margin-bottom: 20px; border: 1px solid #ccc; border-radius: 4px; background-color: rgb(61, 61, 61); color: #fff;"/>
			<button id="insertLink" style="background-color: ${btnColor}; color: ${btnTextColor}; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer;">
				Создать ссылку
			</button>
			</div>
			`

				document.body.appendChild(dialog)

				document.getElementById('closeDialog').addEventListener('click', () => {
					document.body.removeChild(dialog)
				})

				document.getElementById('insertLink').addEventListener('click', () => {
					const url = document.getElementById('url').value
					if (url) {
						const linkHtml = `<a href="${url}" target="_blank">Жалоба по которой были наказаны.</a>`
						insertHtmlIntoContentEditable(linkHtml)
					}
					document.body.removeChild(dialog)
				})
			}
		)
	}	  

	const createAdminButtonsR = (container, isRightContainer = false) => {
		container.appendChild(
			createButton(
				'Форматировать текст',
				() => {
					chrome.storage.sync.get(
						[
							'selectedFont',
							'selectedFontSize',
							'primaryColor',
							'textAlign',
						],
						({
							selectedFont,
							selectedFontSize,
							primaryColor,
							textAlign,
						}) => {
							const editableDiv = document.querySelector(
								'.fr-element.fr-view[contenteditable="true"]'
							)
							if (!editableDiv) {
								alert('Не найдено поле для редактирования.')
								return
							}

							// Fallbacks
							const fontFamily = selectedFont || 'Arial'
							const fontSizeNumber = parseInt(selectedFontSize, 10) || 15
							const color = primaryColor || '#ffffff'
							const align = textAlign || 'left'

							// Get raw text and normalize whitespace
							let rawText = editableDiv.innerText || ''
							rawText = rawText
								.replace(/\u00A0/g, ' ')
								.replace(/\t+/g, ' ')
								.replace(/ +/g, ' ')
								.replace(/ *\n */g, '\n')
								.trim()

							const lines = rawText
								.split(/\r?\n/)
								.filter(line => line.length > 0)
							if (lines.length === 0) {
								alert('Нет текста для форматирования.')
								return
							}

							// Build the new HTML
							const formattedHTML = lines
								.map(
									line => `
			<p style="text-align: ${align}; margin: 0;">
			  <strong><em>
				<span style="
				  color: ${color};
				  font-size: ${fontSizeNumber}px;
				  font-family: '${fontFamily}';
				  font-weight: bold;
				">
				  ${line}
				</span>
			  </em></strong>
			</p>`
								)
								.join('\n')

							// Replace the contents
							editableDiv.innerHTML = formattedHTML + '<p><br></p>'
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
				const pC = data.primaryColor || '#ffffff'
				const sC = data.statusColor || '#ff2416'
				const eC = data.editColor || '#f3ec14'
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
		const complaintType = localStorage.getItem('complaintType') || 'nonFactional'
		const leftContainer = document.querySelector('.left-buttons')
		const rightContainer = document.querySelector('.right-buttons')

		chrome.storage.sync.get(['showButtonsOnPage'], data => {
			const show = typeof data.showButtonsOnPage === 'boolean' ? data.showButtonsOnPage : true
			if (!show) {
				leftContainer.innerHTML = ''
				rightContainer.innerHTML = ''
				return
			}

			leftContainer.innerHTML = ''
			rightContainer.innerHTML = ''

			chrome.storage.sync.get([`buttonsConfig_${complaintType}`], data2 => {
				let configs = data2[`buttonsConfig_${complaintType}`]
				if (complaintType !== 'default') {
					if (!Array.isArray(configs) || configs.length === 0) {
						configs = defaultConfigs[complaintType] || []
					}
				}

				switch (complaintType) {
					case 'criminal':
					case 'state':
					case 'lider':
					case 'nonFactional':
						createAllButtonsR(rightContainer)
						break
					case 'admin':
						createAdminButtonsR(rightContainer)
						break
					case 'discord':
						createDsButtonsR(rightContainer)
						break
					case 'default':
						createDefaultButtonsR(rightContainer)
						break
					default:
						// неизвестный тип — очищаем всё
						leftContainer.innerHTML = ''
						rightContainer.innerHTML = ''
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

				// Эмуляция F5
				window.dispatchEvent(
					new KeyboardEvent('keydown', { keyCode: 116, which: 116 })
				)
			})
		}
	}

	const complaintTypes = {
		criminal: 'Жалобы на игроков криминальных структур',
		state: 'Жалобы на государственных служащих',
		lider: 'Жалобы на лидеров',
		nonFactional: 'Жалобы на нефракционных игроков',
		admin: 'Жалобы на администрацию',
		discord: 'Разбан в дискорде'
	}

	let currentComplaintIndex = 0

	const switchComplaint = () => {
		const keys = Object.keys(complaintTypes)
		let found = false

		for (let i = 0; i < keys.length; i++) {
			const typeKey = keys[(currentComplaintIndex + i) % keys.length]
			const targetElement = Array.from(document.querySelectorAll('span[itemprop="name"]'))
				.find(el => el.textContent.includes(complaintTypes[typeKey]))

			if (targetElement) {
				console.log(`Выбран режим жалоб: ${complaintTypes[typeKey]}`)
				localStorage.setItem('complaintType', typeKey)
				toggleButtons(typeKey)
				currentComplaintIndex = (currentComplaintIndex + i + 1) % keys.length
				found = true
				break
			}
		}

		if (!found) {
			// Ни один тип не найден — устанавливаем "default"
			console.warn('❌ Ни один тип жалоб не найден. Активирован режим по умолчанию.')
			localStorage.setItem('complaintType', 'default')
			toggleButtons('default')
		}
	}

	const executeSwitchComplaint = times => {
		let count = 0
		const interval = setInterval(() => {
			if (count < times) {
				switchComplaint()
				count++
			} else {
				clearInterval(interval)
			}
		}, 50)
	}

	executeSwitchComplaint(5)

	createButtonContainers()
	updatePageOnComplaintTypeChange()
	updateButtons()

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


;(() => {
	// === Утилиты парсинга ===
	function cssColorToHsla(cssColor) {
		const ctx = document.createElement('canvas').getContext('2d')
		ctx.fillStyle = cssColor
		const norm = ctx.fillStyle
		const m = norm.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
		if (!m) return null
		let [, r, g, b, a = 1] = m.map((v, i) => (i > 0 ? +v : v))
		r /= 255
		g /= 255
		b /= 255
		const max = Math.max(r, g, b),
			min = Math.min(r, g, b)
		let h = 0,
			s = 0,
			l = (max + min) / 2
		if (max !== min) {
			const d = max - min
			s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
			switch (max) {
				case r:
					h = (g - b) / d + (g < b ? 6 : 0)
					break
				case g:
					h = (b - r) / d + 2
					break
				case b:
					h = (r - g) / d + 4
					break
			}
			h *= 60
		}
		return { h, s: s * 100, l: l * 100, a }
	}

	// === Детекторы цвета ===
	function isOrange(color) {
		const hs = cssColorToHsla(color)
		return (
			hs && hs.h >= 15 && hs.h <= 45 && hs.s >= 30 && hs.l >= 20 && hs.l <= 80
		)
	}

	function isGray(color) {
		const hs = cssColorToHsla(color)
		return hs && hs.s <= 15 && hs.l >= 5 && hs.l <= 80
	}

	// === Замена цветовых вхождений в CSS-строке ===
	function replaceInCssValue(val, newOrange, newDark) {
		return val.replace(
			/(#(?:[0-9A-Fa-f]{3,6})|rgba?\([^)]+\)|hsla?\([^)]+\))/g,
			m => (isOrange(m) ? newOrange : isGray(m) ? newDark : m)
		)
	}

	// === Получение цветов из storage (или фолбэки) ===
	function getStoredColors(cb) {
		if (window.chrome?.storage?.sync) {
			chrome.storage.sync.get(
				['buttonBgColor', 'darkColor'],
				({ buttonBgColor, darkColor }) => {
					cb(buttonBgColor || '#FF5722', darkColor || '#111111')
				}
			)
		} else {
			console.warn('chrome.storage недоступен — используем дефолты')
			cb('#FF5722', '#111111')
		}
	}

	// === Замена в <style> и <link> стилях страницы ===
	function replaceInStylesheets(oColor, dColor) {
		for (const sheet of document.styleSheets) {
			let rules
			try {
				rules = sheet.cssRules
			} catch {
				continue
			}
			for (const rule of Array.from(rules)) {
				if (!rule.style) continue
				for (const prop of rule.style) {
					const val = rule.style.getPropertyValue(prop)
					if (!val || val === 'none') continue
					const out = replaceInCssValue(val, oColor, dColor)
					if (out !== val) {
						const prio = rule.style.getPropertyPriority(prop)
						rule.style.setProperty(prop, out, prio)
					}
				}
			}
		}
	}

	// === Замена inline-стиля в атрибутах style="…" ===
	function replaceInInlineStyles(oColor, dColor) {
		document.querySelectorAll('[style]').forEach(el => {
			const raw = el.getAttribute('style')
			const out = replaceInCssValue(raw, oColor, dColor)
			if (out !== raw) {
				el.setAttribute('style', out)
			}
		})
	}

	// === Замена через getComputedStyle + инлайн-стиль ===
	function replaceComputed(oColor, dColor) {
		const props = [
			'color',
			'background',
			'background-color',
			'background-image',
			'border',
			'border-color',
			'box-shadow',
			'text-shadow',
			'outline',
		]
		document.querySelectorAll('*').forEach(el => {
			const cs = getComputedStyle(el)
			props.forEach(prop => {
				const val = cs.getPropertyValue(prop)
				if (val && val !== 'none') {
					const out = replaceInCssValue(val, oColor, dColor)
					if (out !== val) {
						el.style.setProperty(prop, out, 'important')
					}
				}
			})
		})
	}

	// === Инжект для ::selection ===
	function injectSelection(oColor) {
		const id = 'replace-orange-selection'
		if (document.getElementById(id)) return
		const st = document.createElement('style')
		st.id = id
		st.textContent = `
		*::selection, *::-moz-selection {
		  background: ${oColor} !important;
		  color: #fff   !important;
		}
	  `
		document.head.appendChild(st)
	}

	// === Главная функция замены ===
	function doReplace() {
		getStoredColors((orange, dark) => {
			injectSelection(orange)
			replaceInStylesheets(orange, dark)
			replaceInInlineStyles(orange, dark)
			replaceComputed(orange, dark)

			// Принудительный фон для body
			document.body.style.setProperty('background-color', dark, 'important')

			// Фон чуть светлее черного для классов block-*, node-*, message-*
			// а также menu-row и p-navSticky
			const blockColor = '#222222'
			if (!document.getElementById('replace-block-style')) {
				const st = document.createElement('style')
				st.id = 'replace-block-style'
				st.textContent = `
			[class^="block-body"], [class*=" block-body"],
			[class^="node-"],  [class*=" node-"],
			[class^="p-nav"],  [class*=" p-nav"],
			[class^="message-"], [class*=" message-"],
			.message-cell.message-cell--user,
			.menu-row.menu-row--separated.menu-row--clickable,
			.p-navSticky.p-navSticky--all.uix_stickyBar {
			  background-color: ${blockColor} !important;
			}
			/* userBanner-before получает buttonBgColor */
			.userBanner-before {
			  background-color: ${orange} !important;
			}
		  `
				document.head.appendChild(st)
			}

			console.info(
				'[replaceOrange] оранжевый→',
				orange,
				'серый→',
				dark,
				'block/node/message/menu→',
				blockColor,
				'userBanner-before→',
				orange
			)
		})
	}

	// === Автозапуск на DOMContentLoaded ===
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', doReplace)
	} else {
		doReplace()
	}
})()
  

document.addEventListener('DOMContentLoaded', applyexpandableSignatures);
