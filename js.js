'use strict'

onload = function () {
	document.getElementById('compile').onclick = function () {
		var result = compile(document.getElementById('input').value)
		document.getElementById('output').textContent = result.errors.map(function (error) {
			// Show lines starting at 1
			return '[line '+(error.line+1)+'] '+error.msg
		}).join('\n')
		
		if (!result.errors.length)
			document.getElementById('output').textContent = result.program
	}
}

// Compile the given string
// Return an object (program: string, errors[]: (line: int, message: string))
// program will be empty in case of errors
function compile(string) {
	var state = {
		memory: [], // [address]: 4-char hex
		pc: 0,
		errors: [], // line:int , message: string
		labels: {}, // [label]: pc
		jumps: {}, // [pc]: (label: string, line: int)
		store: function (data) {
			if (data.length != 4)
				throw new Error('Internal error: invalid data length, should be 4')
			if (state.pc >= 512)
				throw new Error('Memory overflow')
			state.memory[state.pc++] = data
		}
	}
	
	// Process each line
	string.split(/\r?\n/).forEach(function (line, i) {
		// Strip comment
		line = line.replace(/(#|;|%|\/\/).*$/, '')
		
		// Normalize spaces and cases
		line = line.trim().replace(/\s+/, ' ').toLowerCase()
		
		if (!line)
			return
		
		try {
			process(line, state, i)
		} catch (e) {
			state.errors.push({
				line: i,
				msg: e.message
			})
		}
	})
	
	// Apply labels to jumps
	var pc, label, line
	for (pc in state.jumps) {
		label = state.jumps[pc].label
		line = state.jumps[pc].line
		if (state.memory[pc] == '????')
			if (label in state.labels)
				state.memory[pc] = '4'+toHex(state.labels[label], 3)
			else
				state.errors.push({
					line: line,
					msg: 'Label not found: '+label
				})
	}
	
	// Construct the final program
	var program = ''
	
	if (!state.errors.length)
		program = 'WIDTH=16;\r\n'+
			'DEPTH=512;\r\n\r\n'+
			'ADDRESS_RADIX=HEX;\r\n'+
			'DATA_RADIX=HEX;\r\n\r\n'+
			'CONTENT BEGIN\r\n'+
			state.memory.map(function (content, address) {
				return '\t'+toHex(address, 3)+'  :   '+content+';\r\n'
			}).join('')+
			'	['+toHex(state.memory.length, 3)+'..1FF]  :   0000;\r\n'+
			'END;\r\n'
	
	return {
		program: program,
		errors: state.errors
	}
}

// Process a single instruction
// line is a string, state is an object
// Throw in case of error
function process(line, state, lineNum) {
	var match
	
	// Label
	if ((match = line.match(/^([a-z_][a-z0-9_]*) ?: ?/))) {
		if (match[1] in state.labels)
			throw new Error('Label already in use: '+match[1])
		state.labels[match[1]] = state.pc
		line = line.substr(match[0].length)
	}
	
	if (!line)
		// Label-only line
		return
	
	if (!processBasic(line, state) &&
		!processStandard(line, state) &&
	  	!processComplex(line, state, lineNum))
		throw new Error('Invalid instruction format')
}

// Process basic instructions
// Return true in success, false if no rule matched
// Throw in case of error
function processBasic(line, state) {
	var match
	if (line.match(/^nop$/))
		// NOP
		state.store('0000')
	else if ((match = line.match(/^mvi ([0-7]) ?, ?(-?\d+|0b[01]+|0x[0-9a-f]+)$/))) {
		// MVI x, I
		state.store('080'+match[1])
		state.store(parseConstant(match[2]))
	} else if ((match = line.match(/^mov ([0-7]) ?, ?([0-7])$/)))
		// MOV x, y
		state.store('10'+match[1]+match[2])
	else if ((match = line.match(/^clrreg ([0-7])$/)))
		// CLRREG x
		state.store('180'+match[1])
	else if ((match = line.match(/^add ([0-7]) ?, ?([0-7])$/)))
		// ADD x, y
		state.store('20'+match[1]+match[2])
	else if ((match = line.match(/^sub ([0-7]) ?, ?([0-7])$/)))
		// SUB x, y
		state.store('28'+match[1]+match[2])
	else if ((match = line.match(/^load ([0-7]) ?, ?(-?\d+|0b[01]+|0x[0-9a-f]+)$/))) {
		// LOAD x, I
		state.store('300'+match[1])
		state.store(parseConstant(match[2]))
	} else if ((match = line.match(/^store ([0-7]) ?, ?(-?\d+|0b[01]+|0x[0-9a-f]+)$/))) {
		// STORE x, I
		state.store('380'+match[1])
		state.store(parseConstant(match[2]))
	} else if ((match = line.match(/^dataout ([0-7])$/)))
		// DATAOUT x
		state.store('800'+match[1])
	else if ((match = line.match(/^datain ([0-7])$/)))
		// DATAIN x
		state.store('880'+match[1])
	else if ((match = line.match(/^goto (-?\d+|0b[01]+|0x[0-9a-f]+)$/)))
		// GOTO I
		state.store('4'+parseAddress(match[1]))
	else
		return false
	return true
}

// Process standard custom instructions
// Return true in success, false if no rule matched
// Throw in case of error
function processStandard(line, state) {
	var match
	if ((match = line.match(/^mov \$([0-7]) ?, ?(-?\d+|0b[01]+|0x[0-9a-f]+)$/))) {
		// MOV $x, I
		match[2] = parseConstant(match[2])
		if (match[2] == '0000')
			state.store('180'+match[1])
		else {
			state.store('080'+match[1])
			state.store(match[2])
		}
	} else if ((match = line.match(/^mov \$([0-7]) ?, ?\$([0-7])$/)))
		// MOV $x, $y
		if (match[1] == match[2])
			state.store('0000')
		else
			state.store('10'+match[1]+match[2])
	else if ((match = line.match(/^clr \$([0-7])$/)))
		// CLR $x
		state.store('180'+match[1])
	else if ((match = line.match(/^add \$([0-7]) ?, ?\$([0-7])$/)))
		// ADD $x, $y
		state.store('20'+match[1]+match[2])
	else if ((match = line.match(/^sub \$([0-7]) ?, ?\$([0-7])$/)))
		// SUB $x, $y
		state.store('28'+match[1]+match[2])
	else if ((match = line.match(/^out \$([0-7])$/)))
		// OUT $x
		state.store('800'+match[1])
	else if ((match = line.match(/^in \$([0-7])$/)))
		// IN $x
		state.store('880'+match[1])
	else if ((match = line.match(/^load \$([0-7]) ?, ?(-?\d+|0b[01]+|0x[0-9a-f]+)$/))) {
		// LOAD $x, I
		state.store('300'+match[1])
		state.store(parseConstant(match[2]))
	} else if ((match = line.match(/^store \$([0-7]) ?, ?(-?\d+|0b[01]+|0x[0-9a-f]+)$/))) {
		// STORE $x, I
		state.store('380'+match[1])
		state.store(parseConstant(match[2]))
	} else
		return false
	return true
}

// Process complex custom instructions (pseudo-instructions)
// Return true in success, false if no rule matched
// Throw in case of error
function processComplex(line, state, lineNum) {
	var match
	if ((match = line.match(/^add \$([0-7]) ?, ?\$([0-7]) ?, ?\$([0-7])$/))) {
		// ADD $x, $y, $z
		if (match[1] != match[2])
			state.store('10'+match[1]+match[2])
		state.store('20'+match[1]+match[3])
	} else if ((match = line.match(/^sub \$([0-7]) ?, ?\$([0-7]) ?, ?\$([0-7])$/))) {
		// SUB $x, $y, $z
		if (match[1] != match[2])
			state.store('10'+match[1]+match[2])
		state.store('28'+match[1]+match[3])
	} else if ((match = line.match(/^jump ([a-z_][a-z0-9_]*)$/))) {
		// JUMP _label_
		state.jumps[state.pc] = {
			label: match[1],
			line: lineNum
		}
		state.store('????')
	} else
		return false
	return true
}

// Parse a numeric constant
// Syntax:
// Decimal like 10, -2: -?\d+
// Binary like 0b0101: 0b[01]+
// Hex like 0xab: 0x[0-9a-f]+
// Return the hex value as a 4-char string
// Throw in case of error
function parseConstant(value) {
	if (value.match(/^-?\d+$/))
		value = Number(value)
	else if (value.match(/^0b[01]+$/i))
		value = parseInt(value.substr(2), 2)
	else if (value.match(/^0x[0-9a-f]+$/i))
		value = parseInt(value.substr(2), 16)
	else
		throw new Error('Invalid constant value: '+value)
	
	if (value < -32768 || value > 65535)
		throw new Error('Integer value out of bounds: '+value)
	
	if (value < 0)
		value += 65536
	
	return toHex(value, 4)
}

// Parse a numeric constant that represents an ROM address
// Same behavior as parseConstant
function parseAddress(value) {
	value = parseConstant(value)
	if (value[0] != '0')
		throw new Error('Invalid value for an address: '+value)
	return value.substr(1)
}

// Convert a number to its len-char hex representation
function toHex(n, len) {
	var str = n.toString(16).toUpperCase()
	while (str.length < len)
		str = '0'+str
	return str
}
