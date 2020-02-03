import path from "path"
import ModuleService from "../service/ModuleService.js"

let tabs = ""
let moduleCurrent = null

const run = (module) => {
	try {
		parseModule(module)
	}
	catch(error) {
		console.error(error.message)
		console.error(error.stack)
	}
}

const parseModule = (module) => {
	if(!module.data) {
		return ""
	}

	const modulePrev = moduleCurrent
	moduleCurrent = module

	const relativePath = path.relative(module.path, ModuleService.getBuildPath()) + path.normalize("/") + module.name

	module.output = `"use strict";\n\n`
	module.output += `((exports) => {\n\n`

	module.output += parseBody(module.data.body)

	module.output += `\n})(__modules[${module.index}] = {})\n\n`
	module.output += `//# sourceURL=${relativePath}`

	moduleCurrent = modulePrev
}

const parseBody = (buffer) => {
	if(buffer.length === 0) {
		return ""
	}

	let output = ""
	for(let n = 0; n < buffer.length; n++) {
		const node = buffer[n]
		const nodeOutput = parse[node.type](node)
		if(nodeOutput) {
			output += `${tabs}${nodeOutput}\n`
		}
	}
	return output	
}

const parseClassBody = (node) => {
	incTabs()
	let output = `{\n${parseBody(node.body)}`
	decTabs()
	output += `${tabs}}`
	return output  
}

const parseBlockStatement = (node) => {
	incTabs()
	const body = parseBody(node.body)
	decTabs()

	if(!body) {
		return "{}"
	}
	return `{\n${body}${tabs}}`
}

const parseExpressionStatement = (node) => {
	return parse[node.expression.type](node.expression)
}

const parseReturnStatement = (node) => {
	if(node.argument) {
		return `return ${parse[node.argument.type](node.argument)}`
	}
	return "return"
}

const parseContinueStatement = (node) => {
	return "continue"
}

const parseBreakStatement = (node) => {
	return "break"
}

const parseForStatement = (node) => {
	const init = parse[node.init.type](node.init)
	const test = parse[node.test.type](node.test)
	const update = parse[node.update.type](node.update)
	const body = parse[node.body.type](node.body)
	const output = `for(${init}; ${test}; ${update}) ${body}`
	return output
}

const parseForInStatement = (node) => {
	const left = parse[node.left.type](node.left)
	const right = parse[node.right.type](node.right)
	const body = parse[node.body.type](node.body)
	const output = `for(${left} in ${right}) ${body}`
	return output
}

const parseWhileStatement = (node) => {
	const test = parse[node.test.type](node.test)
	const body = parse[node.body.type](node.body)
	const output = `while(${test}) ${body}`
	return output
}

const parseWhileDoStatement = (node) => {
	const test = parse[node.test.type](node.test)
	const body = parse[node.body.type](node.body)
	const output = `do ${body}\n${tabs}while(${test})`
	return output
}

const parseIfStatement = (node) => {
	const test = parse[node.test.type](node.test)
	let output = `if(${test}) `
	output += parse[node.consequent.type](node.consequent)
	if(node.alternate) {
		output += `\n${tabs}else ${parse[node.alternate.type](node.alternate, false)}`
	}
	return output
}

const parseSwitchStatement = (node) => {
	incTabs()
	let outputCases = ""
	for(let n = 0; n < node.cases.length; n++) {
		outputCases += parseSwitchCase(node.cases[n])
	}
	decTabs()

	const discriminant = parse[node.discriminant.type](node.discriminant)
	const output = `switch(${discriminant}) {\n${outputCases}${tabs}}`
	return output
}

const parseSwitchCase = (node) => {
	const test = node.test ? `case ${parse[node.test.type](node.test)}:` : "default:"
	const body = parseBody(node.consequent)
	
	let output = `${tabs}${test}\n`
	if(body) {
		output += `${body}\n`
	}
	return output
}

const parseLabeledStatement = (node) => {
	const label = parse[node.label.type](node.label)
	const body = parse[node.body.type](node.body)
	const output = `${label}:\n${tabs}${body}`
	return output
}

const parseTryStatement = (node) => {
	const block = parse[node.block.type](node.block)
	const handler = parse[node.handler.type](node.handler)
	const output = `try ${block}\n${tabs}${handler}`
	return output
}

