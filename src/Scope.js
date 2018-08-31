
class Scope {
    constructor(parent = null) {
        this.parent = parent
        this.vars = {}
        this.funcs = []
        this.classes = {}
        this.returns = []
        this.root = false
    }

    createScope(root = false) {
        const scope = new Scope(this)
        scope.root = root
        return scope
    }

    getVar(name) {
        let scope = this
        while(scope) {
            const node = scope.vars[name]
            if(node) {
                return node
            }
            scope = scope.parent
        }
        return null
    }

    getRoot() {
        let scope = this
        while(scope) {
            if(scope.root) {
                return scope
            }
            scope = scope.parent
        }  
        return null
    }
}

export default Scope