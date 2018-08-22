
let fetchMethod = null
const ctx = {
    rootModule: null,
    module: null
}

const run = (rootModule, module, node) => {
    ctx.rootModule = rootModule
    ctx.module = module    
    return parseImports(node.body)
        .then(() => {
            ctx.rootModule = rootModule
            ctx.module = module
            parseBody(node.body)
        })
}

const parseImports = (nodes) => {
    const promises = []
    for(let n = 0; n < nodes.length; n++) {
        const node = nodes[n]
        if(node.type !== "ImportDeclaration") { break }
        promises.push(parseImportDeclaration(node))
    }
    return Promise.all(promises)
}

const parseBody = (nodes) => {
    for(let n = 0; n < nodes.length; n++) {
        const node = nodes[n]
        parse[node.type](node)
    }
}

const parseVariableDeclaration = (node) => {
    console.log(node)
}

const parseClassDeclaration = (node) => {
    console.log(node)
}

const parseExportDefaultDeclaration = (node) => {
    console.log(node)
}

const parseExportNamedDeclaration = (node) => {
    console.log(node)
}

const parseImportDeclaration = (node) => {
    return fetchMethod(ctx.module, node.source.value)
}

const parse = {
    Body: parseBody,
    VariableDeclaration: parseVariableDeclaration,
    ClassDeclaration: parseClassDeclaration,
    ExportDefaultDeclaration: parseExportDefaultDeclaration,
    ExportNamedDeclaration: parseExportNamedDeclaration,
    ImportDeclaration: (node) => {},
}

const setFetchMethod = (func) => {
    fetchMethod = func
}

export { run, setFetchMethod }