const parseArrayExpression = (node) => {
	const elements = node.elements
	if(elements.length === 0) {
		return `[]`
	}

	let element = elements[0]
	let output = `[ ${parse[element.type](element)}`
	for(let n = 1; n < elements.length; n++) {
		element = elements[n]
		output += `, ${parse[element.type](element)}`
	}
	output += " ]"
	return output
}

const parseVariableDeclaration = (node) => {
	let output = `${node.kind} `
	const decls = node.declarations
	for(let n = 0; n < decls.length; n++) {
		const nodeOutput = parseVariableDeclarator(decls[n])
		if(nodeOutput) {
			output += nodeOutput
		}
	}
	return output
}

const parseIdentifier = (node) => {
	return node.name
}

const parseLiteral = (node) => {
	return (node.value === null) ? "null" : node.raw
}

const parseTemplateLiteral = (node) => {
	const quasis = node.quasis
	if(quasis.length === 0) {
		return ""
	}

	let output = `"${quasis[0].value.cooked}"`
	for(let n = 1; n < quasis.length; n++) {
		const quasisNode = quasis[n]
		const expressionNode = node.expressions[n - 1]
		output += ` + ${parse[expressionNode.type](expressionNode)}`
		if(quasisNode.value.raw.length > 0) {
			output += ` + "${quasisNode.value.cooked}"`
		}
	}
	return output
}

const parseVariableDeclarator = (node) => {
	const id = parse[node.id.type](node.id)
	const init = node.init ? parse[node.init.type](node.init) : null
	const output = init ? `${id} = ${init}` : id
	return output
}

const parseAssignmentExpression = (node) => {
	const output = `${parse[node.left.type](node.left)} = ${parse[node.right.type](node.right)}`
	return output
}

const parseUnaryExpression = (node) => {
	const arg = parse[node.argument.type](node.argument)
	const space = (node.operator === "typeof") ? " " : ""
	const output = node.prefix ? `${node.operator}${space}${arg}` : `${arg}${node.operator}`
	return output
}

const parseBinaryExpression = (node) => {
	return `(${parse[node.left.type](node.left)} ${node.operator} ${parse[node.right.type](node.right)})` 
}

const parseLogicalExpression = (node) => {
	const output = `${parse[node.left.type](node.left)} ${node.operator} ${parse[node.right.type](node.right)}`
	return output
}

const parseConditionalExpression = (node) => {
	const alternate = parse[node.alternate.type](node.alternate)
	const consequent = parse[node.consequent.type](node.consequent)
	const test = parse[node.test.type](node.test)
	const output = `${test} ? ${consequent} : ${alternate}`
	return output
}

const parseMemberExpression = (node) => {
	const object = parse[node.object.type](node.object)
	const property = parse[node.property.type](node.property)

	if(node.computed) {
		const output = `${object}[${property}]`
		return output
	}
	const output = `${object}.${property}`
	return output
}

const parseCallExpression = (node) => {
	const params = parseArgs(node.arguments)
	const output = parse[node.callee.type](node.callee) + `(${params})`
	return output
}

const parseNewExpression = (node) => {
	const args = parseArgs(node.arguments)
	const output = `new ${parse[node.callee.type](node.callee)}(${args})`
	return output
}

const parseThisExpression = (node) => {
	return "this"
}

const parseUpdateExpression = (node) => {
	const arg = parse[node.argument.type](node.argument)
	const output = node.prefix ? `${node.operator}${arg}` : `${arg}${node.operator}`
	return output
}

const parseFunctionExpression = (node) => {
	const params = parseArgs(node.params)
	const body = parse[node.body.type](node.body)
	const output = `function(${params}) ${body}`
	return output
}

const parseArrowFunctionExpression = (node) => {
	const params = parseArgs(node.params)
	const body = parse[node.body.type](node.body)
	const output = `(${params}) => ${body}`
	if(node.async) {
		return `async ${output}`
	}
	return output
}

