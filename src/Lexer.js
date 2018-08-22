
let fetchMethod = null
const ctx = {
    rootModule: null,
    module: null
}

const run = (rootModule, module, node) => {
    ctx.rootModule = rootModule
    ctx.module = module
    parseBody(node.body)
}

const parseBody = (nodes) => {
    for(let n = 0; n < nodes.length; n++) {
        const node = nodes[n]
        parse[node.type](node)
    }
}

const parseVariableDeclaration = (node) => {

}

const parseImportDeclaration = (node) => {

}

const parse = {
    Body: parseBody,
    ImportDeclaration: parseImportDeclaration,
    ParseVariableDeclaration: parseVariableDeclaration
}

const setFetchMethod = (func) => {
    fetchMethod = func
}

export { run ,setFetchMethod }