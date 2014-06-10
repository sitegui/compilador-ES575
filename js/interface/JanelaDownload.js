/*globals get, Interface*/
"use strict"

// Controla a janela de controle e instruções de download
var JanelaDownload = {}

// Inicializa a janela de download
JanelaDownload.init = function () {
}

// Abre a janela de download para acompanhar o andamento
// opcoes é um objeto com as propriedades url, nome e erros
JanelaDownload.onabrir = function (opcoes) {
	get("janelaDownload-link").href = opcoes.url
	get("janelaDownload-link").download = opcoes.nome
	get("janelaDownload-cancelar").onclick = get("janelaDownload-fechar").onclick = function () {
		Interface.fecharJanela()
		URL.revokeObjectURL(opcoes.url)
		get("edicao").contentEditable = "true"
	}
	
	var sucesso = !opcoes.erros.length
	get("janelaDownload-sucesso").style.display = sucesso ? "" : "none"
	get("janelaDownload-erro").style.display = !sucesso ? "" : "none"
	
	var errosEl = get("janelaDownload-erros")
	errosEl.innerHTML = ""
	opcoes.erros.forEach(function (erro) {
		var li = document.createElement("li")
		li.textContent = erro
		errosEl.appendChild(li)
	})
}
