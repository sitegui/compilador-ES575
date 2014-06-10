/*globals Programa*/
"use strict"

// Reúne métodos para abrir e gerar o formato da placa
var Compilador = {}

// Interpreta o programa a partir de uma string
Compilador.inflar = function (str) {
	var programa = new Programa()
	
	var linhas = str.split(/\r?\n/)
	if (linhas[0] == "-- COMPILADOR-ES575" && linhas[1] == "-- 1") {
		// Carrega informações sobre nosso formato
		programa.nome = linhas[2].substr(3)
		programa.criacao = Number(linhas[3].substr(3))
		programa.modificacao = Number(linhas[4].substr(3))
		programa.programa = linhas[6].substr(3).replace(/\\r/g, "\r").replace(/\\n/g, "\n").replace(/\\\\/g, "\\")
	} else {
		// Decompila
		programa.programa = "# Decompilado automaticamente\n\n"
		var memoria = []
		
		// Lê as linhas
		linhas.forEach(function (linha) {
			var match
			
			// Normaliza
			linha = linha.trim().replace(/\s+/g, " ").toLocaleLowerCase()
			console.log(linha)
			
			if ((match = linha.match(/^([0-9a-f]{3}) ?: ?([0-9a-f]{4})/)))
				memoria[parseInt(match[1], 16)] = match[2]
		})
		programa.nome = "decompilado"
		
		var converterConstante = function (str) {
			while (str[0] == "0" && str.length > 1)
				str = str.substr(1)
			return "0x"+str
		}
		
		// Decompila
		var pular = false
		programa.programa += memoria.map(function (cada, endereco) {
			if (pular) {
				pular = false
				return ""
			}
			if (cada == "0000")
				return "NOP\n"
			else if (cada.substr(0, 3) == "080") {
				pular = true
				return "MVI "+cada[3]+", "+converterConstante(memoria[endereco+1])+"\n"
			} else if (cada.substr(0, 2) == "10")
				return "MOV "+cada[2]+", "+cada[3]+"\n"
			else if (cada.substr(0, 3) == "180")
				return "CLRREG "+cada[3]+"\n"
			else if (cada.substr(0, 2) == "20")
				return "ADD "+cada[2]+", "+cada[3]+"\n"
			else if (cada.substr(0, 2) == "28")
				return "SUB "+cada[2]+", "+cada[3]+"\n"
			else if (cada.substr(0, 3) == "800")
				return "DATAOUT "+cada[3]+"\n"
			else if (cada.substr(0, 3) == "880")
				return "DATAIN "+cada[3]+"\n"
			else if (cada.substr(0, 3) == "300") {
				pular = true
				return "LOAD "+cada[3]+", "+converterConstante(memoria[endereco+1])+"\n"
			} else if (cada.substr(0, 3) == "380") {
				pular = true
				return "STORE "+converterConstante(memoria[endereco+1])+", "+cada[3]+"\n"
			} else if (cada[0] == "4")
				return "GOTO "+converterConstante(cada.substr(1))+"\n"
			else
				return "# Valor inválido: "+cada+"\n"
		}).join("")
	}
	
	return programa
}