const parseObjectExpression = (node) => {
	if(node.properties.length === 0) {
		return "{}"
	}

	let output = "{\n"
	incTabs()

	output += `${tabs}${parseObjectProperty(node.properties[0])}`
	for(let n = 1; n < node.properties.length; n++) {
		const property = node.properties[n]
		output += `,\n${tabs}${parseObjectProperty(property)}`
	}
	decTabs()
	output += `\n${tabs}}`
	return output
}

const parseAwaitExpression = (node) => {
	const arg = parse[node.argument.type](node.argument)
	const output = `await ${arg}`
	return output
}

const parseObjectProperty = (node) => {
	const key = parse[node.key.type](node.key)
	const value = parse[node.value.type](node.value)
	const output = `${key}: ${value}`
	return output
}

const parseFunctionDeclaration = (node) => {
	const id = parse[node.id.type](node.id)
	const params = parseArgs(node.params)
	const body = parse[node.body.type](node.body)
	const output = `function ${id}(${params}) ${body}`
	return output
}

const parseClassDeclaration = (node) => {
	const body = parse[node.body.type](node.body)
	let output = `class ${node.id.name} `
	if(node.superClass) {
		output += `extends ${node.superClass.name} `
	}
	output += `${body}\n`
	return output
}

const parseSuper = (node) => {
	return "super"
}

const parseExportDefaultDeclaration = (node) => {
	const declaration = parse[node.declaration.type](node.declaration)
	const output = `exports.default = ${declaration}`
	return output
}

const parseExportNamedDeclaration = (node) => {
	if(node.declaration) {
		const declaration = parse[node.declaration.type](node.declaration)
		moduleCurrent.exported.push(declaration)
		return null
	}
	if(node.specifiers.length === 0) {
		return null
	}	

	let output = null

	if(node.source) {
		const moduleName = `__module${node.module.index}`
		const moduleOutput = `const ${moduleName} = __modules[${node.module.index}]\n`
	
		let specifierOutput = ""
		for(let n = 0; n < node.specifiers.length; n++) {
			const specifier = node.specifiers[n]
			specifierOutput += `const ${specifier.local.name} = ${moduleName}.${specifier.local.name}\n`
			specifierOutput += `exports.${specifier.exported.name} = ${specifier.local.name}`
		}

		output = `${moduleOutput}${specifierOutput}`

		parseModule(node.module)
	}
	else {
		let specifier = node.specifiers[0]
		let specifierOutput = `exports.${specifier.exported.name} = ${specifier.local.name}`
		for(let n = 1; n < node.specifiers.length; n++) {
			specifier = node.specifiers[n]
			specifierOutput += `\nexports.${specifier.exported.name} = ${specifier.local.name}`
		}
		output = specifierOutput
	}

	return output
}

const parseExportAllDeclaration = (node) => {
	parseModule(node.module)
	const output = `__exportAll(__modules[${node.module.index}], exports)`
	return output
}

const parseImportDeclaration = (node) => {
	if(node.specifiers.length === 0) {
		return null
	}

	const moduleName = `__module${node.module.index}`
	const moduleOutput = `const ${moduleName} = __modules[${node.module.index}]\n`

	let specifier = node.specifiers[0]
	let specifierOutput = null
	if(specifier.type === "ImportDefaultSpecifier") {
		specifierOutput = `const ${specifier.local.name} = ${moduleName}.default`
	}
	else if(specifier.type === "ImportNamespaceSpecifier") {
		specifierOutput = `const ${specifier.local.name} = __importAll(${moduleName})`
	}
	else {
		specifierOutput = `const ${specifier.local.name} = ${moduleName}.${specifier.local.name}`
	}
	for(let n = 1; n < node.specifiers.length; n++) {
		const specifier = node.specifiers[n]
		specifierOutput += `\nconst ${specifier.local.name} = ${moduleName}.${specifier.local.name}`
	}

	if(node.module && !node.module.output) {
		parseModule(node.module)
	}
	
	return `${moduleOutput}${specifierOutput}`
}

const parseAssignmentPattern = (node) => {
	const left = parse[node.left.type](node.left)
	const right = parse[node.right.type](node.right)
	const output = `${left} = ${right}`
	return output
}

const parseCatchClause = (node) => {
	const param = parse[node.param.type](node.param)
	const body = parse[node.body.type](node.body)
	const output = `catch(${param}) ${body}`
	return output
}

