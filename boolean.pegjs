// Boolean grammar

OrExpression
=
"record:" _ @([0-9]+ {return {record: parseInt(text())}})
/ head:AndExpression _ tail:("OR" _ @AndExpression)*
{
	//if(tail.length == 0) return head;
	return {any_of: [head, ...tail]}
}

AndExpression
= head:NotExpression _ tail:("AND"? _ @NotExpression)*
{return [head, ...tail]}

NotExpression
= "NOT" _ not:StarUnit {return {not}} 
/ FilterUnit

FilterUnit
= filter:(@Filter ":")? unit:StarUnit {
	return {
    	...unit,
        filter
    }
}


Filter
= "works"/"sources"/"annotation"/"author"/"citation"/"record"/"contributor"/"contributors"/"tags"/"tag"

StarUnit
= 
blurStart:"*"? term:Unit blurEnd:"*"? { return {blurStart, term, blurEnd}}
/ "(" _ @OrExpression _ ")"

Unit
= !("OR"/"AND"/"NOT"/"(") [^" *()\t]+ {return text()}
/ '"' literal:([^"()]+ {return text()}) '"' {return literal}
/ "'" literal:([^"()]+ {return text()})  {return literal}


_ "whitespace"
  = [ \t]*