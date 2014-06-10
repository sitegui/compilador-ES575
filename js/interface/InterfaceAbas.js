/*globals get, Editor, Interface, InterfaceMenus*/
"use strict"

// Implementa a interface das abas
var InterfaceAbas = {}

// Guarda as abas. Cada elemento é objeto instancia de Aba
InterfaceAbas.abas = []

// Define os callbacks dos botões
InterfaceAbas.init = function () {
	get("abaMais").onclick = function () {
		Editor.criarNovoPrograma()
	}
}

// Atualiza o layout das abas
InterfaceAbas.atualizarLayout = function () {
	var largura, i, aba
	largura = Math.min((get("abas").clientWidth-30)/InterfaceAbas.abas.length, 150)
	for (i=0; i<InterfaceAbas.abas.length; i++) {
		aba = InterfaceAbas.abas[i]
		aba.div.style.width = largura+"px"
		aba.div.style.left = (largura*i)+"px"
		if (aba == Interface.abaFoco)
			aba.div.classList.add("aba-foco")
		else
			aba.div.classList.remove("aba-foco")
		aba.div.childNodes.item(0).textContent = (aba.programa.modificado ? "*" : "")+aba.programa.nome
		aba.div.childNodes.item(1).style.display = ""
	}
	get("abaMais").style.left = (largura*i)+"px"
	
	// Evita de fechar a última aba
	if (InterfaceAbas.abas.length == 1)
		InterfaceAbas.abas[0].div.childNodes.item(1).style.display = "none"
}

// Representa cada aba
function Aba(programa) {
	var nome, fechar, div, that
	
	// Cria os elementos
	div = document.createElement("div")
	div.className = "aba"
	div.style.opacity = "0"
	nome = document.createElement("div")
	nome.className = "aba-nome"
	nome.textContent = programa.nome
	fechar = document.createElement("div")
	fechar.className = "aba-fechar minibotao-vermelho"
	fechar.innerHTML = "&times;"
	fechar.title = "Fechar arquivo"
	
	// Define os ouvintes
	that = this
	fechar.onclick = function (evento) {
		that.fechar()
		evento.stopPropagation()
	}
	div.onclick = function () {
		Interface.abaFoco = that
	}
	div.ondblclick = function () {
		var opcoes = {}
		
		if (that.programa.novo) {
			// Melhor salvar de uma vez, do que renomear depois salvar
			InterfaceMenus.salvarPrograma(that.programa)
			return
		}
		
		opcoes.titulo = "Renomear "+that.programa.nome
		opcoes.conteudo = "<p>Novo nome: <input size='50' id='js-nome' value=\""+that.programa.nome+"\"></p>"
		opcoes.onconfirmar = function () {
			var nome = get("js-nome").value
			if (nome)
				that.programa.nome = nome
			that.programa.novo = false
			InterfaceAbas.atualizarLayout()
		}
		Interface.abrirJanela("janelaBasica", opcoes)
	}
	
	// Monta os elementos
	div.appendChild(nome)
	div.appendChild(fechar)
	div.style.opacity = "0"
	get("abas").insertBefore(div, get("abaMais"))
	setTimeout(function () {
		div.style.opacity = "1"
	}, 250)
	
	// Define as propriedades do objeto
	this.div = div
	this.programa = programa
}

// Fecha a aba
Aba.prototype.fechar = function () {
	var pos, that = this
	
	if (this.programa.modificado) {
		Interface.abrirJanela("janelaBasica", {titulo: "Fechar sem salvar", onconfirmar: function () {
			that.programa.modificado = false
			that.fechar()
		}, conteudo: "Deseja realmente fechar esse livro e perder todas as modificações não salvas?"})
	} else {
		pos = InterfaceAbas.abas.indexOf(this)
		if (pos != -1)
			InterfaceAbas.abas.splice(pos, 1)
		this.div.style.opacity = "0"
		setTimeout(function () {
			get("abas").removeChild(that.div)
		}, 500)
		
		// Muda o foco
		if (Interface.abaFoco == this)
			if (InterfaceAbas.abas.length)
				if (pos > 0)
					Interface.abaFoco = InterfaceAbas.abas[pos-1]
				else
					Interface.abaFoco = InterfaceAbas.abas[pos]
			else
				Editor.criarNovoPrograma()
		InterfaceAbas.atualizarLayout()
	}
}
