
const escapeLiteral = (str) => {
	return str.replace(/\n/g, "\\n")
		.replace(/\t/g, "\\t")
		.replace(/\"/g, "\\\"") 
		.replace(/\'/g, "\\\"")    
}

export { escapeLiteral }