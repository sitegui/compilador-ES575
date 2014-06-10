/*globals Compilador, JanelaDicas*/
"use strict"

// Representa um arquivo salvo no navegador
function Arquivo() {
	this.conteudo = ""
	this.nome = ""
	this.modificacao = 0
	this.id = ""
	this.versao = 0
	this.erros = []
}

// Salva o programa no arquivo (sobreescreve se já exisitir)
// Retorna um objeto arquivo
Arquivo.salvarPrograma = function (programa) {
	var arquivo, erros = []
	
	programa.modificacao = Date.now()
	programa.modificado = false
	
	arquivo = new Arquivo
	arquivo.conteudo = Compilador.compilar(programa, erros)
	arquivo.nome = programa.nome
	arquivo.id = programa.id
	arquivo.erros = erros
	arquivo.modificacao = programa.modificacao
	arquivo.versao = 1
	Arquivo.arquivos[programa.id] = arquivo
	
	return arquivo
}

// Guarda todos os arquivos recentes, indexados pelo id
Arquivo.arquivos = {}

// Carrega a lista de arquivos
Arquivo.carregarArquivos = function () {
	var str = localStorage.getItem("compilador-ES575-arquivos"), obj, id, novo, temSalvo = false
	
	Arquivo.arquivos = {}
	if (str) {
		obj = JSON.parse(str)
		for (id in obj) {
			novo = new Arquivo
			novo.conteudo = obj[id].conteudo
			novo.nome = obj[id].nome
			novo.modificacao = obj[id].modificacao
			novo.versao = obj[id].versao
			novo.id = obj[id].id
			novo.erros = obj[id].erros
			Arquivo.arquivos[id] = novo
			temSalvo = true
		}
	}
}

// Define os ouvintes
Arquivo.carregarArquivos()

// Salva os arquivos no navegador logo antes de sair
addEventListener("unload", function () {
	localStorage.setItem("compilador-ES575-arquivos", JSON.stringify(Arquivo.arquivos))
})
