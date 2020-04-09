import LoggerService from "./service/LoggerService.js"

class ReplicaError {
	constructor(type, message) {
		this.type = type
		this.message = message
	}

	printError() {
		LoggerService.logError(this.type, this.message)
	}
}

ReplicaError.typeMismatch = (expectedType, gotType) => {
    throw `TypeMismatch: Expected type "${expectedType.name}" but instead got "${gotType}"`
}

ReplicaError.reference = (name) => {
    throw `ReferenceError: ${name} is not defined`
}

ReplicaError.redefinition = (name) => {
    throw `RedefinitionError: ${name} cannot be redefined in this scope`
}

ReplicaError.unknownType = () => {
    throw `UnknownTypeError: Expression should return valid type`
}

ReplicaError.moduleNotFound = (path) => {
	return new ReplicaError('ModuleNotFound', path)
}

export default ReplicaError