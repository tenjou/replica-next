
class Scope {
    constructor(parent = null) {
        this.parent = parent
        this.vars = {}
        this.funcs = {}
        this.classes = {}
        this.returns = []
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
}

export default Scope