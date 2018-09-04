
const typeMismatch = (expectedType, gotType) => {
    throw `TypeMismatch: Expected type "${expectedType.name}" but instead got "${gotType}"`
}

const reference = (name) => {
    throw `ReferenceError: ${name} is not defined`
}

const redefinition = (name) => {
    throw `RedefinitionError: ${name} cannot be redefined in this scope`
}

export { typeMismatch, reference, redefinition }