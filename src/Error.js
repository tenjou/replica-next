
const typeMismatch = (expectedType, gotType) => {
    throw `TypeMismatch: Expected type "${expectedType.name}" but instead got "${gotType}"`
}

export { typeMismatch }