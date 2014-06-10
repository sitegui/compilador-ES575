/*globals get, Interface*/
"use strict"

// Controla a interface de edição
var InterfaceEdicao = {}

// Define os ouvintes para os botões de edição
InterfaceEdicao.init = function () {
	get("edicao").onblur = function () {
		var programa = Interface.abaFoco.programa
		if (programa.programa != this.value) {
			programa.programa = this.value
			programa.modificado = true
		}
	}
	
	get("edicao").onkeydown = function (evento) {
		var el = get("edicao")
		var comeco = el.selectionStart, fim = el.selectionEnd
		if (evento.keyCode == 9 && !evento.ctrlKey && !evento.shiftKey) {
			evento.preventDefault()
			el.value = el.value.substr(0, comeco)+"\t"+el.value.substr(fim)
			el.selectionStart = el.selectionEnd = comeco+1
		}
	}
}

// Mostra a página no campo de edição
InterfaceEdicao.atualizar = function () {
	var edicao = get("edicao")
	if (Interface.abaFoco) {
		edicao.classList.remove("edicao-inativo")
		edicao.value = Interface.abaFoco.programa.programa
		edicao.scrollTop = 0
	} else {
		edicao.classList.add("edicao-inativo")
	}
}

// Foca o campo de edição
InterfaceEdicao.focar = function () {
	get("edicao").focus()
}