const parseMethodDefinition = (node) => {
	const key = parse[node.key.type](node.key)
	const value = parse[node.value.type](node.value)
	const output = `${key}${value}`
	if(node.value.async) {
		return `async ${output}`
	}
	return output
}

const parseSpecifiers = (specifiers) => {
    if(specifiers.length === 0) {
        return ""
	}
	
	let specifier = specifiers[0]
	const specifierOutput = parse[specifier.type](specifier)

    if(specifiers.length === 1) {
        if(specifier.type === "ImportDefaultSpecifier") {
            return specifierOutput
        }
        return `{ ${specifierOutput} }`
	}
	
    let output = `{ ${specifierOutput}`
    for(let n = 1; n < specifiers.length; n++) {
		specifier = specifiers[n]
        output += `, ${parse[specifier.type](specifier)}`
    }
    output += ` }`
    return output
}

const parseImportDefaultSpecifier = (node) => {
	return node.local.name
}

const parseImportSpecifier = (node) => {
	const imported = parse[node.imported.type](node.imported)
	const local = parse[node.local.type](node.local)
	return (imported === local) ? imported : `${local}: ${imported}`
}

const parseExportSpecifier = (node) => {
	const exported = parse[node.exported.type](node.exported)
	const local = parse[node.local.type](node.local)
	return (exported === local) ? exported : `${local}: ${exported}`
}

const parseArgs = (args) => {
	if(args.length === 0) {
		return ""
	}

	let output = parseArg(args[0])
	for(let n = 1; n < args.length; n++) {
		output += `, ${parseArg(args[n])}`
	}
	return output
}

const parseArg = (arg) => {
	return parse[arg.type](arg)
}

const incTabs = () => {
	tabs += "\t"
}

const decTabs = () => {
	tabs = tabs.slice(0, -1)
}

const parse = {
	Body: parseBody,
	ClassBody: parseClassBody,
	BlockStatement: parseBlockStatement,
	ReturnStatement: parseReturnStatement,
	ContinueStatement: parseContinueStatement,
	BreakStatement: parseBreakStatement,
	ForStatement: parseForStatement,
	ForInStatement: parseForInStatement,
	WhileStatement: parseWhileStatement,
	WhileDoStatement: parseWhileDoStatement,
	ExpressionStatement: parseExpressionStatement,
	IfStatement: parseIfStatement,
	SwitchStatement: parseSwitchStatement,
	LabeledStatement: parseLabeledStatement,
	TryStatement: parseTryStatement,
	ArrayExpression: parseArrayExpression,
	Identifier: parseIdentifier,
	Literal: parseLiteral,
	TemplateLiteral: parseTemplateLiteral,
	VariableDeclaration: parseVariableDeclaration,
	VariableDeclarator: parseVariableDeclarator,
	AssignmentExpression: parseAssignmentExpression,
	UnaryExpression: parseUnaryExpression,
	BinaryExpression: parseBinaryExpression,
	LogicalExpression: parseLogicalExpression,
	ConditionalExpression: parseConditionalExpression,
	MemberExpression: parseMemberExpression,
	CallExpression: parseCallExpression,
	NewExpression: parseNewExpression,
	ThisExpression: parseThisExpression,
	UpdateExpression: parseUpdateExpression,
	FunctionExpression: parseFunctionExpression,
	ArrowFunctionExpression: parseArrowFunctionExpression,
	ObjectExpression: parseObjectExpression,
	AwaitExpression: parseAwaitExpression,
	FunctionDeclaration: parseFunctionDeclaration,
	ClassDeclaration: parseClassDeclaration,
	Super: parseSuper,
	ExportDefaultDeclaration: parseExportDefaultDeclaration,
	ExportNamedDeclaration: parseExportNamedDeclaration,
	ExportAllDeclaration: parseExportAllDeclaration,
	ImportDeclaration: parseImportDeclaration,
	MethodDefinition: parseMethodDefinition,
	AssignmentPattern: parseAssignmentPattern,
	CatchClause: parseCatchClause,
	ImportDefaultSpecifier: parseImportDefaultSpecifier,
	ImportSpecifier: parseImportSpecifier,
	ExportSpecifier: parseExportSpecifier
}

export default {
	run, parseModule
}