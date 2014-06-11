/*globals get, Interface, Editor, InterfaceAbas, _, Compilador, Arquivo, Aba*/
"use strict"

// Implementa a interface dos menus
var InterfaceMenus = {}

// Define os callbacks dos botões
InterfaceMenus.init = function () {
	// Menu abrir
	get("menuAbrir").onclick = function (evento) {
		if (evento.target.id == "menuAbrirMais")
			Interface.abrirMenu(evento, "submenuAbrir", "menuAbrir")
		else
			Interface.abrirJanela("janelaAbrir", "recentes")
	}
	get("submenuAbrir-recentes").onclick = function () {
		Interface.abrirJanela("janelaAbrir", "recentes")
	}
	get("submenuAbrir-upload").onclick = function () {
		Interface.abrirJanela("janelaAbrir", "upload")
	}
	get("submenuAbrir-novo").onclick = function () {
		Editor.criarNovoPrograma()
	}
	
	// Menu salvar
	get("menuSalvar").onclick = get("submenuSalvar-arquivo").onclick = function (evento) {
		var i, programa = Interface.abaFoco.programa
		var abas = InterfaceAbas.abas
		if (evento.target.id == "menuSalvarMais") {
			Interface.abrirMenu(evento, "submenuSalvar", "menuSalvar")
			get("submenuSalvar-salvar").classList[(programa.modificado || programa.novo) ? "remove" : "add"]("submenu-item-desabilitado")
			get("submenuSalvar-salvarTodos").classList.add("submenu-item-desabilitado")
			for (i=0; i<abas.length; i++)
				if (abas[i].programa.modificado || abas[i].programa.novo) {
					get("submenuSalvar-salvarTodos").classList.remove("submenu-item-desabilitado")
					break
				}
			get("submenuSalvar-salvarComo").classList[programa.novo ? "add" : "remove"]("submenu-item-desabilitado")
		} else {
			// Salva e baixa o programa
			InterfaceMenus.salvarPrograma(Interface.abaFoco.programa, InterfaceMenus.iniciarDownload)
		}
	}
	get("submenuSalvar-salvar").onclick = function () {
		InterfaceMenus.salvarPrograma(Interface.abaFoco.programa)
	}
	get("submenuSalvar-salvarTodos").onclick = function () {
		var i
		for (i=0; i<InterfaceAbas.abas.length; i++)
			InterfaceMenus.salvarPrograma(InterfaceAbas.abas[i].programa)
	}
	get("submenuSalvar-salvarComo").onclick = function () {
		var programa = Interface.abaFoco.programa, opcoes = {}
		
		if (programa.novo)
			// Sem efeito
			return
		
		opcoes.titulo = "Salvar "+programa.nome+" como"
		opcoes.conteudo = "<p>Novo nome: <input id='js-nome' value=\""+programa.nome+"\" size='50'></p>"
		opcoes.onconfirmar = function () {
			var nome, programa, abaAntiga, arquivo, novaAba
			
			// Reúne os dadaos
			nome = get("js-nome").value
			programa = Interface.abaFoco.programa
			arquivo = Arquivo.arquivos[programa.id]
			abaAntiga = Interface.abaFoco
			if (!nome)
				return
			
			// Muda os dados do programa e salva como novo
			programa.id = String(Math.random())
			programa.nome = nome
			programa.criacao = Date.now()
			programa.modificacao = Date.now()
			Arquivo.salvarPrograma(programa)
			
			// Cria uma aba pra exibi-lo
			novaAba = new Aba(programa)
			InterfaceAbas.abas.push(novaAba)
			
			// Volta o antigo para onde estava
			abaAntiga.programa = Compilador.inflar(arquivo.conteudo)
			abaAntiga.programa.id = arquivo.id
			
			// Foca na nova aba
			Interface.abaFoco = novaAba
		}
		Interface.abrirJanela("janelaBasica", opcoes)
	}
	
	// Menu ajuda
	get("menuAjuda").onclick = function () {
		Interface.abrirJanela("janelaAjuda")
	}
}

// Salva o arquivo (pergunta pelo nome caso seja novo)
// Função assíncrona. Executa o callback enviando o objeto arquivo associado como argumento
InterfaceMenus.salvarPrograma = function (programa, onsucesso) {
	var arquivo, opcoes, aba
	
	// Força a perda de foco da edição
	get("edicao").onblur()
	
	aba = Interface.abaFoco
	if (programa.novo) {
		// Pergunta pelo nome
		opcoes = {}
		opcoes.titulo = "Salvar "+programa.nome
		opcoes.conteudo = "<p>Nome: <input id='js-nome' size='50'></p>"
		opcoes.onconfirmar = function () {
			var nome
			nome = get("js-nome").value
			if (nome) {
				programa.nome = nome
				programa.modificado = true
				programa.novo = false
				InterfaceMenus.salvarPrograma(programa, onsucesso)
			}
		}
		Interface.abrirJanela("janelaBasica", opcoes)
	} else {
		if (programa.modificado) {
			// Salva
			arquivo = Arquivo.salvarPrograma(programa)
		} else
			// Busca o arquivo
			arquivo = Arquivo.arquivos[programa.id]
		if (onsucesso)
			onsucesso(arquivo)
	}
}

// Abre a janela de download e gere o download de um programa recém salvo
InterfaceMenus.iniciarDownload = function (arquivo) {
	var url, nome
	url = Compilador.string2file(arquivo.conteudo)
	nome = arquivo.nome.replace(/[^a-zA-Z0-9]/g, "")+".mif"
	Interface.abrirJanela("janelaDownload", {
		url: url,
		nome: nome,
		erros: arquivo.erros
	})
}
