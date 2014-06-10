/*globals get*/
"use strict"

// Controla a janela de ajuda
var JanelaAjuda = {}

// Define os ouvintes
JanelaAjuda.init = function () {
	get("janelaAjuda-sobre").onclick = JanelaAjuda.mostrarAbaSobre
	get("janelaAjuda-creditos").onclick = JanelaAjuda.mostrarAbaCreditos
}

// Exibe a primeira página
JanelaAjuda.onabrir = function () {
	JanelaAjuda.mostrarAbaSobre()
}

// Mostra a aba "Sobre"
JanelaAjuda.mostrarAbaSobre = function () {
	get("janelaAjuda-sobre").classList.add("janela-lista-selecionado")
	get("janelaAjuda-creditos").classList.remove("janela-lista-selecionado")
	get("janelaAjuda-abaSobre").style.display = ""
	get("janelaAjuda-abaCreditos").style.display = "none"
}

// Mostra a aba "Créditos"
JanelaAjuda.mostrarAbaCreditos = function () {
	get("janelaAjuda-sobre").classList.remove("janela-lista-selecionado")
	get("janelaAjuda-creditos").classList.add("janela-lista-selecionado")
	get("janelaAjuda-abaSobre").style.display = "none"
	get("janelaAjuda-abaCreditos").style.display = ""
}
