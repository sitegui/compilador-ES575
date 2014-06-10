/*globals InterfaceAbas, InterfaceEdicao, get, JanelaAbrir, JanelaBasica, InterfaceMenus, JanelaAjuda, JanelaDownload, Editor*/
"use strict"

// Reúne métodos gerais da interface
var Interface = {}

// Guarda a aba em foco
;(function () {
	var foco = null
	Object.defineProperty(Interface, "abaFoco", {get: function () {
		return foco
	}, set: function (novo) {
		foco = novo
		InterfaceAbas.atualizarLayout()
		InterfaceEdicao.atualizar()
		InterfaceEdicao.focar()
		document.title = "Compilador ES575 - "+foco.programa.nome
	}, enumerable: true})
})()

// Define os ouvintes para os botões
Interface.init = function () {
	var els, i
	els = document.querySelectorAll(".janela-fechar")
	for (i=0; i<els.length; i++) {
		els.item(i).onclick = Interface.fecharJanela
		els.item(i).title = "Fechar janela"
	}
	JanelaAbrir.init()
	JanelaBasica.init()
	InterfaceMenus.init()
	InterfaceAbas.init()
	InterfaceEdicao.init()
	JanelaAjuda.init()
	JanelaDownload.init()
}

// Controla atalhos
addEventListener("keydown", function (evento) {
	var atalho = true, i, fechar
	
	if (!evento.ctrlKey && !evento.shiftKey && evento.keyCode == 27 && Interface.janelaAberta) {
		// Esc = fechar janela
		if ((fechar = Interface.janelaAberta.querySelector(".janela-fechar")))
			fechar.click()
	} else if (document.activeElement.nodeName == "INPUT")
		return
	else if (evento.ctrlKey && !evento.shiftKey && evento.keyCode == 79)
		// Ctrl+O = abrir
		Interface.abrirJanela("janelaAbrir", "recentes")
	else if (evento.ctrlKey && !evento.shiftKey && evento.keyCode == 83)
		// Ctrl+S = salvar
		InterfaceMenus.salvarPrograma(Interface.abaFoco.programa, InterfaceMenus.iniciarDownload)
	else if (evento.ctrlKey && evento.shiftKey && evento.keyCode == 83)
		// Ctrl+Shift+S = salvar todos
		for (i=0; i<InterfaceAbas.abas.length; i++)
			InterfaceMenus.salvarPrograma(InterfaceAbas.abas[i].programa)
	else if (!evento.ctrlKey && !evento.shiftKey && evento.keyCode == 112)
		// F1 = ajuda
		Interface.abrirJanela("janelaAjuda")
	else if (evento.ctrlKey && !evento.shiftKey && evento.keyCode == 78)
		// Ctrl+N = novo
		Editor.criarNovoPrograma()
	else
		atalho = false
	
	if (atalho)
		evento.preventDefault()
})

// Atualiza as interfaces dos paineis
addEventListener("resize", function () {
	var div = get("edicao")
	div.classList[div.scrollHeight>div.clientHeight ? "add" : "remove"]("edicao-comRolagem")
})

// Abre o menu especificado abaixo do elemento
// menu e base são elementos HTML ou um id
// Se base não for enviado, abre perto do mouse
Interface.menuAberto = null
Interface.abrirMenu = function (evento, submenu, base) {
	Interface.fecharMenu()
	submenu = get(submenu)
	
	submenu.style.cssText = ""
	submenu.style.display = ""
	if (base) {
		base = get(base)
		submenu.style.top = (base.getBoundingClientRect().top+base.clientHeight+3)+"px"
		submenu.style.left = base.getBoundingClientRect().left+"px"
		submenu.style.minWidth = base.clientWidth+"px"
	} else {
		if (evento.clientY+submenu.clientHeight > document.body.clientHeight)
			submenu.style.bottom = (document.body.clientHeight-evento.clientY)+"px"
		else
			submenu.style.top = evento.clientY+"px"
		if (evento.clientX+submenu.clientWidth > document.body.clientWidth)
			submenu.style.right = (document.body.clientWidth-evento.clientX)+"px"
		else
			submenu.style.left = evento.clientX+"px"
	}
	Interface.menuAberto = submenu
	
	// Evita que o menu feche nesse clique
	evento.stopPropagation()
}

// Controla menus abertos
Interface.fecharMenu = function () {
	if (Interface.menuAberto) {
		Interface.menuAberto.style.display = "none"
		Interface.menuAberto = null
	}
}
addEventListener("click", Interface.fecharMenu)

// Abre a janela desejada (envia o argumento para o ouvinte de abertura da janela)
Interface.janelaAberta = null
Interface.abrirJanela = function (janela, argumento) {
	Interface.fecharJanela()
	get("fundoJanela").style.display = ""
	janela = get(janela)
	janela.style.display = ""
	Interface.janelaAberta = janela
	
	// Chama o ouvinte da janela
	switch (janela.id) {
		case "janelaAbrir":
			JanelaAbrir.onabrir(argumento)
			break
		case "janelaBasica":
			JanelaBasica.onabrir(argumento)
			break
		case "janelaAjuda":
			JanelaAjuda.onabrir()
			break
		case "janelaDownload":
			JanelaDownload.onabrir(argumento)
			break
	}
}

// Fecha a janela aberta
Interface.fecharJanela = function () {
	if (Interface.janelaAberta) {
		get("fundoJanela").style.display = "none"
		Interface.janelaAberta.style.display = "none"
		document.activeElement.blur()
		Interface.janelaAberta = null
	}
}
