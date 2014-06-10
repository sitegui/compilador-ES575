/*globals InterfaceAbas*/
"use strict"

// Representa cada programa aberto
function Programa() {
	var modificado = false
	this.id = String(Math.random())
	this.nome = ""
	this.programa = ""
	this.criacao = 0
	this.modificacao = 0
	this.novo = false // Indice se o programa foi criado do zero
	Object.defineProperty(this, "modificado", {get: function () {
		return modificado
	}, set: function (novo) {
		modificado = Boolean(novo)
		InterfaceAbas.atualizarLayout()
	}, enumerable: true})
}

// Clona o programa todo
Programa.prototype.clonar = function () {
	var novo = new Programa
	
	// Copia propriedades básicas
	novo.nome = this.nome
	novo.criacao = this.criacao
	novo.modificacao = this.modificacao
	novo.novo = this.novo
	novo.programa = this.programa
	
	return novo
}