// Compila um programa para um string
// programa é uma instância de Programa
// erros é uma array que deve ser passada vazia e será populada com erros
Compilador.compilar = function (programa, erros) {
	erros = erros || []
	
	var estado = {
		memoria: [], // [endereco]: 4-char hex
		pc: 0,
		labels: {}, // [label]: pc
		jumps: {}, // [pc]: (label: string, linha: int)
		salvar: function (dado) {
			if (dado.length != 4)
				throw new Error("Erro interno: tamanho do dado inválido")
			if (estado.pc >= 512)
				throw new Error("Ultrapassou tamanho da memória")
			estado.memoria[estado.pc++] = dado
		}
	}
	
	// Processa cada linha
	programa.programa.split(/\r?\n/).forEach(function (linha, i) {
		// Remove comentários
		linha = linha.replace(/(#|;|%|\/\/).*$/, "")
		
		// Normaliza espaços e caixa
		linha = linha.trim().replace(/\s+/, " ").toLowerCase()
		
		if (!linha)
			return
		
		try {
			Compilador.processar(linha, estado, i)
		} catch (e) {
			erros.push("[linha "+(i+1)+"] "+e.message)
		}
	})
	
	// Troca as labels nos jumps
	var pc, label, linha
	for (pc in estado.jumps) {
		label = estado.jumps[pc].label
		linha = estado.jumps[pc].linha
		if (estado.memoria[pc] == "????")
			if (label in estado.labels)
				estado.memoria[pc] = "4"+Compilador.num2hex(estado.labels[label], 3)
			else
				erros.push("[linha "+(linha+1)+"] Label não encontrada: "+label)
	}
	
	// Codifica o programa inicial
	var compilado = "-- COMPILADOR-ES575\r\n"+
		"-- 1\r\n"+ // versão
		"-- "+programa.nome+"\r\n"+
		"-- "+programa.criacao+"\r\n"+
		"-- "+programa.modificacao+"\r\n\r\n"+
		"-- "+programa.programa.replace(/\\/g, "\\\\").replace(/\r/g, "\\r").replace(/\n/g, "\\n")+"\r\n\r\n"
	
	// Constrói o resultado
	compilado += "WIDTH=16;\r\n"+
		"DEPTH=512;\r\n\r\n"+
		"ADDRESS_RADIX=HEX;\r\n"+
		"DATA_RADIX=HEX;\r\n\r\n"+
		"CONTENT BEGIN\r\n"+
		estado.memoria.map(function (conteudo, endereco) {
			return "\t"+Compilador.num2hex(endereco, 3)+"  :   "+conteudo+";\r\n"
		}).join("")+
		"	["+Compilador.num2hex(estado.memoria.length, 3)+"..1FF]  :   0000;\r\n"+
		"END;\r\n"
	
	return compilado
}

// Converte a string compilada para um objeto URL (blob://)
Compilador.string2file = function (string) {
	return URL.createObjectURL(new Blob([string], {type: ""}))
}

// Converte um File em uma string compilada
// Função assíncrona, executa onsucesso quando acabar (a string compilada vai como argumento)
Compilador.file2string = function (file, onsucesso) {
	var fr, text
	
	// Valida o tipo do arquivo
	if (file.name.substr(-4).toLowerCase() == ".mif")
		text = false
	else if (file.name.substr(-4).toLowerCase() == ".txt")
		text = true
	else {
		alert("Arquivo selecionado é inválido")
		return
	}
	
	fr = new FileReader
	if (text) {
		fr.onload = function () {
			// Coloca todo o texto no cabeçalho
			var compilado = "-- COMPILADOR-ES575\r\n"+
				"-- 1\r\n"+ // versão
				"-- "+file.name.substr(0, file.name.length-4)+"\r\n"+
				"-- "+Date.now()+"\r\n"+
				"-- "+Date.now()+"\r\n\r\n"+
				"-- "+fr.result.replace(/\\/g, "\\\\").replace(/\r/g, "\\r").replace(/\n/g, "\\n")+"\r\n\r\n"
			onsucesso(compilado)
		}
		fr.readAsArrayBuffer(file)
	} else {
		fr.onload = function () {
			onsucesso(fr.result)
		}
	}
	fr.readAsText(file)
}

/*
Funções para uso interno
*/

// Processa uma instrução
// linha é uma string, estado é um objeto, idLinha é um inteiro
// Lança uma exceção em caso de erro
Compilador.processar = function (linha, estado, idLinha) {
	var match
	
	// Label
	if ((match = linha.match(/^([a-z_][a-z0-9_]*) ?: ?/))) {
		if (match[1] in estado.labels)
			throw new Error("Label já está em uso: "+match[1])
		estado.labels[match[1]] = estado.pc
		linha = linha.substr(match[0].length)
		if (!linha)
			return
	}
	
	if (!Compilador.processarBasico(linha, estado) &&
		!Compilador.processarPadrao(linha, estado) &&
	  	!Compilador.processarComplexo(linha, estado, idLinha))
		throw new Error("Formato inválido de instrução: "+linha)
}

// Processa instruções básicas
// Retorna true em caso de sucesso, false caso nenhuma regra bateu
// Lança exceção em caso de erro
Compilador.processarBasico = function (linha, estado) {
	var match
	if (linha.match(/^nop$/))
		// NOP
		estado.salvar("0000")
	else if ((match = linha.match(/^mvi ([0-7]) ?, ?(.+)$/))) {
		// MVI x, I
		estado.salvar("080"+match[1])
		estado.salvar(Compilador.converterConstante(match[2]))
	} else if ((match = linha.match(/^mov ([0-7]) ?, ?([0-7])$/)))
		// MOV x, y
		estado.salvar("10"+match[1]+match[2])
	else if ((match = linha.match(/^clrreg ([0-7])$/)))
		// CLRREG x
		estado.salvar("180"+match[1])
	else if ((match = linha.match(/^add ([0-7]) ?, ?([0-7])$/)))
		// ADD x, y
		estado.salvar("20"+match[1]+match[2])
	else if ((match = linha.match(/^sub ([0-7]) ?, ?([0-7])$/)))
		// SUB x, y
		estado.salvar("28"+match[1]+match[2])
	else if ((match = linha.match(/^load ([0-7]) ?, ?(.+)$/))) {
		// LOAD x, I
		estado.salvar("300"+match[1])
		estado.salvar(Compilador.converterConstante(match[2]))
	} else if ((match = linha.match(/^store (.+) ?, ?([0-7])$/))) {
		// STORE I, x
		estado.salvar("380"+match[2])
		estado.salvar(Compilador.converterConstante(match[1]))
	} else if ((match = linha.match(/^dataout ([0-7])$/)))
		// DATAOUT x
		estado.salvar("800"+match[1])
	else if ((match = linha.match(/^datain ([0-7])$/)))
		// DATAIN x
		estado.salvar("880"+match[1])
	else if ((match = linha.match(/^goto (.+)$/)))
		// GOTO I
		estado.salvar("4"+Compilador.converterEndereco(match[1]))
	else
		return false
	return true
}

// Processa instruções básicas
// Retorna true em caso de sucesso, false caso nenhuma regra bateu
// Lança exceção em caso de erro
Compilador.processarPadrao = function (linha, estado) {
	var match
	if ((match = linha.match(/^mov r([0-7]) ?, ?r([0-7])$/)))
		// MOV rx, ry
		if (match[1] == match[2])
			estado.salvar("0000")
		else
			estado.salvar("10"+match[1]+match[2])
	else if ((match = linha.match(/^mov r([0-7]) ?, ?(.+)$/))) {
		// MOV rx, I
		match[2] = Compilador.converterConstante(match[2])
		if (match[2] == "0000")
			estado.salvar("180"+match[1])
		else {
			estado.salvar("080"+match[1])
			estado.salvar(match[2])
		}
	} else if ((match = linha.match(/^clr r([0-7])$/)))
		// CLR rx
		estado.salvar("180"+match[1])
	else if ((match = linha.match(/^add r([0-7]) ?, ?r([0-7])$/)))
		// ADD rx, ry
		estado.salvar("20"+match[1]+match[2])
	else if ((match = linha.match(/^sub r([0-7]) ?, ?r([0-7])$/)))
		// SUB rx, ry
		estado.salvar("28"+match[1]+match[2])
	else if ((match = linha.match(/^out r([0-7])$/)))
		// OUT rx
		estado.salvar("800"+match[1])
	else if ((match = linha.match(/^in r([0-7])$/)))
		// IN rx
		estado.salvar("880"+match[1])
	else if ((match = linha.match(/^load r([0-7]) ?, ?(.+)$/))) {
		// LOAD rx, I
		estado.salvar("300"+match[1])
		estado.salvar(Compilador.converterConstante(match[2]))
	} else if ((match = linha.match(/^store r([0-7]) ?, ?(.+)$/))) {
		// STORE rx, I
		estado.salvar("380"+match[1])
		estado.salvar(Compilador.converterConstante(match[2]))
	} else
		return false
	return true
}

// Processa instruções básicas
// Retorna true em caso de sucesso, false caso nenhuma regra bateu
// Lança exceção em caso de erro
Compilador.processarComplexo = function (linha, estado, idLinha) {
	var match
	if ((match = linha.match(/^add r([0-7]) ?, ?r([0-7]) ?, ?r([0-7])$/))) {
		// ADD rx, ry, rz
		if (match[1] != match[2])
			estado.salvar("10"+match[1]+match[2])
		estado.salvar("20"+match[1]+match[3])
	} else if ((match = linha.match(/^sub r([0-7]) ?, ?r([0-7]) ?, ?r([0-7])$/))) {
		// SUB rx, ry, rz
		if (match[1] != match[2])
			estado.salvar("10"+match[1]+match[2])
		estado.salvar("28"+match[1]+match[3])
	} else if ((match = linha.match(/^jmp ([a-z_][a-z0-9_]*)$/))) {
		// JMP _label_
		estado.jumps[estado.pc] = {
			label: match[1],
			linha: idLinha
		}
		estado.salvar("????")
	} else
		return false
	return true
}

// Interpreta uma constante numérica
// Sintaxe:
// Decimal como 10, -2: -?\d+
// Binário como 0b0101: 0b[01]+
// Hex como 0xab: 0x[0-9a-f]+
// Retorna o valor como uma string de 4 caracteres hexa
// Lança exceção em caso de erro
Compilador.converterConstante = function (value) {
	if (value.match(/^-?\d+$/))
		value = Number(value)
	else if (value.match(/^0b[01]+$/i))
		value = parseInt(value.substr(2), 2)
	else if (value.match(/^0x[0-9a-f]+$/i))
		value = parseInt(value.substr(2), 16)
	else
		throw new Error("Constante inválida: "+value)
	
	if (value < -32768 || value > 65535)
		throw new Error("Inteiro fora dos limites: "+value)
	
	if (value < 0)
		value += 65536
	
	return Compilador.num2hex(value, 4)
}

// Interpreta uma constante numérica que representa um endereço na ROM
// Mesmo comportamente que Compilador.converterConstante()
Compilador.converterEndereco = function (value) {
	value = Compilador.converterConstante(value)
	if (value[0] != "0")
		throw new Error("Valor inválido para um endereço: "+value)
	return value.substr(1)
}

// Converte um número para sua representação hexadecimal
Compilador.num2hex = function (num, tamanho) {
	var str = num.toString(16).toUpperCase()
	while (str.length < tamanho)
		str = "0"+str
	return str
}

