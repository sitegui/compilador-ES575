/*globals InterfaceAbas, Arquivo, Compilador, Aba, Interface, Programa*/
"use strict"

// Represeta o editor com um todo
var Editor = {}

// Indica o número de novos programas criados
Editor.numNovosProgramas = 0

// Evita que a pessoa feche sem salvar algum arquivo
// Também salva a sessão ativa
addEventListener("beforeunload", function (evento) {
	var i, ids = [], prevenir = false
	for (i=0; i<InterfaceAbas.abas.length; i++) {
		if (InterfaceAbas.abas[i].programa.modificado)
			prevenir = true
		ids.push(InterfaceAbas.abas[i].programa.id)
	}
	if (prevenir)
		evento.preventDefault()
	localStorage.setItem("compilador-ES575-sessao", JSON.stringify(ids))
})

// Carrega os programas abertos da última vez
Editor.reabrirSessao = function () {
	var str, ids, i, n, arquivo, programa, aba
	str = localStorage.getItem("compilador-ES575-sessao")
	n = 0
	if (str) {
		ids = JSON.parse(str)
		for (i=0; i<ids.length; i++)
			if (ids[i] in Arquivo.arquivos) {
				arquivo = Arquivo.arquivos[ids[i]]
				programa = Compilador.inflar(arquivo.conteudo)
				programa.id = arquivo.id
				aba = new Aba(programa)
				InterfaceAbas.abas.push(aba)
				n++
			}
	}
	if (!n)
		Editor.criarNovoPrograma()
	else
		Interface.abaFoco = aba
}

// Cria um programa vazio
Editor.criarNovoPrograma = function () {
	var programa, aba
	
	// Cria o programa
	Editor.numNovosProgramas++
	programa = new Programa
	programa.nome = "Sem título "+Editor.numNovosProgramas
	programa.criacao = Date.now()
	programa.modificacao = Date.now()
	programa.novo = true
	
	// Cria elementos básicos
	programa.programa = "# Programa exemplo\nLOOP: in r0\nmov r1, 17\nadd r2, r0, r1\nout r2\njmp LOOP"
	
	// Exibe
	aba = new Aba(programa)
	InterfaceAbas.abas.push(aba)
	Interface.abaFoco = aba
	
	return programa
}
